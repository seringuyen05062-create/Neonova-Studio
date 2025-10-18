import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';

/**
 * AnimationPlayer - Quản lý việc phát animation
 * Tách từ animation-controller.ts để dễ bảo trì
 */
export class AnimationPlayer {
  private mixer: THREE.AnimationMixer;
  private clock = new THREE.Clock();
  private currentAction: THREE.AnimationAction | null = null;
  private vrmaClips = new Map<string, THREE.AnimationClip[]>();
  private allAnimations = new Map<string, { clips: THREE.AnimationClip[], format: string }>();

  constructor(private vrm: VRM) {
    this.mixer = new THREE.AnimationMixer(vrm.scene);
  }

  /**
   * Load VRMA animation clips
   */
  loadVRMAClips(vrmaName: string, clips: THREE.AnimationClip[]) {
    this.vrmaClips.set(vrmaName, clips);
    this.allAnimations.set(vrmaName, { clips, format: 'vrma' });
    console.log(`[AnimationPlayer] Loaded VRMA: ${vrmaName} (${clips.length} clips)`);
  }

  /**
   * Set multiple VRMA clips at once
   */
  setVRMAClips(vrmaClips: Map<string, THREE.AnimationClip[]>) {
    this.vrmaClips = new Map(vrmaClips);
    // Update allAnimations as well
    vrmaClips.forEach((clips, name) => {
      this.allAnimations.set(name, { clips, format: 'vrma' });
    });
    console.log(`[AnimationPlayer] Set ${vrmaClips.size} VRMA animations`);
  }

  /**
   * Play animation by name
   */
  playAnimation(animationName: string, duration?: number): boolean {
    const clips = this.vrmaClips.get(animationName);
    if (!clips || clips.length === 0) {
      console.warn(`[AnimationPlayer] Animation not found: ${animationName}`);
      return false;
    }

    // Stop current animation
    if (this.currentAction) {
      this.currentAction.fadeOut(0.3);
    }

    const clip = clips[0];
    const action = this.mixer.clipAction(clip);

    // Configure looping based on animation type
    if (this.shouldLoop(animationName)) {
      action.setLoop(THREE.LoopRepeat, Infinity);
    } else {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    }

    action.reset().fadeIn(0.3).play();
    this.currentAction = action;

    console.log(`[AnimationPlayer] Playing: ${animationName}`);
    return true;
  }

  /**
   * Stop current animation
   */
  stopAnimation() {
    if (this.currentAction) {
      this.currentAction.fadeOut(0.3);
      this.currentAction = null;
    }
    this.mixer.stopAllAction();
  }

  /**
   * Update animation mixer
   */
  update() {
    const delta = this.clock.getDelta();
    this.mixer.update(delta);
  }

  /**
   * Determine if animation should loop
   */
  private shouldLoop(animationName: string): boolean {
    const danceAnimations = [
      'nhung_ngay_mau_huou', 'aiaiai', 'bling', 'batlayemgiua_canhdongluamachnon',
      'tetris', 'shikairodeizu', 'funfunwandafurudays'
    ];
    
    return danceAnimations.some(anim => animationName.includes(anim));
  }

  /**
   * Get available animations
   */
  getAvailableAnimations(): string[] {
    return Array.from(this.vrmaClips.keys());
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.mixer.stopAllAction();
    this.vrmaClips.clear();
    this.allAnimations.clear();
  }
}