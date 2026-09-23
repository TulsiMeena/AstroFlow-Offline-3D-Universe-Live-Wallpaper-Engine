import * as THREE from 'three';
import { QualityConfig } from '../types/engine';
import { ErrorManager } from '../diagnostics/ErrorManager';
import { RecoveryManager } from '../diagnostics/RecoveryManager';

export class EngineRenderer {
  private renderer: THREE.WebGLRenderer | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private isWebGLSupported: boolean = true;
  private isContextLost: boolean = false;
  private currentWidth: number = 0;
  private currentHeight: number = 0;

  private onContextLostCallback?: () => void;
  private onContextRestoredCallback?: () => void;

  private boundContextLost = this.handleContextLost.bind(this);
  private boundContextRestored = this.handleContextRestored.bind(this);

  constructor() {
    this.isWebGLSupported = this.checkWebGL();
  }

  private checkWebGL(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch {
      return false;
    }
  }

  public setContextCallbacks(onLost?: () => void, onRestored?: () => void) {
    this.onContextLostCallback = onLost;
    this.onContextRestoredCallback = onRestored;
  }

  private handleContextLost(event: Event) {
    event.preventDefault(); // Required by WebGL spec to allow context restoration!
    this.isContextLost = true;
    console.warn('[EngineRenderer] WebGL Context Lost! Initiating recovery pipeline...');
    RecoveryManager.getInstance().handleContextLoss(() => {
      this.onContextLostCallback?.();
    });
  }

  private handleContextRestored() {
    this.isContextLost = false;
    console.info('[EngineRenderer] WebGL Context successfully restored.');
    RecoveryManager.getInstance().resetRecoveryCounter();
    this.onContextRestoredCallback?.();
  }

  public init(canvas: HTMLCanvasElement, quality: QualityConfig): boolean {
    this.canvas = canvas;
    if (!this.isWebGLSupported) {
      return false;
    }

    // Attach WebGL context lifecycle listeners
    canvas.addEventListener('webglcontextlost', this.boundContextLost, false);
    canvas.addEventListener('webglcontextrestored', this.boundContextRestored, false);

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: quality.antialias,
        alpha: true,
        powerPreference: quality.profile === 'LOW' ? 'low-power' : 'high-performance',
        precision: quality.profile === 'LOW' ? 'mediump' : 'highp',
        stencil: false,
        depth: true
      });

      this.renderer.setPixelRatio(quality.resolutionScale);
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.1;

      if (quality.shadows) {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }

      this.isContextLost = false;
      return true;
    } catch (e: any) {
      console.error('Failed to initialize WebGLRenderer:', e);
      this.isWebGLSupported = false;
      ErrorManager.getInstance().reportError({
        category: 'WEBGL',
        severity: 'FATAL',
        message: e?.message || 'WebGL initialization failure',
        userFacingMessage: '3D rendering is unavailable on this device/browser.',
        recoverable: false
      });
      return false;
    }
  }

  public resize(width: number, height: number, quality: QualityConfig) {
    if (!this.renderer || this.isContextLost) return;
    this.currentWidth = width;
    this.currentHeight = height;
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(quality.resolutionScale);
  }

  public applyQuality(quality: QualityConfig) {
    if (!this.renderer || this.isContextLost) return;
    this.renderer.setPixelRatio(quality.resolutionScale);
    this.renderer.shadowMap.enabled = quality.shadows;
  }

  public render(scene: THREE.Scene, camera: THREE.Camera) {
    if (!this.renderer || this.isContextLost) return;
    this.renderer.render(scene, camera);
  }

  public getWebGLRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }

  public isSupported(): boolean {
    return this.isWebGLSupported;
  }

  public getIsContextLost(): boolean {
    return this.isContextLost;
  }

  public dispose() {
    if (this.canvas) {
      this.canvas.removeEventListener('webglcontextlost', this.boundContextLost);
      this.canvas.removeEventListener('webglcontextrestored', this.boundContextRestored);
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer = null;
    }
    this.canvas = null;
  }
}
