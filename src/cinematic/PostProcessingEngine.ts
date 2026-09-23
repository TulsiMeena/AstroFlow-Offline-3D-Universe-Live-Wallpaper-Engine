import * as THREE from 'three';
import { PostProcessingConfig, AccessibilitySettings } from './types';
import { BloomEffect } from './BloomEffect';
import { MotionBlurEffect } from './MotionBlurEffect';
import { VignetteEffect } from './VignetteEffect';
import { ColorGradingSystem } from './ColorGradingSystem';
import { AtmosphereRenderer } from './AtmosphereRenderer';
import { QualityConfig, QualityProfile } from '../types/engine';

export class PostProcessingEngine {
  private renderer: THREE.WebGLRenderer;
  private quality: QualityConfig;

  // Effects
  private bloomEffect: BloomEffect;
  private motionBlurEffect: MotionBlurEffect;
  private vignetteEffect: VignetteEffect;
  private colorGradingSystem: ColorGradingSystem;
  private atmosphereRenderer: AtmosphereRenderer;

  // Render Targets for multi-pass compositing
  private renderTargetA: THREE.WebGLRenderTarget | null = null;
  private renderTargetB: THREE.WebGLRenderTarget | null = null;

  // Orthographic Quad for full-screen post-processing
  private postScene: THREE.Scene;
  private postCamera: THREE.OrthographicCamera;
  private quadMesh: THREE.Mesh;

  // Screen dimension tracking
  private width: number = 1920;
  private height: number = 1080;

  // Dynamic FPS adaptation
  private dynamicThrottle: boolean = false;
  private frameCount: number = 0;

  constructor(renderer: THREE.WebGLRenderer, quality: QualityConfig) {
    this.renderer = renderer;
    this.quality = quality;

    this.bloomEffect = new BloomEffect();
    this.motionBlurEffect = new MotionBlurEffect();
    this.vignetteEffect = new VignetteEffect();
    this.colorGradingSystem = new ColorGradingSystem();
    this.atmosphereRenderer = new AtmosphereRenderer();

    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const quadGeo = new THREE.PlaneGeometry(2, 2);
    this.quadMesh = new THREE.Mesh(quadGeo);
    this.postScene.add(this.quadMesh);

    const size = new THREE.Vector2();
    renderer.getSize(size);
    this.setSize(size.x, size.y);
  }

  public getAtmosphereRenderer(): AtmosphereRenderer {
    return this.atmosphereRenderer;
  }

