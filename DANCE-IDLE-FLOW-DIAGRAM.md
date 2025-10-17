# 🎬 Dance vs Idle Sequence - Flow Diagram

## ❌ TRƯỚC KHI FIX (Có xung đột)

```
Timeline:
0s ────────────────────────────────────────────────────────────────→
   User: "nhảy đi"
   ↓
   clearMessage timers? NO
   ↓
   TTS playing...
   ↓
5s Dance start
   │  ↓
   │  Animation loop: nhảy...nhảy...nhảy...
   │  Music playing...
   │
10s│  ⚠️ IDLE TIMER TRIGGER (vẫn đang countdown!)
   │    ↓
   │    runSequence()
   │      ↓
   │    ❌ SPIN animation override!
   │
15s│  ❌ Avatar quay (đang lẽ phải nhảy)
   │
   └─ ❌ CONFLICT! Dance bị gián đoạn
```

## ✅ SAU KHI FIX (Không xung đột)

```
Timeline:
0s ────────────────────────────────────────────────────────────────→
   User: "nhảy đi"
   ↓
   🔧 clearAllTimers()
   │  ├─ idleTimeoutRef = null
   │  ├─ idleSequenceRef = null
   │  └─ danceIntervalRef = null
   ↓
   TTS playing...
   ↓
5s Dance start
   │  ↓
   │  🔧 clearAllTimers() (again)
   │  ↓
   │  Animation loop: nhảy...nhảy...nhảy...
   │  Music playing...
   │
10s│  ✅ No timer running
   │  ✅ Continue dancing
   │
15s│  ✅ Still dancing
   │
30s└─ Music ended
      ↓
      model_pose (2s)
      ↓
32s   setTimeout(2s)
      ↓
34s   ✅ startIdleSequence()
      ↓
44s   ✅ Now idle sequence can run
```

## 🔄 Timer State Changes

### Scenario 1: Dance

```
State: IDLE
  idleTimeoutRef: [Timer-10s]
  idleSequenceRef: null
  danceIntervalRef: null
  
↓ User: "nhảy đi"

State: CLEARING
  🔧 clearAllTimers()
  idleTimeoutRef: null ✓
  idleSequenceRef: null ✓
  danceIntervalRef: null ✓
  
↓ TTS playing

State: TTS
  (all timers still null)
  
↓ TTS ended

State: DANCE_START
  🔧 clearAllTimers() (safety)
  ↓
  danceIntervalRef: [Interval-2.8s] ✓
  musicRef: playing ✓
  
↓ Dancing...

State: DANCING
  danceIntervalRef: [Active]
  (no idle timers!)
  
↓ Music ended

State: DANCE_END
  danceIntervalRef: null
  playAnimation('model_pose')
  
↓ Wait 2s

State: RESTART_IDLE
  setTimeout → startIdleSequence()
  ↓
  idleTimeoutRef: [Timer-10s] ✓
  
↓ Back to IDLE state
```

### Scenario 2: Chat (không dance)

```
State: IDLE
  idleTimeoutRef: [Timer-10s]
  
↓ User: "xin chào"

State: CLEARING
  🔧 clearAllTimers()
  idleTimeoutRef: null ✓
  
↓ TTS + Gesture

State: SPEAKING
  (all timers null)
  
↓ TTS ended

State: SPEECH_END
  shouldDance? NO
  ↓
  setTimeout(2s) → startIdleSequence()
  
↓ Wait 2s

State: RESTART_IDLE
  idleTimeoutRef: [Timer-10s] ✓
  
↓ Back to IDLE
```

## 🎭 Multiple Actions Sequence

```
Action Flow:
┌─────────────────────────────────────────────────────┐
│ User Action (chat/dance/gesture)                    │
└──────────────────┬──────────────────────────────────┘
                   ↓
          🔧 clearAllTimers()
          ├─ Stop all timers
          ├─ Stop music (if any)
          └─ Clean state
                   ↓
          Execute Action
          ├─ TTS
          ├─ Gesture
          ├─ Dance
          └─ Animation
                   ↓
          Action Completed
                   ↓
          Wait Strategy
          ├─ If Dance → wait for music end
          ├─ If TTS → wait for audio end
          └─ If Gesture → wait for animation end
                   ↓
          setTimeout(2000)
                   ↓
          🔄 startIdleSequence()
                   ↓
          Back to Normal Idle Cycle
```

## 📊 Comparison Table

| Aspect | Trước Fix | Sau Fix |
|--------|-----------|---------|
| **Timer Management** | ❌ Scattered | ✅ Centralized (`clearAllTimers()`) |
| **Dance Interruption** | ❌ Bị gián đoạn sau 10s | ✅ Hoàn toàn không bị gián đoạn |
| **Chat Flow** | ❌ Idle có thể trigger giữa chừng | ✅ Clean, restart sau TTS |
| **Code Clarity** | ❌ Complex, hard to debug | ✅ Clear flow với logs |
| **User Experience** | ❌ Jerky, unexpected | ✅ Smooth, predictable |

## 🔍 Edge Cases Handled

### Case 1: Rapid Messages
```
User: "chào" → "khỏe ko" → "nhảy đi" (liên tiếp)
  ↓
Each message:
  🔧 clearAllTimers() → Clean slate
  ↓
Only last action (dance) executes
  ✅ No conflict
```

### Case 2: Dance During Idle Sequence
```
Idle sequence running: spin → shoot → squat
                       ↑
User: "nhảy đi" (giữa chừng)
  ↓
🔧 clearAllTimers()
  ├─ Stop idle sequence immediately
  └─ Clear all timers
  ↓
Dance start
  ✅ Clean switch
```

### Case 3: Stop Music Mid-Dance
```
Dancing...
  ↓
User: "dừng lại" or new action
  ↓
🔧 clearAllTimers()
  ├─ musicRef.pause()
  ├─ danceIntervalRef = null
  └─ All timers cleared
  ✅ Clean stop
```

## 💡 Key Insights

1. **Single Source of Truth**: `clearAllTimers()` là điểm duy nhất để cleanup
2. **Always Clear Before Start**: Mọi action đều bắt đầu với clean state
3. **Always Restart After End**: Mọi action kết thúc đều restart idle
4. **Defensive Programming**: Clear twice nếu cần (safety)

## 🎯 Result

```
Before:
  User Experience: 😠 Frustrating
  Code Quality: 🍝 Spaghetti
  Maintainability: 😰 Hard
  
After:
  User Experience: 😊 Smooth
  Code Quality: 🎯 Clean
  Maintainability: 😎 Easy
```

---

**Conclusion**: Centralized timer management = Happy users! 🎉
