import * as THREE from 'three';
import { TouchPointerState, MotionData } from '../types/engine';
import { ForceFieldManager } from './ForceFieldManager';
import { ShockwaveSystem } from './ShockwaveSystem';
import { FluidReactionSystem } from './FluidReactionSystem';
import { ParticlePhysicsSystem } from './ParticlePhysicsSystem';
import { GravitySystem } from './GravitySystem';
import { WindSystem } from './WindSystem';

export class InteractionReactionManager {
  private activeTouchFieldId: string | null = null;
  private activeLongPressId: string | null = null;
  private lastDragPos: THREE.Vector3 = new THREE.Vector3();
  private touchWorldPos: THREE.Vector3 = new THREE.Vector3();
  private tempVec: THREE.Vector3 = new THREE.Vector3();
  private isTouching: boolean = false;
  private interactionStrength: number = 1.0;

  constructor(interactionStrength: number = 1.0) {
    this.interactionStrength = interactionStrength;
  }

  public setStrength(strength: number): void {
    this.interactionStrength = Math.max(0.1, strength);
  }

  public getStrength(): number {
    return this.interactionStrength;
  }

  /**
   * Process touch inputs and phone motion sensor data
   */
  public process(
    input: TouchPointerState,
    motion: MotionData,
    delta: number,
    time: number,
    forceFields: ForceFieldManager,
    shockwaves: ShockwaveSystem,
    fluid: FluidReactionSystem,
    particles: ParticlePhysicsSystem,
    gravity: GravitySystem,
    wind: WindSystem
  ): void {
    // 1. Convert 2D screen pointer (-1 to 1) to 3D world plane position
    const wx = input.worldX || input.x * 12.0;
    const wy = input.worldY || input.y * 8.0;
    const wz = 0;
    this.touchWorldPos.set(wx, wy, wz);

    // 2. Gesture Handling
    // A. TAP -> Energy pulse / Shockwave + Fluid splash
    if (input.gestureType === 'tap') {
      shockwaves.triggerShockwave({
        origin: this.touchWorldPos,
        maxRadius: 12.0 * this.interactionStrength,
        speed: 18.0,
        strength: 2.5 * this.interactionStrength,
        color: 0x00f0ff,
      });

      fluid.addDisturbance(wx, wz, 0.8 * this.interactionStrength, 1.8);
      particles.emitAt(this.touchWorldPos, 16, 0x00f0ff);
    }

    // B. DRAG -> Attraction point + Particle trail + Fluid ripple
    if (input.isDown) {
      this.isTouching = true;

      if (!this.activeTouchFieldId) {
        this.activeTouchFieldId = `touch_attraction_${Date.now()}`;
        forceFields.addForceField({
          id: this.activeTouchFieldId,
          type: 'attraction',
          position: this.touchWorldPos,
          strength: 2.2 * this.interactionStrength,
          radius: 7.0,
          falloff: 'gaussian',
          lifetime: 0, // continuous while down
          color: 0x00ff88,
        });
      } else {
        const field = forceFields.getField(this.activeTouchFieldId);
        if (field) {
          field.position.copy(this.touchWorldPos);
        }
      }

      // Trail particles & fluid ripple if moved
      this.tempVec.subVectors(this.touchWorldPos, this.lastDragPos);
      if (this.tempVec.length() > 0.08) {
        particles.emitAt(this.touchWorldPos, 4, 0x00ffa3);
        fluid.addDisturbance(wx, wz, 0.3 * this.interactionStrength, 1.2);
        this.lastDragPos.copy(this.touchWorldPos);
      }
    } else {
      if (this.activeTouchFieldId) {
        forceFields.removeForceField(this.activeTouchFieldId);
        this.activeTouchFieldId = null;
      }
      this.isTouching = false;
    }

    // C. LONG PRESS -> Gravity well / Vortex field
    if (input.gestureType === 'longPress' && input.isDown) {
      if (!this.activeLongPressId) {
        this.activeLongPressId = `vortex_well_${Date.now()}`;
        forceFields.addForceField({
          id: this.activeLongPressId,
          type: 'vortex',
          position: this.touchWorldPos,
          strength: 3.5 * this.interactionStrength,
          radius: 9.0,
          angularVelocity: 3.5,
          lifetime: 1.5,
          color: 0xd946ef,
        });
        fluid.addVortex(wx, wz, 1.2 * this.interactionStrength, 2.5);
        particles.emitAt(this.touchWorldPos, 20, 0xd946ef);
      }
    } else if (this.activeLongPressId) {
      const field = forceFields.getField(this.activeLongPressId);
      if (field && field.lifetime <= 0) {
        this.activeLongPressId = null;
      }
    }

    // D. SWIPE -> Directional force impulse
    if (input.gestureType === 'swipe' && input.swipeDirection) {
      const dir = new THREE.Vector3(
        input.swipeDirection.x * input.swipeDirection.speed,
        input.swipeDirection.y * input.swipeDirection.speed,
        0
      ).normalize();

      forceFields.addForceField({
        type: 'impulse',
        position: this.touchWorldPos,
        strength: 4.0 * this.interactionStrength,
        radius: 10.0,
        direction: dir,
        lifetime: 0.6,
        color: 0xffdd00,
      });

      fluid.addDisturbance(wx, wz, 0.6 * this.interactionStrength, 2.0);
      particles.emitAt(this.touchWorldPos, 14, 0xffdd00);
    }

    // E. PINCH -> Zoom / Radial repulsive burst
    if (input.gestureType === 'pinch' && Math.abs(input.pinchScale - 1.0) > 0.15) {
      forceFields.addForceField({
        type: 'repulsion',
        position: this.touchWorldPos,
        strength: 3.0 * this.interactionStrength,
        radius: 12.0,
        lifetime: 0.4,
        color: 0xff0055,
      });
      shockwaves.triggerShockwave({
        origin: this.touchWorldPos,
        maxRadius: 10.0,
        strength: 2.0,
        color: 0xff0055,
      });
    }

    // 3. Phone Motion Fusion (Shake & Tilt)
    // MotionManager sensor events influence gravity and wind
    gravity.updateMotion(motion, delta);

    if (motion.lastMotionEvent === 'SHAKE') {
      // Shake creates an energetic shockwave + gust of wind
      shockwaves.triggerShockwave({
        origin: new THREE.Vector3(0, 0, 0),
        maxRadius: 18.0,
        speed: 22.0,
        strength: 3.0,
        color: 0x00ffa3,
      });
      wind.triggerEventGust(2.5, 1.5);
      fluid.addDisturbance(0, 0, 1.0, 3.5);
    }
  }

  public clear(): void {
    this.activeTouchFieldId = null;
    this.activeLongPressId = null;
    this.isTouching = false;
  }
}
