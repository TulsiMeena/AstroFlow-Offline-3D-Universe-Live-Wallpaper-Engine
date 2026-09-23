import * as THREE from 'three';
import { WorldDNA } from '../types/worldDNA';
import { SeededRNG } from '../seed/SeededRNG';
import { TouchPointerState, MotionData } from '../../types/engine';

// Astronomical spectral classes: O (blue), B (blue-white), A (white), F (yellow-white), G (yellow), K (orange), M (red)
const SPECTRAL_COLORS = [
  '#9bb0ff', // O
  '#bbccff', // B
  '#f8f9ff', // A
  '#ffffed', // F
  '#fff4e8', // G
  '#ffd2a1', // K
  '#ff9070'  // M
];

interface ShootingStar {
  active: boolean;
  start: THREE.Vector3;
  end: THREE.Vector3;
  current: THREE.Vector3;
  speed: number;
  progress: number;
  color: THREE.Color;
  mesh: THREE.Line;
}

export class StarFieldGenerator {
  public static createStarField(
    dna: WorldDNA,
    rng: SeededRNG
  ): {
    group: THREE.Group;
    update: (time: number, delta: number, input?: TouchPointerState, motion?: MotionData) => void;
    triggerShootingStar: () => void;
    dispose: () => void;
  } {
    const group = new THREE.Group();
    group.name = 'StarField_MultiLayer';

    const disposables: { dispose: () => void }[] = [];
    const size = dna.universeSize;

    // Layer 1: Distant background stars (high count, small size, subtle twinkle)
    const layer1Count = Math.floor(1800 * dna.starDensity);
    const layer1Geo = new THREE.BufferGeometry();
    const l1Pos = new Float32Array(layer1Count * 3);
    const l1Col = new Float32Array(layer1Count * 3);
    const l1Twinkle = new Float32Array(layer1Count);

    for (let i = 0; i < layer1Count; i++) {
      const idx = i * 3;
      const radius = rng.range(size * 0.8, size * 1.5);
      const theta = rng.next() * Math.PI * 2;
      const phi = Math.acos(rng.range(-1, 1));
      l1Pos[idx] = radius * Math.sin(phi) * Math.cos(theta);
      l1Pos[idx + 1] = radius * Math.cos(phi);
      l1Pos[idx + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const color = new THREE.Color(rng.choice(SPECTRAL_COLORS));
      l1Col[idx] = color.r;
      l1Col[idx + 1] = color.g;
      l1Col[idx + 2] = color.b;

      l1Twinkle[i] = rng.next() * Math.PI * 2;
    }

    layer1Geo.setAttribute('position', new THREE.BufferAttribute(l1Pos, 3));
    layer1Geo.setAttribute('color', new THREE.BufferAttribute(l1Col, 3));
    layer1Geo.setAttribute('twinklePhase', new THREE.BufferAttribute(l1Twinkle, 1));

    const layer1Mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBrightness: { value: dna.starBrightness }
      },
      vertexShader: `
        attribute float twinklePhase;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uBrightness;

        void main() {
          vColor = color;
          float twinkle = 0.5 + 0.5 * sin(uTime * 2.0 + twinklePhase);
          vAlpha = twinkle * uBrightness;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (1.8 + twinkle * 0.8) * (180.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float intensity = smoothstep(0.5, 0.0, dist);
          gl_FragColor = vec4(vColor, intensity * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    const layer1Points = new THREE.Points(layer1Geo, layer1Mat);
    group.add(layer1Points);
    disposables.push(layer1Geo, layer1Mat);

    // Layer 2: Medium distance stars (moderate parallax, rich colors)
    const layer2Count = Math.floor(900 * dna.starDensity);
    const layer2Geo = new THREE.BufferGeometry();
    const l2Pos = new Float32Array(layer2Count * 3);
    const l2Col = new Float32Array(layer2Count * 3);

    for (let i = 0; i < layer2Count; i++) {
      const idx = i * 3;
      const radius = rng.range(size * 0.4, size * 0.9);
      const theta = rng.next() * Math.PI * 2;
      const phi = Math.acos(rng.range(-1, 1));
      l2Pos[idx] = radius * Math.sin(phi) * Math.cos(theta);
      l2Pos[idx + 1] = radius * Math.cos(phi);
      l2Pos[idx + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const color = new THREE.Color(rng.choice(SPECTRAL_COLORS));
      l2Col[idx] = color.r;
      l2Col[idx + 1] = color.g;
      l2Col[idx + 2] = color.b;
    }

    layer2Geo.setAttribute('position', new THREE.BufferAttribute(l2Pos, 3));
    layer2Geo.setAttribute('color', new THREE.BufferAttribute(l2Col, 3));

    const layer2Mat = new THREE.PointsMaterial({
      size: 3.2 * dna.starBrightness,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const layer2Points = new THREE.Points(layer2Geo, layer2Mat);
    group.add(layer2Points);
    disposables.push(layer2Geo, layer2Mat);

    // Layer 3: Near stars (high parallax)
    const layer3Count = Math.floor(300 * dna.starDensity);
    const layer3Geo = new THREE.BufferGeometry();
    const l3Pos = new Float32Array(layer3Count * 3);
    const l3Col = new Float32Array(layer3Count * 3);

    for (let i = 0; i < layer3Count; i++) {
      const idx = i * 3;
      l3Pos[idx] = rng.range(-size * 0.4, size * 0.4);
      l3Pos[idx + 1] = rng.range(-size * 0.4, size * 0.4);
      l3Pos[idx + 2] = rng.range(-size * 0.4, size * 0.4);

      const color = new THREE.Color(rng.choice([dna.nebulaColor.primary, dna.nebulaColor.accent, '#FFFFFF']));
      l3Col[idx] = color.r;
      l3Col[idx + 1] = color.g;
      l3Col[idx + 2] = color.b;
    }

    layer3Geo.setAttribute('position', new THREE.BufferAttribute(l3Pos, 3));
    layer3Geo.setAttribute('color', new THREE.BufferAttribute(l3Col, 3));

    const layer3Mat = new THREE.PointsMaterial({
      size: 4.5 * dna.starBrightness,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const layer3Points = new THREE.Points(layer3Geo, layer3Mat);
    group.add(layer3Points);
    disposables.push(layer3Geo, layer3Mat);

    // Layer 4: Interactive Cosmic Dust (floating particles responsive to touch & drag)
    const dustCount = Math.floor(500 * dna.particleDensity);
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustVel = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      const idx = i * 3;
      dustPos[idx] = rng.range(-size * 0.25, size * 0.25);
      dustPos[idx + 1] = rng.range(-size * 0.25, size * 0.25);
      dustPos[idx + 2] = rng.range(-size * 0.25, size * 0.25);

      dustVel[idx] = rng.range(-0.5, 0.5) * dna.particleSpeed;
      dustVel[idx + 1] = rng.range(-0.5, 0.5) * dna.particleSpeed;
      dustVel[idx + 2] = rng.range(-0.5, 0.5) * dna.particleSpeed;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

    const dustMat = new THREE.PointsMaterial({
      color: new THREE.Color(dna.nebulaColor.primary),
      size: 2.2,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const dustPoints = new THREE.Points(dustGeo, dustMat);
    group.add(dustPoints);
    disposables.push(dustGeo, dustMat);

    // Shooting star system (object pool of 3 shooting stars)
    const shootingStars: ShootingStar[] = [];
    const shootingStarMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
    disposables.push(shootingStarMat);

    for (let s = 0; s < 3; s++) {
      const starGeo = new THREE.BufferGeometry();
      const linePositions = new Float32Array(6); // 2 vertices
      starGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      const starMesh = new THREE.Line(starGeo, shootingStarMat.clone());
      starMesh.visible = false;
      group.add(starMesh);
      disposables.push(starGeo, starMesh.material as THREE.Material);

      shootingStars.push({
        active: false,
        start: new THREE.Vector3(),
        end: new THREE.Vector3(),
        current: new THREE.Vector3(),
        speed: 120,
        progress: 0,
        color: new THREE.Color(0xffffff),
        mesh: starMesh
      });
    }

    const triggerShootingStar = () => {
      const available = shootingStars.find(s => !s.active);
      if (!available) return;

      const spawnRadius = size * 0.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 1.6 - 0.8);

      available.start.set(
        spawnRadius * Math.sin(phi) * Math.cos(theta),
        spawnRadius * Math.cos(phi),
        spawnRadius * Math.sin(phi) * Math.sin(theta)
      );

      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();

      available.end.copy(available.start).addScaledVector(dir, size * 0.4);
      available.current.copy(available.start);
      available.progress = 0;
      available.speed = (80 + Math.random() * 60) * dna.particleSpeed;
      available.active = true;
      available.mesh.visible = true;
    };

    let nextAutoStarTime = 4.0;

    const update = (time: number, delta: number, input?: TouchPointerState, motion?: MotionData) => {
      layer1Mat.uniforms.uTime.value = time;

      // Parallax shifts based on input & motion
      const tiltX = (motion?.isAvailable ? motion.tiltX * 0.5 : (input?.x ?? 0) * 0.5);
      const tiltY = (motion?.isAvailable ? motion.tiltY * 0.5 : (input?.y ?? 0) * 0.5);

      layer1Points.rotation.y = time * 0.002 + tiltX * 0.02;
      layer1Points.rotation.x = tiltY * 0.02;

      layer2Points.rotation.y = time * 0.006 + tiltX * 0.06;
      layer2Points.rotation.x = tiltY * 0.06;

      layer3Points.rotation.y = time * 0.012 + tiltX * 0.15;
      layer3Points.rotation.x = tiltY * 0.15;

      // Dust physics
      const posAttr = dustGeo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const bound = size * 0.3;

      const touchForceX = input?.isDown ? (input.deltaX || 0) * 10 : 0;
      const touchForceY = input?.isDown ? -(input.deltaY || 0) * 10 : 0;

      for (let i = 0; i < dustCount; i++) {
        const idx = i * 3;
        arr[idx] += (dustVel[idx] + touchForceX) * delta;
        arr[idx + 1] += (dustVel[idx + 1] + touchForceY) * delta;
        arr[idx + 2] += dustVel[idx + 2] * delta;

        // Wrap around bounds
        if (arr[idx] > bound) arr[idx] = -bound;
        else if (arr[idx] < -bound) arr[idx] = bound;
        if (arr[idx + 1] > bound) arr[idx + 1] = -bound;
        else if (arr[idx + 1] < -bound) arr[idx + 1] = bound;
        if (arr[idx + 2] > bound) arr[idx + 2] = -bound;
        else if (arr[idx + 2] < -bound) arr[idx + 2] = bound;
      }
      posAttr.needsUpdate = true;

      // Shooting stars logic
      nextAutoStarTime -= delta * dna.eventFrequency;
      if (nextAutoStarTime <= 0) {
        triggerShootingStar();
        nextAutoStarTime = 5.0 + Math.random() * 8.0;
      }

      shootingStars.forEach(star => {
        if (!star.active) return;
        star.progress += (delta * star.speed) / (size * 0.4);

        if (star.progress >= 1.0) {
          star.active = false;
          star.mesh.visible = false;
        } else {
          const tailProgress = Math.max(0, star.progress - 0.15);
          const headPos = star.start.clone().lerp(star.end, star.progress);
          const tailPos = star.start.clone().lerp(star.end, tailProgress);

          const geom = star.mesh.geometry as THREE.BufferGeometry;
          const pos = geom.attributes.position.array as Float32Array;
          pos[0] = headPos.x;
          pos[1] = headPos.y;
          pos[2] = headPos.z;
          pos[3] = tailPos.x;
          pos[4] = tailPos.y;
          pos[5] = tailPos.z;
          geom.attributes.position.needsUpdate = true;

          const alpha = Math.sin(star.progress * Math.PI);
          (star.mesh.material as THREE.LineBasicMaterial).opacity = alpha * 0.9;
        }
      });
    };

    const dispose = () => {
      disposables.forEach(d => d.dispose());
    };

    return { group, update, triggerShootingStar, dispose };
  }
}
