import * as THREE from 'three';

export interface BoundaryBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export class InfiniteSpaceController {
  private bounds: BoundaryBox;
  private width: number;
  private height: number;
  private depth: number;

  constructor(size: number) {
    const half = size * 0.5;
    this.bounds = {
      minX: -half,
      maxX: half,
      minY: -half,
      maxY: half,
      minZ: -half,
      maxZ: half
    };
    this.width = size;
    this.height = size;
    this.depth = size;
  }

  /**
   * Wraps particle positions around the camera's floating frame of reference.
   */
  public wrapPositions(positions: Float32Array, count: number, cameraPos: THREE.Vector3): void {
    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      const relX = positions[idx] - cameraPos.x;
      const relY = positions[idx + 1] - cameraPos.y;
      const relZ = positions[idx + 2] - cameraPos.z;

      if (relX > this.bounds.maxX) positions[idx] -= this.width;
      else if (relX < this.bounds.minX) positions[idx] += this.width;

      if (relY > this.bounds.maxY) positions[idx + 1] -= this.height;
      else if (relY < this.bounds.minY) positions[idx + 1] += this.height;

      if (relZ > this.bounds.maxZ) positions[idx + 2] -= this.depth;
      else if (relZ < this.bounds.minZ) positions[idx + 2] += this.depth;
    }
  }

  public setSize(size: number): void {
    const half = size * 0.5;
    this.bounds = {
      minX: -half,
      maxX: half,
      minY: -half,
      maxY: half,
      minZ: -half,
      maxZ: half
    };
    this.width = size;
    this.height = size;
    this.depth = size;
  }
}
