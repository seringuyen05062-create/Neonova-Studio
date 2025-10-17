import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { VRM } from '@pixiv/three-vrm';

/**
 * FBX Animation Loader with VRM retargeting capability
 * Enhanced for VRM AI Avatar project compatibility
 */
export class FBXAnimationLoader {
  private loader: FBXLoader;

  constructor() {
    this.loader = new FBXLoader();
  }

  /**
   * Load FBX animation and retarget to VRM
   * @param source - FBX file or URL
   * @param vrm - Target VRM model
   * @returns Array of retargeted AnimationClips
   */
  async loadFBXAnimation(source: File | string, vrm: VRM): Promise<THREE.AnimationClip[]> {
    try {
      let url: string;

      if (source instanceof File) {
        url = URL.createObjectURL(source);
      } else {
        url = source;
      }

      // Load FBX file
      const fbx = await new Promise<THREE.Group>((resolve, reject) => {
        this.loader.load(url, resolve, undefined, reject);
      });

      // Cleanup object URL if created from File
      if (source instanceof File) {
        URL.revokeObjectURL(url);
      }

      // Extract animations from FBX
      const fbxAnimations = fbx.animations;
      if (!fbxAnimations || fbxAnimations.length === 0) {
        throw new Error('No animations found in FBX file');
      }

      // Retarget FBX animations to VRM skeleton
      const retargetedClips = fbxAnimations.map(clip => 
        this.retargetFBXToVRM(clip, fbx, vrm)
      );

      return retargetedClips.filter(clip => clip !== null) as THREE.AnimationClip[];
    } catch (error) {
      console.error('Error loading FBX animation:', error);
      throw error;
    }
  }

