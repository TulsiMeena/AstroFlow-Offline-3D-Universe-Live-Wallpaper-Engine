import { useState, useCallback } from 'react';
import { WallpaperStorage } from '../storage/wallpaperStorage';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    return WallpaperStorage.getPreferences().favorites;
  });

  const toggleFavorite = useCallback((id: string) => {
    WallpaperStorage.toggleFavorite(id);
    setFavorites([...WallpaperStorage.getPreferences().favorites]);
  }, []);

  const isFavorite = useCallback(
    (id: string) => {
      return favorites.includes(id);
    },
    [favorites]
  );

  return {
    favorites,
    toggleFavorite,
    isFavorite
  };
}
