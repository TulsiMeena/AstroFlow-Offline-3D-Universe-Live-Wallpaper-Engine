import { DesignDNA, SavedCustomWallpaper } from '../types/designDNA';

export interface AndroidWallpaperPayload {
  version: string;
  appTitle: string;
  wallpaperId: string;
  seed: string;
  elements: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
    background: string;
  };
  material: {
    type: string;
    roughness: number;
    metalness: number;
    transmission: number;
  };
  physics: {
    particleDensity: number;
    particleSpeed: number;
    gravity: number;
  };
  audioReactive: boolean;
  exportedAt: number;
  disclaimer: string;
}

export class CustomWallpaperBridge {
  private static listeners: ((payload: AndroidWallpaperPayload) => void)[] = [];

  /**
   * Generates a formatted payload ready for Android Live Wallpaper Service consumption
   */
  public static getAndroidPayload(dna: DesignDNA, customTitle?: string): AndroidWallpaperPayload {
    return {
      version: '3.0.0-HYPERWALL',
      appTitle: customTitle || dna.name || 'Amit HyperWall Custom Fusion',
      wallpaperId: `custom-fusion-${dna.seed}`,
      seed: dna.seed,
      elements: [...dna.elements],
      colors: {
        primary: dna.colors.primary,
        secondary: dna.colors.secondary,
        accent: dna.colors.accent,
        glow: dna.colors.glow,
        background: dna.colors.background,
      },
      material: {
        type: dna.material.type,
        roughness: dna.material.roughness,
        metalness: dna.material.metalness,
        transmission: dna.material.transmission,
      },
      physics: {
        particleDensity: dna.physics.particleDensity,
        particleSpeed: dna.physics.particleSpeed,
        gravity: dna.physics.gravity,
      },
      audioReactive: dna.audio.enabled,
      exportedAt: Date.now(),
      disclaimer: 'Browser sandbox security: WebGL designs are simulated in-browser. Android deployment operates via Amit HyperWall Live Wallpaper Engine service.',
    };
  }

  /**
   * Dispatches the Android Bridge event if native bridge is registered (e.g. window.AndroidHyperWallBridge)
   */
  public static dispatchToNativeBridge(dna: DesignDNA): boolean {
    const payload = this.getAndroidPayload(dna);

    // Notify registered JS listeners
    this.listeners.forEach(fn => {
      try {
        fn(payload);
      } catch (err) {
        console.error('Error in bridge listener:', err);
      }
    });

    // Check for native Android WebView JavascriptInterface
    if (typeof window !== 'undefined' && (window as any).AndroidHyperWallBridge) {
      try {
        (window as any).AndroidHyperWallBridge.setLiveWallpaperDNA(JSON.stringify(payload));
        return true;
      } catch (e) {
        console.warn('Native Android bridge call failed:', e);
      }
    }

    return false;
  }

  public static addListener(callback: (payload: AndroidWallpaperPayload) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  }
}
