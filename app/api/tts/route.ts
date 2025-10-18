import { NextRequest, NextResponse } from 'next/server';
import { AudioAnalyzer } from '@/lib/audio-analyzer';

// Vbee API endpoint - Official documentation
const VBEE_API_URL = 'https://vbee.vn/api/v1/tts';

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 's_hochiminh_female_vyquangcao_advertise_vc', rate = 1.1, pitch = 1.0 } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const appId = process.env.VBEE_APP_ID;
    const bearerToken = process.env.VBEE_BEARER_TOKEN;
    
    if (!appId || !bearerToken) {
      return NextResponse.json(
        { error: 'Vbee API credentials not configured. Need both VBEE_APP_ID and VBEE_BEARER_TOKEN' },
        { status: 500 }
      );
    }

    console.log('[Vbee TTS] Generating speech for:', text);
    console.log('[Vbee TTS] Settings - Speed:', rate, 'Voice:', voice);

    // Call Vbee TTS API - Official format from documentation
    // Note: callback_url is REQUIRED by Vbee API
    const requestBody = {
      app_id: appId,                     // UUID của ứng dụng
      response_type: 'indirect',         // Bắt buộc phải có với callback_url
      callback_url: 'https://webhook.site/unique-id',  // Dummy URL, sẽ dùng polling thay vì callback
      input_text: text,                  // 📝 Text cần chuyển thành giọng nói
      voice_code: voice,                 // 🎤 voice_code 
      audio_type: 'mp3',                 // 🎵 audio_type
      speed_rate: rate.toString(),       // ⚡ speed_rate dạng string
      bitrate: 128,                      // Bitrate chuẩn
    };
    
    console.log('[Vbee TTS] Request body:', JSON.stringify(requestBody, null, 2));

    const vbeeResponse = await fetch(VBEE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,  // Bearer token (JWT)
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[Vbee TTS] Response status:', vbeeResponse.status);
    console.log('[Vbee TTS] Response headers:', Object.fromEntries(vbeeResponse.headers.entries()));
    
    // Get response as text first to check what we got
    const responseText = await vbeeResponse.text();
    console.log('[Vbee TTS] Response text (first 500 chars):', responseText.substring(0, 500));
    
    // Try to parse as JSON
    let vbeeData;
    try {
      vbeeData = JSON.parse(responseText);
      console.log('[Vbee TTS] Parsed response:', vbeeData);
    } catch (parseError) {
      console.error('[Vbee TTS] Failed to parse JSON response');
      console.error('[Vbee TTS] Full response:', responseText);
      throw new Error(`Vbee API returned non-JSON response: ${responseText.substring(0, 200)}`);
    }

    // Check Vbee response format: { status: 1, result: {...} }
    if (!vbeeData || vbeeData.status !== 1) {
      console.error('[Vbee TTS] API call failed:', vbeeData);
      throw new Error(vbeeData?.error_message || 'Vbee TTS API error');
    }

    const result = vbeeData.result;
    console.log('[Vbee TTS] Result:', result);

    // If response_type is 'direct', we might get audio_link immediately
    // If 'indirect', we get request_id and need to poll or wait for callback
    let audioUrl: string;

    if (result.audio_link) {
      // Direct mode - got audio link immediately
      audioUrl = result.audio_link;
      console.log('[Vbee TTS] Got audio link directly:', audioUrl);
    } else if (result.request_id) {
      // Indirect mode - need to poll for result
      console.log('[Vbee TTS] Got request_id, polling for result:', result.request_id);
      console.log('[Vbee TTS] Initial status:', result.status);
      
      // Poll for result with aggressive timing
      // First few attempts are faster (200ms), then slower (500ms)
      const maxAttempts = 60;  // Tăng lên 60 lần (max ~30 giây)
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Fast polling for first 10 attempts (200ms), then slow down (500ms)
        const delay = attempt < 10 ? 200 : 500;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        const pollResponse = await fetch(`${VBEE_API_URL}/${result.request_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Accept': 'application/json',
          },
        });
        
        const pollData = await pollResponse.json();
        
        // Only log every 3rd attempt to reduce noise
        if (attempt % 3 === 0 || pollData.result?.status === 'SUCCESS' || pollData.result?.status === 'FAILURE') {
          console.log(`[Vbee TTS] Poll attempt ${attempt + 1}/${maxAttempts} (${delay}ms):`, {
            status: pollData.result?.status,
            progress: pollData.result?.progress,
            voice: pollData.result?.voice_code
          });
        }
        
        if (pollData.status === 1 && pollData.result?.status === 'SUCCESS') {
          audioUrl = pollData.result.audio_link;
          console.log('[Vbee TTS] ✅ Audio ready:', audioUrl);
          break;
        }
        
        if (pollData.result?.status === 'FAILURE') {
          console.error('[Vbee TTS] ❌ Synthesis failed:', pollData);
          throw new Error(`Vbee TTS synthesis failed: ${JSON.stringify(pollData.result)}`);
        }
      }
      
      if (!audioUrl!) {
        console.error('[Vbee TTS] ⏱️ Timeout after', maxAttempts, 'attempts');
        throw new Error(`Vbee TTS timeout waiting for audio after ${maxAttempts} attempts (~30s). Text may be too long or voice_code invalid.`);
      }
    } else {
      throw new Error('Vbee API returned no audio link or request_id');
    }

    // Download audio from Vbee link
    let audioBuffer: ArrayBuffer | undefined;

    // Try to download the audio file
    for (let attempts = 0; attempts < 10; attempts++) {
      try {
        const audioResponse = await fetch(audioUrl);
        if (audioResponse.ok) {
          audioBuffer = await audioResponse.arrayBuffer();
          console.log('[Vbee TTS] Audio downloaded successfully');
          break;
        }
      } catch (error) {
        console.log(`[Vbee TTS] Download attempt ${attempts + 1} failed, retrying...`);
      }

      // Wait 1 second before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!audioBuffer) {
      throw new Error('Failed to download audio from Vbee');
    }

    // Convert to base64
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // Generate lip sync data from text
    const duration = AudioAnalyzer.estimateDuration(text);
    const lipSyncData = AudioAnalyzer.generateFromText(text, duration);

    // Return audio base64 and lip sync data
    return NextResponse.json({
      audio: audioBase64,
      lipSyncData,
      duration,
    });
  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
