import * as THREE from "three";
import type { VRM } from "@pixiv/three-vrm";

/**
 * GroundSnapper - Tự động điều chỉnh vị trí avatar để chân luôn chạm đất
 * Giải quyết vấn đề lơ lửng khi phát animation nhảy/di chuyển
 */
export class GroundSnapper {
  private ray = new THREE.Raycaster();
  private tmp = new THREE.Vector3();
  private smoothing = 0.25;           // độ mượt: 0..1 (càng cao càng mượt nhưng chậm phản ứng)
  private hoverTolerance = 0.005;     // giảm từ 0.02 xuống 0.005 (0.5cm) để chân gần sàn hơn
  private maxStep = 0.1;              // giới hạn dịch chuyển tối đa mỗi frame (tránh giật)

  constructor(
    private vrm: VRM,
    private groundY = 0               // vị trí sàn trên trục Y (mặc định y=0)
  ) {}

  /**
   * Lấy vị trí Y của bàn chân trong world space
   */
  private footY(nodeName: "leftFoot" | "rightFoot"): number {
    const node = this.vrm.humanoid?.getBoneNode(nodeName);
    if (!node) return Number.POSITIVE_INFINITY;
    
    node.getWorldPosition(this.tmp);
    return this.tmp.y;
  }

  /**
   * Cập nhật vị trí avatar mỗi frame
   * Gọi hàm này sau khi update animation mixer
   */
  update(dt: number) {
    const leftY = this.footY("leftFoot");
    const rightY = this.footY("rightFoot");
    const lowest = Math.min(leftY, rightY);

    // Tính delta cần dịch để chân thấp nhất chạm sàn (trừ đi tolerance)
    let delta = (this.groundY + this.hoverTolerance) - lowest;

    // Đừng kéo xuống khi đang NHẢY thật sự (cả hai chân đều cao hơn sàn rõ rệt)
    const isJumping = leftY > this.groundY + 0.1 && rightY > this.groundY + 0.1;
    if (isJumping && delta > 0) delta = 0;

    // Bỏ qua nếu delta quá nhỏ
    if (Math.abs(delta) < 1e-4) return;

    // Áp dụng smoothing và giới hạn biên độ theo frame
    const shift = THREE.MathUtils.clamp(
      delta * this.smoothing, 
      -this.maxStep, 
      this.maxStep
    );

    // Dịch chuyển root của avatar (Object3D gốc chứa SkinnedMesh)
    this.vrm.scene.position.y += shift;
  }

  /**
   * Cập nhật vị trí sàn (nếu sàn di chuyển hoặc thay đổi)
   */
  setGroundY(y: number) {
    this.groundY = y;
  }

  /**
   * Điều chỉnh độ mượt (0 = cứng nhắc, 1 = rất mượt)
   */
  setSmoothing(value: number) {
    this.smoothing = THREE.MathUtils.clamp(value, 0, 1);
  }

  /**
   * Điều chỉnh độ dung sai lơ lửng
   */
  setHoverTolerance(value: number) {
    this.hoverTolerance = Math.max(0, value);
  }
}
