import React from 'react';
import { RenderStats, QualityProfile, MotionData } from '../types/engine';
import { Activity, Cpu, Gauge, Smartphone, Radio, Zap } from 'lucide-react';

interface DeveloperTelemetryHUDProps {
  stats: RenderStats;
  quality: QualityProfile;
  motionData: MotionData;
  visible: boolean;
  physicsObjectCount?: number;
}

export const DeveloperTelemetryHUD: React.FC<DeveloperTelemetryHUDProps> = ({
  stats,
  quality,
  motionData,
  visible,
  physicsObjectCount = 0
}) => {
  if (!visible) return null;

  return (
    <div className="fixed top-16 left-3 z-40 p-3.5 rounded-2xl bg-black/85 border border-cyan-500/30 text-white font-mono text-[11px] backdrop-blur-xl shadow-2xl pointer-events-none space-y-2 max-w-[240px] select-none">
      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <Activity size={14} className="animate-pulse" />
          <span>DEBUG TELEMETRY</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
          DEV
        </span>
      </div>

      <div className="space-y-1 text-slate-300">
        <div className="flex justify-between">
          <span className="text-slate-500">FPS:</span>
          <span className={`font-bold ${stats.fps >= 55 ? 'text-emerald-400' : stats.fps >= 30 ? 'text-amber-400' : 'text-rose-400'}`}>
            {stats.fps} FPS
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Frame Time:</span>
          <span className="text-cyan-300 font-semibold">{stats.frameTime.toFixed(1)} ms</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Quality Level:</span>
          <span className="text-purple-400 font-bold">{quality}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Active Particles:</span>
          <span className="text-white">{stats.particleCount.toLocaleString()}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Draw Calls:</span>
          <span className="text-slate-300">{stats.drawCalls}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Physics Sources:</span>
          <span className="text-cyan-300">{physicsObjectCount}</span>
        </div>

        <div className="pt-1 border-t border-white/10 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Hardware Motion:</span>
            <span className={motionData.isAvailable ? 'text-emerald-400' : 'text-slate-500'}>
              {motionData.isAvailable ? 'AVAILABLE' : 'OFFLINE'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Gyroscope:</span>
            <span className={motionData.gyroscopeAvailable ? 'text-emerald-400' : 'text-slate-500'}>
              {motionData.gyroscopeAvailable ? 'YES' : 'NO'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Accelerometer:</span>
            <span className={motionData.accelerometerAvailable ? 'text-emerald-400' : 'text-slate-500'}>
              {motionData.accelerometerAvailable ? 'YES' : 'NO'}
            </span>
          </div>

          {motionData.lastMotionEvent && (
            <div className="flex justify-between text-amber-400 font-bold animate-pulse">
              <span>Event:</span>
              <span>{motionData.lastMotionEvent}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
