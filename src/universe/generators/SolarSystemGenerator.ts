import * as THREE from 'three';
import { WorldDNA, PlanetType } from '../types/worldDNA';
import { SeededRNG } from '../seed/SeededRNG';
import { PlanetGenerator, ProceduralPlanetInstance } from './PlanetGenerator';
import { AsteroidBeltGenerator } from './AsteroidBeltGenerator';

export class SolarSystemGenerator {
  public static createSolarSystem(
    dna: WorldDNA,
    rng: SeededRNG
  ): {
    group: THREE.Group;
    planets: ProceduralPlanetInstance[];
    update: (time: number, delta: number) => void;
    pulseSunFlare: () => void;
    dispose: () => void;
  } {
    const group = new THREE.Group();
    group.name = 'SolarSystem_Procedural';

    const disposables: { dispose: () => void }[] = [];

    // Central Sun / Star
    const sunRadius = 4.5 * (dna.starBrightness * 0.8);
    const sunGeo = new THREE.SphereGeometry(sunRadius, 32, 32);
    const sunMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFlare: { value: 0.0 },
        uColorA: { value: new THREE.Color(dna.nebulaColor.accent || '#FFB800') },
        uColorB: { value: new THREE.Color('#FF3B00') }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float uTime;
        uniform float uFlare;
        uniform vec3 uColorA;
        uniform vec3 uColorB;

        float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
        float noise(vec3 x) {
          vec3 i = floor(x); vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
                     mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y);
        }

        void main() {
          vec3 p = normalize(vPosition) * 4.0;
          float n = noise(p + vec3(uTime * 0.2, uTime * 0.15, 0.0));
          vec3 col = mix(uColorA, uColorB, n);
          float rim = pow(1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))), 1.5);
          gl_FragColor = vec4(col + vec3(rim * 0.8) + vec3(uFlare * 0.5), 1.0);
        }
      `
    });

    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    group.add(sunMesh);
    disposables.push(sunGeo, sunMat);

    // Sun corona glow
    const coronaGeo = new THREE.SphereGeometry(sunRadius * 1.35, 24, 24);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(dna.nebulaColor.accent || '#FFB800'),
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    group.add(coronaMesh);
    disposables.push(coronaGeo, coronaMat);

    // Light source
    const pointLight = new THREE.PointLight(0xfff0d0, 2.5, 300, 1.2);
    group.add(pointLight);

    // Orbiting planets
    const planetCount = dna.planetCount;
    const planets: ProceduralPlanetInstance[] = [];
    const planetTypes: PlanetType[] = ['rocky', 'lava', 'ocean', 'gas-giant', 'alien', 'ice'];

    let currentOrbitRadius = sunRadius * 2.8;

    for (let p = 0; p < planetCount; p++) {
      const spacing = rng.range(8, 16);
      currentOrbitRadius += spacing;

      const pType = planetTypes[p % planetTypes.length];
      const planetRadius = rng.range(dna.planetSizeRange[0], dna.planetSizeRange[1]) * (pType === 'gas-giant' ? 1.6 : 1.0);

      // Create faint orbit line
      const orbitGeo = new THREE.BufferGeometry();
      const segments = 64;
      const orbitPositions = new Float32Array((segments + 1) * 3);
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        orbitPositions[s * 3] = Math.cos(theta) * currentOrbitRadius;
        orbitPositions[s * 3 + 1] = 0;
        orbitPositions[s * 3 + 2] = Math.sin(theta) * currentOrbitRadius;
      }
      orbitGeo.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3));
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      group.add(orbitLine);
      disposables.push(orbitGeo, orbitMat);

      const planetInstance = PlanetGenerator.createPlanet(dna, rng.fork(`planet_${p}`), {
        radius: planetRadius,
        type: pType,
        orbitRadius: currentOrbitRadius,
        orbitSpeed: (0.35 / Math.sqrt(currentOrbitRadius * 0.1)) * (0.8 + rng.next() * 0.4)
      });

      group.add(planetInstance.group);
      planets.push(planetInstance);
    }

    // Asteroid belt between planet 2 and 3 if sufficient planets exist
    let asteroidBelt: { group: THREE.Group; update: (t: number, d: number) => void; dispose: () => void } | null = null;
    if (planets.length >= 3) {
      const beltInner = (planets[1].orbitRadius + planets[2].orbitRadius) * 0.45;
      const beltOuter = (planets[1].orbitRadius + planets[2].orbitRadius) * 0.55;
      asteroidBelt = AsteroidBeltGenerator.createAsteroidBelt(rng.fork('belt'), {
        count: 220,
        innerRadius: beltInner,
        outerRadius: beltOuter,
        heightVariation: 1.8
      });
      group.add(asteroidBelt.group);
    }

    let sunFlareIntensity = 0;

    const pulseSunFlare = () => {
      sunFlareIntensity = 1.0;
    };

    const update = (time: number, delta: number) => {
      sunMat.uniforms.uTime.value = time;

      if (sunFlareIntensity > 0.01) {
        sunFlareIntensity = THREE.MathUtils.lerp(sunFlareIntensity, 0, delta * 2.0);
      } else {
        sunFlareIntensity = 0;
      }
      sunMat.uniforms.uFlare.value = sunFlareIntensity;

      const pulse = 1.0 + Math.sin(time * 3.0) * 0.03 + sunFlareIntensity * 0.2;
      coronaMesh.scale.set(pulse, pulse, pulse);

      planets.forEach(p => p.update(time, delta));
      if (asteroidBelt) asteroidBelt.update(time, delta);
    };

    const dispose = () => {
      disposables.forEach(d => d.dispose());
      planets.forEach(p => p.dispose());
      if (asteroidBelt) asteroidBelt.dispose();
    };

    return { group, planets, update, pulseSunFlare, dispose };
  }
}
