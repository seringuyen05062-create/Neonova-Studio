'use client';

import { useState } from 'react';

export function useVbeeTTS() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate anime voice from text using Vbee TTS API
   * @param text - Text to convert to speech
   * @param speed - Speech speed (0.8 - 1.5), default 0.95 for natural anime voice
   * @param voice - Voice model to use
   */
  async function speakAnime(
    text: string,
    speed: number = 0.95,
    voice: string = 's_hochiminh_female_vyquangcao_advertise_vc'
  ): Promise<string | null> {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[useVbeeTTS] Generating anime voice for:', text);
      
      // Call our API route instead of directly calling Vbee (for API key security)
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          rate: speed,
          voice: voice,
        }),
      });

      const data = await res.json();
      
      if (data && data.audio) {
        // Convert base64 to data URL
        const audioDataUrl = `data:audio/mp3;base64,${data.audio}`;
        setAudioUrl(audioDataUrl);
        console.log('[useVbeeTTS] Audio generated successfully');
        return audioDataUrl;
      } else {
        throw new Error(data.error || 'Failed to generate voice');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Vbee TTS error';
      console.error('[useVbeeTTS] Error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Clear current audio URL
   */
  function clearAudio() {
    setAudioUrl(null);
    setError(null);
  }

  return {
    audioUrl,
    loading,
    error,
    speakAnime,
    clearAudio,
  };
}
