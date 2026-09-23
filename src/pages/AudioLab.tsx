import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Music,
  Radio,
  Sparkles,
  Sliders,
  ShieldCheck,
  Activity,
  Zap,
  Disc,
  Waves,
  Eye,
  Play,
  Square,
  AlertCircle,
  Gauge,
  CheckCircle2,
} from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import {
  AudioReactiveConfig,
  AudioPresetType,
  GenerativeSoundCategory,
  AudioAnalysisData,
} from '../audio/types';
import { QualityProfile } from '../types/engine';

interface AudioLabProps {
  audioEngine?: AudioEngine;
  qualityProfile?: QualityProfile | any;
  onOpenLivePreview?: () => void;
  activeWallpaperId?: string;
}

export const AudioLab: React.FC<AudioLabProps> = ({
  audioEngine,
  qualityProfile,
  onOpenLivePreview,
  activeWallpaperId = 'cosmic-particle-field',
}) => {
  const engine = audioEngine || AudioEngine.getInstance();
  const [config, setConfig] = useState<AudioReactiveConfig>(engine.getConfig());
  const [permissionState, setPermissionState] = useState(
    engine.getPermissionManager().getState()
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDiagnosticMode, setIsDiagnosticMode] = useState<boolean>(false);
  const [liveStats, setLiveStats] = useState<{
    volume: number;
    bass: number;
    mid: number;
    treble: number;
    isBeat: boolean;
    bpm: number;
    bands: number[];
  }>({
    volume: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    isBeat: false,
    bpm: 120,
    bands: [0, 0, 0, 0, 0, 0, 0, 0],
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subscribe to config changes
  useEffect(() => {
    const unsub = engine.subscribe((newConfig) => {
      setConfig({ ...newConfig });
    });
    const unsubPerm = engine.getPermissionManager().subscribe((newPerm) => {
      setPermissionState(newPerm);
    });
    return () => {
      unsub();
      unsubPerm();
    };
  }, [engine]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  // Throttled UI polling for frequency spectrum & beat meters (15 FPS to respect performance rules)
  useEffect(() => {
    let animId: number;
    let lastRenderTime = 0;

    const tick = (now: number) => {
      animId = requestAnimationFrame(tick);
      if (now - lastRenderTime < 65) return; // ~15 FPS state update for UI performance
      lastRenderTime = now;

      const analysis = engine.getAnalyzer().getCachedAnalysis();
      setLiveStats({
        volume: analysis.volume,
        bass: analysis.bass,
        mid: analysis.mid,
        treble: analysis.treble,
        isBeat: analysis.isBeat,
        bpm: analysis.bpm,
        bands: [...analysis.bandArray],
      });

      // Draw spectrum on canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          // Draw real-time FFT frequency bars
          const freqs = analysis.rawFrequencies;
          if (freqs && freqs.length > 0 && (config.localAudioEnabled || config.generativeSoundEnabled)) {
            const barWidth = w / 32;
            const step = Math.floor(freqs.length / 32);

            for (let i = 0; i < 32; i++) {
              const val = freqs[i * step] / 255.0;
              const barHeight = val * h * 0.9;
              const x = i * barWidth;
              const y = h - barHeight;

              // Color gradient across frequencies
              const hue = 180 + i * 4; // cyan to magenta
              ctx.fillStyle = `hsl(${hue}, 95%, 55%)`;
              ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
            }
          } else {
            // Idle placeholder line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, h * 0.85);
            ctx.lineTo(w, h * 0.85);
            ctx.stroke();
          }
        }
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [engine, config.localAudioEnabled, config.generativeSoundEnabled]);

  const handleToggleLocalAudio = async () => {
    const success = await engine.toggleLocalAudio();
    if (success) {
      showToast('Local Audio Reactive: ACTIVE (Microphone Connected)');
    } else {
      if (engine.getPermissionManager().getState() === 'denied') {
        showToast('Microphone access was denied in browser settings.');
      } else {
        showToast('Local Audio Reactive: DISABLED');
      }
    }
  };

  const handleToggleGenerative = () => {
    engine.toggleGenerativeSound();
    if (!config.generativeSoundEnabled) {
      showToast(`Generative Sound: ON (${config.soundCategory.toUpperCase()})`);
    } else {
      showToast('Generative Sound: OFF');
    }
  };

  const handleCategorySelect = (cat: GenerativeSoundCategory) => {
    engine.setSoundCategory(cat);
    showToast(`Ambient Sound: ${cat.toUpperCase()}`);
  };

  const handlePresetSelect = (preset: AudioPresetType) => {
    engine.setPreset(preset);
    showToast(`Audio Preset: ${preset.toUpperCase()}`);
  };

  const soundCategories: { id: GenerativeSoundCategory; name: string; icon: string }[] = [
    { id: 'space', name: 'Space Ambience', icon: '🌌' },
    { id: 'ocean', name: 'Ocean Waves', icon: '🌊' },
    { id: 'rain', name: 'Rainfall', icon: '🌧️' },
    { id: 'wind', name: 'Mountain Wind', icon: '💨' },
    { id: 'forest', name: 'Forest Birds', icon: '🌿' },
    { id: 'cyber', name: 'Cyber City', icon: '🌆' },
    { id: 'energy', name: 'Energy Hum', icon: '⚡' },
    { id: 'portal', name: 'Portal Swirl', icon: '🌀' },
    { id: 'underwater', name: 'Deep Underwater', icon: '🫧' },
  ];

  const presets: { id: AudioPresetType; name: string; desc: string }[] = [
    { id: 'subtle', name: 'SUBTLE', desc: 'Smooth, meditative reactivity' },
    { id: 'balanced', name: 'BALANCED', desc: 'Natural equilibrium & comfort' },
    { id: 'dynamic', name: 'DYNAMIC', desc: 'Punchy kicks & bass drops' },
    { id: 'cinematic', name: 'CINEMATIC', desc: 'Expansive drone sweeps & bloom' },
    { id: 'extreme', name: 'EXTREME', desc: 'Max energy & shockwave pulses' },
  ];

  const hasAudioSource = config.localAudioEnabled || config.generativeSoundEnabled;
  const currentTier = typeof qualityProfile === 'string' ? qualityProfile : qualityProfile?.profile || 'HIGH';

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
      <div className="relative rounded-2xl overflow-hidden p-5 sm:p-6 mb-6 bg-gradient-to-br from-[#0a152e]/90 via-[#060b18]/80 to-[#180a29]/90 border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#00F0FF]/15 to-[#D946EF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                <Music size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-wider font-['Orbitron'] text-white">
                  AUDIO <span className="text-[#00F0FF]">LAB</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono">
                  Audio Reactive 3D Visuals • Real-Time Frequency Analysis • Procedural Ambience
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Live Audio Reactive Badge */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                config.enabled && hasAudioSource
                  ? 'bg-[#00FFA3]/15 border-[#00FFA3]/50 text-[#00FFA3] shadow-[0_0_12px_rgba(0,255,163,0.3)]'
                  : 'bg-black/50 border-white/10 text-slate-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  config.enabled && hasAudioSource ? 'bg-[#00FFA3] animate-ping' : 'bg-slate-600'
                }`}
              />
              <span>
                {config.enabled && hasAudioSource
                  ? config.localAudioEnabled
                    ? 'MIC REACTIVE'
                    : 'GENERATIVE REACTIVE'
                  : 'AUDIO IDLE'}
              </span>
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
            <span className="text-slate-400 block text-[10px]">ACTIVE PROFILE</span>
            <span className="text-[#00F0FF] font-bold uppercase">{activeWallpaperId.replace('-particle-field', '')}</span>
          </div>
          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-400 block text-[10px]">ESTIMATED BPM</span>
            <span className="text-[#00FFA3] font-bold">
              {hasAudioSource ? `${liveStats.bpm} BPM` : '--'}
            </span>
          </div>
          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-400 block text-[10px]">BEAT TRIGGER</span>
            <span className={liveStats.isBeat ? 'text-[#FF007F] font-bold animate-pulse' : 'text-slate-500'}>
              {liveStats.isBeat ? 'BEAT HIT' : 'WAITING'}
            </span>
          </div>
          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-400 block text-[10px]">FFT RESOLUTION</span>
            <span className="text-amber-300 font-bold">{currentTier} (Adaptive)</span>
          </div>
        </div>
      </div>

      {/* Privacy Guarantee Card */}
      <div className="p-3.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 mb-6 flex items-start gap-3">
        <ShieldCheck size={20} className="text-[#00F0FF] shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-white tracking-wide">
            Audio is processed locally on this device.
          </p>
          <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">
            100% Offline Web Audio API analysis. Raw audio is never recorded, uploaded, or transmitted to any server or external cloud service.
          </p>
        </div>
      </div>

      {/* Primary Toggles & Controls Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {/* Toggle 1: Master Audio Reactive */}
        <button
          onClick={() => {
            engine.updateConfig({ enabled: !config.enabled });
            showToast(config.enabled ? 'Audio Reactivity: OFF' : 'Audio Reactivity: ON');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            config.enabled
              ? 'bg-[#00F0FF]/15 border-[#00F0FF]/80 text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]'
              : 'bg-black/30 border-white/10 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono font-bold text-[#00F0FF]">AUDIO REACTIVE</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${config.enabled ? 'bg-[#00F0FF]/30 text-white font-bold' : 'bg-slate-800 text-slate-400'}`}>
              {config.enabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300">Master visual synchronization</p>
        </button>

        {/* Toggle 2: Local Audio (Microphone input) */}
        <button
          onClick={handleToggleLocalAudio}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            config.localAudioEnabled
              ? 'bg-[#00FFA3]/15 border-[#00FFA3]/80 text-white shadow-[0_0_15px_rgba(0,255,163,0.2)]'
              : 'bg-black/30 border-white/10 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#00FFA3]">
              {config.localAudioEnabled ? <Mic size={14} /> : <MicOff size={14} />}
              <span>LOCAL AUDIO</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${config.localAudioEnabled ? 'bg-[#00FFA3]/30 text-white font-bold' : 'bg-slate-800 text-slate-400'}`}>
              {config.localAudioEnabled ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            {permissionState === 'denied'
              ? 'Permission Denied in Browser'
              : 'Reacts to device mic & music'}
          </p>
        </button>

        {/* Toggle 3: Generative Sound */}
        <button
          onClick={handleToggleGenerative}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            config.generativeSoundEnabled
              ? 'bg-[#D946EF]/15 border-[#D946EF]/80 text-white shadow-[0_0_15px_rgba(217,70,239,0.2)]'
              : 'bg-black/30 border-white/10 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#D946EF]">
              <Radio size={14} />
              <span>GENERATIVE AMBIENCE</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${config.generativeSoundEnabled ? 'bg-[#D946EF]/30 text-white font-bold' : 'bg-slate-800 text-slate-400'}`}>
              {config.generativeSoundEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300">Procedural synthesizer sounds</p>
        </button>
      </div>

      {/* Real-time Spectrum Canvas Visualizer */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-[#00F0FF]" />
            <h3 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">
              Real-Time Frequency Spectrum
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            VOL: {(liveStats.volume * 100).toFixed(0)}% • BASS: {(liveStats.bass * 100).toFixed(0)}%
          </span>
        </div>

        {/* Canvas Display */}
        <canvas
          ref={canvasRef}
          width={640}
          height={110}
          className="w-full h-24 rounded-lg bg-black/60 border border-white/5 block"
        />

        {/* 8 Spectral Bands Indicators */}
        <div className="grid grid-cols-8 gap-1.5 mt-2.5 text-center">
          {['SUB', 'BASS', 'LO-MID', 'MID', 'HI-MID', 'PRES', 'TREB', 'BRILL'].map((label, idx) => {
            const val = liveStats.bands[idx] || 0;
            return (
              <div key={label} className="bg-black/30 p-1.5 rounded border border-white/5">
                <div className="h-10 bg-slate-900 rounded relative overflow-hidden flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-[#00F0FF] to-[#D946EF] rounded-t transition-all duration-75"
                    style={{ height: `${Math.min(100, Math.max(4, val * 100))}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-slate-400 block mt-1">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generative Sound Synthesizer Selector (Visible when active or customizable) */}
      <div className="p-4 rounded-2xl bg-[#070e24]/80 border border-white/10 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold font-mono tracking-wider text-[#D946EF] uppercase flex items-center gap-1.5">
            <Radio size={14} />
            <span>Procedural Ambient Sounds (Web Audio Synthesizer)</span>
          </h2>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>VOLUME: {(config.soundVolume * 100).toFixed(0)}%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.soundVolume}
              onChange={(e) => engine.updateConfig({ soundVolume: parseFloat(e.target.value) })}
              className="w-20 accent-[#D946EF] cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {soundCategories.map((cat) => {
            const isSelected = config.soundCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`p-2.5 rounded-xl border text-xs font-mono flex flex-col items-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-[#D946EF]/20 border-[#D946EF] text-white font-bold shadow-[0_0_12px_rgba(217,70,239,0.3)]'
                    : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="text-[10px] text-center truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Audio Reactive Presets */}
      <div className="mb-6">
        <h2 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-1.5">
          <Sliders size={14} className="text-[#00FFA3]" />
          <span>Audio Reactivity Presets</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {presets.map((p) => {
            const isSelected = config.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#00FFA3]/20 border-[#00FFA3] text-white font-bold shadow-[0_0_12px_rgba(0,255,163,0.25)]'
                    : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold font-mono">{p.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Left Column: Frequency Reactions */}
        <div className="p-4 rounded-2xl bg-[#070d1e]/80 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h3 className="text-xs font-bold font-mono uppercase text-[#00F0FF] flex items-center gap-1.5">
              <Zap size={14} />
              <span>Frequency Band Reactions</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              SENSITIVITY: {config.sensitivity.toFixed(1)}x
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>OVERALL SENSITIVITY</span>
              <span>{config.sensitivity.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.05"
              value={config.sensitivity}
              onChange={(e) => engine.updateConfig({ sensitivity: parseFloat(e.target.value) })}
              className="w-full accent-[#00F0FF] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>BASS REACTION (Particle Scale & Pulses)</span>
              <span>{(config.bassReaction * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2.0"
              step="0.05"
              value={config.bassReaction}
              onChange={(e) => engine.updateConfig({ bassReaction: parseFloat(e.target.value) })}
              className="w-full accent-[#00F0FF] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>MID REACTION (Flow & Stream Velocity)</span>
              <span>{(config.midReaction * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2.0"
              step="0.05"
              value={config.midReaction}
              onChange={(e) => engine.updateConfig({ midReaction: parseFloat(e.target.value) })}
              className="w-full accent-[#00F0FF] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>TREBLE REACTION (Sparks & Crystal Highlights)</span>
              <span>{(config.trebleReaction * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2.0"
              step="0.05"
              value={config.trebleReaction}
              onChange={(e) => engine.updateConfig({ trebleReaction: parseFloat(e.target.value) })}
              className="w-full accent-[#00F0FF] cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: Visual, Camera & Physics Coupling */}
        <div className="p-4 rounded-2xl bg-[#070d1e]/80 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h3 className="text-xs font-bold font-mono uppercase text-[#D946EF] flex items-center gap-1.5">
              <Disc size={14} />
              <span>Engine Coupling & Physics</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              INTENSITY: {(config.visualIntensity * 100).toFixed(0)}%
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>BEAT DETECTION REACTION</span>
              <span>{(config.beatReaction * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2.0"
              step="0.05"
              value={config.beatReaction}
              onChange={(e) => engine.updateConfig({ beatReaction: parseFloat(e.target.value) })}
              className="w-full accent-[#D946EF] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>VISUAL INTENSITY MULTIPLIER</span>
              <span>{(config.visualIntensity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2.0"
              step="0.05"
              value={config.visualIntensity}
              onChange={(e) => engine.updateConfig({ visualIntensity: parseFloat(e.target.value) })}
              className="w-full accent-[#D946EF] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>CAMERA REACTION (Smooth Micro-Drift Capped)</span>
              <span>{(config.cameraReaction * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.05"
              value={config.cameraReaction}
              onChange={(e) => engine.updateConfig({ cameraReaction: parseFloat(e.target.value) })}
              className="w-full accent-[#FF5577] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>PHYSICS REACTION (Gravity & Shockwaves)</span>
              <span>{(config.physicsReaction * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2.0"
              step="0.05"
              value={config.physicsReaction}
              onChange={(e) => engine.updateConfig({ physicsReaction: parseFloat(e.target.value) })}
              className="w-full accent-[#00FFA3] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Diagnostic Mode Trigger Button */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold font-mono tracking-wider text-white uppercase flex items-center gap-2">
            <Gauge size={16} className="text-[#00F0FF]" />
            <span>TEST AUDIO REACTION (Diagnostic Mode)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {hasAudioSource
              ? 'Real-time diagnostic metrics active. Audio stream detected.'
              : 'Local audio input or generative ambience must be active to test.'}
          </p>
        </div>

        <button
          onClick={() => {
            if (!hasAudioSource) {
              showToast('Please enable Local Audio or Generative Ambience first.');
              return;
            }
            setIsDiagnosticMode(!isDiagnosticMode);
            showToast(isDiagnosticMode ? 'Diagnostic Mode: CLOSED' : 'Diagnostic Mode: ACTIVE');
          }}
          className={`px-4 py-2.5 rounded-xl border text-xs font-bold font-mono uppercase tracking-wider transition-all ${
            isDiagnosticMode
              ? 'bg-[#00F0FF] text-black border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.4)]'
              : 'bg-slate-800/80 border-white/10 text-white hover:bg-slate-700'
          }`}
        >
          {isDiagnosticMode ? 'Close Diagnostics' : 'Test Audio Reaction'}
        </button>
      </div>

      {/* Diagnostic Telemetry Panel */}
      {isDiagnosticMode && hasAudioSource && (
        <div className="mt-4 p-4 rounded-2xl bg-[#050b1a]/95 border border-[#00F0FF]/40 shadow-2xl animate-fade-in text-xs font-mono space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[#00F0FF] font-bold">LOCAL AUDIO DIAGNOSTIC TELEMETRY</span>
            <span className="text-[#00FFA3]">STATUS: LIVE</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-black/40 p-2 rounded border border-white/5">
              <span className="text-slate-400 block text-[10px]">RMS VOLUME</span>
              <span className="text-white font-bold">{(liveStats.volume * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-black/40 p-2 rounded border border-white/5">
              <span className="text-slate-400 block text-[10px]">BASS (20-250 Hz)</span>
              <span className="text-[#00F0FF] font-bold">{(liveStats.bass * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-black/40 p-2 rounded border border-white/5">
              <span className="text-slate-400 block text-[10px]">MID (250-4000 Hz)</span>
              <span className="text-[#00FFA3] font-bold">{(liveStats.mid * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-black/40 p-2 rounded border border-white/5">
              <span className="text-slate-400 block text-[10px]">TREBLE (4-20 kHz)</span>
              <span className="text-[#D946EF] font-bold">{(liveStats.treble * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div className="p-2.5 rounded bg-black/50 border border-white/5 text-[11px] text-slate-300">
            <p>
              ✔ Web Audio Context: <span className="text-[#00FFA3]">Online</span> | Sample Rate:{' '}
              {engine.getAnalyzer().getAudioContext()?.sampleRate || 44100} Hz
            </p>
            <p>
              ✔ Audio Reactive Visual Profile: <span className="text-[#00F0FF] font-bold uppercase">{activeWallpaperId}</span>
            </p>
            <p>
              ✔ Camera Safe Limit Clamp: <span className="text-[#00FFA3]">Enforced (Max 0.15 unit drift)</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
