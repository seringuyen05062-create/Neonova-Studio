# 🎀 Vbee TTS Migration Summary

## ✅ Migration Completed Successfully

Đã hoàn tất việc chuyển đổi từ **FPT.AI TTS** sang **Vbee TTS API** với giọng nói anime.

---

## 📋 Files Changed

### 1. **Environment Variables**

#### `.env.local`
- ❌ Removed: `FPT_AI_API_KEY`
- ✅ Added: `VBEE_API_KEY=4aaec49d-9217-4f5b-b931-bb7415e745fc`

#### `.env.local.example`
- ✅ Added: `VBEE_API_KEY=your_vbee_api_key_here`

### 2. **API Route**

#### `app/api/tts/route.ts`
- ❌ Removed: FPT.AI API integration
- ✅ Added: Vbee TTS API integration
- ✅ Changed: API endpoint to `https://api.vbee.vn/api/v2/tts`
- ✅ Changed: Auth header from `api-key` to `token`
- ✅ Changed: Request body format for Vbee
- ✅ Changed: Error handling for Vbee response structure
- ✅ Changed: Retry logic from 30 attempts (2s) to 10 attempts (1s)
- ✅ Security: API key now from `process.env.VBEE_API_KEY`

### 3. **Main Component**

#### `app/page.tsx`
- ✅ Renamed: `speakWithFPTAudio()` → `speakWithVbeeAudio()`
- ✅ Updated: Comments to reference Vbee TTS
- ✅ Updated: Function documentation

### 4. **Custom Hook**

#### `hooks/useVbeeTTS.ts`
- ✅ Created: New hook for direct Vbee TTS usage
- ✅ Security: Removed hardcoded API key
- ✅ Changed: Now calls `/api/tts` route instead of direct API call
- ✅ Updated: Returns base64 data URL instead of Vbee link

---

## 🎯 Key Features

### Voice Configuration
- **Voice Model**: `s_hochiminh_female_vyquangcao_advertise_vc`
- **Speed**: 1.1 (default) - Lively anime voice
- **Volume**: 1.0
- **Format**: MP3

### API Integration
- **Endpoint**: `https://api.vbee.vn/api/v2/tts`
- **Auth**: Token-based authentication
- **Response**: Direct audio link download
- **Retry**: 10 attempts with 1s delay

### Security Improvements
- ✅ API key stored in environment variables
- ✅ Server-side API calls only
- ✅ No client-side API key exposure
- ✅ Secure token handling

---

## 🔍 Verification Checklist

- [x] All FPT references removed from codebase
- [x] All hardcoded API keys removed
- [x] Environment variables properly configured
- [x] API route uses environment variables
- [x] Hook uses API route (not direct API call)
- [x] Comments and documentation updated
- [x] Error handling updated for Vbee format
- [x] No client-side API key exposure

---

## 🚀 Usage

### Main App (Already Integrated)
```typescript
// Automatically used when chat response comes in
handleTextToSpeech(text, shouldDanceAfterTTS);
```

### Direct Hook Usage (For Livestream/Comments)
```typescript
const { speakAnime, loading, audioUrl, error } = useVbeeTTS();

// Generate anime voice
await speakAnime("Xin chào senpai! UwU", 1.2);

// With custom voice
await speakAnime(
  "Nyaa~ Cảm ơn gift!", 
  1.1, 
  "s_hochiminh_female_vyquangcao_advertise_vc"
);
```

---

## 📝 Next Steps

1. **Test Voice Quality**: Verify anime voice sounds good
2. **Monitor API Usage**: Check Vbee API quotas
3. **Adjust Speed**: Fine-tune speed (1.0 - 1.3) for desired effect
4. **Livestream Integration**: Use `useVbeeTTS` hook for comments/gifts

---

## 🎨 Voice Customization

### Speed Settings
- `0.8 - 0.9`: Slower, more dramatic
- `1.0`: Normal speed
- `1.1 - 1.2`: Lively, energetic (recommended for anime)
- `1.3 - 1.5`: Very fast, hyper

### Available Voices
Currently using: `s_hochiminh_female_vyquangcao_advertise_vc`

To change voice, update the `voice` parameter in API calls.

---

## ⚠️ Important Notes

- **Restart Required**: After changing `.env.local`, restart dev server
- **API Limits**: Monitor Vbee API usage limits
- **Error Handling**: All errors logged with `[Vbee TTS]` prefix
- **Fallback**: No fallback to browser TTS (Vbee only)

---

**Migration Date**: October 15, 2025  
**Status**: ✅ Complete  
**Version**: 1.0.0
