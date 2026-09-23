import React, { useState, useEffect } from 'react';
import { X, Activity, Copy, Check, Cpu, Zap, HardDrive, ShieldCheck, Layers, Gauge } from 'lucide-react';
import { DiagnosticManager } from '../../diagnostics/DiagnosticManager';
import { DiagnosticsSnapshot } from '../../diagnostics/types';

interface AdvancedDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvancedDiagnosticsModal: React.FC<AdvancedDiagnosticsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [snapshot, setSnapshot] = useState<DiagnosticsSnapshot>(() =>
    DiagnosticManager.getInstance().getSnapshot()
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Refresh telemetry at 1Hz
    const interval = setInterval(() => {
      setSnapshot(DiagnosticManager.getInstance().getSnapshot());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyDiagnostics = async () => {
    const report = DiagnosticManager.getInstance().formatDiagnosticsReport();
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-3xl bg-[#080d1a] border border-white/10 shadow-2xl p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Orbitron'] tracking-wide">
                SYSTEM DIAGNOSTICS & TELEMETRY
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Genuine hardware metrics • WebGL pipeline telemetry • Zero mock statistics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Real-time Metric Cards Grid */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Performance Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Gauge size={12} className="text-[#00FFA3]" /> REALTIME FPS
              </span>
              <div className="text-xl font-black font-mono text-[#00FFA3]">
                {snapshot.fps} <span className="text-xs text-slate-500">FPS</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Activity size={12} className="text-[#00F0FF]" /> FRAME TIME
              </span>
              <div className="text-xl font-black font-mono text-[#00F0FF]">
                {snapshot.frameTime} <span className="text-xs text-slate-500">ms</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Layers size={12} className="text-[#FF007F]" /> DRAW CALLS
              </span>
              <div className="text-xl font-black font-mono text-[#FF007F]">
                {snapshot.drawCalls}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Zap size={12} className="text-amber-400" /> POWER MODE
              </span>
              <div className="text-sm font-bold font-mono text-amber-400 mt-1 truncate">
                {snapshot.powerMode}
              </div>
            </div>
          </div>

          {/* Graphics & WebGL Details */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wider">
              <Cpu size={14} className="text-[#00F0FF]" />
              <span>Graphics & WebGL Architecture</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs font-mono">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">WebGL Version:</span>
                <span className="text-slate-200 font-bold">{snapshot.webglVersion}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">GPU Hardware Tier:</span>
                <span className="text-[#00FFA3] font-bold">{snapshot.gpuTier}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Unmasked Renderer:</span>
                <span className="text-slate-200 truncate max-w-[200px]" title={snapshot.unmaskedRenderer}>
                  {snapshot.unmaskedRenderer || 'Standard WebGL Renderer'}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Max Texture Size:</span>
                <span className="text-slate-200 font-bold">{snapshot.maxTextureSize}px</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Max Vertex Uniforms:</span>
                <span className="text-slate-200">{snapshot.maxVertexUniforms}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Max Fragment Uniforms:</span>
                <span className="text-slate-200">{snapshot.maxFragmentUniforms}</span>
              </div>
            </div>
          </div>

          {/* Scene Complexity */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wider">
              <HardDrive size={14} className="text-[#7000FF]" />
              <span>Scene Complexity & Memory</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs font-mono">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Active Wallpaper:</span>
                <span className="text-slate-200 font-bold truncate max-w-[180px]">{snapshot.activeWallpaperId}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Quality Profile:</span>
                <span className="text-[#00F0FF] font-bold">{snapshot.qualityProfile}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Active Particles:</span>
                <span className="text-slate-200 font-bold">{snapshot.particleCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Geometry Triangles:</span>
                <span className="text-slate-200 font-bold">{snapshot.triangles.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">JS Memory API:</span>
                <span className="text-slate-300">
                  {snapshot.memory.isAvailable
                    ? `${snapshot.memory.usedJSHeapSizeMB} MB / ${snapshot.memory.totalJSHeapSizeMB} MB`
                    : 'Protected by browser policy'}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Document Visible:</span>
                <span className={snapshot.isDocumentVisible ? 'text-[#00FFA3]' : 'text-amber-400'}>
                  {snapshot.isDocumentVisible ? 'Active (Foreground)' : 'Hidden (Render Paused)'}
                </span>
              </div>
            </div>
          </div>

          {/* Sensors & Audio Readiness */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wider">
              <ShieldCheck size={14} className="text-[#00FFA3]" />
              <span>Peripheral Availability</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Gyro/Accelerometer:</span>
                <span className={snapshot.isMotionSensorAvailable ? 'text-[#00FFA3] font-bold' : 'text-slate-500'}>
                  {snapshot.isMotionSensorAvailable ? 'Active' : 'Pointer Fallback'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Audio Reactive API:</span>
                <span className={snapshot.isAudioReactiveAvailable ? 'text-[#00FFA3] font-bold' : 'text-slate-500'}>
                  {snapshot.isAudioReactiveAvailable ? 'Ready' : 'Idle'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="text-[11px] font-mono text-slate-500">
            Amit HyperWall • Owner: Amit Meena
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDiagnostics}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-mono font-bold transition-all active:scale-95"
            >
              {copied ? <Check size={14} className="text-[#00FFA3]" /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Diagnostics'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
