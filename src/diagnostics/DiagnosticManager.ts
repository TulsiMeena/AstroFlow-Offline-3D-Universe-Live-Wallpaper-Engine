import { DiagnosticsSnapshot, MemoryDiagnostics } from './types';
import { QualityProfile, RenderStats } from '../types/engine';
import { PowerMode } from '../power/types';
import { detectGPU } from '../utils/gpuDetector';
import { ErrorManager } from './ErrorManager';

/**
 * Diagnostic Manager for Amit HyperWall
 * Collects genuine runtime hardware and WebGL telemetry.
 * Strictly avoids inventing unsupported metrics.
 */
export class DiagnosticManager {
  private static instance: DiagnosticManager | null = null;
  private currentStats: RenderStats = {
    fps: 60,
    frameTime: 16.6,
    drawCalls: 0,
    triangles: 0,
    points: 0,
    particleCount: 0
  };

  private qualityProfile: QualityProfile = 'HIGH';
  private activeWallpaperId: string = 'cosmic-particle-field';
  private powerMode: PowerMode = 'BALANCED';
  private isMotionAvailable: boolean = false;
  private isAudioAvailable: boolean = false;

  public static getInstance(): DiagnosticManager {
    if (!DiagnosticManager.instance) {
      DiagnosticManager.instance = new DiagnosticManager();
    }
    return DiagnosticManager.instance;
  }

  private constructor() {}

  public updateRenderStats(stats: RenderStats) {
    this.currentStats = { ...stats };
  }

  public updateEnvironment(params: {
    qualityProfile?: QualityProfile;
    activeWallpaperId?: string;
    powerMode?: PowerMode;
    isMotionAvailable?: boolean;
    isAudioAvailable?: boolean;
  }) {
    if (params.qualityProfile) this.qualityProfile = params.qualityProfile;
    if (params.activeWallpaperId) this.activeWallpaperId = params.activeWallpaperId;
    if (params.powerMode) this.powerMode = params.powerMode;
    if (params.isMotionAvailable !== undefined) this.isMotionAvailable = params.isMotionAvailable;
    if (params.isAudioAvailable !== undefined) this.isAudioAvailable = params.isAudioAvailable;
  }

  public getMemoryDiagnostics(): MemoryDiagnostics {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const perfAny = window.performance as any;
      if (perfAny.memory) {
        return {
          isAvailable: true,
          usedJSHeapSizeMB: Number((perfAny.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)),
          totalJSHeapSizeMB: Number((perfAny.memory.totalJSHeapSize / (1024 * 1024)).toFixed(1)),
          jsHeapSizeLimitMB: Number((perfAny.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(1))
        };
      }
    }
    return { isAvailable: false };
  }

  public getSnapshot(): DiagnosticsSnapshot {
    const gpu = detectGPU();
    const mem = this.getMemoryDiagnostics();
    const errorCount = ErrorManager.getInstance().getRecentErrors().length;

    let maxTexture = 0;
    let maxVertUniforms = 0;
    let maxFragUniforms = 0;
    let webglVersion = 'Unavailable';

    if (typeof window !== 'undefined') {
      try {
        const c = document.createElement('canvas');
        const gl = c.getContext('webgl2') || c.getContext('webgl');
        if (gl) {
          webglVersion = gl instanceof (window as any).WebGL2RenderingContext ? 'WebGL 2.0' : 'WebGL 1.0';
          maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;
          maxVertUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) || 0;
          maxFragUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) || 0;
        }
      } catch {
        // Safe fallback
      }
    }

    return {
      timestamp: Date.now(),
      appName: 'Amit HyperWall',
      appVersion: '1.5.0',
      owner: 'Amit Meena',
      webglSupported: gpu.webglSupported ?? true,
      webglVersion,
      unmaskedRenderer: gpu.unmaskedRenderer ?? gpu.renderer,
      unmaskedVendor: gpu.unmaskedVendor ?? gpu.vendor,
      maxTextureSize: maxTexture,
      maxVertexUniforms: maxVertUniforms,
      maxFragmentUniforms: maxFragUniforms,
      gpuTier: gpu.tier,
      qualityProfile: this.qualityProfile,
      activeWallpaperId: this.activeWallpaperId,
      fps: this.currentStats.fps,
      frameTime: this.currentStats.frameTime,
      drawCalls: this.currentStats.drawCalls,
      triangles: this.currentStats.triangles,
      particleCount: this.currentStats.particleCount,
      powerMode: this.powerMode,
      isDocumentVisible: typeof document !== 'undefined' ? !document.hidden : true,
      isMotionSensorAvailable: this.isMotionAvailable,
      isAudioReactiveAvailable: this.isAudioAvailable,
      memory: mem,
      recentErrorsCount: errorCount
    };
  }

  public formatDiagnosticsReport(): string {
    const s = this.getSnapshot();
    return [
      `# AMIT HYPERWALL — DIAGNOSTICS REPORT`,
      `Owner: ${s.owner}`,
      `Generated: ${new Date(s.timestamp).toISOString()}`,
      `App: ${s.appName} v${s.appVersion}`,
      ``,
      `## HARDWARE & GPU`,
      `- WebGL Support: ${s.webglSupported ? 'YES (' + s.webglVersion + ')' : 'NO'}`,
      `- GPU Tier: ${s.gpuTier}`,
      `- Renderer: ${s.unmaskedRenderer}`,
      `- Vendor: ${s.unmaskedVendor}`,
      `- Max Texture Size: ${s.maxTextureSize}px`,
      `- Uniform Limits: Vert ${s.maxVertexUniforms}, Frag ${s.maxFragmentUniforms}`,
      ``,
      `## RENDERING & ENGINE`,
      `- Active Wallpaper: ${s.activeWallpaperId}`,
      `- Quality Profile: ${s.qualityProfile}`,
      `- Realtime FPS: ${s.fps} FPS`,
      `- Frame Time: ${s.frameTime} ms`,
      `- Draw Calls: ${s.drawCalls}`,
      `- Geometry Triangles: ${s.triangles.toLocaleString()}`,
      `- Active Particles: ${s.particleCount.toLocaleString()}`,
      `- Power Optimization Mode: ${s.powerMode}`,
      ``,
      `## INPUT & PERIPHERALS`,
      `- Document Visible: ${s.isDocumentVisible}`,
      `- Motion Sensors Available: ${s.isMotionSensorAvailable}`,
      `- Audio Reactive Available: ${s.isAudioReactiveAvailable}`,
      ``,
      `## MEMORY & STABILITY`,
      `- Browser Memory API: ${s.memory.isAvailable ? 'Supported' : 'Not exposed by browser security policy'}`,
      ...(s.memory.isAvailable
        ? [
            `- Used JS Heap: ${s.memory.usedJSHeapSizeMB} MB`,
            `- Total JS Heap: ${s.memory.totalJSHeapSizeMB} MB`,
            `- Heap Limit: ${s.memory.jsHeapSizeLimitMB} MB`
          ]
        : []),
      `- Recent Error Events: ${s.recentErrorsCount}`
    ].join('\n');
  }
}
