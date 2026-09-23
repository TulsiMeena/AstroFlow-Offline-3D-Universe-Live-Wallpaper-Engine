import * as THREE from 'three';
import { QualityProfile } from '../../types/engine';
import { BiomeType, WeatherType } from '../../environment/types/environmentDNA';
import { LifeEntityType } from '../../living/EcosystemDNA';

export type FusionSystemType =
  | 'galaxy'
  | 'black-hole'
  | 'forest'
  | 'ocean'
  | 'cyber-city'
  | 'volcano'
  | 'crystal'
  | 'aurora'
  | 'mountain'
  | 'snow'
  | 'desert'
  | 'space'
  | 'floating-islands'
  | 'fantasy'
  | 'underwater'
  | 'rain'
  | 'lightning'
  | 'energy'
  | 'portal'
  | 'planet'
  | 'bioluminescence'
  | 'alien-planet';

export interface FusionDNA {
  id: string;
  name: string;
  description: string;
  baseWorldSeed: number;
  secondaryWorldSeed: number;
  environmentSeed: number;
  ecosystemSeed: number;
  primarySystem: FusionSystemType;
  secondarySystem: FusionSystemType;
  fusionAmount: number; // 0.0 to 1.0 (0: 100% primary, 1: 100% secondary)
  terrainBlend: number;
  atmosphereBlend: number;
  weatherBlend: number;
  lightingBlend: number;
  particleBlend: number;
  physicsBlend: number;
  ecosystemBlend: number;
  eventBlend: number;
  weatherType: WeatherType;
  primaryBiome: BiomeType;
  secondaryBiome: BiomeType;
  allowedEntities: LifeEntityType[];
  gravity: number; // e.g. 9.8
  atmosphereFogDensity: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tags: string[];
  createdAt: number;
  isFavorite?: boolean;
}

export interface ChunkCoord {
  x: number;
  z: number;
}

export interface ChunkBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface ChunkEntityData {
  id: string;
  type: LifeEntityType;
  position: THREE.Vector3;
  scale: number;
  rotationY: number;
  color: THREE.Color;
}

export interface ChunkParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  alpha: number;
}

export interface WorldChunk {
  coord: ChunkCoord;
  worldPosition: THREE.Vector3;
  seed: number;
  group: THREE.Group;
  terrainMesh: THREE.Mesh | null;
  featureGroup: THREE.Group;
  particlePoints: THREE.Points | null;
  light: THREE.PointLight | null;
  entities: ChunkEntityData[];
  isLoaded: boolean;
  lastUsedTime: number;
  lodLevel: number; // 0 = high, 1 = med, 2 = low
}

export type PortalType = 'energy' | 'black-hole' | 'crystal' | 'holographic' | 'wormhole';

export interface PortalData {
  id: string;
  name: string;
  type: PortalType;
  position: THREE.Vector3;
  targetSeed: number;
  targetPrimarySystem: FusionSystemType;
  targetSecondarySystem: FusionSystemType;
  radius: number;
  active: boolean;
  group?: THREE.Group;
}

export type ZoomScaleLevel =
  | 'micro'
  | 'object'
  | 'environment'
  | 'planet'
  | 'solar-system'
  | 'galaxy'
  | 'universe';

export type WorldTransitionType =
  | 'portal'
  | 'warp'
  | 'zoom'
  | 'dissolve'
  | 'particle'
  | 'tunnel'
  | 'black-hole'
  | 'energy-wave';

export interface WorldTransitionState {
  isActive: boolean;
  type: WorldTransitionType;
  progress: number; // 0 to 1
  duration: number; // seconds
  elapsed: number;
  startWorldDNA: FusionDNA | null;
  targetWorldDNA: FusionDNA | null;
  onComplete?: () => void;
}

export interface StreamingConfig {
  chunkSize: number; // e.g. 64 units
  radius: number; // In chunk units: 1 (LOW), 2 (MED), 3 (HIGH), 4 (ULTRA)
  maxLoadedChunks: number;
  lazyLoadBudgetPerFrame: number; // 1-2 chunks per frame
  originShiftThreshold: number; // e.g. 400 units
}
