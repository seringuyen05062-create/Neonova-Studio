import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM } from '@pixiv/three-vrm';

/**
 * GLTF/GLB Animation Loader with VRM retargeting
 * Enhanced for VRM AI Avatar project compatibility
 */
export class GLTFAnimationLoader {
  private loader: GLTFLoader;

  constructor() {
    this.loader = new GLTFLoader();
  }

  /**
   * Load GLTF/GLB animation and retarget to VRM
   * @param source - GLTF/GLB file or URL
   * @param vrm - Target VRM model
   * @returns Array of retargeted AnimationClips
   */
  async loadGLTFAnimation(source: File | string, vrm: VRM): Promise<THREE.AnimationClip[]> {
    try {
      let url: string;

      if (source instanceof File) {
        url = URL.createObjectURL(source);
      } else {
        url = source;
      }

      // Load GLTF/GLB file
      const gltf = await this.loader.loadAsync(url);

      // Cleanup object URL if created from File
      if (source instanceof File) {
        URL.revokeObjectURL(url);
      }

      // Extract animations
      const gltfAnimations = gltf.animations;
      if (!gltfAnimations || gltfAnimations.length === 0) {
        throw new Error('No animations found in GLTF/GLB file');
      }

      // Retarget animations to VRM skeleton
      const retargetedClips = gltfAnimations.map(clip => 
        this.retargetGLTFToVRM(clip, gltf.scene, vrm)
      );

      return retargetedClips.filter(clip => clip !== null) as THREE.AnimationClip[];
    } catch (error) {
      console.error('Error loading GLTF animation:', error);
      throw error;
    }
  }

