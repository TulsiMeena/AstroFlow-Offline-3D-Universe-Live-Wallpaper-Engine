import * as THREE from 'three';
import { TimeOfDay, AtmosphereDNA } from '../types/environmentDNA';

export interface TimeColors {
  skyTop: THREE.Color;
  skyBottom: THREE.Color;
  fogColor: THREE.Color;
  sunColor: THREE.Color;
  sunIntensity: number;
  ambientColor: THREE.Color;
  ambientIntensity: number;
}

export class TimeOfDayEngine {
  private timeOfDay: TimeOfDay;
  private timeProgress: number = 0; // 0.0 to 1.0 (0=dawn, 0.25=day, 0.5=sunset, 0.75=twilight, 1.0=night)
  private cycleSpeed: number = 0;

  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private auroraGroup: THREE.Group | null = null;
  private starsPoints: THREE.Points | null = null;

  constructor(initialTime: TimeOfDay = 'day', cycleSpeed: number = 0) {
    this.timeOfDay = initialTime;
    this.cycleSpeed = cycleSpeed;
    this.setTimeOfDay(initialTime);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.sunLight.castShadow = true;
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  }

  public getSunLight(): THREE.DirectionalLight {
    return this.sunLight;
  }

  public getAmbientLight(): THREE.AmbientLight {
    return this.ambientLight;
  }

  public getTimeOfDay(): TimeOfDay {
    return this.timeOfDay;
  }

  public setTimeOfDay(time: TimeOfDay) {
    this.timeOfDay = time;
    switch (time) {
      case 'dawn':
        this.timeProgress = 0.0;
        break;
      case 'day':
        this.timeProgress = 0.25;
        break;
      case 'sunset':
        this.timeProgress = 0.5;
        break;
      case 'twilight':
        this.timeProgress = 0.7;
        break;
      case 'night':
        this.timeProgress = 0.85;
        break;
    }
  }

  public setCycleSpeed(speed: number) {
    this.cycleSpeed = speed;
  }

