## 🦇 **GLB Bat Model Debug Report**

### 🔍 **Debug Steps để test con dơi GLB:**

#### 1️⃣ **Test với Debug Tool:**
- Click **"🔍 Test GLB Load"** 
- Chọn file con dơi GLB
- Kiểm tra Console logs:
```
✅ Model size: Vector3 {x: ..., y: ..., z: ...}
✅ Model center: Vector3 {x: ..., y: ..., z: ...} 
✅ Model children: Array của meshes
✅ Materials: Có texture/color không?
```

#### 2️⃣ **Test trong GLB Mode:**
- Switch sang **GLB Mode** trong Control Panel
- Upload con dơi GLB
- Xem **debug info box** ở góc trái:
  - GLB Model: Loaded ✅
  - Scene: Available ✅  
  - Mixer: Available ✅
  - Animations: >0 ✅

#### 3️⃣ **Visual Debug:**
- **Red Bounding Box** sẽ hiện nếu GLB load thành công
- **Camera** tự động adjust cho GLB (zoom out hơn)
- **Ground plane** để reference position

### 🐛 **Common Bat Model Issues:**

#### 🔴 **Model quá nhỏ:**
- Console log: `Applied scale: 0.001` (quá nhỏ)
- **Fix:** Auto-scale được tăng lên `targetSize = 2.0`

#### 🔴 **Model ở position sai:**
- Console log: `Model center` không phải `(0,0,0)`
- **Fix:** Auto-center và đặt trên ground

#### 🔴 **Materials/Textures missing:**
- Console log: `material: null` hoặc không có texture
- **Fix:** Model có thể cần materials

#### 🔴 **Model nằm ngoài camera view:**
- **Fix:** Camera zoom out (`minDistance: 2, maxDistance: 10`)
- **Fix:** Camera target adjust cho GLB

### 🛠️ **Enhanced Debug Features:**

#### ✅ **Auto-Scaling Improved:**
```typescript
targetSize = 2.0 // Lớn hơn trước (1.5)
position.y = -box.min.y // Đặt trên ground
```

#### ✅ **Forced Visibility:**
```typescript
model.visible = true
mesh.frustumCulled = false // Always render
```

#### ✅ **Red Bounding Box:**
```typescript
<BoxHelper color={0xff0000} /> // Wireframe outline
```

#### ✅ **Camera Adjustment:**
```typescript
target: [0, 1, 0] // Center view for GLB
minDistance: 2 // Zoom out more
```

### 🎯 **Test Results Expected:**

#### ✅ **Successful Load:**
- Console: "GLB model added to scene successfully" 
- Visual: Red wireframe box visible
- Model: Con dơi hiện rõ trên scene
- Animation: Wings flapping nếu có

#### ❌ **Failed Load:**
- Console: Error messages
- Visual: Không có red box
- Model: Không hiện gì

### 🔧 **Next Steps:**

1. **Test với Debug Tool** trước để xem raw loading
2. **Check console logs** để xác định vấn đề  
3. **Switch GLB Mode** để test full pipeline
4. **Adjust camera** manual nếu cần (scroll zoom)

**🎯 Test ngay tại: http://localhost:3001**

**Debug info sẽ show tất cả details về con dơi GLB!**