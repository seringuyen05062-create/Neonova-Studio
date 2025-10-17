'use client';

import { useState, useCallback } from 'react';
import { VRM } from '@pixiv/three-vrm';
import { VRMLoader } from '@/lib/vrm-loader';

export function useVRM() {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVRM = useCallback(async (source: File | string) => {
    setIsLoading(true);
    setError(null);

    try {
      const loader = new VRMLoader();
      const loadedVRM = await loader.loadVRM(source);
      setVrm(loadedVRM);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load VRM';
      setError(errorMessage);
      console.error('Error loading VRM:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unloadVRM = useCallback(() => {
    if (vrm) {
      // Cleanup VRM resources
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
    }
    setVrm(null);
    setError(null);
  }, [vrm]);

  return {
    vrm,
    isLoading,
    error,
    loadVRM,
    unloadVRM,
  };
}
