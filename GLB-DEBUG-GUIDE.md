## 🔍 **GLB Loading Debug Guide**

### 🎯 **Để test GLB loading:**

#### 1️⃣ **Sử dụng GLB Debug Tool:**
- Click nút **"🔍 Test GLB Load"** ở góc phải màn hình
- Chọn file GLB/GLTF để test
- Xem Console logs để debug

#### 2️⃣ **Kiểm tra trong Mode GLB:**
- Switch sang **GLB Mode** trong Control Panel  
- Upload GLB file qua GLB uploader
- Xem debug info box ở góc trái màn hình

#### 3️⃣ **Console Logs để monitor:**
```
[useGLB] Loading GLB file: filename.glb
[useGLB] Model loaded successfully: {...}
[GLBModel] Effect triggered with: {...}
[GLBModel] GLB model added to scene successfully
```

### 🐛 **Common Issues:**

#### 🚫 **File không load:**
- **Check file format**: Chỉ hỗ trợ `.glb` và `.gltf`
- **Check file size**: File quá lớn có thể timeout
- **Check file integrity**: File có thể bị corrupt

#### 👻 **Model load nhưng không hiện:**
- **Check model scale**: Model có thể quá nhỏ hoặc quá lớn
- **Check model position**: Model có thể ở ngoài camera view
- **Check materials**: Model có thể không có materials/textures

#### 🎬 **Animation không chạy:**
- **Check animations exist**: Model có thể không có animations
- **Check mixer update**: Animation mixer có thể không được update

### 🛠️ **Debug Commands:**

#### 📊 **In Browser Console:**
```javascript
// Check current GLB model
console.log('Current GLB Model:', window.currentGLBModel);

// Check scene objects
console.log('Scene children:', scene.children);

// Force reload page
location.reload();
```

### 📝 **Test với file mẫu:**
- **Animals**: Con vật với animations (walk, idle, etc.)  
- **Objects**: Đồ vật tĩnh hoặc có animations đơn giản
- **Characters**: Nhân vật non-VRM

**🎯 Server running at: http://localhost:3000**

**Test GLB loading ngay để xem có issue gì!**