  /**
   * Retarget GLTF AnimationClip to VRM skeleton
   */
  private retargetGLTFToVRM(
    gltfClip: THREE.AnimationClip,
    gltfScene: THREE.Group,
    vrm: VRM
  ): THREE.AnimationClip | null {
    const retargetedTracks: THREE.KeyframeTrack[] = [];

    // Enhanced GLTF bone name patterns to VRM humanoid mapping
    const boneMapping: Record<string, string> = {
      // Mixamo standard naming (most common)
      'mixamorig:Hips': 'hips',
      'mixamorig:Spine': 'spine',
      'mixamorig:Spine1': 'chest',
      'mixamorig:Spine2': 'upperChest', 
      'mixamorig:Neck': 'neck',
      'mixamorig:Head': 'head',
      
      'mixamorig:LeftShoulder': 'leftShoulder',
      'mixamorig:LeftArm': 'leftUpperArm',
      'mixamorig:LeftForeArm': 'leftLowerArm',
      'mixamorig:LeftHand': 'leftHand',
      
      'mixamorig:RightShoulder': 'rightShoulder',
      'mixamorig:RightArm': 'rightUpperArm',
      'mixamorig:RightForeArm': 'rightLowerArm', 
      'mixamorig:RightHand': 'rightHand',
      
      'mixamorig:LeftUpLeg': 'leftUpperLeg',
      'mixamorig:LeftLeg': 'leftLowerLeg',
      'mixamorig:LeftFoot': 'leftFoot',
      'mixamorig:LeftToeBase': 'leftToes',
      
      'mixamorig:RightUpLeg': 'rightUpperLeg',
      'mixamorig:RightLeg': 'rightLowerLeg',
      'mixamorig:RightFoot': 'rightFoot',
      'mixamorig:RightToeBase': 'rightToes',
      
      // Standard GLTF naming without prefix
      'Hips': 'hips',
      'Spine': 'spine',
      'Chest': 'chest',
      'UpperChest': 'upperChest',
      'Neck': 'neck',
      'Head': 'head',
      'LeftShoulder': 'leftShoulder',
      'LeftUpperArm': 'leftUpperArm',
      'LeftLowerArm': 'leftLowerArm',
      'LeftHand': 'leftHand',
      'RightShoulder': 'rightShoulder', 
      'RightUpperArm': 'rightUpperArm',
      'RightLowerArm': 'rightLowerArm',
      'RightHand': 'rightHand',
      'LeftUpperLeg': 'leftUpperLeg',
      'LeftLowerLeg': 'leftLowerLeg',
      'LeftFoot': 'leftFoot',
      'LeftToes': 'leftToes',
      'RightUpperLeg': 'rightUpperLeg',
      'RightLowerLeg': 'rightLowerLeg',
      'RightFoot': 'rightFoot',
      'RightToes': 'rightToes',
      
      // Alternative GLTF naming patterns
      'Spine1': 'chest',
      'Spine2': 'upperChest',
      'Spine3': 'upperChest',
      'LeftArm': 'leftUpperArm',
      'LeftForeArm': 'leftLowerArm',
      'RightArm': 'rightUpperArm',
      'RightForeArm': 'rightLowerArm',
      'LeftUpLeg': 'leftUpperLeg',
      'LeftLeg': 'leftLowerLeg',
      'LeftToeBase': 'leftToes',
      'RightUpLeg': 'rightUpperLeg',
      'RightLeg': 'rightLowerLeg',
      'RightToeBase': 'rightToes',
      
      // Blender/other tool variations
      'pelvis': 'hips',
      'spine_01': 'spine',
      'spine_02': 'chest',
      'spine_03': 'upperChest',
      'neck_01': 'neck',
      'head': 'head',
      'clavicle_l': 'leftShoulder',
      'upperarm_l': 'leftUpperArm',
      'lowerarm_l': 'leftLowerArm',
      'hand_l': 'leftHand',
      'clavicle_r': 'rightShoulder',
      'upperarm_r': 'rightUpperArm',
      'lowerarm_r': 'rightLowerArm',
      'hand_r': 'rightHand',
      'thigh_l': 'leftUpperLeg',
      'shin_l': 'leftLowerLeg',
      'foot_l': 'leftFoot',
      'thigh_r': 'rightUpperLeg',
      'shin_r': 'rightLowerLeg',
      'foot_r': 'rightFoot'
    };

    for (const track of gltfClip.tracks) {
      const trackName = track.name;
      const boneName = trackName.split('.')[0];
      const property = trackName.split('.')[1];

      // Find VRM equivalent bone - try exact match first
      let vrmBoneName = boneMapping[boneName];
      
      // If no exact match, try advanced fuzzy matching
      if (!vrmBoneName) {
        // Remove common prefixes/suffixes and try again
        const cleanBoneName = boneName
          .replace(/mixamorig:|_l$|_r$|\.l$|\.r$|_left$|_right$/gi, '')
          .replace(/left|right/gi, (match) => match.toLowerCase() === 'left' ? 'Left' : 'Right');
        
        vrmBoneName = boneMapping[cleanBoneName];
        
        // Still no match? Try partial matching
        if (!vrmBoneName) {
          const partialMatch = Object.keys(boneMapping).find(key => {
            const keyClean = key.replace(/mixamorig:|_l$|_r$|\.l$|\.r$/gi, '').toLowerCase();
            const boneClean = boneName.replace(/mixamorig:|_l$|_r$|\.l$|\.r$/gi, '').toLowerCase();
            return keyClean.includes(boneClean) || boneClean.includes(keyClean);
          });
          
          if (partialMatch) {
            vrmBoneName = boneMapping[partialMatch];
          }
        }
      }

      if (!vrmBoneName) {
        console.warn(`GLTF: No VRM mapping found for bone: ${boneName}`);
        continue;
      }

      const vrmBone = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName as any);
      if (!vrmBone) {
        console.warn(`GLTF: VRM bone not found: ${vrmBoneName}`);
        continue;
      }

      // Create retargeted track
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
          console.warn(`GLTF: Filtering position track for non-root bone: ${boneName}`);
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
        console.warn(`GLTF: Unsupported track type: ${track.constructor.name}`);
        continue;
      }

      retargetedTracks.push(newTrack);
      console.log(`GLTF: Retargeted ${boneName} → ${vrmBoneName} (${property})`);
    }

    if (retargetedTracks.length === 0) {
      console.warn(`No tracks could be retargeted for clip: ${gltfClip.name}`);
      return null;
    }

    return new THREE.AnimationClip(
      gltfClip.name,
      gltfClip.duration,
      retargetedTracks
    );
  }

  /**
   * Validate if file is GLTF/GLB
   */
  static isValidGLTFFile(file: File): boolean {
    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.gltf') || fileName.endsWith('.glb');
  }
}