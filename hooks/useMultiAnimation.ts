'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { VRM } from '@pixiv/three-vrm';
import { AnimationController } from '@/lib/animation-controller';
import { LipSyncController } from '@/lib/lip-sync';
import { log } from '@/lib/utils/logger';

export interface MultiAnimationState {
  animationControllers: (AnimationController | null)[];
  lipSyncController: LipSyncController | null;
  isPlayingAnimation: boolean[];
  currentAnimations: (string | null)[];
}

export function useMultiAnimation(vrms: (VRM | null)[]) {
  const [animationControllers, setAnimationControllers] = useState<(AnimationController | null)[]>([]);
  const [lipSyncController, setLipSyncController] = useState<LipSyncController | null>(null);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState<boolean[]>([]);
  const [currentAnimations, setCurrentAnimations] = useState<(string | null)[]>([]);
  
  const frameId = useRef<number>();

  // Initialize controllers when VRMs change
  useEffect(() => {
    const controllers: (AnimationController | null)[] = [];
    const playingStates: boolean[] = [];
    const animations: (string | null)[] = [];

    vrms.forEach((vrm, index) => {
      if (vrm) {
        try {
          const controller = new AnimationController(vrm);
          controllers.push(controller);
          log.info('useMultiAnimation', `Initialized AnimationController for model ${index}`, undefined, {
            isMainModel: index === 0,
            hasExpressions: vrm.expressionManager ? true : false
          });
        } catch (error) {
          log.error('useMultiAnimation', `Failed to initialize AnimationController for model ${index}`, error as Error);
          controllers.push(null);
        }
      } else {
        controllers.push(null);
      }
      
      playingStates.push(false);
      animations.push(null);
    });

    setAnimationControllers(controllers);
    setIsPlayingAnimation(playingStates);
    setCurrentAnimations(animations);

    // Initialize lip sync for main model (index 0) only
    const mainVRM = vrms[0];
    if (mainVRM && mainVRM.expressionManager) {
      try {
        const lipSync = new LipSyncController(mainVRM);
        setLipSyncController(lipSync);
        log.info('useMultiAnimation', 'Initialized LipSyncController for main model');
      } catch (error) {
        log.error('useMultiAnimation', 'Failed to initialize LipSyncController', error as Error);
        setLipSyncController(null);
      }
    } else {
      setLipSyncController(null);
    }

    return () => {
      // Cleanup existing controllers
      controllers.forEach((controller, index) => {
        if (controller) {
          try {
            controller.dispose();
            log.info('useMultiAnimation', `Disposed AnimationController for model ${index}`);
          } catch (error) {
            log.error('useMultiAnimation', `Error disposing AnimationController for model ${index}`, error as Error);
          }
        }
      });
    };
  }, [vrms]);

  // Animation loop
  useEffect(() => {
    const updateAnimation = () => {
      try {
        // Update all animation controllers
        animationControllers.forEach((controller, index) => {
          if (controller && vrms[index]) {
            controller.update();
          }
        });

        frameId.current = requestAnimationFrame(updateAnimation);
      } catch (error) {
        log.error('useMultiAnimation', 'Error in animation loop', error as Error);
      }
    };

    frameId.current = requestAnimationFrame(updateAnimation);

    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, [animationControllers, lipSyncController, vrms]);

  /**
   * Play animation on specific model or all models
   */
  const playAnimation = useCallback(async (
    animationType: 'greeting' | 'spin' | 'thinking' | 'peace_sign' | 'model_pose' | 'squat' | 'shoot' | 'dance', 
    options: {
      modelIndex?: number; // If undefined, plays on all models
      duration?: number;
    } = {}
  ) => {
    const { modelIndex, duration = 3000 } = options;

    log.info('useMultiAnimation', 'Playing animation', undefined, {
      animationType,
      targetModel: modelIndex !== undefined ? modelIndex : 'all',
      duration
    });

    const controllersToPlay = modelIndex !== undefined 
      ? [{ controller: animationControllers[modelIndex], index: modelIndex }]
      : animationControllers.map((controller, index) => ({ controller, index }));

    const promises = controllersToPlay.map(async ({ controller, index }) => {
      if (controller && vrms[index]) {
        try {
          await controller.playAnimation(animationType, duration);
          
          setIsPlayingAnimation(prev => {
            const newStates = [...prev];
            newStates[index] = true;
            return newStates;
          });

          setCurrentAnimations(prev => {
            const newAnims = [...prev];
            newAnims[index] = animationType;
            return newAnims;
          });

          log.info('useMultiAnimation', `Animation started on model ${index}`, undefined, {
            animationType,
            isMainModel: index === 0
          });
        } catch (error) {
          log.error('useMultiAnimation', `Failed to play animation on model ${index}`, error as Error);
        }
      }
    });

    await Promise.all(promises);
  }, [animationControllers, vrms]);

  /**
   * Stop animation on specific model or all models
   */
  const stopAnimation = useCallback(async (options: { modelIndex?: number } = {}) => {
    const { modelIndex } = options;

    const controllersToStop = modelIndex !== undefined
      ? [{ controller: animationControllers[modelIndex], index: modelIndex }]
      : animationControllers.map((controller, index) => ({ controller, index }));

    const promises = controllersToStop.map(async ({ controller, index }) => {
      if (controller) {
        try {
          controller.stopAnimation();
          
          setIsPlayingAnimation(prev => {
            const newStates = [...prev];
            newStates[index] = false;
            return newStates;
          });

          setCurrentAnimations(prev => {
            const newAnims = [...prev];
            newAnims[index] = null;
            return newAnims;
          });

          log.info('useMultiAnimation', `Animation stopped on model ${index}`);
        } catch (error) {
          log.error('useMultiAnimation', `Failed to stop animation on model ${index}`, error as Error);
        }
      }
    });

    await Promise.all(promises);
  }, [animationControllers]);

  /**
   * Play emotion on specific model or all models
   */
  const playEmotion = useCallback(async (
    emotionName: string,
    options: {
      modelIndex?: number;
      duration?: number;
    } = {}
  ) => {
    const { modelIndex, duration = 2000 } = options;

    const controllersToUse = modelIndex !== undefined
      ? [{ controller: animationControllers[modelIndex], index: modelIndex }]
      : animationControllers.map((controller, index) => ({ controller, index }));

    const promises = controllersToUse.map(async ({ controller, index }) => {
      if (controller) {
        try {
          controller.playEmotion(emotionName, duration);
          log.info('useMultiAnimation', `Emotion played on model ${index}`, undefined, {
            emotionName,
            duration
          });
        } catch (error) {
          log.error('useMultiAnimation', `Failed to play emotion on model ${index}`, error as Error);
        }
      }
    });

    await Promise.all(promises);
  }, [animationControllers]);

  /**
   * Start lip sync for main model (requires LipSyncData and audio)
   */
  const startLipSync = useCallback(async (lipSyncData: any, audioElement: HTMLAudioElement) => {
    if (!lipSyncController) {
      log.warn('useMultiAnimation', 'LipSyncController not available for main model');
      return;
    }

    try {
      await lipSyncController.startLipSync(lipSyncData, audioElement);
      log.info('useMultiAnimation', 'Lip sync started for main model', undefined, {
        duration: lipSyncData.duration,
        phonemeCount: lipSyncData.phonemes?.length || 0
      });
    } catch (error) {
      log.error('useMultiAnimation', 'Failed to start lip sync', error as Error);
    }
  }, [lipSyncController]);

  /**
   * Stop lip sync for main model
   */
  const stopLipSync = useCallback(() => {
    if (lipSyncController) {
      try {
        lipSyncController.stopLipSync();
        log.info('useMultiAnimation', 'Lip sync stopped for main model');
      } catch (error) {
        log.error('useMultiAnimation', 'Error stopping lip sync', error as Error);
      }
    }
  }, [lipSyncController]);

  /**
   * Check if any model is currently animating
   */
  const isAnyAnimating = isPlayingAnimation.some(playing => playing);

  /**
   * Get animation status for specific model
   */
  const getModelAnimationStatus = useCallback((modelIndex: number) => {
    return {
      isPlaying: isPlayingAnimation[modelIndex] || false,
      currentAnimation: currentAnimations[modelIndex],
      hasController: animationControllers[modelIndex] !== null
    };
  }, [isPlayingAnimation, currentAnimations, animationControllers]);

  return {
    // State
    animationControllers,
    lipSyncController,
    isPlayingAnimation,
    currentAnimations,
    isAnyAnimating,
    
    // Actions
    playAnimation,
    stopAnimation,
    playEmotion,
    startLipSync,
    stopLipSync,
    
    // Getters
    getModelAnimationStatus,
  };
}