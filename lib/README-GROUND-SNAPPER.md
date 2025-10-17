# Ground Snapper - Hệ thống "Dán chân xuống đất"

## 🎯 Mục đích

Giải quyết vấn đề **lơ lửng** khi VRM avatar nhảy hoặc di chuyển với animation VRMA. Hệ thống tự động điều chỉnh vị trí avatar theo thời gian thực để chân luôn chạm đất một cách tự nhiên.

## ✨ Tính năng

- ✅ **Tự động điều chỉnh** vị trí avatar mỗi frame
- ✅ **Phát hiện nhảy thật sự** - không kéo xuống khi cả 2 chân đều bay
- ✅ **Smoothing** - di chuyển mượt mà, không giật
- ✅ **Tolerance** - cho phép lơ lửng nhẹ để tự nhiên hơn
- ✅ **Không sửa file .vrma** - hoạt động 100% runtime

## 🚀 Cách hoạt động

### Thuật toán

1. **Mỗi frame**:
   - Đo vị trí Y của cả 2 bàn chân (`leftFoot`, `rightFoot`)
   - Lấy chân **thấp nhất**
   
2. **Tính toán delta**:
   - Nếu chân thấp nhất **dưới mặt đất** (y < groundY) → đẩy avatar **lên**
   - Nếu chân cao hơn một chút → kéo avatar **xuống** nhẹ
   
3. **Xử lý trường hợp đặc biệt**:
   - Nếu cả 2 chân đều cao hơn sàn > 10cm → đang **nhảy thật** → không kéo xuống
   
4. **Áp dụng smoothing**:
   - Dịch chuyển từ từ với `smoothing = 0.25` (25% mỗi frame)
   - Giới hạn tối đa `maxStep = 0.1` để tránh giật

### Code Flow

```
Animation Update → Bone Positions Change
                ↓
         GroundSnapper.update()
                ↓
    Measure both feet positions
                ↓
    Calculate delta to ground
                ↓
    Apply smoothing & clamping
                ↓
    Move vrm.scene.position.y
```

## 📝 Cách sử dụng

### 1. Đã tích hợp sẵn trong `Scene.tsx`

File `components/Scene.tsx` đã được tích hợp sẵn:

```tsx
function VRMModel({ vrm, onUpdate }: { vrm: VRM; onUpdate?: () => void }) {
  const snapperRef = useRef<GroundSnapper | null>(null);

  useEffect(() => {
    if (vrm) {
      // Khởi tạo với groundY = 0
      snapperRef.current = new GroundSnapper(vrm, 0);
    }
  }, [vrm]);

  useFrame(() => {
    const delta = clockRef.current.getDelta();
    vrm.update(delta);              // Update animation
    snapperRef.current?.update(delta); // Update ground snapping
  });
}
```

### 2. Sử dụng độc lập (nếu cần)

```typescript
import { GroundSnapper } from '@/lib/ground-snapper';

// Sau khi load VRM
const snapper = new GroundSnapper(vrm, /* groundY = */ 0);

// Trong render loop
function animate() {
  const dt = clock.getDelta();
  
  // 1. Update animation trước
  mixer.update(dt);
  
  // 2. Update ground snapping sau
  snapper.update(dt);
  
  // 3. Render
  renderer.render(scene, camera);
  
  requestAnimationFrame(animate);
}
```

## ⚙️ Tùy chỉnh

### Thay đổi vị trí sàn

```typescript
// Nếu sàn không ở y=0
snapper.setGroundY(0.5); // Sàn ở y=0.5
```

### Điều chỉnh độ mượt

```typescript
// 0 = cứng nhắc, 1 = rất mượt
snapper.setSmoothing(0.5); // Mượt hơn mặc định
```

### Điều chỉnh tolerance

```typescript
// Cho phép lơ lửng nhiều hơn
snapper.setHoverTolerance(0.05); // 5cm thay vì 2cm
```

## 🎨 Kết hợp với Shadow

Để hiệu quả tối đa, bật shadow trong Three.js:

```typescript
// Renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// VRM meshes
vrm.scene.traverse((child) => {
  if (child.isMesh) {
    child.castShadow = true;
  }
});

// Ground plane
groundPlane.receiveShadow = true;
```

## 🔧 Tham số mặc định

| Tham số | Giá trị | Ý nghĩa |
|---------|---------|---------|
| `smoothing` | 0.25 | Độ mượt khi di chuyển (25% mỗi frame) |
| `hoverTolerance` | 0.02 | Cho phép lơ lửng 2cm để tự nhiên |
| `maxStep` | 0.1 | Giới hạn dịch chuyển tối đa mỗi frame |
| `groundY` | 0 | Vị trí sàn trên trục Y |

## 📊 Hiệu năng

- **Overhead**: Rất thấp (~0.1ms/frame)
- **2 world position lookups** mỗi frame
- **Không allocation** - reuse Vector3

## ❓ Troubleshooting

### Avatar vẫn lơ lửng?

1. Kiểm tra `groundY` có đúng vị trí sàn không
2. Tăng `smoothing` lên 0.5-0.8
3. Giảm `hoverTolerance` xuống 0.01

### Avatar giật khi nhảy?

1. Kiểm tra `maxStep` - tăng lên 0.15-0.2
2. Đảm bảo gọi `snapper.update()` **SAU** `mixer.update()`

### Avatar chìm xuống đất?

1. Kiểm tra `groundY` - có thể set sai
2. Kiểm tra VRM model có bị offset không

## 🎯 Kết quả mong đợi

✅ Chân luôn chạm đất khi đứng/đi bộ  
✅ Nhảy tự nhiên - không bị kéo xuống giữa chừng  
✅ Di chuyển mượt mà, không giật  
✅ Bóng đổ chính xác trên sàn  

---

**Tác giả**: Dựa trên giải pháp ground-snapping thông minh  
**Phiên bản**: 1.0.0  
**Cập nhật**: 2025-10-15
