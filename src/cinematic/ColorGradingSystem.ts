import * as THREE from 'three';

export class ColorGradingSystem {
  public static readonly fragmentShader = `
    uniform sampler2D tDiffuse;
    uniform float uExposure;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uTemperature;
    uniform float uTint;
    uniform float uFilmGrain;
    uniform float uTime;
    varying vec2 vUv;

    // Fast procedural pseudo-random noise for film grain
    float rand(vec2 co) {
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    void main() {
      vec4 texColor = texture2D(tDiffuse, vUv);
      vec3 color = texColor.rgb;

      // 1. Exposure
      color *= uExposure;

      // 2. Temperature & Tint balance
      // Temperature: warm (adds orange/yellow) vs cool (adds cyan/blue)
      color.r += uTemperature * 0.12;
      color.b -= uTemperature * 0.12;

      // Tint: magenta vs green
      color.g -= uTint * 0.08;
      color.r += uTint * 0.04;
      color.b += uTint * 0.04;

      // 3. Contrast (pivot around middle gray 0.5)
      color = (color - 0.5) * uContrast + 0.5;

      // 4. Saturation
      float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = mix(vec3(lum), color, uSaturation);

      // 5. Film Grain
      if (uFilmGrain > 0.001) {
        float noise = (rand(vUv * 1000.0 + uTime) - 0.5) * uFilmGrain;
        color += noise;
      }

      // Clamp output
      gl_FragColor = vec4(clamp(color, 0.0, 1.0), texColor.a);
    }
  `;

  private material: THREE.ShaderMaterial;

  constructor() {
    this.material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: ColorGradingSystem.fragmentShader,
      uniforms: {
        tDiffuse: { value: null },
        uExposure: { value: 1.0 },
        uContrast: { value: 1.05 },
        uSaturation: { value: 1.1 },
        uTemperature: { value: 0.0 },
        uTint: { value: 0.0 },
        uFilmGrain: { value: 0.02 },
        uTime: { value: 0.0 }
      },
      depthWrite: false,
      depthTest: false
    });
  }

  public getMaterial(): THREE.ShaderMaterial {
    return this.material;
  }

  public update(
    exposure: number,
    contrast: number,
    saturation: number,
    temperature: number,
    tint: number,
    filmGrain: number,
    time: number
  ): void {
    this.material.uniforms.uExposure.value = exposure;
    this.material.uniforms.uContrast.value = contrast;
    this.material.uniforms.uSaturation.value = saturation;
    this.material.uniforms.uTemperature.value = temperature;
    this.material.uniforms.uTint.value = tint;
    this.material.uniforms.uFilmGrain.value = filmGrain;
    this.material.uniforms.uTime.value = time;
  }

  public dispose(): void {
    this.material.dispose();
  }
}
