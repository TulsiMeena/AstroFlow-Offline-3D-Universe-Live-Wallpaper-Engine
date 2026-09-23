import * as THREE from 'three';
import {
  FusionDNA,
  StreamingConfig,
  ZoomScaleLevel,
  WorldTransitionType
} from './types/infiniteTypes';
import { WorldChunkManager } from './chunks/WorldChunkManager';
import { WorldFusionEngine } from './fusion/WorldFusionEngine';
import { WorldStreamingManager } from './streaming/WorldStreamingManager';
import { FloatingOriginSystem } from './streaming/FloatingOriginSystem';
import { PortalTransitionSystem } from './portals/PortalTransitionSystem';
import { InfiniteZoomEngine } from './zoom/InfiniteZoomEngine';
import { WorldBoundaryManager } from './boundary/WorldBoundaryManager';
import { FusionDNAFactory } from './dna/FusionDNA';
import { QualityConfig, TouchPointerState, MotionData } from '../types/engine';

export class InfiniteWorldEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private quality: QualityConfig;
  private dna: FusionDNA;

  // Subsystems
  private rootGroup: THREE.Group = new THREE.Group();
  private chunkGroup: THREE.Group = new THREE.Group();
  private chunkManager: WorldChunkManager;
  private fusionEngine: WorldFusionEngine;
  private floatingOrigin: FloatingOriginSystem;
  private streamingManager: WorldStreamingManager;
  private portalSystem: PortalTransitionSystem;
  private zoomEngine: InfiniteZoomEngine;
  private boundaryManager: WorldBoundaryManager;

  // Camera Motion & Controls
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 12, 0);
  private cameraVelocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private cameraAngles: { yaw: number; pitch: number } = { yaw: 0, pitch: -0.15 };
  private cameraDistance: number = 25;
  private isAutoFlying: boolean = true;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    quality: QualityConfig,
    initialDNA?: FusionDNA
  ) {
    this.scene = scene;
    this.camera = camera;
    this.quality = quality;
    this.dna = initialDNA || FusionDNAFactory.getCuratedPresets()[0];

    this.rootGroup.name = 'InfiniteWorldEngine_Root';
    this.scene.add(this.rootGroup);

    this.chunkGroup.name = 'InfiniteWorld_Chunks';
    this.rootGroup.add(this.chunkGroup);

    // 1. Streaming Configuration based on Quality
    const config: StreamingConfig = {
      chunkSize: 64,
      radius: this.getQualityRadius(quality.profile),
      maxLoadedChunks: 80,
      lazyLoadBudgetPerFrame: 2,
      originShiftThreshold: 350
    };

    // 2. Initialize Floating Origin System
    this.floatingOrigin = new FloatingOriginSystem(this.camera, config.originShiftThreshold);

    // 3. Initialize Chunk Manager
    this.chunkManager = new WorldChunkManager(this.chunkGroup, this.dna, config);

    // Hook floating origin shifts to chunk positions
    this.floatingOrigin.addListener((shift) => {
      this.chunkManager.applyOriginShift(shift);
    });

    // 4. Initialize Streaming Manager
    this.streamingManager = new WorldStreamingManager(
      this.camera,
      this.chunkManager,
      this.floatingOrigin,
      config
    );

    // 5. Initialize World Fusion Engine
    this.fusionEngine = new WorldFusionEngine(this.scene, this.camera, this.dna);

    // 6. Initialize Portal System
    this.portalSystem = new PortalTransitionSystem(this.scene, this.camera);

    // 7. Initialize Infinite Zoom Engine
    this.zoomEngine = new InfiniteZoomEngine(this.scene, this.camera, this.dna);

    // 8. Initialize Boundary Manager
    this.boundaryManager = new WorldBoundaryManager(this.scene, this.camera, this.dna, config);
    this.boundaryManager.updateFogBoundary();

    // Initial camera placement
    this.camera.position.set(0, 18, 30);
    this.camera.lookAt(0, 10, 0);

    // Spawn initial showcase portals
    this.spawnDefaultPortals();
  }

  private getQualityRadius(profile: string): number {
    switch (profile) {
      case 'LOW':
        return 1;
      case 'MEDIUM':
        return 2;
      case 'HIGH':
        return 3;
      case 'ULTRA':
        return 4;
      default:
        return 2;
    }
  }

  private spawnDefaultPortals(): void {
    // Energy Portal
    this.portalSystem.createPortal(
      'portal-energy',
      'Quantum Energy Gate',
      'energy',
      new THREE.Vector3(25, 12, -45),
      991,
      'cyber-city',
      'crystal'
    );

    // Black Hole Portal
    this.portalSystem.createPortal(
      'portal-blackhole',
      'Singularity Vortex',
      'black-hole',
      new THREE.Vector3(-35, 15, -60),
      992,
      'galaxy',
      'black-hole'
    );

    // Crystal Portal
    this.portalSystem.createPortal(
      'portal-crystal',
      'Harmonic Crystal Gate',
      'crystal',
      new THREE.Vector3(50, 14, 20),
      993,
      'crystal',
      'fantasy'
    );
  }

  public getDNA(): FusionDNA {
    return this.dna;
  }

  public setDNA(dna: FusionDNA, transition: WorldTransitionType = 'portal'): void {
    const oldDNA = this.dna;
    this.portalSystem.triggerTransition(
      transition,
      dna,
      oldDNA,
      (newDNA) => {
        this.dna = newDNA;
        this.chunkManager.setDNA(newDNA);
        this.fusionEngine.setDNA(newDNA);
        this.zoomEngine.setDNA(newDNA);
        this.boundaryManager.setDNA(newDNA);
        this.streamingManager.forceRefresh();
      },
      1.2
    );
  }

  public setDNAInstant(dna: FusionDNA): void {
    this.dna = dna;
    this.chunkManager.setDNA(dna);
    this.fusionEngine.setDNA(dna);
    this.zoomEngine.setDNA(dna);
    this.boundaryManager.setDNA(dna);
    this.streamingManager.forceRefresh();
  }

  public onQualityChange(quality: QualityConfig): void {
    this.quality = quality;
    this.streamingManager.setQuality(quality.profile);
    this.boundaryManager.setConfig({
      chunkSize: 64,
      radius: this.getQualityRadius(quality.profile),
      maxLoadedChunks: 80,
      lazyLoadBudgetPerFrame: 2,
      originShiftThreshold: 350
    });
  }

  // --- INTERACTIVE ACTIONS ---

  public enterPortal(portalId?: string): void {
    const portals = this.portalSystem.getPortals();
    const target = portalId
      ? portals.find((p) => p.id === portalId)
      : portals[0];

    if (target) {
      const nextDNA = FusionDNAFactory.createDefault(
        target.targetPrimarySystem,
        target.targetSecondarySystem,
        target.targetSeed
      );
      this.setDNA(nextDNA, target.type === 'black-hole' ? 'black-hole' : 'portal');
    }
  }

  public exitWorld(): boolean {
    return this.portalSystem.exitWorld(this.dna, (newDNA) => {
      this.dna = newDNA;
      this.chunkManager.setDNA(newDNA);
      this.fusionEngine.setDNA(newDNA);
      this.zoomEngine.setDNA(newDNA);
      this.boundaryManager.setDNA(newDNA);
      this.streamingManager.forceRefresh();
    });
  }

  public randomWorld(): FusionDNA {
    return this.portalSystem.randomWorld(this.dna, (newDNA) => {
      this.dna = newDNA;
      this.chunkManager.setDNA(newDNA);
      this.fusionEngine.setDNA(newDNA);
      this.zoomEngine.setDNA(newDNA);
      this.boundaryManager.setDNA(newDNA);
      this.streamingManager.forceRefresh();
    });
  }

  public triggerInfiniteZoom(): ZoomScaleLevel {
    return this.zoomEngine.cycleZoom();
  }

  public setZoomLevel(level: ZoomScaleLevel): void {
    this.zoomEngine.setZoomLevel(level);
  }

  public getZoomLevel(): ZoomScaleLevel {
    return this.zoomEngine.getCurrentLevel();
  }

  /**
   * Main Frame Loop Update
   */
  public update(time: number, delta: number, input?: TouchPointerState, motion?: MotionData): void {
    // 1. Handle touch controls (drag camera, pinch zoom)
    if (input && input.isDown) {
      this.isAutoFlying = false;
      this.cameraAngles.yaw -= input.deltaX * 2.5;
      this.cameraAngles.pitch = Math.max(
        Math.min(this.cameraAngles.pitch - input.deltaY * 2.0, 0.4),
        -0.8
      );

      if (input.pinchScale && input.pinchScale !== 1.0) {
        this.cameraDistance = Math.max(
          Math.min(this.cameraDistance / input.pinchScale, 60),
          8
        );
      }
    } else {
      // Smooth auto-orbit / drift
      if (this.isAutoFlying) {
        this.cameraAngles.yaw += delta * 0.08;
      }
    }

    // 2. Gyroscope sensor fusion parallax
    let sensorYawOffset = 0;
    let sensorPitchOffset = 0;
    if (motion && motion.isAvailable) {
      sensorYawOffset = motion.tiltX * 0.35;
      sensorPitchOffset = motion.tiltY * 0.25;
    }

    // 3. Compute camera position
    const effectiveYaw = this.cameraAngles.yaw + sensorYawOffset;
    const effectivePitch = this.cameraAngles.pitch + sensorPitchOffset;

    const camX = this.cameraTarget.x + Math.sin(effectiveYaw) * Math.cos(effectivePitch) * this.cameraDistance;
    const camY = this.cameraTarget.y - Math.sin(effectivePitch) * this.cameraDistance;
    const camZ = this.cameraTarget.z + Math.cos(effectiveYaw) * Math.cos(effectivePitch) * this.cameraDistance;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(this.cameraTarget);

    // 4. Ground clearance check
    const currentGroundY = this.chunkManager.getElevationAt(this.camera.position.x, this.camera.position.z);
    this.boundaryManager.clampCameraAltitude(currentGroundY + 4, 150);

    // 5. Floating Origin Check & Shift
    this.floatingOrigin.update();

    // 6. Update Chunk Streaming
    this.streamingManager.update();

    // 7. Update Fusion System (Atmosphere, Sky, Weather particles)
    this.fusionEngine.update(time, delta, input, motion);

    // 8. Update Portals & Transitions
    this.portalSystem.update(time, delta);

    // 9. Update Infinite Zoom Engine
    this.zoomEngine.update(time, delta);
  }

  public dispose(): void {
    this.portalSystem.dispose();
    this.zoomEngine.dispose();
    this.fusionEngine.dispose();
    this.chunkManager.dispose();
    this.scene.remove(this.rootGroup);
  }
}
