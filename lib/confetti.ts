import * as THREE from "three";

type Piece = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  angVel: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: THREE.Vector2;
  hue: number;
  mesh: THREE.Mesh; // Individual mesh thay vì instanced
};

/**
 * Confetti System - Hiệu ứng bắn pháo giấy với physics
 * Sử dụng individual meshes để dễ debug
 */
export class Confetti {
  private pieces: Piece[] = [];
  private geom: THREE.PlaneGeometry;
  private materials: Map<number, THREE.MeshBasicMaterial> = new Map();
  private group: THREE.Group;
  private max: number;

  // physics
  private gravity = new THREE.Vector3(0, -6.5, 0);
  private airDrag = 0.985;
  private spinDrag = 0.985;

  constructor(
    private scene: THREE.Scene,
    maxPieces = 500, // Giảm xuống để test
    private baseSize = 0.06,
  ) {
    this.max = maxPieces;
    this.geom = new THREE.PlaneGeometry(1, 1);
    this.group = new THREE.Group();
    this.group.name = 'ConfettiGroup';
    this.scene.add(this.group);
    
    console.log('[Confetti] System initialized, max pieces:', maxPieces);
  }

  private getMaterial(hue: number): THREE.MeshBasicMaterial {
    const key = Math.floor(hue * 100);
    if (!this.materials.has(key)) {
      const color = new THREE.Color().setHSL(hue % 1, 0.85, 0.6);
      const mat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
      });
      this.materials.set(key, mat);
    }
    return this.materials.get(key)!;
  }

  /** 
   * Nổ confetti tại một điểm
   * @param origin - Vị trí nổ
   * @param count - Số lượng mảnh giấy
   * @param hue - Màu chủ đạo (0..1), undefined = random
   */
  burst(origin = new THREE.Vector3(0, 1.6, 0), count = 220, hue?: number) {
    for (let i = 0; i < count && this.pieces.length < this.max; i++) {
      const dir = new THREE.Vector3().randomDirection();
      // Confetti bắn ngang nhiều hơn
      dir.y = THREE.MathUtils.clamp(dir.y, 0.15, 0.8);

      const speed = THREE.MathUtils.randFloat(2.5, 6.0);
      const w = this.baseSize * THREE.MathUtils.randFloat(0.6, 1.4);
      const h = this.baseSize * THREE.MathUtils.randFloat(0.4, 1.2);

      // Tạo mesh cho từng mảnh giấy
      const material = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color().setHSL((hue ?? Math.random()) + THREE.MathUtils.randFloatSpread(0.08), 1, 0.5) 
      });
      const mesh = new THREE.Mesh(this.geom, material);

      const p: Piece = {
        pos: origin.clone(),
        vel: dir.multiplyScalar(speed),
        angVel: new THREE.Vector3(
          THREE.MathUtils.randFloat(-6, 6),
          THREE.MathUtils.randFloat(-6, 6),
          THREE.MathUtils.randFloat(-6, 6)
        ),
        life: 0,
        maxLife: THREE.MathUtils.randFloat(2.0, 4.0),
        scale: new THREE.Vector2(w, h),
        hue: (hue ?? Math.random()) + THREE.MathUtils.randFloatSpread(0.08),
        mesh: mesh,
      };
      
      // Add mesh to scene
      this.group.add(mesh);
      this.pieces.push(p);
    }
  }

  /** 
   * Bắn như đại bác (rocket) theo hình nón từ vị trí + hướng
   * @param from - Vị trí xuất phát
   * @param dir - Hướng bắn
   * @param spread - Độ mở hình nón (radians)
   * @param count - Số lượng mảnh giấy
   * @param hue - Màu chủ đạo (0..1), undefined = random
   */
  cannon(
    from = new THREE.Vector3(0, 1.2, 0),
    dir = new THREE.Vector3(0, 1, 0),
    spread = 25 * Math.PI / 180,
    count = 320,
    hue?: number,
  ) {
    const basis = new THREE.Matrix4();
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
    basis.makeRotationFromQuaternion(q);

    for (let i = 0; i < count && this.pieces.length < this.max; i++) {
      // Hướng trong hình nón
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * v;
      const phi = Math.acos(1 - u + u * Math.cos(spread));
      const d = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      ).applyMatrix4(basis);

      const speed = THREE.MathUtils.randFloat(3.0, 7.0);
      const w = this.baseSize * THREE.MathUtils.randFloat(0.6, 1.6);
      const h = this.baseSize * THREE.MathUtils.randFloat(0.4, 1.4);

      // Tạo mesh cho từng mảnh giấy
      const material = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color().setHSL(hue ?? Math.random(), 1, 0.5) 
      });
      const mesh = new THREE.Mesh(this.geom, material);

      const p: Piece = {
        pos: from.clone(),
        vel: d.multiplyScalar(speed),
        angVel: new THREE.Vector3(
          THREE.MathUtils.randFloat(-8, 8),
          THREE.MathUtils.randFloat(-8, 8),
          THREE.MathUtils.randFloat(-8, 8)
        ),
        life: 0,
        maxLife: THREE.MathUtils.randFloat(2.2, 4.5),
        scale: new THREE.Vector2(w, h),
        hue: (hue ?? Math.random()),
        mesh: mesh,
      };
      
      // Add mesh to scene
      this.group.add(mesh);
      this.pieces.push(p);
    }
  }

  /**
   * Update physics mỗi frame
   * @param dt - Delta time (seconds)
   */
  update(dt: number) {
    // Cập nhật vật lý
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const p = this.pieces[i];
      p.life += dt;
      if (p.life >= p.maxLife) { 
        // Remove mesh from scene before removing particle
        this.group.remove(p.mesh);
        if (Array.isArray(p.mesh.material)) {
          p.mesh.material.forEach(mat => mat.dispose());
        } else {
          p.mesh.material.dispose();
        }
        this.pieces.splice(i, 1); 
        continue; 
      }

      p.vel.multiplyScalar(this.airDrag).addScaledVector(this.gravity, dt);
      p.pos.addScaledVector(p.vel, dt);
      p.angVel.multiplyScalar(this.spinDrag);
    }

    // Update individual meshes
    const n = this.pieces.length;
    for (let i = 0; i < n; i++) {
      const p = this.pieces[i];
      
      // Update mesh position and rotation
      p.mesh.position.copy(p.pos);
      
      // Xoay hỗn loạn
      p.mesh.rotation.x += p.angVel.x * dt;
      p.mesh.rotation.y += p.angVel.y * dt;
      p.mesh.rotation.z += p.angVel.z * dt;

      p.mesh.scale.set(p.scale.x, p.scale.y, 1);

      // Update color with fade
      const fade = 1.0 - (p.life / p.maxLife);
      const alpha = fade * 0.8 + 0.2; // Fade from 1.0 to 0.2
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
      (p.mesh.material as THREE.MeshBasicMaterial).transparent = true;
    }
  }

  /**
   * Cleanup resources
   */
  dispose() {
    // Dispose all individual meshes and materials
    for (const piece of this.pieces) {
      this.group.remove(piece.mesh);
      if (Array.isArray(piece.mesh.material)) {
        piece.mesh.material.forEach(mat => mat.dispose());
      } else {
        piece.mesh.material.dispose();
      }
    }
    this.pieces = [];
    
    this.scene.remove(this.group);
    this.geom.dispose();
    
    // Dispose cached materials
    for (const material of this.materials.values()) {
      material.dispose();
    }
    this.materials.clear();
  }

  /**
   * Get số lượng confetti đang active
   */
  get activeCount(): number {
    return this.pieces.length;
  }
}