  /**
   * Retarget FBX AnimationClip to VRM skeleton
   */
  private retargetFBXToVRM(
    fbxClip: THREE.AnimationClip, 
    fbxModel: THREE.Group, 
    vrm: VRM
  ): THREE.AnimationClip | null {
    const retargetedTracks: THREE.KeyframeTrack[] = [];

    // Enhanced bone mapping for FBX to VRM humanoid (supports multiple naming conventions)
    const boneMapping: Record<string, string> = {
      // Spine variations
      'Spine': 'spine',
      'Spine1': 'chest', 
      'Spine2': 'upperChest',
      'Spine3': 'upperChest',
      'Chest': 'chest',
      'UpperChest': 'upperChest',
      'Neck': 'neck',
      'Neck1': 'neck',
      'Head': 'head',
      
      // Arms - Standard FBX naming
      'LeftShoulder': 'leftShoulder',
      'LeftArm': 'leftUpperArm',
      'LeftForeArm': 'leftLowerArm',
      'LeftHand': 'leftHand',
      'RightShoulder': 'rightShoulder',
      'RightArm': 'rightUpperArm', 
      'RightForeArm': 'rightLowerArm',
      'RightHand': 'rightHand',
      
      // Arms - Mixamo naming conventions
      'mixamorig:LeftShoulder': 'leftShoulder',
      'mixamorig:LeftArm': 'leftUpperArm',
      'mixamorig:LeftForeArm': 'leftLowerArm',
      'mixamorig:LeftHand': 'leftHand',
      'mixamorig:RightShoulder': 'rightShoulder',
      'mixamorig:RightArm': 'rightUpperArm',
      'mixamorig:RightForeArm': 'rightLowerArm',
      'mixamorig:RightHand': 'rightHand',
      
      // Arms - Alternative naming
      'LeftUpperArm': 'leftUpperArm',
      'LeftLowerArm': 'leftLowerArm',
      'RightUpperArm': 'rightUpperArm',
      'RightLowerArm': 'rightLowerArm',
      'L_UpperArm': 'leftUpperArm',
      'L_LowerArm': 'leftLowerArm',
      'R_UpperArm': 'rightUpperArm',
      'R_LowerArm': 'rightLowerArm',
      
      // Legs - Standard FBX naming
      'LeftUpLeg': 'leftUpperLeg',
      'LeftLeg': 'leftLowerLeg',
      'LeftFoot': 'leftFoot',
      'LeftToeBase': 'leftToes',
      'RightUpLeg': 'rightUpperLeg',
      'RightLeg': 'rightLowerLeg',
      'RightFoot': 'rightFoot',
      'RightToeBase': 'rightToes',
      
      // Legs - Mixamo naming
      'mixamorig:LeftUpLeg': 'leftUpperLeg',
      'mixamorig:LeftLeg': 'leftLowerLeg',
      'mixamorig:LeftFoot': 'leftFoot',
      'mixamorig:LeftToeBase': 'leftToes',
      'mixamorig:RightUpLeg': 'rightUpperLeg',
      'mixamorig:RightLeg': 'rightLowerLeg',
      'mixamorig:RightFoot': 'rightFoot',
      'mixamorig:RightToeBase': 'rightToes',
      
      // Legs - Alternative naming
      'LeftUpperLeg': 'leftUpperLeg',
      'LeftLowerLeg': 'leftLowerLeg',
      'LeftThigh': 'leftUpperLeg',
      'LeftCalf': 'leftLowerLeg',
      'RightUpperLeg': 'rightUpperLeg',
      'RightLowerLeg': 'rightLowerLeg',
      'RightThigh': 'rightUpperLeg',
      'RightCalf': 'rightLowerLeg',
      
      // Hips variations
      'Hips': 'hips',
      'mixamorig:Hips': 'hips',
      'Hip': 'hips',
      'Pelvis': 'hips',
      'Root': 'hips'
    };

    for (const track of fbxClip.tracks) {
      const trackName = track.name;
      const boneName = trackName.split('.')[0];
      const property = trackName.split('.')[1];

      // Find VRM equivalent bone - try exact match first
      let vrmBoneName = boneMapping[boneName];
      
      // If no exact match, try fuzzy matching
      if (!vrmBoneName) {
        const fuzzyMatch = Object.keys(boneMapping).find(key =>
          boneName.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(boneName.toLowerCase()) ||
          boneName.replace(/mixamorig:|_|:/g, '').toLowerCase() === key.toLowerCase()
        );
        if (fuzzyMatch) {
          vrmBoneName = boneMapping[fuzzyMatch];
        }
      }

      if (!vrmBoneName) {
        console.warn(`FBX: No VRM mapping found for bone: ${boneName}`);
        continue;
      }

      const vrmBone = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName as any);
      if (!vrmBone) {
        console.warn(`FBX: VRM bone not found: ${vrmBoneName}`);
        continue;
      }

      // Create new track with VRM bone target
      const newTrackName = `${vrmBone.name}.${property}`;
      let newTrack: THREE.KeyframeTrack;

      if (track instanceof THREE.QuaternionKeyframeTrack) {
        newTrack = new THREE.QuaternionKeyframeTrack(
          newTrackName, 
          track.times, 
          track.values
        );
      } else if (track instanceof THREE.VectorKeyframeTrack) {
        // Filter position tracks - only keep for hips/root
        if (property === 'position' && vrmBoneName !== 'hips') {
          console.warn(`FBX: Filtering position track for non-root bone: ${boneName}`);
          continue;
        }
        newTrack = new THREE.VectorKeyframeTrack(
          newTrackName,
          track.times,
          track.values
        );
      } else if (track instanceof THREE.NumberKeyframeTrack) {
        // Handle morph targets or other numeric properties
        newTrack = new THREE.NumberKeyframeTrack(
          newTrackName,
          track.times, 
          track.values
        );
      } else {
        console.warn(`FBX: Unsupported track type: ${track.constructor.name}`);
        continue;
      }

      retargetedTracks.push(newTrack);
      console.log(`FBX: Retargeted ${boneName} → ${vrmBoneName} (${property})`);
    }

    if (retargetedTracks.length === 0) {
      console.warn(`No tracks could be retargeted for clip: ${fbxClip.name}`);
      return null;
    }

    return new THREE.AnimationClip(
      fbxClip.name,
      fbxClip.duration,
      retargetedTracks
    );
  }

  /**
   * Validate if file is FBX
   */
  static isValidFBXFile(file: File): boolean {
    return file.name.toLowerCase().endsWith('.fbx');
  }
}