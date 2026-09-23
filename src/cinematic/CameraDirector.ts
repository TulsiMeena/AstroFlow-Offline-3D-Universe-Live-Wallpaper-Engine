import * as THREE from 'three';
import { CameraConfig, CameraMode, CameraEventType, AccessibilitySettings } from './types';
import { CameraPathSystem } from './CameraPathSystem';
import { CameraShakeSystem } from './CameraShakeSystem';
import { MotionData, TouchPointerState } from '../types/engine';
import { lerp } from '../utils/math';

export class CameraDirector {
  private camera: THREE.PerspectiveCamera;
  private pathSystem: CameraPathSystem;
  private shakeSystem: CameraShakeSystem;

  // Current interpolated transform states
  private currentPosition = new THREE.Vector3(0, 0, 5);
  private targetPosition = new THREE.Vector3(0, 0, 5);
  private currentLookAt = new THREE.Vector3(0, 0, 0);
  private targetLookAt = new THREE.Vector3(0, 0, 0);

  // Velocity tracking to avoid any sudden jumps
  private velocity = new THREE.Vector3();
  private maxVelocity: number = 25.0; // Units per second limit

  // Free / Orbit state
  private orbitAngle: number = 0;
  private orbitElevation: number = 0.2;
  private orbitDistance: number = 5.5;

  // Infinite zoom accumulator
  private zoomAccumulator: number = 0;

  // Cinematic Event overrides
  private eventZoomOffset: number = 0;
  private eventFovOffset: number = 0;
  private eventDriftTarget = new THREE.Vector3();
  private eventDurationRemaining: number = 0;

  constructor(camera: THREE.PerspectiveCamera, pathSystem: CameraPathSystem, shakeSystem: CameraShakeSystem) {
    this.camera = camera;
    this.pathSystem = pathSystem;
    this.shakeSystem = shakeSystem;

    this.currentPosition.copy(camera.position);
    this.targetPosition.copy(camera.position);
  }

  /**
   * Handle incoming cinematic camera event
   */
  public handleEvent(event: CameraEventType, intensity: number = 1.0, accessibility?: AccessibilitySettings): void {
    if (accessibility?.disableFlashEffects && event === 'lightning') {
      return;
    }

    this.shakeSystem.handleEvent(event, intensity);

    switch (event) {
      case 'meteor-impact':
        // Subtly shakes + zoom kick
        this.eventZoomOffset = -1.2 * intensity;
        this.eventDurationRemaining = 2.5;
        break;
      case 'black-hole':
        // Slow drift toward vortex center + FOV contraction
        this.eventDriftTarget.set(0, 0, -2.5 * intensity);
        this.eventFovOffset = -8 * intensity;
        this.eventDurationRemaining = 5.0;
        break;
      case 'supernova':
        this.eventZoomOffset = 1.5 * intensity;
        this.eventFovOffset = 10 * intensity;
        this.eventDurationRemaining = 4.0;
        break;
      case 'lightning':
        // Quick subtle camera flinch
        this.eventZoomOffset = -0.4 * intensity;
        this.eventDurationRemaining = 0.8;
        break;
      case 'volcano-eruption':
        this.eventDriftTarget.set(0, 1.2 * intensity, 0);
        this.eventDurationRemaining = 3.5;
        break;
      case 'portal-opening':
        // Camera moves smoothly toward portal
        this.eventDriftTarget.set(0, 0, -3.0 * intensity);
        this.eventDurationRemaining = 4.5;
        break;
      case 'energy-explosion':
      case 'shockwave':
        // Controlled pushback from shockwave
        this.eventZoomOffset = 1.8 * intensity;
        this.eventDurationRemaining = 2.0;
        break;
      case 'aurora-burst':
        this.eventFovOffset = 6 * intensity;
        this.eventDurationRemaining = 3.0;
        break;
      case 'ocean-wave':
        this.eventDriftTarget.set(0, 0.8 * intensity, 0);
        this.eventDurationRemaining = 2.8;
        break;
    }
  }

