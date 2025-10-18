/**
 * Shared utilities for phoneme and viseme mapping
 * Tránh trùng lặp code giữa audio-analyzer và lip-sync
 */

// Vietnamese phoneme to viseme mapping
export const PHONEME_TO_VISEME: Record<string, string> = {
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
  'nh': 'nn',
  'kh': 'kk',
  'h': 'sil',
  
  // Silence
  'sil': 'sil',
  'pau': 'sil',
};

// Viseme to VRM blend shape mapping
export const VISEME_TO_BLENDSHAPE: Record<string, string> = {
  'aa': 'aa',      // mouth wide open
  'E': 'e',        // mouth slightly open
  'ih': 'ih',      // mouth narrow
  'oh': 'oh',      // mouth round
  'ou': 'ou',      // mouth pursed
  'PP': 'pp',      // lips together
  'FF': 'ff',      // lip-teeth
  'DD': 'dd',      // tongue-teeth
  'nn': 'nn',      // tongue-roof
  'RR': 'rr',      // tongue curl
  'SS': 'ss',      // tongue-teeth air
  'CH': 'ch',      // tongue-roof air
  'kk': 'kk',      // tongue-soft palate
  'sil': 'sil',    // silence
};

/**
 * Map phoneme to viseme
 */
export function mapPhonemeToViseme(phoneme: string): string {
  return PHONEME_TO_VISEME[phoneme.toLowerCase()] || 'sil';
}

/**
 * Map viseme to blend shape
 */
export function mapVisemeToBlendShape(viseme: string): string {
  return VISEME_TO_BLENDSHAPE[viseme] || 'neutral';
}

/**
 * Enhanced Vietnamese text to phonemes
 * Improved from simple space splitting
 */
export function textToPhonemes(text: string): string[] {
  // Remove punctuation and normalize
  const cleanText = text
    .toLowerCase()
    .replace(/[.,!?;:"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split into syllables (Vietnamese specific)
  const syllables = cleanText.split(' ').filter(s => s.length > 0);
  
  const phonemes: string[] = [];
  
  syllables.forEach(syllable => {
    // Add silence before each syllable
    if (phonemes.length > 0) {
      phonemes.push('sil');
    }
    
    // Convert syllable to phonemes
    const syllablePhonemes = syllableToPhonemes(syllable);
    phonemes.push(...syllablePhonemes);
  });
  
  return phonemes;
}

/**
 * Convert Vietnamese syllable to phonemes
 */
function syllableToPhonemes(syllable: string): string[] {
  const phonemes: string[] = [];
  
  // Simple character-by-character mapping
  // This can be improved with proper Vietnamese phonetic rules
  for (let i = 0; i < syllable.length; i++) {
    const char = syllable[i];
    
    // Handle digraphs first
    if (i < syllable.length - 1) {
      const digraph = char + syllable[i + 1];
      if (PHONEME_TO_VISEME[digraph]) {
        phonemes.push(digraph);
        i++; // Skip next character
        continue;
      }
    }
    
    // Handle single characters
    if (PHONEME_TO_VISEME[char]) {
      phonemes.push(char);
    }
  }
  
  return phonemes.length > 0 ? phonemes : ['sil'];
}

/**
 * Calculate timing for phonemes based on text length
 */
export function calculatePhonemeTiming(
  phonemes: string[], 
  totalDuration: number
): { phoneme: string; start: number; end: number }[] {
  const result: { phoneme: string; start: number; end: number }[] = [];
  
  if (phonemes.length === 0) {
    return result;
  }
  
  const averageDuration = totalDuration / phonemes.length;
  
  phonemes.forEach((phoneme, index) => {
    const start = index * averageDuration;
    const end = (index + 1) * averageDuration;
    
    result.push({
      phoneme,
      start,
      end
    });
  });
  
  return result;
}