  public buildCelestial(scene: THREE.Scene, atmosphereDNA: AtmosphereDNA) {
    // 1. Stars for night / twilight / space
    if (atmosphereDNA.hasStars) {
      const starCount = atmosphereDNA.starDensity || 2000;
      const pos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        // Spherical distribution
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 50.0;
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta)) + 2.0; // above horizon
        pos[i * 3 + 2] = r * Math.cos(phi);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.15,
        transparent: true,
        opacity: this.timeOfDay === 'night' || this.timeOfDay === 'twilight' ? 0.9 : 0.1
      });
      this.starsPoints = new THREE.Points(geo, mat);
      scene.add(this.starsPoints);
    }

    // 2. Procedural Aurora ribbons for Aurora worlds
    if (atmosphereDNA.hasAurora) {
      this.buildAuroraBorealis(scene, atmosphereDNA);
    }
  }

  private buildAuroraBorealis(scene: THREE.Scene, atmosphereDNA: AtmosphereDNA) {
    this.auroraGroup = new THREE.Group();
    this.auroraGroup.name = 'AuroraBorealis';

    const ribbonCount = 4;
    const colA = new THREE.Color(atmosphereDNA.auroraColorA || '#00ff88');
    const colB = new THREE.Color(atmosphereDNA.auroraColorB || '#aa00ff');

    for (let r = 0; r < ribbonCount; r++) {
      const geo = new THREE.PlaneGeometry(36, 12, 32, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: r % 2 === 0 ? colA : colB,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, 16 + r * 1.5, -15 + r * 4.0);
      mesh.rotation.x = Math.PI / 2.6;
      mesh.userData = { ribbonIndex: r };
      this.auroraGroup.add(mesh);
    }

    scene.add(this.auroraGroup);
  }

  public update(delta: number, scene: THREE.Scene, atmosphereDNA: AtmosphereDNA, weatherLightning: number = 0) {
    if (this.cycleSpeed > 0) {
      this.timeProgress = (this.timeProgress + delta * this.cycleSpeed * 0.05) % 1.0;
    }

    // Sun orbital position
    const angle = this.timeProgress * Math.PI * 2 - Math.PI / 2;
    const sunX = Math.cos(angle) * 20;
    const sunY = Math.sin(angle) * 20;
    const sunZ = Math.sin(angle * 0.5) * 10;
    this.sunLight.position.set(sunX, Math.max(sunY, -2), sunZ);

    const colors = this.getCalculatedColors(atmosphereDNA);

    // Apply lighting
    this.sunLight.color.copy(colors.sunColor);
    this.sunLight.intensity = (colors.sunIntensity * atmosphereDNA.sunIntensity) + weatherLightning * 1.5;

    this.ambientLight.color.copy(colors.ambientColor);
    this.ambientLight.intensity = (colors.ambientIntensity * atmosphereDNA.ambientIntensity) + weatherLightning * 0.8;

    // Adjust scene background & fog
    scene.background = colors.skyTop;
    if (scene.fog) {
      scene.fog.color.copy(colors.fogColor);
    }

    // Animate aurora ribbons
    if (this.auroraGroup) {
      const time = performance.now() * 0.001;
      for (const child of this.auroraGroup.children) {
        if (child instanceof THREE.Mesh) {
          const pos = (child.geometry as THREE.BufferGeometry).attributes.position as THREE.BufferAttribute;
          const idx = child.userData.ribbonIndex || 0;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const wave = Math.sin(x * 0.2 + time * 1.2 + idx) * Math.cos(time * 0.6 + idx) * 2.2;
            pos.setZ(i, wave);
          }
          pos.needsUpdate = true;
        }
      }
    }

    // Adjust star visibility based on sun altitude
    if (this.starsPoints) {
      const starMat = this.starsPoints.material as THREE.PointsMaterial;
      const isDark = sunY < 2.0;
      starMat.opacity = isDark ? 0.95 : Math.max(0.05, 1.0 - (sunY / 10.0));
    }
  }

  public getCalculatedColors(atmosphere: AtmosphereDNA): TimeColors {
    // Time interpolation values
    const cDawnSun = new THREE.Color(0xff7733);
    const cDaySun = new THREE.Color(0xffffff);
    const cSunsetSun = new THREE.Color(0xff3300);
    const cNightSun = new THREE.Color(0x335599); // moon light

    const cDawnSky = new THREE.Color(0x2a1638);
    const cDaySky = new THREE.Color(atmosphere.skyColorTop || 0x1e3a5f);
    const cSunsetSky = new THREE.Color(0x4a1525);
    const cNightSky = new THREE.Color(0x04060e);

    const cFogDay = new THREE.Color(atmosphere.fogColor || 0x223344);
    const cFogNight = new THREE.Color(0x060913);

    const sunCol = new THREE.Color();
    const skyCol = new THREE.Color();
    const fogCol = new THREE.Color();
    let sunIntensity = 1.0;
    let ambIntensity = 0.5;

    // Evaluate depending on current progress
    const p = this.timeProgress;
    if (p < 0.2) {
      // Dawn
      const t = p / 0.2;
      sunCol.copy(cDawnSun).lerp(cDaySun, t);
      skyCol.copy(cDawnSky).lerp(cDaySky, t);
      fogCol.copy(cFogNight).lerp(cFogDay, t);
      sunIntensity = 0.7 + t * 0.5;
      ambIntensity = 0.3 + t * 0.3;
    } else if (p < 0.5) {
      // Day
      sunCol.copy(cDaySun);
      skyCol.copy(cDaySky);
      fogCol.copy(cFogDay);
      sunIntensity = 1.3;
      ambIntensity = 0.6;
    } else if (p < 0.7) {
      // Sunset
      const t = (p - 0.5) / 0.2;
      sunCol.copy(cDaySun).lerp(cSunsetSun, t);
      skyCol.copy(cDaySky).lerp(cSunsetSky, t);
      fogCol.copy(cFogDay).lerp(cFogNight, t);
      sunIntensity = 1.2 - t * 0.5;
      ambIntensity = 0.6 - t * 0.2;
    } else {
      // Twilight / Night
      const t = (p - 0.7) / 0.3;
      sunCol.copy(cSunsetSun).lerp(cNightSun, t);
      skyCol.copy(cSunsetSky).lerp(cNightSky, t);
      fogCol.copy(cFogNight);
      sunIntensity = 0.35;
      ambIntensity = 0.25;
    }

    return {
      skyTop: skyCol,
      skyBottom: skyCol.clone().multiplyScalar(0.7),
      fogColor: fogCol,
      sunColor: sunCol,
      sunIntensity,
      ambientColor: skyCol.clone().lerp(new THREE.Color(0xffffff), 0.3),
      ambientIntensity: ambIntensity
    };
  }

  public dispose(scene: THREE.Scene) {
    if (this.starsPoints) {
      scene.remove(this.starsPoints);
      this.starsPoints.geometry.dispose();
      this.starsPoints = null;
    }
    if (this.auroraGroup) {
      scene.remove(this.auroraGroup);
      this.auroraGroup = null;
    }
  }
}
