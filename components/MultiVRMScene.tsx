'use client';

import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { StudioBackground } from './StudioBackground';
import { log } from '@/lib/utils/logger';

/**
 * Fit camera to bounding box
 */
function fitCameraToBox(camera: THREE.PerspectiveCamera, box: THREE.Box3, controls?: any) {
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = (camera.fov * Math.PI) / 180;
  let distance = (maxDim / 2) / Math.tan(fov / 2);
  distance *= 1.4; // padding

  const dir = new THREE.Vector3(0, 0, 1); // nhìn từ trước vào
  const newPos = center.clone().add(dir.multiplyScalar(distance));

  camera.position.copy(newPos);
  camera.near = Math.max(0.01, distance / 100);
  camera.far = distance * 100;
  camera.updateProjectionMatrix();

  console.log('[FIT-CAMERA] Fitted to box:', { center, size, distance, newPos });

  if (controls) {
    controls.target.copy(center);
    controls.update();
  }
}

/**
 * AutoFit component to fit camera after models are loaded
 * Now uses event-driven approach instead of delay
 */
function AutoFit({ controlsRef, allReadyInfo, expectedModelCount }: {
  controlsRef: React.MutableRefObject<any>;
  allReadyInfo: React.MutableRefObject<{center: THREE.Vector3; size: THREE.Vector3}[]>;
  expectedModelCount: number;
}) {
  const { camera } = useThree();
  
  useEffect(() => {
    // Wait for all models to report ready
    const checkAndFit = () => {
      const readyModels = allReadyInfo.current.filter(info => info !== undefined);
      
      if (readyModels.length === 0) {
        console.log('[AUTO-FIT] No models ready yet');
        return;
      }
      
      console.log('[AUTO-FIT] Fitting camera based on', readyModels.length, 'models');
      
      // Combine all bounding boxes
      const combinedBox = new THREE.Box3();
      readyModels.forEach(info => {
        const modelBox = new THREE.Box3();
        modelBox.setFromCenterAndSize(info.center, info.size);
        combinedBox.union(modelBox);
      });
      
      const size = combinedBox.getSize(new THREE.Vector3());
      const center = combinedBox.getCenter(new THREE.Vector3());
      
      console.log('[AUTO-FIT] Combined bbox:', {
        size: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) },
        center: { x: center.x.toFixed(2), y: center.y.toFixed(2), z: center.z.toFixed(2) }
      });
      
      // Calculate camera distance to fit all models
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      
      // Add padding for better framing (more for multiple models)
      cameraZ *= expectedModelCount >= 3 ? 1.8 : 1.5;
      
      (camera as THREE.PerspectiveCamera).position.set(0, center.y, cameraZ);
      
      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }
      
      console.log('[AUTO-FIT] Camera fitted at:', {
        position: camera.position,
        target: controlsRef.current?.target
      });
    };
    
    // Check immediately
    checkAndFit();
    
    // Also check after a short delay as backup (for any async operations)
    const backupTimer = setTimeout(checkAndFit, 200);
    
    return () => clearTimeout(backupTimer);
  }, [camera, controlsRef, allReadyInfo, expectedModelCount]);
  
  return null;
}

interface MultiVRMSceneProps {
  vrms: (VRM | null)[];
  showStudioBackground?: boolean;
  enableGroundSnapper?: boolean;
  onSceneReady?: () => void;
}

