import * as THREE from 'three';
import { QualityConfig } from '../types/engine';

export type ForceFieldType =
  | 'gravity'
  | 'attraction'
  | 'repulsion'
  | 'vortex'
  | 'turbulence'
  | 'wind'
  | 'drag'
  | 'impulse'
  | 'orbital'
  | 'magnetic'
  | 'shockwave';

export type FalloffType = 'linear' | 'inverse-square' | 'gaussian';

export interface ForceField {
  id: string;
  type: ForceFieldType;
  position: THREE.Vector3;
  strength: number;
  radius: number;
  falloff: FalloffType;
  lifetime: number; // in seconds (0 = infinite / manual)
  maxLifetime: number;
  direction?: THREE.Vector3; // for wind, impulse, directional
  angularVelocity?: number; // for vortex, orbital
  active: boolean;
  color?: number;
  debugMesh?: THREE.Object3D;
}

export type GravityPresetType =
  | 'normal'
  | 'low'
  | 'zero'
  | 'reverse'
  | 'planet'
  | 'black-hole'
  | 'vortex';

export type FluidSimulationType =
  | 'water'
  | 'liquid-glass'
  | 'plasma'
  | 'lava'
  | 'smoke'
  | 'energy';

export type PhysicsPresetType =
  | 'cosmic'
  | 'ocean'
  | 'volcano'
  | 'storm'
  | 'cyber'
  | 'crystal'
  | 'zero-gravity'
  | 'black-hole'
  | 'dream'
  | 'experimental';

export interface CollisionSphere {
  id: string;
  type: 'sphere';
  position: THREE.Vector3;
  radius: number;
  restitution: number;
  friction: number;
  isDynamic: boolean;
  velocity?: THREE.Vector3;
}

export interface CollisionBox {
  id: string;
  type: 'box';
  position: THREE.Vector3;
  size: THREE.Vector3;
  restitution: number;
  friction: number;
  isDynamic: boolean;
}

export interface CollisionPlane {
  id: string;
  type: 'plane';
  normal: THREE.Vector3;
  distance: number;
  restitution: number;
  friction: number;
}

export type Collider = CollisionSphere | CollisionBox | CollisionPlane;

export interface ShockwaveInstance {
  id: string;
  origin: THREE.Vector3;
  currentRadius: number;
  maxRadius: number;
  speed: number;
  strength: number;
  elapsed: number;
  lifetime: number;
  color: number;
  mesh?: THREE.Mesh;
}

export interface PhysicsConfig {
  enabled: boolean;
  preset: PhysicsPresetType;
  gravityMode: GravityPresetType;
  gravityStrength: number;
  windStrength: number;
  windDirectionAngle: number; // degrees 0-360
  turbulence: number;
  interactionStrength: number;
  drag: number;
  particleMass: number;
  simulationSpeed: number;
  shockwaveEnabled: boolean;
  shockwaveRadius: number;
  fluidReaction: boolean;
  fluidMode: FluidSimulationType;
  ribbonReaction: boolean;
  objectReaction: boolean;
  debugVisuals: boolean;
}

export interface PhysicsParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  mass: number;
  life: number;
  maxLife: number;
  color: THREE.Color;
  size: number;
  active: boolean;
}

export interface PhysicsEngineStats {
  activeBodies: number;
  activeForceFields: number;
  activeShockwaves: number;
  particleCount: number;
  fluidGridResolution: string;
  ribbonNodes: number;
  stepTimeMs: number;
}
