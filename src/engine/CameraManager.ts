import * as THREE from 'three';
import { MotionData, TouchPointerState } from '../types/engine';
import { lerp } from '../utils/math';

export class CameraManager {
  private camera: THREE.PerspectiveCamera;
  private basePosition = new THREE.Vector3(0, 0, 5);
  private targetPosition = new THREE.Vector3(0, 0, 5);
  private lookAtTarget = new THREE.Vector3(0, 0, 0);
  private currentLookAt = new THREE.Vector3(0, 0, 0);

  private fov: number = 60;
  private aspect: number = 1;
  private near: number = 0.1;
  private far: number = 1000;
  private currentRoll: number = 0;

  constructor(fov: number = 60, aspect: number = 1, near: number = 0.1, far: number = 1000) {
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.copy(this.basePosition);
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public resize(width: number, height: number) {
    if (height === 0) return;
    this.aspect = width / height;
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
  }

  public setBasePosition(x: number, y: number, z: number) {
    this.basePosition.set(x, y, z);
    this.targetPosition.copy(this.basePosition);
  }

  public setLookAt(x: number, y: number, z: number) {
    this.lookAtTarget.set(x, y, z);
  }

  public update(motion: MotionData, input: TouchPointerState, delta: number) {
    // Parallax displacement based on both touch/pointer and device gyro motion
    const pointerInfluenceX = input.x * 0.7;
    const pointerInfluenceY = input.y * 0.5;
    const gyroInfluenceX = motion.tiltX * 1.1;
    const gyroInfluenceY = motion.tiltY * 0.75;

    const offsetX = pointerInfluenceX + gyroInfluenceX;
    const offsetY = pointerInfluenceY + gyroInfluenceY;

    // Apply pinch zoom or depth offset
    const pinchDepth = (input.pinchScale - 1.0) * 1.8;

    this.targetPosition.x = this.basePosition.x + offsetX;
    this.targetPosition.y = this.basePosition.y + offsetY;
    this.targetPosition.z = Math.max(1.2, this.basePosition.z - pinchDepth);

    // Smooth cinematic damping
    const damping = Math.min(1.0, delta * 4.2);
    this.camera.position.x = lerp(this.camera.position.x, this.targetPosition.x, damping);
    this.camera.position.y = lerp(this.camera.position.y, this.targetPosition.y, damping);
    this.camera.position.z = lerp(this.camera.position.z, this.targetPosition.z, damping);

    this.currentLookAt.x = lerp(this.currentLookAt.x, this.lookAtTarget.x + offsetX * 0.15, damping);
    this.currentLookAt.y = lerp(this.currentLookAt.y, this.lookAtTarget.y + offsetY * 0.15, damping);
    this.currentLookAt.z = lerp(this.currentLookAt.z, this.lookAtTarget.z, damping);

    this.camera.lookAt(this.currentLookAt);

    // Subtle physical roll on Z axis
    const targetRoll = -motion.tiltX * 0.05;
    this.currentRoll = lerp(this.currentRoll, targetRoll, damping);
    this.camera.rotation.z += this.currentRoll;
  }
}
