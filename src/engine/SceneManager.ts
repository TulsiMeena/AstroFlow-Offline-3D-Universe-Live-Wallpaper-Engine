import * as THREE from 'three';

export class SceneManager {
  private currentScene: THREE.Scene;

  constructor() {
    this.currentScene = new THREE.Scene();
    this.currentScene.background = new THREE.Color(0x05070e);
  }

  public getScene(): THREE.Scene {
    return this.currentScene;
  }

  public setBackgroundColor(color: number | string) {
    this.currentScene.background = new THREE.Color(color);
  }

  public clear() {
    this.disposeHierarchy(this.currentScene);
  }

  private disposeHierarchy(node: THREE.Object3D) {
    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i];
      this.disposeHierarchy(child);
      node.remove(child);

      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }

      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material;
        if (Array.isArray(mat)) {
          mat.forEach(m => this.disposeMaterial(m));
        } else {
          this.disposeMaterial(mat);
        }
      }
    }
  }

  private disposeMaterial(material: THREE.Material) {
    material.dispose();
    for (const key of Object.keys(material)) {
      const value = (material as unknown as Record<string, unknown>)[key];
      if (value && typeof value === 'object' && 'dispose' in value && typeof (value as { dispose: unknown }).dispose === 'function') {
        (value as { dispose: () => void }).dispose();
      }
    }
  }

  public dispose() {
    this.clear();
  }
}
