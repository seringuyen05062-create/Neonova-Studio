'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { GroundSnapper } from '@/lib/ground-snapper';
import { CanvasConfetti } from '@/lib/confetti-canvas';
import { StudioBackground } from './StudioBackground';

interface SceneProps {
  vrm: VRM | null;
  onUpdate?: () => void;
  aspectRatio: '9:16' | '16:9';
  backgroundColor?: string;
}

// Export methods cho parent component
export interface SceneRef {
  triggerConfetti: () => void;
}

function VRMModel({ vrm, onUpdate }: { vrm: VRM; onUpdate?: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const snapperRef = useRef<GroundSnapper | null>(null);
  const clockRef = useRef(new THREE.Clock());

  useEffect(() => {
    if (groupRef.current && vrm) {
      // Clear previous children
      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }
      // Add VRM scene
      groupRef.current.add(vrm.scene);
      
      // Enable shadows for all meshes in VRM
      vrm.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = false; // Model không nhận bóng từ chính nó
        }
      });

      // Khởi tạo GroundSnapper với groundY = 0 (vị trí sàn)
      snapperRef.current = new GroundSnapper(vrm, 0);
      clockRef.current.start();
    }

    return () => {
      snapperRef.current = null;
    };
  }, [vrm]);

  // Update VRM và GroundSnapper trên mỗi frame
  useFrame(() => {
    // Kiểm tra VRM có tồn tại và chưa bị dispose
    if (!vrm || !vrm.scene || !snapperRef.current) {
      return;
    }
    
    try {
      const delta = clockRef.current.getDelta();
      
      // Update VRM (bao gồm animation mixer nếu có)
      vrm.update(delta);
      
      // Update GroundSnapper SAU khi update animation
      snapperRef.current.update(delta);
      
      // Callback cho parent component
      onUpdate?.();
    } catch (error) {
      console.error('[VRMModel] Error in useFrame update:', error);
    }
  });

  return <group ref={groupRef} />;
}

// Sàn với shadow receiver đơn giản - chỉ 1 bóng
function GroundPlane({ backgroundColor }: { backgroundColor?: string }) {
  return (
    <mesh 
      receiveShadow 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.001, 0]}
    >
      <planeGeometry args={[100, 100]} />
      <shadowMaterial 
        opacity={0.25} 
        transparent 
        color={backgroundColor === '#ffffff' ? '#000000' : '#333333'}
      />
    </mesh>
  );
}

const Scene = forwardRef<SceneRef, SceneProps>(({ vrm, onUpdate, aspectRatio, backgroundColor }, ref) => {
  const confettiRef = useRef<CanvasConfetti>(new CanvasConfetti());

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      confettiRef.current.dispose();
    };
  }, []);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    triggerConfetti: () => {
      console.log('[Scene] triggerConfetti called!');
      console.log('[Scene] confettiRef.current:', confettiRef.current);
      // Gọi async method
      confettiRef.current.fireBothSides().catch(err => {
        console.error('[Scene] Error firing confetti:', err);
      });
    },
  }));

  return (
    <div className="w-full h-full canvas-container">
      <Canvas
        camera={
          aspectRatio === '9:16'
            ? { position: [0, 1.4, 2.5], fov: 25 }
            : { position: [0, 1.2, 2], fov: 35 }
        }
        gl={{ 
          antialias: true, 
          alpha: false,  // Disable alpha để có background solid
        }}
        shadows // Enable shadows globally
      >
        {/* Lighting với shadow */}
        <ambientLight intensity={0.6} />
        
        {/* Directional light chính với shadow map được mở rộng để bao phủ mọi góc camera */}
        <directionalLight
          position={[8, 15, 8]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={100}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
          shadow-camera-near={0.1}
          shadow-bias={-0.0001}
        />
        
        {/* Directional light phụ - KHÔNG có shadow để tránh bóng đôi */}
        <directionalLight
          position={[-8, 12, -8]}
          intensity={0.8}
          castShadow={false}
        />
        
        {/* Thêm ánh sáng phụ để model sáng đều */}
        <pointLight position={[-5, 5, -5]} intensity={0.4} />
        <pointLight position={[5, 3, -3]} intensity={0.3} />
        
        {/* Studio Background - contained within canvas */}
        <StudioBackground color={backgroundColor} />
        
        {/* Sàn nhận bóng - tương thích với màu nền */}
        <GroundPlane backgroundColor={backgroundColor} />
        
        {/* VRM Model - cast shadow */}
        {vrm && <VRMModel vrm={vrm} onUpdate={onUpdate} />}
        
        {/* Camera Controls với phạm vi mở rộng */}
        <OrbitControls
          target={aspectRatio === '9:16' ? [0, 1.4, 0] : [0, 1.2, 0]}
          enablePan={false}
          enableZoom={true}
          minDistance={1}
          maxDistance={8}
          minPolarAngle={Math.PI / 6}  // 30 độ (cao hơn một chút)
          maxPolarAngle={Math.PI / 2.2}  // ~82 độ (gần ngang nhưng không hoàn toàn)
        />
      </Canvas>
    </div>
  );
});

Scene.displayName = 'Scene';

export default Scene;
