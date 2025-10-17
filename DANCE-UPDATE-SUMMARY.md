# 🎵 THÊM CÁC BÀI NHẠC MỚI: "Bắt Lá Yêm Giữa" + "Tetris"

## ✅ ĐÃ CẬP NHẬT:

### 1. **VRMA Files Mapping**
- ✅ Thêm `batlayemgiua_canhdongluamachnon` vào `VRMA_FILES`
- ✅ Path: `/models/batlayemgiua canhdongluamachnon.vrma`

### 2. **Animation Types**
- ✅ Thêm `'batlayemgiua_canhdongluamachnon'` vào `AnimationType` trong `types/index.ts`

### 3. **Animation Controller**  
- ✅ Thêm `'batlayemgiua_canhdongluamachnon'` vào `loopingAnimations` 
- ✅ Animation sẽ tự động loop với `THREE.LoopRepeat`

### 4. **Dance Intent Detection**
- ✅ **Cập nhật `detectDanceIntent()`**: Thêm keywords cho bài mới
  - `'bắt lá yêm gì ua', 'bắt lá yêm giữa', 'cảnh đồng lúa mạch non'`
  - `'batlayemgiua', 'canhdongluamachnon', 'nhảy bắt lá'`
  - `'bài bắt lá yêm', 'nhảy bắt lá yêm giữa', 'bài viral tiktok bắt lá'`

- ✅ **Tạo mới `detectSpecificSong()`**: Detect bài nhạc cụ thể
  ```typescript
  // Trả về { animation: string, music: string }
  // "bắt lá" → batlayemgiua_canhdongluamachnon
  // Default → nhung_ngay_mau_huou
  ```

### 5. **Dynamic Dance System**
- ✅ **Cập nhật `playDanceWithMusic()`**: Nhận tham số dynamic
  ```typescript
  playDanceWithMusic(animationName, musicPath)
  // animationName: 'batlayemgiua_canhdongluamachnon' 
  // musicPath: '/music/batlayemgiua canhdongluamachnon.mp3'
  ```

- ✅ **Cập nhật `handleTextToSpeech()`**: Nhận thông tin bài nhạc
- ✅ **Cập nhật `speakWithVbeeAudio()`**: Truyền `songInfo` xuống

### 6. **Flow Logic**
```
User: "nhảy bắt lá yêm giữa cảnh đồng" 
  ↓
detectDanceIntent() → true
  ↓  
detectSpecificSong() → { 
  animation: 'batlayemgiua_canhdongluamachnon',
  music: '/music/batlayemgiua canhdongluamachnon.mp3' 
}
  ↓
TTS → Lip Sync → playDanceWithMusic(animation, music)
  ↓
Animation loops với nhạc tương ứng!
```

## 🎯 CÁCH SỬ DỤNG:

### Bài "Tetris" (MỚI):
- `"nhảy tetris"`  
- `"nhảy bài tetris"`
- `"tetris dance"`
- `"nhảy tetris theme"`

### Bài "Bắt Lá Yêm Giữa":
- `"nhảy bắt lá yêm giữa"`  
- `"nhảy bài bắt lá"`
- `"bắt lá yêm giữa cảnh đồng lúa mạch non"`
- `"nhảy bài viral tiktok bắt lá"`

### Bài "Những Ngày Màu Hươu" (default):
- `"nhảy những ngày màu hươu"`
- `"nhảy bài hươu"`  
- `"nhảy"` (generic)

## ✅ KẾT QUẢ:
- 🎵 **Hỗ trợ 3+ bài nhạc** với animation riêng biệt:
  - **Tetris** (Classic game music)
  - **Bắt Lá Yêm Giữa** (Viral TikTok)  
  - **Những Ngày Màu Hươu** (Default)
- 🎯 **Smart auto-detection** từ keywords trong chat
- 🔄 **Extensible system** - dễ dàng thêm bài mới
- 💃 **Perfect animation sync** với từng bài nhạc cụ thể

**🎮 TETRIS ĐÃ SẴN SÀNG! Test ngay: "nhảy tetris"** 🚀🎵