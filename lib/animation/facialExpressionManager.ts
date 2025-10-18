import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';

/**
 * FacialExpressionManager - Quản lý biểu cảm khuôn mặt
 * Tách từ animation-controller.ts để dễ bảo trì
 */
export class FacialExpressionManager {
  private clock = new THREE.Clock();
  private mixer = new THREE.AnimationMixer(new THREE.Object3D());
  private blinkAction: THREE.AnimationAction | null = null;
  private mouthAction: THREE.AnimationAction | null = null;
  
  // Expression states
  private currentEyeExpression = 'normal';
  private currentFacialMood = 'neutral';
  private eyeExpressionTimer = 0;
  private eyeExpressionDuration = 0;
  private eyeTransitionProgress = 1.0;
  private facialTransitionPhase = 0;
  
  // Auto expression control
  private isAutoMouthExpressionsPaused = false;
  private facialVariationTimer = 0;
  private facialVariationInterval = 3.0;
  private isRunning = true;

  constructor(private vrm: VRM) {
    this.setupFacialAnimations();
    this.clock.start();
  }

  /**
   * Setup basic facial animations (blink, mouth)
   */
  private setupFacialAnimations() {
    // Setup blink animation
    this.setupBlinkAnimation();
    
    // Setup mouth animation
    this.setupMouthAnimation();
  }

  /**
   * Setup blink animation with natural timing
   */
  private setupBlinkAnimation() {
    const blinkTimes = [0, 0.1, 0.2, 4, 4.1, 4.2, 7, 7.1, 7.2, 9, 9.1, 9.2, 12];
    const blinkValues = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0];

    const blinkTrack = new THREE.NumberKeyframeTrack(
      'blink.value',
      blinkTimes,
      blinkValues
    );

    const blinkClip = new THREE.AnimationClip('blink_facial', 12, [blinkTrack]);
    this.blinkAction = this.mixer.clipAction(blinkClip);
    this.blinkAction.setLoop(THREE.LoopRepeat, Infinity);
    this.blinkAction.play();
  }

  /**
   * Setup mouth animation with subtle movements
   */
  private setupMouthAnimation() {
    const mouthTimes = [0, 2, 4, 6, 8];
    const mouthValues = [0, 0.1, 0, 0.05, 0];

    const mouthTrack = new THREE.NumberKeyframeTrack(
      'mouth.value',
      mouthTimes,
      mouthValues
    );

    const mouthClip = new THREE.AnimationClip('mouth_facial', 8, [mouthTrack]);
    this.mouthAction = this.mixer.clipAction(mouthClip);
    this.mouthAction.setLoop(THREE.LoopRepeat, Infinity);
    this.mouthAction.play();
  }

  /**
   * Update facial expressions in real-time
   */
  update() {
    if (!this.vrm.expressionManager) return;

    const delta = this.clock.getDelta();
    this.mixer.update(delta);

    // Update VRM expressions
    this.updateVRMExpressions(delta);
    
    // Apply expressions
    this.vrm.expressionManager.update();
  }

  /**
   * Update VRM facial expressions
   */
  private updateVRMExpressions(delta: number) {
    const time = this.clock.getElapsedTime();
    
    // Natural blinking
    const blinkValue = this.calculateNaturalBlink(time);
    
    // Dynamic mouth expressions (only if not paused for lip sync)
    const mouthExpressions = this.isAutoMouthExpressionsPaused ? {} : this.calculateMouthExpressions(time);
    
    // Eye expressions
    const eyeExpressions = this.calculateEyeExpressions(time);
    
    // Apply all expressions
    this.applyVRMExpressions({
      blink: blinkValue,
      ...mouthExpressions,
      ...eyeExpressions
    });
  }

  /**
   * Calculate natural blink pattern
   */
  private calculateNaturalBlink(time: number): number {
    const blinkCycle = time % 4.5;
    
    if (blinkCycle < 0.1) {
      return Math.sin(blinkCycle * Math.PI / 0.1);
    } else if (blinkCycle > 4.0 && blinkCycle < 4.1) {
      return Math.sin((blinkCycle - 4.0) * Math.PI / 0.1);
    }
    
    return 0;
  }

  /**
   * Calculate mouth expressions (reduced intensity for natural look)
   */
  private calculateMouthExpressions(time: number) {
    const breathPhase = Math.sin(time * 0.8) * 0.5 + 0.5;
    const breathIntensity = breathPhase * 0.05; // Reduced from 0.1 to 0.05
    
    return {
      aa: breathIntensity,
      happy: Math.max(0, Math.sin(time * 0.3) * 0.05) // Reduced from 0.1 to 0.05
    };
  }

  /**
   * Calculate eye expressions
   */
  private calculateEyeExpressions(time: number) {
    // Simplified eye expression system
    return {
      surprised: Math.max(0, Math.sin(time * 0.2) * 0.05),
      relaxed: Math.max(0, Math.cos(time * 0.15) * 0.05)
    };
  }

  /**
   * Apply expressions to VRM
   */
  private applyVRMExpressions(expressions: Record<string, number>) {
    if (!this.vrm.expressionManager) return;

    for (const [name, value] of Object.entries(expressions)) {
      try {
        this.vrm.expressionManager.setValue(name as any, value);
      } catch (error) {
        // Silently handle missing expressions
      }
    }
  }

  /**
   * Pause auto mouth expressions (for lip sync)
   */
  pauseAutoMouthExpressions() {
    this.isAutoMouthExpressionsPaused = true;
    console.log('[FacialExpressionManager] Auto mouth expressions paused');
  }

  /**
   * Resume auto mouth expressions with smooth transition
   */
  resumeAutoMouthExpressions() {
    // Add delay to prevent immediate override after lip sync reset
    setTimeout(() => {
      this.isAutoMouthExpressionsPaused = false;
      console.log('[FacialExpressionManager] Auto mouth expressions resumed (with delay)');
    }, 200); // 200ms delay to allow lip sync reset to settle
  }

  /**
   * Stop all facial animations
   */
  stop() {
    this.isRunning = false;
    console.log('[FacialExpressionManager] Facial animations stopped');
  }

  /**
   * Start facial animations
   */
  start() {
    this.isRunning = true;
    console.log('[FacialExpressionManager] Facial animations started');
  }

  /**
   * Set facial intensity
   */
  setFacialIntensity(blinkIntensity = 1.0, mouthIntensity = 0.5) {
    if (this.blinkAction) {
      this.blinkAction.weight = blinkIntensity;
    }
    if (this.mouthAction) {
      this.mouthAction.weight = mouthIntensity;
    }
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.mixer.stopAllAction();
  }
}