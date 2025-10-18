'use client';

import { useState, useCallback } from 'react';
import { VRM } from '@pixiv/three-vrm';
import { VRMLoader } from '@/lib/vrm-loader';
import { log } from '@/lib/utils/logger';

const MAX_VRM_COUNT = 3;

export interface MultiVRMState {
  vrms: (VRM | null)[];
  loadingStates: boolean[];
  errors: (string | null)[];
}

export function useMultiVRM() {
  const [vrms, setVrms] = useState<(VRM | null)[]>(Array(MAX_VRM_COUNT).fill(null));
  const [loadingStates, setLoadingStates] = useState<boolean[]>(Array(MAX_VRM_COUNT).fill(false));
  const [errors, setErrors] = useState<(string | null)[]>(Array(MAX_VRM_COUNT).fill(null));

  /**
   * Load VRM at specific index (0 = main, 1-2 = assistants)
   */
  const loadVRM = useCallback(async (index: number, source: File | string) => {
    if (index < 0 || index >= MAX_VRM_COUNT) {
      log.error('useMultiVRM', `Invalid VRM index: ${index}. Must be 0-${MAX_VRM_COUNT - 1}`);
      return;
    }

    log.info('useMultiVRM', `Loading VRM at index ${index}`, undefined, { 
      isMainModel: index === 0,
      source: typeof source === 'string' ? source : source.name
    });

    // Update loading state for this index
    setLoadingStates(prev => {
      const newStates = [...prev];
      newStates[index] = true;
      return newStates;
    });

    // Clear previous error
    setErrors(prev => {
      const newErrors = [...prev];
      newErrors[index] = null;
      return newErrors;
    });

    try {
      const loader = new VRMLoader();
      const loadedVRM = await loader.loadVRM(source);
      
      // Dispose previous VRM at this index if exists
      if (vrms[index]) {
        disposeVRM(vrms[index]!);
      }

      // Update VRM array
      setVrms(prev => {
        const newVrms = [...prev];
        newVrms[index] = loadedVRM;
        return newVrms;
      });

      log.info('useMultiVRM', `Successfully loaded VRM at index ${index}`, undefined, {
        modelLoaded: true,
        isMainModel: index === 0
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load VRM';
      
      setErrors(prev => {
        const newErrors = [...prev];
        newErrors[index] = errorMessage;
        return newErrors;
      });

      log.error('useMultiVRM', `Failed to load VRM at index ${index}`, err as Error);
    } finally {
      setLoadingStates(prev => {
        const newStates = [...prev];
        newStates[index] = false;
        return newStates;
      });
    }
  }, [vrms]);

  /**
   * Unload VRM at specific index
   */
  const unloadVRM = useCallback((index: number) => {
    if (index < 0 || index >= MAX_VRM_COUNT) {
      log.error('useMultiVRM', `Invalid VRM index: ${index}. Must be 0-${MAX_VRM_COUNT - 1}`);
      return;
    }

    const vrmToUnload = vrms[index];
    if (vrmToUnload) {
      disposeVRM(vrmToUnload);
      
      setVrms(prev => {
        const newVrms = [...prev];
        newVrms[index] = null;
        return newVrms;
      });

      setErrors(prev => {
        const newErrors = [...prev];
        newErrors[index] = null;
        return newErrors;
      });

      log.info('useMultiVRM', `Unloaded VRM at index ${index}`);
    }
  }, [vrms]);

  /**
   * Unload all VRM models
   */
  const unloadAllVRMs = useCallback(() => {
    vrms.forEach((vrm, index) => {
      if (vrm) {
        disposeVRM(vrm);
      }
    });

    setVrms(Array(MAX_VRM_COUNT).fill(null));
    setErrors(Array(MAX_VRM_COUNT).fill(null));
    setLoadingStates(Array(MAX_VRM_COUNT).fill(false));

    log.info('useMultiVRM', 'Unloaded all VRM models');
  }, [vrms]);

  /**
   * Get the main VRM model (index 0)
   */
  const getMainVRM = useCallback(() => {
    return vrms[0];
  }, [vrms]);

  /**
   * Get all loaded VRM models (excluding null entries)
   */
  const getLoadedVRMs = useCallback(() => {
    return vrms.filter((vrm): vrm is VRM => vrm !== null);
  }, [vrms]);

  /**
   * Check if any VRM is currently loading
   */
  const isAnyLoading = loadingStates.some(loading => loading);

  /**
   * Get count of loaded models
   */
  const loadedCount = vrms.filter(vrm => vrm !== null).length;

  return {
    // State
    vrms,
    loadingStates,
    errors,
    isAnyLoading,
    loadedCount,
    
    // Actions
    loadVRM,
    unloadVRM,
    unloadAllVRMs,
    
    // Getters
    getMainVRM,
    getLoadedVRMs,
    
    // Constants
    MAX_VRM_COUNT,
  };
}

/**
 * Dispose VRM resources properly
 */
function disposeVRM(vrm: VRM) {
  try {
    vrm.scene.traverse((object) => {
      if ('geometry' in object) {
        (object as any).geometry?.dispose();
      }
      if ('material' in object) {
        const material = (object as any).material;
        if (Array.isArray(material)) {
          material.forEach((m) => m?.dispose());
        } else {
          material?.dispose();
        }
      }
    });
    log.info('useMultiVRM', 'VRM resources disposed successfully');
  } catch (error) {
    log.error('useMultiVRM', 'Error disposing VRM resources', error as Error);
  }
}