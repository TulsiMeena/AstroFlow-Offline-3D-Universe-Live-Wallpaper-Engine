import * as THREE from 'three';
import { ChunkCoord, StreamingConfig } from '../types/infiniteTypes';
import { WorldChunkManager } from '../chunks/WorldChunkManager';
import { FloatingOriginSystem } from './FloatingOriginSystem';
import { QualityProfile } from '../../types/engine';

export class WorldStreamingManager {
  private camera: THREE.Camera;
  private chunkManager: WorldChunkManager;
  private floatingOrigin: FloatingOriginSystem;
  private config: StreamingConfig;
  private loadQueue: { coord: ChunkCoord; lod: number; distSq: number }[] = [];
  private lastCenterChunk: ChunkCoord = { x: 999999, z: 999999 };

  constructor(
    camera: THREE.Camera,
    chunkManager: WorldChunkManager,
    floatingOrigin: FloatingOriginSystem,
    config: StreamingConfig
  ) {
    this.camera = camera;
    this.chunkManager = chunkManager;
    this.floatingOrigin = floatingOrigin;
    this.config = config;
  }

  public setQuality(profile: QualityProfile): void {
    let radius = 2;
    switch (profile) {
      case 'LOW':
        radius = 1; // 3x3 = 9 chunks
        break;
      case 'MEDIUM':
        radius = 2; // 5x5 = 25 chunks
        break;
      case 'HIGH':
        radius = 3; // 7x7 = 49 chunks
        break;
      case 'ULTRA':
        radius = 4; // 9x9 = 81 chunks
        break;
    }
    this.config.radius = radius;
    this.chunkManager.setConfig(this.config);
    this.forceRefresh();
  }

  public forceRefresh(): void {
    this.lastCenterChunk = { x: 999999, z: 999999 };
    this.loadQueue = [];
  }

  /**
   * Main streaming update per frame
   */
  public update(): void {
    // 1. Get camera position in world space including floating origin
    const worldPos = this.floatingOrigin.getWorldPosition(this.camera.position);
    const centerCx = Math.floor((worldPos.x + this.config.chunkSize / 2) / this.config.chunkSize);
    const centerCz = Math.floor((worldPos.z + this.config.chunkSize / 2) / this.config.chunkSize);

    // 2. If camera moved into a new chunk or queue is empty, recalculate chunk grid
    if (centerCx !== this.lastCenterChunk.x || centerCz !== this.lastCenterChunk.z) {
      this.lastCenterChunk = { x: centerCx, z: centerCz };
      this.recalculateChunks(centerCx, centerCz);
    }

    // 3. Process load queue (rate-limited to avoid frame drops)
    let processed = 0;
    while (this.loadQueue.length > 0 && processed < this.config.lazyLoadBudgetPerFrame) {
      const item = this.loadQueue.shift()!;
      if (!this.chunkManager.hasChunk(item.coord.x, item.coord.z)) {
        this.chunkManager.loadChunk(item.coord, item.lod);
        processed++;
      }
    }
  }

  private recalculateChunks(centerCx: number, centerCz: number): void {
    const radius = this.config.radius;
    const unloadDist = radius + 1;
    const unloadDistSq = unloadDist * unloadDist;

    // A. Identify distant chunks to unload
    const activeChunks = this.chunkManager.getActiveChunks();
    for (let i = 0; i < activeChunks.length; i++) {
      const c = activeChunks[i];
      const dx = c.coord.x - centerCx;
      const dz = c.coord.z - centerCz;
      if (dx * dx + dz * dz > unloadDistSq) {
        this.chunkManager.unloadChunk(c.coord.x, c.coord.z);
      }
    }

    // B. Build load queue for chunks within radius
    const nextQueue: { coord: ChunkCoord; lod: number; distSq: number }[] = [];
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const distSq = dx * dx + dz * dz;
        if (distSq <= radius * radius + 1) {
          const cx = centerCx + dx;
          const cz = centerCz + dz;

          if (!this.chunkManager.hasChunk(cx, cz)) {
            const lod = distSq <= 2 ? 0 : distSq <= 5 ? 1 : 2;
            nextQueue.push({ coord: { x: cx, z: cz }, lod, distSq });
          }
        }
      }
    }

    // Sort queue by closest distance first
    nextQueue.sort((a, b) => a.distSq - b.distSq);
    this.loadQueue = nextQueue;
  }
}
