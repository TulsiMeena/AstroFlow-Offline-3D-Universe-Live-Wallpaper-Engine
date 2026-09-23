import * as THREE from 'three';

/**
 * Comprehensive Three.js WebGL Resource Cleanup Utility
 * Ensures zero memory leaks when switching procedural wallpapers,
 * destroying scenes, or reconfiguring materials/geometries.
 */
export class ResourceDisposal {
  /**
   * Recursively traverses and disposes all geometries, materials,
   * textures, and user attachments from an Object3D hierarchy.
   */
  public static disposeObject(obj: THREE.Object3D | null | undefined): void {
    if (!obj) return;

    // Traverse children first
    while (obj.children.length > 0) {
      const child = obj.children[0];
      obj.remove(child);
      this.disposeObject(child);
    }

    // Dispose geometry
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    // Dispose materials (single material or material array)
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => this.disposeMaterial(mat));
      } else {
        this.disposeMaterial(mesh.material);
      }
    }

    // Clean user data
    if (obj.userData) {
      for (const key of Object.keys(obj.userData)) {
        delete obj.userData[key];
      }
    }
  }

  /**
   * Safely disposes a material and all associated texture maps.
   */
  public static disposeMaterial(material: THREE.Material | null | undefined): void {
    if (!material) return;

    // Dispose textures attached to material
    const matAny = material as any;
    const textureKeys = [
      'map',
      'alphaMap',
      'bumpMap',
      'normalMap',
      'displacementMap',
      'roughnessMap',
      'metalnessMap',
      'emissiveMap',
      'specularMap',
      'envMap',
      'lightMap',
      'aoMap',
      'gradientMap'
    ];

    for (const key of textureKeys) {
      if (matAny[key] && matAny[key] instanceof THREE.Texture) {
        matAny[key].dispose();
        matAny[key] = null;
      }
    }

    // Dispose uniforms if ShaderMaterial
    if (material instanceof THREE.ShaderMaterial && material.uniforms) {
      for (const uKey of Object.keys(material.uniforms)) {
        const uVal = material.uniforms[uKey]?.value;
        if (uVal && uVal instanceof THREE.Texture) {
          uVal.dispose();
        }
      }
    }

    material.dispose();
  }

  /**
   * Disposes a complete Three.js Scene and all root-level lights/objects.
   */
  public static disposeScene(scene: THREE.Scene | null | undefined): void {
    if (!scene) return;

    while (scene.children.length > 0) {
      const child = scene.children[0];
      scene.remove(child);
      this.disposeObject(child);
    }

    if (scene.environment && scene.environment instanceof THREE.Texture) {
      scene.environment.dispose();
      scene.environment = null;
    }
    if (scene.background && scene.background instanceof THREE.Texture) {
      scene.background.dispose();
      scene.background = null;
    }
  }

  /**
   * Disposes a WebGLRenderTarget and its underlying textures.
   */
  public static disposeRenderTarget(target: THREE.WebGLRenderTarget | null | undefined): void {
    if (!target) return;
    if (target.texture) {
      target.texture.dispose();
    }
    if (target.depthTexture) {
      target.depthTexture.dispose();
    }
    target.dispose();
  }
}
