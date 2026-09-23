import React from 'react';
import { WallpaperMetadata } from '../types/wallpaper';
import { WallpaperCard } from '../components/WallpaperCard';
import { Heart, Compass } from 'lucide-react';

interface FavoritesProps {
  wallpapers: WallpaperMetadata[];
  favorites: string[];
  activeId: string;
  isFavorite: (id: string) => boolean;
  onSelectWallpaper: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenPreview: (id: string) => void;
  onNavigateExplore: () => void;
}

export const Favorites: React.FC<FavoritesProps> = ({
  wallpapers,
  favorites,
  activeId,
  isFavorite,
  onSelectWallpaper,
  onToggleFavorite,
  onOpenPreview,
  onNavigateExplore
}) => {
  const favoriteWallpapers = wallpapers.filter((wp) => favorites.includes(wp.id));

  return (
    <div className="w-full h-full overflow-y-auto pt-16 pb-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-['Orbitron'] text-white flex items-center gap-2">
          <span>SAVED FAVORITES</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
            {favoriteWallpapers.length}
          </span>
        </h2>
        <p className="text-xs text-slate-400">
          Your bookmarked 3D living scenes for quick switching
        </p>
      </div>

      {favoriteWallpapers.length === 0 ? (
        <div className="py-20 text-center space-y-4 max-w-sm mx-auto p-6 rounded-3xl bg-[#080d1a]/60 border border-white/5 backdrop-blur-md">
          <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto text-pink-500">
            <Heart size={26} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Favorites Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tap the heart icon on any living wallpaper card to save it to your quick-access favorites vault.
            </p>
          </div>
          <button
            onClick={onNavigateExplore}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00F0FF] text-black font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.4)] active:scale-95 transition-all"
          >
            <Compass size={16} />
            <span>Discover Wallpapers</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteWallpapers.map((wp) => (
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
      )}
    </div>
  );
};
