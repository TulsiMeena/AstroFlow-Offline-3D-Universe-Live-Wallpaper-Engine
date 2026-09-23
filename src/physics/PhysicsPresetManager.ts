import * as THREE from 'three';
import { PhysicsConfig, PhysicsPresetType, GravityPresetType, FluidSimulationType } from './types';

export class PhysicsPresetManager {
  private static defaultConfigs: Record<PhysicsPresetType, PhysicsConfig> = {
    cosmic: {
      enabled: true,
      preset: 'cosmic',
      gravityMode: 'low',
      gravityStrength: 0.25,
      windStrength: 0.1,
      windDirectionAngle: 45,
      turbulence: 0.4,
      interactionStrength: 1.6,
      drag: 0.02,
      particleMass: 0.8,
      simulationSpeed: 1.0,
      shockwaveEnabled: true,
      shockwaveRadius: 14.0,
      fluidReaction: true,
      fluidMode: 'plasma',
      ribbonReaction: true,
      objectReaction: true,
      debugVisuals: false,
    },
    ocean: {
      enabled: true,
      preset: 'ocean',
      gravityMode: 'normal',
      gravityStrength: 1.0,
      windStrength: 0.8,
      windDirectionAngle: 90,
      turbulence: 0.5,
      interactionStrength: 1.4,
      drag: 0.08,
      particleMass: 1.2,
      simulationSpeed: 1.0,
      shockwaveEnabled: true,
      shockwaveRadius: 10.0,
      fluidReaction: true,
      fluidMode: 'water',
      ribbonReaction: true,
      objectReaction: true,
      debugVisuals: false,
    },
    volcano: {
      enabled: true,
      preset: 'volcano',
      gravityMode: 'normal',
      gravityStrength: 0.9,
      windStrength: 0.6,
      windDirectionAngle: 270,
      turbulence: 0.8,
      interactionStrength: 2.0,
      drag: 0.05,
      particleMass: 1.5,
      simulationSpeed: 1.1,
      shockwaveEnabled: true,
      shockwaveRadius: 16.0,
      fluidReaction: true,
      fluidMode: 'lava',
      ribbonReaction: true,
      objectReaction: true,
      debugVisuals: false,
    },
    storm: {
      enabled: true,
      preset: 'storm',
      gravityMode: 'normal',
      gravityStrength: 1.2,
      windStrength: 2.2,
      windDirectionAngle: 180,
      turbulence: 1.0,
      interactionStrength: 2.2,
      drag: 0.04,
      particleMass: 1.0,
      simulationSpeed: 1.25,
      shockwaveEnabled: true,
      shockwaveRadius: 15.0,
      fluidReaction: true,
      fluidMode: 'water',
      ribbonReaction: true,
      objectReaction: true,
      debugVisuals: false,
    },
    cyber: {
      enabled: true,
      preset: 'cyber',
      gravityMode: 'low',
      gravityStrength: 0.4,
      windStrength: 0.3,
      windDirectionAngle: 0,
      turbulence: 0.3,
      interactionStrength: 1.8,
      drag: 0.015,
      particleMass: 0.6,
      simulationSpeed: 1.1,
      shockwaveEnabled: true,
      shockwaveRadius: 12.0,
      fluidReaction: true,
      fluidMode: 'energy',
      ribbonReaction: true,
      objectReaction: true,
      debugVisuals: false,
    },
    crystal: {
      enabled: true,
      preset: 'crystal',
      gravityMode: 'low',
      gravityStrength: 0.3,
      windStrength: 0.2,
      windDirectionAngle: 315,
      turbulence: 0.2,
      interactionStrength: 1.5,
      drag: 0.03,
      particleMass: 1.8,
      simulationSpeed: 0.9,
      shockwaveEnabled: true,
      shockwaveRadius: 11.0,
      fluidReaction: true,
      fluidMode: 'liquid-glass',
      ribbonReaction: true,
      objectReaction: true,
      debugVisuals: false,
    },
    'zero-gravity': {
      enabled: true,
      preset: 'zero-gravity',
      gravityMode: 'zero',
      gravityStrength: 0.0,
      windStrength: 0.05,
      windDirectionAngle: 0,
      turbulence: 0.15,
      interactionStrength: 2.0,
      drag: 0.005,
      particleMass: 1.0,
      simulationSpeed: 0.95,
      shockwaveEnabled: true,
      shockwaveRadius: 18.0,
      fluidReaction: true,
      fluidMode: 'plasma',
      ribbonReaction: true,
      objectReaction: true,
      debugVisuals: false,
    },
    'black-hole': {
      enabled: true,
      preset: 'black-hole',
      gravityMode: 'black-hole',
      gravityStrength: 3.5,
      windStrength: 0.1,
      windDirectionAngle: 0,
      turbulence: 0.9,
      interactionStrength: 3.0,
      drag: 0.01,
      particleMass: 2.0,
      simulationSpeed: 1.15,
      shockwaveEnabled: true,
      shockwaveRadius: 20.0,
      fluidReaction: true,
      fluidMode: 'energy',
      ribbonReaction: true,
      objectReaction: true,
      debugVisuals: false,
    },
    dream: {
      enabled: true,
      preset: 'dream',
      gravityMode: 'low',
      gravityStrength: 0.15,
      windStrength: 0.3,
      windDirectionAngle: 120,
      turbulence: 0.35,
      interactionStrength: 1.3,
      drag: 0.06,
      particleMass: 0.5,
      simulationSpeed: 0.8,
      shockwaveEnabled: true,
      shockwaveRadius: 10.0,
      fluidReaction: true,
      fluidMode: 'smoke',
      ribbonReaction: true,
      objectReaction: true,
      debugVisuals: false,
    },
    experimental: {
      enabled: true,
      preset: 'experimental',
      gravityMode: 'vortex',
      gravityStrength: 1.5,
      windStrength: 1.2,
      windDirectionAngle: 225,
      turbulence: 0.95,
      interactionStrength: 2.5,
      drag: 0.02,
      particleMass: 1.1,
      simulationSpeed: 1.2,
      shockwaveEnabled: true,
      shockwaveRadius: 16.0,
      fluidReaction: true,
      fluidMode: 'plasma',
      ribbonReaction: true,
      objectReaction: true,
      debugVisuals: false,
    },
  };

