# Ground Snapper - Visual Explanation

## 🎯 Problem: Avatar Floating

```
❌ TRƯỚC KHI CÓ GROUND SNAPPER:

    👤 Avatar
   /  \
  /    \
 🦶    🦶  ← Feet floating above ground
  |    |
  |    |
━━━━━━━━━━━━━━━━━━━━━  ← Ground (y=0)
     ⚠️ Gap!
```

## ✅ Solution: Auto-Adjustment

```
✅ SAU KHI CÓ GROUND SNAPPER:

    👤 Avatar
   /  \
  /    \
 🦶    🦶  ← Feet touching ground
━━━━━━━━━━━━━━━━━━━━━  ← Ground (y=0)
     ✓ Perfect!
```

## 🔄 How It Works Each Frame

### Step 1: Measure Feet Positions

```
       👤
      /  \
     /    \
    🦶L   🦶R
    ↓     ↓
  y=0.15  y=0.20  ← World positions
  
━━━━━━━━━━━━━━━━━  Ground (y=0)

leftY = 0.15
rightY = 0.20
lowest = min(0.15, 0.20) = 0.15
```

### Step 2: Calculate Delta

```
delta = (groundY + tolerance) - lowest
delta = (0 + 0.02) - 0.15
delta = -0.13  ← Need to move DOWN 0.13 units
```

### Step 3: Check Jump State

```
Case A: STANDING/WALKING
    👤
   /  \
  🦶  🦶  ← One or both feet near ground
  y=0.15, y=0.20
  
isJumping = false
→ Apply adjustment ✅


Case B: JUMPING
    👤   ← Avatar in air
   /  \
  🦶  🦶  ← Both feet high
  y=0.50, y=0.55
  
  
  
━━━━━━━━━━━  Ground

isJumping = leftY>0.1 && rightY>0.1 = true
→ Don't pull down! ✅
```

### Step 4: Apply Smoothing

```
Raw delta = -0.13

With smoothing (0.25):
shift = delta × 0.25 = -0.13 × 0.25 = -0.0325

With maxStep limit (0.1):
shift = clamp(-0.0325, -0.1, 0.1) = -0.0325 ✅

Final movement: Move DOWN 0.0325 units this frame
```

### Step 5: Move Avatar

```
BEFORE:                    AFTER:
  y=1.50                    y=1.4675
    👤        →               👤
   /  \                      /  \
  🦶  🦶                     🦶  🦶
  0.15 0.20                0.1175 0.1675
                           
━━━━━━━━━━━              ━━━━━━━━━━━

(Next frame will continue adjusting...)
```

## 📊 Frame-by-Frame Example

### Walking Animation (10 frames)

```
Frame | Left | Right | Lowest | Delta | Shift | Avatar Y
------|------|-------|--------|-------|-------|----------
  1   | 0.15 | 0.20  | 0.15   |-0.13  |-0.033 | 1.500 → 1.467
  2   | 0.10 | 0.18  | 0.10   |-0.08  |-0.020 | 1.467 → 1.447
  3   | 0.05 | 0.15  | 0.05   |-0.03  |-0.008 | 1.447 → 1.439
  4   | 0.02 | 0.12  | 0.02   | 0.00  | 0.000 | 1.439 (stable)
  5   | 0.01 | 0.10  | 0.01   | 0.01  | 0.003 | 1.439 → 1.442
  ...
```

## 🎢 Jump Animation Example

```
FULL JUMP CYCLE:

Frame 1: Taking off
    👤
   /|\
  🦶🦶  y=0.05, 0.05
━━━━━━━━━━
isJumping=false → Adjust to ground


Frame 5: In air
      👤
     /|\
    🦶🦶  y=0.60, 0.65
    
    
━━━━━━━━━━
isJumping=true → NO adjustment (let it fly!)


Frame 10: Landing
    👤
   /  \
  🦶  🦶  y=0.20, 0.25
  
━━━━━━━━━━
isJumping=false → Adjust back to ground
```

## 🎛️ Parameters Impact

### Smoothing Effect

```
smoothing = 0.1 (Low - Fast but jerky)
Frame: 0 → 1 → 2 → 3
Gap:   0.15 → 0.135 → 0.12 → 0.11
       ↓↓↓↓    ↓↓↓    ↓↓     ↓


smoothing = 0.5 (High - Slow but smooth)
Frame: 0 → 1 → 2 → 3 → 4 → 5
Gap:   0.15 → 0.075 → 0.038 → 0.019 → 0.010 → 0.005
       ↓       ↓       ↓       ↓       ↓       ↓
```

### Hover Tolerance Effect

```
tolerance = 0 (Strict - stick to ground)
       👤
      /  \
     🦶  🦶  ← Exactly y=0
    ━━━━━━━━━━


tolerance = 0.05 (Relaxed - slight hover OK)
       👤
      /  \
     🦶  🦶  ← Can be y=0.05
      ----
    ━━━━━━━━━━  ← Acceptable gap
```

## 🔍 Edge Cases

### Case 1: Avatar too low (feet underground)

```
    👤
   /  \
━━━🦶━━🦶━━  ← Feet below ground!
  -0.1 -0.05

delta = (0 + 0.02) - (-0.1) = +0.12
shift = +0.03 (move UP)

Result: Lifts avatar up ✅
```

### Case 2: One foot on ground, one lifted

```
    👤
   /  \
  🦶   🦶
y=0.02 y=0.40  ← Walking step
  
━━━━━━━━━━

lowest = 0.02
Uses the LOWEST foot only ✅
Other foot can be high (natural)
```

### Case 3: Both feet very high (double jump)

```
        👤
       /|\
      🦶🦶
    y=1.0, 1.05  ← Way above ground
    
    
    
━━━━━━━━━━

isJumping = true
NO adjustment - let it soar! ✅
```

## 💡 Key Insights

1. **Always use LOWEST foot** - ensures at least one foot grounded
2. **Jump detection** - prevents pulling down mid-air
3. **Smoothing** - no sudden jumps, gradual adjustment
4. **Tolerance** - small hover acceptable for natural look
5. **No file modification** - pure runtime solution

## 🎯 Result

```
WITHOUT Ground Snapper:          WITH Ground Snapper:
    
    👤  Floating                     👤  Grounded
   /  \                             /  \
  🦶  🦶  ← Gap!                   🦶  🦶  ← Perfect!
   ↕️↕️                             ✓✓
━━━━━━━━━━━                      ━━━━━━━━━━━
❌ Looks unnatural               ✅ Looks natural
❌ Shadow disconnected           ✅ Shadow accurate
❌ Immersion broken              ✅ Immersion maintained
```

---

**Conclusion**: Simple algorithm, powerful results! 🎉
