import * as THREE from 'three';
import { FusionDNA, StreamingConfig } from '../types/infiniteTypes';

export class WorldBoundaryManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private dna: FusionDNA;
  private config: StreamingConfig;

  // Maximum allowed active chunk budget in memory
  private maxActiveChunkBudget: number = 100;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    dna: FusionDNA,
    config: StreamingConfig
  ) {
    this.scene = scene;
    this.camera = camera;
    this.dna = dna;
    this.config = config;
  }

  public setDNA(dna: FusionDNA): void {
    this.dna = dna;
    this.updateFogBoundary();
  }

  public setConfig(config: StreamingConfig): void {
    this.config = config;
    // Set budget based on radius
    const maxChunks = (config.radius * 2 + 1) ** 2 + 16;
    this.maxActiveChunkBudget = Math.max(maxChunks, 36);
  }

  public getMaxChunkBudget(): number {
    return this.maxActiveChunkBudget;
  }

  /**
   * Horizon Fog Boundary creates the visual illusion of an infinite horizon
   */
  public updateFogBoundary(): void {
    const horizonColor = new THREE.Color(this.dna.primaryColor).lerp(
      new THREE.Color(this.dna.secondaryColor),
      0.35
    );

    // Fog density adapts so far chunk boundaries dissolve into sky
    const horizonDistance = this.config.chunkSize * (this.config.radius + 0.8);
    const density = 2.2 / horizonDistance;

    this.scene.fog = new THREE.FogExp2(horizonColor, Math.max(density, 0.005));
  }

  /**
   * Bounds check to keep camera altitude within valid flight envelopes
   */
  public clampCameraAltitude(minY: number, maxY: number = 120): void {
    if (this.camera.position.y < minY) {
      this.camera.position.y = minY;
    } else if (this.camera.position.y > maxY) {
      this.camera.position.y = maxY;
    }
  }
}
