# VRMA Animation Integration - Testing Guide

## Prerequisites
✅ Dev server đã khởi động tại http://localhost:3000

## Testing Checklist

### Phase 1: Initial Load & Console Verification (CRITICAL)

#### Step 1.1: Open Browser Console
1. Mở http://localhost:3000 trong browser
2. Mở Developer Tools (F12)
3. Chuyển sang tab "Console"

#### Step 1.2: Verify VRMA Loading Messages
Bạn nên thấy các messages sau trong console:

```
✅ Expected Console Output:
Loading VRMA animations...
Loaded VRMA: show_full_body
Loaded VRMA: greeting
Loaded VRMA: peace_sign
Loaded VRMA: shoot
Loaded VRMA: spin
Loaded VRMA: model_pose
Loaded VRMA: squat
All VRMA animations loaded
```

**❌ If you see errors:**
- Check if VRMA files exist in `public/models/`
- Check file names match exactly (including spaces and Vietnamese characters)
- Look for CORS errors or file loading errors

#### Step 1.3: Check for Compilation Errors
```
✅ Expected: No TypeScript or compilation errors
❌ If errors: Note them down and report
```

---

### Phase 2: VRM Model Upload & Initialization

#### Step 2.1: Upload VRM Model
1. Click on Settings/Control Panel button
2. Upload a VRM model file
3. Wait for model to load

#### Step 2.2: Verify Animation Controller Initialization
Check console for:
```
✅ Expected:
useAnimation: AnimationController initialized with VRMA animations
AnimationController: Loaded VRMA animations: [show_full_body, greeting, peace_sign, shoot, spin, model_pose, squat]
```

**❌ If not showing:**
- VRM model may not have loaded properly
- Check for errors in console

---

### Phase 3: Test VRMA Animations (CRITICAL)

Test each animation by triggering them through chat or direct commands.

#### Animation 1: Show Full Body
**Trigger:** Say "show full body" or "hiển thị toàn thân"
```
✅ Expected Console:
Playing VRMA animation: show_full_body

✅ Expected Visual:
- Avatar raises both arms to sides
- Shows full body pose
- Returns to idle after ~3 seconds

❌ Fallback (if VRMA not loaded):
Playing procedural animation: show_full_body
```

#### Animation 2: Greeting (Wave)
**Trigger:** Say "wave" or "chào" or "hello"
```
✅ Expected Console:
Playing VRMA animation: greeting

✅ Expected Visual:
- Avatar waves hand
- Natural greeting motion
- Returns to idle

❌ Fallback:
Playing procedural animation: wave
```

#### Animation 3: Peace Sign
**Trigger:** Say "peace sign" or "ký hiệu hòa bình"
```
✅ Expected Console:
Playing VRMA animation: peace_sign

✅ Expected Visual:
- Avatar shows peace sign with hands
- Both hands raised
- Returns to idle

❌ Fallback:
Playing procedural animation: peace
```

#### Animation 4: Shoot (Point)
**Trigger:** Say "shoot" or "point" or "bắn"
```
✅ Expected Console:
Playing VRMA animation: shoot

✅ Expected Visual:
- Avatar points forward
- Shooting gesture
- Returns to idle

❌ Fallback:
Playing procedural animation: point
```

#### Animation 5: Spin (Dance)
**Trigger:** Say "spin" or "dance" or "xoay"
```
✅ Expected Console:
Playing VRMA animation: spin

✅ Expected Visual:
- Avatar spins around
- 360-degree rotation
- Returns to idle

❌ Fallback:
Playing procedural animation: dance
```

#### Animation 6: Model Pose (Stand)
**Trigger:** Say "model pose" or "stand" or "tư thế mẫu"
```
✅ Expected Console:
Playing VRMA animation: model_pose

✅ Expected Visual:
- Avatar strikes model pose
- Professional standing pose
- Returns to idle

❌ Fallback:
Playing procedural animation: stand
```

#### Animation 7: Squat (Sit)
**Trigger:** Say "squat" or "sit" or "tập squat"
```
✅ Expected Console:
Playing VRMA animation: squat

✅ Expected Visual:
- Avatar performs squat motion
- Bends knees and lowers body
- Returns to idle

❌ Fallback:
Playing procedural animation: sit
```

---

### Phase 4: Edge Cases Testing

