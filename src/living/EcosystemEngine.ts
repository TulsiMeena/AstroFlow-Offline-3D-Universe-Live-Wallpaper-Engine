import * as THREE from 'three';
import { QualityConfig, TouchPointerState, MotionData } from '../types/engine';
import { EcosystemDNA } from './EcosystemDNA';
import { WorldEntityManager } from './WorldEntityManager';
import { EntityInteractionSystem } from './EntityInteractionSystem';
import { EnvironmentBehaviorEngine } from './EnvironmentBehaviorEngine';
import { TimeOfDay, WeatherType } from '../environment/types/environmentDNA';

export class EcosystemEngine {
  private group: THREE.Group;
  private quality: QualityConfig;
  private dna: EcosystemDNA;

  private entityManager: WorldEntityManager;
  private interactionSystem: EntityInteractionSystem;

  constructor(quality: QualityConfig, dna: EcosystemDNA) {
    this.group = new THREE.Group();
    this.group.name = 'EcosystemEngineGroup';
    this.quality = quality;
    this.dna = dna;

    this.entityManager = new WorldEntityManager(this.quality, this.dna);
    this.interactionSystem = new EntityInteractionSystem();

    this.group.add(this.entityManager.getGroup());
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public getDNA(): EcosystemDNA {
    return this.dna;
  }

  public setDNA(newDNA: EcosystemDNA) {
    this.dna = newDNA;
    this.entityManager.setEcosystemDNA(newDNA);
  }

  public setQuality(quality: QualityConfig) {
    this.quality = quality;
    this.entityManager.setQuality(quality);
  }

  public getInteractionSystem(): EntityInteractionSystem {
    return this.interactionSystem;
  }

  public getEntityManager(): WorldEntityManager {
    return this.entityManager;
  }

  public update(
    time: number,
    delta: number,
    camera: THREE.PerspectiveCamera,
    timeOfDay: TimeOfDay,
    daylight: number,
    weatherType: WeatherType,
    windSpeed: number,
    input?: TouchPointerState,
    motion?: MotionData
  ) {
    if (!this.dna.enabled) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;

    const entities = this.entityManager.getEntities();

    // 1. Process Environment Behaviors (Flocking, day/night cycles, weather reactions)
    EnvironmentBehaviorEngine.updateBehaviors(
      entities,
      this.dna,
      timeOfDay,
      daylight,
      weatherType,
      windSpeed,
      delta
    );

    // 2. Process Interaction System (Touch repulsion/attraction, gyro inertia)
    this.interactionSystem.update(time, delta, camera, this.dna, entities, input, motion);

    // 3. Commit updated transform matrices to InstancedMesh instances
    this.entityManager.commitToMeshes();
  }

  public dispose() {
    this.entityManager.dispose();
  }
}
