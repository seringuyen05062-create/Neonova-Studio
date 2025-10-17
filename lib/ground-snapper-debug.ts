import * as THREE from "three";
import type { VRM } from "@pixiv/three-vrm";

/**
 * GroundSnapperDebug - Visualize foot positions và ground detection
 * Chỉ dùng cho debugging, không cần trong production
 */
export class GroundSnapperDebug {
  private leftFootMarker: THREE.Mesh;
  private rightFootMarker: THREE.Mesh;
  private groundLine: THREE.Line;
  private scene: THREE.Scene;

  constructor(
    private vrm: VRM,
    scene: THREE.Scene,
    private groundY = 0
  ) {
    this.scene = scene;

    // Tạo markers cho 2 bàn chân
    const markerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    
    const leftMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, // Đỏ - chân trái
      transparent: true,
      opacity: 0.7
    });
    
    const rightMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x0000ff, // Xanh - chân phải
      transparent: true,
      opacity: 0.7
    });

    this.leftFootMarker = new THREE.Mesh(markerGeometry, leftMaterial);
    this.rightFootMarker = new THREE.Mesh(markerGeometry, rightMaterial);

    // Tạo đường line chỉ ground level
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-5, groundY, 0),
      new THREE.Vector3(5, groundY, 0)
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ff00, // Xanh lá - ground line
      transparent: true,
      opacity: 0.5
    });
    this.groundLine = new THREE.Line(lineGeometry, lineMaterial);

    // Add to scene
    this.scene.add(this.leftFootMarker);
    this.scene.add(this.rightFootMarker);
    this.scene.add(this.groundLine);
  }

  update() {
    const leftNode = this.vrm.humanoid?.getBoneNode("leftFoot");
    const rightNode = this.vrm.humanoid?.getBoneNode("rightFoot");

    if (leftNode) {
      leftNode.getWorldPosition(this.leftFootMarker.position);
    }

    if (rightNode) {
      rightNode.getWorldPosition(this.rightFootMarker.position);
    }

    // Update ground line position if needed
    const positions = this.groundLine.geometry.attributes.position;
    positions.setY(0, this.groundY);
    positions.setY(1, this.groundY);
    positions.needsUpdate = true;
  }

  setGroundY(y: number) {
    this.groundY = y;
  }

  show() {
    this.leftFootMarker.visible = true;
    this.rightFootMarker.visible = true;
    this.groundLine.visible = true;
  }

  hide() {
    this.leftFootMarker.visible = false;
    this.rightFootMarker.visible = false;
    this.groundLine.visible = false;
  }

  dispose() {
    this.scene.remove(this.leftFootMarker);
    this.scene.remove(this.rightFootMarker);
    this.scene.remove(this.groundLine);

    this.leftFootMarker.geometry.dispose();
    this.rightFootMarker.geometry.dispose();
    this.groundLine.geometry.dispose();
    (this.leftFootMarker.material as THREE.Material).dispose();
    (this.rightFootMarker.material as THREE.Material).dispose();
    (this.groundLine.material as THREE.Material).dispose();
  }

  /**
   * Lấy thông tin debug dạng text
   */
  getDebugInfo(): {
    leftFootY: number;
    rightFootY: number;
    lowestFootY: number;
    deltaToGround: number;
    isJumping: boolean;
  } {
    const leftNode = this.vrm.humanoid?.getBoneNode("leftFoot");
    const rightNode = this.vrm.humanoid?.getBoneNode("rightFoot");

    const tmp = new THREE.Vector3();
    
    let leftY = 0;
    let rightY = 0;

    if (leftNode) {
      leftNode.getWorldPosition(tmp);
      leftY = tmp.y;
    }

    if (rightNode) {
      rightNode.getWorldPosition(tmp);
      rightY = tmp.y;
    }

    const lowestFootY = Math.min(leftY, rightY);
    const deltaToGround = this.groundY - lowestFootY;
    const isJumping = leftY > this.groundY + 0.1 && rightY > this.groundY + 0.1;

    return {
      leftFootY: leftY,
      rightFootY: rightY,
      lowestFootY,
      deltaToGround,
      isJumping
    };
  }
}