#### Test 4.1: Animation Without VRM Model
1. Refresh page (don't upload VRM)
2. Try triggering animations
```
✅ Expected:
- VRMA files still load
- Console shows loading messages
- No animations play (no model to animate)
- No errors in console
```

#### Test 4.2: Multiple Animation Triggers
1. Trigger animation 1
2. Immediately trigger animation 2 (before 1 finishes)
```
✅ Expected:
- Animation 1 fades out
- Animation 2 starts smoothly
- No jerky movements
- Console shows both animation logs
```

#### Test 4.3: Rapid Animation Switching
1. Trigger 3-4 animations quickly in succession
```
✅ Expected:
- Smooth transitions
- No memory leaks
- Console shows all animation logs
- Avatar returns to idle after last animation
```

#### Test 4.4: Reload Page
1. Reload page with VRM model loaded
```
✅ Expected:
- VRMA files reload
- All console messages appear again
- VRM model needs to be re-uploaded
- No cached animation issues
```

---

### Phase 5: Integration Testing

#### Test 5.1: Chat + Animation Flow
1. Send chat message: "Hello, can you wave?"
2. Wait for AI response
```
✅ Expected:
- AI responds with text
- Avatar plays greeting/wave animation
- TTS speaks the response
- Lip sync works during speech
- Animation completes smoothly
```

#### Test 5.2: TTS + Animation Sync
1. Trigger animation that includes speech
```
✅ Expected:
- Animation plays
- TTS audio plays
- Lip sync synchronized
- No audio/visual lag
```

#### Test 5.3: Multiple Interactions
1. Have 5-10 chat interactions with various animation triggers
```
✅ Expected:
- All animations work consistently
- No performance degradation
- No memory leaks (check browser memory)
- Console remains clean (no repeated errors)
```

---

### Phase 6: Performance Testing

#### Test 6.1: Memory Usage
1. Open browser Task Manager (Shift+Esc in Chrome)
2. Monitor memory usage during:
   - Initial load
   - VRM upload
   - Multiple animations
   - Extended use (10+ minutes)
```
✅ Expected:
- Memory increases on VRM load (normal)
- Memory stable during animations
- No continuous memory growth
- Memory releases on page reload
```

#### Test 6.2: Animation Smoothness
1. Play each animation and observe
```
✅ Expected:
- 60 FPS or close
- No stuttering
- Smooth transitions
- No frame drops
```

#### Test 6.3: Console Performance
1. Check for performance warnings
```
✅ Expected:
- No "long task" warnings
- No "forced reflow" warnings
- No excessive re-renders
```

---

## Test Results Template

Copy this template and fill in your results:

```markdown
# VRMA Animation Testing Results

**Date:** [DATE]
**Tester:** [YOUR NAME]
**Browser:** [Chrome/Firefox/Safari] [VERSION]
**OS:** [Windows/Mac/Linux]

## Phase 1: Initial Load ✅/❌
- [ ] VRMA files loaded successfully
- [ ] All 7 animations loaded
- [ ] No console errors
- [ ] Notes: ___________

## Phase 2: VRM Initialization ✅/❌
- [ ] VRM model uploaded successfully
- [ ] AnimationController initialized
- [ ] VRMA animations passed to controller
- [ ] Notes: ___________

## Phase 3: Animation Testing ✅/❌
- [ ] show_full_body: ✅/❌ (VRMA/Fallback)
- [ ] greeting: ✅/❌ (VRMA/Fallback)
- [ ] peace_sign: ✅/❌ (VRMA/Fallback)
- [ ] shoot: ✅/❌ (VRMA/Fallback)
- [ ] spin: ✅/❌ (VRMA/Fallback)
- [ ] model_pose: ✅/❌ (VRMA/Fallback)
- [ ] squat: ✅/❌ (VRMA/Fallback)
- [ ] Notes: ___________

## Phase 4: Edge Cases ✅/❌
- [ ] No VRM model scenario
- [ ] Multiple animation triggers
- [ ] Rapid switching
- [ ] Page reload
- [ ] Notes: ___________

## Phase 5: Integration ✅/❌
- [ ] Chat + Animation
- [ ] TTS + Animation sync
- [ ] Multiple interactions
- [ ] Notes: ___________

## Phase 6: Performance ✅/❌
- [ ] Memory usage acceptable
- [ ] Animation smoothness
- [ ] No console warnings
- [ ] Notes: ___________

## Issues Found
1. [Issue description]
2. [Issue description]
3. ...

## Overall Result: ✅ PASS / ❌ FAIL

## Recommendations
- [Any suggestions for improvements]
```

---

## Quick Test (Minimal)

If you want to do a quick sanity check:

1. ✅ Open http://localhost:3000
2. ✅ Check console for VRMA loading messages
3. ✅ Upload VRM model
4. ✅ Test 2-3 animations
5. ✅ Verify no errors in console

**If all above pass → Implementation is working!**

---

## Troubleshooting

### Issue: VRMA files not loading
**Solution:**
- Check file paths in `app/page.tsx`
- Verify files exist in `public/models/`
- Check browser network tab for 404 errors

### Issue: Animations not playing
**Solution:**
- Verify VRM model is loaded
- Check AnimationController initialization
- Look for errors in console

### Issue: Fallback animations always playing
**Solution:**
- VRMA files may not be loading
- Check console for loading errors
- Verify VRMA file format is correct

### Issue: Performance problems
**Solution:**
- Check browser memory usage
- Verify no memory leaks
- Consider reducing animation complexity

---

## Next Steps After Testing

1. **If all tests pass:**
   - Document any observations
   - Mark task as complete
   - Consider additional features

2. **If tests fail:**
   - Document specific failures
   - Check error messages
   - Review implementation
   - Fix issues and retest

3. **If partial success:**
   - Note which animations work
   - Identify patterns in failures
   - Prioritize fixes

---

## Contact & Support

If you encounter issues during testing:
1. Copy console errors
2. Note which test phase failed
3. Describe expected vs actual behavior
4. Provide screenshots if possible
