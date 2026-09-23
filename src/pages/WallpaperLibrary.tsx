import React, { useState, useMemo, useEffect } from 'react';
import {
  Compass,
  Search,
  Filter,
  SlidersHorizontal,
  Folder,
  Sparkles,
  Heart,
  Clock,
  Plus,
  Share2,
  HardDrive,
  Grid,
  Zap,
  Check,
  ChevronRight,
  RefreshCw,
  X,
  Play,
  RotateCcw,
  Sliders,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import {
  LibraryWallpaperItem,
  LibraryCategory,
  LibrarySection,
  LibraryFilterOptions,
  LibrarySortOption,
  LibraryCollection,
  RecommendationResult
} from '../library/types';
import { WallpaperLibraryEngine } from '../library/WallpaperLibraryEngine';
import { LibraryWallpaperCard } from '../components/library/LibraryWallpaperCard';
import { WallpaperDetailsModal } from '../components/library/WallpaperDetailsModal';
import { CollectionModal } from '../components/library/CollectionModal';
import { ImportExportModal } from '../components/library/ImportExportModal';
import { StorageManagerModal } from '../components/library/StorageManagerModal';
import { PersonalWorld } from '../personal/types';
import { DesignDNA } from '../designer/types/designDNA';
import { FusionDNA } from '../infinite/types/infiniteTypes';

interface WallpaperLibraryProps {
  activeWallpaperId: string;
  onApplyWallpaper: (id: string) => void;
  onApplyPersonalWorld?: (world: PersonalWorld) => void;
  onApplyCustomDesign?: (dna: DesignDNA) => void;
  onApplyFusedWorld?: (fused: FusionDNA) => void;
  onNavigateToPersonalUniverse?: () => void;
}

export const WallpaperLibrary: React.FC<WallpaperLibraryProps> = ({
  activeWallpaperId,
  onApplyWallpaper,
  onApplyPersonalWorld,
  onApplyCustomDesign,
  onApplyFusedWorld,
  onNavigateToPersonalUniverse
}) => {
  const engine = useMemo(() => WallpaperLibraryEngine.getInstance(), []);

  // Active Navigation Section
  const [section, setSection] = useState<LibrarySection>('HOME');

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<LibraryCategory | 'ALL'>('ALL');
  const [selectedSort, setSelectedSort] = useState<LibrarySortOption>('NEWEST');
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);

  // Extended Filter Toggles
  const [filterMotion, setFilterMotion] = useState<'ALL' | 'STATIC' | 'SUBTLE' | 'BALANCED' | 'DYNAMIC'>('ALL');
  const [filterBattery, setFilterBattery] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [filterPerformance, setFilterPerformance] = useState<'ALL' | 'BATTERY SAVER' | 'BALANCED' | 'HIGH QUALITY' | 'ULTRA'>('ALL');
  const [filterAudio, setFilterAudio] = useState<boolean>(false);
  const [filterPhysics, setFilterPhysics] = useState<boolean>(false);
  const [filterLiving, setFilterLiving] = useState<boolean>(false);
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState<boolean>(false);

  // Modals State
  const [detailItem, setDetailItem] = useState<LibraryWallpaperItem | null>(null);
  const [collectItem, setCollectItem] = useState<LibraryWallpaperItem | null>(null);
  const [exportItem, setExportItem] = useState<LibraryWallpaperItem | null>(null);
  const [showStorageModal, setShowStorageModal] = useState<boolean>(false);
  const [showImportExportModal, setShowImportExportModal] = useState<boolean>(false);

  // Active Collection View (when browsing inside a specific collection)
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  // Data Refresh Trigger
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const refreshData = () => setRefreshTrigger(prev => prev + 1);

  // Raw catalog
  const catalog = useMemo(() => {
    return engine.getCatalog();
  }, [engine, refreshTrigger]);

  const collections = useMemo(() => {
    return engine.getCollections();
  }, [engine, refreshTrigger]);

  const recentIds = useMemo(() => {
    return engine.getRecentWallpaperIds();
  }, [engine, refreshTrigger]);

  // Query and Filter computation
  const filteredWallpapers = useMemo(() => {
    const filterOptions: LibraryFilterOptions = {
      category: selectedCategory,
      searchQuery,
      motion: filterMotion,
      batteryImpact: filterBattery,
      performance: filterPerformance,
      audioReactive: filterAudio ? true : undefined,
      physics: filterPhysics ? true : undefined,
      livingWorld: filterLiving ? true : undefined,
      favoriteOnly: filterFavoritesOnly ? true : undefined
    };

    let result = engine.queryWallpapers(filterOptions, selectedSort);

    // Filter by Section
    if (section === 'FAVORITES') {
      result = result.filter(w => w.isFavorite);
    } else if (section === 'RECENT') {
      const recentSet = new Set(recentIds);
      result = result.filter(w => recentSet.has(w.id));
      result.sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
    } else if (section === 'CREATED BY ME') {
      result = result.filter(w => w.source === 'personal' || w.source === 'fusion');
    } else if (section === 'MY WALLPAPERS') {
      result = result.filter(w => w.source === 'personal' || w.source === 'fusion' || w.isFavorite);
    } else if (section === 'COLLECTIONS' && activeCollectionId) {
      const col = collections.find(c => c.id === activeCollectionId);
      if (col) {
        const idSet = new Set(col.wallpaperIds);
        result = result.filter(w => idSet.has(w.id));
      }
    }

    return result;
  }, [
    engine,
    catalog,
    section,
    activeCollectionId,
    collections,
    recentIds,
    searchQuery,
    selectedCategory,
    selectedSort,
    filterMotion,
    filterBattery,
    filterPerformance,
    filterAudio,
    filterPhysics,
    filterLiving,
    filterFavoritesOnly
  ]);

  // Recommendations for Home Section
  const recommendations = useMemo(() => {
    return engine.getRecommendations(selectedCategory === 'ALL' ? undefined : selectedCategory, 6);
  }, [engine, catalog, selectedCategory]);

  const categories: { key: LibraryCategory | 'ALL'; label: string }[] = [
    { key: 'ALL', label: 'All Universes' },
    { key: 'COSMIC', label: 'Cosmic' },
    { key: 'NATURE', label: 'Nature' },
    { key: 'WEATHER', label: 'Weather' },
    { key: 'ELEMENTS', label: 'Elements' },
    { key: 'FUTURISTIC', label: 'Futuristic' },
    { key: 'FANTASY', label: 'Fantasy' },
    { key: 'ABSTRACT', label: 'Abstract' },
    { key: 'INTERACTIVE', label: 'Interactive' },
    { key: 'LIVING WORLDS', label: 'Living Worlds' },
    { key: 'MIXED WORLDS', label: 'Mixed Worlds' }
  ];

  const searchChips = ['Galaxy', 'Rain', 'Cyber', 'Battery', 'Crystal', 'Aurora', 'Living'];

  // Wallpaper Application Handler
  const handleApply = (item: LibraryWallpaperItem) => {
    engine.recordWallpaperOpened(item.id);

    if (item.personalWorld && onApplyPersonalWorld) {
      onApplyPersonalWorld(item.personalWorld);
    } else if (item.designDNA && onApplyCustomDesign) {
      onApplyCustomDesign(item.designDNA);
    } else if (item.fusionDNA && onApplyFusedWorld) {
      onApplyFusedWorld(item.fusionDNA);
    } else {
      onApplyWallpaper(item.id);
    }

    refreshData();
  };

  const handleToggleFav = (id: string) => {
    engine.toggleFavorite(id);
    refreshData();
  };

  const handleDuplicate = (item: LibraryWallpaperItem) => {
    if (item.personalWorld) {
      const code = engine.exportWallpaperCode(item);
      engine.importWallpaper(code);
      refreshData();
    } else {
      alert(`Created procedural copy of "${item.name}"`);
    }
  };

  const hasCustomWorlds = catalog.some(w => w.source === 'personal' || w.source === 'fusion');

  return (
    <div className="relative min-h-screen bg-[#05070e] text-slate-100 pb-28">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[130px]" />
        <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] rounded-full bg-purple-600/10 blur-[130px]" />
        <div className="absolute bottom-10 left-1/3 w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-[150px]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Top Header & Storage Widget */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] text-[10px] font-mono font-bold tracking-wider uppercase border border-[#00F0FF]/30">
                100% Offline Marketplace
              </span>
              <span className="text-xs font-mono text-slate-400">Zero Cloud • Zero Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-['Orbitron'] tracking-wider mt-1">
              Wallpaper Library
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Explore, curate, inspect and run infinite procedural 3D visual engines locally on device.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setExportItem(null);
                setShowImportExportModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all"
            >
              <Share2 size={14} />
              <span>Import / Export</span>
            </button>

            <button
              onClick={() => setShowStorageModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all"
            >
              <HardDrive size={14} />
              <span>Storage</span>
            </button>

            {onNavigateToPersonalUniverse && (
              <button
                onClick={onNavigateToPersonalUniverse}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#7000FF] text-white font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.4)] active:scale-95 transition-all"
              >
                <Plus size={14} />
                <span>CREATE MY WORLD</span>
              </button>
            )}
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-white/5">
          {(
            [
              'HOME',
              'EXPLORE',
              'MY WALLPAPERS',
              'FAVORITES',
              'RECENT',
              'COLLECTIONS',
              'CREATED BY ME'
            ] as LibrarySection[]
          ).map(sec => {
            const isSel = section === sec;
            return (
              <button
                key={sec}
                onClick={() => {
                  setSection(sec);
                  setActiveCollectionId(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase whitespace-nowrap transition-all ${
                  isSel
                    ? 'bg-[#00F0FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {sec}
              </button>
            );
          })}
        </div>

        {/* Search Bar & Quick Suggestion Chips (Available on HOME, EXPLORE, and Wallpapers) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, category, environment, seed, tag, battery profile..."
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus:border-[#00F0FF] text-xs text-white placeholder-slate-500 focus:outline-none backdrop-blur-md transition-all font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border text-xs font-mono font-semibold transition-all ${
                showFilterDrawer ||
                filterMotion !== 'ALL' ||
                filterBattery !== 'ALL' ||
                filterPerformance !== 'ALL' ||
                filterAudio ||
                filterPhysics ||
                filterLiving
                  ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF]'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Filters</span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={selectedSort}
                onChange={e => setSelectedSort(e.target.value as LibrarySortOption)}
                className="appearance-none pl-3 pr-8 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono text-slate-300 hover:text-white focus:outline-none focus:border-[#00F0FF] cursor-pointer"
              >
                <option value="NEWEST" className="bg-[#090e1c]">Sort: Newest</option>
                <option value="RECENTLY_USED" className="bg-[#090e1c]">Sort: Recently Used</option>
                <option value="FAVORITES" className="bg-[#090e1c]">Sort: Favorites</option>
                <option value="NAME" className="bg-[#090e1c]">Sort: Name (A-Z)</option>
                <option value="BATTERY_FRIENDLY" className="bg-[#090e1c]">Sort: Battery Friendly</option>
                <option value="PERFORMANCE_FRIENDLY" className="bg-[#090e1c]">Sort: Performance Friendly</option>
                <option value="RANDOM" className="bg-[#090e1c]">Sort: Random Shuffle</option>
              </select>
              <ArrowUpDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Quick Search Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-mono text-slate-500 uppercase shrink-0">Try:</span>
            {searchChips.map(chip => (
              <button
                key={chip}
                onClick={() => setSearchQuery(chip)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                  searchQuery.toLowerCase() === chip.toLowerCase()
                    ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                #{chip}
              </button>
            ))}
          </div>

          {/* Expandable Advanced Filter Drawer */}
          {showFilterDrawer && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Advanced Procedural Engine Filters
                </span>
                <button
                  onClick={() => {
                    setFilterMotion('ALL');
                    setFilterBattery('ALL');
                    setFilterPerformance('ALL');
                    setFilterAudio(false);
                    setFilterPhysics(false);
                    setFilterLiving(false);
                    setFilterFavoritesOnly(false);
                  }}
                  className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw size={11} />
                  <span>Reset All</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                {/* Battery Impact Filter */}
                <div className="space-y-1.5">
                  <span className="text-slate-400">Battery Impact</span>
                  <div className="flex gap-1">
                    {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setFilterBattery(lvl)}
                        className={`flex-1 py-1 rounded-lg border text-[10px] ${
                          filterBattery === lvl
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Motion Mode */}
                <div className="space-y-1.5">
                  <span className="text-slate-400">Motion Mode</span>
                  <div className="flex gap-1">
                    {(['ALL', 'STATIC', 'SUBTLE', 'DYNAMIC'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setFilterMotion(m)}
                        className={`flex-1 py-1 rounded-lg border text-[10px] ${
                          filterMotion === m
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Features Checkboxes */}
                <div className="space-y-1.5">
                  <span className="text-slate-400">Special Subsystems</span>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={filterAudio}
                        onChange={e => setFilterAudio(e.target.checked)}
                        className="rounded accent-[#00F0FF]"
                      />
                      <span>Audio Reactive</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={filterPhysics}
                        onChange={e => setFilterPhysics(e.target.checked)}
                        className="rounded accent-[#00F0FF]"
                      />
                      <span>Physics Forces</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={filterLiving}
                        onChange={e => setFilterLiving(e.target.checked)}
                        className="rounded accent-[#00F0FF]"
                      />
                      <span>Living World</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Carousel (on HOME, EXPLORE, and Wallpapers) */}
        {section !== 'COLLECTIONS' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(c => {
              const isSel = selectedCategory === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setSelectedCategory(c.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono whitespace-nowrap border transition-all ${
                    isSel
                      ? 'bg-white text-black border-white font-bold shadow-[0_0_10px_rgba(255,255,255,0.4)]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        )}

        {/* HOME SECTION SPECIFIC: Recommendations Rail & Highlights */}
        {section === 'HOME' && searchQuery === '' && (
          <div className="space-y-6">
            {/* Deterministic Local Recommendations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#00F0FF]/15 text-[#00F0FF]">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-['Orbitron']">
                      Recommended For You
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400">
                      100% On-Device Deterministic Algorithmic Affinity
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSection('EXPLORE')}
                  className="text-xs font-mono text-[#00F0FF] hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {recommendations.slice(0, 3).map(rec => (
                  <div key={`rec-${rec.wallpaper.id}`} className="space-y-1">
                    <div className="px-2 py-0.5 text-[10px] font-mono text-[#00FFA3] truncate">
                      ★ {rec.reason}
                    </div>
                    <LibraryWallpaperCard
                      item={rec.wallpaper}
                      isActive={activeWallpaperId === rec.wallpaper.id}
                      onOpen={handleApply}
                      onSelectDetails={setDetailItem}
                      onToggleFavorite={handleToggleFav}
                      onDuplicate={handleDuplicate}
                      onAddToCollection={setCollectItem}
                      onExport={setExportItem}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Collections Preview Rail */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/20 via-black/40 to-cyan-950/20 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-['Orbitron']">
                    Featured Collections
                  </h3>
                  <p className="text-xs text-slate-400">
                    Handcrafted procedural vaults for quick mood switching.
                  </p>
                </div>
                <button
                  onClick={() => setSection('COLLECTIONS')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition-all"
                >
                  All Collections ({collections.length})
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {collections.slice(0, 4).map(col => (
                  <div
                    key={col.id}
                    onClick={() => {
                      setActiveCollectionId(col.id);
                      setSection('COLLECTIONS');
                    }}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <Folder size={18} className="text-cyan-400" />
                      <span className="text-[10px] font-mono text-slate-400">
                        {col.wallpaperIds.length} items
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate font-['Orbitron']">
                      {col.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{col.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COLLECTIONS VIEW */}
        {section === 'COLLECTIONS' && (
          <div className="space-y-5">
            {activeCollectionId ? (
              <div className="space-y-4">
                {/* Back to collections list header */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveCollectionId(null)}
                    className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>← Back to All Collections</span>
                  </button>

                  <button
                    onClick={() => setCollectItem(null)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white"
                  >
                    Manage Collections
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="text-xl font-black text-white font-['Orbitron']">
                    {collections.find(c => c.id === activeCollectionId)?.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {collections.find(c => c.id === activeCollectionId)?.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white font-['Orbitron']">
                      Your Collections
                    </h3>
                    <p className="text-xs text-slate-400">
                      Organize procedural universes into custom themes and workflows.
                    </p>
                  </div>

                  <button
                    onClick={() => setCollectItem(null)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00F0FF] text-black text-xs font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                  >
                    <Plus size={14} />
                    <span>NEW COLLECTION</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {collections.map(col => (
                    <div
                      key={col.id}
                      onClick={() => setActiveCollectionId(col.id)}
                      className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF]">
                          <Folder size={20} />
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          {col.wallpaperIds.length} wallpapers
                        </span>
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white font-['Orbitron']">
                          {col.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">{col.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* EMPTY STATE HANDLING */}
        {filteredWallpapers.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
              <Compass size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Orbitron']">
                {section === 'CREATED BY ME' || section === 'MY WALLPAPERS'
                  ? 'No Custom Worlds Yet'
                  : 'No Wallpapers Match Criteria'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                {section === 'CREATED BY ME' || section === 'MY WALLPAPERS'
                  ? 'Create your first procedural universe from scratch with custom planets, biomes, and physics.'
                  : 'Try adjusting your search query, clearing filters, or switching category.'}
              </p>
            </div>

            {(section === 'CREATED BY ME' || section === 'MY WALLPAPERS' || !hasCustomWorlds) &&
              onNavigateToPersonalUniverse && (
                <button
                  onClick={onNavigateToPersonalUniverse}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#7000FF] text-white font-bold text-xs shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:brightness-110 active:scale-95 transition-all"
                >
                  <Plus size={16} />
                  <span>CREATE MY WORLD</span>
                </button>
              )}
          </div>
        ) : (
          /* PRIMARY WALLPAPERS GRID */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>
                Showing {filteredWallpapers.length} procedural {filteredWallpapers.length === 1 ? 'world' : 'worlds'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredWallpapers.map(item => (
                <LibraryWallpaperCard
                  key={item.id}
                  item={item}
                  isActive={activeWallpaperId === item.id}
                  onOpen={handleApply}
                  onSelectDetails={setDetailItem}
                  onToggleFavorite={handleToggleFav}
                  onDuplicate={handleDuplicate}
                  onAddToCollection={setCollectItem}
                  onExport={setExportItem}
                  onDelete={
                    item.source === 'personal' || item.source === 'fusion'
                      ? () => {
                          if (window.confirm(`Delete "${item.name}"?`)) {
                            if (item.personalWorld) {
                              const list = catalog.filter(c => c.id !== item.id);
                              localStorage.setItem(
                                'amit_hyperwall_personal_worlds',
                                JSON.stringify(list.filter(w => w.personalWorld).map(w => w.personalWorld))
                              );
                            }
                            refreshData();
                          }
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DETAIL INSPECT MODAL */}
      {detailItem && (
        <WallpaperDetailsModal
          item={detailItem}
          isActive={activeWallpaperId === detailItem.id}
          onClose={() => setDetailItem(null)}
          onApply={handleApply}
          onToggleFavorite={handleToggleFav}
          onDuplicate={handleDuplicate}
          onAddToCollection={setCollectItem}
          onExport={setExportItem}
        />
      )}

      {/* COLLECTION MODAL */}
      {collectItem !== undefined && collectItem !== null && (
        <CollectionModal
          item={collectItem}
          onClose={() => setCollectItem(null)}
          onCollectionsUpdated={refreshData}
        />
      )}

      {/* IMPORT / EXPORT MODAL */}
      {showImportExportModal && (
        <ImportExportModal
          exportItem={exportItem}
          onClose={() => {
            setShowImportExportModal(false);
            setExportItem(null);
          }}
          onImportSuccess={importedId => {
            refreshData();
            if (importedId) {
              const found = engine.getWallpaperById(importedId);
              if (found) setDetailItem(found);
            }
          }}
        />
      )}

      {/* STORAGE MANAGER MODAL */}
      {showStorageModal && (
        <StorageManagerModal
          onClose={() => setShowStorageModal(false)}
          onStorageCleared={refreshData}
        />
      )}
    </div>
  );
};
