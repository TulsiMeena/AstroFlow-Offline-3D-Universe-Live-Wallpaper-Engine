import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Wind,
  Sun,
  Moon,
  CloudRain,
  Flame,
  Zap,
  Shuffle,
  Save,
  Check,
  Play,
  Pause,
  RotateCw,
  RotateCcw,
  Compass,
  Sliders,
  Copy,
  Activity,
  Globe,
  Radio,
  Clock,
  Trash2,
  Waves,
  Feather
} from 'lucide-react';
import {
  EnvironmentDNA,
  EnvironmentPreset,
  BiomeCategory,
  BiomeType,
  TimeOfDay,
  WeatherType
} from '../environment/types/environmentDNA';
import { EnvironmentRegistry } from '../environment/EnvironmentRegistry';
import { EnvironmentMixer, MixedRecipe } from '../environment/EnvironmentMixer';
import { EnvironmentDNAFactory } from '../environment/EnvironmentDNA';
import {
  EcosystemDNA,
  EcosystemDNAFactory,
  LifeEntityType,
  WorldStateManager,
  SavedWorldPreset,
  WorldEventType
} from '../living';

interface EnvironmentStudioProps {
  activeWallpaperId: string;
  onApplyEnvironment: (dna: EnvironmentDNA, ecoDNA?: EcosystemDNA) => void;
  onOpenLivePreview?: () => void;
}

