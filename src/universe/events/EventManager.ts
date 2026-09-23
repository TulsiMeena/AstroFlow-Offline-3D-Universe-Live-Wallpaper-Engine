import * as THREE from 'three';
import { WorldDNA } from '../types/worldDNA';

export type UniverseEventType =
  | 'meteor-shower'
  | 'solar-flare'
  | 'nebula-pulse'
  | 'energy-wave'
  | 'supernova-flash'
  | 'gravity-disturbance';

export interface UniverseEventPayload {
  type: UniverseEventType;
  intensity: number;
  duration: number;
  origin?: THREE.Vector3;
}

export type UniverseEventListener = (event: UniverseEventPayload) => void;

export class EventManager {
  private listeners: Map<UniverseEventType, UniverseEventListener[]> = new Map();
  private allListeners: UniverseEventListener[] = [];
  private nextEventCountdown: number = 6.0;
  private dna: WorldDNA;
  private activeShockwave: { mesh: THREE.Mesh; progress: number; duration: number } | null = null;
  private scene: THREE.Scene | null = null;

  constructor(dna: WorldDNA) {
    this.dna = dna;
    this.resetTimer();
  }

  public setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  public updateDNA(dna: WorldDNA): void {
    this.dna = dna;
  }

  private resetTimer(): void {
    const baseInterval = 12.0 / Math.max(0.2, this.dna.eventFrequency);
    this.nextEventCountdown = baseInterval * (0.7 + Math.random() * 0.6);
  }

  public on(type: UniverseEventType, listener: UniverseEventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
    return () => {
      const list = this.listeners.get(type);
      if (list) {
        const idx = list.indexOf(listener);
        if (idx >= 0) list.splice(idx, 1);
      }
    };
  }

  public onAny(listener: UniverseEventListener): () => void {
    this.allListeners.push(listener);
    return () => {
      const idx = this.allListeners.indexOf(listener);
      if (idx >= 0) this.allListeners.splice(idx, 1);
    };
  }

  public trigger(type: UniverseEventType, intensity = 1.0, duration = 3.0): void {
    const payload: UniverseEventPayload = {
      type,
      intensity,
      duration,
      origin: new THREE.Vector3(0, 0, 0)
    };

    if (type === 'energy-wave' && this.scene) {
      this.spawnVisualShockwave(intensity, duration);
    }

    const typedListeners = this.listeners.get(type) || [];
    typedListeners.forEach(fn => fn(payload));
    this.allListeners.forEach(fn => fn(payload));
  }

  private spawnVisualShockwave(intensity: number, duration: number): void {
    if (!this.scene) return;
    if (this.activeShockwave) {
      this.scene.remove(this.activeShockwave.mesh);
      this.activeShockwave.mesh.geometry.dispose();
      (this.activeShockwave.mesh.material as THREE.Material).dispose();
      this.activeShockwave = null;
    }

    const ringGeo = new THREE.RingGeometry(0.5, 1.2, 48);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.dna.nebulaColor.accent || '#00F0FF'),
      transparent: true,
      opacity: 0.8 * intensity,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.scene.add(ringMesh);
    this.activeShockwave = { mesh: ringMesh, progress: 0, duration };
  }

  public update(delta: number): void {
    this.nextEventCountdown -= delta;
    if (this.nextEventCountdown <= 0) {
      const events: UniverseEventType[] = [
        'meteor-shower',
        'solar-flare',
        'nebula-pulse',
        'energy-wave',
        'supernova-flash',
        'gravity-disturbance'
      ];
      const selected = events[Math.floor(Math.random() * events.length)];
      this.trigger(selected, 0.8 + Math.random() * 0.4, 2.5 + Math.random() * 2.0);
      this.resetTimer();
    }

    // Update active shockwave
    if (this.activeShockwave && this.scene) {
      this.activeShockwave.progress += delta / this.activeShockwave.duration;
      if (this.activeShockwave.progress >= 1.0) {
        this.scene.remove(this.activeShockwave.mesh);
        this.activeShockwave.mesh.geometry.dispose();
        (this.activeShockwave.mesh.material as THREE.Material).dispose();
        this.activeShockwave = null;
      } else {
        const scale = this.activeShockwave.progress * (this.dna.universeSize * 0.6);
        this.activeShockwave.mesh.scale.set(scale, scale, scale);
        const mat = this.activeShockwave.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = (1.0 - this.activeShockwave.progress) * 0.7;
      }
    }
  }

  public dispose(): void {
    if (this.activeShockwave && this.scene) {
      this.scene.remove(this.activeShockwave.mesh);
      this.activeShockwave.mesh.geometry.dispose();
      (this.activeShockwave.mesh.material as THREE.Material).dispose();
      this.activeShockwave = null;
    }
    this.listeners.clear();
    this.allListeners = [];
    this.scene = null;
  }
}
