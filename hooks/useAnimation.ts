'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { AnimationController } from '@/lib/animation-controller';
import { AnimationType } from '@/types';

// Support both legacy VRMA format and new universal format
export function useAnimation(
  vrm: VRM | null, 
  animations?: Map<string, THREE.AnimationClip[]> | Map<string, { clips: THREE.AnimationClip[], format: string }>
) {
  const [currentAnimation, setCurrentAnimation] = useState<AnimationType>('idle');
  const [isAnimating, setIsAnimating] = useState(false);
  const controllerRef = useRef<AnimationController | null>(null);

  // Initialize animation controller when VRM is loaded or animations change
  useEffect(() => {
    if (vrm) {
      if (controllerRef.current) {
        controllerRef.current.dispose();
      }

      // Convert animations to the new format if needed
      let processedAnimations: Map<string, { clips: THREE.AnimationClip[], format: string }> | undefined;
      
      if (animations) {
        // Check if it's the old format (Map<string, THREE.AnimationClip[]>)
        const firstEntry = animations.entries().next().value;
        if (firstEntry && Array.isArray(firstEntry[1])) {
          // Old format - convert to new format
          processedAnimations = new Map();
          (animations as Map<string, THREE.AnimationClip[]>).forEach((clips, name) => {
            processedAnimations!.set(name, { clips, format: 'vrma' });
          });
        } else {
          // New format - use as is
          processedAnimations = animations as Map<string, { clips: THREE.AnimationClip[], format: string }>;
        }
      }

      controllerRef.current = new AnimationController(vrm, processedAnimations);
      console.log('useAnimation: AnimationController initialized with animations');

      // ✅ RESTORE AUTO-PLAY như code cũ hoạt động mượt
      // Chỉ play khi có VRMA animations và model_pose available
      if (processedAnimations && processedAnimations.size > 0) {
        const modelPoseData = processedAnimations?.get('model_pose');
        if (modelPoseData && modelPoseData.clips[0]) {
          controllerRef.current.playAnimation('model_pose', modelPoseData.clips[0].duration);
          setCurrentAnimation('model_pose');
          console.log('useAnimation: Auto-played model_pose as before');
        }
      }
    } else {
      if (controllerRef.current) {
        controllerRef.current.dispose();
        controllerRef.current = null;
      }
    }

    return () => {
      if (controllerRef.current) {
        controllerRef.current.dispose();
      }
    };
  }, [vrm, animations]);

  const playAnimation = useCallback((type: AnimationType, duration: number = 1.0) => {
    if (!controllerRef.current) return;

    setIsAnimating(true);
    setCurrentAnimation(type);

    // Blend cảm xúc vào pose mẫu
    if (["happy", "sad", "surprised", "thinking", "neutral"].includes(type)) {
      // Chỉ blend morph target hoặc procedural animation lên mặt, đầu
      // Ví dụ: happy -> smile, sad -> mouth down, surprised -> open mouth, thinking -> blink slow
      // (Giả sử AnimationController đã hỗ trợ các hàm này)
      controllerRef.current.playEmotion(type, duration);
    } else {
      controllerRef.current.playAnimation(type, duration);
    }
  }, []);

  const stopAnimation = useCallback(() => {
    if (!controllerRef.current) return;

    controllerRef.current.stopAll();
    setIsAnimating(false);
    setCurrentAnimation('idle');
    controllerRef.current.playAnimation('idle');
  }, []);

  const update = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.update();
    }
  }, []);

  const pauseAutoFacialExpressions = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.pauseAutoFacialExpressions();
    }
  }, []);

  const resumeAutoFacialExpressions = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.resumeAutoFacialExpressions();
    }
  }, []);

  return {
    currentAnimation,
    isAnimating,
    playAnimation,
    stopAnimation,
    update,
    pauseAutoFacialExpressions,
    resumeAutoFacialExpressions,
  };
}
