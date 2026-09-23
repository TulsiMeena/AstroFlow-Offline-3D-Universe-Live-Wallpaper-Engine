import React, { useState, useMemo } from 'react';
import { WallpaperMetadata } from '../types/wallpaper';
import { WallpaperCard } from '../components/WallpaperCard';
import { WorldCard } from '../components/WorldCard';
import {
  FusionDNA,
  FusionSystemType,
  PortalType,
  WorldTransitionType,
  ZoomScaleLevel
} from '../infinite/types/infiniteTypes';
import { FusionDNAFactory } from '../infinite/dna/FusionDNA';
import { FusionStorage } from '../infinite/storage/FusionStorage';
import {
  Search,
  Filter,
  Sparkles,
  Globe,
  Shuffle,
  DoorOpen,
  ZoomIn,
  BookmarkPlus,
  Compass,
  Layers,
  Cpu,
  ChevronRight,
  Sliders,
  Check,
  Zap,
  Activity,
  Maximize2
} from 'lucide-react';

interface ExploreProps {
  wallpapers: WallpaperMetadata[];
  activeId: string;
  isFavorite: (id: string) => boolean;
  onSelectWallpaper: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenPreview: (id: string) => void;
  onApplyFusedWorld?: (world: FusionDNA) => void;
  qualityProfile?: string;
}

type ExplorerSection = 'explore' | 'fusion-lab' | 'infinite-world' | 'portals' | 'saved-worlds';

