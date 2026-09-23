import * as THREE from 'three';
import { WorldDNA, GalaxyMorphology } from '../types/worldDNA';
import { SeededRNG } from '../seed/SeededRNG';

export interface GalaxyMeshOptions {
  particleCount?: number;
  radius?: number;
  tiltX?: number;
  tiltZ?: number;
  position?: THREE.Vector3;
}

export class GalaxyGenerator {
  /**
   * Generates a complete procedural galaxy using BufferGeometry and custom Points.
   */
  public static createGalaxy(
    dna: WorldDNA,
    rng: SeededRNG,
    options: GalaxyMeshOptions = {}
  ): { group: THREE.Group; update: (time: number, delta: number) => void; dispose: () => void } {
    const group = new THREE.Group();
    group.name = `Galaxy_${dna.seed}`;

    if (options.position) {
      group.position.copy(options.position);
    }
    group.rotation.x = options.tiltX ?? rng.range(-0.6, 0.6);
    group.rotation.z = options.tiltZ ?? rng.range(-0.4, 0.4);

    const radius = options.radius ?? dna.universeSize * 0.35;
    const baseParticles = options.particleCount ?? Math.floor(6000 * dna.starDensity);
    const particleCount = Math.max(1500, Math.min(18000, baseParticles));

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const coreColor = new THREE.Color(dna.nebulaColor.accent || '#FFF2A7');
    const innerColor = new THREE.Color(dna.nebulaColor.primary || '#00F0FF');
    const outerColor = new THREE.Color(dna.nebulaColor.secondary || '#7000FF');
    const tempColor = new THREE.Color();

    const morphology = dna.galaxyType;
    const arms = morphology === 'spiral' ? rng.int(2, 5) : morphology === 'barred-spiral' ? 2 : 0;
    const armSpread = rng.range(0.3, 0.6);
    const barLength = morphology === 'barred-spiral' ? radius * 0.35 : 0;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      let x = 0;
      let y = 0;
      let z = 0;
      let distRatio = 0;

      if (morphology === 'spiral' || morphology === 'barred-spiral') {
        const isCore = rng.next() < 0.25;
        if (isCore) {
          // Central bulge (Gaussian spherical distribution)
          const r = rng.gaussian(0, radius * 0.12);
          const theta = rng.next() * Math.PI * 2;
          const phi = Math.acos(rng.range(-1, 1));
          x = r * Math.sin(phi) * Math.cos(theta);
          y = (r * Math.cos(phi)) * 0.35;
          z = r * Math.sin(phi) * Math.sin(theta);
          distRatio = Math.sqrt(x * x + z * z) / radius;
        } else if (morphology === 'barred-spiral' && rng.next() < 0.2) {
          // Central bar
          const barPos = rng.range(-barLength, barLength);
          const barWidth = rng.gaussian(0, radius * 0.04);
          x = barPos;
          z = barWidth;
          y = rng.gaussian(0, radius * 0.02);
          distRatio = Math.abs(barPos) / radius;
        } else {
          // Spiral arms
          const armIndex = i % arms;
          const armAngle = (armIndex * 2 * Math.PI) / arms;
          const r = Math.pow(rng.next(), 1.5) * radius + (morphology === 'barred-spiral' ? barLength * 0.5 : 0);
          const spiralAngle = r * 0.08 * dna.galaxyRotation;
          const totalAngle = armAngle + spiralAngle;

          const spread = rng.gaussian(0, armSpread * (r / radius + 0.1) * (radius * 0.15));
          const heightSpread = rng.gaussian(0, (1.0 - (r / radius) * 0.5) * (radius * 0.04));

          x = Math.cos(totalAngle) * r + Math.sin(totalAngle) * spread;
          z = Math.sin(totalAngle) * r - Math.cos(totalAngle) * spread;
          y = heightSpread;
          distRatio = r / radius;
        }
      } else if (morphology === 'elliptical') {
        // Triaxial oblate spheroid
        const r = Math.pow(rng.next(), 2.0) * radius;
        const theta = rng.next() * Math.PI * 2;
        const phi = Math.acos(rng.range(-1, 1));
        x = r * Math.sin(phi) * Math.cos(theta);
        y = (r * Math.cos(phi)) * 0.45;
        z = (r * Math.sin(phi) * Math.sin(theta)) * 0.75;
        distRatio = r / radius;
      } else {
        // Irregular galaxy (multi-cluster chaotic cloud)
        const clusterCenters = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(radius * 0.4, 0, radius * 0.2),
          new THREE.Vector3(-radius * 0.3, radius * 0.1, -radius * 0.3)
        ];
        const center = rng.choice(clusterCenters);
        const r = rng.gaussian(0, radius * 0.22);
        const theta = rng.next() * Math.PI * 2;
        const phi = Math.acos(rng.range(-1, 1));
        x = center.x + r * Math.sin(phi) * Math.cos(theta);
        y = center.y + (r * Math.cos(phi)) * 0.5;
        z = center.z + r * Math.sin(phi) * Math.sin(theta);
        distRatio = Math.sqrt(x * x + z * z) / radius;
      }

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      // Color gradation: Core is warm/bright, arms transition to innerColor then outerColor
      const clampedDist = Math.max(0, Math.min(1, distRatio));
      if (clampedDist < 0.2) {
        tempColor.copy(coreColor).lerp(innerColor, clampedDist / 0.2);
      } else {
        tempColor.copy(innerColor).lerp(outerColor, (clampedDist - 0.2) / 0.8);
      }

      // Add slight spectral variance per star
      tempColor.r = Math.min(1, tempColor.r + (rng.next() - 0.5) * 0.2);
      tempColor.g = Math.min(1, tempColor.g + (rng.next() - 0.5) * 0.2);
      tempColor.b = Math.min(1, tempColor.b + (rng.next() - 0.5) * 0.2);

      colors[idx] = tempColor.r;
      colors[idx + 1] = tempColor.g;
      colors[idx + 2] = tempColor.b;

      // Size calculation
      sizes[i] = rng.range(1.5, 4.0) * dna.starBrightness;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom point shader for soft glowing stellar particles without external textures
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBrightness: { value: dna.starBrightness }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uBrightness;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (220.0 / -mvPosition.z) * uBrightness;
          gl_Position = projectionMatrix * mvPosition;
          vAlpha = 1.0;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float glow = pow(smoothstep(0.5, 0.0, dist), 1.8);
          gl_FragColor = vec4(vColor, glow * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    const points = new THREE.Points(geometry, material);
    group.add(points);

    // Central supermassive core glow
    const coreGeo = new THREE.SphereGeometry(radius * 0.08, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: coreColor,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    const rotationSpeed = 0.05 * dna.galaxyRotation * dna.timeScale;

    const update = (time: number, delta: number) => {
      material.uniforms.uTime.value = time;
      group.rotation.y += delta * rotationSpeed;
      // Gentle core pulse
      const pulse = 1.0 + Math.sin(time * 2.0) * 0.1;
      coreMesh.scale.set(pulse, pulse, pulse);
    };

    const dispose = () => {
      geometry.dispose();
      material.dispose();
      coreGeo.dispose();
      coreMat.dispose();
    };

    return { group, update, dispose };
  }
}
