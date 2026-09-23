import React, { useState, useEffect } from 'react';
import {
  Camera,
  Video,
  Play,
  RotateCcw,
  Shuffle,
  Sliders,
  Sparkles,
  Eye,
  Layers,
  Film,
  Sun,
  Activity,
  Shield,
  Zap,
  Radio,
  Maximize2,
  Compass,
  Flame,
  Globe
} from 'lucide-react';
import { CinematicCameraEngine } from '../cinematic/CinematicCameraEngine';
import {
  CameraMode,
  VisualPresetType,
  CameraEventType,
  CinematicState,
} from '../cinematic/types';
import { QualityProfile } from '../types/engine';

interface CinematicLabProps {
  cinematicEngine?: CinematicCameraEngine;
  qualityProfile?: QualityProfile | any;
  onOpenLivePreview?: () => void;
}

export const CinematicLab: React.FC<CinematicLabProps> = ({
  cinematicEngine,
  qualityProfile,
  onOpenLivePreview,
}) => {
  const engine = cinematicEngine || CinematicCameraEngine.getInstance();
  const [state, setState] = useState<CinematicState>(engine.getState());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = engine.subscribe((newState) => {
      setState({ ...newState });
    });
    return () => {
      unsubscribe();
    };
  }, [engine]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleModeSelect = (mode: CameraMode) => {
    engine.setCameraMode(mode);
    showToast(`Camera Mode: ${mode.toUpperCase()}`);
  };

  const handlePresetSelect = (preset: VisualPresetType) => {
    engine.setPreset(preset);
    showToast(`Visual Preset: ${preset.toUpperCase()}`);
  };

  const handlePlayCinematic = () => {
    engine.playCinematic();
    showToast('Started Cinematic Drone Sequence');
  };

  const handleRandomCamera = () => {
    engine.randomizeCamera();
    showToast('Randomized Camera & Visual Parameters');
  };

  const handleResetCamera = () => {
    engine.resetCamera();
    showToast('Reset Camera to Cinematic Defaults');
  };

  const handleTriggerEvent = (event: CameraEventType) => {
    engine.handleEvent(event, 1.0);
    showToast(`Event Simulated: ${event.replace('-', ' ').toUpperCase()}`);
  };

  const cameraModes: { id: CameraMode; label: string; icon: string; desc: string }[] = [
    { id: 'cinematic', label: 'Cinematic', icon: '🎬', desc: 'Spline drone sweep' },
    { id: 'orbit', label: 'Orbit', icon: '🔄', desc: 'Smooth orbital drift' },
    { id: 'free', label: 'Free', icon: '🎯', desc: 'Touch & gyro responsive' },
    { id: 'follow', label: 'Follow', icon: '🚀', desc: 'Dynamic target track' },
    { id: 'fly', label: 'Fly', icon: '✈️', desc: 'Forward flight banking' },
    { id: 'macro', label: 'Macro', icon: '🔍', desc: 'Extreme shallow focus' },
    { id: 'planet', label: 'Planet', icon: '🪐', desc: 'High orbital vantage' },
    { id: 'galaxy', label: 'Galaxy', icon: '🌌', desc: 'Wide celestial view' },
    { id: 'portal', label: 'Portal', icon: '🌀', desc: 'Pass-through vortex' },
    { id: 'infinite-zoom', label: 'Zoom Loop', icon: '♾️', desc: 'Continuous fractal dive' },
  ];

  const presets: { id: VisualPresetType; name: string; icon: string }[] = [
    { id: 'cinematic', name: 'Cinematic', icon: '🎞️' },
    { id: 'relaxed', name: 'Relaxed', icon: '🍃' },
    { id: 'dynamic', name: 'Dynamic', icon: '⚡' },
    { id: 'space', name: 'Space', icon: '🛸' },
    { id: 'nature', name: 'Nature', icon: '🌿' },
    { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌆' },
    { id: 'fantasy', name: 'Fantasy', icon: '✨' },
    { id: 'experimental', name: 'Warp', icon: '🧪' },
  ];

  const currentTier =
    typeof qualityProfile === 'string'
      ? qualityProfile
      : qualityProfile?.profile || 'HIGH';

  return (
    <div className="min-h-screen bg-[#030611] text-slate-100 pt-16 pb-28 px-4 sm:px-6 max-w-4xl mx-auto selection:bg-[#00F0FF]/30">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#050B1A]/95 border border-[#00F0FF]/60 text-[#00F0FF] text-xs font-mono tracking-wide shadow-[0_0_20px_rgba(0,240,255,0.4)] backdrop-blur-md flex items-center gap-2 animate-fade-in">
          <Sparkles size={14} className="animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative rounded-2xl overflow-hidden p-5 sm:p-6 mb-6 bg-gradient-to-br from-[#0a1226]/90 via-[#060b18]/80 to-[#100b24]/90 border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#00F0FF]/15 to-[#D946EF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                <Camera size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-wider font-['Orbitron'] text-white">
                  CINEMATIC <span className="text-[#00F0FF]">LAB</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono">
                  10 Camera Modes • Multi-Pass Post-Processing • Procedural Effects
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Live Camera Mode Badge / Indicator */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/50 border border-[#00F0FF]/40 text-xs font-mono text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
              <span>MODE: {state.cameraMode.toUpperCase()}</span>
            </div>

            {onOpenLivePreview && (
              <button
                onClick={onOpenLivePreview}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#D946EF]/20 to-[#7000FF]/20 border border-[#D946EF]/40 text-[#D946EF] text-xs font-semibold hover:brightness-110 active:scale-95 transition-all"
              >
                <Eye size={14} />
                <span className="hidden sm:inline">Immersive</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time Status Bar */}
        <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-400 block text-[10px]">ACTIVE PRESET</span>
            <span className="text-[#00F0FF] font-bold uppercase">{state.preset}</span>
          </div>
          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-400 block text-[10px]">CINEMATIC PROGRESS</span>
            <span className="text-[#00FFA3] font-bold">
              {(state.cinematicProgress * 100).toFixed(0)}%
            </span>
          </div>
          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-400 block text-[10px]">POST-PROCESSING</span>
            <span className="text-purple-300 font-bold">
              {state.postProcessing.enabled ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-400 block text-[10px]">QUALITY TIER</span>
            <span className="text-amber-300 font-bold">{currentTier}</span>
          </div>
        </div>
      </div>

      {/* 3 Primary Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
        <button
          onClick={handlePlayCinematic}
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-[#00F0FF]/20 to-[#0088FF]/20 border border-[#00F0FF]/50 text-[#00F0FF] text-xs font-bold font-mono hover:from-[#00F0FF]/30 hover:to-[#0088FF]/30 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
        >
          <Play size={15} />
          <span>PLAY CINEMATIC</span>
        </button>

        <button
          onClick={handleRandomCamera}
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-[#D946EF]/20 to-[#7000FF]/20 border border-[#D946EF]/50 text-[#D946EF] text-xs font-bold font-mono hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(217,70,239,0.2)]"
        >
          <Shuffle size={15} />
          <span>RANDOM CAMERA</span>
        </button>

        <button
          onClick={handleResetCamera}
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-white/10 text-slate-300 text-xs font-bold font-mono hover:bg-slate-800/80 active:scale-95 transition-all"
        >
          <RotateCcw size={15} />
          <span>RESET CAMERA</span>
        </button>
      </div>

      {/* 10 Camera Modes Grid */}
      <div className="mb-6">
        <h2 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-1.5">
          <Camera size={14} className="text-[#00F0FF]" />
          <span>Camera Modes (10 Presets)</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {cameraModes.map((m) => {
            const isSelected = state.cameraMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleModeSelect(m.id)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#00F0FF]/15 border-[#00F0FF]/80 text-white shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                    : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/20 hover:bg-black/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">{m.icon}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-ping" />
                  )}
                </div>
                <div className="text-xs font-bold">{m.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Presets Selector */}
      <div className="mb-6">
        <h2 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-1.5">
          <Film size={14} className="text-[#D946EF]" />
          <span>Cinematic Visual Presets</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {presets.map((p) => {
            const isSelected = state.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.id)}
                className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-[#D946EF]/20 border-[#D946EF] text-white font-bold shadow-[0_0_15px_rgba(217,70,239,0.2)]'
                    : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Controls 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Left Column: Camera Controls */}
        <div className="p-4 rounded-2xl bg-[#070d1e]/80 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h3 className="text-xs font-bold font-mono uppercase text-[#00F0FF] flex items-center gap-1.5">
              <Compass size={15} />
              <span>Camera Dynamics</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              SPEED: {state.camera.speed.toFixed(2)}x
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>CAMERA SPEED</span>
              <span>{state.camera.speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.05"
              value={state.camera.speed}
              onChange={(e) =>
                engine.updateCameraConfig({ speed: parseFloat(e.target.value) })
              }
              className="w-full accent-[#00F0FF] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>SMOOTHNESS (DAMPING)</span>
              <span>{(state.camera.smoothness * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={state.camera.smoothness}
              onChange={(e) =>
                engine.updateCameraConfig({ smoothness: parseFloat(e.target.value) })
              }
              className="w-full accent-[#00F0FF] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>ZOOM LEVEL</span>
              <span>{state.camera.zoom.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={state.camera.zoom}
              onChange={(e) =>
                engine.updateCameraConfig({ zoom: parseFloat(e.target.value) })
              }
              className="w-full accent-[#00F0FF] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>PARALLAX STRENGTH</span>
              <span>{(state.camera.parallaxStrength * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2.5"
              step="0.05"
              value={state.camera.parallaxStrength}
              onChange={(e) =>
                engine.updateCameraConfig({
                  parallaxStrength: parseFloat(e.target.value),
                })
              }
              className="w-full accent-[#00F0FF] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>DEPTH LAYER SEPARATION</span>
              <span>{(state.camera.depthStrength * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2.0"
              step="0.05"
              value={state.camera.depthStrength}
              onChange={(e) =>
                engine.updateCameraConfig({ depthStrength: parseFloat(e.target.value) })
              }
              className="w-full accent-[#00F0FF] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>CAMERA SHAKE STRENGTH</span>
              <span>{(state.camera.shakeStrength * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2.0"
              step="0.05"
              value={state.camera.shakeStrength}
              onChange={(e) =>
                engine.updateCameraConfig({ shakeStrength: parseFloat(e.target.value) })
              }
              className="w-full accent-[#FF5577] cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: Post-Processing & Atmosphere */}
        <div className="p-4 rounded-2xl bg-[#070d1e]/80 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h3 className="text-xs font-bold font-mono uppercase text-[#D946EF] flex items-center gap-1.5">
              <Sparkles size={15} />
              <span>Post-Processing Pipeline</span>
            </h3>
            <button
              onClick={() =>
                engine.updatePostProcessingConfig({
                  enabled: !state.postProcessing.enabled,
                })
              }
              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all ${
                state.postProcessing.enabled
                  ? 'bg-[#00FFA3]/20 border-[#00FFA3] text-[#00FFA3]'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {state.postProcessing.enabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>BLOOM GLOW INTENSITY</span>
              <span>{(state.postProcessing.bloomIntensity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="3.0"
              step="0.05"
              value={state.postProcessing.bloomIntensity}
              onChange={(e) =>
                engine.updatePostProcessingConfig({
                  bloomIntensity: parseFloat(e.target.value),
                })
              }
              className="w-full accent-[#D946EF] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>ATMOSPHERIC HAZE DENSITY</span>
              <span>{(state.postProcessing.atmosphereDensity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.02"
              value={state.postProcessing.atmosphereDensity}
              onChange={(e) =>
                engine.updatePostProcessingConfig({
                  atmosphereDensity: parseFloat(e.target.value),
                })
              }
              className="w-full accent-[#70D6FF] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>VIGNETTE DARKNESS</span>
              <span>{(state.postProcessing.vignetteDarkness * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={state.postProcessing.vignetteDarkness}
              onChange={(e) =>
                engine.updatePostProcessingConfig({
                  vignetteDarkness: parseFloat(e.target.value),
                })
              }
              className="w-full accent-[#FFB703] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>MOTION BLUR INTENSITY</span>
              <span>{(state.postProcessing.motionBlurIntensity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.05"
              value={state.postProcessing.motionBlurIntensity}
              onChange={(e) =>
                engine.updatePostProcessingConfig({
                  motionBlurIntensity: parseFloat(e.target.value),
                })
              }
              className="w-full accent-[#00FFA3] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>CHROMATIC ABERRATION</span>
              <span>{(state.postProcessing.chromaticAberration * 1000).toFixed(1)}‰</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.015"
              step="0.0005"
              value={state.postProcessing.chromaticAberration}
              onChange={(e) =>
                engine.updatePostProcessingConfig({
                  chromaticAberration: parseFloat(e.target.value),
                })
              }
              className="w-full accent-[#FF007F] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Accessibility Controls Card */}
      <div className="p-4 rounded-2xl bg-[#080e22]/90 border border-white/10 mb-6">
        <h3 className="text-xs font-bold font-mono tracking-wider text-[#00FFA3] uppercase mb-3 flex items-center gap-1.5">
          <Shield size={14} />
          <span>Cinematic Accessibility Settings</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            {
              id: 'reducedMotion',
              label: 'Reduced Motion',
              val: state.accessibility.reducedMotion,
            },
            {
              id: 'disableCameraShake',
              label: 'Disable Shake',
              val: state.accessibility.disableCameraShake,
            },
            {
              id: 'disableParallax',
              label: 'Disable Parallax',
              val: state.accessibility.disableParallax,
            },
            {
              id: 'disableFlashEffects',
              label: 'Disable Flash',
              val: state.accessibility.disableFlashEffects,
            },
            {
              id: 'lowMotionMode',
              label: 'Low Motion Mode',
              val: state.accessibility.lowMotionMode,
            },
          ].map((acc) => (
            <button
              key={acc.id}
              onClick={() =>
                engine.updateAccessibility({ [acc.id]: !acc.val } as any)
              }
              className={`p-2 rounded-xl border text-[11px] font-mono transition-all text-center ${
                acc.val
                  ? 'bg-[#00FFA3]/20 border-[#00FFA3] text-[#00FFA3] font-bold'
                  : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {acc.label}: {acc.val ? 'ON' : 'OFF'}
            </button>
          ))}
        </div>
      </div>

      {/* Cinematic Event Reaction Simulator */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
        <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
          <Activity size={14} className="text-amber-400" />
          <span>Simulate Cinematic Camera Reactions</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'meteor-impact', label: 'Meteor Impact', color: 'from-orange-500/20 to-red-500/20 text-orange-300' },
            { id: 'black-hole', label: 'Black Hole Vortex', color: 'from-purple-900/40 to-indigo-900/40 text-purple-200' },
            { id: 'supernova', label: 'Supernova Blast', color: 'from-yellow-500/20 to-amber-500/20 text-yellow-300' },
            { id: 'lightning', label: 'Lightning Flash', color: 'from-cyan-500/20 to-blue-500/20 text-cyan-300' },
            { id: 'volcano-eruption', label: 'Volcanic Blast', color: 'from-red-600/20 to-orange-600/20 text-red-300' },
            { id: 'portal-opening', label: 'Portal Opening', color: 'from-fuchsia-500/20 to-purple-500/20 text-fuchsia-300' },
            { id: 'energy-explosion', label: 'Energy Explosion', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300' },
            { id: 'shockwave', label: 'Shockwave Kick', color: 'from-rose-500/20 to-pink-500/20 text-rose-300' },
            { id: 'aurora-burst', label: 'Aurora Swirl', color: 'from-teal-500/20 to-emerald-500/20 text-teal-300' },
            { id: 'ocean-wave', label: 'Ocean Surge', color: 'from-blue-600/20 to-sky-400/20 text-sky-300' },
          ].map((ev) => (
            <button
              key={ev.id}
              onClick={() => handleTriggerEvent(ev.id as CameraEventType)}
              className={`p-2.5 rounded-xl bg-gradient-to-r ${ev.color} border border-white/10 text-xs font-mono font-semibold hover:border-white/30 active:scale-95 transition-all text-center`}
            >
              {ev.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
