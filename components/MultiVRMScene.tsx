'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { StudioBackground } from './StudioBackground';
import { log } from '@/lib/utils/logger';

interface MultiVRMSceneProps {
  vrms: (VRM | null)[];
  showStudioBackground?: boolean;
  enableGroundSnapper?: boolean;
  onSceneReady?: () => void;
}

// Positioned for 3-character setup: main center, assistants left/right
const VRM_POSITIONS = [
  { x: 0, y: 0, z: 0 },     // Main character (center)
  { x: -2, y: 0, z: 0.5 },  // Assistant 1 (left, slightly back)
  { x: 2, y: 0, z: 0.5 },   // Assistant 2 (right, slightly back)
];

const VRM_ROTATIONS = [
  { x: 0, y: 0, z: 0 },           // Main character (facing forward)
  { x: 0, y: Math.PI / 8, z: 0 }, // Assistant 1 (slightly angled toward center)
  { x: 0, y: -Math.PI / 8, z: 0 }, // Assistant 2 (slightly angled toward center)
];

export function MultiVRMScene({ 
  vrms, 
  showStudioBackground = true,
  enableGroundSnapper = true,
  onSceneReady 
}: MultiVRMSceneProps) {
  const sceneRef = useRef<any>();

  useEffect(() => {
    if (sceneRef.current && onSceneReady) {
      onSceneReady();
    }
  }, [onSceneReady]);

  useEffect(() => {
    const loadedCount = vrms.filter(vrm => vrm !== null).length;
    log.info('MultiVRMScene', `Rendering ${loadedCount} VRM models`, undefined, {
      positions: VRM_POSITIONS.slice(0, loadedCount),
      hasMainModel: vrms[0] !== null,
      assistantCount: vrms.slice(1).filter(vrm => vrm !== null).length
    });
  }, [vrms]);

  return (
    <div className="w-full h-full">
      <Canvas
        ref={sceneRef}
        camera={{ position: [0, 1.5, 5], fov: 30 }}
        gl={{ 
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true 
        }}
        shadows
      >
        {/* Lighting optimized for multiple characters */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[2, 5, 2]} 
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight 
          position={[-2, 3, 2]} 
          intensity={0.4}
        />

        {/* Studio Background */}
        {showStudioBackground && <StudioBackground />}

        {/* Ground plane for shadows and positioning reference */}
        {enableGroundSnapper && (
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, -0.01, 0]}
            receiveShadow
          >
            <planeGeometry args={[20, 20]} />
            <shadowMaterial opacity={0.2} />
          </mesh>
        )}

        {/* Render each VRM model at its designated position */}
        {vrms.map((vrm, index) => {
          if (!vrm) return null;

          const position = VRM_POSITIONS[index];
          const rotation = VRM_ROTATIONS[index];
          const isMainModel = index === 0;

          return (
            <group
              key={`vrm-${index}`}
              position={[position.x, position.y, position.z]}
              rotation={[rotation.x, rotation.y, rotation.z]}
            >
              <VRMModel
                vrm={vrm}
                isMainModel={isMainModel}
                modelIndex={index}
                enableGroundSnapper={enableGroundSnapper}
              />
            </group>
          );
        })}

        {/* Enhanced controls for multi-model viewing */}
        <OrbitControls
          target={[0, 1, 0]} // Focus between all models
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={15}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2} // Prevent going below ground
        />

        {/* Stage lighting for better visibility */}
        <Stage
          preset="rembrandt"
          intensity={0.3}
          environment="studio"
        />
      </Canvas>

      {/* Debug overlay showing model status */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs font-mono">
          <div>Models: {vrms.filter(vrm => vrm !== null).length}/3</div>
          {vrms.map((vrm, index) => (
            <div key={index} className={vrm ? 'text-green-400' : 'text-gray-500'}>
              {index === 0 ? 'Main' : `Assist${index}`}: {vrm ? '✓' : '✗'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual VRM Model component with positioning and role-specific features
 */
interface VRMModelProps {
  vrm: VRM;
  isMainModel: boolean;
  modelIndex: number;
  enableGroundSnapper: boolean;
}

function VRMModel({ vrm, isMainModel, modelIndex, enableGroundSnapper }: VRMModelProps) {
  const meshRef = useRef<any>();

  useEffect(() => {
    if (meshRef.current && enableGroundSnapper) {
      // Ground snapping logic - position model feet on ground
      const box = new THREE.Box3().setFromObject(vrm.scene);
      const yOffset = -box.min.y;
      vrm.scene.position.y = yOffset;
    }
  }, [vrm, enableGroundSnapper]);

  useEffect(() => {
    log.info('VRMModel', `Rendered ${isMainModel ? 'main' : 'assistant'} model`, undefined, {
      modelIndex,
      modelLoaded: true,
      hasExpressions: vrm.expressionManager ? true : false,
      position: vrm.scene.position
    });
  }, [vrm, isMainModel, modelIndex]);

  return (
    <primitive 
      ref={meshRef}
      object={vrm.scene} 
      castShadow={true}
      receiveShadow={true}
    />
  );
}