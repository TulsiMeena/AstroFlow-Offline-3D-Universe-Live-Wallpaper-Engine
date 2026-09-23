import * as THREE from 'three';
import { WeatherDNA } from '../types/environmentDNA';
import { QualityConfig } from '../../types/engine';
import { PRNG } from '../seed/PRNG';

export class WeatherEngine {
  private group: THREE.Group;
  private weatherDNA: WeatherDNA;
  private quality: QualityConfig;
  private prng: PRNG;

  // Particle systems
  private precipitationPoints: THREE.Points | null = null;
  private splashPoints: THREE.Points | null = null;
  private fogPoints: THREE.Points | null = null;

  // Lightning state
  private lightningTimer: number = 0;
  private isLightningActive: boolean = false;
  private lightningIntensity: number = 0;
  private flashLight: THREE.PointLight | null = null;

  constructor(weatherDNA: WeatherDNA, quality: QualityConfig, prng: PRNG) {
    this.group = new THREE.Group();
    this.group.name = 'WeatherEngine';
    this.weatherDNA = weatherDNA;
    this.quality = quality;
    this.prng = prng;

    this.init();
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public getLightningIntensity(): number {
    return this.lightningIntensity;
  }

  public setWeather(dna: WeatherDNA) {
    this.weatherDNA = dna;
    this.rebuild();
  }

  private init() {
    // 1. Point light for thunder / lightning flashes
    this.flashLight = new THREE.PointLight(0xffffff, 0, 40);
    this.flashLight.position.set(0, 15, 0);
    this.group.add(this.flashLight);

    this.buildPrecipitation();
    this.buildAtmosphericFog();
  }

  private rebuild() {
    if (this.precipitationPoints) {
      this.group.remove(this.precipitationPoints);
      this.precipitationPoints.geometry.dispose();
      this.precipitationPoints = null;
    }
    if (this.splashPoints) {
      this.group.remove(this.splashPoints);
      this.splashPoints.geometry.dispose();
      this.splashPoints = null;
    }
    if (this.fogPoints) {
      this.group.remove(this.fogPoints);
      this.fogPoints.geometry.dispose();
      this.fogPoints = null;
    }

    this.buildPrecipitation();
    this.buildAtmosphericFog();
  }

  private buildPrecipitation() {
    const type = this.weatherDNA.type;
    if (type === 'clear') return;

    let count = Math.floor(this.weatherDNA.particleCount);
    if (this.quality.profile === 'LOW') count = Math.min(count, 1200);
    else if (this.quality.profile === 'MEDIUM') count = Math.min(count, 3500);
    else count = Math.min(count, 8000);

    const pos = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = this.prng.range(-15, 15);
      pos[i * 3 + 1] = this.prng.range(0, 16);
      pos[i * 3 + 2] = this.prng.range(-15, 15);

      if (type === 'rain' || type === 'heavy-rain' || type === 'storm') {
        velocities[i * 3] = this.weatherDNA.windDirection[0] * this.weatherDNA.windSpeed * 1.5;
        velocities[i * 3 + 1] = type === 'heavy-rain' ? -18.0 : -14.0;
        velocities[i * 3 + 2] = this.weatherDNA.windDirection[2] * this.weatherDNA.windSpeed * 1.5;
      } else if (type === 'snow') {
        velocities[i * 3] = this.weatherDNA.windDirection[0] * this.weatherDNA.windSpeed * 0.4;
        velocities[i * 3 + 1] = -1.8;
        velocities[i * 3 + 2] = this.weatherDNA.windDirection[2] * this.weatherDNA.windSpeed * 0.4;
      } else if (type === 'embers') {
        velocities[i * 3] = (this.prng.next() - 0.5) * 0.5;
        velocities[i * 3 + 1] = 1.2; // rising
        velocities[i * 3 + 2] = (this.prng.next() - 0.5) * 0.5;
      } else {
        // dust / spores / cyber-dust
        velocities[i * 3] = (this.prng.next() - 0.5) * 0.4;
        velocities[i * 3 + 1] = -0.3;
        velocities[i * 3 + 2] = (this.prng.next() - 0.5) * 0.4;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    let col = 0xa0c4ff;
    let size = 0.08;
    let opacity = 0.75;

    if (type === 'snow') {
      col = 0xffffff;
      size = 0.12;
      opacity = 0.9;
    } else if (type === 'embers') {
      col = 0xff5500;
      size = 0.1;
      opacity = 0.9;
    } else if (type === 'cyber-dust') {
      col = 0x00f0ff;
      size = 0.07;
      opacity = 0.8;
    }

    const mat = new THREE.PointsMaterial({
      color: col,
      size,
      transparent: true,
      opacity,
      blending: type === 'embers' || type === 'cyber-dust' ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false
    });

    this.precipitationPoints = new THREE.Points(geo, mat);
    this.group.add(this.precipitationPoints);

    // Build splash particles for rain/storm
    if (type === 'rain' || type === 'heavy-rain' || type === 'storm') {
      this.buildSplashes(count / 4);
    }
  }

  private buildSplashes(count: number) {
    const splashCount = Math.floor(count);
    const pos = new Float32Array(splashCount * 3);
    for (let i = 0; i < splashCount; i++) {
      pos[i * 3] = this.prng.range(-15, 15);
      pos[i * 3 + 1] = 0.05;
      pos[i * 3 + 2] = this.prng.range(-15, 15);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x99ccff,
      size: 0.05,
      transparent: true,
      opacity: 0.45
    });

    this.splashPoints = new THREE.Points(geo, mat);
    this.group.add(this.splashPoints);
  }

  private buildAtmosphericFog() {
    if (this.weatherDNA.type !== 'fog' && this.weatherDNA.cloudDensity < 0.2) return;

    const count = this.quality.profile === 'LOW' ? 40 : this.quality.profile === 'MEDIUM' ? 90 : 150;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = this.prng.range(-16, 16);
      pos[i * 3 + 1] = this.prng.range(0.5, 4.0);
      pos[i * 3 + 2] = this.prng.range(-16, 16);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xd4e4f7,
      size: 1.8,
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    });

