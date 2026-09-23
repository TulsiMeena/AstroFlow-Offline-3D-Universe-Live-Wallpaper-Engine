import * as THREE from 'three';
import { QualityConfig } from '../types/engine';
import { PhysicsEngine } from '../physics/PhysicsEngine';
import { CinematicCameraEngine } from '../cinematic/CinematicCameraEngine';
import { CameraEventType } from '../cinematic/types';

export type WorldEventType =
  | 'meteor-shower'
  | 'heavy-rain'
  | 'lightning-storm'
  | 'aurora-burst'
  | 'volcanic-eruption'
  | 'earthquake'
  | 'energy-wave'
  | 'particle-explosion'
  | 'cosmic-event'
  | 'portal-opening'
  | 'underwater-current'
  | 'strong-wind';

export interface ActiveWorldEvent {
  type: WorldEventType;
  name: string;
  duration: number;
  elapsed: number;
  intensity: number; // 0.0 to 1.0 (envelope curve)
}

export class WorldEventEngine {
  private group: THREE.Group;
  private quality: QualityConfig;
  private activeEvents: ActiveWorldEvent[] = [];
  private eventCooldown: number = 0;
  private cameraTrauma: number = 0;

  // Visual event meshes/particles
  private meteorParticles: THREE.Points | null = null;
  private shockwaveMesh: THREE.Mesh | null = null;
  private portalMesh: THREE.Mesh | null = null;

  private listeners: ((event: ActiveWorldEvent | null) => void)[] = [];

