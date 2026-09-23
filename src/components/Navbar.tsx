import React from 'react';
import { Home, Compass, Heart, Settings, Sparkles, Orbit, Layers, Zap, Camera, Music, Wand2, BatteryCharging, Clock, Activity, Smartphone } from 'lucide-react';

export type TabType = 'home' | 'library' | 'scheduler' | 'personal' | 'explore' | 'designer' | 'power' | 'environments' | 'lab' | 'physics' | 'cinematic' | 'audio' | 'favorites' | 'settings';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  activeWallpaperTitle?: string;
  onOpenLivePreview?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenAndroidBridge?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  activeWallpaperTitle,
  onOpenLivePreview,
  onOpenDiagnostics,
  onOpenAndroidBridge
}) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Engine', icon: <Home size={18} /> },
    { id: 'library', label: 'Library', icon: <Compass size={18} /> },
    { id: 'scheduler', label: 'Schedule', icon: <Clock size={18} /> },
    { id: 'personal', label: 'Personal 3D', icon: <Sparkles size={18} /> },
    { id: 'explore', label: 'Explore', icon: <Layers size={18} /> },
    { id: 'designer', label: 'Fusion Lab', icon: <Wand2 size={18} /> },
    { id: 'power', label: 'Power', icon: <BatteryCharging size={18} /> },
    { id: 'environments', label: 'Worlds', icon: <Layers size={18} /> },
    { id: 'lab', label: 'Universe', icon: <Orbit size={18} /> },
    { id: 'physics', label: 'Physics', icon: <Zap size={18} /> },
    { id: 'cinematic', label: 'Cinematic', icon: <Camera size={18} /> },
    { id: 'audio', label: 'Audio', icon: <Music size={18} /> },
    { id: 'favorites', label: 'Favorites', icon: <Heart size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <>
      {/* Top Header - Glassmorphic Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3 bg-[#05070e]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00F0FF]/30 to-[#7000FF]/40 border border-[#00F0FF]/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <Sparkles size={16} className="text-[#00F0FF] animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider font-['Orbitron'] text-white flex items-center gap-1.5">
              AMIT <span className="text-[#00F0FF]">HYPERWALL</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight">
              3D LIVING ENGINE • AMIT MEENA
            </p>
          </div>
        </div>

        {/* Quick Actions & Live Launch Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectTab('scheduler')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-bold transition-all ${
              activeTab === 'scheduler'
                ? 'bg-[#00FFA3]/30 border-[#00FFA3] text-[#00FFA3] shadow-[0_0_12px_rgba(0,255,163,0.3)]'
                : 'bg-[#00FFA3]/10 hover:bg-[#00FFA3]/20 border-[#00FFA3]/30 text-[#00FFA3]'
            }`}
            title="Open Smart Scheduler & Context Automation Engine"
          >
            <Clock size={13} className="text-[#00FFA3]" />
            <span>SCHEDULE</span>
          </button>

          <button
            onClick={() => onSelectTab('personal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-bold transition-all ${
              activeTab === 'personal'
                ? 'bg-[#00F0FF]/30 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                : 'bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border-[#00F0FF]/30 text-[#00F0FF]'
            }`}
            title="Open Personal 3D Universe Generator"
          >
            <Sparkles size={13} className="text-[#00F0FF] animate-pulse" />
            <span>CREATE WORLD</span>
          </button>

          <button
            onClick={() => onSelectTab('power')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-bold transition-all ${
              activeTab === 'power'
                ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
            }`}
            title="Open Battery & Power Center"
          >
            <Zap size={13} className="text-emerald-400 animate-pulse" />
            <span>POWER</span>
          </button>

          {onOpenAndroidBridge && (
            <button
              onClick={onOpenAndroidBridge}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold transition-all"
              title="Open Android Live Wallpaper Bridge"
            >
              <Smartphone size={13} />
              <span className="hidden sm:inline">ANDROID</span>
            </button>
          )}

          {onOpenDiagnostics && (
            <button
              onClick={onOpenDiagnostics}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white text-xs font-mono transition-all"
              title="Open System Diagnostics & Telemetry HUD"
            >
              <Activity size={13} className="text-[#00F0FF]" />
              <span className="hidden sm:inline">HUD</span>
            </button>
          )}

          {onOpenLivePreview && (
            <button
              onClick={onOpenLivePreview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#00F0FF]/20 to-[#7000FF]/20 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-semibold hover:from-[#00F0FF]/30 hover:to-[#7000FF]/30 active:scale-95 transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-ping" />
              <span>Immersive</span>
            </button>
          )}
        </div>
      </header>

      {/* Bottom Navigation Dock - Mobile-First Scrollable */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 p-2 bg-[#05070e]/85 backdrop-blur-xl border-t border-white/10 flex items-center overflow-x-auto no-scrollbar max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto md:rounded-2xl md:bottom-3 md:border md:shadow-2xl justify-between sm:justify-center sm:gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center shrink-0 px-3 sm:px-3.5 py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-[#00F0FF] scale-105 font-medium'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-6 h-0.5 rounded-full bg-gradient-to-r from-[#00F0FF] to-[#7000FF] shadow-[0_0_8px_#00F0FF]" />
              )}
              <div className={`p-1 transition-transform ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-[9px] sm:text-[10px] tracking-wide mt-0.5 whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
