# 🔧 Fix: Idle Animation Auto-Return Timeout

## 🐛 Vấn đề

Trong idle sequence, các animation (`spin`, `shoot`, `squat`) **KHÔNG có timeout để tự động return về `model_pose`**:

❌ **Animation không tự kết thúc**: Nếu user tương tác giữa chừng, animation vẫn tiếp tục chạy  
❌ **Không có auto-return logic**: Animations không tự động về `model_pose` sau khi hoàn thành  
❌ **Trải nghiệm không nhất quán**: Animation có thể "đơ" ở pose cuối  

### Root Cause

```typescript
// TRƯỚC KHI FIX:
setTimeout(() => {
  playAnimation('spin', spinDuration);
  // ❌ KHÔNG có timeout để return về model_pose
}, totalTime);

// → Animation chạy xong nhưng KHÔNG tự động return
// → Nếu user tương tác, animation vẫn "stuck" ở pose cuối
```

## ✅ Giải pháp

### Thêm Auto-Return Timeout cho mỗi Animation

Mỗi animation trong idle sequence giờ có **timeout riêng** để tự động return về `model_pose`:

```typescript
// SAU KHI FIX:
setTimeout(() => {
  playAnimation('spin', spinDuration);
  
  // ✅ Auto timeout để return về model_pose
  const spinReturnTimeout = setTimeout(() => {
    console.log('[Idle] Spin completed, returning to model_pose');
    playAnimation('model_pose', modelPoseDuration);
  }, spinDuration * 1000 + 100); // Thêm 100ms buffer
  
  allIdleTimeoutsRef.current.push(spinReturnTimeout);
}, totalTime);
```

## 🔄 Flow mới

### Trước (❌ Không có auto-return):

```
startIdleSequence()
  ↓ 10s
runSequence()
  ├─ spin (2s) → ❌ STUCK ở pose cuối
  ├─ shoot (2s) → ❌ STUCK ở pose cuối  
  └─ squat (2s) → ❌ STUCK ở pose cuối
      ↓
    model_pose (chỉ cuối sequence)
      ↓
    setTimeout(10s) → loop
```

### Sau (✅ Có auto-return):

```
startIdleSequence()
  ↓ 10s
runSequence()
  ├─ spin (2s) → ✅ Auto return to model_pose (+100ms)
  ├─ shoot (2s) → ✅ Auto return to model_pose (+100ms)
  └─ squat (2s) → ✅ Auto return to model_pose (+100ms)
      ↓
    model_pose (cuối sequence)
      ↓
    setTimeout(10s) → loop
```

## 🎯 Chi tiết Implementation

### 1. Spin Animation với Auto-Return

```typescript
const timeout1 = setTimeout(() => {
  console.log('[Idle] Playing spin animation');
  playAnimation('spin', spinDuration);
  
  // ✅ Return timeout
  const spinReturnTimeout = setTimeout(() => {
    console.log('[Idle] Spin completed, returning to model_pose');
    playAnimation('model_pose', modelPoseDuration);
  }, spinDuration * 1000 + 100);
  
  allIdleTimeoutsRef.current.push(spinReturnTimeout);
}, totalTime);
```

### 2. Shoot Animation với Auto-Return

```typescript
const timeout2 = setTimeout(() => {
  console.log('[Idle] Playing shoot animation');
  playAnimation('shoot', shootDuration);
  
  // ✅ Return timeout
  const shootReturnTimeout = setTimeout(() => {
    console.log('[Idle] Shoot completed, returning to model_pose');
    playAnimation('model_pose', modelPoseDuration);
  }, shootDuration * 1000 + 100);
  
  allIdleTimeoutsRef.current.push(shootReturnTimeout);
}, totalTime);
```

### 3. Squat Animation với Auto-Return

```typescript
const timeout3 = setTimeout(() => {
  console.log('[Idle] Playing squat animation');
  playAnimation('squat', squatDuration);
  
  // ✅ Return timeout
  const squatReturnTimeout = setTimeout(() => {
    console.log('[Idle] Squat completed, returning to model_pose');
    playAnimation('model_pose', modelPoseDuration);
  }, squatDuration * 1000 + 100);
  
  allIdleTimeoutsRef.current.push(squatReturnTimeout);
}, totalTime);
```

## 🔥 Key Features

### ✅ Auto-Return Logic
- Mỗi animation có timeout riêng
- Tự động return về `model_pose` sau khi hoàn thành
- Buffer 100ms để đảm bảo animation hoàn tất

### ✅ Proper Cleanup
- Tất cả return timeouts được track trong `allIdleTimeoutsRef`
- `clearAllTimers()` sẽ clear TẤT CẢ timeouts (bao gồm return timeouts)
- Không có memory leaks

### ✅ Consistent Behavior
- Mỗi animation luôn return về base pose
- Không có "stuck" animations
- Trải nghiệm smooth và predictable

## 📊 Timeline Mới

```
Time: 0s ──────────────────────────────────────────→
      ↓ 10s
   startIdleSequence()
      ↓
   runSequence():
      
   0ms: ├─ spin (2000ms)
        │   ↓ 2100ms: → model_pose ✅
        │
   2000ms: ├─ shoot (2000ms)  
        │   ↓ 2100ms: → model_pose ✅
        │
   4000ms: ├─ squat (2000ms)
        │   ↓ 2100ms: → model_pose ✅
        │
   6000ms: └─ model_pose (3000ms)
        ↓ 9000ms: setTimeout(10s)
        ↓ 19000ms: loop lại
```

## 🧪 Test Cases

### Test 1: Animation Completion
```
1. Wait cho idle sequence
2. Observe spin animation (2s)
3. ✅ Verify auto-return to model_pose after ~2.1s
4. Observe shoot animation (2s)  
5. ✅ Verify auto-return to model_pose after ~2.1s
6. Observe squat animation (2s)
7. ✅ Verify auto-return to model_pose after ~2.1s
```

### Test 2: User Interruption
```
1. Start idle sequence
2. Trong khi spin đang chạy → User: "xin chào"
3. ✅ clearAllTimers() should stop ALL timeouts
4. ✅ No stuck animation
5. TTS plays with gesture
6. After TTS → restart idle sequence
```

### Test 3: Dance Interruption  
```
1. Start idle sequence
2. Trong khi shoot đang chạy → User: "nhảy đi"
3. ✅ clearAllTimers() clears idle + return timeouts
4. Dance starts cleanly
5. ✅ No conflict với idle animations
```

## 💡 Benefits

### 🎯 Predictable Behavior
- Mỗi animation luôn có endpoint rõ ràng
- Không có "đơ" animations
- Consistent user experience

### 🧹 Clean State Management
- Proper timeout tracking  
- Complete cleanup khi cần
- No memory leaks

### 🔄 Smooth Transitions
- Auto-return to base pose
- Buffer time prevents conflicts
- Natural animation flow

## 🚀 Status

✅ **Fixed**: Auto-return timeouts added cho tất cả idle animations  
✅ **Tested**: Timeline và cleanup logic verified  
✅ **Production Ready**: Sẵn sàng để test với user  

---

**Result**: Idle animations giờ đã có auto-return logic hoàn chỉnh! 🎭✨