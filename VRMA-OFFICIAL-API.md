# VRMA Integration với Official API

## 📚 Tổng Quan

Document này mô tả cách tích hợp VRMA animations sử dụng **official `@pixiv/three-vrm-animation` package** - đây là cách đúng chuẩn theo khuyến nghị của Pixiv.

## 🎯 Vấn Đề Đã Giải Quyết

### Trước đây (Manual Retargeting):
- ❌ Manual bone name mapping (200+ lines code)
- ❌ Tự tạo tracks và retarget
- ❌ Dễ sai với các VRM models khác nhau
- ❌ Không support đầy đủ VRMA spec

### Bây giờ (Official API):
- ✅ Automatic retargeting với `createVRMAnimationClip()`
- ✅ Proper VRMA parsing với `VRMAnimationLoaderPlugin`
- ✅ Support đầy đủ VRMA specification
- ✅ Compatible với mọi VRM models
- ✅ Code ngắn gọn, dễ maintain

## 📦 Dependencies

```json
{
  "@pixiv/three-vrm": "^2.1.0",
  "@pixiv/three-vrm-animation": "^0.1.0",
  "three": "^0.160.0"
}
```

## 🔧 Implementation

### 1. VRMALoader (lib/vrma-loader.ts)

```typescript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM } from '@pixiv/three-vrm';
import { 
  VRMAnimation, 
  VRMAnimationLoaderPlugin, 
  createVRMAnimationClip 
} from '@pixiv/three-vrm-animation';

export class VRMALoader {
  async loadVRMA(source: File | string, vrm?: VRM): Promise<THREE.AnimationClip[]> {
    // 1. Register VRMAnimationLoaderPlugin
    const gltf = await new Promise<any>((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
      loader.load(url, resolve, undefined, reject);
    });

    // 2. Extract VRMAnimation objects
    const vrmAnimations = gltf.userData.vrmAnimations as VRMAnimation[];

    // 3. Convert to AnimationClip using official API
    if (vrm) {
      return vrmAnimations.map(vrmAnimation => 
        createVRMAnimationClip(vrmAnimation, vrm)
      );
    }

    return [];
  }
}
```

**Key Points:**
- `VRMAnimationLoaderPlugin`: Parse VRMA data từ GLTF
- `gltf.userData.vrmAnimations`: Array of VRMAnimation objects
- `createVRMAnimationClip()`: Official retargeting function

### 2. AnimationController (lib/animation-controller.ts)

```typescript
export class AnimationController {
  constructor(vrm: VRM, vrmaAnimations?: Map<string, THREE.AnimationClip[]>) {
    // IMPORTANT: Use vrm.scene as mixer root
    // VRMA clips from createVRMAnimationClip() are already retargeted to vrm.scene
    this.mixer = new THREE.AnimationMixer(vrm.scene);
    
    if (vrmaAnimations) {
      this.vrmaClips = vrmaAnimations;
    }
  }

  private playVRMAAnimation(vrmaName: string): boolean {
    const clips = this.vrmaClips.get(vrmaName);
    if (!clips || clips.length === 0) return false;

    const clip = clips[0];
    const action = this.mixer.clipAction(clip);
    
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().fadeIn(0.5).play();
    
    return true;
  }
}
```

**Key Points:**
- Mixer root: `vrm.scene` (NOT `normalizedHumanBonesRoot`)
- VRMA clips đã được retarget sẵn bởi `createVRMAnimationClip()`
- Priority system: VRMA → Procedural fallback

### 3. useVRMA Hook (hooks/useVRMA.ts)

```typescript
export function useVRMA(vrm?: VRM | null) {
  const reloadAllWithVRM = useCallback(async (
    newVrm: VRM, 
    vrmaFiles: Array<{ name: string; path: string }>
  ) => {
    const loader = new VRMALoader();
    const newAnimations = await loader.loadMultipleVRMA(vrmaFiles, newVrm);
    setAnimations(newAnimations);
  }, []);

  return { animations, reloadAllWithVRM, ... };
}
```

### 4. App Integration (app/page.tsx)

