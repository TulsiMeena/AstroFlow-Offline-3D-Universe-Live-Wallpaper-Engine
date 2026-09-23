import React, { useState, useEffect } from 'react';
import { useWallpaperEngine } from './hooks/useWallpaperEngine';
import { useFavorites } from './hooks/useFavorites';
import { useSettings } from './hooks/useSettings';
import { WallpaperRegistry } from './engine/WallpaperRegistry';
import { Navbar, TabType } from './components/Navbar';
import { PreviewOverlay } from './components/PreviewOverlay';
import { MotionCalibrationModal } from './components/MotionCalibrationModal';
import { DeveloperTelemetryHUD } from './components/DeveloperTelemetryHUD';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Favorites } from './pages/Favorites';
import { Settings } from './pages/Settings';
import { UniverseLab } from './pages/UniverseLab';
import { EnvironmentStudio } from './pages/EnvironmentStudio';
import { PhysicsLab } from './pages/PhysicsLab';
import { CinematicLab } from './pages/CinematicLab';
import { AudioLab } from './pages/AudioLab';
import { WallpaperLab } from './pages/WallpaperLab';
import { PowerCenter } from './pages/PowerCenter';
import { PersonalUniverse } from './pages/PersonalUniverse';
import { WallpaperLibrary } from './pages/WallpaperLibrary';
import { PersonalWorld } from './personal/types';
import { PersonalUniverseWallpaper } from './wallpapers/PersonalUniverseWallpaper';
import { AutomationStudio } from './pages/AutomationStudio';
import { SmartSchedulerEngine } from './scheduler/SmartSchedulerEngine';
import { TransitionOverlay } from './components/scheduler/TransitionOverlay';
import { WorldDNA } from './universe/types/worldDNA';
import { UniverseStorage } from './universe/storage/universeStorage';
import { EnvironmentDNA } from './environment/types/environmentDNA';
import { EcosystemDNA } from './living/EcosystemDNA';
import { ProceduralEnvironmentWallpaper } from './wallpapers/ProceduralEnvironmentWallpaper';
import { InfiniteWorldWallpaper } from './wallpapers/InfiniteWorldWallpaper';
import { FusionDNA } from './infinite/types/infiniteTypes';
import { DesignDNA } from './designer/types/designDNA';
import { WallpaperFusionEngine } from './designer/engine/WallpaperFusionEngine';
import { WebGLFailureScreen } from './components/diagnostics/WebGLFailureScreen';
import { AdvancedDiagnosticsModal } from './components/diagnostics/AdvancedDiagnosticsModal';
import { AndroidBridgeModal } from './components/android/AndroidBridgeModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [calibrationOpen, setCalibrationOpen] = useState<boolean>(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState<boolean>(false);
  const [androidBridgeOpen, setAndroidBridgeOpen] = useState<boolean>(false);

  const registry = WallpaperRegistry.getInstance();
  const allWallpapers = registry.getAllMetadata();

  const {
    canvasRef,
    containerRef,
    activeId,
    isPaused,
    quality,
    stats,
    motionData,
    isSupported,
    switchWallpaper,
    togglePause,
    setQuality,
    engine
  } = useWallpaperEngine();

  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { preferences, updateSetting } = useSettings();

  // Initialize Smart Wallpaper Scheduler & Context Automation Engine
  useEffect(() => {
    const scheduler = SmartSchedulerEngine.getInstance();
    scheduler.init(activeId, (targetId) => {
      switchWallpaper(targetId);
    });
  }, [activeId, switchWallpaper]);

  const handleSelectWallpaper = (id: string) => {
    switchWallpaper(id);
  };

  const handleOpenPreview = (id: string) => {
    switchWallpaper(id);
    setPreviewId(id);
  };

  const handleApplyUniverse = (dna: WorldDNA) => {
    UniverseStorage.setActiveDNA(dna);
    switchWallpaper('procedural-universe');
  };

  const handleApplyEnvironment = (dna: EnvironmentDNA, ecoDNA?: EcosystemDNA) => {
    const customId = `custom-env-${dna.id}`;
    registry.register(customId, () => new ProceduralEnvironmentWallpaper(dna.biome, dna, ecoDNA));
    switchWallpaper(customId);
  };

  const handleApplyFusedWorld = (dna: FusionDNA) => {
    const customId = `fused-${dna.id}`;
    registry.register(customId, () => new InfiniteWorldWallpaper(dna));
    switchWallpaper(customId);
  };

  const handleApplyCustomDesign = (dna: DesignDNA) => {
    const customId = `custom-design-${dna.seed}`;
    registry.register(customId, () => new WallpaperFusionEngine(dna));
    switchWallpaper(customId);
  };

  const handleApplyPersonalWorld = (world: PersonalWorld) => {
    const customId = `personal-${world.id}`;
    registry.register(customId, () => new PersonalUniverseWallpaper(world));
    switchWallpaper(customId);
  };

  const currentPreviewWallpaper = allWallpapers.find(
    (w) => w.id === (previewId || activeId)
  ) || allWallpapers[0];

  return (
    <div className="relative w-full h-full bg-[#05070e] text-slate-100 overflow-hidden flex flex-col font-sans">
      {/* 3D WebGL Canvas Layer - Fixed in Background */}
      <div
        ref={containerRef}
        className="fixed inset-0 z-0 pointer-events-auto touch-none overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block touch-none cursor-grab active:cursor-grabbing"
        />
        {/* Subtle Dark Vignette Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-black/20 to-black/70" />
      </div>

      {/* Global Procedural 3D Transition Visualizer */}
      <TransitionOverlay />

      {/* Developer Telemetry HUD (Active when Developer Mode is enabled in Settings) */}
      <DeveloperTelemetryHUD
        stats={stats}
        quality={quality}
        motionData={motionData}
        visible={preferences.developerMode}
        physicsObjectCount={engine?.getGravityManager().getSources().length || 0}
      />

      {/* WebGL Failure Recovery Screen */}
      {!isSupported && (
        <WebGLFailureScreen
          onRetry={() => window.location.reload()}
          onLowPerformanceMode={() => {
            setQuality('LOW');
            window.location.reload();
          }}
        />
      )}

      {/* Advanced Diagnostics & WebGL Telemetry Modal */}
      <AdvancedDiagnosticsModal
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
      />

      {/* Android Live Wallpaper IPC Bridge Modal */}
      <AndroidBridgeModal
        isOpen={androidBridgeOpen}
        onClose={() => setAndroidBridgeOpen(false)}
      />

      {/* Fullscreen Interactive Preview Overlay */}
      {previewId && currentPreviewWallpaper && (
        <PreviewOverlay
          wallpaper={currentPreviewWallpaper}
          isPaused={isPaused}
          quality={quality}
          stats={stats}
          isFavorite={isFavorite(currentPreviewWallpaper.id)}
          onTogglePause={togglePause}
          onSelectQuality={setQuality}
          onToggleFavorite={() => toggleFavorite(currentPreviewWallpaper.id)}
          onClose={() => setPreviewId(null)}
        />
      )}

      {/* Motion Calibration Modal */}
      {engine && (
        <MotionCalibrationModal
          motionManager={engine.getMotionManager()}
          isOpen={calibrationOpen}
          onClose={() => setCalibrationOpen(false)}
        />
      )}

      {/* Main Glassmorphic Navigation and Page Shell */}
      {!previewId && (
        <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
          {/* Header & Bottom Navbar */}
          <div className="pointer-events-auto">
            <Navbar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              activeWallpaperTitle={currentPreviewWallpaper?.title}
              onOpenLivePreview={() => setPreviewId(activeId)}
              onOpenDiagnostics={() => setDiagnosticsOpen(true)}
              onOpenAndroidBridge={() => setAndroidBridgeOpen(true)}
            />
          </div>

          {/* Active Tab View */}
          <main className="flex-1 w-full overflow-hidden pointer-events-auto">
            {activeTab === 'home' && (
              <Home
                wallpapers={allWallpapers}
                activeId={activeId}
                quality={quality}
                stats={stats}
                gpuTier={engine?.getGPUInfo().tier || 'MEDIUM'}
                isFavorite={isFavorite}
                onSelectWallpaper={handleSelectWallpaper}
                onToggleFavorite={toggleFavorite}
                onOpenPreview={handleOpenPreview}
                onNavigateExplore={() => setActiveTab('explore')}
                onNavigateScheduler={() => setActiveTab('scheduler')}
                onNavigateLibrary={() => setActiveTab('library')}
                onNavigatePersonal={() => setActiveTab('personal')}
                onNavigateDesigner={() => setActiveTab('designer')}
                onNavigateLab={() => setActiveTab('lab')}
                onNavigateEnvironments={() => setActiveTab('environments')}
                onNavigatePhysics={() => setActiveTab('physics')}
                onNavigateCinematic={() => setActiveTab('cinematic')}
                onNavigateAudio={() => setActiveTab('audio')}
              />
            )}

            {activeTab === 'explore' && (
              <Explore
                wallpapers={allWallpapers}
                activeId={activeId}
                isFavorite={isFavorite}
                onSelectWallpaper={handleSelectWallpaper}
                onToggleFavorite={toggleFavorite}
                onOpenPreview={handleOpenPreview}
                onApplyFusedWorld={handleApplyFusedWorld}
                qualityProfile={quality}
              />
            )}

            {activeTab === 'library' && (
              <WallpaperLibrary
                activeWallpaperId={activeId}
                onApplyWallpaper={handleSelectWallpaper}
                onApplyPersonalWorld={handleApplyPersonalWorld}
                onApplyCustomDesign={handleApplyCustomDesign}
                onApplyFusedWorld={handleApplyFusedWorld}
                onNavigateToPersonalUniverse={() => setActiveTab('personal')}
              />
            )}

            {activeTab === 'scheduler' && (
              <AutomationStudio
                onApplyWallpaper={handleSelectWallpaper}
                onOpenLivePreview={() => setPreviewId(activeId)}
              />
            )}

            {activeTab === 'personal' && (
              <PersonalUniverse
                engine={engine}
                onApplyWorld={handleApplyPersonalWorld}
                onOpenLivePreview={() => setPreviewId(activeId)}
              />
            )}

            {activeTab === 'designer' && (
              <WallpaperLab
                qualityProfile={preferences.qualityProfile}
                audioEngine={engine?.getAudioEngine()}
                onApplyToEngine={handleApplyCustomDesign}
                onOpenLivePreview={() => setPreviewId(activeId)}
              />
            )}

            {activeTab === 'power' && (
              <PowerCenter
                powerEngine={engine?.getPowerEngine()}
              />
            )}

            {activeTab === 'environments' && (
              <EnvironmentStudio
                activeWallpaperId={activeId}
                onApplyEnvironment={handleApplyEnvironment}
                onOpenLivePreview={() => setPreviewId(activeId)}
              />
            )}

            {activeTab === 'lab' && (
              <UniverseLab
                activeWallpaperId={activeId}
                onApplyUniverse={handleApplyUniverse}
                onOpenLivePreview={() => setPreviewId('procedural-universe')}
              />
            )}

            {activeTab === 'physics' && (
              <PhysicsLab
                physicsEngine={engine?.getPhysicsEngine()}
                qualityProfile={preferences.qualityProfile}
                onOpenLivePreview={() => setPreviewId(activeId)}
              />
            )}

            {activeTab === 'cinematic' && (
              <CinematicLab
                cinematicEngine={engine?.getCinematicEngine()}
                qualityProfile={preferences.qualityProfile}
                onOpenLivePreview={() => setPreviewId(activeId)}
              />
            )}

            {activeTab === 'audio' && (
              <AudioLab
                audioEngine={engine?.getAudioEngine()}
                qualityProfile={preferences.qualityProfile}
                activeWallpaperId={activeId}
                onOpenLivePreview={() => setPreviewId(activeId)}
              />
            )}

            {activeTab === 'favorites' && (
              <Favorites
                wallpapers={allWallpapers}
                favorites={favorites}
                activeId={activeId}
                isFavorite={isFavorite}
                onSelectWallpaper={handleSelectWallpaper}
                onToggleFavorite={toggleFavorite}
                onOpenPreview={handleOpenPreview}
                onNavigateExplore={() => setActiveTab('explore')}
              />
            )}

            {activeTab === 'settings' && (
              <Settings
                preferences={preferences}
                gpuInfo={
                  engine?.getGPUInfo() || {
                    tier: 'MEDIUM',
                    vendor: 'Detected Hardware',
                    renderer: 'Standard WebGL',
                    isWebGL2: true
                  }
                }
                onUpdateQuality={setQuality}
                onUpdateSetting={(key, val) => {
                  updateSetting(key, val);
                  if (key === 'motionSensitivity' && engine) {
                    engine.setMotionSensitivity(val as number);
                  } else if (key === 'motionEnabled' && engine) {
                    engine.getMotionManager().setEnabled(val as boolean);
                  } else if (key === 'reducedMotion' && engine) {
                    engine.getMotionManager().setReducedMotion(val as boolean);
                  } else if (key === 'motionSmoothing' && engine) {
                    engine.getMotionManager().setSmoothing(val as number);
                  }
                }}
                onOpenCalibration={() => setCalibrationOpen(true)}
                onOpenDiagnostics={() => setDiagnosticsOpen(true)}
                onOpenAndroidBridge={() => setAndroidBridgeOpen(true)}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
};
export default App;
