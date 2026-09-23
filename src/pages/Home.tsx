import React from 'react';
import { WallpaperMetadata } from '../types/wallpaper';
import { QualityProfile, RenderStats } from '../types/engine';
import { WallpaperCard } from '../components/WallpaperCard';
import { FpsIndicator } from '../components/FpsIndicator';
import { QualityBadge } from '../components/QualityBadge';
import { Sparkles, Cpu, ShieldCheck, Zap, Maximize2, Clock } from 'lucide-react';

interface HomeProps {
  wallpapers: WallpaperMetadata[];
  activeId: string;
  quality: QualityProfile;
  stats: RenderStats;
  gpuTier: string;
  isFavorite: (id: string) => boolean;
  onSelectWallpaper: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenPreview: (id: string) => void;
  onNavigateExplore: () => void;
  onNavigateScheduler?: () => void;
  onNavigateLibrary?: () => void;
  onNavigatePersonal?: () => void;
  onNavigateDesigner?: () => void;
  onNavigateLab?: () => void;
  onNavigateEnvironments?: () => void;
  onNavigatePhysics?: () => void;
  onNavigateCinematic?: () => void;
  onNavigateAudio?: () => void;
}

export const Home: React.FC<HomeProps> = ({
  wallpapers,
  activeId,
  quality,
  stats,
  gpuTier,
  isFavorite,
  onSelectWallpaper,
  onToggleFavorite,
  onOpenPreview,
  onNavigateExplore,
  onNavigateScheduler,
  onNavigateLibrary,
  onNavigatePersonal,
  onNavigateDesigner,
  onNavigateLab,
  onNavigateEnvironments,
  onNavigatePhysics,
  onNavigateCinematic,
  onNavigateAudio
}) => {
  const activeWallpaper = wallpapers.find((w) => w.id === activeId) || wallpapers[0];

  return (
    <div className="w-full h-full overflow-y-auto pt-16 pb-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
      {/* Hero 3D Showcase Card */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0c1426]/90 via-[#060913]/90 to-[#0c0d1e]/90 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Glow backdrop */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: activeWallpaper?.accentColor || '#00F0FF' }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
              <span>LIVE ACTIVE ENGINE</span>
              <span className="text-white/30">•</span>
              <span className="text-[#00F0FF]">{gpuTier} GPU DETECTED</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black font-['Orbitron'] tracking-tight text-white">
              {activeWallpaper?.title}
            </h2>

            <p className="text-sm text-[#00F0FF] font-medium tracking-wide">
              {activeWallpaper?.subtitle}
            </p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {activeWallpaper?.description}
            </p>

            {/* Live Metrics Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <FpsIndicator stats={stats} />
              <QualityBadge quality={quality} />
            </div>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={() => onOpenPreview(activeId)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#00F0FF] via-[#00A3FF] to-[#7000FF] text-white font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] active:scale-95 transition-all"
            >
              <Maximize2 size={16} />
              <span>Full Preview</span>
            </button>

            <button
              onClick={onNavigateExplore}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/15 text-slate-200 font-semibold text-sm hover:bg-white/10 active:scale-95 transition-all"
            >
              <Sparkles size={16} className="text-[#00FFA3]" />
              <span>Explore All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Engine Specs Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#080d1a]/80 border border-white/5 backdrop-blur-md flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#00F0FF]/10 text-[#00F0FF]">
            <Cpu size={18} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400">PIPELINE</div>
            <div className="text-xs font-bold text-white">Three.js WebGL</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#080d1a]/80 border border-white/5 backdrop-blur-md flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#00FFA3]/10 text-[#00FFA3]">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400">NETWORK</div>
            <div className="text-xs font-bold text-[#00FFA3]">100% Offline</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#080d1a]/80 border border-white/5 backdrop-blur-md flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FF007F]/10 text-[#FF007F]">
            <Zap size={18} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400">TARGET</div>
            <div className="text-xs font-bold text-white">60 FPS Smooth</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#080d1a]/80 border border-white/5 backdrop-blur-md flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#7000FF]/10 text-[#7000FF]">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400">CATALOG</div>
            <div className="text-xs font-bold text-white">{wallpapers.length} Procedural</div>
          </div>
        </div>
      </div>

      {/* Local Wallpaper Library & Marketplace Banner */}
      {onNavigateLibrary && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-emerald-950/40 border border-[#00F0FF]/40 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-[0_0_35px_rgba(0,240,255,0.2)]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00FFA3] text-black text-[10px] font-mono font-bold tracking-wider">
                100% OFFLINE MARKETPLACE
              </span>
              <span className="text-[11px] text-[#00F0FF] font-mono font-semibold">Local Wallpaper Discovery Hub</span>
            </div>
            <h3 className="text-lg font-bold text-white font-['Orbitron'] tracking-wide flex items-center gap-2">
              WALLPAPER LIBRARY & DISCOVERY
            </h3>
            <p className="text-xs text-slate-200 max-w-xl leading-relaxed">
              Browse 10 procedural categories, search by keywords, filter by battery draw and physics, curate personal collections, inspect live 3D specs, and safely import/export procedural World Codes.
            </p>
          </div>
          <button
            onClick={onNavigateLibrary}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#00F0FF] hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] shrink-0"
          >
            <span>Open Library</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Smart Wallpaper Scheduler & Context Automation Engine Banner */}
      {onNavigateScheduler && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#00FFA3]/20 via-[#00F0FF]/25 to-[#7000FF]/20 border border-[#00FFA3]/50 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-[0_0_35px_rgba(0,255,163,0.2)]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00FFA3] text-black text-[10px] font-mono font-bold tracking-wider">
                SMART SCHEDULER
              </span>
              <span className="text-[11px] text-[#00FFA3] font-mono font-semibold">24-Hour Context Automation</span>
            </div>
            <h3 className="text-lg font-bold text-white font-['Orbitron'] tracking-wide flex items-center gap-2">
              LOCAL SMART SCHEDULER & CONTEXT ENGINE
            </h3>
            <p className="text-xs text-slate-200 max-w-xl leading-relaxed">
              Automate procedural 3D wallpaper transitions across a 24-hour visual timeline. Context-aware rules for battery level, power state, day of week, and custom packs with smooth crossfades and zero cloud dependence.
            </p>
          </div>
          <button
            onClick={onNavigateScheduler}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#00FFA3] hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,163,0.4)] shrink-0"
          >
            <Clock size={16} />
            <span>Launch Scheduler</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Personal 3D Universe Generator Banner */}
      {onNavigatePersonal && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#00F0FF]/20 via-[#7000FF]/25 to-[#FF007F]/20 border border-[#00F0FF]/50 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-[0_0_35px_rgba(0,240,255,0.25)]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00F0FF] text-black text-[10px] font-mono font-bold tracking-wider">
                PERSONAL 3D UNIVERSE
              </span>
              <span className="text-[11px] text-[#00F0FF] font-mono font-semibold">100% Offline Procedural Generator</span>
            </div>
            <h3 className="text-lg font-bold text-white font-['Orbitron'] tracking-wide flex items-center gap-2">
              PERSONAL 3D UNIVERSE GENERATOR
            </h3>
            <p className="text-xs text-slate-200 max-w-xl leading-relaxed">
              Create completely new procedural 3D worlds from simple choices (Space, Ocean, Forest, Cyber City, Volcano, Crystal) or optional text descriptions. Deterministic seed reproducibility, live 4-way variations, direction shifts, and instant 3D wallpaper preview.
            </p>
          </div>
          <button
            onClick={onNavigatePersonal}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#7000FF] hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] shrink-0"
          >
            <Sparkles size={15} />
            <span>CREATE MY WORLD</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* NEW: Wallpaper Fusion Lab & Procedural Designer Banner */}
      {onNavigateDesigner && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#00F0FF]/15 via-[#7000FF]/20 to-[#00FFA3]/15 border border-[#00F0FF]/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#00F0FF] to-[#7000FF] text-black text-[10px] font-mono font-bold tracking-wider">
                MODULE 5 • FUSION LAB
              </span>
              <span className="text-[11px] text-[#00FFA3] font-mono font-semibold">10-Layer Procedural Composer</span>
            </div>
            <h3 className="text-lg font-bold text-white font-['Orbitron'] tracking-wide flex items-center gap-2">
              WALLPAPER FUSION LAB & PROCEDURAL DESIGNER
            </h3>
            <p className="text-xs text-slate-200 max-w-xl leading-relaxed">
              Visually create completely new procedural 3D wallpapers by fusing 22 elemental systems: Galaxy + Aurora, Ocean + Space, Cyber City + Rain, Volcano + Snow. Independent layer compositing, OLED palettes, procedural materials, physics, audio harmonics, and local deterministic DesignDNA.
            </p>
          </div>
          <button
            onClick={onNavigateDesigner}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#00F0FF] via-[#00FFA3] to-[#7000FF] hover:opacity-95 text-black font-extrabold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] shrink-0"
          >
            <span>Launch Fusion Lab</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Procedural 3D Environment Engine Banner */}
      {onNavigateEnvironments && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-[#00FFA3]/10 via-[#00F0FF]/15 to-[#7000FF]/15 border border-[#00FFA3]/30 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(0,255,163,0.15)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#00FFA3]/20 text-[#00FFA3] text-[10px] font-mono font-bold">
                NEW 3D ENVIRONMENT ENGINE
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Procedural WebGL Worlds</span>
            </div>
            <h3 className="text-base font-bold text-white font-['Orbitron'] tracking-wide">
              LIVING 3D ENVIRONMENTS & BIOME MIXER
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Explore 40+ procedural biomes across Nature, Weather, Elements, Futuristic, and Fantasy. Blend any worlds together with the live Biome Mixer.
            </p>
          </div>
          <button
            onClick={onNavigateEnvironments}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#00FFA3] hover:bg-[#00e08f] text-black font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,163,0.3)] shrink-0"
          >
            <span>Explore Worlds</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Universe Lab Feature Banner */}
      {onNavigateLab && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-[#00F0FF]/10 via-[#7000FF]/15 to-[#FF007F]/10 border border-[#00F0FF]/30 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] text-[10px] font-mono font-bold">
                NEW GENERATION ENGINE
              </span>
              <span className="text-[11px] text-slate-400 font-mono">100% Deterministic Seed PRNG</span>
            </div>
            <h3 className="text-base font-bold text-white font-['Orbitron'] tracking-wide">
              PROCEDURAL UNIVERSE LAB
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Design complete custom 3D cosmos with real-time WorldDNA: galaxies, planetary orbits, black holes, volumetric nebulae, and gravitational physics.
            </p>
          </div>
          <button
            onClick={onNavigateLab}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#00F0FF] hover:bg-[#00d4ff] text-black font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] shrink-0"
          >
            <span>Open Universe Lab</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Cinematic Camera & Visual Effects Spotlight Banner */}
      {onNavigateCinematic && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-[#D946EF]/10 via-[#7000FF]/15 to-[#00F0FF]/10 border border-[#D946EF]/30 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(217,70,239,0.15)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#D946EF]/20 text-[#D946EF] text-[10px] font-mono font-bold">
                NEW CINEMATIC ENGINE
              </span>
              <span className="text-[11px] text-slate-400 font-mono">10 Modes • Multi-Pass Shaders</span>
            </div>
            <h3 className="text-base font-bold text-white font-['Orbitron'] tracking-wide">
              CINEMATIC CAMERA & VISUAL EFFECTS
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Experience dynamic camera director modes, Catmull-Rom drone sweeps, trauma camera shake, parallax depth separation, bloom glow, and custom color grading.
            </p>
          </div>
          <button
            onClick={onNavigateCinematic}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#D946EF] hover:bg-[#c026d3] text-white font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_15px_rgba(217,70,239,0.3)] shrink-0"
          >
            <span>Open Cinematic Lab</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Audio Reactive & Generative Sound Engine Banner */}
      {onNavigateAudio && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-[#00F0FF]/15 via-[#00FFA3]/15 to-[#D946EF]/15 border border-[#00F0FF]/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(0,240,255,0.18)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] text-[10px] font-mono font-bold">
                NEW AUDIO ENGINE
              </span>
              <span className="text-[11px] text-slate-400 font-mono">100% Offline • Web Audio Synthesis</span>
            </div>
            <h3 className="text-base font-bold text-white font-['Orbitron'] tracking-wide">
              AUDIO REACTIVE VISUALS & GENERATIVE AMBIENCE
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Real-time frequency analysis (sub-bass, mid, treble & beat detection) driving 3D physics, particles, and environments, plus 9 procedural ambient sound synthesizers.
            </p>
          </div>
          <button
            onClick={onNavigateAudio}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#00F0FF] hover:bg-[#00d4ff] text-black font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_15px_rgba(0,240,255,0.35)] shrink-0"
          >
            <span>Open Audio Lab</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Featured Wallpapers Carousel / Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Living Wallpapers
            </h3>
            <p className="text-xs text-slate-400">
              Procedurally generated locally with real-time physics and light simulation
            </p>
          </div>
          <button
            onClick={onNavigateExplore}
            className="text-xs font-mono text-[#00F0FF] hover:underline"
          >
            View All ({wallpapers.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallpapers.map((wp) => (
            <WallpaperCard
              key={wp.id}
              wallpaper={wp}
              isActive={wp.id === activeId}
              isFavorite={isFavorite(wp.id)}
              onSelect={onSelectWallpaper}
              onToggleFavorite={onToggleFavorite}
              onOpenPreview={onOpenPreview}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