    this.fogPoints = new THREE.Points(geo, mat);
    this.group.add(this.fogPoints);
  }

  public update(time: number, delta: number) {
    // 1. Update precipitation particles
    if (this.precipitationPoints) {
      const pos = this.precipitationPoints.geometry.attributes.position as THREE.BufferAttribute;
      const vel = this.precipitationPoints.geometry.attributes.velocity as THREE.BufferAttribute;
      const type = this.weatherDNA.type;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i) + vel.getX(i) * delta;
        let y = pos.getY(i) + vel.getY(i) * delta;
        let z = pos.getZ(i) + vel.getZ(i) * delta;

        // Snow flutter
        if (type === 'snow') {
          x += Math.sin(time * 2 + i) * 0.015;
          z += Math.cos(time * 2 + i) * 0.015;
        }

        if (type === 'embers') {
          if (y > 10.0) {
            y = 0.1;
            x = this.prng.range(-10, 10);
            z = this.prng.range(-10, 10);
          }
        } else {
          // Falling precipitation reset
          if (y < 0.05) {
            y = 15.5;
            x = this.prng.range(-15, 15);
            z = this.prng.range(-15, 15);
          }
        }

        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }

    // 2. Splash ripple animation
    if (this.splashPoints) {
      const pos = this.splashPoints.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        if (Math.random() < 0.08) {
          pos.setX(i, (Math.random() - 0.5) * 30);
          pos.setZ(i, (Math.random() - 0.5) * 30);
        }
      }
      pos.needsUpdate = true;
    }

    // 3. Lightning / Thunder storms
    if (this.weatherDNA.type === 'storm' || this.weatherDNA.lightningFrequency > 0) {
      this.lightningTimer += delta;
      if (!this.isLightningActive && this.lightningTimer > (1.0 / Math.max(0.1, this.weatherDNA.lightningFrequency)) * 4.0) {
        if (Math.random() < 0.3) {
          this.isLightningActive = true;
          this.lightningIntensity = 3.5;
          this.lightningTimer = 0;
        }
      }

      if (this.isLightningActive) {
        this.lightningIntensity *= Math.pow(0.1, delta * 8.0);
        if (this.lightningIntensity < 0.05) {
          this.lightningIntensity = 0;
          this.isLightningActive = false;
        }
      }
    } else {
      this.lightningIntensity = 0;
    }

    if (this.flashLight) {
      this.flashLight.intensity = this.lightningIntensity;
    }
  }

  public dispose() {
    if (this.precipitationPoints) {
      this.precipitationPoints.geometry.dispose();
    }
    if (this.splashPoints) {
      this.splashPoints.geometry.dispose();
    }
    if (this.fogPoints) {
      this.fogPoints.geometry.dispose();
    }
    this.group.clear();
  }
}
