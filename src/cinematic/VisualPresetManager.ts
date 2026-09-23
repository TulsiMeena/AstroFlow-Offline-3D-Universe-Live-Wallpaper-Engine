import { VisualPresetType, CameraConfig, PostProcessingConfig, AccessibilitySettings } from './types';

export interface VisualPreset {
  id: VisualPresetType;
  name: string;
  description: string;
  camera: Partial<CameraConfig>;
  postProcessing: Partial<PostProcessingConfig>;
}

export class VisualPresetManager {
  private currentPreset: VisualPresetType = 'cinematic';
  private presets: Map<VisualPresetType, VisualPreset> = new Map();

  constructor(initialPreset: VisualPresetType = 'cinematic') {
    this.currentPreset = initialPreset;
    this.initPresets();
  }

  private initPresets(): void {
    this.presets.set('cinematic', {
      id: 'cinematic',
      name: 'Cinematic Anamorphic',
      description: 'Slow graceful camera drone sweep with anamorphic bloom & subtle 35mm grain.',
      camera: {
        mode: 'cinematic',
        speed: 1.0,
        smoothness: 0.65,
        zoom: 1.0,
        parallaxStrength: 1.0,
        shakeStrength: 1.0,
        depthStrength: 1.0,
        motionSensitivity: 1.0,
        fov: 55,
      },
      postProcessing: {
        enabled: true,
        bloomEnabled: true,
        bloomIntensity: 1.25,
        bloomThreshold: 0.65,
        bloomRadius: 1.1,
        motionBlurEnabled: true,
        motionBlurIntensity: 0.45,
        vignetteEnabled: true,
        vignetteDarkness: 0.85,
        vignetteOffset: 1.1,
        chromaticAberration: 0.003,
        colorGradingEnabled: true,
        exposure: 1.05,
        contrast: 1.08,
        saturation: 1.12,
        temperature: 0.05,
        tint: -0.02,
        filmGrain: 0.02,
        atmosphereEnabled: true,
        atmosphereDensity: 0.65,
        depthHaze: 0.5,
      },
    });

    this.presets.set('relaxed', {
      id: 'relaxed',
      name: 'Relaxed Zen',
      description: 'Gentle floating camera with warm atmospheric haze and soft illumination.',
      camera: {
        mode: 'orbit',
        speed: 0.5,
        smoothness: 0.85,
        zoom: 0.9,
        parallaxStrength: 0.6,
        shakeStrength: 0.3,
        depthStrength: 0.8,
        motionSensitivity: 0.7,
        fov: 50,
      },
      postProcessing: {
        enabled: true,
        bloomEnabled: true,
        bloomIntensity: 0.8,
        bloomThreshold: 0.7,
        bloomRadius: 1.4,
        motionBlurEnabled: false,
        motionBlurIntensity: 0.0,
        vignetteEnabled: true,
        vignetteDarkness: 0.6,
        vignetteOffset: 1.3,
        chromaticAberration: 0.001,
        colorGradingEnabled: true,
        exposure: 0.98,
        contrast: 0.98,
        saturation: 1.0,
        temperature: 0.15,
        tint: 0.0,
        filmGrain: 0.01,
        atmosphereEnabled: true,
        atmosphereDensity: 0.8,
        depthHaze: 0.65,
      },
    });

    this.presets.set('dynamic', {
      id: 'dynamic',
      name: 'Dynamic Kinetic',
      description: 'Energetic camera path with responsive motion blur and crisp high-contrast grading.',
      camera: {
        mode: 'fly',
        speed: 1.4,
        smoothness: 0.5,
        zoom: 1.15,
        parallaxStrength: 1.4,
        shakeStrength: 1.2,
        depthStrength: 1.3,
        motionSensitivity: 1.3,
        fov: 65,
      },
      postProcessing: {
        enabled: true,
        bloomEnabled: true,
        bloomIntensity: 1.5,
        bloomThreshold: 0.6,
        bloomRadius: 1.0,
        motionBlurEnabled: true,
        motionBlurIntensity: 0.7,
        vignetteEnabled: true,
        vignetteDarkness: 0.95,
        vignetteOffset: 1.0,
        chromaticAberration: 0.005,
        colorGradingEnabled: true,
        exposure: 1.1,
        contrast: 1.15,
        saturation: 1.25,
        temperature: -0.05,
        tint: 0.05,
        filmGrain: 0.03,
        atmosphereEnabled: true,
        atmosphereDensity: 0.5,
        depthHaze: 0.4,
      },
    });

    this.presets.set('space', {
      id: 'space',
      name: 'Deep Space Horizon',
      description: 'Slow cosmic orbit with intense star bloom, deep black skies and cool blue grading.',
      camera: {
        mode: 'galaxy',
        speed: 0.7,
        smoothness: 0.8,
        zoom: 1.0,
        parallaxStrength: 1.1,
        shakeStrength: 0.6,
        depthStrength: 1.5,
        motionSensitivity: 0.9,
        fov: 60,
      },
      postProcessing: {
        enabled: true,
        bloomEnabled: true,
        bloomIntensity: 1.7,
        bloomThreshold: 0.55,
        bloomRadius: 1.5,
        motionBlurEnabled: true,
        motionBlurIntensity: 0.3,
        vignetteEnabled: true,
        vignetteDarkness: 1.1,
        vignetteOffset: 0.95,
        chromaticAberration: 0.004,
        colorGradingEnabled: true,
        exposure: 1.05,
        contrast: 1.2,
        saturation: 1.3,
        temperature: -0.2,
        tint: 0.05,
        filmGrain: 0.02,
        atmosphereEnabled: true,
        atmosphereDensity: 0.4,
        depthHaze: 0.35,
      },
    });

    this.presets.set('nature', {
      id: 'nature',
      name: 'Organic Biome',
      description: 'Lush golden hour sunlight rays, deep organic green tones and serene depth of field.',
      camera: {
        mode: 'orbit',
        speed: 0.8,
        smoothness: 0.75,
        zoom: 0.95,
        parallaxStrength: 1.0,
        shakeStrength: 0.5,
        depthStrength: 1.1,
        motionSensitivity: 1.0,
        fov: 52,
      },
      postProcessing: {
        enabled: true,
        bloomEnabled: true,
        bloomIntensity: 1.1,
        bloomThreshold: 0.65,
        bloomRadius: 1.2,
        motionBlurEnabled: false,
        motionBlurIntensity: 0.0,
        vignetteEnabled: true,
        vignetteDarkness: 0.7,
        vignetteOffset: 1.2,
        chromaticAberration: 0.002,
        colorGradingEnabled: true,
        exposure: 1.02,
        contrast: 1.05,
        saturation: 1.18,
        temperature: 0.18,
        tint: -0.1,
        filmGrain: 0.015,
        atmosphereEnabled: true,
        atmosphereDensity: 0.75,
        depthHaze: 0.6,
      },
    });

    this.presets.set('cyberpunk', {
      id: 'cyberpunk',
      name: 'Neon Cyber City',
      description: 'Electric neon bloom with high chromatic aberration, teal-magenta grade and fast camera.',
      camera: {
        mode: 'follow',
        speed: 1.3,
        smoothness: 0.6,
        zoom: 1.2,
        parallaxStrength: 1.5,
        shakeStrength: 1.4,
        depthStrength: 1.4,
        motionSensitivity: 1.4,
        fov: 62,
      },
      postProcessing: {
        enabled: true,
        bloomEnabled: true,
        bloomIntensity: 2.1,
        bloomThreshold: 0.5,
        bloomRadius: 1.3,
        motionBlurEnabled: true,
        motionBlurIntensity: 0.65,
        vignetteEnabled: true,
        vignetteDarkness: 1.2,
        vignetteOffset: 0.9,
        chromaticAberration: 0.008,
        colorGradingEnabled: true,
        exposure: 1.12,
        contrast: 1.22,
        saturation: 1.4,
        temperature: -0.15,
        tint: 0.25,
        filmGrain: 0.035,
        atmosphereEnabled: true,
        atmosphereDensity: 0.7,
        depthHaze: 0.5,
      },
    });

    this.presets.set('fantasy', {
      id: 'fantasy',
      name: 'Ethereal Fantasy',
      description: 'Dreamlike glowing diffusion, pastel color warmth and gentle floating flight.',
      camera: {
        mode: 'macro',
        speed: 0.7,
        smoothness: 0.8,
        zoom: 0.9,
        parallaxStrength: 0.9,
        shakeStrength: 0.4,
        depthStrength: 1.2,
        motionSensitivity: 0.8,
        fov: 54,
      },
      postProcessing: {
        enabled: true,
        bloomEnabled: true,
        bloomIntensity: 1.6,
        bloomThreshold: 0.6,
        bloomRadius: 1.6,
        motionBlurEnabled: false,
        motionBlurIntensity: 0.0,
        vignetteEnabled: true,
        vignetteDarkness: 0.65,
        vignetteOffset: 1.2,
        chromaticAberration: 0.003,
        colorGradingEnabled: true,
        exposure: 1.08,
        contrast: 0.95,
        saturation: 1.15,
        temperature: 0.12,
        tint: 0.08,
        filmGrain: 0.01,
        atmosphereEnabled: true,
        atmosphereDensity: 0.85,
        depthHaze: 0.7,
      },
    });

    this.presets.set('experimental', {
      id: 'experimental',
      name: 'Experimental Warp',
      description: 'Unconstrained multidimensional portal distortion with maximum lens effects.',
      camera: {
        mode: 'portal',
        speed: 1.5,
        smoothness: 0.4,
        zoom: 1.3,
        parallaxStrength: 1.8,
        shakeStrength: 1.8,
        depthStrength: 1.8,
        motionSensitivity: 1.6,
        fov: 70,
      },
      postProcessing: {
        enabled: true,
        bloomEnabled: true,
        bloomIntensity: 2.4,
        bloomThreshold: 0.45,
        bloomRadius: 1.8,
        motionBlurEnabled: true,
        motionBlurIntensity: 0.8,
        vignetteEnabled: true,
        vignetteDarkness: 1.3,
        vignetteOffset: 0.85,
        chromaticAberration: 0.012,
        colorGradingEnabled: true,
        exposure: 1.2,
        contrast: 1.3,
        saturation: 1.5,
        temperature: 0.0,
        tint: 0.1,
        filmGrain: 0.04,
        atmosphereEnabled: true,
        atmosphereDensity: 0.9,
        depthHaze: 0.8,
      },
    });
  }

  public getPreset(id: VisualPresetType): VisualPreset | undefined {
    return this.presets.get(id);
  }

  public getAllPresets(): VisualPreset[] {
    return Array.from(this.presets.values());
  }

  public getCurrentPreset(): VisualPresetType {
    return this.currentPreset;
  }

  public setPreset(id: VisualPresetType): VisualPreset | undefined {
    const preset = this.presets.get(id);
    if (preset) {
      this.currentPreset = id;
    }
    return preset;
  }
}
