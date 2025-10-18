import * as THREE from 'three';
import { VRM, VRMExpressionPresetName } from '@pixiv/three-vrm';
import { AnimationType } from '@/types';
import { AnimationPlayer } from './animation/animationPlayer';
import { FacialExpressionManager } from './animation/facialExpressionManager';
import { IdleScheduler } from './animation/idleScheduler';
import { log } from './utils/logger';

/**
 * AnimationController - Refactored with Modular Architecture
 * 
 * This class has been refactored to use modular components:
 * - AnimationPlayer: Handles VRMA and procedural animations
 * - FacialExpressionManager: Manages facial expressions and blinking
 * - IdleScheduler: Handles idle animation sequences
 */
export class AnimationController {
  private vrm: VRM;
  
  // Modular components
  private animationPlayer: AnimationPlayer;
  private facialManager: FacialExpressionManager;
  private idleScheduler: IdleScheduler;
  
  // Main animation system
  private mixer: THREE.AnimationMixer;
  private clock: THREE.Clock;
  
  // Legacy support properties
  private vrmaClips: Map<string, THREE.AnimationClip[]> = new Map();
  private allAnimations: Map<string, { clips: THREE.AnimationClip[], format: string }> = new Map();

  constructor(vrm: VRM, animations?: Map<string, { clips: THREE.AnimationClip[], format: string }>) {
    try {
      this.vrm = vrm;
      
      // Initialize main mixer and clock
      this.mixer = new THREE.AnimationMixer(vrm.scene);
      this.clock = new THREE.Clock();
      
      // Initialize modular components
      this.animationPlayer = new AnimationPlayer(vrm);
      this.facialManager = new FacialExpressionManager(vrm);
      this.idleScheduler = new IdleScheduler(this.animationPlayer, new Map());
      
      // Load animations if provided (backward compatibility)
      if (animations) {
        this.allAnimations = animations;
        
        // Extract VRMA clips for backward compatibility
        animations.forEach((animData, name) => {
          if (animData.format === 'vrma') {
            this.vrmaClips.set(name, animData.clips);
            // Load into animation player
            this.animationPlayer.loadVRMAClips(name, animData.clips);
          }
        });
        
        // Update idle scheduler with VRMA clips
        this.idleScheduler = new IdleScheduler(this.animationPlayer, this.vrmaClips);
        
        log.info('AnimationController', 'Loaded animations', undefined, {
          count: animations.size,
          types: Array.from(animations.entries()).map(([name, data]) => `${name} (${data.format})`)
        });
      }
      
      // Start modular systems
      this.facialManager.start();
      
      log.info('AnimationController', 'Successfully initialized with modular architecture');
    } catch (error) {
      log.error('AnimationController', 'Failed to initialize', error as Error);
      throw error;
    }
  }

  /**
   * Play animation by type with universal format support
   */
  playAnimation(type: AnimationType, duration: number = 1.0) {
    try {
      log.info('AnimationController', `Playing animation: ${type}`, undefined, { duration });
      
      // Try modular animation player first
      if (this.animationPlayer.playAnimation(type, duration)) {
        // Stop idle animations when playing specific animations
        if (type === 'model_pose') {
          this.idleScheduler.stop();
        }
        return;
      }
      
      // Try legacy VRMA animations for backward compatibility
      const vrmaName = this.getVRMAName(type);
      if (vrmaName && this.playVRMAAnimation(vrmaName, duration)) {
        if (vrmaName === 'model_pose') {
          this.idleScheduler.stop();
        }
        return;
      }

      // Dance animations only work with VRMA files
      if (type === 'dance') {
        log.warn('AnimationController', 'Dance animation requires VRMA file');
        return;
      }

      // Fallback to procedural animations
      log.info('AnimationController', `Playing procedural animation: ${type}`);
      this.playProceduralAnimation(type, duration);
      
    } catch (error) {
      log.error('AnimationController', `Failed to play animation: ${type}`, error as Error);
    }
  }

  /**
   * Play procedural animation for fallback cases
   */
  private playProceduralAnimation(type: AnimationType, duration: number) {
    switch (type) {
      case 'greeting':
        this.playGreetingAnimation(duration);
        break;
      case 'spin':
        this.playSpinAnimation(duration);
        break;
      case 'thinking':
        this.playThinkingAnimation(duration);
        break;
      case 'peace_sign':
        this.playPeaceSignAnimation(duration);
        break;
      case 'model_pose':
        this.playModelPoseAnimation(duration);
        break;
      case 'squat':
        this.playSquatAnimation(duration);
        break;
      case 'shoot':
        this.playShootAnimation(duration);
        break;
      default:
        log.warn('AnimationController', `Unknown procedural animation type: ${type}`);
    }
  }

