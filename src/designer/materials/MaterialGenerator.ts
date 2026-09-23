import * as THREE from 'three';
import { MaterialConfig, MaterialType, ProceduralColors } from '../types/designDNA';

export class MaterialGenerator {
  private materialsCache: Map<string, THREE.Material> = new Map();

  /**
   * Generates or retrieves a procedural Three.js material based on config and colors
   */
  public getMaterial(config: MaterialConfig, colors: ProceduralColors): THREE.Material {
    const key = `${config.type}_${colors.primary}_${colors.secondary}_${colors.glow}_${config.wireframe}_${config.metalness}_${config.roughness}`;
    if (this.materialsCache.has(key)) {
      return this.materialsCache.get(key)!;
    }

    const mat = this.createMaterial(config, colors);
    this.materialsCache.set(key, mat);
    return mat;
  }

  private createMaterial(config: MaterialConfig, colors: ProceduralColors): THREE.Material {
    const primaryColor = new THREE.Color(colors.primary);
    const secondaryColor = new THREE.Color(colors.secondary);
    const glowColor = new THREE.Color(colors.glow);
    const accentColor = new THREE.Color(colors.accent);

    switch (config.type) {
      case 'metal': {
        return new THREE.MeshStandardMaterial({
          color: primaryColor,
          metalness: Math.max(0.85, config.metalness),
          roughness: Math.min(0.25, config.roughness),
          wireframe: config.wireframe,
          emissive: glowColor,
          emissiveIntensity: config.emissiveIntensity * 0.25,
        });
      }

      case 'glass-style': {
        return new THREE.MeshPhysicalMaterial({
          color: primaryColor,
          metalness: 0.05,
          roughness: Math.max(0.04, config.roughness * 0.3),
          transmission: Math.max(0.8, config.transmission),
          ior: config.ior || 1.52,
          transparent: true,
          opacity: 0.85,
          wireframe: config.wireframe,
          emissive: glowColor,
          emissiveIntensity: config.emissiveIntensity * 0.2,
        });
      }

      case 'crystal': {
        return new THREE.MeshPhysicalMaterial({
          color: primaryColor,
          metalness: 0.1,
          roughness: 0.08,
          transmission: 0.88,
          ior: 2.1, // Diamond / quartz refraction
          transparent: true,
          opacity: 0.9,
          wireframe: config.wireframe,
          emissive: glowColor,
          emissiveIntensity: Math.max(0.4, config.emissiveIntensity * 0.6),
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
        });
      }

      case 'liquid-style': {
        return new THREE.MeshPhysicalMaterial({
          color: secondaryColor,
          metalness: 0.1,
          roughness: 0.1,
          transmission: 0.82,
          ior: 1.333, // Water
          transparent: true,
          opacity: 0.8,
          wireframe: config.wireframe,
          emissive: accentColor,
          emissiveIntensity: config.emissiveIntensity * 0.3,
        });
      }

      case 'lava': {
        return new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uColorA: { value: new THREE.Color(colors.primary) },
            uColorB: { value: new THREE.Color(colors.secondary) },
            uColorGlow: { value: new THREE.Color(colors.glow) },
            uPulseSpeed: { value: config.pulseSpeed },
            uIntensity: { value: config.emissiveIntensity },
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              vUv = uv;
              vNormal = normalize(normalMatrix * normal);
              vPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform vec3 uColorA;
            uniform vec3 uColorB;
            uniform vec3 uColorGlow;
            uniform float uPulseSpeed;
            uniform float uIntensity;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;

            float hash(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }
            float noise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                         mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
            }

            void main() {
              float t = uTime * uPulseSpeed * 0.5;
              float n = noise(vUv * 8.0 + vec2(t * 0.2, t * 0.4));
              n += 0.5 * noise(vUv * 16.0 - vec2(t * 0.3, t * 0.1));
              
              // Magma vein cracks
              float vein = smoothstep(0.42, 0.58, n);
              vec3 magma = mix(uColorB, uColorA, n);
              magma = mix(magma, uColorGlow, vein * 0.8) * (1.2 + sin(uTime * 3.0) * 0.3) * uIntensity;
              
              // Dark crust
              vec3 crust = vec3(0.05, 0.04, 0.03);
              vec3 finalColor = mix(crust, magma, smoothstep(0.35, 0.65, n));
              
              gl_FragColor = vec4(finalColor, 1.0);
            }
          `,
          wireframe: config.wireframe,
        });
      }

      case 'ice': {
        return new THREE.MeshPhysicalMaterial({
          color: primaryColor,
          metalness: 0.05,
          roughness: 0.35,
          transmission: 0.7,
          ior: 1.31,
          transparent: true,
          opacity: 0.85,
          wireframe: config.wireframe,
          emissive: glowColor,
          emissiveIntensity: config.emissiveIntensity * 0.25,
          clearcoat: 0.8,
          clearcoatRoughness: 0.2,
        });
      }

      case 'hologram': {
        return new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(colors.primary) },
            uGlow: { value: new THREE.Color(colors.glow) },
            uIntensity: { value: config.emissiveIntensity },
          },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            void main() {
              vUv = uv;
              vNormal = normalize(normalMatrix * normal);
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              vViewPosition = -mvPosition.xyz;
              vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            uniform vec3 uGlow;
            uniform float uIntensity;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec2 vUv;
            varying vec3 vWorldPosition;

            void main() {
              vec3 normal = normalize(vNormal);
              vec3 viewDir = normalize(vViewPosition);
              float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 2.5);
              
              // Scanlines
              float scanline = sin((vWorldPosition.y + uTime * 2.0) * 40.0) * 0.5 + 0.5;
              scanline = smoothstep(0.2, 0.8, scanline);
              
              // Glitch flicker
              float glitch = step(0.96, fract(sin(dot(vUv, vec2(12.9, 78.2)) + uTime) * 4375.8));
              
              vec3 col = mix(uColor, uGlow, fresnel) * (0.6 + scanline * 0.4 + glitch * 0.5) * uIntensity;
              float alpha = (fresnel * 0.85 + scanline * 0.25 + 0.1);
              
              gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.95));
            }
          `,
          transparent: true,
          wireframe: config.wireframe,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
      }

      case 'organic': {
        return new THREE.MeshStandardMaterial({
          color: primaryColor,
          roughness: 0.6,
          metalness: 0.1,
          wireframe: config.wireframe,
          emissive: glowColor,
          emissiveIntensity: config.emissiveIntensity * 0.4,
        });
      }

      case 'cosmic dust': {
        return new THREE.MeshStandardMaterial({
          color: secondaryColor,
          roughness: 0.8,
          metalness: 0.3,
          wireframe: config.wireframe,
          emissive: glowColor,
          emissiveIntensity: config.emissiveIntensity * 0.6,
        });
      }

      case 'energy':
      default: {
        return new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uColorPrimary: { value: new THREE.Color(colors.primary) },
            uColorSecondary: { value: new THREE.Color(colors.secondary) },
            uColorGlow: { value: new THREE.Color(colors.glow) },
            uPulseSpeed: { value: config.pulseSpeed },
            uIntensity: { value: config.emissiveIntensity },
          },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec2 vUv;
            void main() {
              vUv = uv;
              vNormal = normalize(normalMatrix * normal);
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              vViewPosition = -mvPosition.xyz;
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform vec3 uColorPrimary;
            uniform vec3 uColorSecondary;
            uniform vec3 uColorGlow;
            uniform float uPulseSpeed;
            uniform float uIntensity;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec2 vUv;

            void main() {
              vec3 normal = normalize(vNormal);
              vec3 viewDir = normalize(vViewPosition);
              float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.0);
              
              // Energy wave oscillation
              float wave = sin(vUv.y * 20.0 + uTime * uPulseSpeed * 4.0) * 0.5 + 0.5;
              vec3 baseCol = mix(uColorPrimary, uColorSecondary, wave);
              vec3 finalCol = mix(baseCol, uColorGlow, fresnel) * (1.0 + fresnel * 2.0) * uIntensity;
              
              float alpha = clamp(fresnel * 0.8 + 0.25, 0.0, 1.0);
              gl_FragColor = vec4(finalCol, alpha);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          wireframe: config.wireframe,
          depthWrite: false,
        });
      }
    }
  }

  /**
   * Updates time and audio reactivity on any animated ShaderMaterials
   */
  public update(time: number, audioAnalysis?: any): void {
    const pulseFactor = audioAnalysis ? (1.0 + audioAnalysis.bass * 0.8) : 1.0;
    this.materialsCache.forEach(mat => {
      if (mat instanceof THREE.ShaderMaterial && mat.uniforms) {
        if (mat.uniforms.uTime) {
          mat.uniforms.uTime.value = time;
        }
        if (mat.uniforms.uIntensity && audioAnalysis) {
          mat.uniforms.uIntensity.value = (mat.uniforms.uIntensity.value || 1.0) * pulseFactor;
        }
      }
    });
  }

  public dispose(): void {
    this.materialsCache.forEach(mat => mat.dispose());
    this.materialsCache.clear();
  }
}
