import * as THREE from 'three';
import { PostProcessingConfig, AccessibilitySettings } from './types';

export class AtmosphereRenderer {
  private group: THREE.Group;
  private hazeMesh: THREE.Mesh | null = null;
  private hazeMaterial: THREE.ShaderMaterial | null = null;
  private starGlowParticles: THREE.Points | null = null;
  private lightRaysMesh: THREE.Mesh | null = null;
  private lightRaysMaterial: THREE.ShaderMaterial | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'AtmosphereRenderer_Group';
    this.initAtmosphericEffects();
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  private initAtmosphericEffects(): void {
    // 1. Procedural volumetric depth haze dome/plane
    const hazeGeo = new THREE.SphereGeometry(18.0, 24, 16);
    this.hazeMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uHazeColor;
        uniform float uDensity;
        uniform float uDepthHaze;
        uniform float uTime;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;

        void main() {
          float dist = length(vWorldPosition);
          float depthFactor = smoothstep(2.0, 18.0, dist);
          
          // Subtle atmospheric breathing
          float pulse = 0.95 + 0.05 * sin(uTime * 0.7);
          float alpha = depthFactor * uDensity * uDepthHaze * pulse * 0.45;
          
          gl_FragColor = vec4(uHazeColor, clamp(alpha, 0.0, 0.8));
        }
      `,
      uniforms: {
        uHazeColor: { value: new THREE.Color(0x0a1630) },
        uDensity: { value: 0.6 },
        uDepthHaze: { value: 0.5 },
        uTime: { value: 0.0 }
      },
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.hazeMesh = new THREE.Mesh(hazeGeo, this.hazeMaterial);
    this.group.add(this.hazeMesh);

    // 2. Volumetric Procedural Light Streaks / Sun Shafts
    const raysGeo = new THREE.CylinderGeometry(0.5, 12.0, 20.0, 16, 1, true);
    raysGeo.rotateX(Math.PI / 2);
    this.lightRaysMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        void main() {
          vUv = uv;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uRayColor;
        uniform float uIntensity;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          float angle = atan(vPos.y, vPos.x);
          float rays = sin(angle * 8.0 + uTime * 0.3) * 0.5 + 0.5;
          rays *= sin(angle * 14.0 - uTime * 0.2) * 0.5 + 0.5;
          
          float fade = (1.0 - vUv.y) * vUv.y * 4.0;
          float alpha = rays * fade * uIntensity * 0.25;

          gl_FragColor = vec4(uRayColor, alpha);
        }
      `,
      uniforms: {
        uTime: { value: 0.0 },
        uRayColor: { value: new THREE.Color(0x00f0ff) },
        uIntensity: { value: 0.8 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.lightRaysMesh = new THREE.Mesh(raysGeo, this.lightRaysMaterial);
    this.lightRaysMesh.position.set(0, 5, -8);
    this.group.add(this.lightRaysMesh);

    // 3. Ambient Star Glow / Atmospheric Spec Dust
    const count = 180;
    const dustGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 15;
      positions[i + 2] = (Math.random() - 0.5) * 15;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x90e0ef,
      size: 0.08,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.starGlowParticles = new THREE.Points(dustGeo, dustMat);
    this.group.add(this.starGlowParticles);
  }

  public update(time: number, delta: number, config: PostProcessingConfig, accessibility: AccessibilitySettings): void {
    if (!config.atmosphereEnabled) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;

    if (this.hazeMaterial) {
      this.hazeMaterial.uniforms.uTime.value = time;
      this.hazeMaterial.uniforms.uDensity.value = config.atmosphereDensity;
      this.hazeMaterial.uniforms.uDepthHaze.value = config.depthHaze;
    }

    if (this.lightRaysMaterial && this.lightRaysMesh) {
      this.lightRaysMaterial.uniforms.uTime.value = time;
      this.lightRaysMaterial.uniforms.uIntensity.value = config.atmosphereDensity * (accessibility.reducedMotion ? 0.3 : 0.8);
      this.lightRaysMesh.rotation.z = time * (accessibility.reducedMotion ? 0.02 : 0.06);
    }

    if (this.starGlowParticles) {
      this.starGlowParticles.rotation.y = time * 0.02;
    }
  }

  public setAtmosphereColor(color: THREE.Color | number | string): void {
    if (this.hazeMaterial) {
      this.hazeMaterial.uniforms.uHazeColor.value = new THREE.Color(color);
    }
  }

  public dispose(): void {
    this.hazeMesh?.geometry.dispose();
    this.hazeMaterial?.dispose();
    this.lightRaysMesh?.geometry.dispose();
    this.lightRaysMaterial?.dispose();
    this.starGlowParticles?.geometry.dispose();
    if (this.starGlowParticles?.material instanceof THREE.Material) {
      this.starGlowParticles.material.dispose();
    }
  }
}