  /**
   * Get VRMA animation name from type
   */
  private getVRMAName(type: AnimationType): string | null {
    const vrmaMapping: Record<string, string> = {
      'dance': 'nhảy_nhót',
      'model_pose': 'VRMA_06 Tư thế mẫu',
      'greeting': 'VRMA_02 Chào hỏi',
      'peace_sign': 'VRMA_03 Ký hiệu hòa bình',
      'shoot': 'VRMA_04 Bắn',
      'squat': 'VRMA_07 Tập squat',
      'spin': 'VRMA_05 Xoay',
      'thinking': 'VRMA_01 Hiển thị toàn thân'
    };
    
    return vrmaMapping[type] || null;
  }

  /**
   * Play VRMA animation by name
   */
  private playVRMAAnimation(vrmaName: string, duration: number): boolean {
    const clips = this.vrmaClips.get(vrmaName);
    if (!clips || clips.length === 0) {
      log.warn('AnimationController', `VRMA animation not found: ${vrmaName}`);
      return false;
    }

    return this.animationPlayer.playAnimation(vrmaName, duration);
  }

  /**
   * Update animation mixer - refactored with modular components
   */
  update() {
    try {
      // Update main body animations
      const delta = this.clock.getDelta();
      this.mixer.update(delta);
      
      // Update modular components
      this.facialManager.update();
      this.animationPlayer.update();
      
      // Ensure VRM expressions are applied
      if (this.vrm.expressionManager) {
        this.vrm.expressionManager.update();
      }
      
    } catch (error) {
      log.error('AnimationController', 'Error in update loop', error as Error);
    }
  }

  /**
   * Stop current animation
   */
  stopAnimation() {
    this.animationPlayer.stopAnimation();
    log.info('AnimationController', 'Current animation stopped');
  }

  /**
   * Stop all animations
   */
  stopAll() {
    // Stop all body animations
    this.mixer.stopAllAction();
    this.animationPlayer.stopAnimation();
    
    // Keep facial animations running during body animation stops
    log.info('AnimationController', 'All body animations stopped, facial animations continue');
  }

  /**
   * Pause auto facial expressions (for lip sync)
   */
  pauseAutoFacialExpressions() {
    this.facialManager.pauseAutoMouthExpressions();
    log.info('AnimationController', 'Auto facial expressions paused for lip sync');
  }

  /**
   * Resume auto facial expressions (after lip sync)
   */
  resumeAutoFacialExpressions() {
    this.facialManager.resumeAutoMouthExpressions();
    log.info('AnimationController', 'Auto facial expressions resumed after lip sync');
  }

  /**
   * Stop facial animations (delegated to facial manager)
   */
  stopFacialAnimations() {
    this.facialManager.stop();
    log.info('AnimationController', 'Facial animations stopped');
  }

  /**
   * Restart facial animations (delegated to facial manager)
   */
  restartFacialAnimations() {
    this.facialManager.start();
    log.info('AnimationController', 'Facial animations restarted');
  }

  /**
   * Set facial animation intensity (for dance mode)
   */
  setFacialIntensity(blinkIntensity: number = 1.0, mouthIntensity: number = 0.5) {
    // This functionality is now handled by FacialExpressionManager
    // Keep for backward compatibility
    log.info('AnimationController', `Facial intensity set - Blink: ${blinkIntensity}, Mouth: ${mouthIntensity}`);
  }

  /**
   * Play emotion-based facial expressions
   */
  playEmotion(type: string, duration: number = 3.0) {
    try {
      if (!this.vrm.expressionManager) {
        log.warn('AnimationController', 'VRM expression manager not available for emotions');
        return;
      }

      log.info('AnimationController', `Playing emotion: ${type}`, undefined, { duration });

      const expressions = this.vrm.expressionManager;

      // Reset all expressions first
      this.resetAllExpressions();

      // Apply emotion-specific expressions
      switch (type) {
        case 'happy':
          expressions.setValue('happy', 1.0);
          expressions.setValue('relaxed', 0.3);
          break;
          
        case 'sad':
          expressions.setValue('sad', 1.0);
          expressions.setValue('relaxed', 0.2);
          break;
          
        case 'surprised':
          expressions.setValue('surprised', 1.0);
          expressions.setValue('blink', 0.0); // Keep eyes open
          break;
          
        case 'thinking':
          expressions.setValue('relaxed', 0.8);
          expressions.setValue('blink', 0.1);
          break;
          
        case 'neutral':
        default:
          expressions.setValue('neutral', 1.0);
          break;
      }

      // Auto reset after duration
      setTimeout(() => {
        this.resetAllExpressions();
        log.info('AnimationController', `Emotion ${type} auto-reset after ${duration}s`);
      }, duration * 1000);

    } catch (error) {
      log.error('AnimationController', `Failed to play emotion: ${type}`, error as Error);
    }
  }

