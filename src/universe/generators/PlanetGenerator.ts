import * as THREE from 'three';
import { PlanetType, WorldDNA } from '../types/worldDNA';
import { SeededRNG } from '../seed/SeededRNG';

export interface PlanetOptions {
  radius?: number;
  type?: PlanetType;
  hasRings?: boolean;
  moonCount?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
}

export interface ProceduralPlanetInstance {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  cloudsMesh?: THREE.Mesh;
  ringsMesh?: THREE.Mesh;
  moons: { mesh: THREE.Mesh; distance: number; speed: number; angle: number }[];
  orbitRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
  update: (time: number, delta: number) => void;
  dispose: () => void;
}

export class PlanetGenerator {
  /**
   * Creates a fully procedural planet with custom GLSL surface shader, atmosphere, rings, and moons.
   */
  public static createPlanet(
    dna: WorldDNA,
    rng: SeededRNG,
    options: PlanetOptions = {}
  ): ProceduralPlanetInstance {
    const group = new THREE.Group();
    group.name = `Planet_${rng.int(1000, 9999)}`;

    const disposables: { dispose: () => void }[] = [];
    const radius = options.radius ?? rng.range(dna.planetSizeRange[0], dna.planetSizeRange[1]);
    const type: PlanetType = options.type ?? rng.choice(['rocky', 'gas-giant', 'ice', 'lava', 'ocean', 'alien']);

    // Build custom procedural shader material for the planet surface based on type
    const surfaceShader = PlanetGenerator.getPlanetShader(type, dna, rng);
    const bodyMat = new THREE.ShaderMaterial(surfaceShader);
    const bodyGeo = new THREE.SphereGeometry(radius, 32, 32);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(bodyMesh);
    disposables.push(bodyGeo, bodyMat);

    // Atmospheric cloud layer for ocean or alien worlds
    let cloudsMesh: THREE.Mesh | undefined;
    if (type === 'ocean' || type === 'alien') {
      const cloudGeo = new THREE.SphereGeometry(radius * 1.025, 24, 24);
      const cloudMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uCloudColor: { value: new THREE.Color(type === 'ocean' ? '#FFFFFF' : '#A7F3D0') }
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          uniform float uTime;
          uniform vec3 uCloudColor;

          float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                       mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
          }

          void main() {
            vec2 uv = vUv * 6.0 + vec2(uTime * 0.04, 0.0);
            float n = noise(uv) * 0.5 + noise(uv * 2.0) * 0.25 + noise(uv * 4.0) * 0.125;
            float alpha = smoothstep(0.48, 0.65, n) * 0.75;
            float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
            gl_FragColor = vec4(uCloudColor, alpha * (0.4 + 0.6 * rim));
          }
        `,
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false
      });
      cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
      group.add(cloudsMesh);
      disposables.push(cloudGeo, cloudMat);
    }

    // Planetary Rings (e.g. for gas giants or rare rocky worlds)
    let ringsMesh: THREE.Mesh | undefined;
    const hasRings = options.hasRings ?? (type === 'gas-giant' ? rng.boolean(0.7) : rng.boolean(0.2));
    if (hasRings) {
      const innerRadius = radius * 1.4;
      const outerRadius = radius * 2.3;
      const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 64);
      // Align ring horizontally
      ringGeo.rotateX(Math.PI / 2);

      const ringMat = new THREE.ShaderMaterial({
        uniforms: {
          uInner: { value: innerRadius },
          uOuter: { value: outerRadius },
          uColor1: { value: new THREE.Color(dna.nebulaColor.accent || '#E0C097') },
          uColor2: { value: new THREE.Color(dna.nebulaColor.secondary || '#5A3D28') }
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
          uniform float uInner;
          uniform float uOuter;
          uniform vec3 uColor1;
          uniform vec3 uColor2;

          void main() {
            float dist = length(vPos.xz);
            float normDist = (dist - uInner) / (uOuter - uInner);

            // Procedural banded stripes
            float bands = sin(normDist * 50.0) * 0.5 + 0.5;
            float gap = smoothstep(0.45, 0.47, normDist) * (1.0 - smoothstep(0.53, 0.55, normDist)); // Cassini division
            vec3 col = mix(uColor1, uColor2, bands);
            float alpha = (0.35 + 0.5 * bands) * (1.0 - gap * 0.9);
            alpha *= smoothstep(0.0, 0.05, normDist) * (1.0 - smoothstep(0.95, 1.0, normDist));

            gl_FragColor = vec4(col, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      ringsMesh = new THREE.Mesh(ringGeo, ringMat);
      ringsMesh.rotation.x = rng.range(-0.35, 0.35);
      ringsMesh.rotation.z = rng.range(-0.25, 0.25);
      group.add(ringsMesh);
      disposables.push(ringGeo, ringMat);
    }

    // Moons
    const moonCount = options.moonCount ?? (type === 'gas-giant' ? rng.int(1, 3) : rng.boolean(0.4) ? 1 : 0);
    const moons: { mesh: THREE.Mesh; distance: number; speed: number; angle: number }[] = [];

    for (let m = 0; m < moonCount; m++) {
      const moonRadius = radius * rng.range(0.12, 0.28);
      const moonDist = radius * rng.range(2.8, 5.0) + m * (radius * 1.5);
      const moonGeo = new THREE.SphereGeometry(moonRadius, 14, 14);
      const moonMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(rng.choice(['#A0A0A0', '#D4D4D8', '#E2E8F0', '#B45309'])),
        roughness: 0.9,
        metalness: 0.1
      });
      const moonMesh = new THREE.Mesh(moonGeo, moonMat);
      group.add(moonMesh);
      disposables.push(moonGeo, moonMat);

      moons.push({
        mesh: moonMesh,
        distance: moonDist,
        speed: rng.range(0.8, 2.2) * (rng.boolean() ? 1 : -1),
        angle: rng.next() * Math.PI * 2
      });
    }

    const orbitRadius = options.orbitRadius ?? 0;
    const orbitSpeed = options.orbitSpeed ?? (0.3 / Math.sqrt(Math.max(1, orbitRadius * 0.1)));
    let orbitAngle = rng.next() * Math.PI * 2;
    const spinSpeed = rng.range(0.2, 0.8) * (rng.boolean() ? 1 : -1);

    const update = (time: number, delta: number) => {
      // Planet axial rotation
      bodyMesh.rotation.y += delta * spinSpeed;
      if (bodyMat.uniforms.uTime) {
        bodyMat.uniforms.uTime.value = time;
      }

      if (cloudsMesh) {
        cloudsMesh.rotation.y += delta * (spinSpeed * 1.25);
        (cloudsMesh.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
      }

      // Moon orbits
      moons.forEach(m => {
        m.angle += delta * m.speed * dna.orbitSpeed;
        m.mesh.position.set(
          Math.cos(m.angle) * m.distance,
          Math.sin(m.angle * 0.5) * (m.distance * 0.2),
          Math.sin(m.angle) * m.distance
        );
      });

      // System orbit
      if (orbitRadius > 0) {
        orbitAngle += delta * orbitSpeed * dna.orbitSpeed;
        group.position.set(
          Math.cos(orbitAngle) * orbitRadius,
          Math.sin(orbitAngle * 0.3) * (orbitRadius * 0.05),
          Math.sin(orbitAngle) * orbitRadius
        );
      }
    };

    const dispose = () => {
      disposables.forEach(d => d.dispose());
    };

    return {
      group,
      bodyMesh,
      cloudsMesh,
      ringsMesh,
      moons,
      orbitRadius,
      orbitSpeed,
      orbitAngle,
      update,
      dispose
    };
  }

  /**
   * Generates procedural GLSL shaders for each of the 6 planet archetypes.
   */
  private static getPlanetShader(type: PlanetType, dna: WorldDNA, rng: SeededRNG): THREE.ShaderMaterialParameters {
    const commonVertex = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const simplexFuncs = `
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                       mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                       mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p = p * 2.0;
          a *= 0.5;
        }
        return v;
      }
    `;

    switch (type) {
      case 'gas-giant':
        return {
          uniforms: {
            uTime: { value: 0 },
            uCol1: { value: new THREE.Color(dna.nebulaColor.primary) },
            uCol2: { value: new THREE.Color(dna.nebulaColor.secondary) },
            uCol3: { value: new THREE.Color(dna.nebulaColor.accent) }
          },
          vertexShader: commonVertex,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            uniform float uTime;
            uniform vec3 uCol1;
            uniform vec3 uCol2;
            uniform vec3 uCol3;
            ${simplexFuncs}

            void main() {
              vec3 p = normalize(vPosition) * 4.0;
              float lat = vPosition.y * 5.0;
              float shear = fbm(p + vec3(uTime * 0.05, lat, 0.0));
              float band = sin(lat * 3.0 + shear * 4.0) * 0.5 + 0.5;

              // Great storm spot
              float stormDist = length(vUv - vec2(0.65, 0.4));
              float storm = smoothstep(0.12, 0.0, stormDist);

              vec3 col = mix(uCol1, uCol2, band);
              col = mix(col, uCol3, shear * 0.8 + storm * 0.6);

              // Directional sunlight shading
              vec3 lightDir = normalize(vec3(1.0, 0.8, 1.0));
              float diff = max(0.1, dot(vNormal, lightDir));
              float rim = pow(1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);

              gl_FragColor = vec4(col * diff + uCol1 * rim * 0.4, 1.0);
            }
          `
        };

      case 'lava':
        return {
          uniforms: {
            uTime: { value: 0 }
          },
          vertexShader: commonVertex,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform float uTime;
            ${simplexFuncs}

            void main() {
              vec3 p = normalize(vPosition) * 5.0;
              float n = fbm(p + vec3(0.0, 0.0, uTime * 0.05));
              float fissures = smoothstep(0.48, 0.52, abs(n - 0.5) * 4.0);

              vec3 rock = vec3(0.08, 0.07, 0.08);
              vec3 magma = mix(vec3(1.0, 0.1, 0.0), vec3(1.0, 0.7, 0.0), sin(uTime * 2.0 + n * 10.0) * 0.5 + 0.5);

              vec3 col = mix(magma, rock, fissures);
              vec3 lightDir = normalize(vec3(1.0, 0.8, 1.0));
              float diff = max(0.15, dot(vNormal, lightDir));

              gl_FragColor = vec4(col * diff + (1.0 - fissures) * magma * 0.8, 1.0);
            }
          `
        };

      case 'ice':
        return {
          uniforms: {
            uTime: { value: 0 },
            uBaseCol: { value: new THREE.Color('#E0F2FE') },
            uDeepCol: { value: new THREE.Color('#0284C7') }
          },
          vertexShader: commonVertex,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform vec3 uBaseCol;
            uniform vec3 uDeepCol;
            ${simplexFuncs}

            void main() {
              vec3 p = normalize(vPosition) * 6.0;
              float cracks = fbm(p * 2.0);
              float glacier = fbm(p);

              vec3 col = mix(uDeepCol, uBaseCol, glacier);
              col += vec3(0.3) * smoothstep(0.4, 0.45, cracks);

              vec3 lightDir = normalize(vec3(1.0, 0.8, 1.0));
              float diff = max(0.2, dot(vNormal, lightDir));
              float spec = pow(max(0.0, dot(reflect(-lightDir, vNormal), vec3(0.0, 0.0, 1.0))), 16.0);

              gl_FragColor = vec4(col * diff + vec3(spec * 0.7), 1.0);
            }
          `
        };

      case 'ocean':
        return {
          uniforms: {
            uTime: { value: 0 },
            uLandCol: { value: new THREE.Color('#10B981') },
            uSeaCol: { value: new THREE.Color('#0284C7') }
          },
          vertexShader: commonVertex,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform vec3 uLandCol;
            uniform vec3 uSeaCol;
            ${simplexFuncs}

            void main() {
              vec3 p = normalize(vPosition) * 3.5;
              float elevation = fbm(p);
              float isLand = smoothstep(0.48, 0.52, elevation);

              vec3 col = mix(uSeaCol, uLandCol, isLand);
              vec3 lightDir = normalize(vec3(1.0, 0.8, 1.0));
              float diff = max(0.15, dot(vNormal, lightDir));
              float spec = (1.0 - isLand) * pow(max(0.0, dot(reflect(-lightDir, vNormal), vec3(0.0, 0.0, 1.0))), 24.0);

              gl_FragColor = vec4(col * diff + vec3(spec * 0.8), 1.0);
            }
          `
        };

      case 'alien':
        return {
          uniforms: {
            uTime: { value: 0 },
            uColA: { value: new THREE.Color('#8B5CF6') },
            uColB: { value: new THREE.Color('#EC4899') },
            uGlowCol: { value: new THREE.Color('#10B981') }
          },
          vertexShader: commonVertex,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform float uTime;
            uniform vec3 uColA;
            uniform vec3 uColB;
            uniform vec3 uGlowCol;
            ${simplexFuncs}

            void main() {
              vec3 p = normalize(vPosition) * 4.0;
              float n = fbm(p + vec3(uTime * 0.04, 0.0, 0.0));
              float veins = sin(n * 20.0) * 0.5 + 0.5;

              vec3 col = mix(uColA, uColB, n);
              col = mix(col, uGlowCol, veins * 0.4);

              vec3 lightDir = normalize(vec3(1.0, 0.8, 1.0));
              float diff = max(0.2, dot(vNormal, lightDir));
              float rim = pow(1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);

              gl_FragColor = vec4(col * diff + uGlowCol * rim * 0.6, 1.0);
            }
          `
        };

      case 'rocky':
      default:
        return {
          uniforms: {
            uColBase: { value: new THREE.Color('#94A3B8') },
            uColDark: { value: new THREE.Color('#334155') }
          },
          vertexShader: commonVertex,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform vec3 uColBase;
            uniform vec3 uColDark;
            ${simplexFuncs}

            void main() {
              vec3 p = normalize(vPosition) * 6.0;
              float crater = fbm(p * 2.0);
              float ridge = fbm(p);

              vec3 col = mix(uColDark, uColBase, ridge);
              col *= (0.7 + 0.3 * crater);

              vec3 lightDir = normalize(vec3(1.0, 0.8, 1.0));
              float diff = max(0.12, dot(vNormal, lightDir));

              gl_FragColor = vec4(col * diff, 1.0);
            }
          `
        };
    }
  }
}
