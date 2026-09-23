import React, { useState, useEffect } from 'react';
import {
  Zap,
  Activity,
  Wind,
  Compass,
  Layers,
  Sparkles,
  RotateCcw,
  Shuffle,
  Shield,
  Eye,
  Sliders,
  Play,
  Pause,
  Droplets,
  Flame,
  Globe,
  Radio,
  Minimize2,
  Maximize2,
  Waves
} from 'lucide-react';
import { PhysicsEngine } from '../physics/PhysicsEngine';
import {
  PhysicsConfig,
  PhysicsPresetType,
  GravityPresetType,
  FluidSimulationType,
  PhysicsEngineStats,
} from '../physics/types';
import { QualityProfile } from '../types/engine';

interface PhysicsLabProps {
  physicsEngine?: PhysicsEngine;
  qualityProfile?: QualityProfile | any;
  onOpenLivePreview?: () => void;
}

export const PhysicsLab: React.FC<PhysicsLabProps> = ({
  physicsEngine,
  qualityProfile,
  onOpenLivePreview,
}) => {
  const engine = physicsEngine || PhysicsEngine.getInstance();
  const [config, setConfig] = useState<PhysicsConfig>(engine.getConfig());
  const [stats, setStats] = useState<PhysicsEngineStats>(engine.getStats());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync config when updated from external or presets
  useEffect(() => {
    const unsubscribe = engine.subscribe((newConfig) => {
      setConfig({ ...newConfig });
    });

    const interval = setInterval(() => {
      setStats(engine.getStats());
    }, 250);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [engine]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  const handleUpdate = (partial: Partial<PhysicsConfig>) => {
    engine.updateConfig(partial);
    setConfig(engine.getConfig());
  };

  const handlePresetSelect = (preset: PhysicsPresetType) => {
    engine.setPreset(preset);
    setConfig(engine.getConfig());
    showToast(`Physics Preset: ${preset.toUpperCase()}`);
  };

  const handleCreateForceField = () => {
    const types = ['vortex', 'attraction', 'repulsion', 'orbital', 'turbulence'] as const;
    const pickedType = types[Math.floor(Math.random() * types.length)];
    engine.createForceField(pickedType);
    showToast(`Spawned Force Field: ${pickedType.toUpperCase()}`);
  };

  const handleCreateShockwave = () => {
    engine.triggerShockwave();
    showToast('Triggered Procedural Shockwave');
  };

  const handleRandomize = () => {
    engine.randomizePhysics();
    setConfig(engine.getConfig());
    showToast('Randomized Physics Parameters');
  };

  const handleReset = () => {
    engine.resetPhysics();
    setConfig(engine.getConfig());
    showToast('Reset Physics to Defaults');
  };

  const presets: { id: PhysicsPresetType; name: string; icon: string; desc: string }[] = [
    { id: 'cosmic', name: 'Cosmic', icon: '✨', desc: 'Low gravity with plasma flow' },
    { id: 'ocean', name: 'Ocean', icon: '🌊', desc: 'Liquid water wave dynamics' },
    { id: 'volcano', name: 'Volcano', icon: '🌋', desc: 'Dense lava & thermal updrafts' },
    { id: 'storm', name: 'Storm', icon: '⚡', desc: 'Violent winds & electric pulses' },
    { id: 'cyber', name: 'Cyber', icon: '🌆', desc: 'High kinetic neon energy' },
    { id: 'crystal', name: 'Crystal', icon: '💎', desc: 'Glass refractions & brittle drag' },
    { id: 'zero-gravity', name: 'Zero G', icon: '🛸', desc: 'Weightless floating particles' },
    { id: 'black-hole', name: 'Black Hole', icon: '🕳️', desc: 'Extreme singularity attraction' },
    { id: 'dream', name: 'Dream', icon: '🌙', desc: 'Ethereal floating smoke drift' },
    { id: 'experimental', name: 'Experimental', icon: '🧪', desc: 'Vortex turbulence chaos' },
  ];

  const gravityModes: { id: GravityPresetType; label: string }[] = [
    { id: 'normal', label: 'Normal' },
    { id: 'low', label: 'Low G' },
    { id: 'zero', label: 'Zero G' },
    { id: 'reverse', label: 'Reverse' },
    { id: 'planet', label: 'Planet' },
    { id: 'black-hole', label: 'Singularity' },
    { id: 'vortex', label: 'Vortex' },
  ];

  const fluidModes: { id: FluidSimulationType; label: string; icon: string }[] = [
    { id: 'water', label: 'Water', icon: '💧' },
    { id: 'liquid-glass', label: 'Glass', icon: '💎' },
    { id: 'plasma', label: 'Plasma', icon: '⚡' },
    { id: 'lava', label: 'Lava', icon: '🔥' },
    { id: 'smoke', label: 'Smoke', icon: '💨' },
    { id: 'energy', label: 'Energy', icon: '✨' },
  ];

  const currentTier = typeof qualityProfile === 'string' ? qualityProfile : qualityProfile?.profile || 'HIGH';

  return (
    <div className="min-h-screen bg-[#030611] text-slate-100 pt-16 pb-28 px-4 sm:px-6 max-w-4xl mx-auto selection:bg-[#00F0FF]/30">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#050B1A]/95 border border-[#00F0FF]/60 text-[#00F0FF] text-xs font-mono tracking-wide shadow-[0_0_20px_rgba(0,240,255,0.4)] backdrop-blur-md flex items-center gap-2 animate-fade-in">
          <Zap size={14} className="animate-spin" />
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
                <Zap size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-wider font-['Orbitron'] text-white">
                  PHYSICS <span className="text-[#00F0FF]">LAB</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono">
                  Procedural Force Fields • Fluid Reactions • Verlet Cloth • Shockwaves
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Master Toggle */}
            <button
              onClick={() => handleUpdate({ enabled: !config.enabled })}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold font-mono transition-all active:scale-95 shadow-lg ${
                config.enabled
                  ? 'bg-[#00F0FF]/20 border-[#00F0FF]/60 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                  : 'bg-red-500/15 border-red-500/40 text-red-400'
              }`}
            >
              {config.enabled ? <Play size={14} /> : <Pause size={14} />}
              <span>{config.enabled ? 'PHYSICS ON' : 'PHYSICS OFF'}</span>
            </button>

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

        {/* Real-time Telemetry Bar */}
        <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-400 block text-[10px]">PARTICLES</span>
            <span className="text-[#00FFA3] font-bold">{stats.particleCount.toLocaleString()}</span>
          </div>
          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-400 block text-[10px]">FORCE FIELDS</span>
            <span className="text-[#00F0FF] font-bold">{stats.activeForceFields}</span>
          </div>
          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-400 block text-[10px]">SHOCKWAVES</span>
            <span className="text-[#D946EF] font-bold">{stats.activeShockwaves}</span>
          </div>
          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-400 block text-[10px]">STEP TIME</span>
            <span className="text-amber-300 font-bold">{stats.stepTimeMs} ms</span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-black/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-400 block text-[10px]">QUALITY TIER</span>
            <span className="text-purple-300 font-bold">{currentTier}</span>
          </div>
        </div>
      </div>

      {/* 4 Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
        <button
          onClick={handleCreateForceField}
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-[#00F0FF]/15 to-[#0088FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold font-mono hover:from-[#00F0FF]/25 hover:to-[#0088FF]/25 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)]"
        >
          <Sparkles size={15} />
          <span>FORCE FIELD</span>
        </button>

        <button
          onClick={handleCreateShockwave}
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-[#D946EF]/15 to-[#FF007F]/15 border border-[#D946EF]/40 text-[#D946EF] text-xs font-bold font-mono hover:from-[#D946EF]/25 hover:to-[#FF007F]/25 active:scale-95 transition-all shadow-[0_0_15px_rgba(217,70,239,0.15)]"
        >
          <Radio size={15} />
          <span>SHOCKWAVE</span>
        </button>

        <button
          onClick={handleRandomize}
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-[#7000FF]/15 to-[#00FFA3]/15 border border-[#00FFA3]/40 text-[#00FFA3] text-xs font-bold font-mono hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,163,0.15)]"
        >
          <Shuffle size={15} />
          <span>RANDOM PHYSICS</span>
        </button>

        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/40 border border-white/10 text-slate-300 text-xs font-bold font-mono hover:bg-slate-800/70 active:scale-95 transition-all"
        >
          <RotateCcw size={15} />
          <span>RESET PHYSICS</span>
        </button>
      </div>

      {/* Physics Presets Grid */}
      <div className="mb-6">
        <h2 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-1.5">
          <Sliders size={14} className="text-[#00F0FF]" />
          <span>Physics Presets (10 Themes)</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {presets.map((p) => {
            const isSelected = config.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.id)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#00F0FF]/15 border-[#00F0FF]/70 text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'bg-black/30 border-white/5 text-slate-300 hover:border-white/20 hover:bg-black/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">{p.icon}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-ping" />
                  )}
                </div>
                <div className="text-xs font-bold">{p.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Left Column: Gravity & Wind */}
        <div className="p-4 rounded-2xl bg-[#070d1e]/80 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h3 className="text-xs font-bold font-mono uppercase text-[#00F0FF] flex items-center gap-1.5">
              <Globe size={15} />
              <span>Gravity & Planetary Field</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {config.gravityStrength.toFixed(2)}x
            </span>
          </div>

          {/* Gravity Mode Selector */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1.5">GRAVITY MODE</label>
            <div className="grid grid-cols-4 gap-1.5">
              {gravityModes.map((gm) => (
                <button
                  key={gm.id}
                  onClick={() => handleUpdate({ gravityMode: gm.id })}
                  className={`px-2 py-1.5 rounded-lg border text-[11px] font-mono transition-all ${
                    config.gravityMode === gm.id
                      ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-white font-bold'
                      : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {gm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gravity Strength Slider */}
          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>GRAVITY STRENGTH</span>
              <span>{(config.gravityStrength * 9.81).toFixed(1)} m/s²</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={config.gravityStrength}
              onChange={(e) => handleUpdate({ gravityStrength: parseFloat(e.target.value) })}
              className="w-full accent-[#00F0FF] cursor-pointer"
            />
          </div>

          {/* Wind & Turbulence */}
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-xs font-bold font-mono uppercase text-[#70D6FF] flex items-center gap-1.5">
                <Wind size={15} />
                <span>Atmospheric Wind & Turbulence</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {config.windStrength.toFixed(2)}x
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>WIND SPEED</span>
                  <span>{(config.windStrength * 15).toFixed(0)} km/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.05"
                  value={config.windStrength}
                  onChange={(e) => handleUpdate({ windStrength: parseFloat(e.target.value) })}
                  className="w-full accent-[#70D6FF] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>WIND DIRECTION</span>
                  <span>{config.windDirectionAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={config.windDirectionAngle}
                  onChange={(e) => handleUpdate({ windDirectionAngle: parseInt(e.target.value) })}
                  className="w-full accent-[#70D6FF] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>CURL NOISE TURBULENCE</span>
                  <span>{(config.turbulence * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={config.turbulence}
                  onChange={(e) => handleUpdate({ turbulence: parseFloat(e.target.value) })}
                  className="w-full accent-[#FFB703] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interaction, Fluid & Objects */}
        <div className="p-4 rounded-2xl bg-[#070d1e]/80 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h3 className="text-xs font-bold font-mono uppercase text-[#D946EF] flex items-center gap-1.5">
              <Sparkles size={15} />
              <span>Touch & Sensor Fusion</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {config.interactionStrength.toFixed(2)}x
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>TOUCH INTERACTION SENSITIVITY</span>
              <span>{(config.interactionStrength * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={config.interactionStrength}
              onChange={(e) => handleUpdate({ interactionStrength: parseFloat(e.target.value) })}
              className="w-full accent-[#D946EF] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>SIMULATION SPEED</span>
              <span>{config.simulationSpeed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.05"
              value={config.simulationSpeed}
              onChange={(e) => handleUpdate({ simulationSpeed: parseFloat(e.target.value) })}
              className="w-full accent-[#00FFA3] cursor-pointer"
            />
          </div>

          {/* Fluid Reaction Controls */}
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-xs font-bold font-mono uppercase text-[#00FFA3] flex items-center gap-1.5">
                <Waves size={15} />
                <span>Fluid & Surface Reaction</span>
              </h3>
              <button
                onClick={() => handleUpdate({ fluidReaction: !config.fluidReaction })}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all ${
                  config.fluidReaction
                    ? 'bg-[#00FFA3]/20 border-[#00FFA3] text-[#00FFA3]'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {config.fluidReaction ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {fluidModes.map((fm) => (
                <button
                  key={fm.id}
                  onClick={() => handleUpdate({ fluidMode: fm.id })}
                  className={`p-2 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 transition-all ${
                    config.fluidMode === fm.id
                      ? 'bg-[#00FFA3]/20 border-[#00FFA3] text-white font-bold'
                      : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{fm.icon}</span>
                  <span>{fm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles: Ribbon, Shockwave, Debug */}
          <div className="pt-2 border-t border-white/5 grid grid-cols-3 gap-2">
            <button
              onClick={() => handleUpdate({ ribbonReaction: !config.ribbonReaction })}
              className={`p-2 rounded-xl border text-[10px] font-mono text-center transition-all ${
                config.ribbonReaction
                  ? 'bg-[#7000FF]/20 border-[#7000FF] text-purple-300 font-bold'
                  : 'bg-black/30 border-white/5 text-slate-500'
              }`}
            >
              SILK RIBBON: {config.ribbonReaction ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => handleUpdate({ objectReaction: !config.objectReaction })}
              className={`p-2 rounded-xl border text-[10px] font-mono text-center transition-all ${
                config.objectReaction
                  ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] font-bold'
                  : 'bg-black/30 border-white/5 text-slate-500'
              }`}
            >
              DYNAMIC BODIES: {config.objectReaction ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => handleUpdate({ debugVisuals: !config.debugVisuals })}
              className={`p-2 rounded-xl border text-[10px] font-mono text-center transition-all ${
                config.debugVisuals
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                  : 'bg-black/30 border-white/5 text-slate-500'
              }`}
            >
              DEBUG GIZMOS: {config.debugVisuals ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* World Event Test Bar */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
        <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
          <Flame size={14} className="text-orange-400" />
          <span>Simulate World Event Physics</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'meteor-shower', label: 'Meteor Impact', color: 'from-orange-500/20 to-amber-500/20 text-amber-300' },
            { id: 'portal-opening', label: 'Portal Vortex', color: 'from-fuchsia-500/20 to-purple-500/20 text-fuchsia-300' },
            { id: 'black-hole-pulse', label: 'Black Hole Pulse', color: 'from-purple-900/40 to-indigo-900/40 text-purple-200' },
            { id: 'lightning-storm', label: 'Lightning Strike', color: 'from-cyan-500/20 to-blue-500/20 text-cyan-300' },
            { id: 'volcanic-eruption', label: 'Volcanic Blast', color: 'from-red-500/20 to-orange-600/20 text-red-300' },
            { id: 'storm-gust', label: 'Storm Gust', color: 'from-teal-500/20 to-emerald-500/20 text-teal-300' },
            { id: 'heavy-rain', label: 'Heavy Rain Ripples', color: 'from-blue-600/20 to-sky-400/20 text-sky-300' },
            { id: 'energy-wave', label: 'Energy Explosion', color: 'from-emerald-500/20 to-cyan-500/20 text-emerald-300' },
          ].map((ev) => (
            <button
              key={ev.id}
              onClick={() => {
                engine.handleWorldEvent(ev.id);
                showToast(`Triggered: ${ev.label}`);
              }}
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
