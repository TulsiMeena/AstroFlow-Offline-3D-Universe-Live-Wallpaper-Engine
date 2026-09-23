import * as THREE from 'three';
import { DesignDNA } from '../types/designDNA';

export class EffectComposer {
  private effectGroup: THREE.Group;
  private shockwaveRings: { mesh: THREE.Mesh; life: number; maxLife: number; speed: number }[] = [];
  private ambientFog: THREE.FogExp2 | null = null;
  private ringGeometry: THREE.RingGeometry;
  private ringMaterial: THREE.MeshBasicMaterial;

  constructor() {
    this.effectGroup = new THREE.Group();
    this.effectGroup.name = 'ProceduralEffectLayer';

    this.ringGeometry = new THREE.RingGeometry(0.1, 0.4, 32);
    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  public getGroup(): THREE.Group {
    return this.effectGroup;
  }

  public applyDNA(dna: DesignDNA, scene: THREE.Scene): void {
    // Fog
    if (dna.effects.fog > 0.05) {
      const fogColor = new THREE.Color(dna.colors.background);
      this.ambientFog = new THREE.FogExp2(fogColor, dna.effects.fog * 0.035);
      scene.fog = this.ambientFog;
    } else {
      scene.fog = null;
      this.ambientFog = null;
    }

    this.ringMaterial.color.set(dna.colors.accent);
  }

  public triggerShockwave(origin?: THREE.Vector3, colorHex?: string): void {
    const mesh = new THREE.Mesh(this.ringGeometry, this.ringMaterial.clone());
    if (colorHex) {
      (mesh.material as THREE.MeshBasicMaterial).color.set(colorHex);
    }
    if (origin) {
      mesh.position.copy(origin);
    }
    mesh.rotation.x = Math.PI / 2;
    this.effectGroup.add(mesh);

    this.shockwaveRings.push({
      mesh,
      life: 0,
      maxLife: 1.2,
      speed: 16.0,
    });
  }

  public update(delta: number, time: number, audioTargets?: any): void {
    // Update shockwaves
    for (let i = this.shockwaveRings.length - 1; i >= 0; i--) {
      const sw = this.shockwaveRings[i];
      sw.life += delta;
      const progress = sw.life / sw.maxLife;

      if (progress >= 1.0) {
        this.effectGroup.remove(sw.mesh);
        (sw.mesh.material as THREE.Material).dispose();
        this.shockwaveRings.splice(i, 1);
      } else {
        const currentScale = progress * sw.speed;
        sw.mesh.scale.set(currentScale, currentScale, currentScale);
        (sw.mesh.material as THREE.MeshBasicMaterial).opacity = (1.0 - progress) * 0.85;
      }
    }

    // Audio beat shockwave trigger
    if (audioTargets && audioTargets.shockwaveTrigger && this.shockwaveRings.length < 3) {
      this.triggerShockwave();
    }
  }

  public dispose(): void {
    this.shockwaveRings.forEach(sw => {
      this.effectGroup.remove(sw.mesh);
      (sw.mesh.material as THREE.Material).dispose();
    });
    this.shockwaveRings = [];
    this.ringGeometry.dispose();
    this.ringMaterial.dispose();
  }
}
