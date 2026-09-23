import React from 'react';
import { Activity } from 'lucide-react';
import { RenderStats } from '../types/engine';

interface FpsIndicatorProps {
  stats: RenderStats;
  compact?: boolean;
}

export const FpsIndicator: React.FC<FpsIndicatorProps> = ({ stats, compact = false }) => {
  const fps = stats.fps || 60;
  const fpsColor =
    fps >= 50
      ? 'text-[#00FFA3] border-[#00FFA3]/30 bg-[#00FFA3]/10'
      : fps >= 30
      ? 'text-[#FFB800] border-[#FFB800]/30 bg-[#FFB800]/10'
      : 'text-[#FF3366] border-[#FF3366]/30 bg-[#FF3366]/10';

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md text-xs font-mono font-medium ${fpsColor}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        <span>{fps} FPS</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#0a0f1d]/85 border border-white/10 backdrop-blur-lg shadow-lg font-mono text-xs text-slate-300">
      <div className="flex items-center gap-1.5">
        <Activity size={13} className="text-[#00F0FF]" />
        <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${fpsColor}`}>
          {fps} FPS
        </span>
      </div>
      <div className="h-3 w-px bg-white/10" />
      <span className="text-[11px] text-slate-400">
        {stats.frameTime.toFixed(1)}ms
      </span>
      {stats.particleCount > 0 && (
        <>
          <div className="h-3 w-px bg-white/10" />
          <span className="text-[11px] text-slate-400">
            {stats.particleCount.toLocaleString()} pts
          </span>
        </>
      )}
    </div>
  );
};
