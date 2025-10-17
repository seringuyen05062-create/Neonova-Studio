# 🔍 Debug Guide: Vbee TTS & Lip Sync Issues

## 🎯 Current Problem
- ❌ Âm thanh không phát ra
- ❌ Lip sync không hoạt động

## 📋 Debug Steps

### 1. Kiểm tra Console Logs

Sau khi gửi message trong chat, kiểm tra console (F12) để xem các log sau:

#### ✅ TTS Request Logs:
```
[TTS] Starting text-to-speech for: <text>
[Vbee TTS] Generating speech for: <text>
[Vbee TTS] Settings - Speed: 1.1 Voice: s_hochiminh_female_vyquangcao_advertise_vc
[Vbee TTS] Request body: {...}
```

#### ✅ TTS Response Logs:
```
[Vbee TTS] Response: {...}
[Vbee TTS] Audio downloaded successfully
[TTS] Response received: {...}
[TTS] Audio data received, length: <number>
[TTS] LipSync data: {...}
[TTS] Duration: <number>
```

#### ✅ Audio Playback Logs:
```
[Audio] Setting audio source, base64 length: <number>
[Audio] Volume set to: <number>
[Audio] Attempting to play audio...
[Audio] Audio started playing
[LipSync] Starting lip sync
```

### 2. Các Lỗi Có Thể Gặp

#### ❌ Lỗi 1: API Key không đúng
```
[TTS] Response status: 401 hoặc 403
```
**Fix**: Kiểm tra `VBEE_API_KEY` trong `.env.local`

#### ❌ Lỗi 2: Vbee API lỗi
```
[Vbee TTS] Response: { error: "..." }
[TTS] No audio data in response
```
**Fix**: Kiểm tra API key, kiểm tra voice model có đúng không

#### ❌ Lỗi 3: Audio không decode được
```
[Audio] Error playing audio: ...
[Audio] Audio error details: ...
```
**Fix**: Vấn đề với base64 encoding/decoding

#### ❌ Lỗi 4: LipSync controller chưa khởi tạo
```
[LipSync] LipSync controller not available
```
**Fix**: VRM model chưa load xong

### 3. Manual Testing

#### Test 1: Kiểm tra API trực tiếp
Mở Console và chạy:

```javascript
fetch('/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Xin chào test',
    rate: 1.1,
    voice: 's_hochiminh_female_vyquangcao_advertise_vc'
  })
})
.then(r => r.json())
.then(data => {
  console.log('API Response:', data);
  if (data.audio) {
    console.log('✅ Audio received, length:', data.audio.length);
    // Test play audio
    const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
    audio.play();
  } else {
    console.error('❌ No audio in response');
  }
});
```

#### Test 2: Kiểm tra Audio Element
```javascript
const audioEl = document.querySelector('audio');
console.log('Audio element:', audioEl);
console.log('Audio can play:', audioEl?.canPlayType('audio/mp3'));
```

#### Test 3: Kiểm tra VRM & LipSync Controller
```javascript
// Trong console của trang
// Kiểm tra vrm đã load chưa
console.log('VRM loaded:', vrm !== null);
// Kiểm tra lipSyncController
console.log('LipSync controller:', lipSyncControllerRef.current);
```

### 4. Common Fixes

#### Fix 1: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

#### Fix 2: Clear Cache
```bash
# Delete .next folder
rm -rf .next
npm run dev
```

#### Fix 3: Kiểm tra Environment Variables
```bash
# Xem .env.local
cat .env.local

# Đảm bảo có:
VBEE_API_KEY=4aaec49d-9217-4f5b-b931-bb7415e745fc
```

#### Fix 4: Test với text đơn giản
Thử gửi message ngắn: "Xin chào"

### 5. Debugging Checklist

- [ ] Dev server đang chạy (`npm run dev`)
- [ ] `.env.local` có `VBEE_API_KEY` đúng
- [ ] Console không có lỗi khi load trang
- [ ] VRM model đã load (thấy avatar 3D)
- [ ] Gửi message trong chat
- [ ] Kiểm tra console logs theo thứ tự trên
- [ ] Kiểm tra Network tab (F12) → XHR/Fetch → `/api/tts`
- [ ] Xem response của `/api/tts` có `audio` field không
- [ ] Xem `audio` field có base64 string dài không (>1000 chars)

### 6. Expected Flow

```
User sends message
    ↓
DeepSeek AI responds
    ↓
handleTextToSpeech(text) called
    ↓
POST /api/tts { text, rate: 1.1, voice: "..." }
    ↓
API calls Vbee TTS
    ↓
Vbee returns audio link
    ↓
API downloads audio from link
    ↓
API converts to base64
    ↓
API returns { audio, lipSyncData, duration }
    ↓
speakWithVbeeAudio(audio, lipSyncData) called
    ↓
Audio element src set to data:audio/mp3;base64,...
    ↓
audio.play() called
    ↓
onplay event → Start lip sync
    ↓
Audio plays + Mouth moves
    ↓
onended event → Stop lip sync
```

### 7. Next Steps

1. **Mở Developer Console** (F12)
2. **Gửi một message** trong chat
3. **Copy tất cả logs** bắt đầu với `[TTS]`, `[Vbee TTS]`, `[Audio]`, `[LipSync]`
4. **Chia sẻ logs** để tôi có thể debug chính xác

---

## 🛠️ Quick Fixes

### Nếu không thấy log nào cả:
→ handleTextToSpeech không được gọi
→ Kiểm tra DeepSeek API response

### Nếu thấy `[TTS] Starting...` nhưng không thấy response:
→ API /tts bị lỗi
→ Kiểm tra Network tab

### Nếu thấy response nhưng `No audio data`:
→ Vbee API lỗi
→ Kiểm tra Vbee response trong console

### Nếu có audio nhưng không phát:
→ Browser chặn autoplay
→ Volume = 0
→ Audio element lỗi

### Nếu có âm thanh nhưng không lip sync:
→ lipSyncController chưa init
→ VRM chưa load xong
→ lipSyncData không đúng format

---

**Created**: October 15, 2025  
**Status**: Debugging in progress