```typescript
const VRMA_FILES = [
  { name: 'show_full_body', path: '/models/VRMA_01 Hiển thị toàn thân.vrma' },
  { name: 'greeting', path: '/models/VRMA_02 Chào hỏi.vrma' },
  // ... 7 files total
];

export default function Home() {
  const { vrm } = useVRM();
  const { animations: vrmaAnimations, reloadAllWithVRM } = useVRMA(vrm);
  const { playAnimation } = useAnimation(vrm, vrmaAnimations);

  // When VRM loads, retarget all VRMA animations
  useEffect(() => {
    if (vrm) {
      reloadAllWithVRM(vrm, VRMA_FILES).then(() => {
        // Play default pose
        playAnimation('model_pose', 3.0);
      });
    }
  }, [vrm]);
}
```

## 🎬 Animation Flow

```
1. Page Load
   ↓
2. Load VRMA files (without VRM)
   ↓
3. User uploads VRM model
   ↓
4. Retarget all VRMA animations to VRM
   │  ├─ VRMAnimationLoaderPlugin parses VRMA
   │  ├─ createVRMAnimationClip() retargets to VRM
   │  └─ AnimationClips ready to use
   ↓
5. Play default animation (model_pose)
   ↓
6. User triggers animations via chat/UI
   │  ├─ Try VRMA animation first
   │  └─ Fallback to procedural if not found
```

## 📊 Console Output

```
🔄 Loading VRMA animations with official API...
Loaded 1 VRM animation(s) from VRMA file
Created AnimationClip "show_full_body" (3.50s, 42 tracks)
✓ Loaded VRMA: show_full_body
Created AnimationClip "greeting" (2.80s, 35 tracks)
✓ Loaded VRMA: greeting
...
✅ Successfully loaded 7 VRMA animation(s)
Animation names: ['show_full_body', 'greeting', 'peace_sign', 'shoot', 'spin', 'model_pose', 'squat']

AnimationController: Loaded VRMA animations: ['show_full_body', 'greeting', ...]
Playing default model_pose animation
Playing VRMA animation: model_pose
```

## ✅ Advantages của Official API

### 1. **Automatic Retargeting**
```typescript
// Before: 200+ lines manual mapping
const boneNameMap = { 'LeftUpperArm': 'leftUpperArm', ... };
// Manual track creation...

// After: 1 line
const clip = createVRMAnimationClip(vrmAnimation, vrm);
```

### 2. **Proper VRMA Parsing**
- Handles all VRMA spec features
- Supports expressions, look-at, constraints
- Future-proof với VRMA updates

### 3. **Better Compatibility**
- Works với VRM 0.x và 1.0
- Handles A-pose và T-pose models
- Automatic bone hierarchy resolution

### 4. **Maintained by Pixiv**
- Official support
- Regular updates
- Bug fixes và improvements

## 🐛 Troubleshooting

### Issue: Model vẫn T-pose

**Cause:** Mixer root không đúng

**Solution:**
```typescript
// ❌ Wrong
this.mixer = new THREE.AnimationMixer(vrm.humanoid.normalizedHumanBonesRoot);

// ✅ Correct
this.mixer = new THREE.AnimationMixer(vrm.scene);
```

### Issue: Animation không play

**Cause:** VRMA chưa được retarget với VRM

**Solution:**
```typescript
// Must pass VRM to loadVRMA
const clips = await loader.loadVRMA(source, vrm); // ✅ With VRM
// NOT: await loader.loadVRMA(source); // ❌ Without VRM
```

### Issue: Console errors về tracks

**Cause:** VRMAnimationLoaderPlugin chưa được register

**Solution:**
```typescript
const loader = new GLTFLoader();
loader.register((parser) => new VRMAnimationLoaderPlugin(parser)); // ✅ Must register
```

## 📚 References

- [VRM Animation Specification](https://github.com/vrm-c/vrm-specification/tree/master/specification/VRMC_vrm_animation-1.0)
- [@pixiv/three-vrm-animation](https://github.com/pixiv/three-vrm/tree/dev/packages/three-vrm-animation)
- [Official Example](https://pixiv.github.io/three-vrm/packages/three-vrm-animation/)
- [Zenn Article (Japanese)](https://zenn.dev/pixiv/articles/three-vrm-animation)

## 🎉 Kết Luận

Implementation hiện tại sử dụng **official API** đúng chuẩn:
- ✅ `VRMAnimationLoaderPlugin` để parse VRMA
- ✅ `createVRMAnimationClip()` để retarget
- ✅ `vrm.scene` làm mixer root
- ✅ Priority system: VRMA → Procedural fallback

**Ready for testing!** 🚀
