"use client";
import * as THREE from "three";
import { useRef } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useTextBanner } from "@/lib/stores/textBanner";

export default function TextBanner3D() {
  const { text, color, size, z, y, visible, glow } = useTextBanner();
  const groupRef = useRef<THREE.Group>(null!);

  // Simple animation
  useFrame(({ clock }) => {
    if (!groupRef.current || !visible) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = y + Math.sin(t * 0.6) * 0.1;
  });

  if (!visible || !text.trim()) {
    return null;
  }

  return (
    <group ref={groupRef} position={[0, y, z]}>
      {/* Main Text */}
      <Text 
        fontSize={size}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {text.toUpperCase()}
      </Text>

      {/* Simple Glow Effect */}
      {glow && (
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[text.length * size * 0.8, size * 1.5]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}