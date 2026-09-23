import React, { useState } from 'react';
import { WallpaperMetadata } from '../types/wallpaper';
import { QualityProfile, RenderStats } from '../types/engine';
import { FpsIndicator } from './FpsIndicator';
import { QualityBadge } from './QualityBadge';
import { Play, Pause, Heart, Info, X, Maximize2, Minimize2, Sparkles } from 'lucide-react';

interface PreviewOverlayProps {
  wallpaper: WallpaperMetadata;
  isPaused: boolean;
  quality: QualityProfile;
  stats: RenderStats;
  isFavorite: boolean;
  onTogglePause: () => void;
  onSelectQuality: (q: QualityProfile) => void;
  onToggleFavorite: () => void;
  onClose: () => void;
}

export const PreviewOverlay: React.FC<PreviewOverlayProps> = ({
  wallpaper,
  isPaused,
  quality,
  stats,
  isFavorite,
  onTogglePause,
  onSelectQuality,
  onToggleFavorite,
  onClose
}) => {
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // When in true immersive mode, hide all HUD overlays except a subtle floating exit pill
  if (immersiveMode) {
    return (
      <div className="fixed inset-0 z-50 pointer-events-none">
        <button
          onClick={() => setImmersiveMode(false)}
          className="pointer-events-auto absolute top-5 right-5 p-2.5 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md hover:bg-black/80 transition-all shadow-xl"
          title="Exit Immersive Mode"
        >
          <Minimize2 size={18} />
        </button>

        {/* Minimal Bottom Floating FPS */}
        <div className="absolute bottom-5 left-5 pointer-events-auto">
          <FpsIndicator stats={stats} compact />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-6 pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/80 backdrop-blur-[2px]">
      {/* Top Bar HUD */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-[#0a0f1d]/85 border border-white/10 text-white hover:bg-white/10 backdrop-blur-lg active:scale-95 transition-all shadow-lg"
            title="Back to Engine"
          >
            <X size={18} />
          </button>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white font-['Orbitron'] tracking-wide">
              {wallpaper.title}
            </h2>
            <p className="text-xs text-[#00F0FF] font-mono">
              {wallpaper.category} • Procedural 3D
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FpsIndicator stats={stats} />
          <button
            onClick={() => setImmersiveMode(true)}
            className="p-2.5 rounded-xl bg-[#0a0f1d]/85 border border-white/10 text-white hover:bg-[#00F0FF]/20 hover:border-[#00F0FF]/40 backdrop-blur-lg active:scale-95 transition-all shadow-lg"
            title="Enter Full Immersive Mode"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      {/* Info Modal Dialog if open */}
      {showInfo && (
        <div className="pointer-events-auto self-center max-w-sm w-full p-4 rounded-2xl bg-[#0a0f1d]/95 border border-white/15 backdrop-blur-xl shadow-2xl text-slate-200 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-mono text-[#00F0FF] font-bold">WALLPAPER TELEMETRY</span>
            <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <h3 className="text-base font-bold text-white mb-1">{wallpaper.title}</h3>
          <p className="text-xs text-slate-300 mb-3">{wallpaper.description}</p>
          <div className="space-y-1.5 text-xs font-mono text-slate-400 border-t border-white/10 pt-2">
            <div className="flex justify-between">
              <span>Author:</span>
              <span className="text-white font-bold">{wallpaper.author}</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="text-[#00FFA3] uppercase">{wallpaper.proceduralType}</span>
            </div>
            <div className="flex justify-between">
              <span>Offline Ready:</span>
              <span className="text-[#00F0FF]">100% Procedural WebGL</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Control Deck */}
      <div className="pointer-events-auto flex flex-col gap-3 max-w-xl mx-auto w-full">
        {/* Quality selector pill bar */}
        <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-[#0a0f1d]/80 border border-white/10 backdrop-blur-xl shadow-xl">
          <span className="text-xs font-mono text-slate-400 font-semibold">Engine Quality</span>
          <QualityBadge quality={quality} onChange={onSelectQuality} interactive />
        </div>

        {/* Main Action Deck */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#05070e]/90 border border-white/15 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePause}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                isPaused
                  ? 'bg-[#00FFA3] text-black shadow-[0_0_15px_rgba(0,255,163,0.4)]'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} />}
              <span>{isPaused ? 'Resume 3D' : 'Pause 3D'}</span>
            </button>

            <button
              onClick={onToggleFavorite}
              className={`p-2.5 rounded-xl border transition-all ${
                isFavorite
                  ? 'text-pink-500 border-pink-500/40 bg-pink-500/15 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                  : 'text-slate-400 border-white/10 hover:text-white hover:bg-white/5'
              }`}
              title="Toggle Favorite"
            >
              <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              title="Information"
            >
              <Info size={18} />
            </button>

            <button
              onClick={() => setImmersiveMode(true)}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#7000FF] text-white font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.3)] active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>Full Screen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