  private currentConfig: PhysicsConfig;

  constructor(initialPreset: PhysicsPresetType = 'cosmic') {
    this.currentConfig = { ...PhysicsPresetManager.defaultConfigs[initialPreset] };
  }

  public getPresetConfig(preset: PhysicsPresetType): PhysicsConfig {
    return { ...PhysicsPresetManager.defaultConfigs[preset] };
  }

  public applyPreset(preset: PhysicsPresetType): PhysicsConfig {
    this.currentConfig = { ...PhysicsPresetManager.defaultConfigs[preset] };
    return this.getConfig();
  }

  public getConfig(): PhysicsConfig {
    return { ...this.currentConfig };
  }

  public updateConfig(partial: Partial<PhysicsConfig>): PhysicsConfig {
    this.currentConfig = {
      ...this.currentConfig,
      ...partial,
    };
    return this.getConfig();
  }

  public resetCurrentPreset(): PhysicsConfig {
    this.currentConfig = { ...PhysicsPresetManager.defaultConfigs[this.currentConfig.preset] };
    return this.getConfig();
  }

  public randomize(): PhysicsConfig {
    const presets: PhysicsPresetType[] = [
      'cosmic',
      'ocean',
      'volcano',
      'storm',
      'cyber',
      'crystal',
      'zero-gravity',
      'black-hole',
      'dream',
      'experimental',
    ];
    const gravityModes: GravityPresetType[] = [
      'normal',
      'low',
      'zero',
      'reverse',
      'planet',
      'black-hole',
      'vortex',
    ];
    const fluidModes: FluidSimulationType[] = [
      'water',
      'liquid-glass',
      'plasma',
      'lava',
      'smoke',
      'energy',
    ];

    const randomPreset = presets[Math.floor(Math.random() * presets.length)];
    const base = PhysicsPresetManager.defaultConfigs[randomPreset];

    this.currentConfig = {
      ...base,
      gravityMode: gravityModes[Math.floor(Math.random() * gravityModes.length)],
      gravityStrength: Number((Math.random() * 2.5).toFixed(2)),
      windStrength: Number((Math.random() * 2.0).toFixed(2)),
      windDirectionAngle: Math.floor(Math.random() * 360),
      turbulence: Number((0.1 + Math.random() * 0.9).toFixed(2)),
      interactionStrength: Number((0.8 + Math.random() * 2.0).toFixed(2)),
      drag: Number((0.01 + Math.random() * 0.08).toFixed(3)),
      particleMass: Number((0.4 + Math.random() * 1.6).toFixed(2)),
      simulationSpeed: Number((0.7 + Math.random() * 0.7).toFixed(2)),
      fluidMode: fluidModes[Math.floor(Math.random() * fluidModes.length)],
    };

    return this.getConfig();
  }
}
