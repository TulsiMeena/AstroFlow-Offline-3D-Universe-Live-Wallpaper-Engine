import {
  AudioAnalysisData,
  AudioReactiveConfig,
  AudioReactiveVisualTargets,
  WallpaperAudioProfileType,
  WallpaperProfileConfig,
} from './types';

export class VisualAudioMapper {
  private profiles: Record<WallpaperAudioProfileType, WallpaperProfileConfig> = {
    cosmic: {
      id: 'cosmic',
      name: 'Cosmic Field',
      bassTarget: 'Energy sphere scale & sub-space contraction',
      midTarget: 'Orbital velocity & gravitational stream',
      trebleTarget: 'Starlight twinkle & micro-dust scintillation',
      beatAction: 'Radial cosmic shockwave kick',
      colorShiftWeight: 0.6,
      displacementWeight: 1.2,
      energyDecay: 0.9,
    },
    galaxy: {
      id: 'galaxy',
      name: 'Spiral Galaxy',
      bassTarget: 'Supermassive core pulsation',
      midTarget: 'Spiral arm rotation flow',
      trebleTarget: 'Cluster star sparks',
      beatAction: 'Core burst expulsion',
      colorShiftWeight: 0.7,
      displacementWeight: 1.0,
      energyDecay: 0.88,
    },
    'black-hole': {
      id: 'black-hole',
      name: 'Black Hole',
      bassTarget: 'Event horizon diameter & gravitational lensing',
      midTarget: 'Accretion disk plasma swirl',
      trebleTarget: 'Relativistic jet sparkles',
      beatAction: 'Hawking radiation flash',
      colorShiftWeight: 0.9,
      displacementWeight: 1.4,
      energyDecay: 0.92,
    },
    nebula: {
      id: 'nebula',
      name: 'Stellar Nebula',
      bassTarget: 'Gas cloud density & volumetric expansion',
      midTarget: 'Plasma tendril drift',
      trebleTarget: 'Ionized gas shimmer',
      beatAction: 'Stellar nursery ignition flash',
      colorShiftWeight: 0.8,
      displacementWeight: 0.9,
      energyDecay: 0.85,
    },
    ocean: {
      id: 'ocean',
      name: 'Bioluminescent Ocean',
      bassTarget: 'Wave amplitude & deep sea swell',
      midTarget: 'Current flow & foam movement',
      trebleTarget: 'Plankton light flashes',
      beatAction: 'Tidal crest splash pulse',
      colorShiftWeight: 0.5,
      displacementWeight: 1.3,
      energyDecay: 0.87,
    },
    forest: {
      id: 'forest',
      name: 'Living Forest',
      bassTarget: 'Earth resonance & tree canopy sway',
      midTarget: 'Wind in leaves & foliage rustling',
      trebleTarget: 'Firefly luminescence & dew glints',
      beatAction: 'Spore burst & floral pulse',
      colorShiftWeight: 0.4,
      displacementWeight: 0.8,
      energyDecay: 0.86,
    },
    aurora: {
      id: 'aurora',
      name: 'Solar Aurora',
      bassTarget: 'Curtain width & vertical expansion',
      midTarget: 'Ionospheric ribbon undulation',
      trebleTarget: 'Solar wind particulate streaks',
      beatAction: 'Geomagnetic burst ripple',
      colorShiftWeight: 1.0,
      displacementWeight: 1.1,
      energyDecay: 0.89,
    },
    volcano: {
      id: 'volcano',
      name: 'Volcanic Core',
      bassTarget: 'Magma reservoir surge & ground tremor',
      midTarget: 'Lava flow speed & convective heat waves',
      trebleTarget: 'Cinder sparks & ash particle glow',
      beatAction: 'Caldera eruption shockwave',
      colorShiftWeight: 0.7,
      displacementWeight: 1.5,
      energyDecay: 0.9,
    },
    'cyber-city': {
      id: 'cyber-city',
      name: 'Cyber City',
      bassTarget: 'Skyscraper holographic base pulse',
      midTarget: 'Traffic speed & data cable illumination',
      trebleTarget: 'Neon flicker & digital glitch sparks',
      beatAction: 'Citywide grid pulse',
      colorShiftWeight: 1.2,
      displacementWeight: 0.95,
      energyDecay: 0.82,
    },
    'neon-highway': {
      id: 'neon-highway',
      name: 'Neon Highway',
      bassTarget: 'Grid compression & road surge',
      midTarget: 'Speed warp velocity',
      trebleTarget: 'Reflective line lasers',
      beatAction: 'Light speed booster flash',
      colorShiftWeight: 1.1,
      displacementWeight: 1.2,
      energyDecay: 0.84,
    },
    crystal: {
      id: 'crystal',
      name: 'Prismatic Crystal',
      bassTarget: 'Crystal facet refraction depth',
      midTarget: 'Internal spectral caustics',
      trebleTarget: 'Edge glare & chromatic dispersion',
      beatAction: 'Harmonic resonance chime shock',
      colorShiftWeight: 0.85,
      displacementWeight: 0.7,
      energyDecay: 0.94,
    },
    'liquid-glass': {
      id: 'liquid-glass',
      name: 'Liquid Glass',
      bassTarget: 'Fluid droplet viscosity & surface tension',
      midTarget: 'Curvature ripples & refraction waves',
      trebleTarget: 'Specular highlights',
      beatAction: 'Drop impact ring',
      colorShiftWeight: 0.5,
      displacementWeight: 1.3,
      energyDecay: 0.86,
    },
    energy: {
      id: 'energy',
      name: 'Quantum Plasma',
      bassTarget: 'Plasma core diameter & containment field',
      midTarget: 'Electric arc writhing & flux lines',
      trebleTarget: 'Micro-lightning branching',
      beatAction: 'Emp detonation pulse',
      colorShiftWeight: 0.9,
      displacementWeight: 1.4,
      energyDecay: 0.83,
    },
    fractal: {
      id: 'fractal',
      name: 'Hyper Fractal',
      bassTarget: 'Iteration depth & scale folding',
      midTarget: 'Rotation symmetry & morphing',
      trebleTarget: 'Boundary detail illumination',
      beatAction: 'Recursive dimension kick',
      colorShiftWeight: 1.0,
      displacementWeight: 1.0,
      energyDecay: 0.9,
    },
    portal: {
      id: 'portal',
      name: 'Dimensional Portal',
      bassTarget: 'Vortex aperture & gravity pull',
      midTarget: 'Event spiral rotation velocity',
      trebleTarget: 'Interdimensional sparks & rift particles',
      beatAction: 'Singularity expansion burst',
      colorShiftWeight: 0.95,
      displacementWeight: 1.35,
      energyDecay: 0.88,
    },
    'living-world': {
      id: 'living-world',
      name: 'Living Ecosystem',
      bassTarget: 'Flora root vibration & terrain breathing',
      midTarget: 'Creature/swarming activity rate',
      trebleTarget: 'Pollen grains & firefly flutter',
      beatAction: 'Ecosystem synchrony wave',
      colorShiftWeight: 0.65,
      displacementWeight: 0.85,
      energyDecay: 0.86,
    },
  };