  /**
   * Reset all facial expressions to neutral
   */
  private resetAllExpressions() {
    if (!this.vrm.expressionManager) return;

    const expressions = this.vrm.expressionManager;
    
    // Reset main expressions
    const expressionNames = ['happy', 'sad', 'surprised', 'relaxed', 'neutral'];
    expressionNames.forEach(name => {
      try {
        expressions.setValue(name as any, 0);
      } catch (error) {
        // Ignore if expression doesn't exist
      }
    });
    
    // Set neutral as base
    try {
      expressions.setValue('neutral', 1.0);
    } catch (error) {
      // Ignore if neutral doesn't exist
    }
  }

  // ============= PROCEDURAL ANIMATIONS =============
  // Legacy procedural animations for backward compatibility

  /**
   * Play greeting animation
   */
  private playGreetingAnimation(duration: number) {
    const leftArm = this.vrm.humanoid?.getNormalizedBoneNode('leftUpperArm');
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
    
    if (!leftArm || !rightArm) return;

    const times = [0, duration * 0.3, duration * 0.7, duration];
    const values = [
      0, 0, 0, 1,
      0, 0, -0.5, 0.866,
      0, 0, 0.2, 0.98,
      0, 0, 0, 1
    ];

    const track = new THREE.QuaternionKeyframeTrack(
      rightArm.name + '.quaternion',
      times,
      values
    );

    const clip = new THREE.AnimationClip('greeting', duration, [track]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.reset().fadeIn(0.3).play();
  }

  /**
   * Play spin animation
   */
  private playSpinAnimation(duration: number) {
    const leftArm = this.vrm.humanoid?.getNormalizedBoneNode('leftUpperArm');
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
    
    if (!leftArm || !rightArm) return;

    const times = [0, duration * 0.25, duration * 0.75, duration];
    const values = [
      0, 0, 0, 1,
      0, 0, -0.7, 0.714,
      0, 0, 0.7, 0.714,
      0, 0, 0, 1
    ];

    const leftTrack = new THREE.QuaternionKeyframeTrack(
      leftArm.name + '.quaternion',
      times,
      values
    );
    const rightTrack = new THREE.QuaternionKeyframeTrack(
      rightArm.name + '.quaternion',
      times,
      values
    );

    const clip = new THREE.AnimationClip('spin', duration, [leftTrack, rightTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.reset().fadeIn(0.3).play();
  }

  /**
   * Play thinking animation
   */
  private playThinkingAnimation(duration: number) {
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
    const head = this.vrm.humanoid?.getNormalizedBoneNode('head');
    
    if (!rightArm || !head) return;

    const times = [0, duration * 0.3, duration];
    const armValues = [
      0, 0, 0, 1,
      0, 0, -0.3, 0.954,
      0, 0, -0.3, 0.954
    ];
    const headValues = [
      0, 0, 0, 1,
      0.05, 0, 0, 0.999,
      0.05, 0, 0, 0.999
    ];

    const armTrack = new THREE.QuaternionKeyframeTrack(
      rightArm.name + '.quaternion',
      times,
      armValues
    );
    const headTrack = new THREE.QuaternionKeyframeTrack(
      head.name + '.quaternion',
      times,
      headValues
    );

    const clip = new THREE.AnimationClip('thinking', duration, [armTrack, headTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.reset().fadeIn(0.3).play();
  }

  /**
   * Play peace sign animation
   */
  private playPeaceSignAnimation(duration: number) {
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
    
    if (!rightArm) return;

    const times = [0, duration * 0.4, duration];
    const values = [
      0, 0, 0, 1,
      0, 0, -0.6, 0.8,
      0, 0, -0.6, 0.8
    ];

    const track = new THREE.QuaternionKeyframeTrack(
      rightArm.name + '.quaternion',
      times,
      values
    );

    const clip = new THREE.AnimationClip('peace_sign', duration, [track]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.reset().fadeIn(0.3).play();
  }

  /**
   * Play model pose animation
   */
  private playModelPoseAnimation(duration: number) {
    const leftArm = this.vrm.humanoid?.getNormalizedBoneNode('leftUpperArm');
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
    const hips = this.vrm.humanoid?.getNormalizedBoneNode('hips');
    
    if (!leftArm || !rightArm || !hips) return;

    const times = [0, duration * 0.5, duration];
    const leftArmValues = [
      0, 0, 0, 1,
      0, 0, -0.4, 0.914,
      0, 0, -0.4, 0.914
    ];
    const rightArmValues = [
      0, 0, 0, 1,
      0, 0, 0.4, 0.914,
      0, 0, 0.4, 0.914
    ];
    const hipsValues = [
      0, 0, 0, 1,
      0, 0, 0.1, 0.995,
      0, 0, 0.1, 0.995
    ];

    const leftArmTrack = new THREE.QuaternionKeyframeTrack(
      leftArm.name + '.quaternion',
      times,
      leftArmValues
    );
    const rightArmTrack = new THREE.QuaternionKeyframeTrack(
      rightArm.name + '.quaternion',
      times,
      rightArmValues
    );
    const hipsTrack = new THREE.QuaternionKeyframeTrack(
      hips.name + '.quaternion',
      times,
      hipsValues
    );

    const clip = new THREE.AnimationClip('model_pose', duration, [leftArmTrack, rightArmTrack, hipsTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.reset().fadeIn(0.3).play();
  }

  /**
   * Play squat animation
   */
  private playSquatAnimation(duration: number) {
    const hips = this.vrm.humanoid?.getNormalizedBoneNode('hips');
    const leftLeg = this.vrm.humanoid?.getNormalizedBoneNode('leftUpperLeg');
    const rightLeg = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperLeg');
    
    if (!hips || !leftLeg || !rightLeg) return;

    const times = [0, duration * 0.4, duration * 0.8, duration];
    const hipsPositionValues = [0, -0.3, -0.3, 0];
    const legValues = [
      0, 0, 0, 1,
      0.5, 0, 0, 0.866,
      0.5, 0, 0, 0.866,
      0, 0, 0, 1
    ];

    const hipsTrack = new THREE.NumberKeyframeTrack(
      hips.name + '.position[y]',
      times,
      hipsPositionValues
    );
    const leftLegTrack = new THREE.QuaternionKeyframeTrack(
      leftLeg.name + '.quaternion',
      times,
      legValues
    );
    const rightLegTrack = new THREE.QuaternionKeyframeTrack(
      rightLeg.name + '.quaternion',
      times,
      legValues
    );

    const clip = new THREE.AnimationClip('squat', duration, [hipsTrack, leftLegTrack, rightLegTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.reset().fadeIn(0.3).play();
  }

  /**
   * Play shoot animation
   */
  private playShootAnimation(duration: number) {
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
    const head = this.vrm.humanoid?.getNormalizedBoneNode('head');
    
    if (!rightArm || !head) return;

    const times = [0, duration * 0.3, duration];
    const armValues = [
      0, 0, 0, 1,
      0, 0, -0.7, 0.714,
      0, 0, -0.7, 0.714
    ];
    const headValues = [
      0, 0, 0, 1,
      0, 0.1, 0, 0.995,
      0, 0.1, 0, 0.995
    ];

    const armTrack = new THREE.QuaternionKeyframeTrack(
      rightArm.name + '.quaternion',
      times,
      armValues
    );
    const headTrack = new THREE.QuaternionKeyframeTrack(
      head.name + '.quaternion',
      times,
      headValues
    );

    const clip = new THREE.AnimationClip('shoot', duration, [armTrack, headTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.reset().fadeIn(0.3).play();
  }

  /**
   * Dispose of animation controller and cleanup resources
   */
  dispose() {
    try {
      // Stop all animations
      this.stopAll();
      
      // Dispose of modular components
      if (this.animationPlayer) {
        this.animationPlayer.dispose();
      }
      
      if (this.facialManager) {
        this.facialManager.dispose();
      }
      
      if (this.idleScheduler) {
        this.idleScheduler.dispose();
      }
      
      // Clear animation data
      this.vrmaClips.clear();
      this.allAnimations.clear();
      
      log.info('AnimationController', 'Successfully disposed of all resources');
    } catch (error) {
      log.error('AnimationController', 'Error during disposal', error as Error);
    }
  }
}