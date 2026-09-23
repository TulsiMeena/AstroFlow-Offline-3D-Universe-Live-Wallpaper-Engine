import { useState, useCallback } from 'react';
import { WallpaperStorage, UserPreferences } from '../storage/wallpaperStorage';

export function useSettings() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    return WallpaperStorage.getPreferences();
  });

  const updateSetting = useCallback(<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const updated = WallpaperStorage.savePreferences({ [key]: value });
    setPreferences(updated);
  }, []);

  return {
    preferences,
    updateSetting
  };
}