  public setSize(width: number, height: number): void {
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));

    this.renderTargetA?.dispose();
    this.renderTargetB?.dispose();

    // Scale target resolution based on quality tier
    let scale = 1.0;
    if (this.quality.profile === 'LOW') scale = 0.5;
    else if (this.quality.profile === 'MEDIUM') scale = 0.75;
    else if (this.quality.profile === 'HIGH') scale = 1.0;
    else if (this.quality.profile === 'ULTRA') scale = 1.0;

    const rtW = Math.max(1, Math.floor(this.width * scale));
    const rtH = Math.max(1, Math.floor(this.height * scale));

    const options: THREE.RenderTargetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
      depthBuffer: true,
    };

    this.renderTargetA = new THREE.WebGLRenderTarget(rtW, rtH, options);
    this.renderTargetB = new THREE.WebGLRenderTarget(rtW, rtH, options);
  }

  public setQuality(quality: QualityConfig): void {
    this.quality = quality;
    this.setSize(this.width, this.height);
  }

  public setDynamicThrottle(throttle: boolean): void {
    this.dynamicThrottle = throttle;
  }

  /**
   * Render complete scene through performance-aware post-processing pipeline
   */
  public render(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    time: number,
    delta: number,
    config: PostProcessingConfig,
    accessibility: AccessibilitySettings
  ): void {
    this.frameCount++;

    // 1. Update Atmosphere
    this.atmosphereRenderer.update(time, delta, config, accessibility);

    // If post-processing is disabled or profile is LOW and no effects active, render directly
    if (
      !config.enabled ||
      !this.renderTargetA ||
      !this.renderTargetB ||
      (this.quality.profile === 'LOW' && !config.colorGradingEnabled && !config.vignetteEnabled)
    ) {
      this.renderer.setRenderTarget(null);
      this.renderer.render(scene, camera);
      return;
    }

    const currentRenderTarget = this.renderer.getRenderTarget();

    // 2. Pass 1: Render 3D Scene into RenderTarget A
    this.renderer.setRenderTarget(this.renderTargetA);
    this.renderer.clear();
    this.renderer.render(scene, camera);

    let readTarget = this.renderTargetA;
    let writeTarget = this.renderTargetB;

    const swapTargets = () => {
      const temp = readTarget;
      readTarget = writeTarget;
      writeTarget = temp;
    };

    // Determine effect enablement based on Quality Profile and dynamic throttle
    const canBloom =
      config.bloomEnabled &&
      this.quality.profile !== 'LOW' &&
      (!this.dynamicThrottle || this.quality.profile === 'ULTRA');

    const canMotionBlur =
      config.motionBlurEnabled &&
      !accessibility.reducedMotion &&
      !this.dynamicThrottle &&
      (this.quality.profile === 'HIGH' || this.quality.profile === 'ULTRA');

    const canVignette = config.vignetteEnabled;
    const canColorGrade = config.colorGradingEnabled;

    // 3. Pass 2: Bloom Pass
    if (canBloom) {
      this.bloomEffect.update(
        config.bloomThreshold,
        config.bloomIntensity,
        config.bloomRadius,
        this.width,
        this.height
      );
      this.bloomEffect.getMaterial().uniforms.tDiffuse.value = readTarget.texture;
      this.quadMesh.material = this.bloomEffect.getMaterial();

      this.renderer.setRenderTarget(writeTarget);
      this.renderer.render(this.postScene, this.postCamera);
      swapTargets();
    }

    // 4. Pass 3: Motion Blur Pass
    if (canMotionBlur) {
      this.motionBlurEffect.update(
        camera.position,
        delta,
        config.motionBlurIntensity,
        this.width,
        this.height
      );
      this.motionBlurEffect.getMaterial().uniforms.tDiffuse.value = readTarget.texture;
      this.quadMesh.material = this.motionBlurEffect.getMaterial();

      this.renderer.setRenderTarget(writeTarget);
      this.renderer.render(this.postScene, this.postCamera);
      swapTargets();
    }

    // 5. Pass 4: Vignette & Chromatic Aberration
    if (canVignette) {
      this.vignetteEffect.update(
        config.vignetteDarkness,
        config.vignetteOffset,
        accessibility.disableFlashEffects ? 0 : config.chromaticAberration
      );
      this.vignetteEffect.getMaterial().uniforms.tDiffuse.value = readTarget.texture;
      this.quadMesh.material = this.vignetteEffect.getMaterial();

      this.renderer.setRenderTarget(writeTarget);
      this.renderer.render(this.postScene, this.postCamera);
      swapTargets();
    }

    // 6. Pass 5: Final Color Grading & Film Grain to Screen
    if (canColorGrade) {
      this.colorGradingSystem.update(
        config.exposure,
        config.contrast,
        config.saturation,
        config.temperature,
        config.tint,
        accessibility.reducedMotion ? 0 : config.filmGrain,
        time
      );
      this.colorGradingSystem.getMaterial().uniforms.tDiffuse.value = readTarget.texture;
      this.quadMesh.material = this.colorGradingSystem.getMaterial();

      this.renderer.setRenderTarget(null);
      this.renderer.render(this.postScene, this.postCamera);
    } else {
      // Direct blit to screen
      this.vignetteEffect.update(0, 2.0, 0);
      this.vignetteEffect.getMaterial().uniforms.tDiffuse.value = readTarget.texture;
      this.quadMesh.material = this.vignetteEffect.getMaterial();

      this.renderer.setRenderTarget(null);
      this.renderer.render(this.postScene, this.postCamera);
    }

    if (currentRenderTarget) {
      this.renderer.setRenderTarget(currentRenderTarget);
    }
  }

  public dispose(): void {
    this.renderTargetA?.dispose();
    this.renderTargetB?.dispose();
    this.bloomEffect.dispose();
    this.motionBlurEffect.dispose();
    this.vignetteEffect.dispose();
    this.colorGradingSystem.dispose();
    this.atmosphereRenderer.dispose();
    this.quadMesh.geometry.dispose();
  }
}
