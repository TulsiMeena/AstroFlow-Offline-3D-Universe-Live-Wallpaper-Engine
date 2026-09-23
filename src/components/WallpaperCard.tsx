import React from 'react';
import { WallpaperMetadata } from '../types/wallpaper';
import { Heart, Play, Sparkles, Layers } from 'lucide-react';

interface WallpaperCardProps {
  wallpaper: WallpaperMetadata;
  isActive: boolean;
  isFavorite: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenPreview: (id: string) => void;
}

export const WallpaperCard: React.FC<WallpaperCardProps> = ({
  wallpaper,
  isActive,
  isFavorite,
  onSelect,
  onToggleFavorite,
  onOpenPreview
}) => {
  return (
    <div
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 border ${
        isActive
          ? 'border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.25)] bg-gradient-to-b from-[#0e1628] to-[#070b14]'
          : 'border-white/10 hover:border-white/20 bg-[#080d1a]/80'
      } backdrop-blur-md p-4 flex flex-col justify-between`}
    >
      {/* Top Banner & Category */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: wallpaper.accentColor, boxShadow: `0 0 8px ${wallpaper.accentColor}` }}
          />
          <span className="text-[11px] font-mono tracking-wider text-slate-300 uppercase">
            {wallpaper.category}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(wallpaper.id);
          }}
          className={`p-1.5 rounded-xl border transition-all ${
            isFavorite
              ? 'text-pink-500 border-pink-500/40 bg-pink-500/10'
              : 'text-slate-400 border-white/5 hover:text-white hover:border-white/20'
          }`}
          title="Toggle Favorite"
        >
          <Heart size={15} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Abstract Procedural Preview Visual Badge */}
      <div
        onClick={() => onOpenPreview(wallpaper.id)}
        className="relative w-full h-32 rounded-xl mb-3 cursor-pointer overflow-hidden border border-white/5 flex items-center justify-center group-hover:border-white/20 transition-all"
        style={{
          background: `radial-gradient(circle at center, ${wallpaper.accentColor}25 0%, ${wallpaper.secondaryColor}15 60%, #05070e 100%)`
        }}
      >
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:16px_16px]" />

        {/* Ambient Ring Glow */}
        <div
          className="absolute w-20 h-20 rounded-full blur-xl opacity-60 transition-transform group-hover:scale-125"
          style={{ backgroundColor: wallpaper.accentColor }}
        />

        <div className="relative z-10 flex flex-col items-center gap-1.5 text-center px-2">
          <div className="p-2.5 rounded-full bg-black/40 border border-white/20 text-white backdrop-blur-md group-hover:scale-110 transition-transform shadow-lg">
            <Play size={18} className="text-white fill-white ml-0.5" />
          </div>
          <span className="text-[10px] font-mono tracking-wide text-slate-300 uppercase">
            Tap to Launch
          </span>
        </div>

        {isActive && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/50 text-[#00F0FF] text-[9px] font-mono font-bold">
            ACTIVE
          </div>
        )}

        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[9px] font-mono text-slate-400 flex items-center gap-1">
          <Layers size={10} />
          <span>{wallpaper.proceduralType}</span>
        </div>
      </div>

      {/* Content Info */}
      <div>
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
          {wallpaper.title}
        </h3>
        <p className="text-xs text-[#00F0FF] font-medium mb-1.5">
          {wallpaper.subtitle}
        </p>
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
          {wallpaper.description}
        </p>
      </div>

      {/* Tags & Action Buttons */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {wallpaper.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSelect(wallpaper.id)}
            disabled={isActive}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? 'bg-white/10 text-slate-400 cursor-default'
                : 'bg-gradient-to-r from-[#00F0FF] to-[#00A3FF] text-[#05070e] font-bold hover:shadow-[0_0_12px_rgba(0,240,255,0.4)] active:scale-95'
            }`}
          >
            {isActive ? 'Current' : 'Set Engine'}
          </button>
        </div>
      </div>
    </div>
  );
};
