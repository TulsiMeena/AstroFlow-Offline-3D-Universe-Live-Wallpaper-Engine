import * as THREE from 'three';
import { TouchPointerState, MotionData } from '../types/engine';
import { InteractionField } from '../engine/physics/InteractionField';
import { RippleField } from '../engine/physics/RippleField';
import { LifeEntityInstance } from './WorldEntityManager';
import { EcosystemDNA } from './EcosystemDNA';

export class EntityInteractionSystem {
  private interactionField: InteractionField;
  private rippleField: RippleField;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private touchWorldPos: THREE.Vector3 = new THREE.Vector3();
  private groundPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  constructor() {
    this.interactionField = new InteractionField({
      mode: 'repulsion',
      strength: 2.0,
      radius: 6.5,
      falloff: 1.5
    });
    this.rippleField = new RippleField(12);
  }

  public getInteractionField(): InteractionField {
    return this.interactionField;
  }

  public getRippleField(): RippleField {
    return this.rippleField;
  }

  public update(
    time: number,
    delta: number,
    camera: THREE.PerspectiveCamera,
    dna: EcosystemDNA,
    entities: LifeEntityInstance[],
    input?: TouchPointerState,
    motion?: MotionData
  ) {
    this.interactionField.update(delta);
    this.rippleField.update(time);

    // 1. Process Touch & Screen Interaction
    if (input && input.isDown) {
      // Map screen [-1, 1] coords to 3D world ray
      this.raycaster.setFromCamera(new THREE.Vector2(input.x, input.y), camera);
      const intersection = new THREE.Vector3();

      if (this.raycaster.ray.intersectPlane(this.groundPlane, intersection)) {
        this.touchWorldPos.copy(intersection);
      } else {
        // Fallback: point along ray at camera distance
        this.raycaster.ray.at(10, this.touchWorldPos);
      }

      this.interactionField.setPosition(
        this.touchWorldPos.x,
        this.touchWorldPos.y,
        this.touchWorldPos.z
      );
      this.interactionField.strength = 3.5 * dna.touchReaction;

      // Spawn subtle water / energy ripple
      if (Math.random() < 0.15) {
        this.rippleField.spawnRipple(
          this.touchWorldPos.x,
          this.touchWorldPos.z,
          1.5 * dna.touchReaction
        );
      }

      // Scatter nearby entities
      const radiusSq = 8.0 * 8.0;
      const touchRepulse = 18.0 * dna.touchReaction * delta;

      for (let i = 0; i < entities.length; i++) {
        const ent = entities[i];
        if (!ent.active) continue;

        const dx = ent.position.x - this.touchWorldPos.x;
        const dy = ent.position.y - this.touchWorldPos.y;
        const dz = ent.position.z - this.touchWorldPos.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < radiusSq && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const factor = (1.0 - dist / 8.0) * touchRepulse;
          const inv = 1.0 / dist;

          // Birds, butterflies, insects startle upwards and away
          if (ent.type === 'birds' || ent.type === 'butterflies' || ent.type === 'insects') {
            ent.velocity.x += dx * inv * factor * 1.5;
            ent.velocity.y += (dy * inv + 0.6) * factor * 2.0; // startled lift
            ent.velocity.z += dz * inv * factor * 1.5;
            ent.wingSpeed = 16.0; // frantic flapping
          }
          // Fish dart away
          else if (ent.type === 'fish' || ent.type === 'underwater-creatures') {
            ent.velocity.x += dx * inv * factor * 1.8;
            ent.velocity.z += dz * inv * factor * 1.8;
          }
          // Fireflies flash and scatter
          else if (ent.type === 'fireflies') {
            ent.velocity.x += dx * inv * factor * 1.2;
            ent.velocity.y += (Math.random() - 0.5) * factor;
            ent.velocity.z += dz * inv * factor * 1.2;
            ent.wingPhase += 5.0; // flash phase
          }
          // Embers / cyber particles scatter along touch direction
          else {
            ent.velocity.x += dx * inv * factor * 1.4;
            ent.velocity.y += Math.abs(dy * inv) * factor * 1.2;
            ent.velocity.z += dz * inv * factor * 1.4;
          }
        }
      }
    } else {
      this.interactionField.strength = 0;
    }

    // 2. Process Gyro & Phone Motion Reaction
    if (motion && motion.isAvailable && dna.motionReaction > 0) {
      const tiltXForce = motion.tiltX * 0.4 * dna.motionReaction * delta;
      const tiltYForce = motion.tiltY * 0.3 * dna.motionReaction * delta;

      for (let i = 0; i < entities.length; i++) {
        const ent = entities[i];
        if (!ent.active) continue;

        // Subtle inertial drift
        if (ent.type === 'clouds' || ent.type === 'drifting-spores' || ent.type === 'leaves') {
          ent.velocity.x += tiltXForce * 1.2;
          ent.velocity.z += tiltYForce * 1.2;
        } else if (ent.type === 'birds' || ent.type === 'drones') {
          // Bank into tilt
          ent.velocity.x += tiltXForce * 0.6;
        }
      }
    }
  }
}
