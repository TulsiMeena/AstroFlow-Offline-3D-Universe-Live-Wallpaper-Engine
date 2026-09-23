import * as THREE from 'three';
import { WorldDNA } from '../types/worldDNA';
import { SeededRNG } from '../seed/SeededRNG';

export class NebulaGenerator {
  public static createNebula(
    dna: WorldDNA,
    rng: SeededRNG,
    radiusMultiplier = 1.0
  ): {
    group: THREE.Group;
    update: (time: number, delta: number) => void;
    pulseGlow: (strength: number) => void;
    dispose: () => void;
  } {
    const group = new THREE.Group();
    group.name = 'Procedural_Nebula';

    const radius = dna.universeSize * 0.7 * radiusMultiplier;
    const disposables: { dispose: () => void }[] = [];

    const primaryCol = new THREE.Color(dna.nebulaColor.primary);
    const secondaryCol = new THREE.Color(dna.nebulaColor.secondary);
    const accentCol = new THREE.Color(dna.nebulaColor.accent);

    // GLSL procedural 3D Simplex-like noise shader without any external texture
    const nebulaShader = {
      uniforms: {
        uTime: { value: 0 },
        uPrimaryColor: { value: primaryCol },
        uSecondaryColor: { value: secondaryCol },
        uAccentColor: { value: accentCol },
        uDensity: { value: dna.nebulaDensity },
        uTurbulence: { value: dna.turbulence },
        uPulse: { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;

        uniform float uTime;
        uniform vec3 uPrimaryColor;
        uniform vec3 uSecondaryColor;
        uniform vec3 uAccentColor;
        uniform float uDensity;
        uniform float uTurbulence;
        uniform float uPulse;

        // Fast hash & noise functions
        float hash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise(vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);

          return mix(
            mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        }

        // Fractional Brownian Motion (fBm)
        float fbm(vec3 p) {
          float v = 0.0;
          float a = 0.5;
          vec3 shift = vec3(100.0);
          for (int i = 0; i < 4; ++i) {
            v += a * noise(p);
            p = p * 2.0 + shift;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 pos = normalize(vPosition) * 2.5;
          float t = uTime * 0.06;

          // Multi-layered animated domain warp
          vec3 q = vec3(fbm(pos + t), fbm(pos + vec3(5.2, 1.3, 2.8)), fbm(pos + vec3(1.7, 9.2, 0.4)));
          vec3 r = vec3(fbm(pos + 4.0 * q + vec3(1.7, 9.2, 0.1) + t * 0.5),
                        fbm(pos + 4.0 * q + vec3(8.3, 2.8, 4.2) + t * 0.3),
                        fbm(pos + 4.0 * q + vec3(2.4, 4.1, 7.3) + t * 0.4));

          float n = fbm(pos + 3.0 * r * uTurbulence);

          // Color blending
          vec3 col = mix(uSecondaryColor, uPrimaryColor, smoothstep(0.1, 0.6, n));
          col = mix(col, uAccentColor, smoothstep(0.4, 0.85, n * n));

          // Soft rim / edge fading
          float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          float alpha = smoothstep(0.2, 0.7, n) * uDensity * 0.45;
          alpha += uPulse * 0.25;

          gl_FragColor = vec4(col, alpha * rim);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    };

    const mat = new THREE.ShaderMaterial(nebulaShader);
    disposables.push(mat);

    // Layer 1: Outermost boundary shell
    const outerGeo = new THREE.SphereGeometry(radius, 32, 32);
    const outerMesh = new THREE.Mesh(outerGeo, mat);
    group.add(outerMesh);
    disposables.push(outerGeo);

    // Layer 2: Mid concentrated gas pocket clusters
    const clusterCount = Math.floor(4 * dna.nebulaDensity);
    for (let c = 0; c < clusterCount; c++) {
      const pocketRadius = rng.range(radius * 0.25, radius * 0.45);
      const pocketGeo = new THREE.SphereGeometry(pocketRadius, 20, 20);
      const pocketMat = mat.clone();
      pocketMat.uniforms.uTurbulence.value = dna.turbulence * rng.range(0.8, 1.3);
      const pocketMesh = new THREE.Mesh(pocketGeo, pocketMat);

      const offsetDist = rng.range(radius * 0.2, radius * 0.6);
      const theta = rng.next() * Math.PI * 2;
      const phi = Math.acos(rng.range(-0.7, 0.7));
      pocketMesh.position.set(
        offsetDist * Math.sin(phi) * Math.cos(theta),
        offsetDist * Math.cos(phi),
        offsetDist * Math.sin(phi) * Math.sin(theta)
      );

      group.add(pocketMesh);
      disposables.push(pocketGeo, pocketMat);
    }

    let pulseAmount = 0;

    const pulseGlow = (strength = 1.0) => {
      pulseAmount = strength;
    };

    const update = (time: number, delta: number) => {
      mat.uniforms.uTime.value = time * dna.timeScale;

      if (pulseAmount > 0.01) {
        pulseAmount = THREE.MathUtils.lerp(pulseAmount, 0, delta * 2.5);
      } else {
        pulseAmount = 0;
      }
      mat.uniforms.uPulse.value = pulseAmount;

      group.rotation.y = time * 0.015 * dna.galaxyRotation;
      group.rotation.x = Math.sin(time * 0.02) * 0.05;
    };

    const dispose = () => {
      disposables.forEach(d => d.dispose());
    };

    return { group, update, pulseGlow, dispose };
  }
}
