import * as THREE from 'three';
import { LifeEntityInstance } from './WorldEntityManager';
import { EcosystemDNA } from './EcosystemDNA';
import { TimeOfDay, WeatherType } from '../environment/types/environmentDNA';

export class EnvironmentBehaviorEngine {
  /**
   * Applies flocking, wandering, day/night cycles, and weather forces to entity instances.
   */
  public static updateBehaviors(
    entities: LifeEntityInstance[],
    dna: EcosystemDNA,
    timeOfDay: TimeOfDay,
    daylight: number,
    weatherType: WeatherType,
    windSpeed: number,
    delta: number
  ) {
    if (!dna.ecosystemEnabled) return;

    const baseSpeed = dna.movementSpeed;
    const flocking = dna.flockingStrength;

    // Environmental modifiers
    const isNight = timeOfDay === 'night' || timeOfDay === 'twilight';
    const isStormy = weatherType === 'storm' || weatherType === 'heavy-rain';

    const windVec = new THREE.Vector3(windSpeed * 0.4, 0, windSpeed * 0.1);

    for (let i = 0; i < entities.length; i++) {
      const ent = entities[i];
      if (!ent.active) continue;

      // Update flapping / wing phase
      ent.wingPhase += delta * ent.wingSpeed * dna.activityLevel;

      // 1. Time of Day Response
      let timeSpeedMod = 1.0;
      if (ent.type === 'birds') {
        timeSpeedMod = isNight ? 0.25 : 1.0;
      } else if (ent.type === 'butterflies') {
        timeSpeedMod = isNight ? 0.05 : 1.0;
      } else if (ent.type === 'fireflies') {
        timeSpeedMod = isNight ? 1.4 : 0.15;
      } else if (ent.type === 'drones' || ent.type === 'light-traffic') {
        timeSpeedMod = isNight ? 1.3 : 1.0;
      }

      // 2. Weather Response
      let weatherSpeedMod = 1.0;
      if (isStormy && (ent.type === 'birds' || ent.type === 'butterflies')) {
        weatherSpeedMod = 0.4;
      }

      // 3. Wandering & Target Seeking
      ent.activityTimer -= delta;
      if (ent.activityTimer <= 0) {
        ent.activityTimer = 2.0 + Math.random() * 4.0;
        // Pick new random wander target around center
        const radius = ent.type === 'clouds' ? 22 : 12;
        ent.target.set(
          (Math.random() - 0.5) * radius,
          ent.position.y + (Math.random() - 0.5) * 3.0,
          (Math.random() - 0.5) * radius
        );
        // Altitude limits per entity type
        if (ent.type === 'clouds') {
          ent.target.y = 11 + Math.random() * 4;
        } else if (ent.type === 'fish' || ent.type === 'underwater-creatures') {
          ent.target.y = -3.5 + Math.random() * 3.0;
        } else if (ent.type === 'birds') {
          ent.target.y = isNight ? 2.5 + Math.random() * 2 : 4.0 + Math.random() * 7;
        } else if (ent.type === 'butterflies' || ent.type === 'fireflies') {
          ent.target.y = 0.8 + Math.random() * 2.5;
        }
      }

      // Steer towards wander target
      const toTarget = new THREE.Vector3().subVectors(ent.target, ent.position);
      const distToTarget = toTarget.length();
      if (distToTarget > 0.1) {
        toTarget.normalize().multiplyScalar(1.5 * delta);
        ent.velocity.add(toTarget);
      }

      // 4. Localized Flocking (Boids-like Cohesion/Separation for Birds & Fish)
      if (flocking > 0.1 && (ent.type === 'birds' || ent.type === 'fish')) {
        // Sample 3 random neighbors to keep compute overhead minimal
        let count = 0;
        const avgVel = new THREE.Vector3();
        const separation = new THREE.Vector3();

        for (let j = 0; j < 4; j++) {
          const neighborIdx = (i + j * 7 + 1) % entities.length;
          const neighbor = entities[neighborIdx];
          if (neighbor.type === ent.type && neighbor.active && neighbor !== ent) {
            const diff = new THREE.Vector3().subVectors(ent.position, neighbor.position);
            const d = diff.length();
            if (d < 3.5 && d > 0.001) {
              separation.add(diff.normalize().divideScalar(d)); // Repulsion from neighbor
              avgVel.add(neighbor.velocity);
              count++;
            }
          }
        }

        if (count > 0) {
          separation.multiplyScalar(2.0 * flocking * delta);
          avgVel.divideScalar(count).multiplyScalar(1.2 * flocking * delta);
          ent.velocity.add(separation);
          ent.velocity.add(avgVel);
        }
      }

      // 5. Environmental Wind Force
      if (ent.type === 'leaves' || ent.type === 'drifting-spores' || ent.type === 'clouds') {
        ent.velocity.addScaledVector(windVec, delta * 0.6);
        if (ent.type === 'leaves') {
          // Leaves tumble down with gravity, then reset
          ent.velocity.y -= 0.8 * delta;
          if (ent.position.y < 0.2) {
            ent.position.y = 5.0 + Math.random() * 4.0;
            ent.position.x = (Math.random() - 0.5) * 20;
            ent.position.z = (Math.random() - 0.5) * 20;
          }
        }
      } else if (ent.type === 'volcanic-embers') {
        // Embers rise buoyantly with thermal convection
        ent.velocity.y += 1.2 * delta;
        ent.velocity.x += (Math.sin(ent.wingPhase) * 0.4 + windVec.x * 0.5) * delta;
        if (ent.position.y > 8.0) {
          ent.position.y = 0.4 + Math.random() * 0.5;
          ent.position.x = (Math.random() - 0.5) * 14;
          ent.position.z = (Math.random() - 0.5) * 14;
          ent.velocity.set(0, 0.5 + Math.random(), 0);
        }
      }

      // Drag / damping to avoid infinite acceleration
      const effectiveSpeed = baseSpeed * timeSpeedMod * weatherSpeedMod;
      ent.velocity.multiplyScalar(0.96);

      // Clamp speed
      const speed = ent.velocity.length();
      const maxSpeed = 3.5 * effectiveSpeed;
      if (speed > maxSpeed) {
        ent.velocity.multiplyScalar(maxSpeed / speed);
      }

      // Apply velocity to position
      ent.position.addScaledVector(ent.velocity, delta * 2.5);

      // Boundary soft-wrapping
      if (ent.position.x > 20) ent.position.x = -20;
      if (ent.position.x < -20) ent.position.x = 20;
      if (ent.position.z > 20) ent.position.z = -20;
      if (ent.position.z < -20) ent.position.z = 20;
    }
  }
}
