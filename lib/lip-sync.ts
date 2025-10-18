import { VRM, VRMExpressionPresetName } from '@pixiv/three-vrm';
import { LipSyncData, PhonemeData } from '@/types';

// Vietnamese phoneme to viseme mapping
const PHONEME_TO_VISEME: Record<string, string> = {
  // Vowels
  'a': 'aa',
  'ă': 'aa',
  'â': 'aa',
  'e': 'E',
  'ê': 'E',
  'i': 'ih',
  'o': 'oh',
  'ô': 'oh',
  'ơ': 'oh',
  'u': 'ou',
  'ư': 'ou',
  'y': 'ih',
  
  // Consonants
  'b': 'PP',
  'p': 'PP',
  'm': 'PP',
  'f': 'FF',
  'v': 'FF',
  'd': 'DD',
  't': 'DD',
  'n': 'nn',
  'l': 'nn',
  'r': 'RR',
  's': 'SS',
  'z': 'SS',
  'ch': 'CH',
  'j': 'CH',
  'k': 'kk',
  'g': 'kk',
  'ng': 'nn',
  'h': 'sil',
  
  // Silence
  'sil': 'sil',
  'pau': 'sil',
};

// Viseme to VRM blend shape mapping
const VISEME_TO_BLENDSHAPE: Record<string, VRMExpressionPresetName | string> = {
  'aa': 'aa',      // mouth wide open
  'E': 'e',        // mouth slightly open
  'ih': 'ih',      // mouth narrow
  'oh': 'oh',      // mouth round
  'ou': 'ou',      // mouth very round
  'PP': 'pp',      // lips closed
  'FF': 'ff',      // teeth on lower lip
  'DD': 'dd',      // tongue on teeth
  'nn': 'nn',      // tongue on palate
  'RR': 'rr',      // tongue rolled
  'SS': 'ss',      // teeth together
  'CH': 'ch',      // lips forward
  'kk': 'kk',      // mouth slightly open
  'sil': 'neutral', // neutral/closed
};

export class LipSyncController {
  private vrm: VRM;
  private isPlaying: boolean = false;
  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private onLipSyncStart?: () => void;
  private onLipSyncEnd?: () => void;

  constructor(vrm: VRM, options?: { onLipSyncStart?: () => void; onLipSyncEnd?: () => void }) {
    this.vrm = vrm;
    this.onLipSyncStart = options?.onLipSyncStart;
    this.onLipSyncEnd = options?.onLipSyncEnd;
  }

  /**
   * Start lip sync animation with audio
   */
  async startLipSync(lipSyncData: LipSyncData, audioElement: HTMLAudioElement) {
    console.log('👄 [LipSync] ========== STARTING LIP SYNC ==========');
    console.log('👄 [LipSync] VRM model:', !!this.vrm);
    console.log('👄 [LipSync] VRM expressionManager:', !!this.vrm.expressionManager);
    console.log('👄 [LipSync] Audio element:', !!audioElement);
    console.log('👄 [LipSync] LipSync data phonemes:', lipSyncData.phonemes.length);
    console.log('👄 [LipSync] Duration:', lipSyncData.duration);
    console.log('👄 [LipSync] First few phonemes:', lipSyncData.phonemes.slice(0, 5));
    
    if (!this.vrm.expressionManager) {
      console.error('👄 [LipSync] ❌ VRM does not have expression manager - lip sync will not work');
      return;
    }
    
    if (!lipSyncData.phonemes || lipSyncData.phonemes.length === 0) {
      console.warn('👄 [LipSync] ⚠️ No phonemes in lip sync data');
      return;
    }

    // Pause auto facial expressions before starting lip sync
    if (this.onLipSyncStart) {
      console.log('👄 [LipSync] Pausing auto facial expressions');
      this.onLipSyncStart();
    }

    this.isPlaying = true;
    this.startTime = performance.now();
    console.log('👄 [LipSync] Animation started at:', this.startTime);

    // Sync with audio playback
    let lastLogTime = 0;
    const animate = () => {
      if (!this.isPlaying) return;

      const currentTime = (performance.now() - this.startTime) / 1000;
      
      // Find current phoneme
      const currentPhoneme = this.getCurrentPhoneme(lipSyncData.phonemes, currentTime);
      
      if (currentPhoneme) {
        // Log every 200ms to avoid spam
        if (currentTime - lastLogTime > 0.2) {
          console.log('👄 [LipSync] Time:', currentTime.toFixed(2), 'Phoneme:', currentPhoneme.phoneme, 'Viseme:', currentPhoneme.viseme);
          lastLogTime = currentTime;
        }
        this.applyViseme(currentPhoneme.viseme);
      } else {
        this.resetMouth();
      }

      // Continue animation
      if (currentTime < lipSyncData.duration) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        console.log('👄 [LipSync] ========== LIP SYNC COMPLETED ==========');
        this.stopLipSync();
      }
    };

