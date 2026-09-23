import React from 'react';
import { FusionDNA } from '../infinite/types/infiniteTypes';
import { Heart, Play, Sparkles, Globe, CloudRain, Dna, Gauge } from 'lucide-react';

interface WorldCardProps {
  world: FusionDNA;
  isActive: boolean;
  isFavorite: boolean;
  qualityProfile?: string;
  onApply: (world: FusionDNA) => void;
  onToggleFavorite: (id: string) => void;
  onOpenPortal?: (world: FusionDNA) => void;
  onInspectFusion?: (world: FusionDNA) => void;
}

export const WorldCard: React.FC<WorldCardProps> = ({
  world,
  isActive,
  isFavorite,
  qualityProfile = 'HIGH',
  onApply,
  onToggleFavorite,
  onOpenPortal,
  onInspectFusion
}) => {
  return (
    <div
      className={`group relative rounded-2xl p-4 transition-all duration-300 border flex flex-col justify-between overflow-hidden ${
        isActive
          ? 'bg-[#0f172a]/95 border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.25)]'
          : 'bg-[#0c1222]/80 hover:bg-[#111a30]/90 border-white/10 hover:border-white/20'
      }`}
    >
      {/* Decorative colored glow corner */}
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none transition-all group-hover:opacity-50"
        style={{ backgroundColor: world.accentColor }}
      />

      <div className="space-y-3 relative z-10">
        {/* Header: Title & Favorite */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
                style={{ backgroundColor: world.accentColor }}
              />
              <h3 className="font-['Orbitron'] text-sm font-bold text-white tracking-wide truncate max-w-[170px] sm:max-w-[200px]">
                {world.name}
              </h3>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              SEED: #{world.baseWorldSeed}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(world.id);
            }}
            className={`p-2 rounded-xl transition-all ${
              isFavorite
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
            title="Toggle Favorite"
          >
            <Heart size={14} className={isFavorite ? 'fill-current' : ''} />
          </button>
        </div>

        {/* Metadata Grid (Seed, Environment, Weather, Ecosystem, Quality) */}
        <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/30 p-2.5 rounded-xl border border-white/5">
          {/* Environment */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-slate-400 text-[9px] uppercase tracking-wider font-semibold">
              <Globe size={10} className="text-[#00F0FF]" />
              Environment
            </div>
            <p className="text-white capitalize font-medium truncate">
              {world.primarySystem} × {world.secondarySystem}
            </p>
          </div>

          {/* Weather */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-slate-400 text-[9px] uppercase tracking-wider font-semibold">
              <CloudRain size={10} className="text-indigo-400" />
              Weather
            </div>
            <p className="text-white capitalize font-medium truncate">
              {world.weatherType}
            </p>
          </div>

          {/* Ecosystem */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-slate-400 text-[9px] uppercase tracking-wider font-semibold">
              <Dna size={10} className="text-emerald-400" />
              Ecosystem
            </div>
            <p className="text-white capitalize font-medium truncate">
              {world.allowedEntities.length} Lifeforms
            </p>
          </div>

          {/* Quality */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-slate-400 text-[9px] uppercase tracking-wider font-semibold">
              <Gauge size={10} className="text-amber-400" />
              Quality
            </div>
            <p className="text-amber-300 font-bold uppercase tracking-wider text-[10px]">
              {qualityProfile}
            </p>
          </div>
        </div>

        {/* Allowed entities badges preview */}
        <div className="flex flex-wrap gap-1">
          {world.allowedEntities.slice(0, 3).map((ent) => (
            <span
              key={ent}
              className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5 capitalize"
            >
              {ent.replace('-', ' ')}
            </span>
          ))}
          {world.allowedEntities.length > 3 && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-white/5 text-slate-500">
              +{world.allowedEntities.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-2">
        <button
          onClick={() => onApply(world)}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold tracking-wider font-['Orbitron'] flex items-center justify-center gap-1.5 transition-all ${
            isActive
              ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-white/10 hover:bg-[#00F0FF]/20 text-white hover:text-[#00F0FF] border border-white/10 hover:border-[#00F0FF]/40'
          }`}
        >
          <Play size={12} className={isActive ? 'fill-current' : ''} />
          {isActive ? 'ACTIVE WORLD' : 'ENTER WORLD'}
        </button>

        {onInspectFusion && (
          <button
            onClick={() => onInspectFusion(world)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all"
            title="Inspect in Fusion Lab"
          >
            <Sparkles size={13} />
          </button>
        )}
      </div>
    </div>
  );
};
