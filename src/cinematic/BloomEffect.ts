import * as THREE from 'three';

export class BloomEffect {
  public static readonly vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `;

  public static readonly fragmentShader = `
    uniform sampler2D tDiffuse;
    uniform float uThreshold;
    uniform float uIntensity;
    uniform float uRadius;
    uniform vec2 uResolution;
    varying vec2 vUv;

    // Luminance calculation
    float getLuminance(vec3 color) {
      return dot(color, vec3(0.2126, 0.7152, 0.0722));
    }

    void main() {
      vec4 baseColor = texture2D(tDiffuse, vUv);
      vec2 texel = (1.0 / uResolution) * uRadius;

      // 9-tap separable Gaussian blur kernel
      vec4 bloom = vec4(0.0);
      float totalWeight = 0.0;

      float weights[5];
      weights[0] = 0.227027;
      weights[1] = 0.1945946;
      weights[2] = 0.1216216;
      weights[3] = 0.054054;
      weights[4] = 0.016216;

      for (int i = -4; i <= 4; i++) {
        for (int j = -4; j <= 4; j++) {
          float dist = length(vec2(float(i), float(j)));
          if (dist <= 4.0) {
            float w = exp(-dist * dist * 0.25);
            vec2 sampleUv = vUv + vec2(float(i), float(j)) * texel;
            vec4 s = texture2D(tDiffuse, sampleUv);
            float lum = getLuminance(s.rgb);
            if (lum > uThreshold) {
              float factor = clamp((lum - uThreshold) / (1.0 - uThreshold + 0.001), 0.0, 2.0);
              bloom += s * factor * w;
              totalWeight += w;
            }
          }
        }
      }

      if (totalWeight > 0.0) {
        bloom /= totalWeight;
      }

      // Additive blend with base color
      vec3 finalColor = baseColor.rgb + bloom.rgb * uIntensity;
      gl_FragColor = vec4(finalColor, baseColor.a);
    }
  `;

  private material: THREE.ShaderMaterial;

  constructor() {
    this.material = new THREE.ShaderMaterial({
      vertexShader: BloomEffect.vertexShader,
      fragmentShader: BloomEffect.fragmentShader,
      uniforms: {
        tDiffuse: { value: null },
        uThreshold: { value: 0.65 },
        uIntensity: { value: 1.2 },
        uRadius: { value: 1.2 },
        uResolution: { value: new THREE.Vector2(1920, 1080) }
      },
      depthWrite: false,
      depthTest: false
    });
  }

  public getMaterial(): THREE.ShaderMaterial {
    return this.material;
  }

  public update(threshold: number, intensity: number, radius: number, width: number, height: number): void {
    this.material.uniforms.uThreshold.value = threshold;
    this.material.uniforms.uIntensity.value = intensity;
    this.material.uniforms.uRadius.value = radius;
    this.material.uniforms.uResolution.value.set(Math.max(1, width), Math.max(1, height));
  }

  public dispose(): void {
    this.material.dispose();
  }
}
