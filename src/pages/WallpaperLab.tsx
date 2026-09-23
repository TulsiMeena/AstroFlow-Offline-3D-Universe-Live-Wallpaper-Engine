import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Sparkles,
  Shuffle,
  RotateCcw,
  Undo2,
  Redo2,
  Save,
  Play,
  Pause,
  Maximize2,
  Sliders,
  Layers,
  Palette,
  Atom,
  Flame,
  Camera,
  Activity,
  Music,
  Zap,
  Check,
  Trash2,
  Download,
  Share2,
  Heart,
  Globe,
  Plus,
  Compass,
  Radio,
  Eye,
  Smartphone,
  BatteryCharging,
  Moon
} from 'lucide-react';
import { BatteryImpactEstimator } from '../power/BatteryImpactEstimator';
import {
  DesignDNA,
  FusionElement,
  LayerType,
  MaterialType,
  ColorPreset,
  SavedCustomWallpaper
} from '../designer/types/designDNA';
import { DesignSeedEngine } from '../designer/seed/DesignSeedEngine';
import { PresetManager } from '../designer/presets/PresetManager';
import { ProceduralColorEngine } from '../designer/colors/ProceduralColorEngine';
import { CustomWallpaperManager } from '../designer/storage/CustomWallpaperManager';
import { CustomWallpaperBridge } from '../designer/bridge/CustomWallpaperBridge';
import { DesignHistoryManager } from '../designer/history/DesignHistoryManager';
import { WallpaperFusionEngine } from '../designer/engine/WallpaperFusionEngine';
import { QualityProfile, QualityConfig, TouchPointerState, MotionData } from '../types/engine';
import { AudioEngine } from '../audio/AudioEngine';

interface WallpaperLabProps {
  qualityProfile: QualityProfile;
  audioEngine?: AudioEngine;
  onApplyToEngine?: (dna: DesignDNA) => void;
  onOpenLivePreview?: () => void;
}

const ALL_ELEMENTS: FusionElement[] = [
  'SPACE', 'GALAXY', 'NEBULA', 'BLACK HOLE', 'PLANET',
  'OCEAN', 'FOREST', 'MOUNTAIN', 'RAIN', 'SNOW',
  'AURORA', 'VOLCANO', 'LAVA', 'CYBER CITY', 'NEON',
  'CRYSTAL', 'LIQUID GLASS', 'ENERGY', 'FRACTAL', 'PORTAL',
  'LIVING WORLD', 'PARTICLES'
];

const LAYER_LIST: LayerType[] = [
  'Background', 'Sky', 'Environment', 'Terrain', 'Main Object',
  'Particles', 'Atmosphere', 'Lighting', 'Effects', 'Foreground'
];

const MATERIALS_LIST: { id: MaterialType; label: string; desc: string }[] = [
  { id: 'energy', label: 'Radiant Energy', desc: 'Pulsing plasma interference with Fresnel glow' },
  { id: 'crystal', label: 'Prismatic Crystal', desc: 'High refraction index with diamond clearcoat' },
  { id: 'glass-style', label: 'Refractive Glass', desc: 'Smooth optical transmission and dispersion' },
  { id: 'liquid-style', label: 'Dynamic Fluid', desc: 'Undulating ripples and specular highlights' },
  { id: 'lava', label: 'Molten Magma', desc: 'Incandescent fissure veins with dark cooling crust' },
  { id: 'metal', label: 'Cyber Alloy', desc: 'Polished chrome with sharp specular reflection' },
  { id: 'ice', label: 'Glacial Frost', desc: 'Sub-zero crystalline frosted translucence' },
  { id: 'hologram', label: 'Scanline Hologram', desc: 'Digital interference with chromatic glitch' },
  { id: 'organic', label: 'Bioluminescent', desc: 'Velvety subsurface glow of sentient nature' },
  { id: 'cosmic dust', label: 'Stellar Dust', desc: 'Micro-crystalline interstellar particulate' },
];

