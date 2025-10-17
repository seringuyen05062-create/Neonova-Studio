'use client';

import { useState, useCallback } from 'react';
import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';
import { VRMALoader } from '@/lib/vrma-loader';

/**
 * Hook for managing VRMA animations with official @pixiv/three-vrm-animation
 */
export function useVRMA(vrm?: VRM | null) {
  const [animations, setAnimations] = useState<Map<string, THREE.AnimationClip[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load a single VRMA file
   */
  const loadVRMA = useCallback(async (source: File | string, name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const loader = new VRMALoader();
      const clips = await loader.loadVRMA(source, vrm || undefined);
      
      if (clips.length > 0) {
        setAnimations(prev => new Map(prev.set(name, clips)));
        console.log(`✓ Loaded VRMA: ${name} (${clips.length} clip(s))`);
      } else {
        console.warn(`⚠ VRMA loaded but no clips created: ${name} (VRM may be required)`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load VRMA';
      setError(errorMessage);
      console.error(`✗ Error loading VRMA ${name}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [vrm]);

  /**
   * Get animation clips by name
   */
  const getAnimation = useCallback((name: string): THREE.AnimationClip[] | undefined => {
    return animations.get(name);
  }, [animations]);

  /**
   * Remove animation from cache
   */
  const unloadVRMA = useCallback((name: string) => {
    setAnimations(prev => {
      const newMap = new Map(prev);
      newMap.delete(name);
      return newMap;
    });
  }, []);

  /**
   * Reload all VRMA files with VRM for proper retargeting
   * This uses the official createVRMAnimationClip API
   */
  const reloadAllWithVRM = useCallback(async (
    newVrm: VRM, 
    vrmaFiles: Array<{ name: string; path: string }>
  ) => {
    if (!newVrm) {
      console.error('VRM is required for VRMA retargeting');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading VRMA animations with official API...');
      
      const loader = new VRMALoader();
      const newAnimations = await loader.loadMultipleVRMA(vrmaFiles, newVrm);

      setAnimations(newAnimations);
      
      console.log(`✅ Successfully loaded ${newAnimations.size} VRMA animation(s)`);
      console.log('Animation names:', Array.from(newAnimations.keys()));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reload VRMA animations';
      setError(errorMessage);
      console.error('✗ Error reloading VRMA animations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    animations,
    isLoading,
    error,
    loadVRMA,
    getAnimation,
    unloadVRMA,
    reloadAllWithVRM,
  };
}
