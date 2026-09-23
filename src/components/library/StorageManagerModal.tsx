import React, { useState } from 'react';
import {
  X,
  HardDrive,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Database,
  Layers,
  Heart,
  Folder,
  Sparkles
} from 'lucide-react';
import { WallpaperStorageManager } from '../../library/WallpaperStorageManager';
import { StorageBreakdown } from '../../library/types';

interface StorageManagerModalProps {
  onClose: () => void;
  onStorageCleared: () => void;
}

export const StorageManagerModal: React.FC<StorageManagerModalProps> = ({
  onClose,
  onStorageCleared
}) => {
  const [breakdown, setBreakdown] = useState<StorageBreakdown>(() =>
    WallpaperStorageManager.getStorageBreakdown()
  );
  const [confirmClean, setConfirmClean] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const handleClean = () => {
    const res = WallpaperStorageManager.cleanUnusedData();
    setResultMessage(res.message);
    setConfirmClean(false);
    setBreakdown(WallpaperStorageManager.getStorageBreakdown());
    onStorageCleared();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#080d1a] border border-white/15 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
              <HardDrive size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Orbitron']">
                Local Storage Center
              </h3>
              <p className="text-[11px] text-slate-400">100% Offline • Local Device Storage</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Storage Metrics Matrix */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="col-span-2 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Total Storage Used
              </span>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {breakdown.storageUsedFormatted}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[#00F0FF]">
              <Database size={22} />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <Layers size={13} className="text-cyan-400" />
              <span>TOTAL WALLPAPERS</span>
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {breakdown.wallpaperCount}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <Sparkles size={13} className="text-purple-400" />
              <span>SAVED WORLDS</span>
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {breakdown.savedWorldsCount}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <Heart size={13} className="text-rose-400" />
              <span>FAVORITES</span>
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {breakdown.favoritesCount}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <Folder size={13} className="text-amber-400" />
              <span>COLLECTIONS</span>
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {breakdown.collectionsCount}
            </div>
          </div>
        </div>

        {/* Clean Unused Data Action */}
        {resultMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle size={15} />
            <span>{resultMessage}</span>
          </div>
        )}

        {!confirmClean ? (
          <button
            onClick={() => setConfirmClean(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-all"
          >
            <Trash2 size={14} />
            <span>Clean Unused Data & Cache</span>
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200">
                <span className="font-bold">Confirmation Required:</span> Clean browsing history, orphaned caches, and temporary data? Your saved worlds and favorites will NOT be deleted.
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleClean}
                className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs active:scale-95 transition-all"
              >
                Yes, Clean Cache
              </button>
              <button
                onClick={() => setConfirmClean(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
