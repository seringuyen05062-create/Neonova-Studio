# 🎵 CẬP NHẬT UI NÚT NHẢY - THÊM 2 BÀI MỚI

## ✅ ĐÃ SỬA XONG:

### 🔧 **Vấn đề trước đây:**
- Nút "🎵 Nhảy" chỉ có 3 bài cũ: Những ngày màu hươu, Bling-Bang-Bang-Born, AIAIAI
- Thiếu 2 bài mới: **Bắt Lá Yêm Giữa** và **Tetris**
- Logic cũ dùng setInterval (có thể gây khựng)

### ✅ **Đã cập nhật:**

#### 1. **Danh sách bài hát mới (page.tsx):**
```typescript
const songs = [
  { name: 'Những ngày màu hươu', id: 'nhung_ngay_mau_huou', file: '/music/nhung_ngay_mau_huou.mp3', animationName: 'nhung_ngay_mau_huou' },
  { name: 'Bling-Bang-Bang-Born', id: 'bling_bang_bang_born', file: '/music/Bling-Bang-Bang-Born.mp3', animationName: 'bling_bang_bang_born' },
  { name: 'AIAIAI', id: 'aiaiai', file: '/music/aiaiai.mp3', animationName: 'aiaiai' },
  // 🆕 BÀI MỚI
  { name: 'Bắt Lá Yêm Giữa Cảnh Đồng', id: 'batlayemgiua_canhdongluamachnon', file: '/music/batlayemgiua canhdongluamachnon.mp3', animationName: 'batlayemgiua_canhdongluamachnon' },
  { name: 'Tetris Theme', id: 'tetris', file: '/music/tetris.mp3', animationName: 'tetris' },
];
```

#### 2. **Logic mới sử dụng `playDanceWithMusic()`:**
```typescript
const handleSelectSong = (songId: string) => {
  // Tìm bài hát
  const song = songs.find(s => s.id === songId);
  
  // Sử dụng system dance mới với auto-loop (không setInterval)
  playDanceWithMusic(song.animationName, song.file);
};
```

#### 3. **Tương thích với hệ thống mới:**
- ✅ Kết nối với `playDanceWithMusic()` đã được tối ưu
- ✅ Auto-loop mượt mà với `THREE.LoopRepeat`
- ✅ Không còn khựng giữa chừng

## 🎯 **CÁCH SỬ DỤNG:**

### **Từ UI (Nút nhảy):**
1. Click **"🎵 Nhảy"** 
2. Chọn bài từ modal:
   - ✅ Những ngày màu hươu
   - ✅ Bling-Bang-Bang-Born  
   - ✅ AIAIAI
   - 🆕 **Bắt Lá Yêm Giữa Cảnh Đồng**
   - 🆕 **Tetris Theme**

### **Từ Chat (Vẫn hoạt động):**
- `"nhảy tetris"` → Tetris theme
- `"nhảy bắt lá yêm giữa"` → Bắt lá yêm 
- `"nhảy"` → Default (những ngày màu hươu)

## ✅ **KẾT QUẢ:**
- 🎵 **5 bài nhạc** có sẵn trong UI
- 🎯 **2 cách trigger**: UI button hoặc chat command
- 🔄 **Logic thống nhất**: Cả 2 cách đều dùng `playDanceWithMusic()`
- 💃 **Animation mượt mà**: Auto-loop không khựng

**🎮 TEST NGAY: Click nút "🎵 Nhảy" → Chọn "Tetris Theme" hoặc "Bắt Lá Yêm Giữa"!** 🚀