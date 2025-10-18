# 🐛 VRM Multi-Model Rendering Issues - Need Help!

## 📋 Tổng quan vấn đề

Đang phát triển hệ thống Multi-VRM Scene để hiển thị 3 models VRM cùng lúc trong không gian 3D, nhưng gặp nhiều lỗi nghiêm trọng.

## 🔴 Các vấn đề hiện tại

### 1. **Models bị render toàn bộ màu đen**
- **Hiện tượng**: VRM models hiển thị hoàn toàn đen, không thấy textures/colors
- **Nghi ngờ**: 
  - Materials bị configure sai (transparency/alphaTest)
  - Textures không được load từ VRM file
  - Lighting setup không đúng
  - VRMLoader không preserve materials gốc

### 2. **Models bị chồng lên nhau**
- **Hiện tượng**: 3 models xuất hiện cùng vị trí hoặc rất gần nhau
- **Nghi ngờ**:
  - Position calculations không đúng
  - Group hierarchy issues
  - VRM scene được share giữa nhiều components

### 3. **Models xuất hiện ở T-pose**
- **Hiện tượng**: Models có pose lạ, tay dang ra như chữ T
- **Nghi ngờ**:
  - VRM0 rotation không được apply đúng
  - VRM initialization sequence sai
  - Animation system chưa được setup

### 4. **Models quá nhỏ**
- **Hiện tượng**: Phải zoom rất nhiều mới thấy models
- **Nghi ngờ**:
  - Scale normalization issue
  - Camera position/FOV không phù hợp
  - Bounding box calculations sai

## 🛠️ Cấu trúc code chính

### Files quan trọng:

1. **`components/MultiVRMScene.tsx`**
   - Component chính render 3 VRM models
   - Xử lý positioning, lighting, camera
   - Auto-fit logic

2. **`hooks/useMultiVRM.ts`**
   - Hook quản lý 3 VRM slots
   - Load/unload VRM files
   - Race condition protection

3. **`lib/vrm-loader.ts`**
   - Load VRM từ File hoặc URL
   - Configure materials và visibility
   - Apply VRM0 rotation fix

4. **`components/MultiVRMUploader.tsx`**
   - UI để upload 3 VRM files
   - Main character + 2 assistants

### Tech Stack:
- Next.js 14.2.33
- React Three Fiber
- @pixiv/three-vrm
- THREE.js

## 📸 Screenshots

Models hiện tại:
- ✅ Load thành công (3/3 trong debug panel)
- ❌ Hiển thị toàn bộ đen
- ❌ T-pose
- ❌ Chồng lên nhau hoặc quá nhỏ

## 🔍 Những gì đã thử

### Material Fixes:
```typescript
// Đã thử: Không force transparency cho tất cả materials
const needsTransparency = mat.alphaTest > 0 || mat.opacity < 1;
if (needsTransparency) {
  mat.transparent = true;
} else {
  mat.transparent = false;
  mat.depthWrite = true;
}
```

### Lighting Improvements:
```typescript
<ambientLight intensity={1.2} />
<directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
<directionalLight position={[-5, 5, -5]} intensity={0.8} />
<hemisphereLight args={['#ffffff', '#9bd0e3', 0.6]} />
<pointLight position={[0, 5, 5]} intensity={0.5} />
```

### Position Spacing:
```typescript
// Tăng khoảng cách từ 0.6m lên 1.2m
positions = [[0,0,0], [-1.2,0,-0.8], [1.2,0,-0.8]]
```

### VRM0 Rotation:
```typescript
const needsRotation = vrm.meta?.metaVersion === '0';
if (needsRotation) {
  vrm.scene.rotation.y = Math.PI;
}
```

## 🆘 Cần trợ giúp

### Ưu tiên cao:
1. **Fix materials rendering black** - Quan trọng nhất!
2. Fix models overlapping
3. Fix T-pose issue
4. Optimize camera/scale

### Thông tin debug:
- Mở Console (F12) để xem logs:
  - `[VRMLoader] Material config:` - material properties
  - `[VRMModel] Setup complete:` - position và rotation info
  - `[RENDER] VRM ${i}:` - render info

### Câu hỏi:
1. VRM materials có đang được load đúng không? (hasMap, color)
2. VRMLoader có cần config đặc biệt cho textures không?
3. React Three Fiber có conflicts với VRM scene hierarchy không?
4. Có cách nào debug THREE.js scene hierarchy tốt hơn?

## 🚀 Setup để test

```bash
# Clone repo
git clone https://github.com/seringuyen05062-create/fixloi.git
cd fixloi

# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:3000
# Click hamburger menu → Settings → Multi mode
# Upload 3 VRM files
```

## 📁 Test VRM Files

Cần VRM files để test. Có thể download từ:
- [VRoid Hub](https://hub.vroid.com/)
- [Booth.pm](https://booth.pm/)

## 💡 Mong muốn

Mong muốn có hệ thống hiển thị 3 VRM characters trong 1 scene:
- Main character ở giữa (có lip sync)
- 2 assistant characters bên trái/phải
- Tất cả hiển thị đúng màu, textures, poses
- Camera auto-fit để thấy cả 3

## 🙏 Cảm ơn!

Rất cảm ơn nếu bạn có thể giúp debug và fix các issues này. Mọi suggestions đều được đánh giá cao!

---

**Latest Commit:** Fix multi-VRM rendering issues  
**Repository:** https://github.com/seringuyen05062-create/fixloi.git  
**Branch:** main
