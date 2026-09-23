export interface RealDeviceBattery {
  isSupported: boolean;
  level: number | null; // 0.0 to 1.0
  charging: boolean | null;
  statusMessage: string;
}

export interface DeviceStateObserver {
  onBatteryChange?: (battery: RealDeviceBattery) => void;
  onVisibilityChange?: (isVisible: boolean) => void;
  onReducedMotionChange?: (reducedMotion: boolean) => void;
}

export class DeviceStateAdapter {
  private static instance: DeviceStateAdapter;
  private batteryInfo: RealDeviceBattery = {
    isSupported: false,
    level: null,
    charging: null,
    statusMessage: 'Battery API not supported on this browser'
  };
  private isVisible: boolean = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
  private isReducedMotion: boolean = false;
  private batteryManager: any = null;
  private observers: Set<DeviceStateObserver> = new Set();

  private constructor() {
    this.initVisibilityListener();
    this.initReducedMotionListener();
    this.initBatteryListener();
  }

  public static getInstance(): DeviceStateAdapter {
    if (!DeviceStateAdapter.instance) {
      DeviceStateAdapter.instance = new DeviceStateAdapter();
    }
    return DeviceStateAdapter.instance;
  }

  public subscribe(observer: DeviceStateObserver): () => void {
    this.observers.add(observer);
    return () => {
      this.observers.delete(observer);
    };
  }

  private initVisibilityListener() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isVisible = document.visibilityState === 'visible';
        this.notifyVisibilityChange();
      });
    }
  }

  private initReducedMotionListener() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.isReducedMotion = mediaQuery.matches;

      const handler = (e: MediaQueryListEvent) => {
        this.isReducedMotion = e.matches;
        this.notifyReducedMotionChange();
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handler);
      } else if ((mediaQuery as any).addListener) {
        (mediaQuery as any).addListener(handler);
      }
    }
  }

  private async initBatteryListener() {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const bm = await (navigator as any).getBattery();
        this.batteryManager = bm;
        this.updateBatteryState(bm);

        const onLevelChange = () => this.updateBatteryState(bm);
        const onChargingChange = () => this.updateBatteryState(bm);

        bm.addEventListener('levelchange', onLevelChange);
        bm.addEventListener('chargingchange', onChargingChange);
      } catch (err) {
        this.batteryInfo = {
          isSupported: false,
          level: null,
          charging: null,
          statusMessage: 'Battery status access restricted or denied'
        };
        this.notifyBatteryChange();
      }
    } else {
      this.batteryInfo = {
        isSupported: false,
        level: null,
        charging: null,
        statusMessage: 'Battery API not supported on this platform'
      };
    }
  }

  private updateBatteryState(bm: any) {
    const rawLevel = typeof bm.level === 'number' ? bm.level : null;
    const isCharging = typeof bm.charging === 'boolean' ? bm.charging : null;

    this.batteryInfo = {
      isSupported: true,
      level: rawLevel,
      charging: isCharging,
      statusMessage: rawLevel !== null
        ? `${Math.round(rawLevel * 100)}% (${isCharging ? 'Charging' : 'Discharging'})`
        : 'Battery level reading unavailable'
    };

    this.notifyBatteryChange();
  }

  private notifyBatteryChange() {
    this.observers.forEach((obs) => obs.onBatteryChange?.(this.batteryInfo));
  }

  private notifyVisibilityChange() {
    this.observers.forEach((obs) => obs.onVisibilityChange?.(this.isVisible));
  }

  private notifyReducedMotionChange() {
    this.observers.forEach((obs) => obs.onReducedMotionChange?.(this.isReducedMotion));
  }

  // Getters
  public getBatteryInfo(): RealDeviceBattery {
    return { ...this.batteryInfo };
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }

  public getIsReducedMotion(): boolean {
    return this.isReducedMotion;
  }

  public isMotionSensorAvailable(): boolean {
    return typeof window !== 'undefined' && ('DeviceMotionEvent' in window || 'DeviceOrientationEvent' in window);
  }

  public isAudioAvailable(): boolean {
    return typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
  }

  public getHardwareConcurrency(): number {
    return typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  }
}

/**
 * AndroidContextBridge:
 * Clean boundary interface for Android Live Wallpaper integration.
 * In Web runtime, delegates to DeviceStateAdapter without inventing fake data.
 */
export class AndroidContextBridge {
  private static instance: AndroidContextBridge;
  private isNativeAndroidHost: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined' && (window as any).AmitHyperWallAndroidBridge) {
      this.isNativeAndroidHost = true;
    }
  }

  public static getInstance(): AndroidContextBridge {
    if (!AndroidContextBridge.instance) {
      AndroidContextBridge.instance = new AndroidContextBridge();
    }
    return AndroidContextBridge.instance;
  }

  public isAndroidNative(): boolean {
    return this.isNativeAndroidHost;
  }

  public notifyWallpaperChangedToNative(wallpaperId: string, title: string) {
    if (this.isNativeAndroidHost && (window as any).AmitHyperWallAndroidBridge?.onWallpaperChanged) {
      try {
        (window as any).AmitHyperWallAndroidBridge.onWallpaperChanged(wallpaperId, title);
      } catch (e) {
        console.warn('[AndroidBridge] Native call failed', e);
      }
    }
  }

  public notifyPowerModeToNative(mode: string) {
    if (this.isNativeAndroidHost && (window as any).AmitHyperWallAndroidBridge?.onPowerModeChanged) {
      try {
        (window as any).AmitHyperWallAndroidBridge.onPowerModeChanged(mode);
      } catch (e) {
        console.warn('[AndroidBridge] Native call failed', e);
      }
    }
  }
}
