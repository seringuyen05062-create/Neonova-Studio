import * as THREE from 'three';
import { AnimationPlayer } from './animationPlayer';

/**
 * IdleScheduler - Quản lý idle animation sequence
 * Tách từ animation-controller.ts để dễ bảo trì
 */
export class IdleScheduler {
  private idleTimeoutRef: NodeJS.Timeout | null = null;
  private idleSequenceRef: NodeJS.Timeout | null = null;
  private allIdleTimeouts: NodeJS.Timeout[] = [];
  private isEnabled = true;

  constructor(
    private animationPlayer: AnimationPlayer,
    private vrmaAnimations: Map<string, THREE.AnimationClip[]>
  ) {}

  /**
   * Start idle sequence after delay
   */
  startIdleSequence() {
    if (!this.isEnabled) return;

    this.clearAllTimers();

    const runSequence = () => {
      console.log('[IdleScheduler] Starting idle sequence...');
      
      this.clearAllTimeouts();

      // Get animation durations
      const spinDuration = this.getAnimationDuration('spin', 2.0);
      const shootDuration = this.getAnimationDuration('shoot', 2.0);
      const squatDuration = this.getAnimationDuration('squat', 2.0);
      const modelPoseDuration = this.getAnimationDuration('model_pose', 3.0);

      let totalTime = 0;

      // Sequence: spin -> shoot -> squat -> model_pose
      const timeout1 = setTimeout(() => {
        this.animationPlayer.playAnimation('spin');
      }, totalTime);
      this.allIdleTimeouts.push(timeout1);
      totalTime += spinDuration * 1000;

      const timeout2 = setTimeout(() => {
        this.animationPlayer.playAnimation('shoot');
      }, totalTime);
      this.allIdleTimeouts.push(timeout2);
      totalTime += shootDuration * 1000;

      const timeout3 = setTimeout(() => {
        this.animationPlayer.playAnimation('squat');
      }, totalTime);
      this.allIdleTimeouts.push(timeout3);
      totalTime += squatDuration * 1000;

      const timeout4 = setTimeout(() => {
        this.animationPlayer.playAnimation('model_pose');
        
        // Schedule next sequence
        this.idleTimeoutRef = setTimeout(() => {
          runSequence();
        }, 10000);
      }, totalTime);
      this.allIdleTimeouts.push(timeout4);
    };

    // Start sequence after initial delay
    this.idleTimeoutRef = setTimeout(() => {
      runSequence();
    }, 10000);
  }

  /**
   * Reset idle timer (call when user interacts)
   */
  resetIdleTimer() {
    this.clearAllTimers();
    this.startIdleSequence();
  }

  /**
   * Enable idle scheduler
   */
  enable() {
    this.isEnabled = true;
    this.startIdleSequence();
  }

  /**
   * Disable idle scheduler
   */
  disable() {
    this.isEnabled = false;
    this.clearAllTimers();
  }

  /**
   * Get animation duration with fallback
   */
  private getAnimationDuration(animationName: string, fallback: number): number {
    const clips = this.vrmaAnimations.get(animationName);
    return clips && clips[0] ? clips[0].duration : fallback;
  }

  /**
   * Clear all timers
   */
  private clearAllTimers() {
    if (this.idleTimeoutRef) {
      clearTimeout(this.idleTimeoutRef);
      this.idleTimeoutRef = null;
    }

    if (this.idleSequenceRef) {
      clearTimeout(this.idleSequenceRef);
      this.idleSequenceRef = null;
    }

    this.clearAllTimeouts();
  }

  /**
   * Clear all idle timeouts
   */
  private clearAllTimeouts() {
    this.allIdleTimeouts.forEach(timeout => clearTimeout(timeout));
    this.allIdleTimeouts = [];
  }

  /**
   * Stop idle animation
   */
  stop() {
    this.clearAllTimers();
    console.log('IdleScheduler: Idle animation stopped');
  }

  /**
   * Legacy method name for backward compatibility
   */
  stopIdleAnimation() {
    this.stop();
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.clearAllTimers();
  }
}