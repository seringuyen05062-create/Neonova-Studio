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
      if (snapperRef.current) {
        // GroundSnapper cleanup
        snapperRef.current = null;
      }
      clockRef.current.stop();
    };
  }, [vrm]);

  useFrame((state, delta) => {
    if (vrm && snapperRef.current) {
      // Update VRM animation
      vrm.update(delta);
      
      // Update ground snapper để model luôn chạm đất
      snapperRef.current.update(delta);
      
      // Update parent component if needed
      onUpdate?.();
    }
  });

  if (!vrm) return null;

  return (
    <group ref={groupRef} />
  );
}

function CameraController() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>();

  useEffect(() => {
    // Configure camera cho VRM scene
    camera.position.set(0, 1.5, 2.5);
    camera.lookAt(0, 1.2, 0);
    if ('fov' in camera) {
      camera.fov = 50;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      target={[0, 1.2, 0]}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={1}
      maxDistance={10}
      minPolarAngle={0}
      maxPolarAngle={Math.PI}
    />
  );
}

function Lighting() {
  return (
    <>
      {/* Main directional light */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Fill light */}
      <directionalLight
        position={[-3, 5, -3]}
        intensity={0.4}
      />
      
      {/* Ambient light */}
      <ambientLight intensity={0.3} />
      
      {/* Point light for character highlight */}
      <pointLight
        position={[0, 3, 2]}
        intensity={0.5}
        distance={10}
        decay={2}
      />
    </>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#f0f0f0" />
    </mesh>
  );
}

// Scene component with confetti support
const Scene = forwardRef<SceneRef, SceneProps>(
  ({ vrm, onUpdate, aspectRatio, backgroundColor }, ref) => {
    const [confetti, setConfetti] = useState<CanvasConfetti | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Expose confetti method to parent
    useImperativeHandle(ref, () => ({
      triggerConfetti: () => {
        if (confetti) {
          confetti.fireBothSides();
        }
      }
    }));

    // Initialize confetti system
    const initConfetti = useCallback(() => {
      if (canvasRef.current && !confetti) {
        const newConfetti = new CanvasConfetti();
        setConfetti(newConfetti);
      }
    }, [confetti]);

    return (
      <div className="relative w-full h-full">
        {/* Three.js Canvas */}
        <Canvas
          shadows
          className="w-full h-full"
          camera={{ position: [0, 1.5, 2.5], fov: 50 }}
          style={{ background: backgroundColor || '#f5f5f5' }}
        >
          {/* Lighting setup */}
          <Lighting />
          
          {/* Background */}
          <StudioBackground />
          
          {/* Ground plane */}
          <Ground />
          
          {/* VRM Model */}
          {vrm && <VRMModel vrm={vrm} onUpdate={onUpdate} />}
          
          {/* Camera controls */}
          <CameraController />
        </Canvas>

        {/* Confetti Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            width: '100%',
            height: '100%',
          }}
          onLoad={initConfetti}
        />
      </div>
    );
  }
);

Scene.displayName = 'Scene';

export default Scene;