  constructor(quality: QualityConfig) {
    this.group = new THREE.Group();
    this.group.name = 'WorldEventEngineGroup';
    this.quality = quality;

    this.initVisualObjects();
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  private initVisualObjects() {
    // 1. Meteor Shower Particle System
    const meteorCount = this.quality.profile === 'LOW' ? 40 : 120;
    const meteorGeo = new THREE.BufferGeometry();
    const meteorPos = new Float32Array(meteorCount * 3);
    for (let i = 0; i < meteorCount * 3; i += 3) {
      meteorPos[i] = (Math.random() - 0.5) * 35;
      meteorPos[i + 1] = 12 + Math.random() * 15;
      meteorPos[i + 2] = (Math.random() - 0.5) * 35;
    }
    meteorGeo.setAttribute('position', new THREE.BufferAttribute(meteorPos, 3));
    const meteorMat = new THREE.PointsMaterial({
      color: 0xffaa44,
      size: 0.35,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    this.meteorParticles = new THREE.Points(meteorGeo, meteorMat);
    this.group.add(this.meteorParticles);

    // 2. Shockwave / Energy Wave Ring
    const ringGeo = new THREE.RingGeometry(0.1, 0.4, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    this.shockwaveMesh = new THREE.Mesh(ringGeo, ringMat);
    this.shockwaveMesh.position.set(0, 0.1, 0);
    this.group.add(this.shockwaveMesh);

    // 3. Portal Vortex Gateway
    const portalGeo = new THREE.TorusGeometry(2.5, 0.25, 12, 32);
    const portalMat = new THREE.MeshBasicMaterial({
      color: 0x7000ff,
      wireframe: true,
      transparent: true,
      opacity: 0
    });
    this.portalMesh = new THREE.Mesh(portalGeo, portalMat);
    this.portalMesh.position.set(0, 5, -8);
    this.group.add(this.portalMesh);
  }

  public triggerEvent(type: WorldEventType): ActiveWorldEvent {
    // Check if event of this type already running
    const existing = this.activeEvents.find((e) => e.type === type);
    if (existing) {
      existing.elapsed = 0;
      return existing;
    }

    const duration = this.getDurationForEvent(type);
    const newEvent: ActiveWorldEvent = {
      type,
      name: this.formatEventName(type),
      duration,
      elapsed: 0,
      intensity: 0
    };

    // Performance limit: keep max 2 concurrent events
    if (this.activeEvents.length >= 2) {
      this.activeEvents.shift();
    }

    this.activeEvents.push(newEvent);

    // Forward to PhysicsEngine for realistic dynamic physical reaction (forces, shockwaves, fluid disturbance, wind gusts)
    try {
      PhysicsEngine.getInstance().handleWorldEvent(type);
    } catch {
      // Safe fallback if not initialized yet
    }

    // Forward to CinematicCameraEngine for cinematic reactions (camera shake, FOV breathing, flash, zoom kick)
    try {
      let cameraEvent: CameraEventType | null = null;
      if (type === 'meteor-shower') cameraEvent = 'meteor-impact';
      else if (type === 'cosmic-event') cameraEvent = 'black-hole';
      else if (type === 'particle-explosion' || type === 'energy-wave') cameraEvent = 'energy-explosion';
      else if (type === 'volcanic-eruption') cameraEvent = 'volcano-eruption';
      else if (type === 'lightning-storm') cameraEvent = 'lightning';
      else if (type === 'portal-opening') cameraEvent = 'portal-opening';
      else if (type === 'aurora-burst') cameraEvent = 'aurora-burst';
      else if (type === 'underwater-current') cameraEvent = 'ocean-wave';
      else if (type === 'earthquake') cameraEvent = 'shockwave';

      if (cameraEvent) {
        CinematicCameraEngine.getInstance().handleEvent(cameraEvent, 1.0);
      }
    } catch {
      // Safe fallback
    }

    // Trigger immediate trauma if violent event
    if (type === 'earthquake' || type === 'volcanic-eruption' || type === 'particle-explosion') {
      this.cameraTrauma = 1.0;
    } else if (type === 'lightning-storm' || type === 'energy-wave') {
      this.cameraTrauma = 0.6;
    }

    this.notifyListeners(newEvent);
    return newEvent;
  }

  public triggerRandomEvent(): ActiveWorldEvent {
    const allEvents: WorldEventType[] = [
      'meteor-shower',
      'heavy-rain',
      'lightning-storm',
      'aurora-burst',
      'volcanic-eruption',
      'earthquake',
      'energy-wave',
      'particle-explosion',
      'cosmic-event',
      'portal-opening',
      'underwater-current',
      'strong-wind'
    ];
    const pick = allEvents[Math.floor(Math.random() * allEvents.length)];
    return this.triggerEvent(pick);
  }

  private getDurationForEvent(type: WorldEventType): number {
    switch (type) {
      case 'earthquake':
        return 5.0;
      case 'lightning-storm':
        return 8.0;
      case 'volcanic-eruption':
        return 10.0;
      case 'meteor-shower':
        return 12.0;
      case 'energy-wave':
        return 6.0;
      case 'portal-opening':
        return 12.0;
      default:
        return 9.0;
    }
  }

  private formatEventName(type: WorldEventType): string {
    return type
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  public update(time: number, delta: number, eventFrequencyModifier: number = 1.0): THREE.Vector3 {
    // 1. Procedural Event Spawner (based on frequency modifier)
    this.eventCooldown -= delta;
    if (this.eventCooldown <= 0 && eventFrequencyModifier > 0) {
      // Cooldown between 18s and 45s, adjusted by eventFrequency
      this.eventCooldown = (25.0 + Math.random() * 25.0) / Math.max(0.2, eventFrequencyModifier);
      if (Math.random() < 0.65) {
        this.triggerRandomEvent();
      }
    }

    // 2. Update Active Events & Envelope Curves
    for (let i = this.activeEvents.length - 1; i >= 0; i--) {
      const ev = this.activeEvents[i];
      ev.elapsed += delta;

      const progress = ev.elapsed / ev.duration;
      if (progress >= 1.0) {
        this.activeEvents.splice(i, 1);
        this.notifyListeners(this.activeEvents[0] || null);
        continue;
      }

      // Smooth attack-sustain-decay envelope (sin(PI * progress))
      ev.intensity = Math.sin(progress * Math.PI);
    }

    // 3. Visual Effects Update
    this.updateVisualEffects(time, delta);

    // 4. Compute Camera Trauma Shake
    const shake = new THREE.Vector3();
    if (this.cameraTrauma > 0.001) {
      this.cameraTrauma = Math.max(0, this.cameraTrauma - delta * 0.7);
      const shakeAmount = this.cameraTrauma * this.cameraTrauma * 0.35;
      shake.x = (Math.random() - 0.5) * shakeAmount;
      shake.y = (Math.random() - 0.5) * shakeAmount;
      shake.z = (Math.random() - 0.5) * shakeAmount;
    }

    return shake;
  }

  private updateVisualEffects(time: number, delta: number) {
    const meteorEv = this.activeEvents.find((e) => e.type === 'meteor-shower');
    if (this.meteorParticles) {
      const mat = this.meteorParticles.material as THREE.PointsMaterial;
      if (meteorEv) {
        mat.opacity = meteorEv.intensity * 0.9;
        const pos = this.meteorParticles.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          let y = pos.getY(i) - delta * 24.0;
          let x = pos.getX(i) - delta * 12.0;
          let z = pos.getZ(i) - delta * 8.0;
          if (y < 0) {
            y = 20 + Math.random() * 5;
            x = (Math.random() - 0.5) * 35;
            z = (Math.random() - 0.5) * 35;
          }
          pos.setXYZ(i, x, y, z);
        }
        pos.needsUpdate = true;
      } else {
        mat.opacity = 0;
      }
    }

    const shockEv = this.activeEvents.find(
      (e) => e.type === 'energy-wave' || e.type === 'particle-explosion'
    );
    if (this.shockwaveMesh) {
      const mat = this.shockwaveMesh.material as THREE.MeshBasicMaterial;
      if (shockEv) {
        const rad = (shockEv.elapsed / shockEv.duration) * 25.0;
        this.shockwaveMesh.scale.set(rad, rad, rad);
        mat.opacity = shockEv.intensity * 0.8;
      } else {
        mat.opacity = 0;
      }
    }

    const portalEv = this.activeEvents.find((e) => e.type === 'portal-opening');
    if (this.portalMesh) {
      const mat = this.portalMesh.material as THREE.MeshBasicMaterial;
      if (portalEv) {
        this.portalMesh.rotation.z += delta * 3.0;
        this.portalMesh.rotation.x = Math.sin(time) * 0.2;
        mat.opacity = portalEv.intensity * 0.85;
      } else {
        mat.opacity = 0;
      }
    }
  }

  public getActiveEvents(): ActiveWorldEvent[] {
    return this.activeEvents;
  }

  public addListener(cb: (event: ActiveWorldEvent | null) => void) {
    this.listeners.push(cb);
  }

  public removeListener(cb: (event: ActiveWorldEvent | null) => void) {
    this.listeners = this.listeners.filter((l) => l !== cb);
  }

  private notifyListeners(ev: ActiveWorldEvent | null) {
    for (const listener of this.listeners) {
      listener(ev);
    }
  }

  public dispose() {
    if (this.meteorParticles) {
      this.meteorParticles.geometry.dispose();
      (this.meteorParticles.material as THREE.Material).dispose();
    }
    if (this.shockwaveMesh) {
      this.shockwaveMesh.geometry.dispose();
      (this.shockwaveMesh.material as THREE.Material).dispose();
    }
    if (this.portalMesh) {
      this.portalMesh.geometry.dispose();
      (this.portalMesh.material as THREE.Material).dispose();
    }
    this.activeEvents = [];
  }
}
