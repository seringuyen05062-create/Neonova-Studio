import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM } from '@pixiv/three-vrm';
import { 
  VRMAnimation, 
  VRMAnimationLoaderPlugin, 
  createVRMAnimationClip 
} from '@pixiv/three-vrm-animation';

/**
 * Official VRMA Loader using @pixiv/three-vrm-animation
 * This is the correct way to load VRMA animations according to the official documentation
 */
export class VRMALoader {
  private loader: GLTFLoader;

  constructor() {
    this.loader = new GLTFLoader();
  }

  /**
   * Load VRMA animation file using official VRMAnimationLoaderPlugin
   * @param source - File object or URL string
   * @param vrm - VRM model to apply animation to (required for proper retargeting)
   * @returns Array of AnimationClips ready to use with AnimationMixer
   */
  async loadVRMA(source: File | string, vrm?: VRM): Promise<THREE.AnimationClip[]> {
    try {
      let url: string;

      if (source instanceof File) {
        url = URL.createObjectURL(source);
      } else {
        url = source;
      }

      // Register VRMAnimationLoaderPlugin to parse VRMA data
      const gltf = await new Promise<any>((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
        
        loader.load(
          url,
          (gltf) => resolve(gltf),
          undefined,
          (error) => reject(error)
        );
      });

      // Cleanup object URL if created from File
      if (source instanceof File) {
        URL.revokeObjectURL(url);
      }

      // Extract VRMAnimation objects from loaded GLTF
      const vrmAnimations = gltf.userData.vrmAnimations as VRMAnimation[] | undefined;

      if (!vrmAnimations || vrmAnimations.length === 0) {
        throw new Error('No VRM animations found in VRMA file');
      }

      console.log(`Loaded ${vrmAnimations.length} VRM animation(s) from VRMA file`);

      // If VRM is provided, convert VRMAnimation to AnimationClip using official API
      if (vrm) {
        const clips = vrmAnimations.map((vrmAnimation, index) => {
          // Use official createVRMAnimationClip for proper retargeting
          const clip = createVRMAnimationClip(vrmAnimation, vrm);
          console.log(`Created AnimationClip "${clip.name}" (${clip.duration.toFixed(2)}s, ${clip.tracks.length} tracks)`);
          return clip;
        });

        return clips;
      } else {
        // If no VRM provided, return empty array (will need to convert later)
        console.warn('No VRM provided - animations loaded but not converted to clips');
        return [];
      }
    } catch (error) {
      console.error('Error loading VRMA:', error);
      throw error;
    }
  }

  /**
   * Load multiple VRMA files at once
   * @param sources - Array of file paths or File objects
   * @param vrm - VRM model to apply animations to
   * @returns Map of animation name to clips
   */
  async loadMultipleVRMA(
    sources: Array<{ name: string; path: string | File }>,
    vrm?: VRM
  ): Promise<Map<string, THREE.AnimationClip[]>> {
    const animationMap = new Map<string, THREE.AnimationClip[]>();

    for (const source of sources) {
      try {
        const clips = await this.loadVRMA(source.path, vrm);
        animationMap.set(source.name, clips);
        console.log(`✓ Loaded VRMA: ${source.name}`);
      } catch (error) {
        console.error(`✗ Failed to load VRMA: ${source.name}`, error);
      }
    }

    return animationMap;
  }

  /**
   * Validate if file is a valid VRMA
   */
  static isValidVRMAFile(file: File): boolean {
    const validExtensions = ['.vrma'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some(ext => fileName.endsWith(ext));
  }
}

export default VRMALoader;
