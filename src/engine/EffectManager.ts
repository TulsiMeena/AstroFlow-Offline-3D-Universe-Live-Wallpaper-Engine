import * as THREE from 'three';
import { QualityConfig } from '../types/engine';

export interface EffectSettings {
  fog: boolean;
  bloomGlow: boolean;
  atmosphericVignette: boolean;
  energyPulse: boolean;
}

export class EffectManager {
  private fog: THREE.FogExp2 | null = null;
  private glowMesh: THREE.Mesh | null = null;
  private enabledEffects: EffectSettings = {
    fog: true,
    bloomGlow: true,
    atmosphericVignette: true,
    energyPulse: true
  };

  public init(scene: THREE.Scene, quality: QualityConfig) {
    this.dispose(scene);

    if (this.enabledEffects.fog) {
      this.fog = new THREE.FogExp2(0x05070e, 0.04);
      scene.fog = this.fog;
    }

    if (this.enabledEffects.bloomGlow && quality.bloomEnabled) {
      // Atmospheric ambient glow shell
      const glowGeo = new THREE.SphereGeometry(18, 24, 24);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x0a1026,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.8
      });
      this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
      scene.add(this.glowMesh);
    }
  }

  public setFogColor(color: number, density: number = 0.04) {
    if (this.fog) {
      this.fog.color.setHex(color);
      this.fog.density = density;
    }
  }

  public update(time: number) {
    if (this.glowMesh && this.enabledEffects.energyPulse) {
      const pulse = 1.0 + Math.sin(time * 1.5) * 0.03;
      this.glowMesh.scale.set(pulse, pulse, pulse);
    }
  }

  public setEffectEnabled(effect: keyof EffectSettings, enabled: boolean, scene: THREE.Scene, quality: QualityConfig) {
    this.enabledEffects[effect] = enabled;
    this.init(scene, quality);
  }

  public dispose(scene?: THREE.Scene) {
    if (scene && scene.fog) {
      scene.fog = null;
    }
    this.fog = null;

    if (this.glowMesh) {
      if (scene) scene.remove(this.glowMesh);
      this.glowMesh.geometry.dispose();
      (this.glowMesh.material as THREE.Material).dispose();
      this.glowMesh = null;
    }
  }
}
