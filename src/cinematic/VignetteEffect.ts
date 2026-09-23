import * as THREE from 'three';

export class VignetteEffect {
  public static readonly fragmentShader = `
    uniform sampler2D tDiffuse;
    uniform float uDarkness;
    uniform float uOffset;
    uniform float uChromatic;
    varying vec2 vUv;

    void main() {
      // Chromatic aberration fringe on screen edges
      vec2 distFromCenter = vUv - 0.5;
      float dist = length(distFromCenter);

      vec2 redUv = vUv + distFromCenter * (uChromatic * dist * 1.5);
      vec2 blueUv = vUv - distFromCenter * (uChromatic * dist * 1.5);

      float r = texture2D(tDiffuse, clamp(redUv, 0.0, 1.0)).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, clamp(blueUv, 0.0, 1.0)).b;
      float a = texture2D(tDiffuse, vUv).a;

      vec3 color = vec3(r, g, b);

      // Vignette falloff
      float vignette = smoothstep(0.8, uOffset * 0.799, dist * (uDarkness + uOffset));
      color *= vignette;

      gl_FragColor = vec4(color, a);
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
      fragmentShader: VignetteEffect.fragmentShader,
      uniforms: {
        tDiffuse: { value: null },
        uDarkness: { value: 0.8 },
        uOffset: { value: 1.1 },
        uChromatic: { value: 0.003 }
      },
      depthWrite: false,
      depthTest: false
    });
  }

  public getMaterial(): THREE.ShaderMaterial {
    return this.material;
  }

  public update(darkness: number, offset: number, chromatic: number): void {
    this.material.uniforms.uDarkness.value = darkness;
    this.material.uniforms.uOffset.value = offset;
    this.material.uniforms.uChromatic.value = chromatic;
  }

  public dispose(): void {
    this.material.dispose();
  }
}
