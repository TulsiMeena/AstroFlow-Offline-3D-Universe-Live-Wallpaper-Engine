import React, { useState, useEffect } from 'react';
import {
  Zap,
  BatteryCharging,
  Shield,
  Activity,
  Gauge,
  Sliders,
  Sparkles,
  Layers,
  Volume2,
  Compass,
  Moon,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Info,
  Smartphone,
  Eye,
  Cpu
} from 'lucide-react';
import {
  PowerOptimizationEngine,
  PowerMode,
  SmartFPSTarget,
  SensorPowerMode,
  RealBatteryInfo,
  PowerMetrics,
  PowerConfig,
  AndroidPowerPayload
} from '../power';

interface PowerCenterProps {
  powerEngine?: PowerOptimizationEngine;
}

export const PowerCenter: React.FC<PowerCenterProps> = ({ powerEngine }) => {
  const engine = powerEngine || PowerOptimizationEngine.getInstance();

  const [metrics, setMetrics] = useState<PowerMetrics>(() => engine.getMetrics());
  const [config, setConfig] = useState<PowerConfig>(() => engine.getConfig());
  const [batteryInfo, setBatteryInfo] = useState<RealBatteryInfo>(() =>
    engine.getBatteryManager().getBatteryInfo()
  );
  const [thermalRecs, setThermalRecs] = useState(() =>
    engine.getThermalManager().getRecommendations()
  );
  const [copiedBridge, setCopiedBridge] = useState(false);
  const [autoOptimizedMessage, setAutoOptimizedMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubMetrics = engine.subscribe(setMetrics);
    const unsubProfile = engine.getBatteryManager().subscribe(setBatteryInfo);
    const unsubThermal = engine.getThermalManager().subscribe((_state, recs) => {
      setThermalRecs(recs);
    });

    const interval = setInterval(() => {
      setMetrics(engine.getMetrics());
      setConfig(engine.getConfig());
    }, 500);

    return () => {
      unsubMetrics();
      unsubProfile();
      unsubThermal();
      clearInterval(interval);
    };
  }, [engine]);

  const handleSelectMode = (mode: PowerMode) => {
    engine.setPowerMode(mode);
    setConfig(engine.getConfig());
    setMetrics(engine.getMetrics());
  };

  const handleAutoOptimize = () => {
    engine.autoOptimize();
    setConfig(engine.getConfig());
    setMetrics(engine.getMetrics());
    setAutoOptimizedMessage('Hardware context analyzed: Optimal workload applied.');
    setTimeout(() => setAutoOptimizedMessage(null), 3000);
  };

  const handleToggleAmoled = () => {
    engine.toggleAmoledMode();
    setConfig(engine.getConfig());
    setMetrics(engine.getMetrics());
  };

  const handleSensorModeChange = (mode: SensorPowerMode) => {
    engine.setSensorMode(mode);
    setConfig(engine.getConfig());
  };

  const handleToggleThermalProtection = () => {
    engine.setThermalProtection(!config.thermalProtectionEnabled);
    setConfig(engine.getConfig());
  };

  const handleToggleEffect = (key: keyof PowerConfig['effects']) => {
    const updated = { ...config.effects, [key]: !config.effects[key] };
    engine.getEffectPowerManager().setState(updated);
    setConfig(engine.getConfig());
  };

  const handleCopyAndroidPayload = () => {
    const payload = engine.getAndroidPayload();
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedBridge(true);
    setTimeout(() => setCopiedBridge(false), 2000);
  };

  const modes: { id: PowerMode; label: string; desc: string; fps: string; badge: string; color: string }[] = [
    {
      id: 'MAX_QUALITY',
      label: 'MAX QUALITY',
      desc: 'Full 60 FPS rendering with all procedural layers, bloom, depth particles, and 60Hz sensor tracking.',
      fps: '60 FPS',
      badge: 'PRO PERFORMANCE',
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/40 text-cyan-300'
    },
    {
      id: 'BALANCED',
      label: 'BALANCED',
      desc: 'Dynamic 45-60 FPS with adaptive idle down-stepping (30 FPS when untouched). Balances battery & beauty.',
      fps: 'Dynamic 30-60',
      badge: 'RECOMMENDED',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300'
    },
    {
      id: 'BATTERY_SAVER',
      label: 'BATTERY SAVER',
      desc: 'Capped at 30 FPS, halves physics sub-steps, disables bloom & blur, down-samples heavy particles.',
      fps: '30 FPS',
      badge: 'POWER PRESERVING',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-300'
    },
    {
      id: 'ULTRA_BATTERY_SAVER',
      label: 'ULTRA BATTERY SAVER',
      desc: 'Capped at 15-20 FPS, sleeping physics, pure black AMOLED void, sensors disabled or low-frequency.',
      fps: '15-20 FPS',
      badge: 'MAX ENDURANCE',
      color: 'from-purple-500/20 to-pink-500/10 border-purple-500/40 text-purple-300'
    }
  ];

  return (
    <div className="w-full min-h-screen pt-20 pb-24 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold tracking-wider flex items-center gap-1">
              <Zap size={11} />
              100% OFFLINE SMART POWER ENGINE
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Live Workload Coordinator
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-['Orbitron'] text-white tracking-wide mt-1 flex items-center gap-2">
            POWER CENTER
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-0.5">
            Intelligently manages frame pacing, GPU compute budgets, sensor polling, and thermal headroom.
          </p>
        </div>

        {/* Global Auto-Optimize & AMOLED Quick Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleAutoOptimize}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-black font-extrabold text-xs uppercase tracking-wider hover:opacity-95 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <Sparkles size={15} />
            <span>AUTO OPTIMIZE</span>
          </button>

          <button
            onClick={handleToggleAmoled}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-bold text-xs uppercase tracking-wider active:scale-95 transition-all ${
              config.amoledMode
                ? 'bg-purple-600/30 border-purple-500/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
            }`}
          >
            <Moon size={15} className={config.amoledMode ? 'text-purple-400' : 'text-slate-400'} />
            <span>AMOLED: {config.amoledMode ? 'ACTIVE' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {autoOptimizedMessage && (
        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} />
          <span>{autoOptimizedMessage}</span>
        </div>
      )}

      {/* Real Hardware Platform Status Card */}
      <div className="p-4 rounded-3xl bg-[#0d1527]/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <BatteryCharging size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white font-mono">DEVICE BATTERY INTERFACE</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                batteryInfo.isSupported
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {batteryInfo.isSupported ? 'HARDWARE API DETECTED' : 'BROWSER SANDBOXED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {batteryInfo.statusMessage}
            </p>
          </div>
        </div>

        {batteryInfo.isSupported && batteryInfo.level !== null && (
          <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-2xl border border-white/5 font-mono text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">BATTERY LEVEL</span>
              <span className="text-white font-bold text-base">
                {Math.round(batteryInfo.level * 100)}%
              </span>
            </div>
            <div className="h-6 w-[1px] bg-white/10" />
            <div>
              <span className="text-slate-400 block text-[10px]">CHARGING STATE</span>
              <span className={batteryInfo.charging ? 'text-emerald-400 font-bold' : 'text-slate-300 font-semibold'}>
                {batteryInfo.charging ? 'Connected' : 'Discharging'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Live System Metrics Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric: Current FPS */}
        <div className="p-3.5 rounded-2xl bg-[#0a0f1d]/90 border border-white/10 flex flex-col gap-1">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Gauge size={13} className="text-cyan-400" />
            Live Render FPS
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-bold font-mono text-cyan-300">{metrics.currentFPS}</span>
            <span className="text-xs text-slate-500 font-mono">/ {metrics.targetFPS} target</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {metrics.isIdle ? 'Idle throttled' : 'Active interaction'}
          </span>
        </div>

        {/* Metric: Workload Level */}
        <div className="p-3.5 rounded-2xl bg-[#0a0f1d]/90 border border-white/10 flex flex-col gap-1">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Activity size={13} className="text-emerald-400" />
            Estimated Workload
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-xl font-bold font-mono ${
              metrics.workloadLevel === 'LOW' ? 'text-emerald-400' :
              metrics.workloadLevel === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {metrics.workloadLevel}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Algorithmic budget index
          </span>
        </div>

        {/* Metric: Thermal Protection */}
        <div className="p-3.5 rounded-2xl bg-[#0a0f1d]/90 border border-white/10 flex flex-col gap-1">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Shield size={13} className="text-purple-400" />
            Thermal Guard
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-xl font-bold font-mono ${
              metrics.thermalState === 'NOMINAL' ? 'text-purple-300' :
              metrics.thermalState === 'ELEVATED' ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {metrics.thermalState}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {config.thermalProtectionEnabled ? 'Auto-throttle ready' : 'Disabled'}
          </span>
        </div>

        {/* Metric: Particle Budget */}
        <div className="p-3.5 rounded-2xl bg-[#0a0f1d]/90 border border-white/10 flex flex-col gap-1">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Sparkles size={13} className="text-blue-400" />
            Particle Scale
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-bold font-mono text-blue-300">{metrics.particleActiveBudget}%</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {config.effects.particles ? 'Active GPU budget' : 'Particles Paused'}
          </span>
        </div>

        {/* Metric: Physics Sub-steps */}
        <div className="p-3.5 rounded-2xl bg-[#0a0f1d]/90 border border-white/10 flex flex-col gap-1">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Zap size={13} className="text-amber-400" />
            Physics Divisor
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-bold font-mono text-amber-300">1/{metrics.physicsSubstep}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {metrics.physicsSubstep === 1 ? 'Every frame (60Hz)' : `Every ${metrics.physicsSubstep} frames`}
          </span>
        </div>

        {/* Metric: Sensors & Polling */}
        <div className="p-3.5 rounded-2xl bg-[#0a0f1d]/90 border border-white/10 flex flex-col gap-1">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Compass size={13} className="text-teal-400" />
            Motion Sensor
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold font-mono text-teal-300">{metrics.sensorMode}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {metrics.sensorMode === 'OFF' ? 'Sensor polling zero' : metrics.sensorMode === 'LOW' ? '15Hz Cadence' : 'Full Precision'}
          </span>
        </div>
      </div>

      {/* Main Mode Selection Cards */}
      <div>
        <h2 className="text-sm font-mono font-bold text-slate-300 tracking-wider mb-3 uppercase flex items-center gap-2">
          <Sliders size={14} className="text-[#00F0FF]" />
          Select Battery & Power Mode
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {modes.map(mode => {
            const isSelected = config.mode === mode.id;
            return (
              <div
                key={mode.id}
                onClick={() => handleSelectMode(mode.id)}
                className={`p-4 rounded-3xl cursor-pointer border transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? `bg-gradient-to-b ${mode.color} shadow-2xl scale-[1.02]`
                    : 'bg-[#0a0f1d]/70 hover:bg-[#0a0f1d] border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                    }`}>
                      {mode.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">{mode.fps}</span>
                  </div>

                  <h3 className="text-base font-bold font-['Orbitron'] text-white tracking-wide">
                    {mode.label}
                  </h3>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {mode.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold">
                    {isSelected ? 'CURRENTLY ACTIVE' : 'TAP TO ACTIVATE'}
                  </span>
                  {isSelected && <CheckCircle2 size={16} className="text-white" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deep Dives: Independent Subsystem Power Toggles & Thermal Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Subsystem Power Controls (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-[#0a0f1d]/80 border border-white/10 backdrop-blur-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-bold font-['Orbitron'] text-white tracking-wide flex items-center gap-2">
                <Sliders size={15} className="text-cyan-400" />
                GRANULAR EFFECT POWER CONTROLS
              </h3>
              <p className="text-xs text-slate-400">
                Turn off non-essential sub-systems to minimize GPU and CPU cycles.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              { key: 'particles' as const, label: 'Particles', desc: 'Compute & vertex updates' },
              { key: 'physics' as const, label: 'Physics', desc: 'Verlet & gravity solver' },
              { key: 'bloom' as const, label: 'Bloom Glow', desc: 'High GPU fillrate' },
              { key: 'postProcessing' as const, label: 'Post-FX', desc: 'Multi-pass framebuffer' },
              { key: 'fog' as const, label: 'Volumetric Fog', desc: 'Shader depth blending' },
              { key: 'audioReactive' as const, label: 'Audio Engine', desc: 'Realtime FFT analysis' },
              { key: 'ecosystem' as const, label: 'Ecosystem', desc: 'Entity life simulation' },
              { key: 'weather' as const, label: 'Weather', desc: 'Rain/snow particulate' },
              { key: 'cameraEffects' as const, label: 'Cinematics', desc: 'Drift & focal tracking' },
            ].map(item => {
              const active = config.effects[item.key];
              return (
                <button
                  key={item.key}
                  onClick={() => handleToggleEffect(item.key)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    active
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-white shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'bg-white/5 border-white/5 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold font-mono text-slate-200">{item.label}</span>
                    <span className={`w-2 h-2 rounded-full ${active ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">{item.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Sensor Polling Selector */}
          <div className="mt-2 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <Compass size={14} className="text-teal-400" />
                MOTION SENSOR POWER CONSUMPTION
              </span>
              <span className="text-[11px] text-slate-400 block">
                Regulate gyro & accelerometer event listener frequency.
              </span>
            </div>

            <div className="flex items-center rounded-xl bg-black/40 border border-white/10 p-1">
              {(['OFF', 'LOW', 'NORMAL', 'HIGH'] as SensorPowerMode[]).map(sMode => (
                <button
                  key={sMode}
                  onClick={() => handleSensorModeChange(sMode)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                    config.sensorMode === sMode
                      ? 'bg-teal-500 text-black shadow-[0_0_10px_rgba(20,184,166,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sMode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Thermal Guard & Android Bridge (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Thermal Protection Card */}
          <div className="p-5 rounded-3xl bg-[#0a0f1d]/80 border border-white/10 backdrop-blur-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-['Orbitron'] text-white tracking-wide flex items-center gap-2">
                <Shield size={16} className="text-purple-400" />
                THERMAL PROTECTION ENGINE
              </h3>

              <button
                onClick={handleToggleThermalProtection}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all ${
                  config.thermalProtectionEnabled
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-white/5 text-slate-400 border border-white/10'
                }`}
              >
                {config.thermalProtectionEnabled ? 'ACTIVE' : 'DISABLED'}
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Thermal State:</span>
                <span className={`font-bold ${
                  metrics.thermalState === 'NOMINAL' ? 'text-emerald-400' :
                  metrics.thermalState === 'ELEVATED' ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {metrics.thermalState}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Frame Budget:</span>
                <span className="text-cyan-300 font-semibold">16.6ms Target</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1 pt-1.5 border-t border-white/5">
                {thermalRecs.statusNote}
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Thermal Protection monitors sustained frame time spikes and automatically steps down particle counts, resolution scale, and FPS target before hardware thermal throttling occurs.
            </p>
          </div>

          {/* Android Power Bridge Card */}
          <div className="p-5 rounded-3xl bg-[#0a0f1d]/80 border border-white/10 backdrop-blur-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-['Orbitron'] text-white tracking-wide flex items-center gap-2">
                <Smartphone size={16} className="text-cyan-400" />
                ANDROID POWER BRIDGE
              </h3>

              <button
                onClick={handleCopyAndroidPayload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-mono transition-all"
              >
                {copiedBridge ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedBridge ? 'COPIED' : 'COPY CONFIG'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Exports power directives directly for the native Android Live Wallpaper Service to pause rendering when the device screen locks or is in the background.
            </p>

            <div className="p-3 rounded-2xl bg-black/50 border border-white/5 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-32">
              <pre>{JSON.stringify(engine.getAndroidPayload(), null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
