# VRMA Animation Fix Report

## Vấn Đề Ban Đầu

Model VRM hiển thị sai tư thế khi load VRMA animations:
- **VRoid Hub**: Model đứng thẳng, tay xuống tự nhiên
- **App**: Model ở T-pose (tay dang ra)

## Nguyên Nhân

VRMA animations không được **retarget** đúng cách vào VRM skeleton:

1. **Bone Name Mismatch**: VRMA files sử dụng humanoid bone names chuẩn (VD: "LeftUpperArm"), nhưng VRM models có bone names riêng
2. **Mixer Root Incorrect**: AnimationMixer được tạo với `vrm.scene` thay vì `vrm.humanoid.normalizedHumanBonesRoot`
3. **No Retargeting**: Animations được load nhưng không được map vào bones của VRM

## Giải Pháp Đã Implement

### 1. VRMALoader Enhancement (`lib/vrma-loader.ts`)

**Thêm Retargeting System:**
```typescript
async loadVRMA(source: File | string, vrm?: VRM): Promise<THREE.AnimationClip[]>
```

**Key Features:**
- Bone name mapping từ VRMA standard sang VRM humanoid bones
- Track retargeting với actual bone names từ VRM
- Support tất cả humanoid bones (body, arms, legs, fingers)

**Bone Mapping Example:**
```typescript
'LeftUpperArm' → vrm.humanoid.getNormalizedBoneNode('leftUpperArm')
'RightHand' → vrm.humanoid.getNormalizedBoneNode('rightHand')
```

### 2. AnimationController Fix (`lib/animation-controller.ts`)

**Correct Mixer Root:**
```typescript
// OLD (Wrong):
this.mixer = new THREE.AnimationMixer(vrm.scene);

// NEW (Correct):
const mixerRoot = vrm.humanoid?.normalizedHumanBonesRoot || vrm.scene;
this.mixer = new THREE.AnimationMixer(mixerRoot);
```

**Why This Matters:**
- `normalizedHumanBonesRoot` là root node của humanoid skeleton
- Animations target bones relative to this root
- Đảm bảo transformations được apply đúng hierarchy

### 3. useVRMA Hook Update (`hooks/useVRMA.ts`)

**Accept VRM Parameter:**
```typescript
export function useVRMA(vrm?: VRM | null)
```

**Retargeting Function:**
```typescript
reloadAllWithVRM(newVrm: VRM, vrmaFiles: Array<{name, path}>)
```

**Workflow:**
1. Load VRMA files initially (without VRM)
2. When VRM loads → retarget all animations
3. Animations now work with specific VRM model

### 4. App Integration (`app/page.tsx`)

**Two-Phase Loading:**
```typescript
// Phase 1: Load VRMA files on mount
useEffect(() => {
  loadAllVRMA(); // Load raw VRMA data
}, []);

// Phase 2: Retarget when VRM loads
useEffect(() => {
  if (vrm) {
    reloadAllWithVRM(vrm, VRMA_FILES); // Retarget to VRM
    playAnimation('model_pose', 3.0);  // Default pose
  }
}, [vrm]);
```

## Technical Details

### Bone Name Mapping

VRMA uses standard humanoid names, VRM uses camelCase:

| VRMA Name | VRM Humanoid Name |
|-----------|-------------------|
| Hips | hips |
| Spine | spine |
| LeftUpperArm | leftUpperArm |
| RightHand | rightHand |
| LeftUpperLeg | leftUpperLeg |
| ... | ... |

### Track Retargeting Process

1. **Parse Track Name**: `"LeftUpperArm.quaternion"` → bone: `"LeftUpperArm"`, property: `"quaternion"`
2. **Map to VRM**: `"LeftUpperArm"` → `vrm.humanoid.getNormalizedBoneNode('leftUpperArm')`
3. **Get Actual Name**: VRM bone's actual name in scene graph (e.g., `"J_Bip_L_UpperArm"`)
4. **Create New Track**: `"J_Bip_L_UpperArm.quaternion"` with same keyframe data
5. **Build New Clip**: Combine all retargeted tracks

### Animation Mixer Hierarchy

```
vrm.scene (Root)
  └── vrm.humanoid.normalizedHumanBonesRoot (Humanoid Root) ← Mixer targets this
        ├── hips
        │   ├── spine
        │   │   ├── chest
        │   │   │   ├── neck
        │   │   │   │   └── head
        │   │   │   ├── leftShoulder
        │   │   │   │   └── leftUpperArm
        │   │   │   │       └── leftLowerArm
        │   │   │   │           └── leftHand
        │   │   │   └── rightShoulder
        │   │   │       └── rightUpperArm
        │   │   │           └── rightLowerArm
        │   │   │               └── rightHand
        │   ├── leftUpperLeg
        │   │   └── leftLowerLeg
        │   │       └── leftFoot
        │   └── rightUpperLeg
        │       └── rightLowerLeg
        │           └── rightFoot
        └── ... (other bones)
```

## Results

### Before Fix:
- ❌ VRMA animations loaded but not applied
- ❌ Model stuck in T-pose
- ❌ Console: "Playing procedural animation" (fallback)

### After Fix:
- ✅ VRMA animations properly retargeted
- ✅ Model displays correct poses
- ✅ Console: "Playing VRMA animation: model_pose"
- ✅ Smooth transitions between animations
- ✅ Default pose (model_pose) on VRM load

## Console Output Example

```
Loading VRMA animations...
Loaded VRMA: show_full_body (will retarget when VRM is loaded)
Loaded VRMA: greeting (will retarget when VRM is loaded)
...
All VRMA animations loaded

[VRM Upload]

Reloading all VRMA animations with VRM retargeting...
Retargeted VRMA clip "show_full_body": 45 tracks -> 42 tracks
Retargeted VRMA clip "greeting": 38 tracks -> 35 tracks
...
All VRMA animations retargeted to VRM

Playing default model_pose animation
Playing VRMA animation: model_pose
```

## Testing Checklist

- [x] VRMA files load successfully
- [x] VRM model loads successfully
- [x] Retargeting completes without errors
- [x] Model_pose plays as default
- [x] All 7 VRMA animations work correctly
- [x] Smooth transitions between animations
- [x] No T-pose issues
- [x] Console logs show VRMA usage (not fallback)

## Files Modified

1. ✅ `lib/vrma-loader.ts` - Added retargeting logic
2. ✅ `lib/animation-controller.ts` - Fixed mixer root
3. ✅ `hooks/useVRMA.ts` - Added VRM parameter & reload function
4. ✅ `app/page.tsx` - Two-phase loading implementation

## References

- VRM Specification: https://github.com/vrm-c/vrm-specification
- VRMA Format: https://github.com/vrm-c/vrm-specification/tree/master/specification/VRMC_vrm_animation-1.0
- Three.js AnimationMixer: https://threejs.org/docs/#api/en/animation/AnimationMixer
- VRM Humanoid Bones: https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/humanoid.md

## Notes

- Retargeting chỉ cần thực hiện 1 lần khi VRM load
- Animations được cache sau khi retarget
- Fallback animations vẫn available nếu VRMA không có
- System tương thích với mọi VRM model (standard humanoid)
