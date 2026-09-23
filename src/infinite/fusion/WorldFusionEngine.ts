import * as THREE from 'three';
import { FusionDNA } from '../types/infiniteTypes';
import { TouchPointerState, MotionData } from '../../types/engine';

export class WorldFusionEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private dna: FusionDNA;

  // Visual subsystems
  private skyDome: THREE.Mesh | null = null;
  private skyMaterial: THREE.ShaderMaterial | null = null;
  private celestialGroup: THREE.Group = new THREE.Group();
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private weatherParticles: THREE.Points | null = null;
  private weatherPositions: Float32Array | null = null;
  private weatherVelocities: Float32Array | null = null;
  private weatherCount: number = 0;

  // Dynamic state
  private timeAccumulator: number = 0;
  private touchRipple: number = 0;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, dna: FusionDNA) {
    this.scene = scene;
    this.camera = camera;
    this.dna = dna;

    // Base Lighting
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(dna.primaryColor), 0.8);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(new THREE.Color(dna.secondaryColor), 1.5);
    this.directionalLight.position.set(50, 100, 50);
    this.scene.add(this.directionalLight);

    this.scene.add(this.celestialGroup);

    this.buildSkyAndAtmosphere();
    this.buildWeatherParticles();
    this.applyAtmosphereFog();
  }

  public setDNA(dna: FusionDNA): void {
    this.dna = dna;
    this.ambientLight.color.set(dna.primaryColor);
    this.directionalLight.color.set(dna.secondaryColor);
    this.applyAtmosphereFog();
    this.rebuildSky();
    this.buildWeatherParticles();
  }

  private applyAtmosphereFog(): void {
    const fogColor = new THREE.Color(this.dna.primaryColor).lerp(
      new THREE.Color(this.dna.secondaryColor),
      0.3
    );
    this.scene.fog = new THREE.FogExp2(fogColor, this.dna.atmosphereFogDensity);
  }

  /**
   * Procedural Sky Dome Shader blending systems
   */
  private buildSkyAndAtmosphere(): void {
    const skyGeo = new THREE.SphereGeometry(600, 24, 24);

    const isSpaceOrGalaxy =
      this.dna.primarySystem === 'galaxy' ||
      this.dna.secondarySystem === 'galaxy' ||
      this.dna.primarySystem === 'space' ||
      this.dna.secondarySystem === 'space' ||
      this.dna.primarySystem === 'black-hole' ||
      this.dna.secondarySystem === 'black-hole';

    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform vec3 accentColor;
      uniform float time;
      uniform float isSpace;
      varying vec3 vWorldPosition;

      float hash(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
      }

      void main() {
        vec3 dir = normalize(vWorldPosition);
        float h = dir.y * 0.5 + 0.5;

        // Base gradient
        vec3 col = mix(bottomColor, topColor, max(pow(h, 0.8), 0.0));

        // Procedural aurora / nebula energy waves
        float wave1 = sin(dir.x * 6.0 + time * 0.4) * cos(dir.z * 6.0 + time * 0.3);
        float wave2 = sin(dir.y * 10.0 - time * 0.5);
        float auroraMask = smoothstep(0.4, 0.9, h) * smoothstep(0.2, 0.8, wave1 * wave2);
        col += accentColor * auroraMask * 0.45;

        // Subtle stars if cosmic
        if (isSpace > 0.5) {
          float star = step(0.996, hash(floor(dir * 180.0)));
          col += vec3(1.0, 1.0, 1.0) * star * 0.8;
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    this.skyMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        topColor: { value: new THREE.Color(this.dna.primaryColor) },
        bottomColor: { value: new THREE.Color(this.dna.secondaryColor) },
        accentColor: { value: new THREE.Color(this.dna.accentColor) },
        time: { value: 0.0 },
        isSpace: { value: isSpaceOrGalaxy ? 1.0 : 0.0 }
      },
      side: THREE.BackSide,
      depthWrite: false
    });

    this.skyDome = new THREE.Mesh(skyGeo, this.skyMaterial);
    this.scene.add(this.skyDome);

    // Build Celestial Accent (e.g. Black Hole accretion disk, Celestial Moon, or Ringed Planet)
    this.buildCelestialAccents();
  }

  private rebuildSky(): void {
    if (this.skyDome) {
      this.scene.remove(this.skyDome);
      this.skyDome.geometry.dispose();
      if (this.skyMaterial) this.skyMaterial.dispose();
    }
    this.buildSkyAndAtmosphere();
  }

  private buildCelestialAccents(): void {
    this.celestialGroup.clear();

    const isBlackHole =
      this.dna.primarySystem === 'black-hole' || this.dna.secondarySystem === 'black-hole';
    const isGalaxy = this.dna.primarySystem === 'galaxy' || this.dna.secondarySystem === 'galaxy';

    if (isBlackHole) {
      // Procedural Singularity Sphere + Accretion Disk
      const holeGeo = new THREE.SphereGeometry(18, 20, 20);
      const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const hole = new THREE.Mesh(holeGeo, holeMat);
      hole.position.set(0, 140, -300);

      const diskGeo = new THREE.RingGeometry(22, 50, 32);
      const diskMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.dna.accentColor),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      const disk = new THREE.Mesh(diskGeo, diskMat);
      disk.rotation.x = Math.PI / 3;
      hole.add(disk);

      this.celestialGroup.add(hole);
    } else if (isGalaxy) {
      // Spiral Galaxy Particle Disk in the sky
      const count = 400;
      const pos = new Float32Array(count * 3);
      const cols = new Float32Array(count * 3);
      const c1 = new THREE.Color(this.dna.accentColor);
      const c2 = new THREE.Color(this.dna.secondaryColor);

      for (let i = 0; i < count; i++) {
        const angle = i * 0.15;
        const dist = 10 + (i / count) * 80;
        const x = Math.cos(angle) * dist + (Math.random() - 0.5) * 8;
        const y = (Math.random() - 0.5) * 6;
        const z = Math.sin(angle) * dist + (Math.random() - 0.5) * 8;

        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;

        const c = Math.random() > 0.5 ? c1 : c2;
        cols[i * 3] = c.r;
        cols[i * 3 + 1] = c.g;
        cols[i * 3 + 2] = c.b;
      }

      const gGeo = new THREE.BufferGeometry();
      gGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      gGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      const gMat = new THREE.PointsMaterial({
        size: 1.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });
      const galaxyPoints = new THREE.Points(gGeo, gMat);
      galaxyPoints.position.set(-80, 160, -320);
      this.celestialGroup.add(galaxyPoints);
    } else {
      // Radiant Celestial Sun/Moon Orb
      const orbGeo = new THREE.SphereGeometry(14, 16, 16);
      const orbMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.dna.accentColor)
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(60, 130, -280);

      const glowGeo = new THREE.SphereGeometry(22, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.dna.secondaryColor),
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      orb.add(glow);

      this.celestialGroup.add(orb);
    }
  }

  /**
   * Procedural Weather Particles based on Fused System
   */
  private buildWeatherParticles(): void {
    if (this.weatherParticles) {
      this.scene.remove(this.weatherParticles);
      this.weatherParticles.geometry.dispose();
      if (Array.isArray(this.weatherParticles.material)) {
        this.weatherParticles.material.forEach((m) => m.dispose());
      } else {
        this.weatherParticles.material.dispose();
      }
      this.weatherParticles = null;
    }

    const weatherType = this.dna.weatherType;
    if (weatherType === 'clear') return;

    this.weatherCount = weatherType === 'heavy-rain' || weatherType === 'storm' ? 800 : 400;
    this.weatherPositions = new Float32Array(this.weatherCount * 3);
    this.weatherVelocities = new Float32Array(this.weatherCount * 3);

    const bounds = 80;
    for (let i = 0; i < this.weatherCount; i++) {
      this.weatherPositions[i * 3] = (Math.random() - 0.5) * bounds;
      this.weatherPositions[i * 3 + 1] = Math.random() * 45;
      this.weatherPositions[i * 3 + 2] = (Math.random() - 0.5) * bounds;

      if (weatherType === 'snow') {
        this.weatherVelocities[i * 3] = (Math.random() - 0.5) * 0.4;
        this.weatherVelocities[i * 3 + 1] = -(0.5 + Math.random() * 0.8);
        this.weatherVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      } else if (weatherType === 'embers') {
        this.weatherVelocities[i * 3] = (Math.random() - 0.5) * 0.6;
        this.weatherVelocities[i * 3 + 1] = 0.6 + Math.random() * 1.2;
        this.weatherVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
      } else {
        // Rain / Storm / Energy
        this.weatherVelocities[i * 3] = (Math.random() - 0.5) * 0.2;
        this.weatherVelocities[i * 3 + 1] = -(4.0 + Math.random() * 5.0);
        this.weatherVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.weatherPositions, 3));

    const mat = new THREE.PointsMaterial({
      size: weatherType === 'embers' ? 0.9 : weatherType === 'snow' ? 0.8 : 0.4,
      color: new THREE.Color(
        weatherType === 'embers'
          ? '#FFAA00'
          : weatherType === 'aurora'
          ? '#00FFA3'
          : this.dna.accentColor
      ),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.weatherParticles = new THREE.Points(geo, mat);
    this.scene.add(this.weatherParticles);
  }

  /**
   * Main frame update
   */
  public update(time: number, delta: number, input?: TouchPointerState, motion?: MotionData): void {
    this.timeAccumulator = time;

    // Update sky shader time uniform
    if (this.skyMaterial) {
      this.skyMaterial.uniforms.time.value = time;
    }

    // Keep sky centered around camera
    if (this.skyDome) {
      this.skyDome.position.copy(this.camera.position);
    }
    this.celestialGroup.position.copy(this.camera.position);
    this.celestialGroup.rotation.y = time * 0.02;

    // Parallax sensor motion tilt
    if (motion && motion.isAvailable) {
      this.celestialGroup.position.x += motion.tiltX * 8.0;
      this.celestialGroup.position.y += motion.tiltY * 8.0;
    }

    // Touch interaction ripple
    if (input && input.isDown) {
      this.touchRipple = Math.min(this.touchRipple + delta * 2.0, 1.0);
    } else {
      this.touchRipple = Math.max(this.touchRipple - delta * 1.5, 0.0);
    }

    // Update Weather Particles
    if (this.weatherParticles && this.weatherPositions && this.weatherVelocities) {
      const posAttr = this.weatherParticles.geometry.attributes.position;
      const bounds = 80;
      const camPos = this.camera.position;

      for (let i = 0; i < this.weatherCount; i++) {
        let px = this.weatherPositions[i * 3] + this.weatherVelocities[i * 3];
        let py = this.weatherPositions[i * 3 + 1] + this.weatherVelocities[i * 3 + 1];
        let pz = this.weatherPositions[i * 3 + 2] + this.weatherVelocities[i * 3 + 2];

        // Wrap around camera bounds
        if (py < -5) py = 40;
        if (py > 45) py = 0;
        if (px < -bounds / 2) px = bounds / 2;
        if (px > bounds / 2) px = -bounds / 2;
        if (pz < -bounds / 2) pz = bounds / 2;
        if (pz > bounds / 2) pz = -bounds / 2;

        this.weatherPositions[i * 3] = px;
        this.weatherPositions[i * 3 + 1] = py;
        this.weatherPositions[i * 3 + 2] = pz;

        posAttr.setXYZ(i, camPos.x + px, camPos.y + py, camPos.z + pz);
      }
      posAttr.needsUpdate = true;
    }
  }

  public dispose(): void {
    if (this.skyDome) {
      this.scene.remove(this.skyDome);
      this.skyDome.geometry.dispose();
      if (this.skyMaterial) this.skyMaterial.dispose();
    }
    this.scene.remove(this.ambientLight);
    this.scene.remove(this.directionalLight);
    this.scene.remove(this.celestialGroup);
    if (this.weatherParticles) {
      this.scene.remove(this.weatherParticles);
      this.weatherParticles.geometry.dispose();
      if (Array.isArray(this.weatherParticles.material)) {
        this.weatherParticles.material.forEach((m) => m.dispose());
      } else {
        this.weatherParticles.material.dispose();
      }
    }
  }
}
