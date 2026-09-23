import { useEffect, useRef, useState, useCallback } from 'react';
import { WallpaperEngine } from '../engine/WallpaperEngine';
import { QualityProfile, RenderStats, MotionData, MotionEventType, MotionCalibrationSettings } from '../types/engine';
import { WallpaperStorage } from '../storage/wallpaperStorage';

export function useWallpaperEngine(initialWallpaperId?: string) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<WallpaperEngine | null>(null);

  const [activeId, setActiveId] = useState<string>(
    initialWallpaperId || WallpaperStorage.getPreferences().activeWallpaperId
  );
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [quality, setQualityState] = useState<QualityProfile>(
    WallpaperStorage.getPreferences().qualityProfile
  );
  const [stats, setStats] = useState<RenderStats>({
    fps: 60,
    frameTime: 16.6,
    drawCalls: 1,
    triangles: 0,
    points: 0,
    particleCount: 0
  });
  const [motionData, setMotionData] = useState<MotionData>({
    tiltX: 0,
    tiltY: 0,
    roll: 0,
    isAvailable: false
  });
  const [isSupported, setIsSupported] = useState<boolean>(true);

  // Throttled stats update to prevent React render flooding
  const lastStatsUpdate = useRef<number>(0);

  const onStatsUpdate = useCallback((newStats: RenderStats) => {
    const now = performance.now();
    if (now - lastStatsUpdate.current > 350) {
      setStats(newStats);
      if (engineRef.current) {
        setMotionData(engineRef.current.getMotionManager().getMotionData());
      }
      lastStatsUpdate.current = now;
    }
  }, []);

  const onMotionEvent = useCallback((event: MotionEventType) => {
    setMotionData(prev => ({ ...prev, lastMotionEvent: event }));
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const prefs = WallpaperStorage.getPreferences();
    const engine = new WallpaperEngine(
      {
        onStatsUpdate,
        onMotionEvent,
        onQualityChange: (newQuality) => {
          setQualityState(newQuality);
          WallpaperStorage.savePreferences({ qualityProfile: newQuality });
        },
        onError: (err) => {
          console.error(err);
          setIsSupported(false);
        }
      },
      prefs.qualityProfile
    );

    // Apply persisted motion settings
    engine.getMotionManager().updateCalibration({
      enabled: prefs.motionEnabled,
      sensitivity: prefs.motionSensitivity,
      smoothing: prefs.motionSmoothing,
      reducedMotion: prefs.reducedMotion
    });

    const targetId = initialWallpaperId || prefs.activeWallpaperId;
    const ok = engine.init(canvasRef.current, containerRef.current);
    if (!ok) {
      setIsSupported(false);
      return;
    }

    engine.loadWallpaper(targetId);
    engineRef.current = engine;
    setActiveId(targetId);
    setQualityState(engine.getQuality());

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [onStatsUpdate, onMotionEvent, initialWallpaperId]);

  const switchWallpaper = useCallback((id: string) => {
    if (engineRef.current) {
      const ok = engineRef.current.loadWallpaper(id);
      if (ok) {
        setActiveId(id);
        WallpaperStorage.savePreferences({ activeWallpaperId: id });
      }
    }
  }, []);

  const togglePause = useCallback(() => {
    if (engineRef.current) {
      const paused = engineRef.current.togglePause();
      setIsPaused(paused);
    }
  }, []);

  const setQuality = useCallback((profile: QualityProfile) => {
    if (engineRef.current) {
      engineRef.current.setQuality(profile);
      setQualityState(profile);
      WallpaperStorage.savePreferences({ qualityProfile: profile });
    }
  }, []);

  const updateMotionCalibration = useCallback((settings: Partial<MotionCalibrationSettings>) => {
    if (engineRef.current) {
      engineRef.current.updateMotionCalibration(settings);
    }
  }, []);

  const calibrateMotionCenter = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.calibrateMotionCenter();
    }
  }, []);

  const resetMotionCalibration = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resetMotionCalibration();
    }
  }, []);

  return {
    canvasRef,
    containerRef,
    engine: engineRef.current,
    activeId,
    isPaused,
    quality,
    stats,
    motionData,
    isSupported,
    switchWallpaper,
    togglePause,
    setQuality,
    updateMotionCalibration,
    calibrateMotionCenter,
    resetMotionCalibration
  };
}
