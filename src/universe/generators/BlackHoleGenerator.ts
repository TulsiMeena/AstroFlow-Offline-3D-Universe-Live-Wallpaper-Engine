import * as THREE from 'three';
import { WorldDNA } from '../types/worldDNA';
import { SeededRNG } from '../seed/SeededRNG';

export class BlackHoleGenerator {
  public static createBlackHole(
    dna: WorldDNA,
    rng: SeededRNG
  ): {
    group: THREE.Group;
    update: (time: number, delta: number) => void;
    dispose: () => void;
  } {
    const group = new THREE.Group();
    group.name = 'BlackHole_Procedural';

    const disposables: { dispose: () => void }[] = [];
    const eventHorizonRadius = 4.0;

    // 1. Central Event Horizon (pure black sphere absorbing all light)
    const ehGeo = new THREE.SphereGeometry(eventHorizonRadius, 32, 32);
    const ehMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const ehMesh = new THREE.Mesh(ehGeo, ehMat);
    group.add(ehMesh);
    disposables.push(ehGeo, ehMat);

    // 2. Gravitational Lensing Einstein Ring (photon sphere boundary glow)
    const lensGeo = new THREE.RingGeometry(eventHorizonRadius * 0.98, eventHorizonRadius * 1.25, 64);
    const lensMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uGlowCol: { value: new THREE.Color(dna.nebulaColor.accent || '#FF6B00') }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uGlowCol;
        void main() {
          float dist = length(vUv - vec2(0.5)) * 2.0;
          float ring = smoothstep(0.7, 0.85, dist) * (1.0 - smoothstep(0.9, 1.0, dist));
          float pulse = 0.85 + 0.15 * sin(uTime * 4.0);
          gl_FragColor = vec4(uGlowCol * 1.5, ring * pulse);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    // Face the camera default or billboard
    group.add(lensMesh);
    disposables.push(lensGeo, lensMat);

    // 3. Relativistic Accretion Disk (horizontal fiery Doppler-shifted swirling disk)
    const innerDiskRadius = eventHorizonRadius * 1.2;
    const outerDiskRadius = eventHorizonRadius * 5.0;
    const diskGeo = new THREE.RingGeometry(innerDiskRadius, outerDiskRadius, 96, 16);
    diskGeo.rotateX(Math.PI / 2);

    const diskMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInnerR: { value: innerDiskRadius },
        uOuterR: { value: outerDiskRadius },
        uHotCol: { value: new THREE.Color('#FFFFFF') },
        uMidCol: { value: new THREE.Color(dna.nebulaColor.accent || '#FF8800') },
        uColdCol: { value: new THREE.Color(dna.nebulaColor.secondary || '#990000') }
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPos;
        uniform float uTime;
        uniform float uInnerR;
        uniform float uOuterR;
        uniform vec3 uHotCol;
        uniform vec3 uMidCol;
        uniform vec3 uColdCol;

        void main() {
          float r = length(vPos.xz);
          float normR = (r - uInnerR) / (uOuterR - uInnerR);
          if (normR < 0.0 || normR > 1.0) discard;

          float angle = atan(vPos.z, vPos.x);
          // Spiral swirl
          float swirl = angle * 3.0 - (1.0 / (normR + 0.1)) * 4.0 + uTime * 3.5;
          float noise = sin(swirl * 4.0) * 0.5 + 0.5;
          noise += sin(angle * 8.0 + uTime * 2.0) * 0.25;

          // Relativistic Doppler beaming: approaching side is brighter/bluer
          float doppler = 1.0 + 0.5 * cos(angle);

          vec3 col = mix(uHotCol, uMidCol, smoothstep(0.0, 0.35, normR));
          col = mix(col, uColdCol, smoothstep(0.35, 1.0, normR));

          float alpha = (1.0 - normR) * (0.6 + 0.4 * noise) * doppler;
          alpha *= smoothstep(0.0, 0.05, normR) * (1.0 - smoothstep(0.85, 1.0, normR));

          gl_FragColor = vec4(col * doppler, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const diskMesh = new THREE.Mesh(diskGeo, diskMat);
    diskMesh.rotation.x = 0.25;
    group.add(diskMesh);
    disposables.push(diskGeo, diskMat);

    // 4. Orbiting Relativistic Particles
    const particleCount = Math.floor(1200 * dna.particleDensity);
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pData: { radius: number; angle: number; speed: number; y: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const r = rng.range(innerDiskRadius * 1.05, outerDiskRadius * 1.15);
      const angle = rng.next() * Math.PI * 2;
      const speed = (2.2 / Math.sqrt(r * 0.2)) * dna.particleSpeed;
      const y = rng.gaussian(0, 0.3);

      pData.push({ radius: r, angle, speed, y });

      pPos[idx] = Math.cos(angle) * r;
      pPos[idx + 1] = y;
      pPos[idx + 2] = Math.sin(angle) * r;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: new THREE.Color(dna.nebulaColor.accent || '#FFB703'),
      size: 2.4,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(pGeo, pMat);
    particles.rotation.x = 0.25;
    group.add(particles);
    disposables.push(pGeo, pMat);

    // 5. Relativistic Polar Jets
    const jetGeo = new THREE.CylinderGeometry(0.1, 1.5, eventHorizonRadius * 6, 16, 1, true);
    const jetMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(dna.nebulaColor.primary || '#00F0FF'),
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const jetTop = new THREE.Mesh(jetGeo, jetMat);
    jetTop.position.y = eventHorizonRadius * 3.5;
    group.add(jetTop);

    const jetBottom = new THREE.Mesh(jetGeo, jetMat);
    jetBottom.position.y = -eventHorizonRadius * 3.5;
    jetBottom.rotation.z = Math.PI;
    group.add(jetBottom);
    disposables.push(jetGeo, jetMat);

    const update = (time: number, delta: number) => {
      diskMat.uniforms.uTime.value = time;
      lensMat.uniforms.uTime.value = time;

      // Update spiraling relativistic particles
      const posArr = pGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const p = pData[i];
        p.angle += delta * p.speed;
        // Inward relativistic drift
        p.radius -= delta * 0.2 * dna.gravityStrength;
        if (p.radius < innerDiskRadius) {
          p.radius = outerDiskRadius;
        }

        const idx = i * 3;
        posArr[idx] = Math.cos(p.angle) * p.radius;
        posArr[idx + 1] = p.y;
        posArr[idx + 2] = Math.sin(p.angle) * p.radius;
      }
      pGeo.attributes.position.needsUpdate = true;

      // Pulse jets
      const jetPulse = 1.0 + Math.sin(time * 6.0) * 0.15;
      jetTop.scale.set(jetPulse, 1, jetPulse);
      jetBottom.scale.set(jetPulse, 1, jetPulse);
    };

    const dispose = () => {
      disposables.forEach(d => d.dispose());
    };

    return { group, update, dispose };
  }
}
