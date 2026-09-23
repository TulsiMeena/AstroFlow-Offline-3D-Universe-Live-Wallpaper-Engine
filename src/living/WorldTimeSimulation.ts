import * as THREE from 'three';
import { TimeOfDay } from '../environment/types/environmentDNA';

export interface WorldTimeState {
  hour: number; // 0.0 to 24.0
  normalizedTime: number; // 0.0 to 1.0
  phase: TimeOfDay;
  daylight: number; // 0.0 (night) to 1.0 (midday)
  nightFactor: number; // 1.0 (night) to 0.0 (midday)
  isPaused: boolean;
  timeMultiplier: number;
  cycleDurationSeconds: number; // seconds for a full 24h cycle
}

export class WorldTimeSimulation {
  private currentHour: number = 12.0; // Starts at noon
  private isPaused: boolean = false;
  private timeMultiplier: number = 1.0;
  private cycleDurationSeconds: number = 120.0; // 2 minutes per full day by default

  private listeners: ((state: WorldTimeState) => void)[] = [];

  constructor(initialTimeOfDay: TimeOfDay = 'day', cycleDurationSeconds: number = 120.0) {
    this.cycleDurationSeconds = cycleDurationSeconds;
    this.setTimeByPhase(initialTimeOfDay);
  }

  public setTimeByPhase(phase: TimeOfDay) {
    switch (phase) {
      case 'dawn':
        this.currentHour = 6.0;
        break;
      case 'day':
        this.currentHour = 12.0;
        break;
      case 'sunset':
        this.currentHour = 18.5;
        break;
      case 'twilight':
        this.currentHour = 20.5;
        break;
      case 'night':
      default:
        this.currentHour = 0.5;
        break;
    }
  }

  public setHour(hour: number) {
    this.currentHour = ((hour % 24) + 24) % 24;
  }

  public getHour(): number {
    return this.currentHour;
  }

  public setCycleDuration(seconds: number) {
    this.cycleDurationSeconds = Math.max(10, seconds);
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  public setMultiplier(mult: number) {
    this.timeMultiplier = mult;
  }

  public fastForward() {
    this.timeMultiplier = 4.0;
  }

  public slowTime() {
    this.timeMultiplier = 0.25;
  }

  public normalTime() {
    this.timeMultiplier = 1.0;
  }

  public resetTime() {
    this.currentHour = 12.0;
    this.timeMultiplier = 1.0;
    this.isPaused = false;
  }

  public getPhase(): TimeOfDay {
    const h = this.currentHour;
    if (h >= 5.0 && h < 7.5) return 'dawn';
    if (h >= 7.5 && h < 17.5) return 'day';
    if (h >= 17.5 && h < 19.8) return 'sunset';
    if (h >= 19.8 && h < 22.0) return 'twilight';
    return 'night';
  }

  public getDaylightFactor(): number {
    // Peak at 12:00 (1.0), 0.0 at 0:00 (midnight)
    // Cosine wave mapped from -1..1 to 0..1
    const angle = ((this.currentHour - 12.0) / 24.0) * Math.PI * 2;
    const raw = Math.cos(angle);
    return THREE.MathUtils.clamp(raw * 1.2 + 0.1, 0, 1);
  }

  public getNightFactor(): number {
    return 1.0 - this.getDaylightFactor();
  }

  public getSunAltitude(): number {
    // In radians: -PI/2 (under horizon) to +PI/2 (zenith)
    const angle = ((this.currentHour - 6.0) / 24.0) * Math.PI * 2;
    return Math.sin(angle);
  }

  public getSunDirection(): THREE.Vector3 {
    const altitude = this.getSunAltitude();
    const azimuth = ((this.currentHour - 6.0) / 24.0) * Math.PI * 2;
    return new THREE.Vector3(
      Math.cos(azimuth) * Math.cos(altitude),
      Math.sin(altitude),
      Math.sin(azimuth) * Math.cos(altitude)
    ).normalize();
  }

  public update(delta: number): WorldTimeState {
    if (!this.isPaused && delta > 0) {
      // 24 hours per cycleDurationSeconds
      const hoursPassed = (delta * this.timeMultiplier * 24.0) / this.cycleDurationSeconds;
      this.currentHour = (this.currentHour + hoursPassed) % 24.0;
    }

    const state = this.getState();
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i](state);
    }
    return state;
  }

  public getState(): WorldTimeState {
    return {
      hour: this.currentHour,
      normalizedTime: this.currentHour / 24.0,
      phase: this.getPhase(),
      daylight: this.getDaylightFactor(),
      nightFactor: this.getNightFactor(),
      isPaused: this.isPaused,
      timeMultiplier: this.timeMultiplier,
      cycleDurationSeconds: this.cycleDurationSeconds
    };
  }

  public addListener(cb: (state: WorldTimeState) => void) {
    this.listeners.push(cb);
  }

  public removeListener(cb: (state: WorldTimeState) => void) {
    this.listeners = this.listeners.filter((l) => l !== cb);
  }
}
