import { DesignDNA, LayerType } from '../designer/types/designDNA';
import { BatteryImpactAssessment, WorkloadLevel } from './types';
import { QualityProfile } from '../types/engine';

export class BatteryImpactEstimator {
  /**
   * Deterministically estimates battery impact and performance load of a wallpaper DNA
   */
  public static estimateImpact(dna: DesignDNA): BatteryImpactAssessment {
    // 1. Particle factor (0 - 100)
    const particleDensity = dna.physics?.particleDensity ?? 1.0;
    const particleScore = Math.min(100, Math.round(particleDensity * 45));

    // 2. Physics factor
    const vortex = dna.physics?.vortexStrength ?? 0;
    const turbulence = dna.physics?.turbulence ?? 0;
    const shockwave = dna.physics?.shockwaveActive ? 20 : 0;
    const physicsScore = Math.min(100, Math.round((vortex * 15 + turbulence * 12 + shockwave) * 1.2));

    // 3. Post-Processing & Shader factor
    const bloom = dna.effects?.bloom ?? 1.0;
    const fog = dna.effects?.fog ?? 0.5;
    const wireframe = dna.material?.wireframe ? 15 : 0;
    const transmission = dna.material?.transmission ?? 0;
    const postProcScore = Math.min(100, Math.round(bloom * 35 + fog * 15 + transmission * 25 + wireframe));

    // 4. Layers & Animation factor
    const activeLayers = Object.values(dna.layers || {}).filter(l => l.enabled).length;
    const animSpeed = dna.effects?.animationSpeed ?? 1.0;
    const animScore = Math.min(100, Math.round(activeLayers * 7 + animSpeed * 15));

    // 5. Ecosystem factor
    const ecoActive = dna.effects?.ecosystem && dna.effects.ecosystem !== 'dormant';
    const ecoScore = ecoActive ? 40 : 10;

    // 6. Audio factor
    const audioScore = dna.audio?.enabled ? 35 : 5;

    // 7. Sensors factor
    const sensorMode = dna.motion?.mode || 'Balanced';
    const sensorScore = sensorMode === 'Dynamic' ? 40 : sensorMode === 'Balanced' ? 25 : sensorMode === 'Subtle' ? 15 : 0;

    // Composite total score (0 - 100)
    const compositeScore = Math.min(
      100,
      Math.round(
        particleScore * 0.22 +
        physicsScore * 0.18 +
        postProcScore * 0.22 +
        animScore * 0.15 +
        ecoScore * 0.08 +
        audioScore * 0.08 +
        sensorScore * 0.07
      )
    );

    // Classify
    let impact: WorkloadLevel;
    let performanceLoad: WorkloadLevel;
    let recommendedQuality: QualityProfile;

    if (compositeScore < 35) {
      impact = 'LOW';
      performanceLoad = 'LOW';
      recommendedQuality = 'HIGH';
    } else if (compositeScore < 68) {
      impact = 'MEDIUM';
      performanceLoad = 'MEDIUM';
      recommendedQuality = 'BALANCED' as any; // maps to MEDIUM / BALANCED
      if ((recommendedQuality as any) === 'BALANCED') recommendedQuality = 'MEDIUM';
    } else {
      impact = 'HIGH';
      performanceLoad = 'HIGH';
      recommendedQuality = 'LOW';
    }

    const suggestions: string[] = [];
    if (particleScore > 50) suggestions.push('Reduce particle density in Physics panel');
    if (bloom > 1.2) suggestions.push('Tone down Bloom intensity to spare GPU fill-rate');
    if (activeLayers > 7) suggestions.push('Disable unused background depth layers');
    if (dna.audio?.enabled) suggestions.push('Disable real-time FFT audio analysis when not listening');

    return {
      impact,
      performanceLoad,
      recommendedQuality,
      score: compositeScore,
      factors: {
        particles: particleScore,
        physics: physicsScore,
        postProcessing: postProcScore,
        animationComplexity: animScore,
        ecosystem: ecoScore,
        audio: audioScore,
        sensors: sensorScore,
        resolution: 100,
        fpsTarget: 60
      },
      suggestions
    };
  }

  /**
   * Automatically optimizes a DesignDNA for battery efficiency while preserving core artistic identity
   */
  public static optimizeForBattery(dna: DesignDNA): DesignDNA {
    // Clone
    const optimized: DesignDNA = JSON.parse(JSON.stringify(dna));

    // 1. Moderate particle density
    if (optimized.physics) {
      optimized.physics.particleDensity = Math.min(0.65, (optimized.physics.particleDensity || 1.0) * 0.7);
      optimized.physics.turbulence = Math.min(0.6, (optimized.physics.turbulence || 0.8) * 0.7);
      optimized.physics.vortexStrength = Math.min(1.0, (optimized.physics.vortexStrength || 1.0) * 0.8);
      optimized.physics.particleSpeed = Math.min(1.0, optimized.physics.particleSpeed || 1.0);
    }

    // 2. Reduce heavy post-processing effects
    if (optimized.effects) {
      optimized.effects.bloom = Math.min(0.6, (optimized.effects.bloom || 1.0) * 0.5);
      optimized.effects.animationSpeed = Math.min(1.0, optimized.effects.animationSpeed || 1.0);
      if (optimized.effects.weather === 'meteor-shower') {
        optimized.effects.weather = 'clear';
      }
    }

    // 3. Moderate material transmission / heavy refraction
    if (optimized.material) {
      optimized.material.transmission = Math.min(0.3, optimized.material.transmission || 0);
      optimized.material.wireframe = false;
      optimized.material.emissiveIntensity = Math.min(1.2, optimized.material.emissiveIntensity || 1.0);
    }

    // 4. Moderate non-essential layers
    if (optimized.layers) {
      const nonEssential: LayerType[] = ['Foreground', 'Atmosphere'];
      for (const layer of nonEssential) {
        if (optimized.layers[layer]) {
          optimized.layers[layer].intensity *= 0.6;
          optimized.layers[layer].speed *= 0.7;
        }
      }
    }

    // 5. Moderate sensors and audio
    if (optimized.motion) {
      if (optimized.motion.mode === 'Dynamic') {
        optimized.motion.mode = 'Balanced';
      }
    }

    // Recompute estimated complexity
    const assessment = BatteryImpactEstimator.estimateImpact(optimized);
    optimized.estimatedComplexity = assessment.score;

    return optimized;
  }

  /**
   * Applies AMOLED mode: Deep black void, controlled emissive glow, zero waste on OLED pixels
   */
  public static applyAmoledMode(dna: DesignDNA): DesignDNA {
    const amoled: DesignDNA = JSON.parse(JSON.stringify(dna));

    if (amoled.colors) {
      amoled.colors.background = '#000000';
      amoled.colors.preset = 'AMOLED';
      // Enhance sharp contrast on deep black
      amoled.colors.secondary = '#05070f';
    }

    if (amoled.effects) {
      // Prevent full-screen bright white washouts
      amoled.effects.fog = Math.min(0.25, amoled.effects.fog || 0.4);
      amoled.effects.bloom = Math.min(0.7, amoled.effects.bloom || 1.0);
    }

    if (amoled.layers?.Background) {
      amoled.layers.Background.opacity = 0.95;
    }

    const assessment = BatteryImpactEstimator.estimateImpact(amoled);
    amoled.estimatedComplexity = assessment.score;

    return amoled;
  }
}
