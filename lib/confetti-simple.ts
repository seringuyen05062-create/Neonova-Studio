import * as THREE from "three";

type Piece = {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  angVel: THREE.Vector3;
  life: number;
  maxLife: number;
};

/**
 * Simple Confetti System - Dùng individual meshes để debug dễ hơn
 */
export class ConfettiSimple {
  private pieces: Piece[] = [];
  private group: THREE.Group;
  private gravity = new THREE.Vector3(0, -9.8, 0);
  private airDrag = 0.98;

  constructor(private scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'ConfettiGroup';
    this.scene.add(this.group);
    console.log('[ConfettiSimple] System created');
  }

  /**
   * Nổ confetti từ một điểm
   */
  burst(origin: THREE.Vector3, count: number = 50, hue?: number) {
    console.log(`[ConfettiSimple] Burst ${count} pieces at`, origin);
    
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.PlaneGeometry(0.05, 0.05);
      const color = new THREE.Color().setHSL(
        hue ?? Math.random(),
        0.8,
        0.6
      );
      const material = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(origin);
      
      // Random velocity
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 6 + 2,
        (Math.random() - 0.5) * 5
      );
      
      const angVel = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      
      this.group.add(mesh);
      
      this.pieces.push({
        mesh,
        vel,
        angVel,
        life: 0,
        maxLife: 3 + Math.random() * 2,
      });
    }
    
    console.log('[ConfettiSimple] Total pieces:', this.pieces.length);
  }

  /**
   * Bắn như đại bác
   */
  cannon(from: THREE.Vector3, dir: THREE.Vector3, spread: number, count: number, hue?: number) {
    console.log(`[ConfettiSimple] Cannon ${count} pieces from`, from, 'direction', dir);
    
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.PlaneGeometry(0.05, 0.05);
      const color = new THREE.Color().setHSL(
        hue ?? Math.random(),
        0.8,
        0.6
      );
      const material = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(from);
      
      // Velocity theo hình nón
      const spreadVec = new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread
      );
      const vel = dir.clone().multiplyScalar(5 + Math.random() * 3).add(spreadVec);
      
      const angVel = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      
      this.group.add(mesh);
      
      this.pieces.push({
        mesh,
        vel,
        angVel,
        life: 0,
        maxLife: 3 + Math.random() * 2,
      });
    }
    
    console.log('[ConfettiSimple] Total pieces:', this.pieces.length);
  }

  /**
   * Update physics
   */
  update(dt: number) {
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const p = this.pieces[i];
      p.life += dt;
      
      // Xóa pieces đã hết life
      if (p.life >= p.maxLife) {
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.pieces.splice(i, 1);
        continue;
      }
      
      // Physics
      p.vel.addScaledVector(this.gravity, dt);
      p.vel.multiplyScalar(this.airDrag);
      p.mesh.position.addScaledVector(p.vel, dt);
      
      // Rotation
      p.mesh.rotation.x += p.angVel.x * dt;
      p.mesh.rotation.y += p.angVel.y * dt;
      p.mesh.rotation.z += p.angVel.z * dt;
      
      // Fade out
      const fade = 1 - (p.life / p.maxLife);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = fade;
      (p.mesh.material as THREE.MeshBasicMaterial).transparent = true;
    }
  }

  /**
   * Cleanup
   */
  dispose() {
    this.pieces.forEach(p => {
      this.group.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    });
    this.pieces = [];
    this.scene.remove(this.group);
  }

  get activeCount(): number {
    return this.pieces.length;
  }
}
