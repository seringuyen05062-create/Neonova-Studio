import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

export class VRMLoader {
  private loader: GLTFLoader;

  constructor() {
    this.loader = new GLTFLoader();
    this.loader.register((parser) => new VRMLoaderPlugin(parser));
  }

  /**
   * Load VRM model from file or URL
   */
  async loadVRM(source: File | string): Promise<VRM> {
    try {
      let url: string;

      if (source instanceof File) {
        url = URL.createObjectURL(source);
      } else {
        url = source;
      }

      const gltf = await this.loader.loadAsync(url);
      const vrm = gltf.userData.vrm as VRM;

      if (!vrm) {
        throw new Error('Failed to load VRM from file');
      }

      // Cleanup object URL if created from File
      if (source instanceof File) {
        URL.revokeObjectURL(url);
      }

      // Disable frustum culling for VRM
      vrm.scene.traverse((obj) => {
        obj.frustumCulled = false;
      });

      // Rotate model to face camera
      VRMUtils.rotateVRM0(vrm);

      return vrm;
    } catch (error) {
      console.error('Error loading VRM:', error);
      throw error;
    }
  }

  /**
   * Validate if file is a valid VRM
   */
  static isValidVRMFile(file: File): boolean {
    const validExtensions = ['.vrm', '.glb'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Get VRM metadata
   */
  static getVRMInfo(vrm: VRM) {
    const meta = vrm.meta;
    if (!meta) {
      return {
        name: 'Unknown',
        version: 'Unknown',
        author: 'Unknown',
        contactInformation: '',
        reference: '',
      };
    }

    // Handle VRM1.0 meta
    if (meta.metaVersion === '1') {
      return {
        name: meta.name || 'Unknown',
        version: meta.version || 'Unknown',
        author: meta.authors?.[0] || 'Unknown',
        contactInformation: meta.contactInformation || '',
        reference: meta.references?.[0] || '',
      };
    }

    // Handle VRM0.0 meta
    return {
      name: (meta as any).title || 'Unknown',
      version: meta.metaVersion || 'Unknown',
      author: (meta as any).author || 'Unknown',
      contactInformation: meta.contactInformation || '',
      reference: (meta as any).reference || '',
    };
  }
}

export default VRMLoader;