export const Explore: React.FC<ExploreProps> = ({
  wallpapers,
  activeId,
  isFavorite,
  onSelectWallpaper,
  onToggleFavorite,
  onOpenPreview,
  onApplyFusedWorld,
  qualityProfile = 'HIGH'
}) => {
  // Navigation Tabs
  const [activeSection, setActiveSection] = useState<ExplorerSection>('explore');

  // Search & Filtering
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Saved Fused Worlds State
  const [fusedWorlds, setFusedWorlds] = useState<FusionDNA[]>(() =>
    FusionStorage.getAllSavedWorlds()
  );
  const [favFilterOnly, setFavFilterOnly] = useState<boolean>(false);

  // Status Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // --- FUSION LAB STATE ---
  const allSystems: FusionSystemType[] = [
    'ocean',
    'aurora',
    'galaxy',
    'black-hole',
    'forest',
    'cyber-city',
    'volcano',
    'crystal',
    'mountain',
    'snow',
    'desert',
    'space',
    'floating-islands',
    'fantasy',
    'underwater'
  ];

  const [primarySystem, setPrimarySystem] = useState<FusionSystemType>('ocean');
  const [secondarySystem, setSecondarySystem] = useState<FusionSystemType>('aurora');
  const [fusionAmount, setFusionAmount] = useState<number>(0.5);
  const [terrainBlend, setTerrainBlend] = useState<number>(0.5);
  const [atmosphereBlend, setAtmosphereBlend] = useState<number>(0.5);
  const [weatherBlend, setWeatherBlend] = useState<number>(0.5);
  const [lightingBlend, setLightingBlend] = useState<number>(0.5);
  const [particleBlend, setParticleBlend] = useState<number>(0.5);
  const [physicsBlend, setPhysicsBlend] = useState<number>(0.5);
  const [ecosystemBlend, setEcosystemBlend] = useState<number>(0.5);
  const [eventBlend, setEventBlend] = useState<number>(0.5);
  const [customSeed, setCustomSeed] = useState<number>(777);

  // --- PORTALS TERMINAL STATE ---
  const [portalType, setPortalType] = useState<PortalType>('energy');
  const [transitionType, setTransitionType] = useState<WorldTransitionType>('portal');
  const [portalTargetSeed, setPortalTargetSeed] = useState<number>(1010);

  // --- INFINITE ZOOM STATE ---
  const [currentZoomLevel, setCurrentZoomLevel] = useState<ZoomScaleLevel>('environment');
  const zoomScaleSteps: ZoomScaleLevel[] = [
    'micro',
    'object',
    'environment',
    'planet',
    'solar-system',
    'galaxy',
    'universe'
  ];

  // Current Generated Fusion DNA in Lab
  const currentLabDNA = useMemo(() => {
    const base = FusionDNAFactory.createDefault(
      primarySystem,
      secondarySystem,
      customSeed,
      fusionAmount
    );
    return {
      ...base,
      terrainBlend,
      atmosphereBlend,
      weatherBlend,
      lightingBlend,
      particleBlend,
      physicsBlend,
      ecosystemBlend,
      eventBlend
    };
  }, [
    primarySystem,
    secondarySystem,
    customSeed,
    fusionAmount,
    terrainBlend,
    atmosphereBlend,
    weatherBlend,
    lightingBlend,
    particleBlend,
    physicsBlend,
    ecosystemBlend,
    eventBlend
  ]);

  // Handle Global Action Buttons
  const handleCreateWorld = () => {
    const newSeed = Math.floor(Math.random() * 900000) + 100000;
    setCustomSeed(newSeed);
    setActiveSection('fusion-lab');
    showToast(`New World Seed #${newSeed} initialized in Fusion Lab!`);
  };

  const handleFuseWorlds = () => {
    if (onApplyFusedWorld) {
      onApplyFusedWorld(currentLabDNA);
    }
    showToast(`Fused World "${currentLabDNA.name}" applied to live wallpaper!`);
  };

  const handleRandomWorld = () => {
    const randomDNA = FusionDNAFactory.createRandom();
    setPrimarySystem(randomDNA.primarySystem);
    setSecondarySystem(randomDNA.secondarySystem);
    setCustomSeed(randomDNA.baseWorldSeed);
    setFusionAmount(randomDNA.fusionAmount);
    if (onApplyFusedWorld) {
      onApplyFusedWorld(randomDNA);
    }
    showToast(`Random World "${randomDNA.name}" generated & launched!`);
  };

  const handleEnterPortal = (target?: FusionDNA) => {
    const worldToEnter = target || currentLabDNA;
    if (onApplyFusedWorld) {
      onApplyFusedWorld(worldToEnter);
    }
    showToast(`Entering Portal to ${worldToEnter.name}...`);
  };

  const handleInfiniteZoom = () => {
    const curIdx = zoomScaleSteps.indexOf(currentZoomLevel);
    const nextIdx = (curIdx + 1) % zoomScaleSteps.length;
    const nextLevel = zoomScaleSteps[nextIdx];
    setCurrentZoomLevel(nextLevel);
    showToast(`Infinite Zoom shifted scale to: ${nextLevel.toUpperCase()}`);
  };

  const handleSaveWorld = (dnaToSave?: FusionDNA) => {
    const target = dnaToSave || currentLabDNA;
    FusionStorage.saveWorld(target);
    setFusedWorlds(FusionStorage.getAllSavedWorlds());
    showToast(`World "${target.name}" saved to offline storage!`);
  };

  const handleToggleFavoriteWorld = (id: string) => {
    FusionStorage.toggleFavorite(id);
    setFusedWorlds(FusionStorage.getAllSavedWorlds());
  };

  // Wallpapers list filtering
  const categories = ['All', 'Cosmic Universes', 'Cosmic', 'Energy', 'Nature', 'Cyberpunk'];

  const filteredWallpapers = useMemo(() => {
    return wallpapers.filter((wp) => {
      const matchCat =
        selectedCategory === 'All' || wp.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        wp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wp.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wp.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [wallpapers, selectedCategory, searchQuery]);

  const displayedFusedWorlds = useMemo(() => {
    let list = fusedWorlds;
    if (favFilterOnly) {
      list = list.filter((w) => FusionStorage.isFavorite(w.id));
    }
    if (searchQuery) {
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.primarySystem.includes(searchQuery.toLowerCase()) ||
          w.secondarySystem.includes(searchQuery.toLowerCase()) ||
          w.weatherType.includes(searchQuery.toLowerCase())
      );
    }
    return list;
  }, [fusedWorlds, favFilterOnly, searchQuery]);

  return (
    <div className="w-full h-full overflow-y-auto pt-16 pb-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#00F0FF]/20 border border-[#00F0FF] backdrop-blur-xl text-white px-4 py-2.5 rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.4)] text-xs font-semibold font-['Orbitron'] flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Zap size={14} className="text-[#00F0FF]" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Orbitron'] text-white tracking-wider flex items-center gap-2">
              <Globe className="text-[#00F0FF]" size={22} />
              WORLD EXPLORER
            </h2>
            <p className="text-xs text-slate-400">
              Procedural infinite worlds, multi-system fusions, portals and scale transitions
            </p>
          </div>

          {/* Quick Action Ribbon with the requested 6 buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleCreateWorld}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-[#00F0FF]/20 text-white hover:text-[#00F0FF] border border-white/10 hover:border-[#00F0FF]/40 text-[11px] font-bold font-['Orbitron'] transition-all flex items-center gap-1"
              title="Create New World"
            >
              <Sparkles size={12} />
              CREATE WORLD
            </button>
            <button
              onClick={handleFuseWorlds}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold font-['Orbitron'] transition-all flex items-center gap-1"
              title="Fuse Worlds"
            >
              <Layers size={12} />
              FUSE WORLDS
            </button>
            <button
              onClick={handleRandomWorld}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/20 text-white hover:text-emerald-300 border border-white/10 hover:border-emerald-500/40 text-[11px] font-bold font-['Orbitron'] transition-all flex items-center gap-1"
              title="Random Procedural World"
            >
              <Shuffle size={12} />
              RANDOM WORLD
            </button>
            <button
              onClick={() => handleEnterPortal()}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-indigo-500/20 text-white hover:text-indigo-300 border border-white/10 hover:border-indigo-500/40 text-[11px] font-bold font-['Orbitron'] transition-all flex items-center gap-1"
              title="Enter Portal"
            >
              <DoorOpen size={12} />
              ENTER PORTAL
            </button>
            <button
              onClick={handleInfiniteZoom}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-amber-500/20 text-white hover:text-amber-300 border border-white/10 hover:border-amber-500/40 text-[11px] font-bold font-['Orbitron'] transition-all flex items-center gap-1"
              title="Infinite Zoom"
            >
              <ZoomIn size={12} />
              INFINITE ZOOM
            </button>
            <button
              onClick={() => handleSaveWorld()}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-300 border border-white/10 hover:border-rose-500/40 text-[11px] font-bold font-['Orbitron'] transition-all flex items-center gap-1"
              title="Save Current World"
            >
              <BookmarkPlus size={12} />
              SAVE WORLD
            </button>
          </div>
        </div>

        {/* 5 Core Explorer Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/10 scrollbar-none font-['Orbitron'] text-xs font-semibold">
          {[
            { id: 'explore', label: 'EXPLORE', icon: Compass },
            { id: 'fusion-lab', label: 'FUSION LAB', icon: Layers },
            { id: 'infinite-world', label: 'INFINITE WORLD', icon: Cpu },
            { id: 'portals', label: 'PORTALS', icon: DoorOpen },
            { id: 'saved-worlds', label: 'SAVED WORLDS', icon: BookmarkPlus }
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as ExplorerSection)}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  isTabActive
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= TAB 1: EXPLORE ================= */}
      {activeSection === 'explore' && (
        <div className="space-y-6">
          {/* Search Bar & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search worlds, biomes, weather, seeds, or tags..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0a0f1d]/90 border border-white/10 text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <Filter size={14} className="text-slate-400 shrink-0 ml-1" />
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                        : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fused Worlds Showcase Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-['Orbitron'] text-white flex items-center gap-2">
                <Sparkles size={16} className="text-[#00F0FF]" />
                FEATURED FUSED WORLDS
              </h3>
              <button
                onClick={() => setActiveSection('saved-worlds')}
                className="text-xs text-[#00F0FF] hover:underline flex items-center gap-1 font-mono"
              >
                View All ({fusedWorlds.length}) <ChevronRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fusedWorlds.slice(0, 6).map((world) => (
                <WorldCard
                  key={world.id}
                  world={world}
                  isActive={activeId.includes(world.id)}
                  isFavorite={FusionStorage.isFavorite(world.id)}
                  qualityProfile={qualityProfile}
                  onApply={(w) => {
                    if (onApplyFusedWorld) onApplyFusedWorld(w);
                    showToast(`World "${w.name}" activated!`);
                  }}
                  onToggleFavorite={handleToggleFavoriteWorld}
                  onInspectFusion={(w) => {
                    setPrimarySystem(w.primarySystem);
                    setSecondarySystem(w.secondarySystem);
                    setCustomSeed(w.baseWorldSeed);
                    setFusionAmount(w.fusionAmount);
                    setActiveSection('fusion-lab');
                  }}
                />
              ))}
            </div>
          </div>

          {/* Standard Procedural Wallpapers Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold font-['Orbitron'] text-white">
              CORE PROCEDURAL SCENES
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWallpapers.map((wp) => (
                <WallpaperCard
                  key={wp.id}
                  wallpaper={wp}
                  isActive={activeId === wp.id}
                  isFavorite={isFavorite(wp.id)}
                  onSelect={onSelectWallpaper}
                  onToggleFavorite={onToggleFavorite}
                  onOpenPreview={onOpenPreview}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: FUSION LAB ================= */}
      {activeSection === 'fusion-lab' && (
        <div className="space-y-6">
          {/* Lab Title */}
          <div className="bg-[#0b1329]/80 border border-white/10 p-4 sm:p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold font-['Orbitron'] text-white flex items-center gap-2">
                  <Layers className="text-[#00F0FF]" size={20} />
                  WORLD FUSION MATRIX
                </h3>
                <p className="text-xs text-slate-400">
                  Combine distinct procedural systems into hybrid infinite worlds
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFuseWorlds}
                  className="px-4 py-2 rounded-xl bg-[#00F0FF] text-black font-bold font-['Orbitron'] text-xs hover:bg-[#33F3FF] shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all flex items-center gap-1.5"
                >
                  <Zap size={14} />
                  FUSE & LAUNCH
                </button>
                <button
                  onClick={() => handleSaveWorld(currentLabDNA)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-1.5"
                >
                  <BookmarkPlus size={14} />
                  SAVE WORLD
                </button>
              </div>
            </div>

            {/* System A & System B Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Primary System */}
              <div className="space-y-2">
                <label className="text-xs font-['Orbitron'] text-slate-300 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Primary System (A)</span>
                  <span className="text-[#00F0FF]">{primarySystem.toUpperCase()}</span>
                </label>
                <select
                  value={primarySystem}
                  onChange={(e) => setPrimarySystem(e.target.value as FusionSystemType)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white capitalize focus:outline-none focus:border-[#00F0FF]"
                >
                  {allSystems.map((s) => (
                    <option key={`pri-${s}`} value={s} className="bg-slate-900">
                      {s.replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Secondary System */}
              <div className="space-y-2">
                <label className="text-xs font-['Orbitron'] text-slate-300 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Secondary System (B)</span>
                  <span className="text-purple-400">{secondarySystem.toUpperCase()}</span>
                </label>
                <select
                  value={secondarySystem}
                  onChange={(e) => setSecondarySystem(e.target.value as FusionSystemType)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white capitalize focus:outline-none focus:border-purple-400"
                >
                  {allSystems.map((s) => (
                    <option key={`sec-${s}`} value={s} className="bg-slate-900">
                      {s.replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Seed & Quick Preset Shortcuts */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">SEED:</span>
                <input
                  type="number"
                  value={customSeed}
                  onChange={(e) => setCustomSeed(parseInt(e.target.value) || 1)}
                  className="w-28 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono"
                />
                <button
                  onClick={() => setCustomSeed(Math.floor(Math.random() * 900000) + 100000)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                  title="Randomize Seed"
                >
                  <Shuffle size={14} />
                </button>
              </div>

              <div className="text-[11px] text-slate-400">
                Weather: <span className="text-white font-medium capitalize">{currentLabDNA.weatherType}</span> | Fog: <span className="text-white font-medium">{currentLabDNA.atmosphereFogDensity}</span>
              </div>
            </div>
          </div>

          {/* Granular Blend Sliders */}
          <div className="bg-[#0b1329]/80 border border-white/10 p-4 sm:p-6 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold font-['Orbitron'] text-slate-300 tracking-wider flex items-center gap-2">
              <Sliders size={14} className="text-[#00F0FF]" />
              FUSION BLEND PARAMETERS
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Overall Fusion Amount */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Master Fusion Amount</span>
                  <span className="font-mono text-[#00F0FF]">{Math.round(fusionAmount * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={fusionAmount}
                  onChange={(e) => setFusionAmount(parseFloat(e.target.value))}
                  className="w-full accent-[#00F0FF] h-1.5 bg-black/40 rounded-lg cursor-pointer"
                />
              </div>

              {/* Terrain Blend */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Terrain Height Synthesis</span>
                  <span className="font-mono text-purple-400">{Math.round(terrainBlend * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={terrainBlend}
                  onChange={(e) => setTerrainBlend(parseFloat(e.target.value))}
                  className="w-full accent-purple-400 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                />
              </div>

              {/* Atmosphere Blend */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Atmosphere & Sky Dome</span>
                  <span className="font-mono text-cyan-400">{Math.round(atmosphereBlend * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={atmosphereBlend}
                  onChange={(e) => setAtmosphereBlend(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                />
              </div>

              {/* Weather Blend */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Weather Dynamics</span>
                  <span className="font-mono text-indigo-400">{Math.round(weatherBlend * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weatherBlend}
                  onChange={(e) => setWeatherBlend(parseFloat(e.target.value))}
                  className="w-full accent-indigo-400 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                />
              </div>

              {/* Lighting Blend */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Celestial Lighting</span>
                  <span className="font-mono text-amber-400">{Math.round(lightingBlend * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={lightingBlend}
                  onChange={(e) => setLightingBlend(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                />
              </div>

              {/* Ecosystem Blend */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Ecosystem & Lifeforms</span>
                  <span className="font-mono text-emerald-400">{Math.round(ecosystemBlend * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ecosystemBlend}
                  onChange={(e) => setEcosystemBlend(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Generated World Live Preview Card */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold font-['Orbitron'] text-slate-300 tracking-wider">
              SYNTHESIZED WORLD CARD
            </h4>
            <div className="max-w-md">
              <WorldCard
                world={currentLabDNA}
                isActive={activeId.includes(currentLabDNA.id)}
                isFavorite={FusionStorage.isFavorite(currentLabDNA.id)}
                qualityProfile={qualityProfile}
                onApply={(w) => {
                  if (onApplyFusedWorld) onApplyFusedWorld(w);
                  showToast(`Synthesized World "${w.name}" activated!`);
                }}
                onToggleFavorite={handleToggleFavoriteWorld}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: INFINITE WORLD ================= */}
      {activeSection === 'infinite-world' && (
        <div className="space-y-6">
          <div className="bg-[#0b1329]/80 border border-white/10 p-4 sm:p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold font-['Orbitron'] text-white flex items-center gap-2">
                  <Cpu className="text-[#00F0FF]" size={20} />
                  INFINITE WORLD TELEMETRY
                </h3>
                <p className="text-xs text-slate-400">
                  Continuous procedural chunk streaming, floating origin stabilization and LOD
                </p>
              </div>

              <button
                onClick={handleInfiniteZoom}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold font-['Orbitron'] transition-all flex items-center gap-1.5"
              >
                <ZoomIn size={14} />
                INFINITE ZOOM: {currentZoomLevel.toUpperCase()}
              </button>
            </div>

            {/* Telemetry Status Gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono">FLOATING ORIGIN</span>
                <p className="text-emerald-400 font-bold font-mono">STABILIZED</p>
                <p className="text-[10px] text-slate-500">Threshold: 350 units</p>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono">STREAMING RADIUS</span>
                <p className="text-[#00F0FF] font-bold font-mono">
                  {qualityProfile === 'LOW' ? '1 (3x3 Chunks)' : qualityProfile === 'MEDIUM' ? '2 (5x5 Chunks)' : qualityProfile === 'HIGH' ? '3 (7x7 Chunks)' : '4 (9x9 Chunks)'}
                </p>
                <p className="text-[10px] text-slate-500">Auto-culling active</p>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono">ACTIVE ZOOM SCALE</span>
                <p className="text-amber-300 font-bold font-mono capitalize">{currentZoomLevel}</p>
                <p className="text-[10px] text-slate-500">Micro ↔ Universe</p>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono">MEMORY FOOTPRINT</span>
                <p className="text-cyan-300 font-bold font-mono">OPTIMAL</p>
                <p className="text-[10px] text-slate-500">Pooled Chunks</p>
              </div>
            </div>

            {/* Scale Ladder */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold font-['Orbitron'] text-slate-300">
                SCENE SCALE PROGRESSION
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
                {zoomScaleSteps.map((step, idx) => {
                  const isCurrent = currentZoomLevel === step;
                  return (
                    <button
                      key={step}
                      onClick={() => {
                        setCurrentZoomLevel(step);
                        showToast(`Switched scale to ${step.toUpperCase()}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                        isCurrent
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                          : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {idx + 1}. {step.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: PORTALS ================= */}
      {activeSection === 'portals' && (
        <div className="space-y-6">
          <div className="bg-[#0b1329]/80 border border-white/10 p-4 sm:p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold font-['Orbitron'] text-white flex items-center gap-2">
                  <DoorOpen className="text-[#00F0FF]" size={20} />
                  PROCEDURAL PORTAL GATEWAYS
                </h3>
                <p className="text-xs text-slate-400">
                  Warp between distant worlds through animated geometric gateways
                </p>
              </div>

              <button
                onClick={() => handleEnterPortal()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold font-['Orbitron'] text-xs shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all flex items-center gap-1.5"
              >
                <DoorOpen size={14} />
                ENTER PORTAL
              </button>
            </div>

            {/* Portal Type & Transition Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-['Orbitron'] text-slate-300 font-bold uppercase tracking-wider">
                  Portal Architecture
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['energy', 'black-hole', 'crystal', 'holographic', 'wormhole'] as PortalType[]).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => setPortalType(p)}
                        className={`p-2 rounded-xl text-xs capitalize text-left transition-all border ${
                          portalType === p
                            ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40'
                            : 'bg-white/5 text-slate-300 border-white/5 hover:border-white/20'
                        }`}
                      >
                        {p.replace('-', ' ')} Portal
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-['Orbitron'] text-slate-300 font-bold uppercase tracking-wider">
                  Cinematic Transition Effect
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['portal', 'warp', 'zoom', 'dissolve', 'particle', 'tunnel', 'black-hole', 'energy-wave'] as WorldTransitionType[]).map(
                    (t) => (
                      <button
                        key={t}
                        onClick={() => setTransitionType(t)}
                        className={`p-2 rounded-xl text-xs capitalize text-left transition-all border ${
                          transitionType === t
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-white/5 text-slate-300 border-white/5 hover:border-white/20'
                        }`}
                      >
                        {t.replace('-', ' ')}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: SAVED WORLDS ================= */}
      {activeSection === 'saved-worlds' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold font-['Orbitron'] text-white flex items-center gap-2">
                <BookmarkPlus className="text-[#00F0FF]" size={20} />
                SAVED PROCEDURAL WORLDS
              </h3>
              <p className="text-xs text-slate-400">
                Offline preserved fused worlds & curated dimensional archetypes
              </p>
            </div>

            <button
              onClick={() => setFavFilterOnly(!favFilterOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                favFilterOnly
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
              }`}
            >
              Favorites Only
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedFusedWorlds.map((world) => (
              <WorldCard
                key={world.id}
                world={world}
                isActive={activeId.includes(world.id)}
                isFavorite={FusionStorage.isFavorite(world.id)}
                qualityProfile={qualityProfile}
                onApply={(w) => {
                  if (onApplyFusedWorld) onApplyFusedWorld(w);
                  showToast(`World "${w.name}" activated!`);
                }}
                onToggleFavorite={handleToggleFavoriteWorld}
                onInspectFusion={(w) => {
                  setPrimarySystem(w.primarySystem);
                  setSecondarySystem(w.secondarySystem);
                  setCustomSeed(w.baseWorldSeed);
                  setFusionAmount(w.fusionAmount);
                  setActiveSection('fusion-lab');
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
