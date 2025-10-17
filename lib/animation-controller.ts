import * as THREE from 'three';
import { VRM, VRMExpressionPresetName } from '@pixiv/three-vrm';
import { AnimationType } from '@/types';

export class AnimationController {
  private vrm: VRM;
  private mixer: THREE.AnimationMixer;
  private currentAction: THREE.AnimationAction | null = null;
  private clock: THREE.Clock;
  private idleAnimation: THREE.AnimationAction | null = null;
  
  // Enhanced animation storage - supports multiple formats
  private vrmaClips: Map<string, THREE.AnimationClip[]> = new Map();
  private allAnimations: Map<string, { clips: THREE.AnimationClip[], format: string }> = new Map();
  
  // Facial animation system - separate mixer for face expressions
  private facialMixer: THREE.AnimationMixer;
  private blinkAction: THREE.AnimationAction | null = null;
  private mouthAction: THREE.AnimationAction | null = null;
  private facialClock: THREE.Clock;
  private facialVariationTimer: number = 0;
  private facialVariationInterval: number = 3.0; // Apply variations every 3 seconds
  
  // Advanced facial expression system with 25+ eye expressions
  private lastBlinkTime: number = 0;
  private nextBlinkTime: number = 4.0;
  private currentFacialMood: string = 'neutral';
  private facialTransitionPhase: number = 0;
  
  // Advanced eye expression state
  private currentEyeExpression: string = 'normal';
  private eyeExpressionTimer: number = 0;
  private eyeExpressionDuration: number = 0;
  private eyeTransitionProgress: number = 0;
  private pupilDilation: number = 0.5; // 0-1 scale for pupil simulation
  private gazeDirection: { x: number, y: number } = { x: 0, y: 0 };
  private eyeBrowPosition: number = 0; // -1 to 1 (furrowed to raised)
  private eyelidPosition: number = 1.0; // 0 to 1 (closed to fully open)
  private eyeShapeVariation: number = 0; // For squinting, wide eyes, etc.
  
  // Random blink timing system (4s, 7s, 9s as requested)
  private blinkTimingOptions: number[] = [4.0, 7.0, 9.0];
  private currentBlinkInterval: number = 4.0;
  
  // Lip sync control
  private isAutoMouthExpressionsPaused: boolean = false;

  constructor(vrm: VRM, animations?: Map<string, { clips: THREE.AnimationClip[], format: string }>) {
    this.vrm = vrm;
    
    // Create mixer with VRM scene (official recommendation)
    // All clips should be retargeted to vrm.scene for consistency
    this.mixer = new THREE.AnimationMixer(vrm.scene);
    this.clock = new THREE.Clock();
    
    // Initialize facial animation system
    this.facialMixer = new THREE.AnimationMixer(vrm.scene);
    this.facialClock = new THREE.Clock();
    
    // Load animations if provided (backward compatibility + new format support)
    if (animations) {
      this.allAnimations = animations;
      
      // Extract VRMA clips for backward compatibility
      animations.forEach((animData, name) => {
        if (animData.format === 'vrma') {
          this.vrmaClips.set(name, animData.clips);
        }
      });
      
      console.log('AnimationController: Loaded animations:', 
        Array.from(animations.entries()).map(([name, data]) => `${name} (${data.format})`));
    }
    
    // Setup advanced facial animations with 25+ eye expressions
    this.setupFacialAnimations();
    
    // Initialize eye expression system
    this.initializeEyeExpressionSystem();
    
    // Tạm tắt setupIdleAnimation để tránh conflict với facial system
    console.log('⚠️ setupIdleAnimation disabled to avoid conflicts with facial system');
  }

  /**
   * Setup idle animation (breathing, blinking, subtle movements)
   */
  private setupIdleAnimation() {
    // Breathing animation - subtle chest movement
    const breathingTimes = [0, 2, 4, 6];
    const breathingValues = [0, 0.02, 0, 0.02];

    // Blinking animation - eye morph targets (nháy/chớp mắt)
    const blinkTimes = [0, 0.1, 0.2, 2.1, 2.2, 2.3, 4, 4.1, 4.2, 6];
    const blinkValues = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0];

    // Subtle head movement: lắc/gật đầu nhẹ
    const headTimes = [0, 1.5, 3, 4.5, 6];
    const headValues = [
      0, 0, 0, 1,           // Neutral
      0.01, 0.02, 0, 1,    // Slight nod
      -0.01, -0.02, 0, 1,  // Slight shake
      0.01, 0, 0, 1,       // Back to neutral
      0, 0, 0, 1,
    ];

    // Idle animation chỉ tác động lên đầu, mắt, breathing
    const breathingTrack = new THREE.NumberKeyframeTrack(
      'hips.position[y]',
      breathingTimes,
      breathingValues
    );
    const blinkTrack = new THREE.NumberKeyframeTrack(
      '.morphTargetInfluences[0]',
      blinkTimes,
      blinkValues
    );
    const headTrack = new THREE.QuaternionKeyframeTrack(
      'head.quaternion',
      headTimes,
      headValues
    );

