import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';
import { VRMALoader } from './vrma-loader';
import { FBXAnimationLoader } from './fbx-animation-loader';
import { GLTFAnimationLoader } from './gltf-animation-loader';
// Note: BVH support commented out for now - will add if needed
// import { BVHAnimationLoader } from './bvh-animation-loader';

/**
 * Universal Animation Manager - Handles multiple animation formats
 * Enhanced for VRM AI Avatar project integration
 */
export class UniversalAnimationManager {
  private vrmaLoader: VRMALoader;
  private fbxLoader: FBXAnimationLoader;
  private gltfLoader: GLTFAnimationLoader;
  // private bvhLoader: BVHAnimationLoader;

  constructor() {
    this.vrmaLoader = new VRMALoader();
    this.fbxLoader = new FBXAnimationLoader();
    this.gltfLoader = new GLTFAnimationLoader();
    // this.bvhLoader = new BVHAnimationLoader();
  }

  /**
   * Detect animation format and load accordingly
   * @param source - Animation file or URL
   * @param vrm - Target VRM model for retargeting
   * @param animationName - Name for the animation
   * @returns Array of AnimationClips
   */
  async loadAnimation(
    source: File | string, 
    vrm: VRM, 
    animationName?: string
  ): Promise<{ clips: THREE.AnimationClip[], format: string }> {
    const format = this.detectAnimationFormat(source);
    let clips: THREE.AnimationClip[] = [];

    try {
      switch (format) {
        case 'vrma':
          clips = await this.vrmaLoader.loadVRMA(source, vrm);
          console.log(`✓ Loaded VRMA animation: ${animationName || 'Unknown'}`);
          break;

        case 'fbx':
          clips = await this.fbxLoader.loadFBXAnimation(source, vrm);
          console.log(`✓ Loaded FBX animation: ${animationName || 'Unknown'}`);
          break;

        case 'gltf':
        case 'glb':
          clips = await this.gltfLoader.loadGLTFAnimation(source, vrm);
          console.log(`✓ Loaded GLTF/GLB animation: ${animationName || 'Unknown'}`);
          break;

        // case 'bvh':
        //   clips = await this.bvhLoader.loadBVHAnimation(source, vrm);
        //   console.log(`✓ Loaded BVH animation: ${animationName || 'Unknown'}`);
        //   break;

        default:
          throw new Error(`Unsupported animation format: ${format}`);
      }

      return { clips, format };
    } catch (error) {
      console.error(`✗ Failed to load ${format.toUpperCase()} animation:`, error);
      throw error;
    }
  }

  /**
   * Load multiple animation files at once
   */
  async loadMultipleAnimations(
    sources: Array<{ name: string; path: string | File }>,
    vrm: VRM
  ): Promise<Map<string, { clips: THREE.AnimationClip[], format: string }>> {
    const animationMap = new Map<string, { clips: THREE.AnimationClip[], format: string }>();

    for (const source of sources) {
      try {
        const result = await this.loadAnimation(source.path, vrm, source.name);
        animationMap.set(source.name, result);
      } catch (error) {
        console.error(`✗ Failed to load animation: ${source.name}`, error);
      }
    }

    return animationMap;
  }

  /**
   * Detect animation format from file
   */
  private detectAnimationFormat(source: File | string): string {
    let fileName: string;

    if (source instanceof File) {
      fileName = source.name.toLowerCase();
    } else {
      // Extract filename from URL
      fileName = source.split('/').pop()?.toLowerCase() || '';
    }

    if (fileName.endsWith('.vrma')) return 'vrma';
    if (fileName.endsWith('.fbx')) return 'fbx';
    if (fileName.endsWith('.gltf')) return 'gltf';
    if (fileName.endsWith('.glb')) return 'glb';
    // if (fileName.endsWith('.bvh')) return 'bvh';

    // Fallback: try to detect from content or throw error
    throw new Error(`Cannot detect animation format from: ${fileName}`);
  }

  /**
   * Get supported animation formats
   */
  static getSupportedFormats(): string[] {
    return ['vrma', 'fbx', 'gltf', 'glb']; // 'bvh' removed for now
  }

  /**
   * Validate if file is supported animation format
   */
  static isValidAnimationFile(file: File): boolean {
    const fileName = file.name.toLowerCase();
    return this.getSupportedFormats().some(format => fileName.endsWith(`.${format}`));
  }

  /**
   * Get format-specific loader
   */
  getLoader(format: string): any {
    switch (format.toLowerCase()) {
      case 'vrma': return this.vrmaLoader;
      case 'fbx': return this.fbxLoader;
      case 'gltf':
      case 'glb': return this.gltfLoader;
      // case 'bvh': return this.bvhLoader;
      default: throw new Error(`Unsupported format: ${format}`);
    }
  }
}