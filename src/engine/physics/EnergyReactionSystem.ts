import * as THREE from 'three';

export interface EnergyReactionState {
  brightness: number; // 1.0 baseline
  waveRadius: number;
  waveIntensity: number;
  lightPulse: number;
  distortion: number;
  origin: THREE.Vector3;
}

export class EnergyReactionSystem {
  public brightness: number = 1.0;
  public waveRadius: number = 0;
  public waveIntensity: number = 0;
  public lightPulse: number = 0;
  public distortion: number = 0;
  public origin: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Optional visual shockwave ring
  private shockwaveMesh: THREE.Mesh | null = null;
  private shockwaveMaterial: THREE.ShaderMaterial | null = null;

  constructor() {
    this.createShockwaveMesh();
  }

  private createShockwaveMesh() {
    const geo = new THREE.RingGeometry(0.1, 1.0, 48);
    this.shockwaveMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x00f0ff) },
        uOpacity: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          float rim = smoothstep(0.0, 0.5, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
          gl_FragColor = vec4(uColor, rim * uOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.shockwaveMesh = new THREE.Mesh(geo, this.shockwaveMaterial);
    this.shockwaveMesh.visible = false;
  }

  public attachToScene(scene: THREE.Scene) {
    if (this.shockwaveMesh && !this.shockwaveMesh.parent) {
      scene.add(this.shockwaveMesh);
    }
  }

  public triggerPulse(x: number, y: number, z: number = 0, strength: number = 1.0, colorHex?: number) {
    this.origin.set(x, y, z);
    this.brightness = Math.min(2.5, 1.0 + strength * 1.2);
    this.waveRadius = 0.2;
    this.waveIntensity = Math.min(1.0, strength);
    this.lightPulse = Math.min(1.0, strength * 0.9);
    this.distortion = Math.min(1.0, strength * 0.8);

    if (this.shockwaveMesh && this.shockwaveMaterial) {
      this.shockwaveMesh.position.set(x, y, z);
      this.shockwaveMesh.scale.set(0.2, 0.2, 0.2);
      this.shockwaveMesh.visible = true;
      if (colorHex !== undefined) {
        this.shockwaveMaterial.uniforms.uColor.value.set(colorHex);
      }
    }
  }

  public update(delta: number) {
    // 1. Brightness exponential decay back to baseline 1.0
    if (this.brightness > 1.001) {
      this.brightness += (1.0 - this.brightness) * Math.min(1.0, delta * 4.5);
    } else {
      this.brightness = 1.0;
    }

    // 2. Wave propagation and decay
    if (this.waveIntensity > 0.01) {
      this.waveRadius += delta * 14.0;
      this.waveIntensity *= Math.pow(0.2, delta); // Fast exponential fade

      if (this.shockwaveMesh && this.shockwaveMaterial) {
        const s = this.waveRadius;
        this.shockwaveMesh.scale.set(s, s, s);
        this.shockwaveMaterial.uniforms.uOpacity.value = this.waveIntensity * 0.7;
      }
    } else {
      this.waveIntensity = 0;
      if (this.shockwaveMesh) {
        this.shockwaveMesh.visible = false;
      }
    }

    // 3. Light pulse and distortion decay
    if (this.lightPulse > 0.01) {
      this.lightPulse *= Math.pow(0.15, delta);
    } else {
      this.lightPulse = 0;
    }

    if (this.distortion > 0.01) {
      this.distortion *= Math.pow(0.2, delta);
    } else {
      this.distortion = 0;
    }
  }

  public getState(): EnergyReactionState {
    return {
      brightness: this.brightness,
      waveRadius: this.waveRadius,
      waveIntensity: this.waveIntensity,
      lightPulse: this.lightPulse,
      distortion: this.distortion,
      origin: this.origin
    };
  }

  public dispose() {
    if (this.shockwaveMesh) {
      if (this.shockwaveMesh.parent) {
        this.shockwaveMesh.parent.remove(this.shockwaveMesh);
      }
      this.shockwaveMesh.geometry.dispose();
      this.shockwaveMesh = null;
    }
    if (this.shockwaveMaterial) {
      this.shockwaveMaterial.dispose();
      this.shockwaveMaterial = null;
    }
  }
}
