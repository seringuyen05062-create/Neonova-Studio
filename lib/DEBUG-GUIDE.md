# Ground Snapper Debug Mode

## 🐛 Cách bật Debug Visualization

### 1. Import debug helper

```typescript
import { GroundSnapperDebug } from '@/lib/ground-snapper-debug';
```

### 2. Thêm vào Scene component

```tsx
function VRMModel({ vrm }: { vrm: VRM }) {
  const snapperRef = useRef<GroundSnapper | null>(null);
  const debugRef = useRef<GroundSnapperDebug | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (vrm) {
      snapperRef.current = new GroundSnapper(vrm, 0);
      
      // Khởi tạo debug helper
      debugRef.current = new GroundSnapperDebug(vrm, scene, 0);
    }

    return () => {
      debugRef.current?.dispose();
    };
  }, [vrm]);

  useFrame(() => {
    snapperRef.current?.update(dt);
    
    // Update debug visualization
    if (showDebug && debugRef.current) {
      debugRef.current.update();
    }
  });

  // Toggle debug
  useEffect(() => {
    if (debugRef.current) {
      showDebug ? debugRef.current.show() : debugRef.current.hide();
    }
  }, [showDebug]);
}
```

### 3. Hiển thị debug info

```tsx
function DebugPanel({ debugHelper }: { debugHelper: GroundSnapperDebug }) {
  const [info, setInfo] = useState(debugHelper.getDebugInfo());

  useEffect(() => {
    const interval = setInterval(() => {
      setInfo(debugHelper.getDebugInfo());
    }, 100); // Update 10 lần/giây

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="debug-panel">
      <h3>Ground Snapper Debug</h3>
      <div>Left Foot Y: {info.leftFootY.toFixed(3)}</div>
      <div>Right Foot Y: {info.rightFootY.toFixed(3)}</div>
      <div>Lowest: {info.lowestFootY.toFixed(3)}</div>
      <div>Delta to Ground: {info.deltaToGround.toFixed(3)}</div>
      <div>Is Jumping: {info.isJumping ? '✅' : '❌'}</div>
    </div>
  );
}
```

## 🎨 Visual Elements

### Foot Markers
- 🔴 **Sphere đỏ**: Chân trái (leftFoot)
- 🔵 **Sphere xanh**: Chân phải (rightFoot)

### Ground Line
- 🟢 **Line xanh lá**: Vị trí sàn (groundY)

## 💡 Cách sử dụng

### 1. Quan sát foot positions
- Xem 2 sphere có theo chân đúng không
- Kiểm tra vị trí tương đối với ground line

### 2. Debug lơ lửng
- Nếu sphere cao hơn ground line nhiều → cần điều chỉnh
- Nếu sphere dưới ground line → avatar bị chìm

### 3. Debug nhảy
- Khi nhảy, cả 2 sphere nên lên cao
- `isJumping` nên là `true` khi cả 2 chân > groundY + 10cm

## 🔧 Tùy chỉnh

### Thay đổi màu markers

```typescript
// Trong ground-snapper-debug.ts
const leftMaterial = new THREE.MeshBasicMaterial({ 
  color: 0xffff00, // Vàng
  transparent: true,
  opacity: 0.9
});
```

### Thay đổi kích thước markers

```typescript
const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16); // To hơn
```

### Thêm text labels (advanced)

```typescript
import { Text } from '@react-three/drei';

<Text
  position={[leftFootMarker.position.x, leftFootMarker.position.y + 0.1, leftFootMarker.position.z]}
  fontSize={0.05}
  color="red"
>
  Left
</Text>
```

## 📊 Metrics để theo dõi

| Metric | Giá trị bình thường | Bất thường |
|--------|---------------------|------------|
| `leftFootY` | 0 ± 0.05 | < -0.1 hoặc > 0.2 |
| `rightFootY` | 0 ± 0.05 | < -0.1 hoặc > 0.2 |
| `deltaToGround` | -0.02 to 0.02 | > 0.1 |
| `isJumping` | false (thường) | true (khi nhảy) |

## 🎯 Troubleshooting với Debug Mode

### Problem: Sphere không hiện
- ✅ Check: `debugRef.current?.show()` đã gọi chưa
- ✅ Check: Scene có đúng không (R3F scene khác native Three.js scene)

### Problem: Sphere không di chuyển
- ✅ Check: `debugRef.current?.update()` trong useFrame
- ✅ Check: VRM humanoid có bones không

### Problem: Ground line sai vị trí
- ✅ Check: `groundY` parameter
- ✅ Call: `debugRef.current?.setGroundY(newY)`

## 🚀 Quick Start

### Bật debug trong ControlPanel

Thêm button:

```tsx
<button onClick={() => setDebugMode(!debugMode)}>
  {debugMode ? '🐛 Debug: ON' : '🐛 Debug: OFF'}
</button>
```

Pass prop xuống Scene:

```tsx
<Scene vrm={vrm} debugMode={debugMode} />
```

---

**Lưu ý**: Chỉ dùng debug mode khi development. Tắt đi trong production để tiết kiệm performance!
