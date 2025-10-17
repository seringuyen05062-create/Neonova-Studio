import * as THREE from 'three';
export function StudioBackground() {
  return (
    <mesh position={[0, 0, -10]} receiveShadow>
      <sphereGeometry args={[100, 32, 16]} />
      <meshBasicMaterial color='#87CEEB' side={THREE.BackSide} />
    </mesh>
  );
}
