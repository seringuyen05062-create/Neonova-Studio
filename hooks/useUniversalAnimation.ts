'use client';

import { useState, useCallback } from 'react';
import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';
import { UniversalAnimationManager } from '@/lib/universal-animation-manager';

/**
 * Enhanced hook for managing multiple animation formats
 */
export function useUniversalAnimation(vrm?: VRM | null) {
  const [animations, setAnimations] = useState<Map<string, { clips: THREE.AnimationClip[], format: string }>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const manager = new UniversalAnimationManager();

  /**
   * Load a single animation file (any supported format)
   */
  const loadAnimation = useCallback(async (source: File | string, name: string) => {
    if (!vrm) {
      console.error('VRM model is required for animation loading');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await manager.loadAnimation(source, vrm, name);
      
      if (result.clips.length > 0) {
        setAnimations(prev => new Map(prev.set(name, result)));
        console.log(`✓ Loaded ${result.format.toUpperCase()} animation: ${name} (${result.clips.length} clip(s))`);
      } else {
        console.warn(`⚠ Animation loaded but no clips created: ${name}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load animation';
      setError(errorMessage);
      console.error(`✗ Error loading animation ${name}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [vrm, manager]);

  /**
   * Load multiple animation files at once
   */
  const loadMultipleAnimations = useCallback(async (
    sources: Array<{ name: string; path: string | File }>
  ) => {
    if (!vrm) {
      console.error('VRM model is required for animation loading');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading multiple animations with Universal Manager...');
      
      const newAnimations = await manager.loadMultipleAnimations(sources, vrm);
      setAnimations(newAnimations);
      
      console.log(`✅ Successfully loaded ${newAnimations.size} animation(s)`);
      console.log('Animation details:');
      newAnimations.forEach((value, key) => {
        console.log(`  - ${key}: ${value.format.toUpperCase()} (${value.clips.length} clips)`);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load animations';
      setError(errorMessage);
      console.error('✗ Error loading animations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [vrm, manager]);

  /**
   * Get animation clips by name
   */
  const getAnimation = useCallback((name: string): THREE.AnimationClip[] | undefined => {
    return animations.get(name)?.clips;
  }, [animations]);

  /**
   * Get animation info (clips + format)
   */
  const getAnimationInfo = useCallback((name: string): { clips: THREE.AnimationClip[], format: string } | undefined => {
    return animations.get(name);
  }, [animations]);

  /**
   * Remove animation from cache
   */
  const unloadAnimation = useCallback((name: string) => {
    setAnimations(prev => {
      const newMap = new Map(prev);
      newMap.delete(name);
      return newMap;
    });
  }, []);

  /**
   * Clear all animations
   */
  const clearAnimations = useCallback(() => {
    setAnimations(new Map());
  }, []);

  /**
   * Get supported formats
   */
  const getSupportedFormats = useCallback(() => {
    return UniversalAnimationManager.getSupportedFormats();
  }, []);

  /**
   * Validate animation file
   */
  const isValidAnimationFile = useCallback((file: File) => {
    return UniversalAnimationManager.isValidAnimationFile(file);
  }, []);

  return {
    animations,
    isLoading,
    error,
    loadAnimation,
    loadMultipleAnimations,
    getAnimation,
    getAnimationInfo,
    unloadAnimation,
    clearAnimations,
    getSupportedFormats,
    isValidAnimationFile,
    
    // Legacy compatibility with useVRMA
    loadVRMA: loadAnimation,
    reloadAllWithVRM: loadMultipleAnimations,
  };
}