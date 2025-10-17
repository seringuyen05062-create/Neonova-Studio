import * as THREE from 'three';
import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader.js';
import { VRM } from '@pixiv/three-vrm';

/**
 * BVH Animation Loader with VRM retargeting
 */
export class BVHAnimationLoader {
  private loader: BVHLoader;

  constructor() {
    this.loader = new BVHLoader();
  }

  /**
   * Load BVH animation and retarget to VRM
   * @param source - BVH file or URL
   * @param vrm - Target VRM model
   * @returns Array of retargeted AnimationClips
   */
  async loadBVHAnimation(source: File | string, vrm: VRM): Promise<THREE.AnimationClip[]> {
    try {
      let text: string;

      if (source instanceof File) {
        text = await source.text();
      } else {
        const response = await fetch(source);
        text = await response.text();
      }

      // Parse BVH data
      const bvh = this.loader.parse(text);
      
      if (!bvh.clip) {
        throw new Error('No animation clip found in BVH file');
      }

      // Retarget BVH to VRM skeleton
      const retargetedClip = this.retargetBVHToVRM(bvh, vrm);
      
      return retargetedClip ? [retargetedClip] : [];
    } catch (error) {
      console.error('Error loading BVH animation:', error);
      throw error;
    }
  }

  /**
   * Retarget BVH animation to VRM skeleton
   */
  private retargetBVHToVRM(bvh: any, vrm: VRM): THREE.AnimationClip | null {
    const retargetedTracks: THREE.KeyframeTrack[] = [];

    // BVH to VRM bone mapping (common BVH naming conventions)
    const boneMapping: Record<string, string> = {
      'Hips': 'hips',
      'Spine': 'spine', 
      'Spine1': 'chest',
      'Spine2': 'upperChest',
      'Neck': 'neck',
      'Neck1': 'neck',
      'Head': 'head',
      
      'LeftShoulder': 'leftShoulder',
      'LeftArm': 'leftUpperArm',
      'LeftForeArm': 'leftLowerArm', 
      'LeftHand': 'leftHand',
      
      'RightShoulder': 'rightShoulder',
      'RightArm': 'rightUpperArm',
      'RightForeArm': 'rightLowerArm',
      'RightHand': 'rightHand',
      
      'LeftUpLeg': 'leftUpperLeg',
      'LeftLeg': 'leftLowerLeg',
      'LeftFoot': 'leftFoot',
      
      'RightUpLeg': 'rightUpperLeg',
      'RightLeg': 'rightLowerLeg',
      'RightFoot': 'rightFoot',
      
      // Alternative naming patterns
      'Hip': 'hips',
      'Chest': 'chest',
      'UpperTorso': 'upperChest',
      'L_Shoulder': 'leftShoulder',
      'L_UpperArm': 'leftUpperArm', 
      'L_ForeArm': 'leftLowerArm',
      'L_Hand': 'leftHand',
      'R_Shoulder': 'rightShoulder',
      'R_UpperArm': 'rightUpperArm',
      'R_ForeArm': 'rightLowerArm',
      'R_Hand': 'rightHand',
      'L_Thigh': 'leftUpperLeg',
      'L_Calf': 'leftLowerLeg',
      'L_Foot': 'leftFoot',
      'R_Thigh': 'rightUpperLeg',
      'R_Calf': 'rightLowerLeg', 
      'R_Foot': 'rightFoot'
    };

    const clip = bvh.clip;
    
    for (const track of clip.tracks) {
      const trackName = track.name;
      const boneName = trackName.split('.')[0];
      const property = trackName.split('.')[1];

      // Find VRM equivalent bone
      const vrmBoneName = boneMapping[boneName];
      if (!vrmBoneName) {
        // Try fuzzy matching for common variations
        const fuzzyMatch = Object.keys(boneMapping).find(key =>
          boneName.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(boneName.toLowerCase())
        );
        if (!fuzzyMatch) continue;
      }

      const targetVrmBoneName = boneMapping[boneName] || boneMapping[Object.keys(boneMapping).find(key =>
        boneName.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(boneName.toLowerCase())
      ) || ''];

      if (!targetVrmBoneName) continue;

      const vrmBone = vrm.humanoid?.getNormalizedBoneNode(targetVrmBoneName as any);
      if (!vrmBone) continue;

      // BVH typically uses Euler angles, need to convert to quaternions for VRM
      if (property === 'rotation') {
        // Convert BVH Euler rotations to quaternions
        const quaternionValues = this.convertEulerToQuaternion(track.values);
        
        const newTrack = new THREE.QuaternionKeyframeTrack(
          `${vrmBone.name}.quaternion`,
          track.times,
          quaternionValues
        );
        retargetedTracks.push(newTrack);
      } else if (property === 'position' && boneName === 'Hips') {
        // Only keep root motion (hips position) if present
        const newTrack = new THREE.VectorKeyframeTrack(
          `${vrmBone.name}.position`,
          track.times,
          track.values
        );
        retargetedTracks.push(newTrack);
      }
    }

    if (retargetedTracks.length === 0) {
      console.warn('No BVH tracks could be retargeted to VRM');
      return null;
    }

    return new THREE.AnimationClip(
      clip.name || 'BVH_Animation',
      clip.duration,
      retargetedTracks
    );
  }

  /**
   * Convert Euler rotation values to quaternion values
   */
  private convertEulerToQuaternion(eulerValues: number[]): number[] {
    const quaternionValues: number[] = [];
    const euler = new THREE.Euler();
    const quaternion = new THREE.Quaternion();

    // BVH uses degrees, convert to radians and then to quaternions
    for (let i = 0; i < eulerValues.length; i += 3) {
      euler.set(
        THREE.MathUtils.degToRad(eulerValues[i]),     // X rotation
        THREE.MathUtils.degToRad(eulerValues[i + 1]), // Y rotation  
        THREE.MathUtils.degToRad(eulerValues[i + 2]), // Z rotation
        'XYZ' // BVH typically uses XYZ order
      );

      quaternion.setFromEuler(euler);
      
      quaternionValues.push(
        quaternion.x,
        quaternion.y, 
        quaternion.z,
        quaternion.w
      );
    }

    return quaternionValues;
  }

  /**
   * Validate if file is BVH
   */
  static isValidBVHFile(file: File): boolean {
    return file.name.toLowerCase().endsWith('.bvh');
  }
}