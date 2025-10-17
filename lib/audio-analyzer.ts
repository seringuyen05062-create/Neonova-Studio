import { LipSyncData, PhonemeData } from '@/types';

export class AudioAnalyzer {
  /**
   * Analyze audio buffer and extract phoneme timing
   * This is a simplified version - in production, use proper speech recognition
   */
  static async analyzeAudio(audioBuffer: ArrayBuffer): Promise<LipSyncData> {
    // For now, return a simple lip sync data
    // In production, this should use a proper phoneme extraction service
    const duration = 3; // Default duration
    
    return {
      phonemes: [],
      duration,
    };
  }

  /**
   * Generate lip sync data from text (improved)
   */
  static generateFromText(text: string, duration: number): LipSyncData {
    const phonemes: PhonemeData[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    if (sentences.length === 0) {
      return { phonemes: [], duration };
    }
    
    const timePerSentence = duration / sentences.length;
    let currentTime = 0;

    sentences.forEach((sentence) => {
      const words = sentence.trim().split(/\s+/);
      if (words.length === 0) return;
      
      const sentenceStartTime = currentTime;
      const wordDuration = timePerSentence / words.length;

      words.forEach((word, wordIndex) => {
        if (!word.trim()) return;
        
        const syllables = this.splitIntoSyllables(word);
        const syllableDuration = wordDuration / Math.max(syllables.length, 1);

        syllables.forEach((syllable, syllableIndex) => {
          const viseme = this.syllableToViseme(syllable);
          const start = currentTime;
          const end = currentTime + syllableDuration;
          
          phonemes.push({
            phoneme: syllable,
            start: start,
            end: end,
            viseme,
          });

          currentTime += syllableDuration;
        });

        // Add small pause between words (10% of word duration)
        if (wordIndex < words.length - 1) {
          const pauseDuration = wordDuration * 0.1;
          phonemes.push({
            phoneme: 'pause',
            start: currentTime,
            end: currentTime + pauseDuration,
            viseme: 'sil',
          });
          currentTime += pauseDuration;
        }
      });

      // Add pause between sentences (15% of sentence duration)
      if (currentTime < duration) {
        const pauseDuration = Math.min(timePerSentence * 0.15, duration - currentTime);
        phonemes.push({
          phoneme: 'sentence_pause',
          start: currentTime,
          end: currentTime + pauseDuration,
          viseme: 'sil',
        });
        currentTime += pauseDuration;
      }
    });

    console.log('👄 [AudioAnalyzer] Generated phonemes:', phonemes.length);
    console.log('👄 [AudioAnalyzer] Sample phonemes:', phonemes.slice(0, 3));

    return {
      phonemes,
      duration,
    };
  }

  /**
   * Split Vietnamese word into syllables (improved)
   */
  private static splitIntoSyllables(word: string): string[] {
    // Improved Vietnamese syllable splitting
    const cleanWord = word.toLowerCase().replace(/[.,!?;]/g, '');
    
    // Vietnamese syllable patterns - simplified but more accurate
    const syllablePattern = /([bcdđghklmnpqrstvwxy]?[h]?[aăâeêiíoôơuưy]+[bcdghklmnpqrstvwxy]?[h]?)/gi;
    const matches = cleanWord.match(syllablePattern);
    
    if (matches && matches.length > 0) {
      return matches;
    }
    
    // Fallback: if no matches, split by vowel groups
    return cleanWord.split(/(?=[aăâeêiíoôơuưy])/i).filter(s => s.length > 0);
  }

  /**
   * Map syllable to viseme (improved)
   */
  private static syllableToViseme(syllable: string): string {
    const syllableLower = syllable.toLowerCase();
    
    // Check vowel sounds first (main mouth shape)
    if (syllableLower.match(/[aăâ]/)) return 'aa';  // wide open
    if (syllableLower.match(/[eê]/)) return 'E';    // semi-open
    if (syllableLower.match(/[iíy]/)) return 'ih';  // narrow
    if (syllableLower.match(/[oôơ]/)) return 'oh';  // round
    if (syllableLower.match(/[uưú]/)) return 'ou';  // very round
    
    // Check consonant sounds (mouth position)
    if (syllableLower.match(/^[bpm]/)) return 'PP'; // lips together
    if (syllableLower.match(/^[fv]/)) return 'FF';  // lip-teeth
    if (syllableLower.match(/^[dtđn]/)) return 'DD'; // tongue-teeth
    if (syllableLower.match(/^[lr]/)) return 'nn';  // tongue tip
    if (syllableLower.match(/^[sz]/)) return 'SS';  // tongue groove
    if (syllableLower.match(/^[kghqx]/)) return 'kk'; // back tongue
    if (syllableLower.match(/^[c]/)) return 'CH';   // tongue arch
    
    // Default to small opening for unknown sounds
    return 'ih';
  }

  /**
   * Calculate audio duration from text (estimate)
   */
  static estimateDuration(text: string, wordsPerMinute: number = 150): number {
    const words = text.split(/\s+/).length;
    return (words / wordsPerMinute) * 60;
  }

  /**
   * Detect silence periods in audio
   */
  static detectSilence(audioData: Float32Array, threshold: number = 0.01): number[] {
    const silences: number[] = [];
    let inSilence = false;
    let silenceStart = 0;

    for (let i = 0; i < audioData.length; i++) {
      const amplitude = Math.abs(audioData[i]);

      if (amplitude < threshold && !inSilence) {
        inSilence = true;
        silenceStart = i;
      } else if (amplitude >= threshold && inSilence) {
        inSilence = false;
        silences.push(silenceStart, i);
      }
    }

    return silences;
  }

  /**
   * Smooth phoneme transitions
   */
  static smoothPhonemes(phonemes: PhonemeData[], smoothingFactor: number = 0.1): PhonemeData[] {
    return phonemes.map((phoneme, index) => {
      if (index === 0) return phoneme;

      const prevPhoneme = phonemes[index - 1];
      const gap = phoneme.start - prevPhoneme.end;

      if (gap < smoothingFactor) {
        return {
          ...phoneme,
          start: prevPhoneme.end,
        };
      }

      return phoneme;
    });
  }
}

export default AudioAnalyzer;