    animate();
  }

  /**
   * Get current phoneme based on time
   */
  private getCurrentPhoneme(phonemes: PhonemeData[], currentTime: number): PhonemeData | null {
    for (const phoneme of phonemes) {
      if (currentTime >= phoneme.start && currentTime <= phoneme.end) {
        return phoneme;
      }
    }
    return null;
  }

  /**
   * Apply viseme to VRM model
   */
  private applyViseme(viseme: string) {
    console.log('👄 [LipSync] applyViseme called with:', viseme);
    
    // Reset previous mouth shapes first
    this.resetMouth();
    
    // Skip silence
    if (viseme === 'sil') {
      return;
    }
    
    // Try expression manager first (preferred for VRM models)
    const expressionManager = this.vrm.expressionManager;
    let appliedViaExpression = false;
    
    if (expressionManager) {
      appliedViaExpression = this.applyExpressionManager(viseme, expressionManager);
    }
    
    // If expression manager failed, try direct morph targets
    if (!appliedViaExpression && this.vrm.scene) {
      this.applyMorphTarget(viseme);
    }
    
    if (!appliedViaExpression) {
      console.warn('👄 [LipSync] No expressionManager available for viseme:', viseme);
    }
  }

  /**
   * Apply lip sync via direct morph target manipulation
   */
  private applyMorphTarget(viseme: string) {
    try {
      const weight = this.calculateVisemeWeight(viseme);
      console.log('👄 [LipSync] Trying morph targets with weight:', weight);
      
      // Find mesh with morph targets
      this.vrm.scene.traverse((child: any) => {
        if (child.isMesh && child.morphTargetInfluences) {
          const morphTargets = child.morphTargetDictionary;
          console.log('👄 [LipSync] Found morph targets:', Object.keys(morphTargets || {}));
          
          if (morphTargets) {
            // Try common mouth morph target names
            const mouthTargets = ['mouth', 'Mouth', 'mouth_a', 'mouth_o', 'mouth_i', 'mouth_u', 'mouth_e', 'A', 'O', 'I', 'U', 'E'];
            
            for (const targetName of mouthTargets) {
              if (morphTargets[targetName] !== undefined) {
                const index = morphTargets[targetName];
                child.morphTargetInfluences[index] = weight;
                console.log('👄 [LipSync] Applied morph target:', targetName, 'with weight:', weight);
                return;
              }
            }
          }
        }
      });
    } catch (error) {
      console.warn('👄 [LipSync] Morph target failed:', error);
    }
  }

  /**
   * Apply lip sync via expression manager
   */
  private applyExpressionManager(viseme: string, expressionManager: any): boolean {
    try {
      const weight = this.calculateVisemeWeight(viseme);
      const blendShapeName = VISEME_TO_BLENDSHAPE[viseme] || 'neutral';
      
      console.log('👄 [LipSync] Expression manager - viseme:', viseme, 'blendShape:', blendShapeName, 'weight:', weight);
      
      // Try to use mouth-specific expressions if available
      const availableExpressions = expressionManager.presetExpressionMap || expressionManager.expressions || {};
      console.log('👄 [LipSync] Available expressions:', Object.keys(availableExpressions));
      
      let applied = false;
      
      // Try mouth-specific expressions first
      const mouthExpressions = ['aa', 'ih', 'ou', 'ee', 'oh', 'mouth_a', 'mouth_i', 'mouth_u', 'mouth_e', 'mouth_o'];
      for (const expr of mouthExpressions) {
        if (availableExpressions[expr] !== undefined) {
          if (expr === blendShapeName || expr.includes(blendShapeName)) {
            expressionManager.setValue(expr, weight);
            console.log('👄 [LipSync] Applied mouth expression:', expr, 'weight:', weight);
            applied = true;
            break;
          }
        }
      }
      
      // Fallback to standard VRM expressions
      if (!applied) {
        if (blendShapeName === 'aa' || blendShapeName === 'oh' || blendShapeName === 'ou') {
          // Wide mouth shapes - use happy or surprised
          if (availableExpressions['surprised']) {
            expressionManager.setValue('surprised', weight * 0.5);
            applied = true;
          } else if (availableExpressions['happy']) {
            expressionManager.setValue('happy', weight * 0.3);
            applied = true;
          }
          console.log('👄 [LipSync] Applied wide mouth fallback');
        } else if (blendShapeName === 'ih' || blendShapeName === 'E') {
          // Small mouth shapes - use subtle happy
          if (availableExpressions['happy']) {
            expressionManager.setValue('happy', weight * 0.2);
            applied = true;
          }
          console.log('👄 [LipSync] Applied small mouth fallback');
        }
      }
      
      return applied;
    } catch (error) {
      console.warn('👄 [LipSync] Expression manager failed:', error);
      return false;
    }
  }

  /**
   * Calculate viseme weight based on phoneme type
   */
  private calculateVisemeWeight(viseme: string): number {
    // Vowels get full weight
    if (['aa', 'E', 'ih', 'oh', 'ou'].includes(viseme)) {
      return 1.0;
    }
    // Consonants get reduced weight
    return 0.6;
  }

  /**
   * Reset mouth to neutral position
   */
  private resetMouth() {
    // Không reset miệng về neutral, giữ nguyên morph target hiện tại
    // Để đảm bảo pose mẫu và animation body không bị ảnh hưởng
  }

  /**
   * Stop lip sync animation
   */
  stopLipSync() {
    this.isPlaying = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Resume auto facial expressions after lip sync
    if (this.onLipSyncEnd) {
      console.log('👄 [LipSync] Resuming auto facial expressions');
      this.onLipSyncEnd();
    }
    
    // Reset mouth to neutral after lip sync
    this.resetMouth();
  }

  /**
   * Analyze audio and generate phoneme data (simplified version)
   * In production, this should be done server-side with proper phoneme analysis
   */
  static generateLipSyncData(text: string, duration: number): LipSyncData {
    const words = text.toLowerCase().split(/\s+/);
    const phonemes: PhonemeData[] = [];
    let currentTime = 0;
    const timePerWord = duration / words.length;

    words.forEach((word) => {
      const chars = word.split('');
      const timePerChar = timePerWord / chars.length;

      chars.forEach((char) => {
        const phoneme = char;
        const viseme = PHONEME_TO_VISEME[phoneme] || 'sil';
        
        phonemes.push({
          phoneme,
          start: currentTime,
          end: currentTime + timePerChar,
          viseme,
        });

        currentTime += timePerChar;
      });

      // Add small pause between words
      phonemes.push({
        phoneme: 'sil',
        start: currentTime,
        end: currentTime + 0.05,
        viseme: 'sil',
      });
      currentTime += 0.05;
    });

    return {
      phonemes,
      duration,
    };
  }

  /**
   * Simple lip sync based on audio amplitude (fallback method)
   */
  startSimpleLipSync(audioElement: HTMLAudioElement) {
    if (!this.vrm.expressionManager) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audioElement);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    this.isPlaying = true;

    const animate = () => {
      if (!this.isPlaying) return;

      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average amplitude
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalizedAmplitude = Math.min(average / 128, 1.0);

      // Apply mouth opening based on amplitude
      if (this.vrm.expressionManager) {
        this.vrm.expressionManager.setValue('aa' as VRMExpressionPresetName, normalizedAmplitude);
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Stop when audio ends
    audioElement.addEventListener('ended', () => {
      this.stopLipSync();
      audioContext.close();
    });
  }
}

export default LipSyncController;
