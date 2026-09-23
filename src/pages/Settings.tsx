import React, { useState, useRef } from 'react';
import { QualityProfile, GPUInfo } from '../types/engine';
import { UserPreferences, WallpaperStorage } from '../storage/wallpaperStorage';
import { UnifiedStorageManager } from '../storage/unifiedStorage';
import { QualityBadge } from '../components/QualityBadge';
import { Cpu, ShieldCheck, Gauge, Sliders, Smartphone, User, Terminal, Crosshair, Sparkles, Eye, ShieldAlert, Download, Upload, RotateCcw, Activity, Check, AlertCircle } from 'lucide-react';

interface SettingsProps {
  preferences: UserPreferences;
  gpuInfo: GPUInfo;
  onUpdateQuality: (q: QualityProfile) => void;
  onUpdateSetting: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  onOpenCalibration: () => void;
  onOpenDiagnostics?: () => void;
  onOpenAndroidBridge?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  preferences,
  gpuInfo,
  onUpdateQuality,
  onUpdateSetting,
  onOpenCalibration,
  onOpenDiagnostics,
  onOpenAndroidBridge
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  const handleExportBackup = () => {
    UnifiedStorageManager.exportBackupToFile();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = UnifiedStorageManager.validateAndImport(content);
      if (result.success) {
        setImportStatus({ type: 'success', message: result.message });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setImportStatus({ type: 'error', message: result.message });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all engine settings to safe factory defaults?')) {
      localStorage.removeItem('amit_hyperwall_prefs_v2');
      window.location.reload();
    }
  };
  return (
    <div className="w-full h-full overflow-y-auto pt-16 pb-24 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-['Orbitron'] text-white">
          ENGINE CONFIGURATION
        </h2>
        <p className="text-xs text-slate-400">
          Hardware tuning, rendering quality, sensor fusion, and 3D motion calibration
        </p>
      </div>

      {/* Quality Profile Tuning */}
      <div className="p-5 rounded-3xl bg-[#0a0f1d]/85 border border-white/10 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF]">
              <Gauge size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Rendering Quality Profile</h3>
              <p className="text-xs text-slate-400">
                Adjusts resolution scale, particle caps, and shaders
              </p>
            </div>
          </div>
          <QualityBadge quality={preferences.qualityProfile} />
        </div>

        <div className="pt-2">
          <QualityBadge
            quality={preferences.qualityProfile}
            onChange={onUpdateQuality}
            interactive
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono text-slate-400">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-slate-500 block">LOW</span>
            <span className="text-white font-semibold">1,500 pts</span>
            <span className="text-[10px] text-slate-500 block">Save Battery</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-slate-500 block">MEDIUM</span>
            <span className="text-white font-semibold">4,000 pts</span>
            <span className="text-[10px] text-slate-500 block">Balanced</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-slate-500 block">HIGH</span>
            <span className="text-white font-semibold">10,000 pts</span>
            <span className="text-[10px] text-[#00F0FF] block">Recommended</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-slate-500 block">ULTRA</span>
            <span className="text-white font-semibold">22,000 pts</span>
            <span className="text-[10px] text-[#FF00EA] block">Flagship GPU</span>
          </div>
        </div>
      </div>

      {/* Motion, Sensor Fusion & Calibration */}
      <div className="p-5 rounded-3xl bg-[#0a0f1d]/85 border border-white/10 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00FFA3]/15 text-[#00FFA3]">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Motion & Sensor Calibration</h3>
              <p className="text-xs text-slate-400">
                Calibrate device center, adjust sensitivity, and configure sensor fusion
              </p>
            </div>
          </div>
          <button
            onClick={onOpenCalibration}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#00FFA3]/20 border border-[#00FFA3]/40 text-[#00FFA3] text-xs font-mono font-bold hover:bg-[#00FFA3]/30 transition-all"
          >
            <Crosshair size={14} />
            CALIBRATE
          </button>
        </div>

        {/* Motion ON/OFF Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Device Motion & Gyroscope</span>
            <span className="text-[11px] text-slate-400">Control parallax with physical phone tilt</span>
          </div>
          <button
            onClick={() => onUpdateSetting('motionEnabled', !preferences.motionEnabled)}
            className={`w-12 h-7 rounded-full p-1 transition-all ${
              preferences.motionEnabled ? 'bg-[#00FFA3]' : 'bg-white/10'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-black transition-transform ${
                preferences.motionEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Touch Interaction ON/OFF */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Touch & Gesture Physics</span>
            <span className="text-[11px] text-slate-400">Enable taps, drag vortex, and swipe impulses</span>
          </div>
          <button
            onClick={() => onUpdateSetting('touchInteractionEnabled', !preferences.touchInteractionEnabled)}
            className={`w-12 h-7 rounded-full p-1 transition-all ${
              preferences.touchInteractionEnabled ? 'bg-[#00F0FF]' : 'bg-white/10'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-black transition-transform ${
                preferences.touchInteractionEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Reduced Motion Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Accessibility: Reduced Motion</span>
            <span className="text-[11px] text-slate-400">Dramatically reduce camera movement and intensity</span>
          </div>
          <button
            onClick={() => onUpdateSetting('reducedMotion', !preferences.reducedMotion)}
            className={`w-12 h-7 rounded-full p-1 transition-all ${
              preferences.reducedMotion ? 'bg-purple-500' : 'bg-white/10'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-black transition-transform ${
                preferences.reducedMotion ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Parallax Sensitivity:</span>
            <span className="text-[#00FFA3] font-bold">
              {preferences.motionSensitivity.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.1"
            value={preferences.motionSensitivity}
            onChange={(e) => onUpdateSetting('motionSensitivity', parseFloat(e.target.value))}
            className="w-full accent-[#00FFA3] h-1.5 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Motion Smoothing & Damping:</span>
            <span className="text-cyan-400 font-bold">
              {(preferences.motionSmoothing * 10).toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0.02"
            max="0.25"
            step="0.01"
            value={preferences.motionSmoothing}
            onChange={(e) => onUpdateSetting('motionSmoothing', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Developer Mode & Debug Telemetry */}
      <div className="p-5 rounded-3xl bg-[#0a0f1d]/85 border border-white/10 backdrop-blur-xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
              <Terminal size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Developer Telemetry HUD</h3>
              <p className="text-xs text-slate-400">
                Display live FPS, frame latency, sensor fusion status, and physics particles
              </p>
            </div>
          </div>
          <button
            onClick={() => onUpdateSetting('developerMode', !preferences.developerMode)}
            className={`w-12 h-7 rounded-full p-1 transition-all ${
              preferences.developerMode ? 'bg-purple-500' : 'bg-white/10'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-black transition-transform ${
                preferences.developerMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Android Live Wallpaper & Diagnostics Suite */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Android Live Wallpaper Card */}
        <div className="p-5 rounded-3xl bg-[#0a0f1d]/85 border border-white/10 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Android Live Wallpaper</h3>
              <p className="text-xs text-slate-400">Native WallpaperService contract & IPC bridge</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Inspect the native Android service contract, test IPC commands, and copy the Kotlin WallpaperService bridge.
          </p>
          <button
            onClick={onOpenAndroidBridge}
            className="w-full py-2.5 px-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Smartphone size={14} />
            <span>Open Android Service Bridge</span>
          </button>
        </div>

        {/* Diagnostics Card */}
        <div className="p-5 rounded-3xl bg-[#0a0f1d]/85 border border-white/10 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF]">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Diagnostics & Telemetry</h3>
              <p className="text-xs text-slate-400">Real-time WebGL metrics & hardware audit</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            View genuine draw calls, triangles, heap memory, and copy a diagnostic report for troubleshooting.
          </p>
          <button
            onClick={onOpenDiagnostics}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] font-mono text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Activity size={14} />
            <span>Open System Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Local Data Reliability: Backup, Export & Restore */}
      <div className="p-5 rounded-3xl bg-[#0a0f1d]/85 border border-white/10 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <Download size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Local Data Backup & Recovery</h3>
              <p className="text-xs text-slate-400">
                100% offline schema-validated export and import. No cloud tracking.
              </p>
            </div>
          </div>
        </div>

        {importStatus.type !== 'idle' && (
          <div
            className={`p-3 rounded-2xl text-xs font-mono flex items-center gap-2 ${
              importStatus.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            {importStatus.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono font-bold transition-all active:scale-95"
          >
            <Download size={14} className="text-[#00F0FF]" />
            <span>Export Backup</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono font-bold transition-all active:scale-95"
          >
            <Upload size={14} className="text-[#00FFA3]" />
            <span>Import Backup</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-mono font-bold transition-all active:scale-95"
          >
            <RotateCcw size={14} />
            <span>Factory Reset</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Hardware Telemetry */}
      <div className="p-5 rounded-3xl bg-[#0a0f1d]/85 border border-white/10 backdrop-blur-xl shadow-xl space-y-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
            <Cpu size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">GPU Hardware Telemetry</h3>
            <p className="text-xs text-slate-400">Detected graphics device specifications</p>
          </div>
        </div>

        <div className="space-y-2 text-xs font-mono text-slate-300">
          <div className="flex justify-between p-2.5 rounded-xl bg-white/5">
            <span className="text-slate-400">GPU Tier:</span>
            <span className="text-[#00F0FF] font-bold">{gpuInfo.tier} PERFORMANCE</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-xl bg-white/5">
            <span className="text-slate-400">Renderer:</span>
            <span className="text-white truncate max-w-[200px] sm:max-w-xs">{gpuInfo.renderer}</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-xl bg-white/5">
            <span className="text-slate-400">WebGL Version:</span>
            <span className="text-[#00FFA3]">{gpuInfo.isWebGL2 ? 'WebGL 2.0 Enabled' : 'WebGL 1.0'}</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-xl bg-white/5">
            <span className="text-slate-400">Offline Status:</span>
            <span className="text-[#00FFA3] flex items-center gap-1 font-bold">
              <ShieldCheck size={13} />
              100% OFFLINE-FIRST (NO APIS / NO CLOUD)
            </span>
          </div>
        </div>
      </div>

      {/* Project Ownership & Architecture */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0a1226] to-[#060913] border border-[#00F0FF]/20 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#00F0FF] to-[#7000FF] text-white">
            <User size={20} />
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#00F0FF] uppercase">
              ARCHITECT & OWNER
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Amit Meena
            </h3>
            <p className="text-xs text-slate-400">
              Amit HyperWall • Ultra-Advanced 3D Living Wallpaper Engine
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs space-y-1.5 text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Terminal size={13} className="text-[#00F0FF]" />
            <span className="font-bold text-white">Engine Architecture V3:</span>
          </div>
          <p className="pl-4 text-[11px] text-slate-400 leading-relaxed">
            • 100% Procedural WebGL, Shaders & Three.js Generation<br />
            • Sensor Fusion (Orientation, Accelerometer, Gyroscope & Touch Parallax)<br />
            • Multi-Depth 3D Parallax & Zero-Allocation Particle Physics<br />
            • Universal InteractionField (Attraction, Vortex, Ripple, Impulse)<br />
            • 100% Offline • Zero API keys • Zero Firebase • Zero Cloud dependencies
          </p>
        </div>
      </div>
    </div>
  );
};
