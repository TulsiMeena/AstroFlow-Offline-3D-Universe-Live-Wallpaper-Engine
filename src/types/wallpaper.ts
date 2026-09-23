import { QualityConfig, TouchPointerState, MotionData } from './engine';
import * as THREE from 'three';
import type { InteractionField } from '../engine/physics/InteractionField';
import type { RippleField } from '../engine/physics/RippleField';
import type { EnergyReactionSystem } from '../engine/physics/EnergyReactionSystem';
import type { GravityManager } from '../engine/physics/GravityManager';
import type { ParallaxManager } from '../engine/physics/ParallaxManager';

export interface WallpaperMetadata {
  id: string;
  title: string;
  subtitle: string;
  category: 'Cosmic' | 'Cosmic Universes' | 'Abstract' | 'Cyberpunk' | 'Nature' | 'Energy';
  description: string;
  author: string;
  tags: string[];
  accentColor: string;
  secondaryColor: string;
  interactive: boolean;
  proceduralType: 'particles' | 'mesh' | 'shader' | 'fluid' | 'grid' | 'universe' | 'galaxy' | 'black-hole' | 'system';
}

export interface WallpaperUpdateContext {
  time: number;
  delta: number;
  quality: QualityConfig;
  input: TouchPointerState;
  motion: MotionData;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  interactionField: InteractionField;
  rippleField: RippleField;
  energyReaction: EnergyReactionSystem;
  gravityManager: GravityManager;
  parallaxManager: ParallaxManager;
  physicsEngine?: any;
  cinematicEngine?: any;
  audioEngine?: any;
  audioAnalysis?: any;
  audioTargets?: any;
}

export interface IWallpaper {
  readonly metadata: WallpaperMetadata;
  init(scene: THREE.Scene, camera: THREE.PerspectiveCamera, quality: QualityConfig): void;
  update(ctx: WallpaperUpdateContext): void;
  onQualityChange(quality: QualityConfig): void;
  onResize(width: number, height: number): void;
  dispose(): void;
}
