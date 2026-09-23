import * as THREE from 'three';
import { IWallpaper, WallpaperMetadata, WallpaperUpdateContext } from '../../types/wallpaper';
import { QualityConfig } from '../../types/engine';
import { DesignDNA } from '../types/designDNA';
import { DesignSeedEngine } from '../seed/DesignSeedEngine';
import { MaterialGenerator } from '../materials/MaterialGenerator';
import { LayerComposer } from '../layers/LayerComposer';
import { EffectComposer } from '../effects/EffectComposer';

export class WallpaperFusionEngine implements IWallpaper {
  public readonly metadata: WallpaperMetadata;

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private quality: QualityConfig | null = null;

  private dna: DesignDNA;
  private materialGenerator: MaterialGenerator;
  private layerComposer: LayerComposer;
  private effectComposer: EffectComposer;

  // Cached motion tilt for camera smoothing
  private currentTiltX: number = 0;
  private currentTiltY: number = 0;

  constructor(initialDNA?: DesignDNA) {
    this.dna = initialDNA || DesignSeedEngine.createDNAFromSeed('HYPER-FUSION-MASTER');

    this.metadata = {
      id: 'procedural-designer',
      title: 'Procedural Fusion Studio',
      subtitle: 'Visual 3D Wallpaper Fusion & Generative Design',
      category: 'Abstract',
      description: 'Dynamic user-composed procedural 3D wallpaper combining multi-layer environments, physics, materials, and audio resonance.',
      author: 'Amit Meena',
      tags: ['Procedural', 'Fusion', 'Interactive', 'Physics', 'Audio-Reactive'],
      accentColor: this.dna.colors.primary,
      secondaryColor: this.dna.colors.secondary,
      interactive: true,
      proceduralType: 'mesh',
    };

    this.materialGenerator = new MaterialGenerator();
    this.layerComposer = new LayerComposer(this.materialGenerator);
    this.effectComposer = new EffectComposer();
  }

  public init(scene: THREE.Scene, camera: THREE.PerspectiveCamera, quality: QualityConfig): void {
    this.scene = scene;
    this.camera = camera;
    this.quality = quality;

    // Apply camera distance and FOV from DNA
    if (this.camera) {
      this.camera.fov = this.dna.camera.fov || 60;
      this.camera.position.set(0, 0, this.dna.camera.distance || 30);
      this.camera.updateProjectionMatrix();
    }

    // Add composed layers & effects to scene
    scene.add(this.layerComposer.rootGroup);
    scene.add(this.effectComposer.getGroup());

    // Build initial geometry and shaders
    this.layerComposer.buildOrUpdate(this.dna, quality, true);
    this.effectComposer.applyDNA(this.dna, scene);
  }

  /**
   * Updates DesignDNA smoothly (incremental update without destroying scene graph)
   */
  public updateDNA(newDNA: DesignDNA, forceGeometryRebuild: boolean = false): void {
    this.dna = newDNA;
    if (this.quality && this.scene) {
      this.layerComposer.buildOrUpdate(newDNA, this.quality, forceGeometryRebuild);
      this.effectComposer.applyDNA(newDNA, this.scene);

      if (this.camera) {
        this.camera.fov = newDNA.camera.fov;
        this.camera.position.z = newDNA.camera.distance;
        this.camera.updateProjectionMatrix();
      }
    }
  }

  public getDNA(): DesignDNA {
    return this.dna;
  }

  public triggerShockwave(): void {
    this.effectComposer.triggerShockwave(undefined, this.dna.colors.accent);
  }

  public update(ctx: WallpaperUpdateContext): void {
    const time = ctx.time * this.dna.effects.animationSpeed;
    const delta = Math.min(ctx.delta, 0.05);

    // 1. Motion & Camera Parallax
    if (this.camera && this.dna.motion.mode !== 'OFF') {
      const motionMult = this.dna.motion.mode === 'Subtle' ? 0.4 : this.dna.motion.mode === 'Balanced' ? 1.0 : 1.8;
      const sens = this.dna.motion.sensitivity * motionMult;

      const targetTiltX = (ctx.motion.tiltX || 0) * sens * 3.0;
      const targetTiltY = (ctx.motion.tiltY || 0) * sens * 2.0;

      this.currentTiltX += (targetTiltX - this.currentTiltX) * 0.08;
      this.currentTiltY += (targetTiltY - this.currentTiltY) * 0.08;

      // Subtle orbit / drift
      const drift = Math.sin(time * this.dna.camera.driftSpeed * 0.5) * 1.5;
      this.camera.position.x = this.currentTiltX + drift;
      this.camera.position.y = this.currentTiltY + Math.cos(time * 0.3) * 0.5;
      this.camera.lookAt(0, 0, 0);
    }

    // 2. Audio reactivity mapping
    let audioTargets = ctx.audioTargets;
    if (this.dna.audio.enabled && ctx.audioAnalysis) {
      // Audio reactive adjustments
      this.materialGenerator.update(time, ctx.audioAnalysis);
    } else {
      this.materialGenerator.update(time);
    }

    // 3. Touch interaction position
    const touchPos = ctx.input.isDown && this.dna.motion.touchInteraction
      ? { x: ctx.input.x, y: ctx.input.y }
      : undefined;

    // 4. Update layers & effects
    this.layerComposer.update(delta, time, this.dna, audioTargets, touchPos);
    this.effectComposer.update(delta, time, audioTargets);

    // 5. Ambient World Scale
    if (this.dna.effects.worldScale !== 1.0) {
      const ws = this.dna.effects.worldScale;
      this.layerComposer.rootGroup.scale.set(ws, ws, ws);
    }
  }

  public onQualityChange(quality: QualityConfig): void {
    this.quality = quality;
    if (this.scene) {
      this.layerComposer.buildOrUpdate(this.dna, quality, true);
    }
  }

  public onResize(width: number, height: number): void {
    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  public dispose(): void {
    if (this.scene) {
      this.scene.remove(this.layerComposer.rootGroup);
      this.scene.remove(this.effectComposer.getGroup());
    }
    this.layerComposer.dispose();
    this.effectComposer.dispose();
    this.materialGenerator.dispose();
  }
}