// Positioned for 3-character setup: main center, assistants left/right
const VRM_POSITIONS = [
  { x: 0, y: 0, z: 0 },     // Main character (center)
  { x: -0.6, y: 0, z: -0.5 },  // Assistant 1 (left, slightly back)
  { x: 0.6, y: 0, z: -0.5 },   // Assistant 2 (right, slightly back)
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
  // Calculate positions based on number of models - SPREAD THEM OUT MORE
  const positions = useMemo(() => {
    const validVrms = vrms.filter(Boolean);
    if (validVrms.length >= 3) return [[0,0,0], [-1.2,0,-0.8], [1.2,0,-0.8]];
    if (validVrms.length === 2) return [[-0.8,0,0], [0.8,0,0]];
    return [[0,0,0]];
  }, [vrms]);

  // FIXED: Don't use dynamic key - it causes Canvas to remount and lose state
  // const canvasKey = `multi-vrm-scene`;

  const allReadyInfo = useRef<{center: THREE.Vector3; size: THREE.Vector3}[]>([]);
  const onModelReady = useCallback((i: number) => (info: {center: THREE.Vector3; size: THREE.Vector3}) => {
    allReadyInfo.current[i] = info;
    console.log(`[MODEL-READY] Model ${i}:`, info);
  }, []);

  const controlsRef = useRef<any>(null);

  // Debug: Log props on every render
  console.log('MultiVRMScene rendering with props:', {
    vrmsCount: vrms.length,
    loadedVrms: vrms.map((vrm, index) => ({ index, loaded: !!vrm })),
    positions
  });

  useEffect(() => {
    const loadedCount = vrms.filter(vrm => vrm !== null).length;
    console.log('MultiVRMScene: VRMs loaded', {
      loadedCount,
      vrms: vrms.map((vrm, index) => ({
        index,
        loaded: vrm !== null,
        visible: vrm?.scene?.visible,
        position: vrm?.scene?.position,
        scale: vrm?.scene?.scale,
        children: vrm?.scene?.children?.length
      }))
    });
  }, [vrms]);

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 1.2, 4.5], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        shadows
        onCreated={({ camera, gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <color attach="background" args={['#9bd0e3']} />

        {/* Improved lighting setup for better VRM visibility */}
        <ambientLight intensity={1.2} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.8} />
        <hemisphereLight 
          args={['#ffffff', '#9bd0e3', 0.6]} 
          position={[0, 50, 0]}
        />
        <pointLight position={[0, 5, 5]} intensity={0.5} />

        {/* render models */}
        {vrms.map((vrm, i) => {
          if (!vrm) return null;

          const pos = positions[i] || [0, 0, 0];
          
          console.log(`[RENDER] VRM ${i}:`, {
            worldPos: pos,
            hasScene: !!vrm.scene,
            sceneId: vrm.scene?.uuid
          });

          return (
            <VRMModel
              key={`vrm-${i}-${vrm.scene?.uuid}`}
              vrm={vrm}
              position={pos as [number, number, number]}
              onReady={onModelReady(i)}
            />
          );
        })}

        {/* floor */}
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.001,0]} receiveShadow>
          <planeGeometry args={[100,100]} />
          <shadowMaterial opacity={0.25} transparent />
        </mesh>

        <OrbitControls 
          ref={controlsRef} 
          enablePan={false}
          minDistance={2}
          maxDistance={15}
          target={[0, 1.0, 0]}
          maxPolarAngle={Math.PI / 2}
        />
        {/* Auto-fit event-driven based on model ready callbacks */}
        <AutoFit 
          controlsRef={controlsRef} 
          allReadyInfo={allReadyInfo}
          expectedModelCount={vrms.filter(Boolean).length}
        />
      </Canvas>

      {/* Debug overlay showing model status */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs font-mono">
          <div>Models: {vrms.filter(vrm => vrm !== null).length}/{vrms.length}</div>
          {vrms.map((vrm, index) => (
            <div key={index} className={vrm ? 'text-green-400' : 'text-gray-500'}>
              {index === 0 ? 'Main' : `Assist${index}`}: {vrm ? '✓' : '✗'}
              {vrm && (
                <div className="text-xs text-gray-300 ml-2">
                  Pos: ({vrm.scene.position.x.toFixed(1)}, {vrm.scene.position.y.toFixed(1)}, {vrm.scene.position.z.toFixed(1)})
                  Scale: {vrm.scene.scale.x.toFixed(2)}
                  Visible: {vrm.scene.visible ? 'Yes' : 'No'}
                </div>
              )}
            </div>
          ))}
          <div className="mt-2 text-xs text-yellow-300">
            Camera: Auto-fit enabled
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Auto-fit VRM Model with proper positioning and scaling
 */
interface VRMModelProps {
  vrm: VRM;
  onReady?: (info: { center: THREE.Vector3; size: THREE.Vector3 }) => void;
  position?: [number, number, number];
}

function VRMModel({
  vrm,
  onReady,
  position = [0, 0, 0],
}: VRMModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const clockRef = useRef(new THREE.Clock());
  const setupIdRef = useRef<string>('');

  useEffect(() => {
    if (!vrm || !groupRef.current) return;

    // Create unique ID for this setup (vrm + position)
    const currentSetupId = `${vrm.scene.uuid}-${position.join(',')}`;
    
    // Skip if already setup with same vrm and position
    if (setupIdRef.current === currentSetupId) {
      console.log('[VRMModel] Already setup with same config, skipping');
      return;
    }

    console.log('[VRMModel] Setting up VRM scene at world position:', position);

    // Clear group first
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    // Add VRM scene to this group
    groupRef.current.add(vrm.scene);

    // CRITICAL: Ensure VRM has been rotated to face camera (VRM0 compatibility)
    // This should be done by VRMLoader but let's ensure it
    const needsRotation = vrm.meta?.metaVersion === '0';
    if (needsRotation) {
      console.log('[VRMModel] Applying VRM0 rotation fix');
      vrm.scene.rotation.y = Math.PI;
    }

    // Ensure VRM scene is visible and materials are correct
    vrm.scene.traverse((o: any) => {
      o.visible = true;
      o.frustumCulled = false;
      
      if (o.isMesh || o.isSkinnedMesh) {
        o.castShadow = true;
        o.receiveShadow = true; // Allow receiving shadows for better depth
        
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m: any) => {
            // Don't modify materials too much - VRMLoader already configured them
            // Just ensure visibility
            if (m.opacity === 0) m.opacity = 1;
            
            // VRM materials are already configured correctly by VRMLoader
            // Don't force transparency on all materials
            console.log('[VRMModel] Material:', {
              name: m.name,
              type: m.type,
              transparent: m.transparent,
              opacity: m.opacity,
              hasMap: !!m.map,
              hasColor: !!m.color
            });
          });
        }
      }
    });

    // SIMPLE FIT: Keep original scale, just position properly
    // Reset VRM scene to local origin (since group handles world position)
    vrm.scene.position.set(0, 0, 0);
    vrm.scene.scale.set(1, 1, 1);
    // Don't reset rotation if we applied VRM0 fix
    
    // Calculate bounding box
    const bbox = new THREE.Box3().setFromObject(vrm.scene);
    const size = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());

    console.log('[VRMModel] Bbox:', { 
      size: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) },
      center: { x: center.x.toFixed(2), y: center.y.toFixed(2), z: center.z.toFixed(2) }
    });

    // 1. Center horizontally (X and Z)
    vrm.scene.position.x = -center.x;
    vrm.scene.position.z = -center.z;

    // 2. Place feet on ground (Y=0)
    const minY = bbox.min.y;
    vrm.scene.position.y = -minY;

    console.log('[VRMModel] Setup complete:', {
      worldPos: position,
      localPos: {
        x: vrm.scene.position.x.toFixed(2),
        y: vrm.scene.position.y.toFixed(2),
        z: vrm.scene.position.z.toFixed(2)
      },
      rotation: vrm.scene.rotation.y.toFixed(2)
    });

    vrm.scene.visible = true;
    setupIdRef.current = currentSetupId;
    clockRef.current.start();

    // Calculate bbox and notify parent for camera fitting
    const finalBbox = new THREE.Box3().setFromObject(groupRef.current);
    const finalSize = finalBbox.getSize(new THREE.Vector3());
    const finalCenter = finalBbox.getCenter(new THREE.Vector3());
    
    if (onReady) {
      // Notify immediately when setup is done
      onReady({ center: finalCenter, size: finalSize });
      console.log('[VRMModel] Ready callback fired:', { center: finalCenter, size: finalSize });
    }

    return () => {
      setupIdRef.current = '';
      if (groupRef.current && vrm) {
        groupRef.current.remove(vrm.scene);
      }
    };
  }, [vrm, position, onReady]);

  // Update VRM animation
  useFrame(() => {
    if (vrm) {
      const dt = clockRef.current.getDelta();
      try {
        vrm.update(dt);
      } catch (e) {
        console.error('[VRMModel] Update error:', e);
      }
    }
  });

  if (!vrm) {
    return null;
  }

  console.log('[VRMModel] Rendering group at world position:', position);
  
  // Group handles the world position (formation position)
  // VRM scene is positioned relative to this group
  return <group ref={groupRef} position={position} />;
}