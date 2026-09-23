import * as THREE from 'three';
import { IWallpaper, WallpaperMetadata, WallpaperUpdateContext } from '../types/wallpaper';
import { QualityConfig } from '../types/engine';

export abstract class BaseWallpaper implements IWallpaper {
  public abstract readonly metadata: WallpaperMetadata;
  protected scene: THREE.Scene | null = null;
  protected camera: THREE.PerspectiveCamera | null = null;
  protected quality: QualityConfig | null = null;
  protected rootGroup: THREE.Group = new THREE.Group();

  public init(scene: THREE.Scene, camera: THREE.PerspectiveCamera, quality: QualityConfig): void {
    this.dispose();
    this.scene = scene;
    this.camera = camera;
    this.quality = quality;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = `Wallpaper_${this.metadata.id}`;
    this.scene.add(this.rootGroup);
    this.buildScene();
  }

  protected abstract buildScene(): void;

  public abstract update(ctx: WallpaperUpdateContext): void;

  public onQualityChange(quality: QualityConfig): void {
    this.quality = quality;
  }

  public onResize(_width: number, _height: number): void {
    // Optional override
  }

  public dispose(): void {
    if (this.scene && this.rootGroup) {
      this.scene.remove(this.rootGroup);
      this.cleanGroup(this.rootGroup);
    }
    this.scene = null;
    this.camera = null;
  }

  protected cleanGroup(group: THREE.Group) {
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Line) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    }
  }
}
