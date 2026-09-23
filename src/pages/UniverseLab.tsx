import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RotateCw,
  Save,
  Trash2,
  Play,
  Sliders,
  Flame,
  Zap,
  Radio,
  Bookmark,
  Shuffle,
  Download,
  Share2
} from 'lucide-react';
import { WorldDNA, SavedUniverse, GalaxyMorphology } from '../universe/types/worldDNA';
import { UniverseSeedEngine } from '../universe/seed/UniverseSeedEngine';
import { UniverseStorage } from '../universe/storage/universeStorage';

interface UniverseLabProps {
  activeWallpaperId: string;
  onApplyUniverse: (dna: WorldDNA) => void;
  onOpenLivePreview?: () => void;
}

export const UniverseLab: React.FC<UniverseLabProps> = ({
  activeWallpaperId,
  onApplyUniverse,
  onOpenLivePreview
}) => {
  const [dna, setDna] = useState<WorldDNA>(() => UniverseStorage.getActiveDNA());
  const [seedInput, setSeedInput] = useState<string>(dna.seed);
  const [copied, setCopied] = useState<boolean>(false);
  const [universeName, setUniverseName] = useState<string>('');
  const [savedList, setSavedList] = useState<SavedUniverse[]>(() => UniverseStorage.getSavedUniverses());
  const [activeTab, setActiveTab] = useState<'editor' | 'presets' | 'saved'>('editor');
  const [eventTriggered, setEventTriggered] = useState<string | null>(null);

  const presets = UniverseSeedEngine.getPresets();

  useEffect(() => {
    setSeedInput(dna.seed);
  }, [dna.seed]);

  const handleSliderChange = (key: keyof WorldDNA, value: any) => {
    const updated = UniverseSeedEngine.sanitizeDNA({ ...dna, [key]: value });
    setDna(updated);
  };

  const handleNebulaColorChange = (key: 'primary' | 'secondary' | 'accent', hex: string) => {
    const updated = {
      ...dna,
      nebulaColor: {
        ...dna.nebulaColor,
        [key]: hex
      }
    };
    setDna(updated);
  };

  const handleGenerateFromSeed = (targetSeed: string) => {
    const newDNA = UniverseSeedEngine.createDNAFromSeed(targetSeed);
    setDna(newDNA);
    setSeedInput(newDNA.seed);
  };

  const handleRandomize = () => {
    const freshSeed = UniverseSeedEngine.generateSeed();
    handleGenerateFromSeed(freshSeed);
  };

  const handleCopySeed = () => {
    navigator.clipboard.writeText(dna.seed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dna, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `HyperWall_Universe_${dna.seed}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleLaunchActive = () => {
    UniverseStorage.setActiveDNA(dna);
    onApplyUniverse(dna);
    if (onOpenLivePreview) {
      onOpenLivePreview();
    }
  };

  const handleSaveToStorage = () => {
    const name = universeName.trim() || `Cosmos ${dna.seed}`;
    const saved = UniverseStorage.saveUniverse(name, dna);
    setSavedList(UniverseStorage.getSavedUniverses());
    setUniverseName('');
    alert(`Saved "${saved.name}" to offline universe library!`);
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    UniverseStorage.deleteSavedUniverse(id);
    setSavedList(UniverseStorage.getSavedUniverses());
  };

  const handleLoadSaved = (item: SavedUniverse) => {
    setDna(item.dna);
    setSeedInput(item.dna.seed);
    UniverseStorage.setActiveDNA(item.dna);
    onApplyUniverse(item.dna);
    setActiveTab('editor');
  };

  const handleTriggerEvent = (type: string) => {
    setEventTriggered(type);
    // Dispatch custom universe event to window for engine communication
    window.dispatchEvent(new CustomEvent('universe:trigger-event', { detail: { type } }));
    setTimeout(() => setEventTriggered(null), 1600);
  };

  const galaxyOptions: GalaxyMorphology[] = ['spiral', 'barred-spiral', 'elliptical', 'irregular'];

  return (
    <div className="w-full h-full overflow-y-auto pt-16 pb-24 px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Orbitron'] text-white">
              UNIVERSE <span className="text-[#00F0FF]">LAB</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] text-[10px] font-mono">
              OFFLINE PROCEDURAL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Engineered deterministic cosmos creation via mathematical WorldDNA and Seed PRNG
          </p>
        </div>

        {/* Global Action Launch Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLaunchActive}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#7000FF] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]"
          >
            <Play size={15} className="fill-black" />
            <span>Generate & Launch</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'editor'
              ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders size={14} />
          <span>DNA Editor</span>
        </button>
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'presets'
              ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles size={14} />
          <span>Presets ({presets.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'saved'
              ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark size={14} />
          <span>Saved Worlds ({savedList.length})</span>
        </button>
      </div>

      {/* TAB 1: DNA EDITOR */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          {/* Seed Management Glass Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0a0f1d]/80 backdrop-blur-md border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Radio size={16} className="text-[#00F0FF] animate-pulse" />
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-['Orbitron']">
                  Universe Seed Anchor
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Identical Seed = 100% Identical Universe
              </span>
            </div>

            {/* Seed Input & Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value.toUpperCase())}
                placeholder="Enter Seed (e.g. ORION-9482-NOVA)..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-black/60 border border-white/10 text-[#00F0FF] font-mono text-sm tracking-wider focus:outline-none focus:border-[#00F0FF]/60"
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleGenerateFromSeed(seedInput)}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition-all active:scale-95"
                >
                  Load Seed
                </button>
                <button
                  onClick={handleRandomize}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-300 text-xs font-medium transition-all active:scale-95"
                  title="Generate Random Seed"
                >
                  <Shuffle size={14} />
                  <span>Random</span>
                </button>
                <button
                  onClick={handleCopySeed}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-300 text-xs font-medium transition-all active:scale-95"
                  title="Copy Seed to Clipboard"
                >
                  {copied ? <Check size={14} className="text-[#00FFA3]" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-300 transition-all active:scale-95"
                  title="Export DNA as JSON"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* DNA Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Group 1: Macro Structure */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#0a0f1d]/80 backdrop-blur-md border border-white/10 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-['Orbitron'] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#00F0FF]" />
                <span>Cosmic Architecture</span>
              </h3>

              {/* Galaxy Morphology Picker */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 flex justify-between">
                  <span>Galaxy Morphology</span>
                  <span className="font-mono text-[#00F0FF] uppercase">{dna.galaxyType}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {galaxyOptions.map((morph) => (
                    <button
                      key={morph}
                      onClick={() => handleSliderChange('galaxyType', morph)}
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-medium uppercase tracking-tight transition-all ${
                        dna.galaxyType === morph
                          ? 'bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/50 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                          : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                      }`}
                    >
                      {morph.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Universe Domain Scale</span>
                    <span className="font-mono text-[#00F0FF]">{dna.universeSize} ly</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="400"
                    step="10"
                    value={dna.universeSize}
                    onChange={(e) => handleSliderChange('universeSize', Number(e.target.value))}
                    className="w-full accent-[#00F0FF] bg-black/40 rounded-lg cursor-pointer h-1.5"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Stellar Density</span>
                    <span className="font-mono text-[#00F0FF]">{dna.starDensity.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="2.5"
                    step="0.05"
                    value={dna.starDensity}
                    onChange={(e) => handleSliderChange('starDensity', Number(e.target.value))}
                    className="w-full accent-[#00F0FF] bg-black/40 rounded-lg cursor-pointer h-1.5"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Star Core Brightness</span>
                    <span className="font-mono text-[#00F0FF]">{dna.starBrightness.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="2.2"
                    step="0.05"
                    value={dna.starBrightness}
                    onChange={(e) => handleSliderChange('starBrightness', Number(e.target.value))}
                    className="w-full accent-[#00F0FF] bg-black/40 rounded-lg cursor-pointer h-1.5"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Galaxy Rotation Momentum</span>
                    <span className="font-mono text-[#00F0FF]">{dna.galaxyRotation.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.5"
                    step="0.05"
                    value={dna.galaxyRotation}
                    onChange={(e) => handleSliderChange('galaxyRotation', Number(e.target.value))}
                    className="w-full accent-[#00F0FF] bg-black/40 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Group 2: Nebula & Atmospheric Chemistry */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#0a0f1d]/80 backdrop-blur-md border border-white/10 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-['Orbitron'] flex items-center gap-1.5">
                <Flame size={14} className="text-[#FF007F]" />
                <span>Nebula & Gas Chemistry</span>
              </h3>

              {/* Color pickers */}
              <div className="space-y-2">
                <span className="text-xs text-slate-300">Spectral Gas Palette</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2">
                    <input
                      type="color"
                      value={dna.nebulaColor.primary}
                      onChange={(e) => handleNebulaColorChange('primary', e.target.value)}
                      className="w-6 h-6 rounded-md bg-transparent cursor-pointer border-0"
                    />
                    <div className="text-[10px]">
                      <div className="text-slate-400">Primary</div>
                      <div className="font-mono text-slate-200">{dna.nebulaColor.primary}</div>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2">
                    <input
                      type="color"
                      value={dna.nebulaColor.secondary}
                      onChange={(e) => handleNebulaColorChange('secondary', e.target.value)}
                      className="w-6 h-6 rounded-md bg-transparent cursor-pointer border-0"
                    />
                    <div className="text-[10px]">
                      <div className="text-slate-400">Secondary</div>
                      <div className="font-mono text-slate-200">{dna.nebulaColor.secondary}</div>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2">
                    <input
                      type="color"
                      value={dna.nebulaColor.accent}
                      onChange={(e) => handleNebulaColorChange('accent', e.target.value)}
                      className="w-6 h-6 rounded-md bg-transparent cursor-pointer border-0"
                    />
                    <div className="text-[10px]">
                      <div className="text-slate-400">Accent</div>
                      <div className="font-mono text-slate-200">{dna.nebulaColor.accent}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Nebula Gas Density</span>
                    <span className="font-mono text-[#FF007F]">{dna.nebulaDensity.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="2.5"
                    step="0.05"
                    value={dna.nebulaDensity}
                    onChange={(e) => handleSliderChange('nebulaDensity', Number(e.target.value))}
                    className="w-full accent-[#FF007F] bg-black/40 rounded-lg cursor-pointer h-1.5"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Turbulence Dynamics</span>
                    <span className="font-mono text-[#FF007F]">{dna.turbulence.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.5"
                    step="0.05"
                    value={dna.turbulence}
                    onChange={(e) => handleSliderChange('turbulence', Number(e.target.value))}
                    className="w-full accent-[#FF007F] bg-black/40 rounded-lg cursor-pointer h-1.5"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Atmospheric Shimmer</span>
                    <span className="font-mono text-[#FF007F]">{dna.atmosphereDensity.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.2"
                    step="0.05"
                    value={dna.atmosphereDensity}
                    onChange={(e) => handleSliderChange('atmosphereDensity', Number(e.target.value))}
                    className="w-full accent-[#FF007F] bg-black/40 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Group 3: Orbital Physics & Gravity */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#0a0f1d]/80 backdrop-blur-md border border-white/10 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-['Orbitron'] flex items-center gap-1.5">
                <Zap size={14} className="text-[#00FFA3]" />
                <span>Orbital Mechanics & Gravity</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Planet Multiplicity</span>
                    <span className="font-mono text-[#00FFA3]">{dna.planetCount} worlds</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="1"
                    value={dna.planetCount}
                    onChange={(e) => handleSliderChange('planetCount', Number(e.target.value))}
                    className="w-full accent-[#00FFA3] bg-black/40 rounded-lg cursor-pointer h-1.5"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Keplerian Orbit Velocity</span>
                    <span className="font-mono text-[#00FFA3]">{dna.orbitSpeed.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.5"
                    step="0.05"
                    value={dna.orbitSpeed}
                    onChange={(e) => handleSliderChange('orbitSpeed', Number(e.target.value))}
                    className="w-full accent-[#00FFA3] bg-black/40 rounded-lg cursor-pointer h-1.5"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Gravitational Well Strength</span>
                    <span className="font-mono text-[#00FFA3]">{dna.gravityStrength.toFixed(2)}G</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="4.0"
                    step="0.1"
                    value={dna.gravityStrength}
                    onChange={(e) => handleSliderChange('gravityStrength', Number(e.target.value))}
                    className="w-full accent-[#00FFA3] bg-black/40 rounded-lg cursor-pointer h-1.5"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Values &gt; 2.8G trigger a relativistic Black Hole singularity core!
                  </p>
                </div>
              </div>
            </div>

            {/* Group 4: Particles & Camera Flow */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#0a0f1d]/80 backdrop-blur-md border border-white/10 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-['Orbitron'] flex items-center gap-1.5">
                <RotateCw size={14} className="text-[#FFB800]" />
                <span>Simulation Time & Depth</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Time Flow Rate</span>
                    <span className="font-mono text-[#FFB800]">{dna.timeScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.5"
                    step="0.05"
                    value={dna.timeScale}
                    onChange={(e) => handleSliderChange('timeScale', Number(e.target.value))}
                    className="w-full accent-[#FFB800] bg-black/40 rounded-lg cursor-pointer h-1.5"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Camera View Depth</span>
                    <span className="font-mono text-[#FFB800]">{dna.cameraDepth} units</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="95"
                    step="5"
                    value={dna.cameraDepth}
                    onChange={(e) => handleSliderChange('cameraDepth', Number(e.target.value))}
                    className="w-full accent-[#FFB800] bg-black/40 rounded-lg cursor-pointer h-1.5"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Cosmic Event Frequency</span>
                    <span className="font-mono text-[#FFB800]">{dna.eventFrequency.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.5"
                    step="0.1"
                    value={dna.eventFrequency}
                    onChange={(e) => handleSliderChange('eventFrequency', Number(e.target.value))}
                    className="w-full accent-[#FFB800] bg-black/40 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Cosmic Event Trigger Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0a0f1d]/80 backdrop-blur-md border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-['Orbitron'] flex items-center gap-1.5">
                <Radio size={14} className="text-[#00F0FF]" />
                <span>Trigger Cosmic Events In Realtime</span>
              </h4>
              {eventTriggered && (
                <span className="text-[11px] font-mono text-[#00FFA3] animate-pulse">
                  Event Dispatched: {eventTriggered}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleTriggerEvent('meteor-shower')}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <span>☄️ Meteor Shower</span>
              </button>
              <button
                onClick={() => handleTriggerEvent('solar-flare')}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <span>☀️ Solar Flare</span>
              </button>
              <button
                onClick={() => handleTriggerEvent('nebula-pulse')}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <span>🌌 Nebula Pulse</span>
              </button>
              <button
                onClick={() => handleTriggerEvent('energy-wave')}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <span>💥 Energy Wave</span>
              </button>
            </div>
          </div>

          {/* Offline Save Universe Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0a0f1d]/80 backdrop-blur-md border border-white/10 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={universeName}
              onChange={(e) => setUniverseName(e.target.value)}
              placeholder="Name this Universe (e.g. My Neon Cluster)..."
              className="w-full sm:flex-1 px-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F0FF]/50"
            />
            <button
              onClick={handleSaveToStorage}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold transition-all active:scale-95"
            >
              <Save size={14} className="text-[#00FFA3]" />
              <span>Save to Library</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PRESETS */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="p-5 rounded-3xl bg-[#0a0f1d]/80 backdrop-blur-md border border-white/10 hover:border-[#00F0FF]/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-['Orbitron'] group-hover:text-[#00F0FF] transition-colors">
                    {preset.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400">
                    {preset.dna.seed}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{preset.description}</p>

                {/* Color Swatch Preview */}
                <div className="flex items-center gap-1.5 pt-2">
                  <span
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: preset.dna.nebulaColor.primary }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: preset.dna.nebulaColor.secondary }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: preset.dna.nebulaColor.accent }}
                  />
                  <span className="text-[10px] font-mono text-slate-400 ml-2">
                    {preset.dna.galaxyType} • {preset.dna.starDensity}x stars • {preset.dna.planetCount} planets
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => {
                    setDna(preset.dna);
                    setSeedInput(preset.dna.seed);
                    UniverseStorage.setActiveDNA(preset.dna);
                    onApplyUniverse(preset.dna);
                    setActiveTab('editor');
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-semibold active:scale-95 transition-all"
                >
                  <Play size={13} />
                  <span>Load & Launch</span>
                </button>
                <button
                  onClick={() => {
                    setDna(preset.dna);
                    setSeedInput(preset.dna.seed);
                    setActiveTab('editor');
                  }}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium active:scale-95 transition-all"
                >
                  Edit in Lab
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: SAVED WORLDS */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedList.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Bookmark size={32} className="mx-auto text-slate-600" />
              <p className="text-sm text-slate-400 font-semibold">No saved universes yet</p>
              <p className="text-xs text-slate-500">
                Design custom cosmos in the DNA Editor and tap "Save to Library"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedList.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-[#0a0f1d]/80 backdrop-blur-md border border-white/10 hover:border-[#00F0FF]/40 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white font-['Orbitron'] group-hover:text-[#00F0FF] transition-colors">
                        {item.name}
                      </h4>
                      <button
                        onClick={(e) => handleDeleteSaved(item.id, e)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete from Library"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#00F0FF]">{item.seed}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {item.notes && <p className="text-xs text-slate-400">{item.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleLoadSaved(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold active:scale-95 transition-all"
                    >
                      <Play size={13} />
                      <span>Launch Universe</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.seed);
                        alert(`Seed copied: ${item.seed}`);
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white"
                      title="Copy Seed"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
