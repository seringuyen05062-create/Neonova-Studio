# 🔧 Fix: Xung đột giữa Animation Nhảy và Idle Sequence

## 📅 Ngày: 2025-10-15

## 🐛 Vấn đề

Khi avatar nhảy (dance animation), **idle sequence** (hành động lặp lại tự động) vẫn đang chạy timer và **trigger giữa chừng**, khiến avatar:

❌ Chưa nhảy xong đã chuyển sang tư thế spin/shoot/squat  
❌ Animation bị gián đoạn không mượt  
❌ Trải nghiệm người dùng kém  

### Root Cause

```typescript
// Trước khi fix:
const playDanceWithMusic = () => {
  // ❌ KHÔNG clear idle timers
  musicRef.current.play();
  // ❌ Dance đang chạy nhưng idle timer vẫn countdown
  // → Sau 10s idle timer trigger → Animation bị gián đoạn!
};
```

## ✅ Giải pháp

### 1. Tạo `clearAllTimers()` helper

Một function duy nhất để **clear TẤT CẢ timers**:

```typescript
const clearAllTimers = () => {
  console.log('[Timer] Clearing all timers...');
  
  // Clear idle timers
  if (idleTimeoutRef.current) {
    clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = null;
  }
  if (idleSequenceRef.current) {
    clearTimeout(idleSequenceRef.current);
    idleSequenceRef.current = null;
  }
  
  // Clear dance interval
  if (danceIntervalRef.current) {
    clearInterval(danceIntervalRef.current);
    danceIntervalRef.current = null;
  }
  
  // Stop music if playing
  if (musicRef.current && !musicRef.current.paused) {
    musicRef.current.pause();
    musicRef.current.currentTime = 0;
  }
};
```

### 2. Clear timers TRƯỚC khi dance

```typescript
const playDanceWithMusic = () => {
  // ✅ Clear ALL timers trước
  clearAllTimers();
  console.log('[Dance] Starting dance with music...');
  
  // Bây giờ dance không bị gián đoạn
  musicRef.current.play();
  // ...
};
```

### 3. Restart idle timer SAU khi dance xong

```typescript
musicRef.current.onended = () => {
  // Dance xong
  playAnimation('model_pose', 2.0);
  
  // ✅ Restart idle timer SAU khi về pose
  setTimeout(() => {
    startIdleSequence();
  }, 2000); // Chờ 2s rồi mới start
};
```

### 4. Clear timers khi user gửi message

```typescript
const handleSendMessage = async (content: string) => {
  // ✅ Clear ALL timers ngay khi user chat
  clearAllTimers();
  console.log('[Message] User sent message, all timers cleared');
  
  // Xử lý message...
};
```

### 5. Restart idle timer sau TTS (nếu không dance)

```typescript
audio.onended = () => {
  if (shouldDance) {
    playDanceWithMusic(); // Dance sẽ tự restart idle
  } else {
    // ✅ Restart idle nếu không dance
    setTimeout(() => {
      startIdleSequence();
    }, 2000);
  }
};
```

## 🔄 Flow mới

### Trước đây (❌ Có xung đột):

```
User: "hãy nhảy đi"
  ↓
TTS nói xong
  ↓
Dance start (nhạc + animation loop)
  ↓ (đang nhảy...)
⚠️ Idle timer trigger sau 10s → Spin animation
  ↓
❌ Dance bị gián đoạn!
```

### Bây giờ (✅ Không xung đột):

```
User: "hãy nhảy đi"
  ↓
clearAllTimers() → All timers = null
  ↓
TTS nói xong
  ↓
playDanceWithMusic()
  ├─ clearAllTimers() lần nữa (đảm bảo)
  └─ Dance start (nhạc + animation loop)
      ↓ (nhảy hoàn toàn không bị gián đoạn)
      Music ended
        ↓
      model_pose (2s)
        ↓
      setTimeout 2s
        ↓
      ✅ startIdleSequence() → Restart idle timer
```

## 📝 Changes Summary

### Files Modified

**app/page.tsx**:

1. ✅ Added `clearAllTimers()` helper
2. ✅ Clear timers in `playDanceWithMusic()`
3. ✅ Clear timers in `handleSendMessage()`
4. ✅ Restart idle in `musicRef.onended`
5. ✅ Restart idle in `audio.onended` (if not dancing)

## 🎯 Kết quả

### Trước:
❌ Dance bị gián đoạn bởi idle sequence  
❌ Animation chuyển đột ngột giữa chừng  
❌ Trải nghiệm kém  

### Sau:
✅ Dance hoàn toàn không bị gián đoạn  
✅ Idle sequence chỉ trigger khi thích hợp  
✅ Smooth transitions  
✅ Trải nghiệm tốt  

## 🧪 Test Cases

### Test 1: Dance không bị gián đoạn
```
1. User: "nhảy đi"
2. Chờ avatar nói xong
3. Nhạc bắt đầu
4. Quan sát: ✅ Nhảy trọn vẹn không bị gián đoạn
5. Nhạc kết thúc → model_pose
6. Sau 2s → idle sequence bắt đầu ✅
```

### Test 2: Chat không trigger idle sequence giữa chừng
```
1. User: "chào bạn"
2. Avatar nói + gesture
3. Quan sát: ✅ Không bị gián đoạn bởi idle
4. TTS kết thúc
5. Sau 2s → idle sequence bắt đầu ✅
```

### Test 3: Multiple messages liên tiếp
```
1. User: "xin chào"
2. Ngay lập tức: "bạn thế nào"
3. Ngay lập tức: "nhảy đi"
4. Quan sát: ✅ Mỗi message clear timers cũ
5. Chỉ dance mới trigger ✅
```

## 🔍 Debug Logs

Để debug, check console:

```
[Timer] Clearing all timers...          ← clearAllTimers() called
[Message] User sent message, ...        ← User sent message
[Dance] Starting dance with music...    ← Dance started
[VRMA] Detected dance intent...         ← TTS ended, dance triggered
```

## 📊 Timer Lifecycle

```
App Start
  ↓
Load VRM → startIdleSequence() (10s timer)
  ↓
[Idle] 10s passed → runSequence()
  ├─ spin (2s)
  ├─ shoot (2s)
  ├─ squat (2s)
  └─ model_pose (3s) → setTimeout 10s → loop
  
User Interaction (chat/dance)
  ↓
clearAllTimers() → All timers = null
  ↓
Action (TTS/Dance/Gesture)
  ↓
Action ended
  ↓
setTimeout(startIdleSequence, 2000) → Restart cycle
```

## 💡 Best Practices

1. **Luôn clear timers trước khi start action mới**
   ```typescript
   clearAllTimers();
   playAnimation(...);
   ```

2. **Luôn restart idle timer sau action**
   ```typescript
   actionEnded(() => {
     setTimeout(startIdleSequence, 2000);
   });
   ```

3. **Log để debug**
   ```typescript
   console.log('[Timer] ...');
   console.log('[Dance] ...');
   console.log('[Message] ...');
   ```

## 🚀 Status

✅ **Fixed**: Dance không còn bị gián đoạn  
✅ **Tested**: Các trường hợp edge case  
✅ **Production Ready**: Sẵn sàng deploy  

---

**Next Steps**: Test kỹ với nhiều scenarios khác nhau để đảm bảo không có regression!