    // Tích hợp procedural idle animation, không override pose mẫu
    const clip = new THREE.AnimationClip('idle', 6, [breathingTrack, blinkTrack, headTrack]);
    this.idleAnimation = this.mixer.clipAction(clip);
    this.idleAnimation.setLoop(THREE.LoopRepeat, Infinity);
    this.idleAnimation.play();
  }

  /**
   * Setup continuous facial animations (eyes blinking, mouth movement)
   * These run independently from body animations
   */
  private setupFacialAnimations() {
    console.log('🎭 Setting up facial animations...');
    console.log('🔍 VRM scene structure:', this.vrm.scene);

    // Natural blinking pattern - varied intervals for realism
    const blinkTimes = [0, 0.08, 0.16, 1.8, 1.88, 1.96, 3.2, 3.28, 3.36, 4.9, 4.98, 5.06, 6.5, 6.58, 6.66, 8.1, 8.18, 8.26, 9.7, 9.78, 9.86, 12];
    const blinkValues = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0];

    // Mouth breathing/idle movement - natural rhythm
    const mouthTimes = [0, 0.8, 1.6, 2.4, 3.2, 4.0, 4.8, 5.6, 6.4, 7.2, 8.0, 8.8, 9.6, 10.4, 11.2, 12];
    const mouthValues = [0, 0.12, 0.05, 0.18, 0.08, 0.15, 0.03, 0.20, 0.06, 0.14, 0.09, 0.16, 0.04, 0.11, 0.07, 0];

    try {
      // Method 1: Try VRM Expression Manager (Recommended)
      if (this.vrm.expressionManager) {
        console.log('✅ Using VRM Expression Manager for facial animations');
        this.setupVRMExpressionFacials(blinkTimes, blinkValues, mouthTimes, mouthValues);
        return;
      }

      // Method 2: Fallback to direct morph target manipulation
      console.log('⚠️ VRM Expression Manager not available, falling back to direct morph targets');
      let faceMesh: any = null;
      let morphTargetDict: any = null;

      // Look for objects with morphTargetDictionary
      this.vrm.scene.traverse((object: any) => {
        if (object.morphTargetDictionary && Object.keys(object.morphTargetDictionary).length > 0) {
          console.log(`👁️ Found morph targets on object: ${object.name || 'unnamed'}`, Object.keys(object.morphTargetDictionary));
          if (!faceMesh) {
            faceMesh = object;
            morphTargetDict = object.morphTargetDictionary;
          }
        }
      });

      if (faceMesh && morphTargetDict) {
        console.log('✅ Using face mesh:', faceMesh.name || 'unnamed', 'with targets:', Object.keys(morphTargetDict));
        
        // Setup blink animation
        const blinkTargets = ['Blink', 'blink', 'Eye_Blink', 'eye_blink', 'Blink_L', 'Blink_R'];
        let blinkTargetName = null;
        
        for (const target of blinkTargets) {
          if (morphTargetDict[target] !== undefined) {
            blinkTargetName = target;
            break;
          }
        }

        if (blinkTargetName) {
          const blinkIndex = morphTargetDict[blinkTargetName];
          const blinkTrack = new THREE.NumberKeyframeTrack(
            `${faceMesh.name || faceMesh.uuid}.morphTargetInfluences[${blinkIndex}]`,
            blinkTimes,
            blinkValues
          );

          const blinkClip = new THREE.AnimationClip('blink_facial', 12, [blinkTrack]);
          this.blinkAction = this.facialMixer.clipAction(blinkClip);
          this.blinkAction.setLoop(THREE.LoopRepeat, Infinity);
          this.blinkAction.play();
          console.log(`✅ Blink animation setup with target: ${blinkTargetName} (index: ${blinkIndex})`);
        } else {
          console.log('❌ No blink morph target found. Available targets:', Object.keys(morphTargetDict));
        }

        // Setup mouth animation
        const mouthTargets = ['A', 'a', 'Mouth_A', 'mouth_a', 'Aa', 'aa', 'O', 'o', 'U', 'u'];
        let mouthTargetName = null;
        
        for (const target of mouthTargets) {
          if (morphTargetDict[target] !== undefined) {
            mouthTargetName = target;
            break;
          }
        }

        if (mouthTargetName) {
          const mouthIndex = morphTargetDict[mouthTargetName];
          const mouthTrack = new THREE.NumberKeyframeTrack(
            `${faceMesh.name || faceMesh.uuid}.morphTargetInfluences[${mouthIndex}]`,
            mouthTimes,
            mouthValues
          );

          const mouthClip = new THREE.AnimationClip('mouth_facial', 12, [mouthTrack]);
          this.mouthAction = this.facialMixer.clipAction(mouthClip);
          this.mouthAction.setLoop(THREE.LoopRepeat, Infinity);
          this.mouthAction.weight = 0.3;
          this.mouthAction.play();
          console.log(`✅ Mouth animation setup with target: ${mouthTargetName} (index: ${mouthIndex})`);
        } else {
          console.log('❌ No mouth morph target found. Available targets:', Object.keys(morphTargetDict));
        }
      } else {
        console.log('❌ No face mesh with morph targets found in VRM scene');
        
        // Debug: Log all objects in scene
        console.log('🔍 All objects in VRM scene:');
        this.vrm.scene.traverse((object: any) => {
          console.log(`- ${object.name || object.type || 'unnamed'}: ${object.constructor.name}`);
          if (object.morphTargetDictionary) {
            console.log(`  Morph targets:`, Object.keys(object.morphTargetDictionary));
          }
        });
      }
    } catch (error) {
      console.log('⚠️ Could not setup facial animations:', error);
    }
  }

  /**
   * Setup facial animations using VRM Expression Manager (Preferred method)
   */
  private setupVRMExpressionFacials(blinkTimes: number[], blinkValues: number[], mouthTimes: number[], mouthValues: number[]) {
    console.log('🎭 Setting up VRM Expression-based facial animations...');
    
    if (!this.vrm.expressionManager) {
      console.log('❌ VRM Expression Manager not available');
      return;
    }

    console.log('Available VRM expressions:', Object.keys(this.vrm.expressionManager.expressionMap || {}));
    
    // Initialize facial animation state
    this.facialVariationTimer = 0;
    
    console.log('✅ VRM Expression facial system initialized (will update in main loop)');
  }

  /**
   * Initialize advanced eye expression system with 25+ emotions
   */
  private initializeEyeExpressionSystem() {
    console.log('👁️ Initializing advanced eye expression system with 25+ emotions...');
    
    // Set initial eye expression
    this.currentEyeExpression = 'normal';
    this.eyeExpressionTimer = 0;
    this.eyeExpressionDuration = 3.0; // Initial duration
    this.eyeTransitionProgress = 1.0; // Start fully transitioned
    
    // Initialize eye parameters to neutral state
    this.pupilDilation = 0.5;
    this.gazeDirection = { x: 0, y: 0 };
    this.eyeBrowPosition = 0;
    this.eyelidPosition = 0.85;
    this.eyeShapeVariation = 0;
    
    // Set initial random blink interval
    this.currentBlinkInterval = this.blinkTimingOptions[Math.floor(Math.random() * this.blinkTimingOptions.length)];
    this.nextBlinkTime = this.facialClock.getElapsedTime() + this.currentBlinkInterval;
    
    console.log(`✅ Eye expression system ready - First blink in ${this.currentBlinkInterval}s`);
    console.log('👁️ Available expressions: normal, happy, sad, angry, surprised, fear, disgust, confused, determined, tired, focused, dreamy, suspicious, shy, confident, mischievous, gentle, stern, playful, worried, excited, bored, curious, loving, disappointed');
  }

  /**
   * Update VRM facial expressions in real-time - Enhanced smooth system
   */
  private updateVRMFacialExpressions(delta: number) {
    if (!this.vrm.expressionManager) return;

    const time = this.facialClock.getElapsedTime();
    
    // === NATURAL BLINKING SYSTEM ===
    const blinkValue = this.calculateNaturalBlink(time);
    
    // === DYNAMIC MOUTH EXPRESSIONS ===
    // Only skip mouth expressions if paused for lip sync
    const mouthExpressions = this.isAutoMouthExpressionsPaused ? {} : this.calculateMouthExpressions(time);
    
    // === EYE EXPRESSIONS (Gaze, Wink, etc.) ===
    const eyeExpressions = this.calculateEyeExpressions(time);
    
    // Apply all expressions with error handling
    this.applyVRMExpressions({
      blink: blinkValue,
      ...mouthExpressions,
      ...eyeExpressions
    });
  }

  /**
   * Calculate natural blinking with random intervals (4s, 7s, 9s) and 25+ eye expressions
   */
  private calculateNaturalBlink(time: number): number {
    // Check if it's time for next blink
    if (time >= this.nextBlinkTime) {
      this.lastBlinkTime = time;
      
      // Random blink interval from specified options (4s, 7s, 9s)
      this.currentBlinkInterval = this.blinkTimingOptions[Math.floor(Math.random() * this.blinkTimingOptions.length)];
      this.nextBlinkTime = time + this.currentBlinkInterval;
      
      // Randomly choose eye expression to accompany blink
      this.chooseRandomEyeExpression();
      
      console.log(`👁️ Next blink in ${this.currentBlinkInterval}s with expression: ${this.currentEyeExpression}`);
    }
    
    // Calculate blink animation if we're in blink period
    const timeSinceLastBlink = time - this.lastBlinkTime;
    
    if (timeSinceLastBlink < 0.12) { // Blink duration: 120ms for more natural feel
      // Smooth blink curve with expression variation
      const blinkPhase = timeSinceLastBlink / 0.12; // 0 to 1
      const baseBlinkValue = Math.sin(blinkPhase * Math.PI); // Smooth sine curve
      
      // Apply expression modification to blink
      return this.applyEyeExpressionToBlink(baseBlinkValue);
    }
    
    return 0; // Eyes open
  }

  /**
   * Choose random eye expression from 25+ human emotions
   */
  private chooseRandomEyeExpression() {
    const eyeExpressions = [
      // Basic emotions (7 core expressions)
      'normal', 'happy', 'sad', 'angry', 'surprised', 'fear', 'disgust',
      
      // Complex emotional states (18 additional expressions)
      'confused', 'determined', 'tired', 'focused', 'dreamy', 'suspicious',
      'shy', 'confident', 'mischievous', 'gentle', 'stern', 'playful',
      'worried', 'excited', 'bored', 'curious', 'loving', 'disappointed',
      
      // Mood-based expressions from current animation context
      ...this.getContextualEyeExpressions()
    ];
    
    // Weight selection based on current facial mood
    const moodWeights = this.getEyeExpressionWeights();
    const selectedExpression = this.weightedRandomSelect(eyeExpressions, moodWeights);
    
    this.currentEyeExpression = selectedExpression;
    this.eyeExpressionTimer = 0;
    this.eyeExpressionDuration = 1.5 + Math.random() * 3.0; // 1.5-4.5 seconds
    this.eyeTransitionProgress = 0;
    
    // Set additional eye parameters based on expression
    this.setEyeParametersForExpression(selectedExpression);
  }

  /**
   * Get contextual eye expressions based on current animation mood
   */
  private getContextualEyeExpressions(): string[] {
    switch(this.currentFacialMood) {
      case 'energetic':
      case 'high_energy':
        return ['excited', 'confident', 'playful', 'mischievous'];
      case 'joyful':
      case 'cheerful':
        return ['happy', 'gentle', 'loving', 'playful'];
      case 'cute':
      case 'playful':
        return ['shy', 'mischievous', 'curious', 'gentle'];
      case 'focused':
      case 'determined':
        return ['focused', 'determined', 'stern', 'confident'];
      case 'professional':
        return ['confident', 'focused', 'normal', 'determined'];
      default:
        return ['normal', 'gentle', 'curious'];
    }
  }

  /**
   * Apply eye expression modification to blink
   */
  private applyEyeExpressionToBlink(baseBlinkValue: number): number {
    switch(this.currentEyeExpression) {
      case 'surprised':
        return baseBlinkValue * 0.7; // Wider eyes, less complete blink
      case 'tired':
        return Math.min(1.0, baseBlinkValue * 1.3); // Heavier, slower blink
      case 'shy':
        return baseBlinkValue * 1.1; // Slightly longer blink
      case 'angry':
        return baseBlinkValue * 0.8; // Tense, quicker blink
      case 'suspicious':
        return baseBlinkValue * 0.9; // Narrowed eyes
      case 'dreamy':
        return Math.min(1.0, baseBlinkValue * 1.2); // Languid blink
      default:
        return baseBlinkValue; // Normal blink
    }
  }

  /**
   * Set eye parameters (pupil, gaze, eyebrow, eyelid) based on expression
   */
  private setEyeParametersForExpression(expression: string) {
    switch(expression) {
      case 'surprised':
        this.pupilDilation = 0.8; // Dilated pupils
        this.eyeBrowPosition = 0.6; // Raised eyebrows
        this.eyelidPosition = 1.0; // Wide open eyes
        this.eyeShapeVariation = 0.3; // Wide eye shape
        break;
        
      case 'angry':
        this.pupilDilation = 0.3; // Constricted pupils
        this.eyeBrowPosition = -0.7; // Furrowed brow
        this.eyelidPosition = 0.7; // Slightly narrowed
        this.eyeShapeVariation = -0.4; // Squinting
        break;
        
      case 'happy':
        this.pupilDilation = 0.6; // Normal-slightly dilated
        this.eyeBrowPosition = 0.2; // Slightly raised
        this.eyelidPosition = 0.9; // Bright eyes
        this.eyeShapeVariation = 0.2; // Slight eye smile
        break;
        
      case 'sad':
        this.pupilDilation = 0.4; // Slightly constricted
        this.eyeBrowPosition = -0.3; // Slightly down
        this.eyelidPosition = 0.6; // Droopy eyes
        this.eyeShapeVariation = -0.2; // Downturned
        break;
        
      case 'tired':
        this.pupilDilation = 0.3; // Constricted
        this.eyeBrowPosition = -0.2; // Relaxed down
        this.eyelidPosition = 0.5; // Half-closed
        this.eyeShapeVariation = -0.3; // Heavy lids
        break;
        
      case 'focused':
      case 'determined':
        this.pupilDilation = 0.5; // Normal
        this.eyeBrowPosition = -0.1; // Slightly concentrated
        this.eyelidPosition = 0.8; // Alert but not wide
        this.eyeShapeVariation = 0.1; // Slight intensity
        break;
        
      case 'shy':
        this.pupilDilation = 0.4; // Slightly constricted
        this.eyeBrowPosition = 0.1; // Slightly raised
        this.eyelidPosition = 0.7; // Modest gaze
        this.eyeShapeVariation = -0.1; // Averted look
        // Add subtle gaze avoidance
        this.gazeDirection.x = (Math.random() - 0.5) * 0.3;
        this.gazeDirection.y = -0.1 + Math.random() * 0.1;
        break;
        
      case 'suspicious':
        this.pupilDilation = 0.4; // Focused
        this.eyeBrowPosition = -0.4; // Slightly furrowed
        this.eyelidPosition = 0.6; // Narrowed eyes
        this.eyeShapeVariation = -0.3; // Squinting
        break;
        
      case 'excited':
        this.pupilDilation = 0.7; // Dilated
        this.eyeBrowPosition = 0.4; // Raised
        this.eyelidPosition = 1.0; // Wide open
        this.eyeShapeVariation = 0.4; // Bright expression
        break;
        
      case 'dreamy':
        this.pupilDilation = 0.6; // Relaxed dilation
        this.eyeBrowPosition = 0.1; // Peaceful
        this.eyelidPosition = 0.8; // Soft gaze
        this.eyeShapeVariation = 0.1; // Gentle
        // Add subtle upward gaze
        this.gazeDirection.y = 0.2 + Math.random() * 0.1;
        break;
        
      case 'curious':
        this.pupilDilation = 0.6; // Alert
        this.eyeBrowPosition = 0.3; // Raised with interest
        this.eyelidPosition = 0.9; // Open and alert
        this.eyeShapeVariation = 0.2; // Interested expression
        break;
        
      case 'loving':
      case 'gentle':
        this.pupilDilation = 0.7; // Warm dilation
        this.eyeBrowPosition = 0.1; // Soft
        this.eyelidPosition = 0.8; // Warm gaze
        this.eyeShapeVariation = 0.15; // Gentle smile in eyes
        break;
        
      default: // 'normal' and others
        this.pupilDilation = 0.5;
        this.eyeBrowPosition = 0;
        this.eyelidPosition = 0.85;
        this.eyeShapeVariation = 0;
        this.gazeDirection = { x: 0, y: 0 };
        break;
    }
    
    console.log(`👁️ Eye expression set: ${expression} (pupil: ${this.pupilDilation}, brow: ${this.eyeBrowPosition}, lid: ${this.eyelidPosition})`);
  }

  /**
   * Get weighted selection for eye expressions based on mood
   */
  private getEyeExpressionWeights(): number[] {
    // Returns weights for expression selection based on current mood
    // Implementation would weight expressions higher for current context
    return []; // Simplified - equal weights for now
  }

  /**
   * Weighted random selection
   */
  private weightedRandomSelect(items: string[], weights: number[]): string {
    // If no weights provided, use random selection
    if (weights.length === 0) {
      return items[Math.floor(Math.random() * items.length)];
    }
    
    // Implement weighted selection logic
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) return items[i];
    }
    
    return items[items.length - 1]; // Fallback
  }

  /**
   * Calculate diverse mouth expressions
   */
  private calculateMouthExpressions(time: number): any {
    const expressions: any = {};
    
    // Base breathing rhythm
    const breathPhase = Math.sin(time * 0.8) * 0.5 + 0.5; // 0 to 1
    const breathIntensity = breathPhase * 0.2; // Gentle 0-0.2
    
    // Occasional mouth variations
    const variationCycle = Math.sin(time * 0.15) * 0.5 + 0.5; // Very slow cycle
    const shouldVary = variationCycle > 0.85; // Variation in 15% of time
    
    if (shouldVary) {
      // Subtle smile or mouth movement
      const smileIntensity = Math.sin(time * 2.0) * 0.15; // Quick subtle variation
      expressions.happy = Math.max(0, smileIntensity);
      expressions.aa = breathIntensity * 1.5; // Enhanced breathing during variation
    } else {
      // Normal breathing
      expressions.aa = breathIntensity;
      expressions.happy = 0;
    }
    
    // Additional mouth shapes for diversity
    const oPhase = Math.sin(time * 0.6 + 1.5) * 0.5 + 0.5;
    expressions.oh = oPhase > 0.9 ? (oPhase - 0.9) * 10 * 0.1 : 0; // Occasional 'oh' shape
    
    return expressions;
  }

  /**
   * Calculate advanced eye expressions with 25+ human emotions and smooth transitions
   */
  private calculateEyeExpressions(time: number): any {
    const expressions: any = {};
    
    // Update eye expression timer
    this.eyeExpressionTimer += 0.016; // Assume ~60fps
    
    // Check if current expression duration has ended
    if (this.eyeExpressionTimer >= this.eyeExpressionDuration) {
      // Randomly choose new expression or stay with current
      if (Math.random() < 0.3) { // 30% chance to change expression
        this.chooseRandomEyeExpression();
      }
    }
    
    // Calculate transition progress for smooth blending
    const transitionDuration = 0.8; // 800ms transition
    if (this.eyeExpressionTimer < transitionDuration) {
      this.eyeTransitionProgress = this.eyeExpressionTimer / transitionDuration;
    } else {
      this.eyeTransitionProgress = 1.0; // Fully transitioned
    }
    
    // Apply current eye expression with smooth transition
    const expressionIntensity = this.getExpressionIntensity();
    const smoothIntensity = this.smoothTransition(expressionIntensity, this.eyeTransitionProgress);
    
    // Map eye parameters to VRM expressions
    expressions.happy = this.mapToHappyExpression(smoothIntensity);
    expressions.sad = this.mapToSadExpression(smoothIntensity);
    expressions.angry = this.mapToAngryExpression(smoothIntensity);
    expressions.surprised = this.mapToSurprisedExpression(smoothIntensity);
    expressions.relaxed = this.mapToRelaxedExpression(smoothIntensity);
    
    // Add subtle gaze movements based on expression
    this.updateGazeMovement(time, expressions);
    
    // Add occasional winks for playful expressions
    this.addWinkBehavior(time, expressions);
    
    // Debug output (can be removed in production)
    if (Math.floor(time * 2) !== Math.floor((time - 0.016) * 2)) { // Every 0.5 seconds
      console.log(`👁️ Current eye expression: ${this.currentEyeExpression} (${(smoothIntensity * 100).toFixed(1)}% intensity)`);
    }
    
    return expressions;
  }
  
  /**
   * Get current expression intensity based on type
   */
  private getExpressionIntensity(): number {
    switch(this.currentEyeExpression) {
      case 'excited': 
      case 'surprised': 
        return 0.8; // High intensity
      case 'angry': 
      case 'determined': 
        return 0.7; // Strong intensity
      case 'happy': 
      case 'confident': 
        return 0.6; // Moderate-high intensity
      case 'gentle': 
      case 'loving': 
      case 'curious': 
        return 0.5; // Moderate intensity
      case 'shy': 
      case 'worried': 
      case 'tired': 
        return 0.4; // Subtle intensity
      case 'suspicious': 
      case 'bored': 
        return 0.3; // Low intensity
      case 'dreamy': 
      case 'disappointed': 
        return 0.35; // Low-moderate intensity
      default: 
        return 0.2; // Minimal intensity for normal
    }
  }
  
  /**
   * Smooth transition function for natural blending
   */
  private smoothTransition(targetIntensity: number, progress: number): number {
    // Smooth ease-in-out curve
    const smoothProgress = progress * progress * (3.0 - 2.0 * progress);
    return targetIntensity * smoothProgress;
  }
  
  /**
   * Map current expression to happy VRM expression
   */
  private mapToHappyExpression(intensity: number): number {
    const happyExpressions = ['happy', 'excited', 'confident', 'playful', 'mischievous', 'gentle', 'loving'];
    return happyExpressions.includes(this.currentEyeExpression) ? intensity : 0;
  }
  
  /**
   * Map current expression to sad VRM expression
   */
  private mapToSadExpression(intensity: number): number {
    const sadExpressions = ['sad', 'disappointed', 'worried', 'tired', 'shy'];
    return sadExpressions.includes(this.currentEyeExpression) ? intensity : 0;
  }
  
  /**
   * Map current expression to angry VRM expression
   */
  private mapToAngryExpression(intensity: number): number {
    const angryExpressions = ['angry', 'suspicious', 'stern', 'determined'];
    return angryExpressions.includes(this.currentEyeExpression) ? intensity * 0.8 : 0;
  }
  
  /**
   * Map current expression to surprised VRM expression
   */
  private mapToSurprisedExpression(intensity: number): number {
    const surprisedExpressions = ['surprised', 'excited', 'curious', 'confused'];
    return surprisedExpressions.includes(this.currentEyeExpression) ? intensity : 0;
  }
  
  /**
   * Map current expression to relaxed VRM expression
   */
  private mapToRelaxedExpression(intensity: number): number {
    const relaxedExpressions = ['dreamy', 'gentle', 'tired', 'bored', 'normal'];
    return relaxedExpressions.includes(this.currentEyeExpression) ? intensity : 0;
  }
  
  /**
   * Update gaze movement based on current expression
   */
  private updateGazeMovement(time: number, expressions: any) {
    // Update gaze direction gradually
    const gazeSpeed = 0.02;
    const targetGaze = this.gazeDirection;
    
    // Some expressions have specific gaze behaviors
    switch(this.currentEyeExpression) {
      case 'shy':
        targetGaze.x += (Math.random() - 0.5) * 0.1;
        targetGaze.y = Math.max(-0.3, targetGaze.y - 0.01); // Look down tendency
        break;
      case 'suspicious':
        targetGaze.x = Math.sin(time * 0.3) * 0.2; // Side-to-side scanning
        break;
      case 'dreamy':
        targetGaze.y = 0.2 + Math.sin(time * 0.1) * 0.1; // Upward gaze with drift
        break;
      case 'curious':
        targetGaze.x = Math.sin(time * 0.4) * 0.15; // Active looking around
        targetGaze.y = Math.cos(time * 0.3) * 0.1;
        break;
    }
    
    // Apply gaze smoothly
    expressions.lookLeft = Math.max(0, targetGaze.x) * 0.5;
    expressions.lookRight = Math.max(0, -targetGaze.x) * 0.5;
    expressions.lookUp = Math.max(0, targetGaze.y) * 0.3;
    expressions.lookDown = Math.max(0, -targetGaze.y) * 0.3;
  }
  
  /**
   * Add wink behavior for playful expressions
   */
  private addWinkBehavior(time: number, expressions: any) {
    const winkExpressions = ['playful', 'mischievous', 'flirty', 'confident'];
    
    if (winkExpressions.includes(this.currentEyeExpression)) {
      // Occasional wink (every 8-15 seconds)
      const winkCycle = Math.sin(time * 0.08) * 0.5 + 0.5;
      if (winkCycle > 0.95) { // Rare occurrence
        const winkPhase = (time * 6.0) % (Math.PI * 2);
        expressions.wink = Math.max(0, Math.sin(winkPhase)) * 0.8;
      }
    }
  }

  /**
   * Apply expressions safely to VRM
   */
  private applyVRMExpressions(expressions: any) {
    if (!this.vrm.expressionManager) return;
    
    try {
      // Apply each expression if it exists
      for (const [expressionName, value] of Object.entries(expressions)) {
        // Try common variations of expression names
        const possibleNames = [
          expressionName,
          expressionName.toLowerCase(),
          expressionName.toUpperCase(),
          expressionName.charAt(0).toUpperCase() + expressionName.slice(1)
        ];
        
        for (const name of possibleNames) {
          if (this.vrm.expressionManager.getValue(name) !== undefined) {
            this.vrm.expressionManager.setValue(name, value as number);
            break;
          }
        }
      }
    } catch (error) {
      // Silently handle expression errors
    }
  }

  /**
   * Update periodic facial variations (enhanced version)
   */
  private updatePeriodicFacialVariations() {
    // Use VRM expressions if available
    if (this.vrm.expressionManager) {
      this.addVRMFacialVariations();
    } else {
      // Fallback to manual facial variations
      this.addManualFacialVariations();
    }
  }

  /**
   * Add variations to VRM expressions
   */
  private addVRMFacialVariations() {
    if (!this.vrm.expressionManager) return;
    
    // Occasionally add expression variations
    const random = Math.random();
    
    if (random < 0.3) {
      // Slight happy expression
      try {
        if (this.vrm.expressionManager.getValue('happy') !== undefined) {
          this.vrm.expressionManager.setValue('happy', 0.2 + Math.random() * 0.3);
          setTimeout(() => {
            if (this.vrm.expressionManager) {
              this.vrm.expressionManager.setValue('happy', 0);
            }
          }, 1000 + Math.random() * 2000);
        }
      } catch (e) {}
    }
    
    console.log(`🎭✨ VRM expression variations applied`);
  }

  /**
   * Manual facial variations fallback when VRM expressions unavailable
   */
  private addManualFacialVariations() {
    if (!this.vrm.scene) return;
    
    const random = Math.random();
    
    // Apply slight random facial variations
    this.vrm.scene.traverse((child: any) => {
      if (child.morphTargetDictionary && child.morphTargetInfluences) {
        // Subtle smile variation
        if (child.morphTargetDictionary['happy'] !== undefined && random < 0.3) {
          const index = child.morphTargetDictionary['happy'];
          child.morphTargetInfluences[index] = Math.random() * 0.3;
          
          // Reset after short duration
          setTimeout(() => {
            child.morphTargetInfluences[index] = 0;
          }, 1000 + Math.random() * 2000);
        }
        
        // Subtle surprised variation
        if (child.morphTargetDictionary['surprised'] !== undefined && random > 0.7) {
          const index = child.morphTargetDictionary['surprised'];
          child.morphTargetInfluences[index] = Math.random() * 0.2;
          
          setTimeout(() => {
            child.morphTargetInfluences[index] = 0;
          }, 500 + Math.random() * 1000);
        }
      }
    });
    
    console.log(`🎭✨ Manual facial variations applied`);
  }

  /**
   * Set VRM expression style for specific animation with smooth transitions
   */
  private setVRMExpressionStyle(vrmaName: string, expressionType: string, blinkIntensity: number, mouthIntensity: number) {
    if (!this.vrm.expressionManager) return;

    // Set current facial mood for dynamic expressions
    this.currentFacialMood = expressionType;
    this.facialTransitionPhase = 0; // Start transition

    try {
      // Smooth transition instead of immediate reset
      this.transitionToExpression(expressionType);
      
      console.log(`🎭 VRM expression style applied: ${expressionType} for ${vrmaName}`);

    } catch (error) {
      console.log('⚠️ Could not apply VRM expression style:', error);
    }
  }

  /**
   * Smooth transition to new expression
   */
  private transitionToExpression(expressionType: string) {
    if (!this.vrm.expressionManager) return;

    // Get target expression values based on type
    const targetExpressions = this.getTargetExpression(expressionType);
    
    // Apply with smooth transition (will be handled in update loop)
    for (const [name, value] of Object.entries(targetExpressions)) {
      // Gradual transition over time instead of immediate set
      this.smoothSetExpression(name, value as number, 0.5); // 0.5s transition
    }
  }

  /**
   * Get target expression values for mood
   */
  private getTargetExpression(expressionType: string): any {
    switch (expressionType) {
      case 'energetic':
      case 'joyful':
      case 'cheerful':
        return { happy: 0.35, relaxed: 0.1 };
      
      case 'high_energy':
      case 'excited':
        return { happy: 0.55, surprised: 0.15 };
      
      case 'cute':
      case 'playful':
        return { happy: 0.25, relaxed: 0.15 };
      
      case 'friendly':
      case 'welcoming':
        return { happy: 0.3, relaxed: 0.2 };
      
      case 'focused':
      case 'determined':
      case 'professional':
        return { neutral: 1.0, relaxed: 0.05 };
      
      default:
        return { neutral: 1.0 };
    }
  }

  /**
   * Smooth expression setter with transition
   */
  private smoothSetExpression(expressionName: string, targetValue: number, duration: number) {
    if (!this.vrm.expressionManager) return;

    // Try common variations of expression names
    const possibleNames = [
      expressionName,
      expressionName.toLowerCase(), 
      expressionName.toUpperCase(),
      expressionName.charAt(0).toUpperCase() + expressionName.slice(1)
    ];

    for (const name of possibleNames) {
      if (this.vrm.expressionManager.getValue(name) !== undefined) {
        this.vrm.expressionManager.setValue(name, targetValue);
        console.log(`🎭 Set expression ${name} to ${targetValue}`);
        return; // Successfully applied
      }
    }

    // Fallback to direct morph target if expression manager failed
    this.setDirectMorphTarget(expressionName, targetValue);
  }

  /**
   * Direct morph target setter as fallback
   */
  private setDirectMorphTarget(morphName: string, value: number) {
    if (!this.vrm.scene) return;
    
    this.vrm.scene.traverse((child: any) => {
      if (child.morphTargetDictionary && child.morphTargetInfluences) {
        const index = child.morphTargetDictionary[morphName];
        if (index !== undefined) {
          child.morphTargetInfluences[index] = value;
        }
      }
    });
  }

  /**
   * Get VRMA animation name mapping
   */
  private getVRMAName(type: AnimationType): string | null {
    // Ánh xạ tất cả động tác VRMA có sẵn
    const vrmaMapping: Record<string, string> = {
      'show_full_body': 'show_full_body',
      'greeting': 'greeting', 
      'peace_sign': 'peace_sign',
      'shoot': 'shoot',
      'spin': 'spin',
      'model_pose': 'model_pose',
      'squat': 'squat',
      'dance': 'nhung_ngay_mau_huou',
      'nhung_ngay_mau_huou': 'nhung_ngay_mau_huou',
      'bling_bang_bang_born': 'bling_bang_bang_born',
      'aiaiai': 'aiaiai',
      'batlayemgiua_canhdongluamachnon': 'batlayemgiua_canhdongluamachnon',
      'tetris': 'tetris',
      'shikairodeizu': 'shikairodeizu',
      'funfunwandafurudays': 'funfunwandafurudays',
      'katanapikurisasunotemasongu2023': 'katanapikurisasunotemasongu2023',
      'thankful': 'thankful',
    };
    return vrmaMapping[type] || null;
  }

  /**
   * Play universal animation (any format) if available
   */
  private playUniversalAnimation(type: AnimationType, duration: number): boolean {
    // Map animation type to possible animation names
    const animationMappings = this.getAnimationMappings(type);
    
    for (const animName of animationMappings) {
      const animData = this.allAnimations.get(animName);
      if (animData && animData.clips.length > 0) {
        return this.playAnimationClip(animData.clips[0], animData.format, duration);
      }
    }
    
    return false; // No animation found
  }

  /**
   * Get possible animation names for a given type
   */
  private getAnimationMappings(type: AnimationType): string[] {
    const mappings: Record<AnimationType, string[]> = {
      'show_full_body': ['show_full_body', 'full_body', 'pose'],
      'wave': ['greeting', 'wave', 'hello', 'hi'],
      'peace': ['peace_sign', 'peace', 'v_sign'],
      'peace_sign': ['peace_sign', 'peace', 'v_sign'],
      'point': ['shoot', 'point', 'aim'],
      'dance': ['nhung_ngay_mau_huou', 'aiaiai', 'bling', 'dance', 'dancing'],
      'stand': ['model_pose', 'stand', 'idle_pose'],
      'sit': ['squat', 'sit', 'crouch'],
      'spin': ['spin', 'turn', 'rotate'],
      'idle': ['idle', 'default'],
      'walk': ['walk', 'walking'],
      'run': ['run', 'running'],
      'jump': ['jump', 'leap'],
      'talk': ['talk', 'speaking'],
      'happy': ['happy', 'joy', 'smile'],
      'sad': ['sad', 'cry', 'disappointed'],
      'surprised': ['surprised', 'shock', 'amazed'],
      'thinking': ['thinking', 'ponder', 'contemplating'],
      'clap': ['clap', 'applause'],
      'nod': ['nod', 'yes'],
      'shake': ['shake', 'no'],
      'thumbs_up': ['thumbs_up', 'good', 'like'],
      'bow': ['bow', 'greeting'],
      'greeting': ['greeting', 'hello', 'hi'],
      'shoot': ['shoot', 'point', 'aim'],
      'model_pose': ['model_pose', 'pose'],
      'squat': ['squat', 'crouch'],
      'nhung_ngay_mau_huou': ['nhung_ngay_mau_huou', 'deer'],
      'bling_bang_bang_born': ['bling_bang_bang_born', 'bling'],
      'aiaiai': ['aiaiai'],
      'batlayemgiua_canhdongluamachnon': ['batlayemgiua_canhdongluamachnon'],
      'tetris': ['tetris'],
      'shikairodeizu': ['shikairodeizu'],
      'funfunwandafurudays': ['funfunwandafurudays'],
      'katanapikurisasunotemasongu2023': ['katanapikurisasunotemasongu2023'],
      'thankful': ['thankful', 'thanks', 'grateful']
    };
    
    return mappings[type] || [type];
  }

  /**
   * Play a specific animation clip with format awareness
   */
  private playAnimationClip(clip: THREE.AnimationClip, format: string, duration: number): boolean {
    console.log(`Playing ${format.toUpperCase()} animation: ${clip.name}`);

    // Stop current animation
    if (this.currentAction) {
      this.currentAction.fadeOut(0.3);
    }

    // Configure clip based on format and type
    let processedClip = clip;
    
    if (format === 'fbx' || format === 'gltf' || format === 'glb') {
      // For FBX/GLTF, we may need to filter certain tracks
      processedClip = this.preprocessNonVRMAClip(clip);
    }

    const action = this.mixer.clipAction(processedClip);
    
    // Determine looping behavior
    const isLooping = this.shouldLoopAnimation(clip.name);
    
    if (isLooping) {
      action.setLoop(THREE.LoopRepeat, Infinity);
    } else {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    }

    action.reset().fadeIn(0.3).play();
    this.currentAction = action;

    console.log(`[AnimationController] Playing ${format}: ${clip.name}, duration: ${clip.duration}s, loop: ${isLooping}`);

    return true;
  }

  /**
   * Preprocess non-VRMA clips (FBX/GLTF) to filter problematic tracks
   */
  private preprocessNonVRMAClip(clip: THREE.AnimationClip): THREE.AnimationClip {
    const filteredTracks = clip.tracks.filter(track => {
      // Keep quaternion (rotation) tracks
      if (track.name.includes('.quaternion')) return true;
      
      // Keep morph target influences
      if (track.name.includes('.morphTargetInfluences')) return true;
      
      // Filter position tracks - only keep for specific bones
      if (track.name.includes('.position')) {
        const boneName = track.name.split('.')[0];
        // Only keep root/hips position for locomotion
        if (boneName.toLowerCase().includes('hip') || 
            boneName.toLowerCase().includes('root') ||
            boneName.toLowerCase().includes('pelvis')) {
          return true;
        } else {
          console.warn(`Filtering position track: ${track.name}`);
          return false;
        }
      }
      
      return true;
    });

    return new THREE.AnimationClip(
      clip.name,
      clip.duration,
      filteredTracks
    );
  }

  /**
   * Determine if animation should loop based on name/type
   */
  private shouldLoopAnimation(animationName: string): boolean {
    // Sync with playVRMAAnimation logic
    const danceAnimations = ['nhung_ngay_mau_huou', 'aiaiai', 'bling', 'batlayemgiua_canhdongluamachnon', 'tetris', 'shikairodeizu', 'funfunwandafurudays'];
    const continuousAnimations = ['idle', 'walk', 'talk', 'run']; // Only truly continuous
    
    const isDance = danceAnimations.some(anim => animationName.includes(anim));
    const isContinuous = continuousAnimations.some(anim => animationName.includes(anim));
    
    return isDance || isContinuous;
  }

  /**
   * Play VRMA animation if available (legacy method - kept for compatibility)
   */
  private playVRMAAnimation(vrmaName: string, duration: number): boolean {
    const clips = this.vrmaClips.get(vrmaName);
    if (!clips || clips.length === 0) {
      return false;
    }

    console.log(`Playing VRMA animation: ${vrmaName}`);

    // Stop current animation
    if (this.currentAction) {
      this.currentAction.fadeOut(0.3);
    }

    // Play the first clip from VRMA
    const clip = clips[0];


    // Giữ lại position track cho các động tác đặc biệt, còn lại loại bỏ
    const keepPositionFor = ['show_full_body', 'model_pose', 'squat'];
    const filteredTracks = clip.tracks.filter(track => {
      if (track.name.includes('.quaternion')) return true;
      if (track.name.includes('.morphTargetInfluences')) return true;
      if (track.name.includes('.position')) {
        if (keepPositionFor.includes(vrmaName)) {
          return true;
        } else {
          console.warn(`Filtering out position track: ${track.name}`);
          return false;
        }
      }
      return true;
    });

    const filteredClip = new THREE.AnimationClip(
      clip.name,
      clip.duration,
      filteredTracks
    );

    const action = this.mixer.clipAction(filteredClip);

    // Configure action based on animation type
    // Define which animations should loop vs one-shot
    const danceAnimations = ['nhung_ngay_mau_huou', 'aiaiai', 'bling', 'batlayemgiua_canhdongluamachnon', 'tetris', 'shikairodeizu', 'funfunwandafurudays'];
    const continuousAnimations = ['idle', 'walk', 'talk', 'run']; // Only truly continuous animations
    const gestureAnimations = ['show_full_body', 'greeting', 'peace_sign', 'shoot', 'spin', 'squat', 'thankful', 'model_pose']; // One-shot gestures + poses
    
    // Priority: Dance > Gesture > Continuous (fixed order)
    const isDance = danceAnimations.some(anim => vrmaName.includes(anim));
    const isGesture = gestureAnimations.some(anim => vrmaName.includes(anim));
    const isContinuous = continuousAnimations.some(anim => vrmaName.includes(anim));

    if (isDance) {
      // Dance animations: Loop vô hạn (chỉ dừng khi có lệnh stop)
      action.setLoop(THREE.LoopRepeat, Infinity);
      console.log(`🔄 Dance animation (auto-loop): ${vrmaName}`);
    } else if (isContinuous) {
      // Continuous animations: Loop vô hạn cho idle, walk, run
      action.setLoop(THREE.LoopRepeat, Infinity);
      console.log(`� Continuous animation (auto-loop): ${vrmaName}`);
    } else {
      // Gestures & Poses: Play once and hold last frame (LoopOnce)
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      console.log(`👋 One-shot animation (hold frame): ${vrmaName}`);
    }

    // QUAN TRỌNG: Reset action về đầu trước khi play
    // Điều này đảm bảo animation luôn bắt đầu từ frame 0
    action.reset();
    
    // Fade in mượt mà (0.3s thay vì 0.5s để responsive hơn)
    action.fadeIn(0.3);
    
    // Play animation
    action.play();
    
    this.currentAction = action;

    // Apply comprehensive facial expressions for ALL VRMA animations
    this.setVRMAFacialStyle(vrmaName);
    
    // Apply dynamic facial patterns for enhanced realism
    this.createDynamicFacialPatterns(vrmaName);

    const isLooping = this.shouldLoopAnimation(vrmaName);
    console.log(`[AnimationController] Playing: ${vrmaName}, duration: ${clip.duration}s, loop: ${isLooping}`);

    return true;
  }

  /**
   * Play animation by type with universal format support
   */
  playAnimation(type: AnimationType, duration: number = 1.0) {
    // 🔍 DEBUG: Track all animation calls, especially model_pose
    const timestamp = new Date().toISOString().substring(11, 23); // HH:MM:SS.mmm
    console.log(`[${timestamp}] 🎭 playAnimation("${type}", ${duration}) called`);
    if (type === 'model_pose') {
      console.log(`[${timestamp}] ⚠️ MODEL_POSE called - Stack trace:`, new Error().stack);
    }
    
    // Try to play any available animation format first
    if (this.playUniversalAnimation(type, duration)) {
      return; // Animation played successfully
    }

    // Legacy: Try VRMA first (backward compatibility)
    const vrmaName = this.getVRMAName(type);
    if (vrmaName && this.playVRMAAnimation(vrmaName, duration)) {
      if (vrmaName === 'model_pose' && this.idleAnimation) {
        this.idleAnimation.stop();
      }
      return; // VRMA animation played successfully
    }

    // Nếu là 'dance' mà không có VRMA thì KHÔNG fallback procedural, chỉ play nếu có VRMA
    if (type === 'dance') {
      console.warn('Không tìm thấy VRMA nhảy_nhót.vrma, không play procedural dance!');
      return;
    }

    // Fallback to procedural animations cho các động tác khác
    console.log(`Playing procedural animation: ${type}`);
    // ...existing code...
  }

  /**
   * Play show full body animation (fallback)
   */
  private playShowFullBody(duration: number) {
    const hips = this.vrm.humanoid?.getNormalizedBoneNode('hips');
    const leftArm = this.vrm.humanoid?.getNormalizedBoneNode('leftUpperArm');
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');

    if (!hips || !leftArm || !rightArm) return;

    const times = [0, duration * 0.5, duration];
    const armValues = [
      0, 0, 0, 1,
      0, 0, -0.4, 0.914,
      0, 0, 0, 1,
    ];

    const leftArmTrack = new THREE.QuaternionKeyframeTrack(
      leftArm.name + '.quaternion',
      times,
      armValues
    );
    const rightArmTrack = new THREE.QuaternionKeyframeTrack(
      rightArm.name + '.quaternion',
      times,
      armValues
    );

    const clip = new THREE.AnimationClip('show_full_body', duration, [leftArmTrack, rightArmTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().fadeIn(0.3).play();
    this.currentAction = action;

    // Sau khi show_full_body, nếu có model_pose thì play lại pose mẫu, ngược lại mới play idle
    // Không trả về idle gốc sau show_full_body, giữ nguyên khung hình cuối cùng
  }

  /**
   * Play spin animation (fallback)
   */
  private playSpin(duration: number) {
    const hips = this.vrm.humanoid?.getNormalizedBoneNode('hips');
    if (!hips) return;

    const times = [0, duration];
    const values = [
      0, 0, 0, 1,
      0, 1, 0, 0,
    ];

    const track = new THREE.QuaternionKeyframeTrack(
      hips.name + '.quaternion',
      times,
      values
    );

    const clip = new THREE.AnimationClip('spin', duration, [track]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().fadeIn(0.3).play();
    this.currentAction = action;

  // Không trả về idle gốc sau spin, giữ nguyên khung hình cuối cùng
  }

  /**
   * Play model pose animation (fallback)
   */
  private playModelPose(duration: number) {
    const leftArm = this.vrm.humanoid?.getNormalizedBoneNode('leftUpperArm');
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
    const leftHand = this.vrm.humanoid?.getNormalizedBoneNode('leftHand');
    const rightHand = this.vrm.humanoid?.getNormalizedBoneNode('rightHand');

    if (!leftArm || !rightArm || !leftHand || !rightHand) return;

    const times = [0, duration];
    const leftArmValues = [
      0, 0, 0, 1,
      0, 0, -0.3, 0.954,
    ];
    const rightArmValues = [
      0, 0, 0, 1,
      0, 0, 0.3, 0.954,
    ];
    const handValues = [
      0, 0, 0, 1,
      0, 0, 0.2, 0.98,
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
    const leftHandTrack = new THREE.QuaternionKeyframeTrack(
      leftHand.name + '.quaternion',
      times,
      handValues
    );
    const rightHandTrack = new THREE.QuaternionKeyframeTrack(
      rightHand.name + '.quaternion',
      times,
      handValues
    );

    const clip = new THREE.AnimationClip('model_pose', duration, [leftArmTrack, rightArmTrack, leftHandTrack, rightHandTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().fadeIn(0.3).play();
    this.currentAction = action;

  // Không trả về idle gốc sau pose mẫu, giữ nguyên khung hình cuối cùng
  }

  /**
   * Play squat animation (fallback)
   */
  private playSquat(duration: number) {
    const hips = this.vrm.humanoid?.getNormalizedBoneNode('hips');
    const leftLeg = this.vrm.humanoid?.getNormalizedBoneNode('leftUpperLeg');
    const rightLeg = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperLeg');

    if (!hips || !leftLeg || !rightLeg) return;

    const times = [0, duration * 0.5, duration];
    const hipValues = [
      0, 0, 0, 1,
      0.5, 0, 0, 0.866,
      0, 0, 0, 1,
    ];
    const legValues = [
      0, 0, 0, 1,
      0.7, 0, 0, 0.714,
      0, 0, 0, 1,
    ];

    const hipTrack = new THREE.QuaternionKeyframeTrack(
      hips.name + '.quaternion',
      times,
      hipValues
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

    const clip = new THREE.AnimationClip('squat', duration, [hipTrack, leftLegTrack, rightLegTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().fadeIn(0.3).play();
    this.currentAction = action;

    setTimeout(() => this.playIdle(), duration * 1000);
  }

  /**
   * Play idle animation
   */
  private playIdle() {
    if (this.idleAnimation) {
      try {
        this.idleAnimation.reset().fadeIn(0.5).play();
        this.currentAction = this.idleAnimation;
      } catch (err) {
        console.warn('Idle animation exists but failed to play:', err);
      }
    } else {
      // Nếu chưa có idleAnimation, play model_pose (pose mặc định)
      console.warn('Idle animation is not initialized. Playing default model_pose instead.');
      this.playAnimation('model_pose', 3.0);
    }
  }

  /**
   * Play wave gesture
   */
  private playWave(duration: number) {
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
    // ...existing code...
  }

  /**
   * Play nod gesture
   */
  private playNod(duration: number) {
    const head = this.vrm.humanoid?.getNormalizedBoneNode('head');
    // ...existing code...
  }

  /**
   * Play peace gesture (public)
   */
  public playPeace(duration: number) {
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
    const rightForeArm = this.vrm.humanoid?.getNormalizedBoneNode('rightLowerArm');
    if (!rightArm || !rightForeArm) return;
    const times = [0, duration * 0.2, duration * 0.4, duration * 0.6, duration * 0.8, duration];
    const upperArmValues = [
      0, 0, 0, 1,
      0, 0, -0.3, 0.954,
      0, 0, -0.5, 0.866,
      0, 0, -0.3, 0.954,
      0, 0, -0.5, 0.866,
      0, 0, 0, 1,
    ];
    const foreArmValues = [
      0, 0, 0, 1,
      0, 0, 0, 1,
      0, 0, 0.2, 0.98,
      0, 0, 0, 1,
      0, 0, 0.2, 0.98,
      0, 0, 0, 1,
    ];
    const upperArmTrack = new THREE.QuaternionKeyframeTrack(
      rightArm.name + '.quaternion',
      times,
      upperArmValues
    );
    const foreArmTrack = new THREE.QuaternionKeyframeTrack(
      rightForeArm.name + '.quaternion',
      times,
      foreArmValues
    );
    const clip = new THREE.AnimationClip('peace', duration, [upperArmTrack, foreArmTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().fadeIn(0.4).play();
    this.currentAction = action;
    setTimeout(() => this.playIdle(), duration * 1000);
  }

  /**
   * Play shoot gesture (public)
   */
  public playShoot(duration: number) {
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
    const rightHand = this.vrm.humanoid?.getNormalizedBoneNode('rightHand');
    if (!rightArm || !rightHand) return;
    
    console.log('🔫 Playing shoot gesture');
    
    const times = [0, duration * 0.3, duration * 0.6, duration];
    const armValues = [
      0, 0, 0, 1,
      -0.4, 0, 0, 0.914,
      -0.4, 0, 0, 0.914,
      0, 0, 0, 1,
    ];
    const handValues = [
      0, 0, 0, 1,
      0, 0, 0.2, 0.98,
      0, 0, 0.3, 0.954,
      0, 0, 0, 1,
    ];
    const armTrack = new THREE.QuaternionKeyframeTrack(
      rightArm.name + '.quaternion',
      times,
      armValues
    );
    const handTrack = new THREE.QuaternionKeyframeTrack(
      rightHand.name + '.quaternion',
      times,
      handValues
    );
    const clip = new THREE.AnimationClip('shoot', duration, [armTrack, handTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().fadeIn(0.3).play();
    this.currentAction = action;
    setTimeout(() => this.playIdle(), duration * 1000);
  }



  /**
   * Play shake head gesture
   */
  private playShake(duration: number) {
    const head = this.vrm.humanoid?.getNormalizedBoneNode('head');
    if (!head) return;

    const times = [0, duration * 0.25, duration * 0.5, duration * 0.75, duration];
    const values = [
      0, 0, 0, 1,
      0, 0.259, 0, 0.966,
      0, 0, 0, 1,
      0, -0.259, 0, 0.966,
      0, 0, 0, 1,
    ];

    const track = new THREE.QuaternionKeyframeTrack(
      head.name + '.quaternion',
      times,
      values
    );

    const clip = new THREE.AnimationClip('shake', duration, [track]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().fadeIn(0.3).play();
    this.currentAction = action;

    setTimeout(() => this.playIdle(), duration * 1000);
  }

  /**
   * Play point gesture
   */
  private playPoint(duration: number) {
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
    if (!rightArm) return;

    const times = [0, duration * 0.5, duration];
    const values = [
      0, 0, 0, 1,
      -0.5, 0, 0, 0.866,
      0, 0, 0, 1,
    ];

    const track = new THREE.QuaternionKeyframeTrack(
      rightArm.name + '.quaternion',
      times,
      values
    );

    const clip = new THREE.AnimationClip('point', duration, [track]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().fadeIn(0.3).play();
    this.currentAction = action;

    setTimeout(() => this.playIdle(), duration * 1000);
  }

  /**
   * Play emotion expression
   */
  public playEmotion(emotion: string, duration: number) {
    const expressionManager = this.vrm.expressionManager;
    if (!expressionManager) return;

    let expressionName: VRMExpressionPresetName;
    
    switch (emotion) {
      case 'happy':
        expressionName = 'happy';
        break;
      case 'sad':
        expressionName = 'sad';
        break;
      case 'surprised':
        expressionName = 'surprised';
        break;
      default:
        expressionName = 'neutral';
    }

    // Set expression
    expressionManager.setValue(expressionName, 1.0);

    // Reset after duration
    setTimeout(() => {
      expressionManager.setValue(expressionName, 0.0);
    }, duration * 1000);
  }

  /**
   * Play walk animation
   */
  private playWalk(duration: number) {
    const leftLeg = this.vrm.humanoid?.getNormalizedBoneNode('leftUpperLeg');
    const rightLeg = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperLeg');
    
    if (!leftLeg || !rightLeg) return;

    const times = [0, duration * 0.5, duration];
    const leftValues = [
      0.5, 0, 0, 0.866,
      -0.5, 0, 0, 0.866,
      0.5, 0, 0, 0.866,
    ];
    const rightValues = [
      -0.5, 0, 0, 0.866,
      0.5, 0, 0, 0.866,
      -0.5, 0, 0, 0.866,
    ];

    const leftTrack = new THREE.QuaternionKeyframeTrack(
      leftLeg.name + '.quaternion',
      times,
      leftValues
    );
    const rightTrack = new THREE.QuaternionKeyframeTrack(
      rightLeg.name + '.quaternion',
      times,
      rightValues
    );

    const clip = new THREE.AnimationClip('walk', duration, [leftTrack, rightTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.reset().fadeIn(0.3).play();
    this.currentAction = action;
  }

  /**
   * Play talk animation (subtle head movement)
   */
  private playTalk(duration: number) {
    const head = this.vrm.humanoid?.getNormalizedBoneNode('head');
    if (!head) return;

    const times = [0, duration * 0.5, duration];
    const values = [
      0, 0, 0, 1,
      0.087, 0, 0, 0.996,
      0, 0, 0, 1,
    ];

    const track = new THREE.QuaternionKeyframeTrack(
      head.name + '.quaternion',
      times,
      values
    );

    const clip = new THREE.AnimationClip('talk', duration, [track]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.reset().fadeIn(0.3).play();
    this.currentAction = action;
  }

  /**
   * Update animation mixer
   */
  update() {
    // Update main body animations
    const delta = this.clock.getDelta();
    this.mixer.update(delta);
    
    // Update VRM expressions (if available)
    if (this.vrm.expressionManager) {
      this.updateVRMFacialExpressions(delta);
      // Ensure VRM expressions are applied
      this.vrm.expressionManager.update();
    }
    
    // Update manual facial animations as fallback
    const facialDelta = this.facialClock.getDelta();
    this.facialMixer.update(facialDelta);
    
    // Apply periodic facial variations
    this.facialVariationTimer += delta;
    if (this.facialVariationTimer >= this.facialVariationInterval) {
      this.updatePeriodicFacialVariations();
      this.facialVariationTimer = 0;
      this.facialVariationInterval = 2.0 + Math.random() * 2.0;
    }
  }

  /**
   * Stop all animations
   */
  stopAll() {
    // Dừng tất cả actions ngay lập tức
    this.mixer.stopAllAction();
    this.currentAction = null;
    
    // Keep facial animations running during body animation stops
    console.log('🎭 Facial animations continue running independently...');
  }

  /**
   * Pause auto mouth expressions (for lip sync)
   */
  pauseAutoMouthExpressions() {
    this.isAutoMouthExpressionsPaused = true;
    console.log('👄 [AnimationController] Auto mouth expressions paused for lip sync');
    
    // MẠNH MẼLER: Reset ALL mouth expressions về 0 ngay lập tức
    if (this.vrm.expressionManager) {
      const expressions = this.vrm.expressionManager;
      // Reset tất cả mouth expressions có thể
      const allMouthExpressions = ['aa', 'ih', 'ou', 'ee', 'oh', 'pp', 'ff', 'dd', 'nn', 'rr', 'ss', 'ch', 'kk', 
                                    'mouth_a', 'mouth_i', 'mouth_u', 'mouth_e', 'mouth_o', 'happy', 'surprised', 'sad'];
      allMouthExpressions.forEach(exp => {
        try {
          expressions.setValue(exp as any, 0);
        } catch (e) {
          // Expression không tồn tại, bỏ qua
        }
      });
      
      // Đảm bảo expressions được áp dụng ngay
      expressions.update();
      console.log('👄 [AnimationController] Forcefully reset all mouth expressions to 0');
    }
  }

  /**
   * Resume auto mouth expressions (after lip sync)
   */
  resumeAutoMouthExpressions() {
    this.isAutoMouthExpressionsPaused = false;
    console.log('👄 [AnimationController] Auto mouth expressions resumed after lip sync');
  }

  /**
   * Stop facial animations (if needed)
   */
  stopFacialAnimations() {
    if (this.blinkAction) {
      this.blinkAction.stop();
    }
    if (this.mouthAction) {
      this.mouthAction.stop();
    }
    console.log('🎭 Facial animations stopped');
  }

  /**
   * Restart facial animations
   */
  restartFacialAnimations() {
    if (this.blinkAction) {
      this.blinkAction.play();
    }
    if (this.mouthAction) {
      this.mouthAction.play();
    }
    console.log('🎭 Facial animations restarted');
  }

  /**
   * Set facial animation intensity (for dance mode)
   */
  setFacialIntensity(blinkIntensity: number = 1.0, mouthIntensity: number = 0.5) {
    if (this.blinkAction) {
      this.blinkAction.weight = blinkIntensity;
    }
    if (this.mouthAction) {
      this.mouthAction.weight = mouthIntensity;
    }
    console.log(`🎭 Facial intensity set - Blink: ${blinkIntensity}, Mouth: ${mouthIntensity}`);
  }

  /**
   * Create comprehensive facial expressions for ALL VRMA animations
   */
  setVRMAFacialStyle(vrmaName: string) {
    let blinkIntensity = 1.0;
    let mouthIntensity = 0.5;
    let timeScale = 1.0;
    let expressionType = 'neutral';

    switch (vrmaName) {
      // === DANCE ANIMATIONS ===
      case 'nhung_ngay_mau_huou':
        blinkIntensity = 1.1;
        mouthIntensity = 0.6;
        timeScale = 1.1;
        expressionType = 'energetic';
        break;
      case 'bling_bang_bang_born':
        blinkIntensity = 1.3;
        mouthIntensity = 0.8;
        timeScale = 1.2;
        expressionType = 'high_energy';
        break;
      case 'aiaiai':
        blinkIntensity = 1.2;
        mouthIntensity = 0.7;
        timeScale = 1.0;
        expressionType = 'rhythmic';
        break;
      case 'tetris':
        blinkIntensity = 1.0;
        mouthIntensity = 0.5;
        timeScale = 0.9;
        expressionType = 'focused';
        break;
      case 'shikairodeizu':
        blinkIntensity = 1.1;
        mouthIntensity = 0.6;
        timeScale = 1.05;
        expressionType = 'playful';
        break;
      case 'funfunwandafurudays':
        blinkIntensity = 1.2;
        mouthIntensity = 0.7;
        timeScale = 1.15;
        expressionType = 'joyful';
        break;
      case 'batlayemgiua_canhdongluamachnon':
        blinkIntensity = 1.1;
        mouthIntensity = 0.6;
        timeScale = 1.0;
        expressionType = 'flowing';
        break;

      // === GESTURE ANIMATIONS ===
      case 'show_full_body':
        blinkIntensity = 0.9;
        mouthIntensity = 0.4;
        timeScale = 0.8;
        expressionType = 'confident';
        break;
      case 'greeting':
        blinkIntensity = 1.1;
        mouthIntensity = 0.6;
        timeScale = 1.1;
        expressionType = 'friendly';
        break;
      case 'peace_sign':
        blinkIntensity = 1.2;
        mouthIntensity = 0.5;
        timeScale = 1.0;
        expressionType = 'cute';
        break;
      case 'shoot':
        blinkIntensity = 0.8;
        mouthIntensity = 0.3;
        timeScale = 0.7;
        expressionType = 'focused';
        break;
      case 'spin':
        blinkIntensity = 1.1;
        mouthIntensity = 0.4;
        timeScale = 1.3;
        expressionType = 'dizzy';
        break;
      case 'model_pose':
        blinkIntensity = 0.9;
        mouthIntensity = 0.3;
        timeScale = 0.8;
        expressionType = 'professional';
        break;
      case 'squat':
        blinkIntensity = 1.0;
        mouthIntensity = 0.4;
        timeScale = 0.9;
        expressionType = 'determined';
        break;

      // === DEFAULT ===
      default:
        blinkIntensity = 1.0;
        mouthIntensity = 0.5;
        timeScale = 1.0;
        expressionType = 'neutral';
    }

    // Apply settings to manual facial system
    this.setFacialIntensity(blinkIntensity, mouthIntensity);
    
    // Adjust animation speed for manual system
    if (this.blinkAction) {
      this.blinkAction.timeScale = timeScale;
    }
    if (this.mouthAction) {
      this.mouthAction.timeScale = timeScale;
    }
    
    // Also apply to VRM expression system if available
    this.setVRMExpressionStyle(vrmaName, expressionType, blinkIntensity, mouthIntensity);
    
    console.log(`🎭 VRMA facial style set for ${vrmaName}: ${expressionType} (blink=${blinkIntensity}, mouth=${mouthIntensity}, speed=${timeScale})`);
  }

  /**
   * Create dynamic facial patterns during looping animations
   */
  createDynamicFacialPatterns(vrmaName: string) {
    if (!this.blinkAction || !this.mouthAction) return;

    // Create varied patterns for different animation types
    const patterns = this.getFacialPatternForAnimation(vrmaName);
    
    // Update blink timing with variation
    if (patterns.blinkVariation && this.blinkAction) {
      this.updateBlinkPattern(patterns.blinkVariation);
    }
    
    // Update mouth movement with emotion
    if (patterns.mouthEmotion && this.mouthAction) {
      this.updateMouthPattern(patterns.mouthEmotion);
    }
    
    console.log(`🎭✨ Dynamic facial patterns applied for ${vrmaName}:`, patterns);
  }

  /**
   * Get facial pattern configuration for specific animation
   */
  private getFacialPatternForAnimation(vrmaName: string) {
    const patterns: any = {
      blinkVariation: 'normal',
      mouthEmotion: 'neutral'
    };

    switch (vrmaName) {
      // Dance patterns - energetic
      case 'nhung_ngay_mau_huou':
      case 'shikairodeizu':
        patterns.blinkVariation = 'cute';
        patterns.mouthEmotion = 'happy';
        break;
      case 'bling_bang_bang_born':
        patterns.blinkVariation = 'excited';
        patterns.mouthEmotion = 'energetic';
        break;
      case 'aiaiai':
        patterns.blinkVariation = 'rhythmic';
        patterns.mouthEmotion = 'cool';
        break;
      case 'tetris':
        patterns.blinkVariation = 'focused';
        patterns.mouthEmotion = 'concentrated';
        break;
      case 'funfunwandafurudays':
        patterns.blinkVariation = 'joyful';
        patterns.mouthEmotion = 'cheerful';
        break;

      // Gesture patterns - expressive
      case 'greeting':
        patterns.blinkVariation = 'friendly';
        patterns.mouthEmotion = 'welcoming';
        break;
      case 'peace_sign':
        patterns.blinkVariation = 'playful';
        patterns.mouthEmotion = 'cute';
        break;
      case 'shoot':
        patterns.blinkVariation = 'sharp';
        patterns.mouthEmotion = 'determined';
        break;
      case 'show_full_body':
        patterns.blinkVariation = 'confident';
        patterns.mouthEmotion = 'poised';
        break;
      case 'model_pose':
        patterns.blinkVariation = 'elegant';
        patterns.mouthEmotion = 'professional';
        break;
      case 'squat':
        patterns.blinkVariation = 'effort';
        patterns.mouthEmotion = 'focused';
        break;
      case 'spin':
        patterns.blinkVariation = 'dizzy';
        patterns.mouthEmotion = 'surprised';
        break;
      
      default:
        patterns.blinkVariation = 'normal';
        patterns.mouthEmotion = 'neutral';
    }

    return patterns;
  }

  /**
   * Update blink pattern based on emotion/state
   */
  private updateBlinkPattern(variation: string) {
    if (!this.blinkAction) return;

    let intensity = 1.0;
    let speed = 1.0;

    switch (variation) {
      case 'cute':
        intensity = 1.2;
        speed = 1.1;
        break;
      case 'excited':
        intensity = 1.4;
        speed = 1.3;
        break;
      case 'focused':
        intensity = 0.8;
        speed = 0.8;
        break;
      case 'joyful':
        intensity = 1.3;
        speed = 1.2;
        break;
      case 'friendly':
        intensity = 1.1;
        speed = 1.0;
        break;
      case 'playful':
        intensity = 1.2;
        speed = 1.1;
        break;
      case 'sharp':
        intensity = 0.9;
        speed = 0.9;
        break;
      case 'confident':
        intensity = 0.9;
        speed = 0.9;
        break;
      case 'elegant':
        intensity = 0.8;
        speed = 0.8;
        break;
      case 'effort':
        intensity = 1.1;
        speed = 0.9;
        break;
      case 'dizzy':
        intensity = 1.0;
        speed = 1.4; // Fast, erratic blinking
        break;
      case 'rhythmic':
        intensity = 1.1;
        speed = 1.0;
        break;
      default:
        intensity = 1.0;
        speed = 1.0;
    }

    this.blinkAction.weight = intensity;
    this.blinkAction.timeScale = speed;
  }

  /**
   * Update mouth pattern based on emotion/state
   */
  private updateMouthPattern(emotion: string) {
    if (!this.mouthAction) return;

    let intensity = 0.5;
    let speed = 1.0;

    switch (emotion) {
      case 'happy':
        intensity = 0.7;
        speed = 1.1;
        break;
      case 'energetic':
        intensity = 0.8;
        speed = 1.3;
        break;
      case 'cool':
        intensity = 0.6;
        speed = 1.0;
        break;
      case 'concentrated':
        intensity = 0.4;
        speed = 0.9;
        break;
      case 'cheerful':
        intensity = 0.8;
        speed = 1.2;
        break;
      case 'welcoming':
        intensity = 0.6;
        speed = 1.0;
        break;
      case 'cute':
        intensity = 0.5;
        speed = 1.0;
        break;
      case 'determined':
        intensity = 0.4;
        speed = 0.8;
        break;
      case 'poised':
        intensity = 0.3;
        speed = 0.8;
        break;
      case 'professional':
        intensity = 0.3;
        speed = 0.8;
        break;
      case 'focused':
        intensity = 0.4;
        speed = 0.9;
        break;
      case 'surprised':
        intensity = 0.6;
        speed = 1.2;
        break;
      default:
        intensity = 0.5;
        speed = 1.0;
    }

    this.mouthAction.weight = intensity;
    this.mouthAction.timeScale = speed;
  }

  /**
   * Add subtle random variations to facial expressions over time
   * Call this periodically to make expressions more lifelike
   */
  addFacialVariations() {
    if (!this.blinkAction || !this.mouthAction) return;

    // Add subtle random variations (±10%)
    const blinkVariation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    const mouthVariation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    const timeVariation = 0.95 + Math.random() * 0.1; // 0.95 to 1.05

    // Apply subtle variations
    const currentBlinkWeight = this.blinkAction.weight;
    const currentMouthWeight = this.mouthAction.weight;
    const currentTimeScale = this.blinkAction.timeScale;

    this.blinkAction.weight = Math.min(1.5, currentBlinkWeight * blinkVariation);
    this.mouthAction.weight = Math.min(1.0, currentMouthWeight * mouthVariation);
    this.blinkAction.timeScale = currentTimeScale * timeVariation;
    this.mouthAction.timeScale = currentTimeScale * timeVariation;

    console.log(`🎭~ Facial variations applied: blink=${this.blinkAction.weight.toFixed(2)}, mouth=${this.mouthAction.weight.toFixed(2)}`);
  }

  /**
   * Reset facial expressions to base values
   */
  resetFacialExpressions() {
    if (this.blinkAction) {
      this.blinkAction.weight = 1.0;
      this.blinkAction.timeScale = 1.0;
    }
    if (this.mouthAction) {
      this.mouthAction.weight = 0.5;
      this.mouthAction.timeScale = 1.0;
    }
    console.log(`🎭 Facial expressions reset to defaults`);
  }

  /**
   * Play jump animation
   */
  private playJump(duration: number) {
    const hips = this.vrm.humanoid?.getNormalizedBoneNode('hips');
    const leftLeg = this.vrm.humanoid?.getNormalizedBoneNode('leftUpperLeg');
    const rightLeg = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperLeg');
    const leftArm = this.vrm.humanoid?.getNormalizedBoneNode('leftUpperArm');
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');

    if (!hips || !leftLeg || !rightLeg || !leftArm || !rightArm) return;

    // More keyframes for smoother animation
    const times = [0, duration * 0.15, duration * 0.3, duration * 0.5, duration * 0.7, duration * 0.85, duration];
    const hipValues = [
      0, 0, 0, 1,           // Start
      0, 0, 0.05, 1,         // Crouch
      0, 0, 0.15, 1,         // Jump up
      0, 0, 0.25, 1,         // Peak
      0, 0, 0.15, 1,         // Fall down
      0, 0, 0.05, 1,         // Land
      0, 0, 0, 1,            // End
    ];
    const legValues = [
      0, 0, 0, 1,            // Start
      0.1, 0, 0, 0.995,      // Crouch
      0.2, 0, 0, 0.98,       // Jump
      0.3, 0, 0, 0.954,      // Peak
      0.2, 0, 0, 0.98,       // Fall
      0.1, 0, 0, 0.995,      // Land
      0, 0, 0, 1,            // End
    ];
    const armValues = [
      0, 0, 0, 1,            // Start
      -0.1, 0, 0, 0.995,     // Crouch
      -0.2, 0, 0, 0.98,      // Jump
      -0.3, 0, 0, 0.954,     // Peak
      -0.2, 0, 0, 0.98,      // Fall
      -0.1, 0, 0, 0.995,     // Land
      0, 0, 0, 1,            // End
    ];

    const hipTrack = new THREE.QuaternionKeyframeTrack(
      hips.name + '.quaternion',
      times,
      hipValues
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
    const leftArmTrack = new THREE.QuaternionKeyframeTrack(
      leftArm.name + '.quaternion',
      times,
      armValues
    );
    const rightArmTrack = new THREE.QuaternionKeyframeTrack(
      rightArm.name + '.quaternion',
      times,
      armValues.map(v => -v)
    );

    const clip = new THREE.AnimationClip('jump', duration, [hipTrack, leftLegTrack, rightLegTrack, leftArmTrack, rightArmTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().fadeIn(0.5).play();
    this.currentAction = action;

    setTimeout(() => this.playIdle(), duration * 1000);
  }

  /**
   * Play run animation
   */
  private playRun(duration: number) {
    const leftLeg = this.vrm.humanoid?.getNormalizedBoneNode('leftUpperLeg');
    const rightLeg = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperLeg');
    const leftArm = this.vrm.humanoid?.getNormalizedBoneNode('leftUpperArm');
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
    const hips = this.vrm.humanoid?.getNormalizedBoneNode('hips');

    if (!leftLeg || !rightLeg || !leftArm || !rightArm || !hips) return;

    // More keyframes for smoother running motion
    const times = [0, duration * 0.2, duration * 0.4, duration * 0.6, duration * 0.8, duration];
    const legValues = [
      0, 0, 0, 1,           // Start
      0.6, 0, 0, 0.816,     // Forward swing
      0, 0, 0, 1,           // Mid
      -0.4, 0, 0, 0.914,    // Back swing
      0, 0, 0, 1,           // Mid
      0.6, 0, 0, 0.816,     // Forward swing
    ];
    const armValues = [
      0, 0, 0, 1,           // Start
      -0.4, 0, 0, 0.914,    // Back swing
      0, 0, 0, 1,           // Mid
      0.4, 0, 0, 0.914,     // Forward swing
      0, 0, 0, 1,           // Mid
      -0.4, 0, 0, 0.914,    // Back swing
    ];
    const hipValues = [
      0, 0, 0, 1,           // Start
      0, 0, 0.05, 1,        // Slight bounce
      0, 0, 0, 1,           // Mid
      0, 0, 0.05, 1,        // Bounce
      0, 0, 0, 1,           // Mid
      0, 0, 0.05, 1,        // Bounce
    ];

    const leftLegTrack = new THREE.QuaternionKeyframeTrack(
      leftLeg.name + '.quaternion',
      times,
      legValues
    );
    const rightLegTrack = new THREE.QuaternionKeyframeTrack(
      rightLeg.name + '.quaternion',
      times,
      legValues.map((v, i) => i % 2 === 0 ? v : -v)
    );
    const leftArmTrack = new THREE.QuaternionKeyframeTrack(
      leftArm.name + '.quaternion',
      times,
      armValues
    );
    const rightArmTrack = new THREE.QuaternionKeyframeTrack(
      rightArm.name + '.quaternion',
      times,
      armValues.map((v, i) => i % 2 === 0 ? v : -v)
    );
    const hipTrack = new THREE.QuaternionKeyframeTrack(
      hips.name + '.quaternion',
      times,
      hipValues
    );

    const clip = new THREE.AnimationClip('run', duration, [leftLegTrack, rightLegTrack, leftArmTrack, rightArmTrack, hipTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.reset().fadeIn(0.5).play();
    this.currentAction = action;
  }

  /**
   * Play dance animation
   */
  private playDance(duration: number) {
    const hips = this.vrm.humanoid?.getNormalizedBoneNode('hips');
    const leftArm = this.vrm.humanoid?.getNormalizedBoneNode('leftUpperArm');
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
    const leftLeg = this.vrm.humanoid?.getNormalizedBoneNode('leftUpperLeg');
    const rightLeg = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperLeg');

    if (!hips || !leftArm || !rightArm || !leftLeg || !rightLeg) return;

    // More complex dance with multiple keyframes for smoother motion
    const times = [0, duration * 0.2, duration * 0.4, duration * 0.6, duration * 0.8, duration];
    const hipValues = [
      0, 0, 0, 1,           // Start
      0, 0.15, 0, 0.989,    // Twist left
      0, 0, 0, 1,           // Center
      0, -0.15, 0, 0.989,   // Twist right
      0, 0, 0, 1,           // Center
      0, 0.15, 0, 0.989,    // Twist left
    ];
    const armValues = [
      0, 0, 0, 1,           // Start
      0.4, 0, 0, 0.914,     // Swing up
      0, 0, 0, 1,           // Center
      -0.4, 0, 0, 0.914,    // Swing down
      0, 0, 0, 1,           // Center
      0.4, 0, 0, 0.914,     // Swing up
    ];
    const legValues = [
      0, 0, 0, 1,           // Start
      0.1, 0, 0, 0.995,     // Slight bend
      0, 0, 0, 1,           // Straight
      -0.1, 0, 0, 0.995,    // Slight bend other way
      0, 0, 0, 1,           // Straight
      0.1, 0, 0, 0.995,     // Slight bend
    ];

    const hipTrack = new THREE.QuaternionKeyframeTrack(
      hips.name + '.quaternion',
      times,
      hipValues
    );
    const leftArmTrack = new THREE.QuaternionKeyframeTrack(
      leftArm.name + '.quaternion',
      times,
      armValues
    );
    const rightArmTrack = new THREE.QuaternionKeyframeTrack(
      rightArm.name + '.quaternion',
      times,
      armValues.map(v => -v)
    );
    const leftLegTrack = new THREE.QuaternionKeyframeTrack(
      leftLeg.name + '.quaternion',
      times,
      legValues
    );
    const rightLegTrack = new THREE.QuaternionKeyframeTrack(
      rightLeg.name + '.quaternion',
      times,
      legValues.map(v => -v)
    );

    const clip = new THREE.AnimationClip('dance', duration, [hipTrack, leftArmTrack, rightArmTrack, leftLegTrack, rightLegTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.reset().fadeIn(0.5).play();
    this.currentAction = action;
  }

  /**
   * Play sit animation
   */
  private playSit(duration: number) {
    const hips = this.vrm.humanoid?.getNormalizedBoneNode('hips');
    const leftLeg = this.vrm.humanoid?.getNormalizedBoneNode('leftUpperLeg');
    const rightLeg = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperLeg');

    if (!hips || !leftLeg || !rightLeg) return;

    const times = [0, duration];
    const hipValues = [
      0, 0, 0, 1,
      0.707, 0, 0, 0.707,
    ];
    const legValues = [
      0, 0, 0, 1,
      0.5, 0, 0, 0.866,
    ];

    const hipTrack = new THREE.QuaternionKeyframeTrack(
      hips.name + '.quaternion',
      times,
      hipValues
    );
    const leftTrack = new THREE.QuaternionKeyframeTrack(
      leftLeg.name + '.quaternion',
      times,
      legValues
    );
    const rightTrack = new THREE.QuaternionKeyframeTrack(
      rightLeg.name + '.quaternion',
      times,
      legValues
    );

    const clip = new THREE.AnimationClip('sit', duration, [hipTrack, leftTrack, rightTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().fadeIn(0.3).play();
    this.currentAction = action;

    setTimeout(() => this.playIdle(), duration * 1000);
  }

  /**
   * Play stand animation
   */
  private playStand(duration: number) {
    // Simple stand up animation - reverse of sit
    this.playSit(duration);
  }

  /**
   * Play clap animation
   */
  private playClap(duration: number) {
    const leftArm = this.vrm.humanoid?.getNormalizedBoneNode('leftUpperArm');
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');

    if (!leftArm || !rightArm) return;

    const times = [0, duration * 0.5, duration];
    const armValues = [
      0, 0, 0, 1,
      -0.2, 0, 0, 0.98,
      0, 0, 0, 1,
    ];

    const leftTrack = new THREE.QuaternionKeyframeTrack(
      leftArm.name + '.quaternion',
      times,
      armValues
    );
    const rightTrack = new THREE.QuaternionKeyframeTrack(
      rightArm.name + '.quaternion',
      times,
      armValues.map(v => -v)
    );

    const clip = new THREE.AnimationClip('clap', duration, [leftTrack, rightTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().fadeIn(0.3).play();
    this.currentAction = action;

    setTimeout(() => this.playIdle(), duration * 1000);
  }

  /**
   * Play thumbs up animation
   */
  private playThumbsUp(duration: number) {
    const rightArm = this.vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
    const rightHand = this.vrm.humanoid?.getNormalizedBoneNode('rightHand');

    if (!rightArm || !rightHand) return;

    const times = [0, duration];
    const armValues = [
      0, 0, 0, 1,
      -0.3, 0, 0, 0.954,
    ];
    const handValues = [
      0, 0, 0, 1,
      0.2, 0, 0, 0.98,
    ];

    const armTrack = new THREE.QuaternionKeyframeTrack(
      rightArm.name + '.quaternion',
      times,
      armValues
    );
    const handTrack = new THREE.QuaternionKeyframeTrack(
      rightHand.name + '.quaternion',
      times,
      handValues
    );

    const clip = new THREE.AnimationClip('thumbs_up', duration, [armTrack, handTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().fadeIn(0.3).play();
    this.currentAction = action;

    setTimeout(() => this.playIdle(), duration * 1000);
  }

  /**
   * Play bow animation
   */
  private playBow(duration: number) {
    const spine = this.vrm.humanoid?.getNormalizedBoneNode('spine');
    const head = this.vrm.humanoid?.getNormalizedBoneNode('head');

    if (!spine || !head) return;

    const times = [0, duration * 0.5, duration];
    const spineValues = [
      0, 0, 0, 1,
      0.2, 0, 0, 0.98,
      0, 0, 0, 1,
    ];
    const headValues = [
      0, 0, 0, 1,
      0.3, 0, 0, 0.954,
      0, 0, 0, 1,
    ];

    const spineTrack = new THREE.QuaternionKeyframeTrack(
      spine.name + '.quaternion',
      times,
      spineValues
    );
    const headTrack = new THREE.QuaternionKeyframeTrack(
      head.name + '.quaternion',
      times,
      headValues
    );

    const clip = new THREE.AnimationClip('bow', duration, [spineTrack, headTrack]);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().fadeIn(0.3).play();
    this.currentAction = action;

    setTimeout(() => this.playIdle(), duration * 1000);
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.vrm.scene);
  }
}

export default AnimationController;