  public getProfile(id: WallpaperAudioProfileType): WallpaperProfileConfig {
    return this.profiles[id] || this.profiles.cosmic;
  }

  public getAllProfiles(): WallpaperProfileConfig[] {
    return Object.values(this.profiles);
  }

  /**
   * Determine matching audio profile from active wallpaper ID
   */
  public matchProfileForWallpaper(wallpaperId: string): WallpaperAudioProfileType {
    const id = wallpaperId.toLowerCase();
    if (id.includes('galaxy') || id.includes('spiral')) return 'galaxy';
    if (id.includes('black-hole') || id.includes('singularity')) return 'black-hole';
    if (id.includes('nebula') || id.includes('dust')) return 'nebula';
    if (id.includes('ocean') || id.includes('sea') || id.includes('water')) return 'ocean';
    if (id.includes('forest') || id.includes('zen') || id.includes('nature')) return 'forest';
    if (id.includes('aurora') || id.includes('polar')) return 'aurora';
    if (id.includes('volcano') || id.includes('magma') || id.includes('fire')) return 'volcano';
    if (id.includes('city') || id.includes('cyber')) return 'cyber-city';
    if (id.includes('highway') || id.includes('neon') || id.includes('grid')) return 'neon-highway';
    if (id.includes('crystal') || id.includes('prism') || id.includes('gem')) return 'crystal';
    if (id.includes('liquid') || id.includes('glass') || id.includes('fluid')) return 'liquid-glass';
    if (id.includes('energy') || id.includes('plasma') || id.includes('quantum')) return 'energy';
    if (id.includes('fractal') || id.includes('mandelbrot')) return 'fractal';
    if (id.includes('portal') || id.includes('rift') || id.includes('wormhole')) return 'portal';
    if (id.includes('living') || id.includes('eco') || id.includes('biome')) return 'living-world';
    return 'cosmic';
  }