export const EnvironmentStudio: React.FC<EnvironmentStudioProps> = ({
  activeWallpaperId,
  onApplyEnvironment,
  onOpenLivePreview
}) => {
  const registry = EnvironmentRegistry.getInstance();
  const stateManager = WorldStateManager.getInstance();
  const allPresets = registry.getAllPresets();

  const [activeCategory, setActiveCategory] = useState<BiomeCategory | 'All'>('All');
  const [activeView, setActiveView] = useState<'presets' | 'mixer' | 'editor' | 'living'>('presets');
  const [selectedDNA, setSelectedDNA] = useState<EnvironmentDNA>(() => {
    const defaultPreset = registry.getPresetById('living-forest');
    return defaultPreset ? defaultPreset.dna : EnvironmentDNAFactory.createDefault();
  });

  // Living World State
  const [ecosystemDNA, setEcosystemDNA] = useState<EcosystemDNA>(() =>
    EcosystemDNAFactory.createDefault(selectedDNA.biome, selectedDNA.seed || 1337)
  );
  const [worldTimeHour, setWorldTimeHour] = useState<number>(12.0);
  const [isWorldPaused, setIsWorldPaused] = useState<boolean>(false);
  const [timeMultiplier, setTimeMultiplier] = useState<number>(1.0);
  const [activeEventMessage, setActiveEventMessage] = useState<string | null>(null);
  const [savedWorldsList, setSavedWorldsList] = useState<SavedWorldPreset[]>(() =>
    stateManager.getAllSavedWorlds()
  );

  // Mixer state
  const [mixerBiomeA, setMixerBiomeA] = useState<BiomeType>('living-forest');
  const [mixerBiomeB, setMixerBiomeB] = useState<BiomeType>('aurora-world');
  const [mixerRatio, setMixerRatio] = useState<number>(0.5);

  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const filteredPresets =
    activeCategory === 'All'
      ? allPresets
      : allPresets.filter((p) => p.category === activeCategory);

  const handleSelectPreset = (preset: EnvironmentPreset) => {
    setSelectedDNA(preset.dna);
  };

  const handleApplyCurrent = (dnaToApply: EnvironmentDNA) => {
    onApplyEnvironment(dnaToApply);
  };

  const handleMix = (biomeA: BiomeType, biomeB: BiomeType, ratio: number) => {
    const pA = registry.getPresetById(biomeA);
    const pB = registry.getPresetById(biomeB);
    if (pA && pB) {
      const mixed = EnvironmentMixer.mix(pA.dna, pB.dna, ratio);
      setSelectedDNA(mixed);
      setActiveView('editor');
    }
  };

  const handleSelectRecipe = (recipe: MixedRecipe) => {
    setMixerBiomeA(recipe.primaryBiome as BiomeType);
    setMixerBiomeB(recipe.secondaryBiome as BiomeType);
    setMixerRatio(0.5);
    const mixed = EnvironmentMixer.mixFromRecipe(recipe, 0.5);
    if (mixed) {
      setSelectedDNA(mixed);
    }
  };

  const handleRandomize = () => {
    const biomes: BiomeType[] = [
      'living-forest',
      'ocean-world',
      'cyber-city',
      'volcano-world',
      'crystal-world',
      'thunder-storm',
      'snow-world',
      'aurora-world',
      'floating-islands'
    ];
    const randBiome = biomes[Math.floor(Math.random() * biomes.length)];
    const randSeed = Math.floor(Math.random() * 999999);
    const newDNA = EnvironmentDNAFactory.getPresetByBiome(randBiome, randSeed);
    setSelectedDNA(newDNA);
  };

  const handleSaveCustom = () => {
    registry.saveCustomPreset(selectedDNA);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCopyDNA = () => {
    navigator.clipboard.writeText(JSON.stringify(selectedDNA, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Living World Actions
  const handleSimulateWorld = () => {
    setWorldTimeHour(12.0);
    setIsWorldPaused(false);
    setTimeMultiplier(1.0);
    const events: WorldEventType[] = [
      'meteor-shower',
      'heavy-rain',
      'lightning-storm',
      'aurora-burst',
      'volcanic-eruption',
      'earthquake',
      'energy-wave',
      'particle-explosion',
      'cosmic-event',
      'portal-opening',
      'underwater-current',
      'strong-wind'
    ];
    const picked = events[Math.floor(Math.random() * events.length)];
    handleTriggerEvent(picked);
  };

  const handleNewWorld = () => {
    const biomes: BiomeType[] = [
      'living-forest',
      'ocean-world',
      'cyber-city',
      'volcano-world',
      'crystal-world',
      'aurora-world',
      'snow-world',
      'floating-islands'
    ];
    const randBiome = biomes[Math.floor(Math.random() * biomes.length)];
    const randSeed = Math.floor(Math.random() * 999999);
    const newEnv = EnvironmentDNAFactory.getPresetByBiome(randBiome, randSeed);
    const newEco = EcosystemDNAFactory.randomize(randSeed, randBiome);
    setSelectedDNA(newEnv);
    setEcosystemDNA(newEco);
    setWorldTimeHour(12.0);
    setActiveEventMessage(`Generated New Living World: ${newEnv.name}`);
    setTimeout(() => setActiveEventMessage(null), 3500);
  };

  const handleSaveLivingWorld = () => {
    const name = `${selectedDNA.name} Living World`;
    stateManager.saveWorld(
      name,
      selectedDNA,
      ecosystemDNA,
      worldTimeHour,
      selectedDNA.weather.type
    );
    setSavedWorldsList(stateManager.getAllSavedWorlds());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleLoadSavedWorld = (preset: SavedWorldPreset) => {
    setSelectedDNA(preset.environmentDNA);
    setEcosystemDNA(preset.ecosystemDNA);
    setWorldTimeHour(preset.timeHour);
    setActiveEventMessage(`Loaded Living World: ${preset.name}`);
    setTimeout(() => setActiveEventMessage(null), 3000);
  };

  const handleDeleteSavedWorld = (id: string) => {
    stateManager.deleteWorld(id);
    setSavedWorldsList(stateManager.getAllSavedWorlds());
  };

  const handleTriggerEvent = (type: WorldEventType) => {
    const title = type
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    setActiveEventMessage(`Active Event: ${title}`);
    setTimeout(() => {
      setActiveEventMessage(null);
    }, 4500);
  };

  const toggleEntityType = (type: LifeEntityType) => {
    const exists = ecosystemDNA.allowedEntities.includes(type);
    const nextList = exists
      ? ecosystemDNA.allowedEntities.filter((t) => t !== type)
      : [...ecosystemDNA.allowedEntities, type];
    setEcosystemDNA({
      ...ecosystemDNA,
      allowedEntities: nextList.length > 0 ? nextList : [type]
    });
  };

  const handleApplyLivingWorld = () => {
    onApplyEnvironment(selectedDNA, ecosystemDNA);
  };

  return (
    <div className="w-full h-full overflow-y-auto pt-16 pb-28 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#070d1e]/90 to-purple-950/40 p-6 sm:p-8 border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-mono font-medium mb-3">
              <Sparkles size={13} className="animate-spin" />
              <span>PROCEDURAL 3D ENVIRONMENT ENGINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Orbitron']">
              ENVIRONMENT <span className="text-[#00F0FF]">STUDIO</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
              Generate, mix, and animate living procedural worlds powered by pure Three.js & WebGL. Zero external assets, infinite variations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleApplyCurrent(selectedDNA)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#7000FF] text-black font-semibold text-xs hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              <Play size={15} fill="currentColor" />
              <span>Apply Active 3D Wallpaper</span>
            </button>
            <button
              onClick={handleRandomize}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
              title="Randomize Environment"
            >
              <Shuffle size={16} />
            </button>
          </div>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveView('presets')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'presets'
                ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Layers size={14} />
            <span>Environments ({allPresets.length})</span>
          </button>
          <button
            onClick={() => setActiveView('mixer')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'mixer'
                ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Sparkles size={14} />
            <span>Biome Mixer</span>
          </button>
          <button
            onClick={() => setActiveView('editor')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'editor'
                ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Sliders size={14} />
            <span>DNA Live Tuner</span>
          </button>
          <button
            onClick={() => setActiveView('living')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'living'
                ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Activity size={14} />
            <span>Living World</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: PRESETS CATALOG */}
      {activeView === 'presets' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {(['All', 'Nature', 'Weather', 'Elements', 'Futuristic', 'Fantasy'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-[#7000FF] text-white border border-[#7000FF] shadow-[0_0_12px_rgba(112,0,255,0.4)]'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid of Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresets.map((preset) => {
              const isCurrent = selectedDNA.id === preset.dna.id || selectedDNA.biome === preset.biome;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`group relative rounded-2xl p-5 cursor-pointer transition-all border ${
                    isCurrent
                      ? 'bg-[#00F0FF]/10 border-[#00F0FF]/60 shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                      : 'bg-[#0a0f1d]/80 hover:bg-[#0f172a]/90 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                        {preset.category}
                      </span>
                      <h3 className="text-base font-bold text-white mt-2 group-hover:text-[#00F0FF] transition-colors">
                        {preset.title}
                      </h3>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: preset.dna.accentColor }}
                    />
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {preset.dna.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {preset.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-slate-400 font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Wind size={12} /> {preset.dna.weather.type}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyCurrent(preset.dna);
                      }}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 hover:bg-[#00F0FF] hover:text-black text-xs font-semibold text-white transition-all"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>Apply</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: BIOME MIXER */}
      {activeView === 'mixer' && (
        <div className="space-y-6">
          {/* Quick Popular Recipes */}
          <div className="rounded-2xl bg-white/5 p-5 border border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-[#00F0FF]" />
              <span>Curated Procedural Mix Recipes</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {EnvironmentMixer.POPULAR_RECIPES.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => handleSelectRecipe(recipe)}
                  className="text-left p-3 rounded-xl bg-black/40 hover:bg-[#00F0FF]/10 border border-white/5 hover:border-[#00F0FF]/40 transition-all group"
                >
                  <p className="text-xs font-bold text-white group-hover:text-[#00F0FF] transition-colors">
                    {recipe.name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                    {recipe.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Dual Mixer Panel */}
          <div className="rounded-2xl bg-[#0a0f1d]/90 p-6 border border-white/10 space-y-6">
            <h3 className="text-base font-bold text-white">Custom Biome Fusion Lab</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Primary Biome Picker */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400">PRIMARY BIOME (Base)</label>
                <select
                  value={mixerBiomeA}
                  onChange={(e) => setMixerBiomeA(e.target.value as BiomeType)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00F0FF]"
                >
                  {allPresets.map((p) => (
                    <option key={p.biome} value={p.biome}>
                      {p.title} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Secondary Biome Picker */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400">SECONDARY BIOME (Overlay)</label>
                <select
                  value={mixerBiomeB}
                  onChange={(e) => setMixerBiomeB(e.target.value as BiomeType)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#7000FF]"
                >
                  {allPresets.map((p) => (
                    <option key={p.biome} value={p.biome}>
                      {p.title} ({p.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ratio Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>{EnvironmentDNAFactory.formatName(mixerBiomeA)} ({Math.round((1 - mixerRatio) * 100)}%)</span>
                <span>Blend Ratio</span>
                <span>{EnvironmentDNAFactory.formatName(mixerBiomeB)} ({Math.round(mixerRatio * 100)}%)</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={mixerRatio}
                onChange={(e) => setMixerRatio(parseFloat(e.target.value))}
                className="w-full accent-[#00F0FF] h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handleMix(mixerBiomeA, mixerBiomeB, mixerRatio)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00F0FF] text-black font-semibold text-xs hover:bg-[#00F0FF]/90 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                <Sparkles size={15} />
                <span>Synthesize Hybrid World</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: DNA LIVE TUNER */}
      {activeView === 'editor' && (
        <div className="rounded-2xl bg-[#0a0f1d]/90 p-6 border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <span className="text-xs font-mono text-[#00F0FF]">ACTIVE DNA</span>
              <h2 className="text-xl font-bold text-white">{selectedDNA.name}</h2>
              <p className="text-xs text-slate-400 font-mono">Seed: {selectedDNA.seed}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyDNA}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-all"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy DNA'}</span>
              </button>
              <button
                onClick={handleSaveCustom}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-all"
              >
                {savedSuccess ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
                <span>{savedSuccess ? 'Saved' : 'Save DNA'}</span>
              </button>
              <button
                onClick={() => handleApplyCurrent(selectedDNA)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#00F0FF] text-black font-semibold text-xs hover:bg-[#00F0FF]/90 transition-all"
              >
                <Play size={14} fill="currentColor" />
                <span>Apply Live</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Time of Day */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Sun size={13} className="text-amber-400" /> TIME OF DAY
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['dawn', 'day', 'sunset', 'twilight', 'night'] as TimeOfDay[]).map((tod) => (
                  <button
                    key={tod}
                    onClick={() => setSelectedDNA({ ...selectedDNA, timeOfDay: tod })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono capitalize transition-all ${
                      selectedDNA.timeOfDay === tod
                        ? 'bg-[#00F0FF] text-black font-semibold'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {tod}
                  </button>
                ))}
              </div>
            </div>

            {/* Weather Type */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <CloudRain size={13} className="text-blue-400" /> WEATHER PHENOMENON
              </label>
              <select
                value={selectedDNA.weather.type}
                onChange={(e) =>
                  setSelectedDNA({
                    ...selectedDNA,
                    weather: { ...selectedDNA.weather, type: e.target.value as WeatherType }
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00F0FF]"
              >
                <option value="clear">Clear Skies</option>
                <option value="rain">Rain World</option>
                <option value="heavy-rain">Heavy Downpour</option>
                <option value="snow">Snow Blizzard</option>
                <option value="storm">Thunder Storm</option>
                <option value="fog">Atmospheric Fog</option>
                <option value="aurora">Aurora Borealis</option>
                <option value="embers">Volcanic Embers</option>
                <option value="cyber-dust">Cyber Dust</option>
              </select>
            </div>

            {/* Camera Behavior */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Compass size={13} className="text-purple-400" /> CAMERA KINEMATICS
              </label>
              <select
                value={selectedDNA.camera.behavior}
                onChange={(e) =>
                  setSelectedDNA({
                    ...selectedDNA,
                    camera: { ...selectedDNA.camera, behavior: e.target.value as any }
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#7000FF]"
              >
                <option value="cinematic-orbit">Cinematic Orbit</option>
                <option value="gentle-sway">Gentle Floating Sway</option>
                <option value="fly-through">Infinite Fly-Through</option>
                <option value="dynamic-parallex">Dynamic Gyro Parallax</option>
              </select>
            </div>

            {/* Terrain Height */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Terrain Height</span>
                <span>{selectedDNA.terrain.heightScale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={3.5}
                step={0.1}
                value={selectedDNA.terrain.heightScale}
                onChange={(e) =>
                  setSelectedDNA({
                    ...selectedDNA,
                    terrain: { ...selectedDNA.terrain, heightScale: parseFloat(e.target.value) }
                  })
                }
                className="w-full accent-[#00F0FF] h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>

            {/* Wind Velocity */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Wind Velocity</span>
                <span>{selectedDNA.weather.windSpeed.toFixed(1)} m/s</span>
              </div>
              <input
                type="range"
                min={0}
                max={4.0}
                step={0.2}
                value={selectedDNA.weather.windSpeed}
                onChange={(e) =>
                  setSelectedDNA({
                    ...selectedDNA,
                    weather: { ...selectedDNA.weather, windSpeed: parseFloat(e.target.value) }
                  })
                }
                className="w-full accent-[#00F0FF] h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>

            {/* Fog Density */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Atmospheric Fog</span>
                <span>{(selectedDNA.atmosphere.fogDensity * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min={0.005}
                max={0.08}
                step={0.005}
                value={selectedDNA.atmosphere.fogDensity}
                onChange={(e) =>
                  setSelectedDNA({
                    ...selectedDNA,
                    atmosphere: { ...selectedDNA.atmosphere, fogDensity: parseFloat(e.target.value) }
                  })
                }
                className="w-full accent-[#7000FF] h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: LIVING WORLD & ECOSYSTEM SIMULATOR */}
      {activeView === 'living' && (
        <div className="space-y-6">
          {/* Active Event Banner / Toast */}
          {activeEventMessage && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#00F0FF]/20 via-[#7000FF]/20 to-[#FF0055]/20 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-semibold flex items-center justify-between shadow-[0_0_20px_rgba(0,240,255,0.25)] animate-pulse">
              <div className="flex items-center gap-2">
                <Radio size={16} className="text-[#00FFA3] animate-spin" />
                <span>{activeEventMessage}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">SIMULATION ACTIVE</span>
            </div>
          )}

          {/* Master Actions Bar */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#00FFA3]/10 border border-[#00FFA3]/30 text-[#00FFA3] text-[11px] font-mono mb-1">
                  <Activity size={12} />
                  <span>BIOME: {selectedDNA.biome.toUpperCase()} • SEED #{selectedDNA.seed || ecosystemDNA.seed}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white font-['Orbitron']">
                  LIVING ECOSYSTEM <span className="text-[#00F0FF]">SIMULATION</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Continuous procedural evolution: flocking, wandering, day/night diurnal rhythms, physics touch reactivity, and random cosmic events.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleApplyLivingWorld}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00FFA3] to-[#00F0FF] text-black font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-[0_0_16px_rgba(0,255,163,0.3)]"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Apply Living World</span>
                </button>
              </div>
            </div>

            {/* Core Control Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/5">
              <button
                onClick={handleSimulateWorld}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold active:scale-95 transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)]"
              >
                <Sparkles size={15} />
                <span>SIMULATE WORLD</span>
              </button>

              <button
                onClick={handleNewWorld}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#7000FF]/20 hover:bg-[#7000FF]/30 border border-[#7000FF]/40 text-purple-200 text-xs font-bold active:scale-95 transition-all shadow-[0_0_12px_rgba(112,0,255,0.2)]"
              >
                <Globe size={15} />
                <span>NEW WORLD</span>
              </button>

              <button
                onClick={handleSaveLivingWorld}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-bold active:scale-95 transition-all"
              >
                {savedSuccess ? <Check size={15} className="text-[#00FFA3]" /> : <Save size={15} />}
                <span>{savedSuccess ? 'WORLD SAVED!' : 'SAVE WORLD'}</span>
              </button>
            </div>
          </div>

          {/* WORLD EVENT TIMELINE & QUICK CONTROLS */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white font-['Orbitron']">
                <Clock size={16} className="text-[#00F0FF]" />
                <span>WORLD TIMELINE & TIME CONTROL</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Speed: {timeMultiplier}x {isWorldPaused ? '(PAUSED)' : ''}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsWorldPaused(!isWorldPaused)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isWorldPaused
                    ? 'bg-[#00FFA3] text-black border-[#00FFA3]'
                    : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                }`}
              >
                {isWorldPaused ? <Play size={13} fill="currentColor" /> : <Pause size={13} />}
                <span>{isWorldPaused ? 'RESUME WORLD' : 'PAUSE WORLD'}</span>
              </button>

              <button
                onClick={() => {
                  setTimeMultiplier(4.0);
                  setIsWorldPaused(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  timeMultiplier === 4.0
                    ? 'bg-[#00F0FF] text-black border-[#00F0FF]'
                    : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                }`}
              >
                FAST TIME (4x)
              </button>

              <button
                onClick={() => {
                  setTimeMultiplier(0.25);
                  setIsWorldPaused(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  timeMultiplier === 0.25
                    ? 'bg-[#00F0FF] text-black border-[#00F0FF]'
                    : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                }`}
              >
                SLOW TIME (0.25x)
              </button>

              <button
                onClick={() => {
                  setWorldTimeHour(12.0);
                  setTimeMultiplier(1.0);
                  setIsWorldPaused(false);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-all"
              >
                <RotateCcw size={13} />
                <span>RESET WORLD</span>
              </button>

              <button
                onClick={() => {
                  const events: WorldEventType[] = [
                    'meteor-shower',
                    'heavy-rain',
                    'lightning-storm',
                    'aurora-burst',
                    'volcanic-eruption',
                    'earthquake',
                    'energy-wave',
                    'particle-explosion',
                    'cosmic-event',
                    'portal-opening',
                    'underwater-current',
                    'strong-wind'
                  ];
                  handleTriggerEvent(events[Math.floor(Math.random() * events.length)]);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-pink-200 border border-pink-500/30 hover:opacity-90 transition-all"
              >
                <Zap size={13} />
                <span>RANDOM EVENT</span>
              </button>
            </div>

            {/* Procedural Events Trigger Pills */}
            <div className="space-y-2 pt-3 border-t border-white/5">
              <div className="text-xs font-mono text-slate-400">Trigger Specific Procedural Event:</div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    'meteor-shower',
                    'heavy-rain',
                    'lightning-storm',
                    'aurora-burst',
                    'volcanic-eruption',
                    'earthquake',
                    'energy-wave',
                    'particle-explosion',
                    'cosmic-event',
                    'portal-opening',
                    'underwater-current',
                    'strong-wind'
                  ] as WorldEventType[]
                ).map((evType) => (
                  <button
                    key={evType}
                    onClick={() => handleTriggerEvent(evType)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] text-slate-300 hover:text-white capitalize transition-all"
                  >
                    {evType.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LIVING WORLD SLIDERS & PARAMETERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Toggles & Environmental Rhythm */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-5">
              <h3 className="text-sm font-bold text-white font-['Orbitron'] flex items-center gap-2">
                <Globe size={16} className="text-[#00F0FF]" />
                <span>ECOSYSTEM SYSTEM PARAMETERS</span>
              </h3>

              {/* Master Toggles */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">Living World</span>
                  <button
                    onClick={() =>
                      setEcosystemDNA({ ...ecosystemDNA, enabled: !ecosystemDNA.enabled })
                    }
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      ecosystemDNA.enabled
                        ? 'bg-[#00FFA3] text-black shadow-[0_0_10px_rgba(0,255,163,0.3)]'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {ecosystemDNA.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">Ecosystem</span>
                  <button
                    onClick={() =>
                      setEcosystemDNA({
                        ...ecosystemDNA,
                        ecosystemEnabled: !ecosystemDNA.ecosystemEnabled
                      })
                    }
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      ecosystemDNA.ecosystemEnabled
                        ? 'bg-[#00F0FF] text-black shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {ecosystemDNA.ecosystemEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* World Time Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span className="flex items-center gap-1.5">
                    {worldTimeHour >= 6 && worldTimeHour < 18 ? (
                      <Sun size={13} className="text-amber-400" />
                    ) : (
                      <Moon size={13} className="text-indigo-400" />
                    )}
                    <span>World Time of Day</span>
                  </span>
                  <span className="text-[#00F0FF]">
                    {Math.floor(worldTimeHour).toString().padStart(2, '0')}:
                    {Math.floor((worldTimeHour % 1) * 60)
                      .toString()
                      .padStart(2, '0')}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={0.1}
                  value={worldTimeHour}
                  onChange={(e) => setWorldTimeHour(parseFloat(e.target.value))}
                  className="w-full accent-[#00F0FF] h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Weather Selector */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400">Atmospheric Weather:</div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      'clear',
                      'rain',
                      'heavy-rain',
                      'storm',
                      'snow',
                      'fog',
                      'wind',
                      'embers',
                      'aurora',
                      'energy'
                    ] as WeatherType[]
                  ).map((w) => (
                    <button
                      key={w}
                      onClick={() =>
                        setSelectedDNA({
                          ...selectedDNA,
                          weather: { ...selectedDNA.weather, type: w }
                        })
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                        selectedDNA.weather.type === w
                          ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allowed Entities Tags */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="text-xs font-mono text-slate-400">Active Lifeform Species:</div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      'birds',
                      'butterflies',
                      'fish',
                      'fireflies',
                      'leaves',
                      'clouds',
                      'underwater-creatures',
                      'drones',
                      'volcanic-embers',
                      'insects',
                      'drifting-spores'
                    ] as LifeEntityType[]
                  ).map((ent) => {
                    const isSelected = ecosystemDNA.allowedEntities.includes(ent);
                    return (
                      <button
                        key={ent}
                        onClick={() => toggleEntityType(ent)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                          isSelected
                            ? 'bg-[#7000FF] text-white border border-[#7000FF] shadow-[0_0_8px_rgba(112,0,255,0.4)]'
                            : 'bg-white/5 border border-white/10 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {ent}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Density, Speed & Interaction Sliders */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-4">
              <h3 className="text-sm font-bold text-white font-['Orbitron'] flex items-center gap-2">
                <Sliders size={16} className="text-[#00FFA3]" />
                <span>BEHAVIOR & DYNAMICS</span>
              </h3>

              {/* Entity Density */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Entity Density</span>
                  <span className="text-[#00FFA3]">{(ecosystemDNA.entityDensity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  value={ecosystemDNA.entityDensity}
                  onChange={(e) =>
                    setEcosystemDNA({
                      ...ecosystemDNA,
                      entityDensity: parseFloat(e.target.value)
                    })
                  }
                  className="w-full accent-[#00FFA3] h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Activity Level */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Activity Level</span>
                  <span className="text-[#00F0FF]">{(ecosystemDNA.activityLevel * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={2.5}
                  step={0.1}
                  value={ecosystemDNA.activityLevel}
                  onChange={(e) =>
                    setEcosystemDNA({
                      ...ecosystemDNA,
                      activityLevel: parseFloat(e.target.value)
                    })
                  }
                  className="w-full accent-[#00F0FF] h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Event Frequency */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Event Frequency</span>
                  <span className="text-purple-300">{(ecosystemDNA.eventFrequency * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={2.5}
                  step={0.1}
                  value={ecosystemDNA.eventFrequency}
                  onChange={(e) =>
                    setEcosystemDNA({
                      ...ecosystemDNA,
                      eventFrequency: parseFloat(e.target.value)
                    })
                  }
                  className="w-full accent-[#7000FF] h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Touch Reaction */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Touch Reaction Force</span>
                  <span className="text-[#00F0FF]">{(ecosystemDNA.touchReaction * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={2.0}
                  step={0.1}
                  value={ecosystemDNA.touchReaction}
                  onChange={(e) =>
                    setEcosystemDNA({
                      ...ecosystemDNA,
                      touchReaction: parseFloat(e.target.value)
                    })
                  }
                  className="w-full accent-[#00F0FF] h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Motion Reaction */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Gyro Motion Inertia</span>
                  <span className="text-[#00FFA3]">{(ecosystemDNA.motionReaction * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={2.0}
                  step={0.1}
                  value={ecosystemDNA.motionReaction}
                  onChange={(e) =>
                    setEcosystemDNA({
                      ...ecosystemDNA,
                      motionReaction: parseFloat(e.target.value)
                    })
                  }
                  className="w-full accent-[#00FFA3] h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Flocking Strength */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Flocking & Schooling Cohesion</span>
                  <span className="text-purple-300">{(ecosystemDNA.flockingStrength * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={2.0}
                  step={0.1}
                  value={ecosystemDNA.flockingStrength}
                  onChange={(e) =>
                    setEcosystemDNA({
                      ...ecosystemDNA,
                      flockingStrength: parseFloat(e.target.value)
                    })
                  }
                  className="w-full accent-[#7000FF] h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* SAVED WORLDS & CURATED ECOSYSTEMS */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-['Orbitron'] flex items-center gap-2">
                <Save size={16} className="text-[#00FFA3]" />
                <span>SAVED WORLDS & CURATED PRESETS ({savedWorldsList.length})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedWorldsList.map((world) => (
                <div
                  key={world.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00F0FF]/30 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{world.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400">SEED #{world.seed}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{world.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {world.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-slate-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleLoadSavedWorld(world)}
                      className="px-3 py-1.5 rounded-xl bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] text-xs font-semibold active:scale-95 transition-all"
                    >
                      Load World
                    </button>
                    <button
                      onClick={() => handleDeleteSavedWorld(world.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-all"
                      title="Delete World"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
