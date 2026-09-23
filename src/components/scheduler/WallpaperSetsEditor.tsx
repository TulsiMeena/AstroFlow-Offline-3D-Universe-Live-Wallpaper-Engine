import React, { useState } from 'react';
import { WallpaperSet } from '../../scheduler/types';
import { WallpaperSetManager } from '../../scheduler/WallpaperSetManager';
import { WallpaperCatalog } from '../../library/WallpaperCatalog';
import {
  Sparkles,
  Shuffle,
  Star,
  Plus,
  Trash2,
  Copy,
  Play,
  X,
  ChevronRight
} from 'lucide-react';

interface WallpaperSetsEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateSet: (set: WallpaperSet) => void;
}

export const WallpaperSetsEditor: React.FC<WallpaperSetsEditorProps> = ({
  isOpen,
  onClose,
  onActivateSet
}) => {
  if (!isOpen) return null;

  const setManager = WallpaperSetManager.getInstance();
  const catalog = WallpaperCatalog.getCatalog();
  const [sets, setSets] = useState<WallpaperSet[]>(setManager.getAllSets());
  const [selectedSet, setSelectedSet] = useState<WallpaperSet | null>(sets[0] || null);

  const [isCreating, setIsCreating] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [newSetDesc, setNewSetDesc] = useState('');

  const refreshSets = () => {
    const list = setManager.getAllSets();
    setSets(list);
    if (selectedSet) {
      setSelectedSet(list.find((s) => s.id === selectedSet.id) || list[0] || null);
    }
  };

  const handleCreate = () => {
    if (!newSetName.trim()) return;
    const created = setManager.createSet(newSetName, newSetDesc, ['galaxy-core']);
    setNewSetName('');
    setNewSetDesc('');
    setIsCreating(false);
    refreshSets();
    setSelectedSet(created);
  };

  const handleToggleFavorite = (id: string) => {
    setManager.toggleFavorite(id);
    refreshSets();
  };

  const handleToggleShuffle = (id: string) => {
    setManager.toggleShuffle(id);
    refreshSets();
  };

  const handleDuplicate = (id: string) => {
    const copy = setManager.duplicateSet(id);
    refreshSets();
    if (copy) setSelectedSet(copy);
  };

  const handleDelete = (id: string) => {
    if (sets.length <= 1) return;
    setManager.deleteSet(id);
    refreshSets();
    setSelectedSet(sets.find((s) => s.id !== id) || null);
  };

  const handleAddWallpaper = (wallpaperId: string) => {
    if (!selectedSet) return;
    setManager.addWallpaperToSet(selectedSet.id, wallpaperId);
    refreshSets();
  };

  const handleRemoveWallpaper = (wallpaperId: string) => {
    if (!selectedSet) return;
    setManager.removeWallpaperFromSet(selectedSet.id, wallpaperId);
    refreshSets();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl rounded-3xl bg-[#080d1a] border border-white/10 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[#7000FF]" />
            <div>
              <h3 className="text-base font-bold text-white font-['Orbitron']">
                WALLPAPER SETS & PACKS
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Curate themed collections for auto-rotation and scheduled scenes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Layout: Left Sidebar (Sets list) & Right Pane (Set editor) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sets list */}
          <div className="space-y-3 border-r border-white/5 pr-0 md:pr-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400">PACKS</span>
              <button
                onClick={() => setIsCreating(true)}
                className="text-xs text-[#00F0FF] font-mono hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> New Set
              </button>
            </div>

            {isCreating && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <input
                  type="text"
                  placeholder="Set Name..."
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                />
                <input
                  type="text"
                  placeholder="Description..."
                  value={newSetDesc}
                  onChange={(e) => setNewSetDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-2 py-1 text-slate-400 text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="px-3 py-1 bg-[#00F0FF] text-black text-xs font-mono font-bold rounded-lg"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {sets.map((s) => {
                const isSelected = selectedSet?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSet(s)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-950/40 to-slate-900 border-[#7000FF] shadow-[0_0_15px_rgba(112,0,255,0.3)]'
                        : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{s.name}</span>
                        {s.isFavorite && <Star size={12} className="text-amber-400 fill-amber-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                        {s.wallpaperIds.length} wallpapers {s.shuffle ? '• Shuffle' : '• Sequence'}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Pane: Selected Set Details */}
          {selectedSet ? (
            <div className="md:col-span-2 space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white font-['Orbitron']">
                      {selectedSet.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {selectedSet.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleShuffle(selectedSet.id)}
                      title="Toggle Shuffle"
                      className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
                        selectedSet.shuffle
                          ? 'bg-[#00FFA3]/20 border-[#00FFA3] text-[#00FFA3]'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <Shuffle size={14} />
                      <span className="hidden sm:inline">Shuffle</span>
                    </button>

                    <button
                      onClick={() => handleToggleFavorite(selectedSet.id)}
                      title="Favorite"
                      className={`p-2 rounded-xl border transition-all ${
                        selectedSet.isFavorite
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <Star size={14} className={selectedSet.isFavorite ? 'fill-amber-400' : ''} />
                    </button>

                    <button
                      onClick={() => handleDuplicate(selectedSet.id)}
                      title="Duplicate Set"
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white"
                    >
                      <Copy size={14} />
                    </button>

                    {sets.length > 1 && (
                      <button
                        onClick={() => handleDelete(selectedSet.id)}
                        title="Delete Set"
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onActivateSet(selectedSet);
                        onClose();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#00F0FF] text-black font-bold font-mono text-xs flex items-center gap-1.5 hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                    >
                      <Play size={14} />
                      <span>Activate Pack</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Wallpapers inside this set */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-slate-400">
                  WALLPAPERS IN THIS PACK ({selectedSet.wallpaperIds.length})
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {selectedSet.wallpaperIds.map((id) => {
                    const wp = catalog.find((c) => c.id === id);
                    return (
                      <div
                        key={id}
                        className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between"
                      >
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">
                            {wp?.name || id}
                          </div>
                          <div className="text-[10px] text-[#00FFA3] font-mono">
                            {wp?.category || 'Procedural 3D'}
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveWallpaper(id)}
                          className="p-1 text-slate-500 hover:text-red-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add more wallpapers to this set */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <span className="text-xs font-mono text-slate-400">ADD TO PACK</span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {catalog
                    .filter((c) => !selectedSet.wallpaperIds.includes(c.id))
                    .map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleAddWallpaper(item.id)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-slate-300 flex items-center gap-1 active:scale-95"
                      >
                        <Plus size={11} className="text-[#00F0FF]" />
                        <span>{item.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="md:col-span-2 flex items-center justify-center p-8 text-slate-500 text-xs font-mono">
              Select or create a wallpaper set
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