  /**
   * Primary update step for Camera modes & physics-based movement
   */
  public update(
    delta: number,
    time: number,
    config: CameraConfig,
    motion: MotionData | undefined,
    input: TouchPointerState | undefined,
    accessibility: AccessibilitySettings
  ): void {
    // 1. Update Shake System
    this.shakeSystem.update(delta, config.shakeStrength, accessibility);

    // 2. Compute Mode-Specific Target Position and LookAt
    const speedMult = accessibility.reducedMotion ? config.speed * 0.4 : config.speed;
    const effectiveZoom = config.zoom;

    // Decay cinematic event offsets
    if (this.eventDurationRemaining > 0) {
      this.eventDurationRemaining -= delta;
      const decay = Math.min(1.0, delta * 2.5);
      this.eventZoomOffset = lerp(this.eventZoomOffset, 0, decay);
      this.eventFovOffset = lerp(this.eventFovOffset, 0, decay);
      this.eventDriftTarget.lerp(new THREE.Vector3(0, 0, 0), decay);
    } else {
      this.eventZoomOffset = 0;
      this.eventFovOffset = 0;
      this.eventDriftTarget.set(0, 0, 0);
    }

    switch (config.mode) {
      case 'cinematic': {
        // Spline-based graceful drone sweep
        const sample = this.pathSystem.update(delta, speedMult);
        this.targetPosition.copy(sample.position);
        this.targetLookAt.copy(sample.lookAt);
        // Add subtle natural breathing drift
        this.targetPosition.y += Math.sin(time * 0.8) * 0.25;
        break;
      }

      case 'orbit': {
        // Automatic slow circular rotation with touch orbit control
        const autoOrbitSpeed = 0.35 * speedMult;
        this.orbitAngle += autoOrbitSpeed * delta;

        if (input?.isDown && !accessibility.reducedMotion) {
          this.orbitAngle -= input.deltaX * 2.5;
          this.orbitElevation = Math.max(-0.8, Math.min(1.2, this.orbitElevation + input.deltaY * 2.0));
        }

        const radius = (config.orbitRadius || 5.5) / effectiveZoom;
        const x = Math.cos(this.orbitAngle) * radius;
        const z = Math.sin(this.orbitAngle) * radius;
        const y = (config.orbitHeight || 1.5) + this.orbitElevation * 3.0;

        this.targetPosition.set(x, y, z);
        this.targetLookAt.set(0, 0, 0);
        break;
      }

      case 'free': {
        // Interactive free look with pointer & gyro
        const posX = (input?.x ?? 0) * 3.0 * config.motionSensitivity;
        const posY = (input?.y ?? 0) * 2.0 * config.motionSensitivity;
        const posZ = 5.0 / effectiveZoom;

        this.targetPosition.set(posX, posY, posZ);
        this.targetLookAt.set(posX * 0.3, posY * 0.3, 0);
        break;
      }

      case 'follow': {
        // Dynamic follow tracking an imaginary orbital point of interest
        const followX = Math.sin(time * 0.7) * 2.5;
        const followY = Math.cos(time * 0.5) * 1.2;
        const followZ = Math.sin(time * 0.3) * 1.5;

        this.targetLookAt.set(followX, followY, followZ);
        this.targetPosition.set(
          followX + Math.sin(time * 0.3) * 3.5,
          followY + 1.8,
          followZ + (4.5 / effectiveZoom)
        );
        break;
      }

      case 'fly': {
        // Continuous forward flight with gentle banking turns
        const flightTime = time * 0.5 * speedMult;
        const x = Math.sin(flightTime * 0.6) * 4.0;
        const y = 1.5 + Math.cos(flightTime * 0.4) * 1.2;
        const z = 6.0 + Math.sin(flightTime * 0.3) * 3.0;

        this.targetPosition.set(x, y, z / effectiveZoom);
        this.targetLookAt.set(
          x + Math.sin(flightTime * 0.6 + 0.3) * 3.0,
          y - 0.2,
          -10.0
        );
        break;
      }

      case 'macro': {
        // Extreme close-up with shallow depth and micro orbit
        const macroAngle = time * 0.4 * speedMult;
        const radius = 1.8 / effectiveZoom;
        this.targetPosition.set(
          Math.cos(macroAngle) * radius,
          0.4 + Math.sin(macroAngle * 2) * 0.2,
          Math.sin(macroAngle) * radius
        );
        this.targetLookAt.set(0, 0, 0);
        break;
      }

      case 'planet': {
        // High orbital vantage looking down on celestial bodies
        const angle = time * 0.2 * speedMult;
        const distance = 8.5 / effectiveZoom;
        this.targetPosition.set(
          Math.cos(angle) * distance,
          4.0 + Math.sin(time * 0.15) * 1.0,
          Math.sin(angle) * distance
        );
        this.targetLookAt.set(0, -0.5, 0);
        break;
      }

      case 'galaxy': {
        // Wide-angle deep celestial view with subtle drift
        const distance = 14.0 / effectiveZoom;
        this.targetPosition.set(
          Math.sin(time * 0.1) * 3.0,
          3.0 + Math.cos(time * 0.08) * 1.5,
          distance
        );
        this.targetLookAt.set(0, 0, 0);
        break;
      }

      case 'portal': {
        // Smoothly pushes forward through the center portal loop
        const portalCycle = (time * 0.35 * speedMult) % (Math.PI * 2);
        const z = 7.0 - Math.sin(portalCycle) * 5.0;
        this.targetPosition.set(
          Math.sin(portalCycle * 2) * 0.6,
          Math.cos(portalCycle) * 0.4,
          z / effectiveZoom
        );
        this.targetLookAt.set(0, 0, -8.0);
        break;
      }

      case 'infinite-zoom': {
        // Fractal infinite zoom loop with seamless reset
        this.zoomAccumulator = (this.zoomAccumulator + delta * 0.6 * speedMult) % 10.0;
        const z = 8.0 - (this.zoomAccumulator * 0.7);
        this.targetPosition.set(0, 0, Math.max(1.5, z / effectiveZoom));
        this.targetLookAt.set(0, 0, 0);
        break;
      }
    }

    // 3. Apply Gyro / Touch Parallax Offsets
    if (!accessibility.disableParallax && !accessibility.reducedMotion) {
      const tiltX = (motion?.tiltX ?? 0) * config.parallaxStrength * 0.7;
      const tiltY = (motion?.tiltY ?? 0) * config.parallaxStrength * 0.5;
      this.targetPosition.x += tiltX;
      this.targetPosition.y += tiltY;
    }

    // 4. Apply Event Cinematic Offsets
    this.targetPosition.add(this.eventDriftTarget);
    this.targetPosition.z += this.eventZoomOffset;

    // 5. Interpolation & Smooth Damping (never allow sudden jumps)
    const baseDamping = config.smoothness * 6.0;
    const damping = Math.min(1.0, delta * baseDamping);

    // Velocity-capped smoothing
    const desiredDisplacement = new THREE.Vector3().subVectors(this.targetPosition, this.currentPosition);
    if (desiredDisplacement.length() > this.maxVelocity * delta) {
      desiredDisplacement.clampLength(0, this.maxVelocity * delta);
    }
    this.currentPosition.add(desiredDisplacement.multiplyScalar(damping));

    this.currentLookAt.lerp(this.targetLookAt, damping);

    // 6. Inject 6-DOF Shake Offsets
    const finalPos = this.currentPosition.clone().add(this.shakeSystem.currentPositionOffset);
    this.camera.position.copy(finalPos);

    this.camera.lookAt(this.currentLookAt);

    // Add rotational roll & shake
    this.camera.rotation.x += this.shakeSystem.currentRotationOffset.x;
    this.camera.rotation.y += this.shakeSystem.currentRotationOffset.y;
    this.camera.rotation.z += this.shakeSystem.currentRotationOffset.z;

    // 7. Dynamic Field of View
    const targetFov = (config.fov || 60) + this.eventFovOffset;
    if (Math.abs(this.camera.fov - targetFov) > 0.01) {
      this.camera.fov = lerp(this.camera.fov, targetFov, damping);
      this.camera.updateProjectionMatrix();
    }
  }

  public getTargetPosition(): THREE.Vector3 {
    return this.targetPosition;
  }

  public getCurrentPosition(): THREE.Vector3 {
    return this.currentPosition;
  }

  public getLookAt(): THREE.Vector3 {
    return this.currentLookAt;
  }

  public resetCamera(): void {
    this.currentPosition.set(0, 0, 5);
    this.targetPosition.set(0, 0, 5);
    this.currentLookAt.set(0, 0, 0);
    this.targetLookAt.set(0, 0, 0);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
    this.shakeSystem.setTrauma(0);
    this.eventDurationRemaining = 0;
    this.eventZoomOffset = 0;
    this.eventFovOffset = 0;
    this.eventDriftTarget.set(0, 0, 0);
  }
}
