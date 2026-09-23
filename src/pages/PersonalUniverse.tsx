import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Wand2,
  Shuffle,
  Save,
  RotateCw,
  Copy,
  Check,
  Trash2,
  Edit3,
  Heart,
  Share2,
  Upload,
  Play,
  Zap,
  Sliders,
  Flame,
  BatteryCharging,
  Layers,
  ChevronRight,
  HelpCircle,
  Eye,
  Info
} from 'lucide-react';
import {
  WorldType,
  WorldStyle,
  WorldAtmosphere,
  WorldMotion,
  WorldPerformance,
  VariationModifier,
  PersonalWorld,
  UniverseRecipe
} from '../personal/types';
import { PersonalUniverseGenerator } from '../personal/PersonalUniverseGenerator';
import { ProceduralPromptInterpreter } from '../personal/ProceduralPromptInterpreter';
import { UniverseRecipeEngine } from '../personal/UniverseRecipeEngine';
import { WallpaperEngine } from '../engine/WallpaperEngine';

interface PersonalUniverseProps {
  engine?: WallpaperEngine | null;
  onApplyWorld: (world: PersonalWorld) => void;
  onOpenLivePreview?: () => void;
}

type MainTab = 'create' | 'variations' | 'my-worlds';

export const PersonalUniverse: React.FC<PersonalUniverseProps> = ({
  engine,
  onApplyWorld,
  onOpenLivePreview
}) => {
  const generator = PersonalUniverseGenerator.getInstance();

  // Navigation Sub-tab
  const [activeTab, setActiveTab] = useState<MainTab>('create');

  // Step 1 - 5 Selection States
  const [worldType, setWorldType] = useState<WorldType>('SPACE');
  const [style, setStyle] = useState<WorldStyle>('CINEMATIC');
  const [atmosphere, setAtmosphere] = useState<WorldAtmosphere>('COSMIC');
  const [motion, setMotion] = useState<WorldMotion>('BALANCED');
  const [performance, setPerformance] = useState<WorldPerformance>('HIGH QUALITY');

  // Text Prompt & Seed
  const [prompt, setPrompt] = useState<string>('');
  const [seed, setSeed] = useState<string>(() => UniverseRecipeEngine.generateSeedString());

  // Active Generated World State
  const [activeWorld, setActiveWorld] = useState<PersonalWorld>(() => {
    return generator.generateWorld({
      worldType: 'SPACE',
      style: 'CINEMATIC',
      atmosphere: 'COSMIC',
      motion: 'BALANCED',
      performance: 'HIGH QUALITY',
      seed: 'AMIT-001'
    });
  });

  // Saved Worlds Library
  const [savedWorlds, setSavedWorlds] = useState<PersonalWorld[]>(() => generator.getAllSavedWorlds());

  // UI Feedback States
  const [copiedSeed, setCopiedSeed] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [importInput, setImportInput] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [editingWorldId, setEditingWorldId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Live prompt keywords interpretation (100% offline)
  const interpretedKeywords = useMemo(() => {
    return ProceduralPromptInterpreter.interpret(prompt);
  }, [prompt]);

  // Sync initial world generation once on mount
  useEffect(() => {
    if (savedWorlds.length > 0) {
      // If we have saved worlds, keep the first one as an option
    }
  }, []);

  // Quick Prompt Presets
  const promptExamples = [
    'Blue galaxy with a giant black hole and glowing planets',
    'Rainy cyber city with neon roads',
    'Peaceful forest under an aurora',
    'Volcano with snow mountains and a red sky'
  ];

  // Options definitions
  const worldTypes: { id: WorldType; label: string; icon: string; desc: string }[] = [
    { id: 'SPACE', label: 'SPACE', icon: '🌌', desc: 'Cosmic galaxies, stars & black holes' },
    { id: 'NATURE', label: 'NATURE', icon: '🌿', desc: 'Organic landscapes, rivers & wildlife' },
    { id: 'OCEAN', label: 'OCEAN', icon: '🌊', desc: 'Surging tides & underwater bioluminescence' },
    { id: 'MOUNTAIN', label: 'MOUNTAIN', icon: '🏔️', desc: 'Alpine peaks, misty crags & ridges' },
    { id: 'FOREST', label: 'FOREST', icon: '🌲', desc: 'Living ancient trees, bamboo & spores' },
    { id: 'VOLCANO', label: 'VOLCANO', icon: '🌋', desc: 'Molten magma flows, ash & thermal embers' },
    { id: 'CYBER CITY', label: 'CYBER CITY', icon: '🏙️', desc: 'Futuristic spires, neon roads & drones' },
    { id: 'FANTASY', label: 'FANTASY', icon: '✨', desc: 'Floating islands & interdimensional portals' },
    { id: 'CRYSTAL', label: 'CRYSTAL', icon: '💎', desc: 'Prismatic refractors & mineral lattices' },
    { id: 'ENERGY', label: 'ENERGY', icon: '⚡', desc: 'Plasma arcs, lightning & ion storms' },
    { id: 'ABSTRACT', label: 'ABSTRACT', icon: '🌀', desc: 'Non-Euclidean fractals & geometry' },
    { id: 'MIXED', label: 'MIXED', icon: '🔮', desc: 'Cross-dimensional hybridized realms' },
    { id: 'RANDOM', label: 'RANDOM', icon: '🎲', desc: 'Unpredictable algorithmic permutation' }
  ];

  const styles: { id: WorldStyle; label: string; desc: string; color: string }[] = [
    { id: 'REALISTIC-STYLE', label: 'REALISTIC-STYLE', desc: 'PBR materials, natural earth tones & sunlight', color: '#38BDF8' },
    { id: 'CINEMATIC', label: 'CINEMATIC', desc: 'Anamorphic flare, rich contrast & film grading', color: '#00D2FF' },
    { id: 'FUTURISTIC', label: 'FUTURISTIC', desc: 'Reflective chrome, holographic glass & grid beams', color: '#00FFE0' },
    { id: 'DREAM', label: 'DREAM', desc: 'Pastel clouds, liquid glass & ethereal diffusion', color: '#FF99C8' },
    { id: 'DARK', label: 'DARK', desc: 'Deep shadows, monochromatic matte & low specular', color: '#6B7280' },
    { id: 'AMOLED', label: 'AMOLED', desc: 'Pure true blacks (#000000) for OLED battery conservation', color: '#00F0FF' },
    { id: 'NEON', label: 'NEON', desc: 'Saturated high-emission synthwave lasers & glow', color: '#FF007F' },
    { id: 'MYSTICAL', label: 'MYSTICAL', desc: 'Violet auras, glowing crystal facets & arcane magic', color: '#B026FF' },
    { id: 'MINIMAL', label: 'MINIMAL', desc: 'Clean negative space, sparse geometry & quiet tones', color: '#E5E7EB' },
    { id: 'CHAOTIC', label: 'CHAOTIC', desc: 'High particle velocity, intense turbulent physics', color: '#EF4444' },
    { id: 'PEACEFUL', label: 'PEACEFUL', desc: 'Tranquil lighting, soft wind & meditative pacing', color: '#34D399' }
  ];

  const atmospheres: { id: WorldAtmosphere; label: string; desc: string }[] = [
    { id: 'CALM', label: 'CALM', desc: 'Gentle drifts, morning mist, relaxing breeze' },
    { id: 'DYNAMIC', label: 'DYNAMIC', desc: 'Active wind, shifting clouds & reactive currents' },
    { id: 'STORMY', label: 'STORMY', desc: 'Heavy precipitation, flash lightning & turbulent air' },
    { id: 'MYSTERIOUS', label: 'MYSTERIOUS', desc: 'Dense low-altitude fog & concealed horizons' },
    { id: 'ENERGETIC', label: 'ENERGETIC', desc: 'Rapid particle excitation & high-speed pulses' },
    { id: 'DREAMLIKE', label: 'DREAMLIKE', desc: 'Slow-motion dispersion & shimmering radiance' },
    { id: 'COSMIC', label: 'COSMIC', desc: 'Deep space vacuum, starlight & aurora curtains' },
    { id: 'DEEP', label: 'DEEP', desc: 'Abyssal depth, heavy atmospheric density' }
  ];

  const motionModes: { id: WorldMotion; label: string; desc: string }[] = [
    { id: 'STATIC', label: 'STATIC', desc: 'Zero sensor drift, zero camera movement (pure tranquility)' },
    { id: 'SUBTLE', label: 'SUBTLE', desc: 'Gentle gyro sway, minimal parallax tilt' },
    { id: 'BALANCED', label: 'BALANCED', desc: 'Fluid device-responsive tilt & interactive touch' },
    { id: 'DYNAMIC', label: 'DYNAMIC', desc: 'Full kinetic parallax, interactive touch physics' }
  ];

  const performanceProfiles: { id: WorldPerformance; label: string; fps: string; desc: string }[] = [
    { id: 'BATTERY SAVER', label: 'BATTERY SAVER', fps: '30 FPS', desc: 'Capped 30 FPS, down-sampled particles, post-fx bypass' },
    { id: 'BALANCED', label: 'BALANCED', fps: '45-60 FPS', desc: 'Optimal compromise for all day handheld usage' },
    { id: 'HIGH QUALITY', label: 'HIGH QUALITY', fps: '60 FPS', desc: 'Full resolution, active shaders, high particle count' },
    { id: 'ULTRA', label: 'ULTRA', fps: '60+ FPS', desc: 'Maximum particles, sub-step physics & deep bloom' }
  ];

  // Actions
  const handleGenerate = () => {
    const world = generator.generateWorld({
      worldType,
      style,
      atmosphere,
      motion,
      performance,
      seed,
      customPrompt: prompt.trim() || undefined
    });

    setActiveWorld(world);
    onApplyWorld(world);
    triggerToast(`Created "${world.name}"`);
  };

  const handleRandomUniverse = () => {
    const world = generator.createRandomWorld();
    setActiveWorld(world);
    setWorldType(world.recipe.worldType);
    setStyle(world.recipe.style);
    setAtmosphere(world.recipe.atmosphere);
    setMotion(world.recipe.motion);
    setPerformance(world.recipe.performance);
    setSeed(world.seed);
    setPrompt('');
    onApplyWorld(world);
    triggerToast(`Random Cosmos: "${world.name}"`);
  };

  const handleSurpriseMe = () => {
    const world = generator.createSurpriseMeWorld();
    setActiveWorld(world);
    setWorldType(world.recipe.worldType);
    setStyle(world.recipe.style);
    setAtmosphere(world.recipe.atmosphere);
    setMotion(world.recipe.motion);
    setPerformance(world.recipe.performance);
    setSeed(world.seed);
    if (world.recipe.customPrompt) {
      setPrompt(world.recipe.customPrompt);
    }
    onApplyWorld(world);
    triggerToast(`Surprise Discovery: "${world.name}"`);
  };

  const handleApplyVariation = (index: 1 | 2 | 3 | 4) => {
    const variedWorld = generator.createVariation(activeWorld, index);
    setActiveWorld(variedWorld);
    setSeed(variedWorld.seed);
    onApplyWorld(variedWorld);
    triggerToast(`Applied Variation ${index}`);
  };

  const handleApplyModifier = (modifier: VariationModifier) => {
    const modifiedWorld = generator.applyModifier(activeWorld, modifier);
    setActiveWorld(modifiedWorld);
    setSeed(modifiedWorld.seed);
    setStyle(modifiedWorld.recipe.style);
    setAtmosphere(modifiedWorld.recipe.atmosphere);
    setMotion(modifiedWorld.recipe.motion);
    onApplyWorld(modifiedWorld);
    triggerToast(`Applied "${modifier}" shift`);
  };

  const handleSaveWorld = () => {
    const success = generator.saveWorld(activeWorld);
    if (success) {
      setSavedWorlds(generator.getAllSavedWorlds());
      triggerToast(`Saved "${activeWorld.name}" to My Worlds!`);
    }
  };

  const handleReset = () => {
    setWorldType('SPACE');
    setStyle('CINEMATIC');
    setAtmosphere('COSMIC');
    setMotion('BALANCED');
    setPerformance('HIGH QUALITY');
    setPrompt('');
    setSeed(UniverseRecipeEngine.generateSeedString());
    triggerToast('Reset creation settings to defaults');
  };

  const handleRandomSeed = () => {
    const newSeed = UniverseRecipeEngine.generateSeedString();
    setSeed(newSeed);
  };

  const handleCopySeed = () => {
    navigator.clipboard.writeText(seed);
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 1800);
  };

  const handleCopyWorldCode = (world: PersonalWorld) => {
    const code = generator.exportWorldCode(world);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
    triggerToast('Copied World Code to clipboard!');
  };

  const handleImportSubmit = () => {
    setImportError(null);
    if (!importInput.trim()) {
      setImportError('Please enter a valid World Code.');
      return;
    }
    const world = generator.importWorldCode(importInput.trim());
    if (!world) {
      setImportError('Invalid or corrupted World Code. Validation failed.');
      return;
    }
    setActiveWorld(world);
    setWorldType(world.recipe.worldType);
    setStyle(world.recipe.style);
    setAtmosphere(world.recipe.atmosphere);
    setMotion(world.recipe.motion);
    setPerformance(world.recipe.performance);
    setSeed(world.seed);
    if (world.recipe.customPrompt) {
      setPrompt(world.recipe.customPrompt);
    }
    onApplyWorld(world);
    setImportModalOpen(false);
    setImportInput('');
    triggerToast(`Successfully imported "${world.name}"`);
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    generator.deleteWorld(id);
    setSavedWorlds(generator.getAllSavedWorlds());
    triggerToast('Deleted world from library');
  };

  const handleDuplicateSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const dup = generator.duplicateWorld(id);
    if (dup) {
      setSavedWorlds(generator.getAllSavedWorlds());
      triggerToast(`Duplicated as "${dup.name}"`);
    }
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    generator.toggleFavorite(id);
    setSavedWorlds(generator.getAllSavedWorlds());
  };

  const handleOpenSaved = (world: PersonalWorld) => {
    setActiveWorld(world);
    setWorldType(world.recipe.worldType);
    setStyle(world.recipe.style);
    setAtmosphere(world.recipe.atmosphere);
    setMotion(world.recipe.motion);
    setPerformance(world.recipe.performance);
    setSeed(world.seed);
    if (world.recipe.customPrompt) setPrompt(world.recipe.customPrompt);
    onApplyWorld(world);
    setActiveTab('create');
    triggerToast(`Loaded "${world.name}"`);
  };

  const handleStartRename = (world: PersonalWorld, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingWorldId(world.id);
    setEditingName(world.name);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingName.trim()) {
      generator.renameWorld(id, editingName.trim());
      setSavedWorlds(generator.getAllSavedWorlds());
      if (activeWorld.id === id) {
        setActiveWorld({ ...activeWorld, name: editingName.trim() });
      }
    }
    setEditingWorldId(null);
  };

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2400);
  };

  return (
    <div className="relative w-full h-full overflow-y-auto pb-28 pt-16 px-3 sm:px-6 md:px-8 max-w-6xl mx-auto text-slate-100 font-sans">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/50 text-[#00F0FF] text-xs sm:text-sm font-semibold shadow-[0_0_20px_rgba(0,240,255,0.4)] backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          {saveToast}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-gradient-to-tr from-[#00F0FF]/20 to-[#7000FF]/20 border border-[#00F0FF]/40 text-[#00F0FF]">
              <Sparkles size={20} className="animate-pulse" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Personal 3D Universe
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            100% Offline Procedural World Generation Engine • Deterministic Algorithms & Live 3D Shaders
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSurpriseMe}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:from-amber-500/30 active:scale-95 transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            title="Randomly combine compatible synergized features"
          >
            <Wand2 size={14} />
            <span>SURPRISE ME</span>
          </button>

          <button
            onClick={handleRandomUniverse}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold hover:bg-purple-500/30 active:scale-95 transition-all"
            title="Generate completely new randomized universe"
          >
            <Shuffle size={14} />
            <span>RANDOM UNIVERSE</span>
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/10 text-slate-300 text-xs font-semibold hover:bg-slate-700/80 active:scale-95 transition-all"
            title="Import safe World Code"
          >
            <Upload size={14} />
            <span>IMPORT CODE</span>
          </button>
        </div>
      </div>

      {/* Main Mode Navigation Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl mb-6 max-w-md">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'create'
              ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers size={15} />
          <span>CREATE MY WORLD</span>
        </button>

        <button
          onClick={() => setActiveTab('variations')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'variations'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <RotateCw size={15} />
          <span>VARIATIONS</span>
        </button>

        <button
          onClick={() => setActiveTab('my-worlds')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'my-worlds'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Heart size={15} />
          <span>MY WORLDS ({savedWorlds.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CREATE MY WORLD                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'create' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Active Generation Preview Banner */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900/80 via-[#0a0f1d]/80 to-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                  {activeWorld.recipe.worldType}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  {activeWorld.recipe.style}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-300 bg-white/5 border border-white/10">
                  SEED: {activeWorld.seed}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                    activeWorld.recipe.batteryAssessment.impact === 'LOW'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : activeWorld.recipe.batteryAssessment.impact === 'MEDIUM'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}
                >
                  <BatteryCharging size={11} className="inline mr-1" />
                  {activeWorld.recipe.batteryAssessment.impact} BATTERY IMPACT
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {activeWorld.name}
              </h2>
              <p className="text-xs text-slate-400">
                Weather: <span className="text-slate-200 uppercase">{activeWorld.recipe.weather.type}</span> • Atmosphere: <span className="text-slate-200 uppercase">{activeWorld.recipe.atmosphere}</span> • Motion: <span className="text-slate-200 uppercase">{activeWorld.recipe.motion}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
              <button
                onClick={handleSaveWorld}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 active:scale-95 transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                <Save size={14} />
                <span>SAVE WORLD</span>
              </button>

              <button
                onClick={() => handleCopyWorldCode(activeWorld)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-slate-300 text-xs font-semibold hover:bg-slate-700 active:scale-95 transition-all"
                title="Copy compact World Code"
              >
                {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>COPY CODE</span>
              </button>

              {onOpenLivePreview && (
                <button
                  onClick={onOpenLivePreview}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF]/30 to-[#7000FF]/30 border border-[#00F0FF]/50 text-[#00F0FF] text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_16px_rgba(0,240,255,0.3)]"
                >
                  <Eye size={14} />
                  <span>IMMERSIVE 3D</span>
                </button>
              )}
            </div>
          </div>

          {/* Optional Local Text Description Input */}
          <div className="p-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Wand2 size={13} className="text-[#00F0FF]" />
                <span>Describe Your World (Optional Local Interpreter)</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">100% Offline Keyword Engine</span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Blue galaxy with a giant black hole and glowing planets..."
                className="w-full px-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
              />
              {prompt && (
                <button
                  onClick={() => setPrompt('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Recognized Keyword Badges */}
            {interpretedKeywords.recognizedKeywords.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-400 font-mono">DETECTED CONCEPTS:</span>
                {interpretedKeywords.recognizedKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30"
                  >
                    ✓ {kw}
                  </span>
                ))}
              </div>
            )}

            {/* Quick Inspiration Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-500">Inspiration:</span>
              {promptExamples.map((example) => (
                <button
                  key={example}
                  onClick={() => setPrompt(example)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5 transition-colors"
                >
                  {example.substring(0, 30)}...
                </button>
              ))}
            </div>
          </div>

          {/* STEP 1: CHOOSE WORLD TYPE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 flex items-center justify-center text-[10px]">1</span>
                <span>Choose World Type</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Active: {worldType}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {worldTypes.map((wt) => {
                const isSelected = worldType === wt.id;
                return (
                  <button
                    key={wt.id}
                    onClick={() => setWorldType(wt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#00F0FF]/15 border-[#00F0FF]/60 shadow-[0_0_15px_rgba(0,240,255,0.25)] scale-[1.02]'
                        : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{wt.icon}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isSelected ? 'text-[#00F0FF]' : 'text-slate-200'}`}>
                        {wt.label}
                      </div>
                      <div className="text-[9px] text-slate-400 line-clamp-2 mt-0.5">
                        {wt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: CHOOSE STYLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center text-[10px]">2</span>
                <span>Choose Style</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Active: {style}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {styles.map((st) => {
                const isSelected = style === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => setStyle(st.id)}
                    className={`p-3 rounded-2xl border text-left transition-all duration-200 ${
                      isSelected
                        ? 'bg-purple-500/15 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.25)] scale-[1.02]'
                        : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: st.color }} />
                      <span className={`text-xs font-bold ${isSelected ? 'text-purple-300' : 'text-slate-200'}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400">
                      {st.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: CHOOSE ATMOSPHERE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center text-[10px]">3</span>
                <span>Choose Atmosphere</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Active: {atmosphere}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {atmospheres.map((at) => {
                const isSelected = atmosphere === at.id;
                return (
                  <button
                    key={at.id}
                    onClick={() => setAtmosphere(at.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {at.label}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {at.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 4 & STEP 5: MOTION & PERFORMANCE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 4: Motion */}
            <div className="p-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-[10px]">4</span>
                <span>Choose Motion</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {motionModes.map((mo) => {
                  const isSelected = motion === mo.id;
                  return (
                    <button
                      key={mo.id}
                      onClick={() => setMotion(mo.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'bg-black/30 border-white/5 hover:border-white/20 text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{mo.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-2">{mo.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 5: Performance Profile */}
            <div className="p-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center text-[10px]">5</span>
                <span>Choose Performance Profile</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {performanceProfiles.map((pf) => {
                  const isSelected = performance === pf.id;
                  return (
                    <button
                      key={pf.id}
                      onClick={() => setPerformance(pf.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                          : 'bg-black/30 border-white/5 hover:border-white/20 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{pf.label}</span>
                        <span className="text-[9px] font-mono text-slate-400">{pf.fps}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-2">{pf.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PERSONAL UNIVERSE SEED CONTROL */}
          <div className="p-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Info size={13} className="text-[#00F0FF]" />
                <span>Deterministic Seed Control</span>
              </label>
              <p className="text-[10px] text-slate-400">
                Same seed + same recipe will always reproduce the identical procedural universe.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value.toUpperCase())}
                placeholder="AMIT-001"
                className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs w-full sm:w-36 text-center tracking-wider focus:outline-none focus:border-[#00F0FF]/60"
              />

              <button
                onClick={handleCopySeed}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs"
                title="Copy Seed to clipboard"
              >
                {copiedSeed ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>

              <button
                onClick={handleRandomSeed}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs"
                title="Generate Random Seed"
              >
                <Shuffle size={14} />
              </button>
            </div>
          </div>

          {/* BOTTOM PRIMARY ACTION DOCK */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleGenerate}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#00F0FF] via-[#7000FF] to-[#FF007F] text-black font-extrabold text-sm tracking-wide hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              <span>GENERATE WORLD</span>
            </button>

            <button
              onClick={() => setActiveTab('variations')}
              className="px-4 py-3 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold hover:bg-purple-500/30 active:scale-95 transition-all"
            >
              <RotateCw size={14} className="inline mr-1" />
              <span>VARIATIONS</span>
            </button>

            <button
              onClick={handleSaveWorld}
              className="px-4 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 active:scale-95 transition-all"
            >
              <Save size={14} className="inline mr-1" />
              <span>SAVE</span>
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-3 rounded-2xl bg-slate-800 text-slate-400 hover:text-white border border-white/10 text-xs transition-colors"
              title="Reset all settings"
            >
              <RotateCw size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VARIATION ENGINE                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'variations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <RotateCw size={15} />
              <span>Deterministic Variation Engine</span>
            </h2>
            <p className="text-xs text-slate-400">
              Each variation preserves the core archetype and theme of <span className="text-white font-semibold">{activeWorld.name}</span> while exploring distinct procedural permutations.
            </p>
          </div>

          {/* 4 Deterministic Seed Variations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {([1, 2, 3, 4] as const).map((idx) => {
              const varSeed = `${activeWorld.seed}-V${idx}`;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-gradient-to-b from-purple-950/20 to-black/40 border border-purple-500/20 hover:border-purple-500/50 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-purple-300">VARIATION {idx}</span>
                      <span className="text-[10px] font-mono text-slate-500">{varSeed}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1">
                      {activeWorld.recipe.worldType} #{idx}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Mutated celestial positions, turbulent density, and alternative phase alignment.
                    </p>
                  </div>

                  <button
                    onClick={() => handleApplyVariation(idx)}
                    className="w-full py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play size={12} />
                    <span>LOAD VARIATION {idx}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Directional Shifts */}
          <div className="p-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Directional Concept Shifts
            </h3>
            <p className="text-xs text-slate-400">
              Apply a focused aesthetic shift while preserving current geometry and ecosystem:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {([
                'MORE COSMIC',
                'MORE CALM',
                'MORE DYNAMIC',
                'MORE COLORFUL',
                'MORE DARK',
                'MORE REALISTIC-STYLE',
                'MORE ABSTRACT'
              ] as VariationModifier[]).map((mod) => (
                <button
                  key={mod}
                  onClick={() => handleApplyModifier(mod)}
                  className="px-3 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-purple-400/40 text-xs font-semibold text-slate-200 hover:text-purple-300 transition-all text-left flex items-center justify-between group"
                >
                  <span>{mod}</span>
                  <ChevronRight size={13} className="text-slate-500 group-hover:text-purple-300 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MY WORLDS (LOCAL PRESETS LIBRARY)                                  */}
      {/* ========================================================================= */}
      {activeTab === 'my-worlds' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                <Heart size={15} />
                <span>My Worlds Library</span>
              </h2>
              <p className="text-xs text-slate-400">
                100% locally saved procedural worlds. Stored as lightweight procedural DNA.
              </p>
            </div>

            <button
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 active:scale-95 transition-all"
            >
              <Upload size={13} />
              <span>IMPORT WORLD CODE</span>
            </button>
          </div>

          {savedWorlds.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-black/30 border border-dashed border-white/10 space-y-3">
              <p className="text-sm text-slate-400">No worlds saved yet in your personal library.</p>
              <button
                onClick={() => {
                  handleSaveWorld();
                  setActiveTab('my-worlds');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/30"
              >
                Save Current Universe
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedWorlds.map((world) => {
                const isEditing = editingWorldId === world.id;
                const isCurrent = activeWorld.id === world.id;

                return (
                  <div
                    key={world.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                      isCurrent
                        ? 'bg-[#00F0FF]/10 border-[#00F0FF]/50 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                        : 'bg-black/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-white/10 text-slate-200">
                          {world.recipe.worldType}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-slate-400 bg-white/5">
                          {world.seed}
                        </span>
                        <button
                          onClick={(e) => handleToggleFavorite(world.id, e)}
                          className={`p-1 rounded-lg transition-colors ${
                            world.isFavorite ? 'text-rose-400' : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Toggle Favorite"
                        >
                          <Heart size={14} fill={world.isFavorite ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      {/* Title / Rename */}
                      {isEditing ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full px-2 py-1 rounded-lg bg-black border border-[#00F0FF]/50 text-white text-xs"
                            autoFocus
                          />
                          <button
                            onClick={(e) => handleSaveRename(world.id, e)}
                            className="p-1 rounded bg-[#00F0FF]/20 text-[#00F0FF] text-xs font-bold"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <h4 className="text-sm font-bold text-white flex items-center justify-between">
                          <span className="truncate">{world.name}</span>
                          <button
                            onClick={(e) => handleStartRename(world, e)}
                            className="text-slate-500 hover:text-white p-0.5 ml-1"
                            title="Rename"
                          >
                            <Edit3 size={12} />
                          </button>
                        </h4>
                      )}

                      <p className="text-[10px] text-slate-400 mt-1">
                        Style: <span className="text-slate-200">{world.recipe.style}</span> • Atmosphere: <span className="text-slate-200">{world.recipe.atmosphere}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[9px] font-mono text-slate-400">
                        <span>Load: {world.recipe.performance}</span>
                        <span>•</span>
                        <span className="text-emerald-400">{world.recipe.batteryAssessment.impact} BATTERY</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleOpenSaved(world)}
                        className="flex-1 py-1.5 rounded-xl bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF]/40 text-xs font-semibold active:scale-95 transition-all flex items-center justify-center gap-1"
                      >
                        <Play size={12} />
                        <span>OPEN</span>
                      </button>

                      <button
                        onClick={(e) => handleDuplicateSaved(world.id, e)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-white/10"
                        title="Duplicate World"
                      >
                        <Copy size={12} />
                      </button>

                      <button
                        onClick={() => handleCopyWorldCode(world)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-white/10"
                        title="Copy World Code"
                      >
                        <Share2 size={12} />
                      </button>

                      <button
                        onClick={(e) => handleDeleteSaved(world.id, e)}
                        className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs"
                        title="Delete World"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* IMPORT WORLD CODE MODAL                                                   */}
      {/* ========================================================================= */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0a0f1d] border border-white/15 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                <Upload size={16} />
                <span>Import World Code</span>
              </h3>
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setImportError(null);
                }}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Paste a shareable World Code generated from Amit HyperWall. All parameters are sanitized and validated locally.
            </p>

            <textarea
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              placeholder="HW-UNIVERSE-v1:eyJuYW1lIjoiQ29zbW9zIiwic2VlZCI6..."
              className="w-full h-24 p-3 rounded-2xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
            />

            {importError && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl">
                {importError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setImportError(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-2 rounded-xl bg-emerald-500/30 border border-emerald-500/60 text-emerald-300 text-xs font-bold hover:bg-emerald-500/40"
              >
                Validate & Load
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
