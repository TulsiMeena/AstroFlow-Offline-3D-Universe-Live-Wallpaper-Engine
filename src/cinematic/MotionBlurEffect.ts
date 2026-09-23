import * as THREE from 'three';

export class MotionBlurEffect {
  public static readonly fragmentShader = `
    uniform sampler2D tDiffuse;
    uniform vec2 uVelocity;
    uniform float uIntensity;
    uniform vec2 uResolution;
    varying vec2 vUv;

    void main() {
      vec4 color = vec4(0.0);
      vec2 dir = uVelocity * uIntensity * 0.04;
      float samples = 8.0;

      for (float i = 0.0; i < 8.0; i += 1.0) {
        float stepFraction = (i / (samples - 1.0)) - 0.5;
        vec2 sampleUv = clamp(vUv + dir * stepFraction, 0.0, 1.0);
        color += texture2D(tDiffuse, sampleUv);
      }

      gl_FragColor = color / samples;
    }
  `;

  private material: THREE.ShaderMaterial;
  private prevCameraPos = new THREE.Vector3();
  private smoothedVelocity = new THREE.Vector2();

  constructor() {
    this.material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: MotionBlurEffect.fragmentShader,
      uniforms: {
        tDiffuse: { value: null },
        uVelocity: { value: new THREE.Vector2(0, 0) },
        uIntensity: { value: 0.5 },
        uResolution: { value: new THREE.Vector2(1920, 1080) }
      },
      depthWrite: false,
      depthTest: false
    });
  }

  public getMaterial(): THREE.ShaderMaterial {
    return this.material;
  }

  public update(
    cameraPos: THREE.Vector3,
    delta: number,
    intensity: number,
    width: number,
    height: number
  ): void {
    if (delta > 0.001) {
      const vx = (cameraPos.x - this.prevCameraPos.x) / delta;
      const vy = (cameraPos.y - this.prevCameraPos.y) / delta;
      const targetVx = Math.max(-5.0, Math.min(5.0, vx));
      const targetVy = Math.max(-5.0, Math.min(5.0, vy));

      const damping = Math.min(1.0, delta * 8.0);
      this.smoothedVelocity.x += (targetVx - this.smoothedVelocity.x) * damping;
      this.smoothedVelocity.y += (targetVy - this.smoothedVelocity.y) * damping;
    }

    this.prevCameraPos.copy(cameraPos);

    this.material.uniforms.uVelocity.value.copy(this.smoothedVelocity);
    this.material.uniforms.uIntensity.value = intensity;
    this.material.uniforms.uResolution.value.set(Math.max(1, width), Math.max(1, height));
  }

  public dispose(): void {
    this.material.dispose();
  }
}