export const WallpaperLab: React.FC<WallpaperLabProps> = ({
  qualityProfile,
  audioEngine,
  onApplyToEngine,
  onOpenLivePreview,
}) => {
  // Current active DNA
  const [dna, setDna] = useState<DesignDNA>(() => {
    return PresetManager.getPresetDNA('galaxy-aurora');
  });

  // History Manager
  const historyRef = useRef<DesignHistoryManager>(new DesignHistoryManager(dna));
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Active UI Section Tab
  type SectionTab = 'WORLD' | 'LAYERS' | 'MATERIAL' | 'COLOR' | 'PHYSICS' | 'CAMERA' | 'MOTION' | 'AUDIO' | 'EFFECTS';
  const [activeSection, setActiveSection] = useState<SectionTab>('WORLD');

  // Preview & Viewport State
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fusionEngineRef = useRef<WallpaperFusionEngine | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // Modals & Drawers
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveName, setSaveName] = useState<string>('');
  const [showSavedDrawer, setShowSavedDrawer] = useState<boolean>(false);
  const [savedWallpapers, setSavedWallpapers] = useState<SavedCustomWallpaper[]>(() =>
    CustomWallpaperManager.getSavedWallpapers()
  );
  const [showBridgeModal, setShowBridgeModal] = useState<boolean>(false);
  const [copiedSeed, setCopiedSeed] = useState<boolean>(false);
  const [copiedBridge, setCopiedBridge] = useState<boolean>(false);
  const [applySuccess, setApplySuccess] = useState<boolean>(false);

  // Update history state
  const syncHistoryState = () => {
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  };

  // Setup dedicated Three.js viewport
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(dna.camera.fov, width / height, 0.1, 1000);
    camera.position.set(0, 0, dna.camera.distance);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: qualityProfile !== 'LOW',
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, qualityProfile === 'ULTRA' ? 2 : 1.5));
    renderer.setClearColor(new THREE.Color(dna.colors.background), 1.0);
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const qConfig: QualityConfig = {
      profile: qualityProfile,
      resolutionScale: 1.0,
      maxParticleCount: qualityProfile === 'LOW' ? 2000 : qualityProfile === 'MEDIUM' ? 5000 : 12000,
      shadows: false,
      bloomEnabled: true,
      postProcessing: true,
      animationComplexity: 1.0,
      antialias: qualityProfile !== 'LOW',
    };

    const fusion = new WallpaperFusionEngine(dna);
    fusion.init(scene, camera, qConfig);
    fusionEngineRef.current = fusion;

    let prevTime = performance.now();

    const renderLoop = (timeNow: number) => {
      animationFrameRef.current = requestAnimationFrame(renderLoop);

      // FPS tracking
      frameCountRef.current++;
      if (timeNow - lastTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = timeNow;
      }

      const delta = (timeNow - prevTime) * 0.001;
      prevTime = timeNow;

      if (!isPaused && fusionEngineRef.current && cameraRef.current && sceneRef.current) {
        // Fetch audio targets if available
        let audioAnalysis: any = null;
        let audioTargets: any = null;
        if (audioEngine) {
          const aRes = audioEngine.update(delta, 'procedural-designer');
          audioAnalysis = aRes.analysis;
          audioTargets = aRes.targets;
        }

        const dummyInput: TouchPointerState = {
          x: 0,
          y: 0,
          deltaX: 0,
          deltaY: 0,
          isDown: false,
          pinchScale: 1,
        };

        const dummyMotion: MotionData = {
          tiltX: 0,
          tiltY: 0,
          roll: 0,
          isAvailable: false,
        };

        const ctx: any = {
          time: timeNow * 0.001,
          delta,
          quality: qConfig,
          input: dummyInput,
          motion: dummyMotion,
          camera: cameraRef.current,
          scene: sceneRef.current,
          renderer: rendererRef.current,
          interactionField: null,
          rippleField: null,
          energyReaction: { brightness: 1.0, particleSpeedMultiplier: 1.0 },
          gravityManager: null,
          parallaxManager: null,
          audioAnalysis,
          audioTargets,
        };

        fusionEngineRef.current.update(ctx);
        renderer.render(sceneRef.current, cameraRef.current);
      }
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (fusionEngineRef.current) {
        fusionEngineRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  // Incremental DNA updates to live engine without rebuilding Three.js scene
  const applyDNAUpdate = (newDNA: DesignDNA, forceGeometry: boolean = false, pushToHistory: boolean = true) => {
    const sanitized = DesignSeedEngine.sanitizeDNA(newDNA);
    setDna(sanitized);

    if (pushToHistory) {
      historyRef.current.pushState(sanitized);
      syncHistoryState();
    }

    if (fusionEngineRef.current) {
      fusionEngineRef.current.updateDNA(sanitized, forceGeometry);
    }

    if (rendererRef.current && sceneRef.current) {
      rendererRef.current.setClearColor(new THREE.Color(sanitized.colors.background), 1.0);
    }
  };

  // Button actions
  const handleCreateRandom = () => {
    const freshSeed = DesignSeedEngine.generateSeed();
    const newDNA = DesignSeedEngine.createDNAFromSeed(freshSeed);
    applyDNAUpdate(newDNA, true, true);
  };

  const handleRandomizeColors = () => {
    const updated = DesignSeedEngine.randomizeColors(dna);
    applyDNAUpdate(updated, false, true);
  };

  const handleRandomizeEffects = () => {
    const updated = DesignSeedEngine.randomizeEffects(dna);
    applyDNAUpdate(updated, false, true);
  };

  const handleRandomizeWorld = () => {
    const updated = DesignSeedEngine.randomizeWorld(dna);
    applyDNAUpdate(updated, true, true);
  };

  const handleRandomizeCamera = () => {
    const updated = DesignSeedEngine.randomizeCamera(dna);
    applyDNAUpdate(updated, false, true);
  };

  const handleUndo = () => {
    const prev = historyRef.current.undo(dna);
    if (prev) {
      applyDNAUpdate(prev, true, false);
      syncHistoryState();
    }
  };

  const handleRedo = () => {
    const next = historyRef.current.redo(dna);
    if (next) {
      applyDNAUpdate(next, true, false);
      syncHistoryState();
    }
  };

  const handleReset = () => {
    const initial = historyRef.current.reset();
    if (initial) {
      applyDNAUpdate(initial, true, false);
      syncHistoryState();
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const presetDNA = PresetManager.getPresetDNA(presetId);
    applyDNAUpdate(presetDNA, true, true);
  };

  const handleToggleElement = (elem: FusionElement) => {
    let current = [...dna.elements];
    if (current.includes(elem)) {
      if (current.length <= 1) return; // Keep at least one
      current = current.filter(e => e !== elem);
    } else {
      if (current.length >= 6) {
        current.shift(); // Max 6 for performance
      }
      current.push(elem);
    }

    const updated: DesignDNA = {
      ...dna,
      elements: current,
      name: current.join(' + '),
    };
    applyDNAUpdate(updated, true, true);
  };

  const handleTriggerShockwave = () => {
    if (fusionEngineRef.current) {
      fusionEngineRef.current.triggerShockwave();
    }
  };

  const handleSaveWallpaper = () => {
    if (!saveName.trim()) return;
    const saved = CustomWallpaperManager.saveWallpaper(saveName, dna);
    setSavedWallpapers(CustomWallpaperManager.getSavedWallpapers());
    setShowSaveModal(false);
    setSaveName('');
  };

  const handleApplyToMainBackground = () => {
    if (onApplyToEngine) {
      onApplyToEngine(dna);
      setApplySuccess(true);
      setTimeout(() => setApplySuccess(false), 2200);
    }
  };

  const handleCopySeed = () => {
    navigator.clipboard.writeText(dna.seed);
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 1800);
  };

  const handleCopyBridgePayload = () => {
    const payload = CustomWallpaperBridge.getAndroidPayload(dna);
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedBridge(true);
    setTimeout(() => setCopiedBridge(false), 1800);
  };

  const batteryAssessment = BatteryImpactEstimator.estimateImpact(dna);
  const [batteryOptimizedSuccess, setBatteryOptimizedSuccess] = useState<boolean>(false);
  const [amoledAppliedSuccess, setAmoledAppliedSuccess] = useState<boolean>(false);

  const handleOptimizeForBattery = () => {
    const optimized = BatteryImpactEstimator.optimizeForBattery(dna);
    applyDNAUpdate(optimized, true, true);
    setBatteryOptimizedSuccess(true);
    setTimeout(() => setBatteryOptimizedSuccess(false), 2000);
  };

  const handleApplyAmoled = () => {
    const amoled = BatteryImpactEstimator.applyAmoledMode(dna);
    applyDNAUpdate(amoled, true, true);
    setAmoledAppliedSuccess(true);
    setTimeout(() => setAmoledAppliedSuccess(false), 2000);
  };

  return (
    <div className="w-full h-full overflow-hidden flex flex-col pt-16 pb-20 px-3 sm:px-6 max-w-7xl mx-auto">
      {/* Top Header & Action Dock */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] text-[10px] font-mono font-bold tracking-wider">
              OFFLINE PROCEDURAL STUDIO
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Deterministic Seed: {dna.seed}</span>
            <button
              onClick={handleCopySeed}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-all text-xs"
              title="Copy Seed String"
            >
              {copiedSeed ? <Check size={12} className="text-[#00FFA3]" /> : <Share2 size={12} />}
            </button>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Orbitron'] text-white tracking-wide flex items-center gap-2">
            WALLPAPER LAB
          </h2>
          <p className="text-xs text-slate-300">
            Combine multi-layer worlds, dynamic physics, procedural shaders, and audio-reactive mappings.
          </p>
        </div>

        {/* Master Action Toolbar */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          {/* Create Random */}
          <button
            onClick={handleCreateRandom}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#7000FF] text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            <Sparkles size={14} />
            <span>CREATE</span>
          </button>

          {/* Randomize dropdown/split */}
          <div className="flex items-center rounded-xl bg-white/10 border border-white/10 p-0.5">
            <button
              onClick={handleRandomizeWorld}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1"
              title="Randomize World Elements"
            >
              <Shuffle size={13} />
              <span>World</span>
            </button>
            <button
              onClick={handleRandomizeColors}
              className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              title="Randomize Colors"
            >
              Colors
            </button>
            <button
              onClick={handleRandomizeEffects}
              className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              title="Randomize Effects"
            >
              FX
            </button>
            <button
              onClick={handleRandomizeCamera}
              className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              title="Randomize Camera"
            >
              Cam
            </button>
          </div>

          {/* Undo / Redo / Reset */}
          <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-0.5">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-2 rounded-lg transition-all ${
                canUndo ? 'text-white hover:bg-white/10' : 'text-slate-600 cursor-not-allowed'
              }`}
              title="Undo Parameter Change"
            >
              <Undo2 size={15} />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-2 rounded-lg transition-all ${
                canRedo ? 'text-white hover:bg-white/10' : 'text-slate-600 cursor-not-allowed'
              }`}
              title="Redo Parameter Change"
            >
              <Redo2 size={15} />
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              title="Reset to Initial State"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          {/* Save Custom Design */}
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#00FFA3]/20 border border-[#00FFA3]/40 text-[#00FFA3] hover:bg-[#00FFA3]/30 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_12px_rgba(0,255,163,0.2)]"
          >
            <Save size={14} />
            <span>SAVE</span>
          </button>

          {/* Saved library drawer toggle */}
          <button
            onClick={() => setShowSavedDrawer(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-xs"
            title="My Saved Custom Wallpapers"
          >
            <Layers size={16} />
          </button>

          {/* Apply to Background */}
          {onApplyToEngine && (
            <button
              onClick={handleApplyToMainBackground}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs uppercase tracking-wider hover:bg-cyan-400 active:scale-95 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              {applySuccess ? <Check size={14} /> : <Play size={14} fill="currentColor" />}
              <span>{applySuccess ? 'APPLIED!' : 'SET WALLPAPER'}</span>
            </button>
          )}

          {/* Full Screen Live Preview */}
          {onOpenLivePreview && (
            <button
              onClick={onOpenLivePreview}
              className="p-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 hover:text-white transition-all text-xs"
              title="Full-Screen Immersive Preview"
            >
              <Maximize2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Layout (Two-Column on Desktop) */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3">
        {/* LEFT COLUMN: Large Live 3D Viewport (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col rounded-3xl bg-[#0a0f1d]/90 border border-white/10 overflow-hidden shadow-2xl relative">
          {/* Live Viewport Top Bar */}
          <div className="px-4 py-2 bg-black/50 border-b border-white/5 flex flex-col gap-1.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-ping" />
                <span className="text-white font-bold tracking-wider">LIVE 3D VIEWPORT</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span className="text-[#00F0FF]">{fps} FPS</span>
                <span className="text-slate-500">•</span>
                <span className="text-purple-400">Complexity: {dna.estimatedComplexity}%</span>
              </div>
            </div>

            {/* Battery & Performance Workload Bar */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1.5 border-t border-white/5">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <BatteryCharging size={13} className={batteryAssessment.impact === 'LOW' ? 'text-emerald-400' : batteryAssessment.impact === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400'} />
                  Battery:
                </span>
                <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                  batteryAssessment.impact === 'LOW' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  batteryAssessment.impact === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {batteryAssessment.impact}
                </span>

                <span className="text-slate-400 ml-1">Load:</span>
                <span className="text-slate-300 font-semibold">{batteryAssessment.performanceLoad}</span>

                <span className="text-slate-400 ml-1">Rec:</span>
                <span className="text-cyan-300 font-semibold">{batteryAssessment.recommendedQuality}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleOptimizeForBattery}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1 ${
                    batteryOptimizedSuccess
                      ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  }`}
                  title="Optimize parameters for reduced battery consumption"
                >
                  <BatteryCharging size={11} />
                  <span>{batteryOptimizedSuccess ? 'OPTIMIZED!' : 'OPTIMIZE FOR BATTERY'}</span>
                </button>

                <button
                  onClick={handleApplyAmoled}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1 ${
                    amoledAppliedSuccess
                      ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15'
                  }`}
                  title="Enable pure black background and high-contrast AMOLED efficiency"
                >
                  <Moon size={11} />
                  <span>{amoledAppliedSuccess ? 'AMOLED ACTIVE' : 'AMOLED MODE'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3D WebGL Canvas Container */}
          <div
            ref={canvasContainerRef}
            className="flex-1 w-full h-full min-h-[260px] sm:min-h-[340px] relative bg-black cursor-grab active:cursor-grabbing"
          />

          {/* Live Viewport Bottom Float Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 pointer-events-auto">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-all"
                title={isPaused ? 'Resume Rendering' : 'Pause Rendering'}
              >
                {isPaused ? <Play size={15} fill="currentColor" /> : <Pause size={15} />}
              </button>
              <button
                onClick={handleTriggerShockwave}
                className="px-2 py-1 rounded-xl bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] text-[11px] font-bold font-mono transition-all"
                title="Trigger Physics Shockwave"
              >
                SHOCKWAVE
              </button>
            </div>

            {/* Android Bridge Quick Button */}
            <button
              onClick={() => setShowBridgeModal(true)}
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-mono transition-all backdrop-blur-md shadow-lg"
            >
              <Smartphone size={13} />
              <span>Android Bridge</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Futuristic Parameter Deck (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col rounded-3xl bg-[#0a0f1d]/80 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
          {/* Section Navigation Tabs */}
          <div className="flex items-center overflow-x-auto no-scrollbar px-3 py-2 bg-black/40 border-b border-white/10 gap-1 text-xs font-mono font-bold shrink-0">
            {[
              { id: 'WORLD', label: 'WORLD', icon: <Globe size={13} /> },
              { id: 'LAYERS', label: 'LAYERS', icon: <Layers size={13} /> },
              { id: 'MATERIAL', label: 'MATERIAL', icon: <Atom size={13} /> },
              { id: 'COLOR', label: 'COLOR', icon: <Palette size={13} /> },
              { id: 'PHYSICS', label: 'PHYSICS', icon: <Zap size={13} /> },
              { id: 'CAMERA', label: 'CAMERA', icon: <Camera size={13} /> },
              { id: 'MOTION', label: 'MOTION', icon: <Compass size={13} /> },
              { id: 'AUDIO', label: 'AUDIO', icon: <Music size={13} /> },
              { id: 'EFFECTS', label: 'EFFECTS', icon: <Sparkles size={13} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as SectionTab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all shrink-0 ${
                  activeSection === tab.id
                    ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* 1. WORLD SECTION */}
            {activeSection === 'WORLD' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white font-['Orbitron']">
                      PROCEDURAL FUSION SYSTEM
                    </h3>
                    <p className="text-xs text-slate-400">
                      Combine 2 to 6 elements to generate composite procedural environments
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#00FFA3] font-bold">
                    {dna.elements.length} / 6 Active
                  </span>
                </div>

                {/* Preset Fast Picker */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 block font-semibold">
                    Curated Master Fusion Presets:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PresetManager.PRESETS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handlePresetSelect(p.id)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#00F0FF]/30 text-left transition-all group"
                      >
                        <span className="text-xs font-bold text-white block group-hover:text-[#00F0FF] truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">{p.tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Elements Fusion Multi-Tag Selector */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 block font-semibold">
                    Combine Elements (Click to Toggle):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {ALL_ELEMENTS.map(elem => {
                      const active = dna.elements.includes(elem);
                      return (
                        <button
                          key={elem}
                          onClick={() => handleToggleElement(elem)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                            active
                              ? 'bg-gradient-to-r from-[#00F0FF] to-[#7000FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.4)] scale-105'
                              : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {active ? `✓ ${elem}` : `+ ${elem}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Current Active Fusion Summary */}
                <div className="p-3 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/25 font-mono text-xs flex items-center justify-between">
                  <span className="text-slate-400">Fusion Formula:</span>
                  <span className="text-[#00F0FF] font-bold">{dna.elements.join(' + ')}</span>
                </div>
              </div>
            )}

            {/* 2. LAYERS SECTION */}
            {activeSection === 'LAYERS' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white font-['Orbitron']">
                      PROCEDURAL LAYER COMPOSER
                    </h3>
                    <p className="text-xs text-slate-400">
                      Independently toggle and blend each depth layer in the 3D scene graph
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {LAYER_LIST.map(layer => {
                    const conf = dna.layers[layer];
                    if (!conf) return null;

                    return (
                      <div
                        key={layer}
                        className={`p-3 rounded-2xl border transition-all ${
                          conf.enabled
                            ? 'bg-white/5 border-white/15'
                            : 'bg-black/30 border-white/5 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={conf.enabled}
                              onChange={e => {
                                const updated = {
                                  ...dna,
                                  layers: {
                                    ...dna.layers,
                                    [layer]: { ...conf, enabled: e.target.checked }
                                  }
                                };
                                applyDNAUpdate(updated, false, true);
                              }}
                              className="accent-[#00F0FF] w-4 h-4 rounded cursor-pointer"
                            />
                            <span className="text-xs font-bold text-white font-mono">{layer}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            Depth: {conf.depth} • Intensity: {conf.intensity.toFixed(1)}x
                          </span>
                        </div>

                        {conf.enabled && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-[11px] font-mono">
                            <div>
                              <div className="flex justify-between text-slate-400 mb-1">
                                <span>Intensity</span>
                                <span>{conf.intensity.toFixed(1)}</span>
                              </div>
                              <input
                                type="range"
                                min="0.1"
                                max="2.0"
                                step="0.1"
                                value={conf.intensity}
                                onChange={e => {
                                  const val = parseFloat(e.target.value);
                                  const updated = {
                                    ...dna,
                                    layers: {
                                      ...dna.layers,
                                      [layer]: { ...conf, intensity: val }
                                    }
                                  };
                                  applyDNAUpdate(updated, false, false);
                                }}
                                className="w-full accent-[#00F0FF] h-1.5 bg-white/10 rounded cursor-pointer"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-slate-400 mb-1">
                                <span>Scale</span>
                                <span>{conf.scale.toFixed(1)}x</span>
                              </div>
                              <input
                                type="range"
                                min="0.3"
                                max="2.5"
                                step="0.1"
                                value={conf.scale}
                                onChange={e => {
                                  const val = parseFloat(e.target.value);
                                  const updated = {
                                    ...dna,
                                    layers: {
                                      ...dna.layers,
                                      [layer]: { ...conf, scale: val }
                                    }
                                  };
                                  applyDNAUpdate(updated, false, false);
                                }}
                                className="w-full accent-[#00FFA3] h-1.5 bg-white/10 rounded cursor-pointer"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-slate-400 mb-1">
                                <span>Speed</span>
                                <span>{conf.speed.toFixed(1)}x</span>
                              </div>
                              <input
                                type="range"
                                min="0.0"
                                max="2.5"
                                step="0.1"
                                value={conf.speed}
                                onChange={e => {
                                  const val = parseFloat(e.target.value);
                                  const updated = {
                                    ...dna,
                                    layers: {
                                      ...dna.layers,
                                      [layer]: { ...conf, speed: val }
                                    }
                                  };
                                  applyDNAUpdate(updated, false, false);
                                }}
                                className="w-full accent-purple-400 h-1.5 bg-white/10 rounded cursor-pointer"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-slate-400 mb-1">
                                <span>Opacity</span>
                                <span>{Math.round(conf.opacity * 100)}%</span>
                              </div>
                              <input
                                type="range"
                                min="0.1"
                                max="1.0"
                                step="0.05"
                                value={conf.opacity}
                                onChange={e => {
                                  const val = parseFloat(e.target.value);
                                  const updated = {
                                    ...dna,
                                    layers: {
                                      ...dna.layers,
                                      [layer]: { ...conf, opacity: val }
                                    }
                                  };
                                  applyDNAUpdate(updated, false, false);
                                }}
                                className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded cursor-pointer"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. MATERIAL SECTION */}
            {activeSection === 'MATERIAL' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-['Orbitron']">
                    PROCEDURAL MATERIAL GENERATOR
                  </h3>
                  <p className="text-xs text-slate-400">
                    Procedural shaders, dielectric refraction, molten magma, and energy interference
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
                  {MATERIALS_LIST.map(m => {
                    const isSelected = dna.material.type === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          const updated = {
                            ...dna,
                            material: { ...dna.material, type: m.id }
                          };
                          applyDNAUpdate(updated, true, true);
                        }}
                        className={`p-3 rounded-2xl text-left border transition-all ${
                          isSelected
                            ? 'bg-[#00F0FF]/15 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold font-mono ${isSelected ? 'text-[#00F0FF]' : 'text-white'}`}>
                            {m.label}
                          </span>
                          {isSelected && <span className="text-[10px] text-[#00FFA3] font-mono">ACTIVE</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">{m.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Material Fine-Tuning Sliders */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Wireframe Mesh Overlay</span>
                    <input
                      type="checkbox"
                      checked={dna.material.wireframe}
                      onChange={e => {
                        const updated = {
                          ...dna,
                          material: { ...dna.material, wireframe: e.target.checked }
                        };
                        applyDNAUpdate(updated, true, true);
                      }}
                      className="accent-[#00F0FF] w-4 h-4 rounded cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Emissive Radiance Intensity</span>
                      <span className="text-[#00FFA3]">{dna.material.emissiveIntensity.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.1"
                      value={dna.material.emissiveIntensity}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const updated = {
                          ...dna,
                          material: { ...dna.material, emissiveIntensity: val }
                        };
                        applyDNAUpdate(updated, false, false);
                      }}
                      className="w-full accent-[#00FFA3] h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Pulse Oscillation Speed</span>
                      <span className="text-cyan-400">{dna.material.pulseSpeed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.1"
                      value={dna.material.pulseSpeed}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const updated = {
                          ...dna,
                          material: { ...dna.material, pulseSpeed: val }
                        };
                        applyDNAUpdate(updated, false, false);
                      }}
                      className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. COLOR SECTION */}
            {activeSection === 'COLOR' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-['Orbitron']">
                    PROCEDURAL COLOR ENGINE
                  </h3>
                  <p className="text-xs text-slate-400">
                    OLED-optimized color palettes, mathematical harmonics, and hex customization
                  </p>
                </div>

                {/* Presets Grid */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 block font-semibold">
                    Procedural Color Presets:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {Object.values(ProceduralColorEngine.PRESETS).map(p => {
                      const isSelected = dna.colors.preset === p.name;
                      return (
                        <button
                          key={p.name}
                          onClick={() => {
                            const newCols = ProceduralColorEngine.getPresetColors(p.name);
                            const updated = { ...dna, colors: newCols };
                            applyDNAUpdate(updated, true, true);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-white/15 border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                              : 'bg-white/5 border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-1.5">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: p.colors.primary }}
                            />
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: p.colors.accent }}
                            />
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: p.colors.glow }}
                            />
                          </div>
                          <span className="text-xs font-bold text-white font-mono block truncate">
                            {p.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Individual Hex Controls */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 font-mono text-xs">
                  <span className="text-slate-400 block font-semibold">Hex Palette Channel Customizer:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'primary', label: 'Primary Core Color' },
                      { key: 'secondary', label: 'Secondary Tone' },
                      { key: 'accent', label: 'Accent Highlights' },
                      { key: 'glow', label: 'Emissive Glow' },
                      { key: 'background', label: 'Void / Backdrop' },
                    ].map(col => {
                      const currentVal = (dna.colors as any)[col.key];
                      return (
                        <div key={col.key} className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={currentVal}
                              onChange={e => {
                                const updated = {
                                  ...dna,
                                  colors: {
                                    ...dna.colors,
                                    [col.key]: e.target.value
                                  }
                                };
                                applyDNAUpdate(updated, true, true);
                              }}
                              className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                            />
                            <span className="text-slate-300">{col.label}</span>
                          </div>
                          <span className="text-white font-bold">{currentVal}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 5. PHYSICS SECTION */}
            {activeSection === 'PHYSICS' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-['Orbitron']">
                    DYNAMIC FORCES & PARTICLES
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gravity vectors, vortex singularities, fluid turbulence, and particle density
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Particle Density</span>
                      <span className="text-[#00F0FF]">{dna.physics.particleDensity.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.0"
                      step="0.1"
                      value={dna.physics.particleDensity}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const updated = {
                          ...dna,
                          physics: { ...dna.physics, particleDensity: val }
                        };
                        applyDNAUpdate(updated, true, false);
                      }}
                      className="w-full accent-[#00F0FF] h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Particle Speed</span>
                      <span className="text-[#00FFA3]">{dna.physics.particleSpeed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="2.5"
                      step="0.1"
                      value={dna.physics.particleSpeed}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const updated = {
                          ...dna,
                          physics: { ...dna.physics, particleSpeed: val }
                        };
                        applyDNAUpdate(updated, false, false);
                      }}
                      className="w-full accent-[#00FFA3] h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Vortex Singular Core</span>
                      <span className="text-purple-400">{dna.physics.vortexStrength.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="3.0"
                      step="0.1"
                      value={dna.physics.vortexStrength}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const updated = {
                          ...dna,
                          physics: { ...dna.physics, vortexStrength: val }
                        };
                        applyDNAUpdate(updated, false, false);
                      }}
                      className="w-full accent-purple-400 h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Gravity Vector</span>
                      <span className="text-cyan-400">{dna.physics.gravity.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-2.0"
                      max="2.0"
                      step="0.1"
                      value={dna.physics.gravity}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const updated = {
                          ...dna,
                          physics: { ...dna.physics, gravity: val }
                        };
                        applyDNAUpdate(updated, false, false);
                      }}
                      className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Wind Drift</span>
                      <span className="text-yellow-400">{dna.physics.wind.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-2.0"
                      max="2.0"
                      step="0.1"
                      value={dna.physics.wind}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const updated = {
                          ...dna,
                          physics: { ...dna.physics, wind: val }
                        };
                        applyDNAUpdate(updated, false, false);
                      }}
                      className="w-full accent-yellow-400 h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. CAMERA SECTION */}
            {activeSection === 'CAMERA' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-['Orbitron']">
                    CAMERA & 3D DEPTH
                  </h3>
                  <p className="text-xs text-slate-400">
                    Field of View, orbit velocity, focal depth, and cosmic distance
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Field of View (FOV)</span>
                      <span className="text-[#00F0FF]">{Math.round(dna.camera.fov)}°</span>
                    </div>
                    <input
                      type="range"
                      min="35"
                      max="85"
                      step="1"
                      value={dna.camera.fov}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const updated = {
                          ...dna,
                          camera: { ...dna.camera, fov: val }
                        };
                        applyDNAUpdate(updated, false, false);
                      }}
                      className="w-full accent-[#00F0FF] h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Camera Distance</span>
                      <span className="text-[#00FFA3]">{Math.round(dna.camera.distance)} units</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="60"
                      step="1"
                      value={dna.camera.distance}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const updated = {
                          ...dna,
                          camera: { ...dna.camera, distance: val }
                        };
                        applyDNAUpdate(updated, false, false);
                      }}
                      className="w-full accent-[#00FFA3] h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Cosmic Drift Velocity</span>
                      <span className="text-purple-400">{dna.camera.driftSpeed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="2.0"
                      step="0.1"
                      value={dna.camera.driftSpeed}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const updated = {
                          ...dna,
                          camera: { ...dna.camera, driftSpeed: val }
                        };
                        applyDNAUpdate(updated, false, false);
                      }}
                      className="w-full accent-purple-400 h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 7. MOTION SECTION */}
            {activeSection === 'MOTION' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-['Orbitron']">
                    MOTION & SENSOR FUSION
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gyroscope parallax, accelerometer response, and touch interaction
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 font-mono text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 block mb-1">Motion Parallax Mode:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['OFF', 'Subtle', 'Balanced', 'Dynamic'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => {
                            const updated = {
                              ...dna,
                              motion: { ...dna.motion, mode }
                            };
                            applyDNAUpdate(updated, false, true);
                          }}
                          className={`p-2 rounded-xl border text-center transition-all ${
                            dna.motion.mode === mode
                              ? 'bg-[#00F0FF] text-black font-bold border-[#00F0FF]'
                              : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Motion Sensitivity</span>
                      <span className="text-[#00FFA3]">{dna.motion.sensitivity.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.1"
                      value={dna.motion.sensitivity}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const updated = {
                          ...dna,
                          motion: { ...dna.motion, sensitivity: val }
                        };
                        applyDNAUpdate(updated, false, false);
                      }}
                      className="w-full accent-[#00FFA3] h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-slate-300">Touch Pointer Attraction Field</span>
                    <input
                      type="checkbox"
                      checked={dna.motion.touchInteraction}
                      onChange={e => {
                        const updated = {
                          ...dna,
                          motion: { ...dna.motion, touchInteraction: e.target.checked }
                        };
                        applyDNAUpdate(updated, false, true);
                      }}
                      className="accent-[#00F0FF] w-4 h-4 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 8. AUDIO SECTION */}
            {activeSection === 'AUDIO' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white font-['Orbitron']">
                      AUDIO REACTIVE HARMONICS
                    </h3>
                    <p className="text-xs text-slate-400">
                      Route live sub-bass, mid frequencies, treble, and beats to 3D parameters
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={dna.audio.enabled}
                    onChange={e => {
                      const updated = {
                        ...dna,
                        audio: { ...dna.audio, enabled: e.target.checked }
                      };
                      applyDNAUpdate(updated, false, true);
                    }}
                    className="accent-[#00F0FF] w-4 h-4 rounded cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 font-mono text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'bassToScale', label: 'Bass → Object Scale' },
                      { key: 'midToMovement', label: 'Mid → Fluid Waves' },
                      { key: 'trebleToParticles', label: 'Treble → Particle Speed' },
                      { key: 'beatToShockwave', label: 'Beat → Physics Shockwave' },
                      { key: 'energyToBloom', label: 'Energy → Bloom Intensity' },
                    ].map(item => {
                      const isChecked = (dna.audio as any)[item.key];
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5"
                        >
                          <span className="text-slate-300">{item.label}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={!dna.audio.enabled}
                            onChange={e => {
                              const updated = {
                                ...dna,
                                audio: {
                                  ...dna.audio,
                                  [item.key]: e.target.checked
                                }
                              };
                              applyDNAUpdate(updated, false, true);
                            }}
                            className="accent-[#00FFA3] w-4 h-4 rounded cursor-pointer disabled:opacity-30"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 9. EFFECTS SECTION */}
            {activeSection === 'EFFECTS' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-['Orbitron']">
                    VISUAL EFFECTS & ENVIRONMENT
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bloom glow, atmospheric fog depth, weather precipitation, and ecosystem
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Bloom Glow Intensity</span>
                      <span className="text-[#00F0FF]">{dna.effects.bloom.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="2.0"
                      step="0.1"
                      value={dna.effects.bloom}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const updated = {
                          ...dna,
                          effects: { ...dna.effects, bloom: val }
                        };
                        applyDNAUpdate(updated, false, false);
                      }}
                      className="w-full accent-[#00F0FF] h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Atmospheric Fog Density</span>
                      <span className="text-purple-400">{Math.round(dna.effects.fog * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={dna.effects.fog}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const updated = {
                          ...dna,
                          effects: { ...dna.effects, fog: val }
                        };
                        applyDNAUpdate(updated, false, false);
                      }}
                      className="w-full accent-purple-400 h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Animation Speed Multiplier</span>
                      <span className="text-[#00FFA3]">{dna.effects.animationSpeed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.1"
                      value={dna.effects.animationSpeed}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const updated = {
                          ...dna,
                          effects: { ...dna.effects, animationSpeed: val }
                        };
                        applyDNAUpdate(updated, false, false);
                      }}
                      className="w-full accent-[#00FFA3] h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full p-5 rounded-3xl bg-[#0a0f1d] border border-white/20 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-['Orbitron']">
              SAVE CUSTOM WALLPAPER
            </h3>
            <p className="text-xs text-slate-300">
              Save your unique procedural DesignDNA locally in the browser engine storage.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Wallpaper Name:</label>
              <input
                type="text"
                placeholder={dna.name || 'My Cosmic Creation'}
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#00F0FF]"
              />
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] text-slate-400 space-y-1">
              <div>Seed: <span className="text-white">{dna.seed}</span></div>
              <div>Elements: <span className="text-[#00F0FF]">{dna.elements.join(', ')}</span></div>
              <div>Palette: <span className="text-[#00FFA3]">{dna.colors.preset}</span></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWallpaper}
                className="px-5 py-2 rounded-xl bg-[#00FFA3] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#00e090] transition-all"
              >
                Save Design
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Custom Wallpapers Drawer */}
      {showSavedDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md h-full bg-[#0a0f1d] border-l border-white/15 p-5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white font-['Orbitron']">
                SAVED CUSTOM DESIGNS ({savedWallpapers.length})
              </h3>
              <button
                onClick={() => setShowSavedDrawer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {savedWallpapers.length === 0 ? (
                <div className="text-center py-16 text-slate-500 font-mono text-xs">
                  No custom designs saved yet.<br />
                  Compose your dream wallpaper and click SAVE!
                </div>
              ) : (
                savedWallpapers.map(sw => (
                  <div
                    key={sw.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: sw.previewMetadata.dominantColor }}
                        />
                        <h4 className="text-xs font-bold text-white font-mono">{sw.name}</h4>
                      </div>
                      <button
                        onClick={() => {
                          CustomWallpaperManager.toggleFavorite(sw.id);
                          setSavedWallpapers(CustomWallpaperManager.getSavedWallpapers());
                        }}
                        className={`p-1 ${sw.isFavorite ? 'text-pink-500' : 'text-slate-500 hover:text-white'}`}
                      >
                        <Heart size={14} fill={sw.isFavorite ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 font-mono">{sw.previewMetadata.elementsSummary}</p>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono">
                      <span className="text-slate-500">{new Date(sw.createdAt).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            applyDNAUpdate(sw.dna, true, true);
                            setShowSavedDrawer(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#00F0FF]/20 text-[#00F0FF] hover:bg-[#00F0FF]/30 font-bold"
                        >
                          Load in Lab
                        </button>
                        <button
                          onClick={() => {
                            CustomWallpaperManager.deleteWallpaper(sw.id);
                            setSavedWallpapers(CustomWallpaperManager.getSavedWallpapers());
                          }}
                          className="p-1 text-slate-500 hover:text-red-400"
                          title="Delete Design"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Android Bridge Modal */}
      {showBridgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-lg w-full p-5 rounded-3xl bg-[#0a0f1d] border border-purple-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-purple-400" />
                <h3 className="text-sm font-bold text-white font-['Orbitron']">
                  ANDROID LIVE WALLPAPER BRIDGE
                </h3>
              </div>
              <button
                onClick={() => setShowBridgeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Exposes your procedural DesignDNA to native Android Live Wallpaper Services. All designs are 100% offline and deterministic.
            </p>

            <div className="p-3 rounded-2xl bg-black/60 border border-white/10 font-mono text-[11px] text-cyan-300 max-h-48 overflow-y-auto">
              <pre>{JSON.stringify(CustomWallpaperBridge.getAndroidPayload(dna), null, 2)}</pre>
            </div>

            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300 font-mono">
              Note: Web security models prevent in-browser code from setting native Android system wallpapers directly. This payload is consumed by the Amit HyperWall Android Service.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleCopyBridgePayload}
                className="px-4 py-2 rounded-xl bg-purple-500 text-white font-bold text-xs uppercase tracking-wider hover:bg-purple-600 transition-all flex items-center gap-1.5"
              >
                {copiedBridge ? <Check size={14} /> : <Share2 size={14} />}
                <span>{copiedBridge ? 'COPIED JSON!' : 'COPY BRIDGE PAYLOAD'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
