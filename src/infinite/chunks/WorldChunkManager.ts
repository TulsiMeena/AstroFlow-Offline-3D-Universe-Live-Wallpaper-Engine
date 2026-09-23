import * as THREE from 'three';
import {
  ChunkCoord,
  WorldChunk,
  FusionDNA,
  StreamingConfig
} from '../types/infiniteTypes';
import { ProceduralChunkGenerator } from './ProceduralChunkGenerator';

export class WorldChunkManager {
  private activeChunks: Map<string, WorldChunk> = new Map();
  private parentScene: THREE.Group;
  private config: StreamingConfig;
  private currentDNA: FusionDNA;
  private originOffset: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  constructor(parentScene: THREE.Group, dna: FusionDNA, config: StreamingConfig) {
    this.parentScene = parentScene;
    this.currentDNA = dna;
    this.config = config;
  }

  public setDNA(dna: FusionDNA): void {
    this.currentDNA = dna;
    this.clearAllChunks();
  }

  public setConfig(config: StreamingConfig): void {
    this.config = config;
  }

  public setOriginOffset(offset: THREE.Vector3): void {
    this.originOffset.copy(offset);
  }

  private getKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  public getActiveChunks(): WorldChunk[] {
    return Array.from(this.activeChunks.values());
  }

  public getChunk(cx: number, cz: number): WorldChunk | undefined {
    return this.activeChunks.get(this.getKey(cx, cz));
  }

  public hasChunk(cx: number, cz: number): boolean {
    return this.activeChunks.has(this.getKey(cx, cz));
  }

  /**
   * Loads or creates a chunk at (cx, cz)
   */
  public loadChunk(coord: ChunkCoord, lodLevel: number = 0): WorldChunk {
    const key = this.getKey(coord.x, coord.z);
    const existing = this.activeChunks.get(key);
    if (existing) {
      existing.lastUsedTime = Date.now();
      return existing;
    }

    const chunk = ProceduralChunkGenerator.generateChunk(
      coord,
      this.config.chunkSize,
      this.currentDNA.baseWorldSeed,
      this.currentDNA,
      lodLevel
    );

    // Apply origin shift to newly generated chunk
    chunk.group.position.set(
      coord.x * this.config.chunkSize - this.originOffset.x,
      0,
      coord.z * this.config.chunkSize - this.originOffset.z
    );

    this.parentScene.add(chunk.group);
    this.activeChunks.set(key, chunk);
    return chunk;
  }

  /**
   * Unloads and cleans up a chunk
   */
  public unloadChunk(cx: number, cz: number): void {
    const key = this.getKey(cx, cz);
    const chunk = this.activeChunks.get(key);
    if (!chunk) return;

    this.parentScene.remove(chunk.group);
    ProceduralChunkGenerator.disposeChunk(chunk);
    this.activeChunks.delete(key);
  }

  /**
   * Shifts positions of all active chunks when floating origin shifts
   */
  public applyOriginShift(shiftVector: THREE.Vector3): void {
    this.originOffset.add(shiftVector);
    this.activeChunks.forEach((chunk) => {
      chunk.group.position.x -= shiftVector.x;
      chunk.group.position.z -= shiftVector.z;
    });
  }

  /**
   * Elevation query across entire infinite landscape
   */
  public getElevationAt(worldX: number, worldZ: number): number {
    return ProceduralChunkGenerator.getElevationAt(worldX, worldZ, this.currentDNA);
  }

  /**
   * Clears and disposes all chunks
   */
  public clearAllChunks(): void {
    this.activeChunks.forEach((chunk) => {
      this.parentScene.remove(chunk.group);
      ProceduralChunkGenerator.disposeChunk(chunk);
    });
    this.activeChunks.clear();
  }

  public dispose(): void {
    this.clearAllChunks();
  }
}
