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

      // Disable frustum culling for VRM and ensure visibility
      vrm.scene.traverse((obj) => {
        obj.frustumCulled = false;
        obj.visible = true;
        
        // Ensure all materials are visible and properly configured
        if ('material' in obj) {
          const material = (obj as any).material;
          if (material) {
            const materials = Array.isArray(material) ? material : [material];
            materials.forEach(mat => {
              if (mat) {
                // CRITICAL: Don't force all materials to be transparent
                // Only set transparent if alphaMode is set
                const needsTransparency = mat.alphaTest > 0 || mat.opacity < 1 || mat.transparent;
                
                mat.side = THREE.FrontSide;
                if (needsTransparency) {
                  mat.transparent = true;
                  mat.alphaTest = Math.max(mat.alphaTest || 0, 0.01);
                  mat.depthWrite = false;
                } else {
                  mat.transparent = false;
                  mat.depthWrite = true;
                }
                
                // Ensure color/texture is preserved
                mat.needsUpdate = true;
                
                console.log('[VRMLoader] Material config:', {
                  name: mat.name,
                  transparent: mat.transparent,
                  alphaTest: mat.alphaTest,
                  hasMap: !!mat.map,
                  color: mat.color?.getHexString()
                });
              }
            });
          }
        }
      });

      // Ensure the VRM scene is visible
      vrm.scene.visible = true;

      // Rotate model to face camera
      VRMUtils.rotateVRM0(vrm);

      // Debug: Log VRM structure
      console.log('VRM loaded successfully:', {
        scene: vrm.scene,
        position: vrm.scene.position,
        scale: vrm.scene.scale,
        visible: vrm.scene.visible,
        childrenCount: vrm.scene.children.length
      });

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
