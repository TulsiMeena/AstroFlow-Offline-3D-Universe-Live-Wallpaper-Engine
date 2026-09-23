import React, { useState } from 'react';
import { X, Plus, Folder, Check, Trash2, Edit2, BookmarkPlus } from 'lucide-react';
import { LibraryCollection, LibraryWallpaperItem } from '../../library/types';
import { WallpaperCollectionManager } from '../../library/WallpaperCollectionManager';

interface CollectionModalProps {
  item?: LibraryWallpaperItem | null;
  onClose: () => void;
  onCollectionsUpdated: () => void;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({
  item,
  onClose,
  onCollectionsUpdated
}) => {
  const [collections, setCollections] = useState<LibraryCollection[]>(() =>
    WallpaperCollectionManager.getCollections()
  );
  const [newColName, setNewColName] = useState<string>('');
  const [newColDesc, setNewColDesc] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const handleToggleWallpaper = (colId: string) => {
    if (!item) return;
    const col = collections.find(c => c.id === colId);
    if (!col) return;

    if (col.wallpaperIds.includes(item.id)) {
      WallpaperCollectionManager.removeWallpaperFromCollection(colId, item.id);
    } else {
      WallpaperCollectionManager.addWallpaperToCollection(colId, item.id);
    }
    const updated = WallpaperCollectionManager.getCollections();
    setCollections(updated);
    onCollectionsUpdated();
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    const created = WallpaperCollectionManager.createCollection(newColName, newColDesc);
    if (item) {
      WallpaperCollectionManager.addWallpaperToCollection(created.id, item.id);
    }
    setNewColName('');
    setNewColDesc('');
    setIsCreating(false);
    setCollections(WallpaperCollectionManager.getCollections());
    onCollectionsUpdated();
  };

  const handleDeleteCollection = (colId: string) => {
    if (window.confirm('Delete this collection? (Wallpapers will not be deleted)')) {
      WallpaperCollectionManager.deleteCollection(colId);
      setCollections(WallpaperCollectionManager.getCollections());
      onCollectionsUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#090e1c] border border-white/15 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF]">
              <BookmarkPlus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Orbitron']">
                {item ? `Add "${item.name}"` : 'Manage Collections'}
              </h3>
              <p className="text-xs text-slate-400">
                {item ? 'Select collections to include this wallpaper' : 'Create and organize custom folders'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Existing Collections List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {collections.map(col => {
            const hasItem = item ? col.wallpaperIds.includes(item.id) : false;
            return (
              <div
                key={col.id}
                onClick={() => item && handleToggleWallpaper(col.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  item ? 'cursor-pointer hover:bg-white/5' : ''
                } ${
                  hasItem
                    ? 'bg-[#00F0FF]/10 border-[#00F0FF]/40 text-white'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${hasItem ? 'bg-[#00F0FF] text-black' : 'bg-white/10 text-slate-400'}`}>
                    <Folder size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{col.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {col.wallpaperIds.length} wallpapers • {col.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item && (
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        hasItem ? 'bg-[#00F0FF] border-[#00F0FF] text-black' : 'border-white/30'
                      }`}
                    >
                      {hasItem && <Check size={13} strokeWidth={3} />}
                    </div>
                  )}

                  {!col.isSystem && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCollection(col.id);
                      }}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Collection"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create New Collection Inline Form */}
        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-semibold text-xs transition-all"
          >
            <Plus size={15} />
            <span>Create New Collection</span>
          </button>
        ) : (
          <form onSubmit={handleCreateCollection} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">New Collection</h4>
            <input
              type="text"
              placeholder="Collection Name (e.g. My Favorites)"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]"
              autoFocus
            />
            <input
              type="text"
              placeholder="Short Description (Optional)"
              value={newColDesc}
              onChange={(e) => setNewColDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]"
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-[#00F0FF] text-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