  /**
   * Map audio data into normalized visual and physical engine targets
   */
  public mapToTargets(
    analysis: AudioAnalysisData,
    config: AudioReactiveConfig,
    profileId: WallpaperAudioProfileType
  ): AudioReactiveVisualTargets {
    const profile = this.getProfile(profileId);
    const intensity = config.visualIntensity;
    const disp = profile.displacementWeight;

    // Bass targets
    const bassScaled = analysis.bass * intensity * disp;
    const particleScale = 1.0 + bassScaled * 0.45;
    const galaxyPulse = Math.min(1.0, bassScaled * 0.8);
    const waveAmplitude = 1.0 + bassScaled * 0.6;
    const bloomBoost = Math.min(1.0, bassScaled * 0.7);

    // Mid targets
    const midScaled = analysis.mid * intensity;
    const auroraFlowSpeed = 1.0 + midScaled * 0.8;

    // Treble targets
    const trebleScaled = analysis.treble * intensity;
    const sparksCountMultiplier = 1.0 + trebleScaled * 1.5;
    const crystalVibration = Math.min(1.0, trebleScaled * 0.9);

    // Beat transient targets
    const isBeat = analysis.isBeat && config.beatReaction > 0.1;
    const shockwaveTrigger = isBeat && analysis.beatConfidence > 0.3;

    // Camera Reaction: strictly bounded to avoid any dizziness or motion discomfort
    // Maximum safe clamp: +/- 0.15 position, +/- 0.05 zoom
    const camReaction = Math.min(1.0, config.cameraReaction);
    const camKick = isBeat ? analysis.beatConfidence * 0.08 * camReaction : 0;
    const camDriftX = Math.sin(analysis.timestamp * 1.5) * analysis.energy * 0.04 * camReaction;
    const camDriftY = Math.cos(analysis.timestamp * 1.2) * analysis.energy * 0.03 * camReaction;

    const cameraMicroDrift = {
      x: camDriftX,
      y: camDriftY,
      z: camKick,
      zoom: 1.0 + (isBeat ? analysis.beatConfidence * 0.03 * camReaction : 0),
    };

    // Physics Targets
    const physMult = config.physicsReaction;
    const gravityPulse = (isBeat ? 0.8 : -0.2 * analysis.energy) * physMult;
    const vortexIntensity = analysis.mid * 1.2 * physMult;
    const turbulenceBoost = analysis.energy * 1.5 * physMult;

    return {
      particleScale,
      galaxyPulse,
      waveAmplitude,
      bloomBoost,
      auroraFlowSpeed,
      sparksCountMultiplier,
      crystalVibration,
      shockwaveTrigger,
      cameraMicroDrift,
      gravityPulse,
      vortexIntensity,
      turbulenceBoost,
    };
  }
}
