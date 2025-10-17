'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';
import { StudioBackground } from './StudioBackground';
import { VRMCharacter } from '@/hooks/useMultipleVRM';

interface MultipleVRMSceneProps {
  characters: VRMCharacter[];
  onUpdate?: (deltaTime: number) => void;
  aspectRatio?: '16:9' | '9:16';
  backgroundColor?: string;
}

export interface MultipleVRMSceneRef {
  focusOnMain: () => void;
  focusOnAll: () => void;
  setSpotlights: (enabled: boolean) => void;
}

// Component để render một VRM character
function VRMCharacterMesh({ character }: { character: VRMCharacter }) {
  const meshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (meshRef.current && character.vrm) {
      // Clear previous VRM
      meshRef.current.clear();
      
      // Add new VRM
      const vrmScene = character.vrm.scene.clone();
      meshRef.current.add(vrmScene);
      
      // Set position based on character role and position
      meshRef.current.position.set(
        character.position.x,
        character.position.y,
        character.position.z
      );

      // Scale support characters slightly smaller
      if (character.role === 'support') {
        meshRef.current.scale.setScalar(0.9);
      }
    }
  }, [character.vrm, character.position]);

  // Update VRM animations
  useFrame((state, delta) => {
    if (character.vrm) {
      character.vrm.update(delta);
    }
  });

  if (!character.vrm) return null;

  return (
    <group ref={meshRef}>
      {/* Character spotlight */}
      {character.role === 'main' ? (
        <spotLight
          position={[0, 5, 2]}
          angle={0.3}
          penumbra={0.1}
          intensity={1.5}
          color="#ffffff"
          castShadow
        />
      ) : (
        <spotLight
          position={[character.position.x, 5, character.position.z + 2]}
          angle={0.2}
          penumbra={0.2}
          intensity={0.8}
          color="#ccccff"
        />
      )}
    </group>
  );
}

// Main scene component
function SceneContent({ 
  characters, 
  onUpdate, 
  backgroundColor 
}: Omit<MultipleVRMSceneProps, 'aspectRatio'>) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (onUpdate) {
      onUpdate(delta);
    }
  });

  return (
    <>
      {/* Background */}
      <StudioBackground color={backgroundColor} />

      {/* Ambient lighting */}
      <ambientLight intensity={0.4} />
      
      {/* Main directional light */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.8}
        color="#ffffff"
        castShadow
      />

      {/* Stage lighting */}
      <pointLight position={[0, 8, -3]} intensity={0.5} color="#ff6b9d" />
      <pointLight position={[-5, 6, -2]} intensity={0.3} color="#4facfe" />
      <pointLight position={[5, 6, -2]} intensity={0.3} color="#43e97b" />

      {/* Render all characters */}
      <group ref={groupRef}>
        {characters.map((character) => (
          <VRMCharacterMesh key={character.id} character={character} />
        ))}
      </group>

      {/* Stage floor effect */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          transparent 
          opacity={0.3} 
          roughness={0.8}
        />
      </mesh>
    </>
  );
}

const MultipleVRMScene = forwardRef<MultipleVRMSceneRef, MultipleVRMSceneProps>(
  ({ characters, onUpdate, aspectRatio = '16:9', backgroundColor = '#87CEEB' }, ref) => {
    const cameraRef = useRef<THREE.PerspectiveCamera>(null);
    const controlsRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      focusOnMain: () => {
        if (cameraRef.current && controlsRef.current) {
          // Focus on main character
          const mainChar = characters.find(c => c.role === 'main');
          if (mainChar) {
            controlsRef.current.target.set(0, 1.2, 0);
            cameraRef.current.position.set(0, 1.5, 3);
            controlsRef.current.update();
          }
        }
      },
      focusOnAll: () => {
        if (cameraRef.current && controlsRef.current) {
          // Wide shot to show all characters
          controlsRef.current.target.set(0, 1, -0.5);
          cameraRef.current.position.set(0, 2, 5);
          controlsRef.current.update();
        }
      },
      setSpotlights: (enabled: boolean) => {
        // Implementation for spotlight control
        console.log('Spotlights:', enabled);
      }
    }));

    return (
      <Canvas
        shadows
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'transparent'
        }}
      >
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          fov={50}
          position={[0, 1.5, 4]}
        />
        
        <OrbitControls
          ref={controlsRef}
          target={[0, 1, -0.5]}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={10}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
        />

        <SceneContent 
          characters={characters}
          onUpdate={onUpdate}
          backgroundColor={backgroundColor}
        />
      </Canvas>
    );
  }
);

MultipleVRMScene.displayName = 'MultipleVRMScene';

export default MultipleVRMScene;