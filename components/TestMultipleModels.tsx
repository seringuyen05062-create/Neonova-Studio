'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

// Test component đơn giản với multiple boxes để verify khả năng render multiple objects
export default function TestMultipleModels() {
  return (
    <div className="w-full h-96 bg-gray-900 rounded-lg">
      <Canvas
        camera={{ position: [0, 2, 5], fov: 45 }}
        gl={{ antialias: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        
        {/* Multiple Test Objects */}
        {/* Main Object (center) */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ff6b6b" />
        </mesh>
        
        {/* Extra Objects (sides) */}
        <mesh position={[-2.5, 0, -1.5]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#4ecdc4" />
        </mesh>
        
        <mesh position={[2.5, 0, -1.5]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#45b7d1" />
        </mesh>
        
        {/* Additional objects để test performance */}
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={i} position={[Math.sin(i) * 3, 0.5, Math.cos(i) * 3]}>
            <sphereGeometry args={[0.3]} />
            <meshStandardMaterial color={`hsl(${i * 60}, 70%, 50%)`} />
          </mesh>
        ))}
        
        {/* Ground */}
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#2c2c2c" />
        </mesh>
        
        <OrbitControls />
      </Canvas>
    </div>
  );
}