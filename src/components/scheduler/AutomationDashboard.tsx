import React from 'react';
import { ContextState, AutomationMode } from '../../scheduler/types';
import {
  Sparkles,
  Zap,
  Battery,
  BatteryCharging,
  Cpu,
  Clock,
  Compass,
  Moon,
  Sun,
  Flame,
  ShieldAlert,
  Play
} from 'lucide-react';
import { WallpaperCatalog } from '../../library/WallpaperCatalog';

interface AutomationDashboardProps {
  context: ContextState;
  onActivateSpecialMode: (mode: AutomationMode) => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenSets: () => void;
  onOpenRules: () => void;
}

export const AutomationDashboard: React.FC<AutomationDashboardProps> = ({
  context,
  onActivateSpecialMode,
  onOpenSettings,
  onOpenHistory,
  onOpenSets,
  onOpenRules
}) => {
  const activeWp = WallpaperCatalog.getItemById(context.activeWallpaperId);

  const specialModes: {
    mode: AutomationMode;
    label: string;
    icon: React.ReactNode;
    color: string;
    description: string;
  }[] = [
    {
      mode: 'MORNING',
      label: 'Morning Mode',
      icon: <Sun size={15} />,
      color: '#00FFA3',
      description: 'Sunrise, Forest & Aurora'
    },
    {
      mode: 'DAY',
      label: 'Day Mode',
      icon: <Sparkles size={15} />,
      color: '#00F0FF',
      description: 'Nature, Ocean & Cyber City'
    },
    {
      mode: 'SUNSET',
      label: 'Sunset Mode',
      icon: <Flame size={15} />,
      color: '#FF007F',
      description: 'Warm Glow & Dynamic Ocean'
    },
    {
      mode: 'NIGHT',
      label: 'Night Mode',
      icon: <Moon size={15} />,
      color: '#7000FF',
      description: 'Galaxy, Black Hole & AMOLED'
    },
    {
      mode: 'BATTERY_SAVER',
      label: 'Battery Saver',
      icon: <Battery size={15} />,
      color: '#EAB308',
      description: 'Dark AMOLED & Minimal Particles'
    },
    {
      mode: 'CHARGING',
      label: 'Charging Mode',
      icon: <BatteryCharging size={15} />,
      color: '#3B82F6',
      description: 'Plasma Energy & Max Fidelity'
    },
    {
      mode: 'RANDOM_UNIVERSE',
      label: 'Random Universe',
      icon: <Compass size={15} />,
      color: '#A855F7',
      description: 'Procedural Personal World'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Active 3D Wallpaper */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0c1426]/90 via-[#060913]/90 to-[#0c0d1e]/90 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider text-slate-400">CURRENT WALLPAPER</span>
            <span className="px-2 py-0.5 rounded-full bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 text-[10px] font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
              LIVE 3D
            </span>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white font-['Orbitron'] tracking-wide truncate">
              {activeWp?.name || context.activeWallpaperId}
            </h4>
            <p className="text-xs text-[#00FFA3] font-mono mt-0.5 truncate">
              {activeWp?.category || 'PROCEDURAL UNIVERSE'} • {activeWp?.style || '3D WebGL'}
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>ACTIVE MODE</span>
            <span className="text-white font-bold">{context.activeMode}</span>
          </div>
        </div>

        {/* Card 2: Next Scheduled Change */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0c1426]/90 via-[#060913]/90 to-[#0c0d1e]/90 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider text-slate-400">NEXT TRANSITION</span>
            <Clock size={16} className="text-[#00FFA3]" />
          </div>

          <div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline gap-2">
              <span>{context.nextChangeTime || '--:--'}</span>
              {context.timeRemainingSeconds !== null && (
                <span className="text-xs font-normal text-slate-400 font-mono">
                  (in {Math.ceil(context.timeRemainingSeconds / 60)}m)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 font-mono mt-1 truncate">
              Target: <strong className="text-[#00F0FF]">{context.nextWallpaperName || 'Automatic Schedule'}</strong>
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>CLOCK</span>
            <span className="text-white font-bold">{context.currentTime} ({context.dayName})</span>
          </div>
        </div>

        {/* Card 3: Real Device Context (Battery & Power) */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0c1426]/90 via-[#060913]/90 to-[#0c0d1e]/90 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider text-slate-400">DEVICE & BATTERY CONTEXT</span>
            {context.isCharging ? (
              <BatteryCharging size={18} className="text-[#00FFA3] animate-pulse" />
            ) : (
              <Battery size={18} className="text-[#00F0FF]" />
            )}
          </div>

          <div>
            <div className="text-lg font-bold font-mono text-white flex items-center gap-2">
              {context.isBatterySupported && context.batteryLevel !== null ? (
                <>
                  <span>{Math.round(context.batteryLevel * 100)}%</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    context.isCharging ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {context.isCharging ? 'Charging' : 'Discharging'}
                  </span>
                </>
              ) : (
                <span className="text-xs font-normal text-amber-400 flex items-center gap-1.5">
                  <ShieldAlert size={14} />
                  Battery API Unavailable
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Power: <span className="text-[#00F0FF] font-semibold">{context.powerMode}</span> • GPU: <span className="text-[#00FFA3] font-semibold">{context.performanceTier}</span>
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>TELEMETRY</span>
            <span className="text-emerald-400 font-bold">100% Offline</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Action Hub */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onOpenRules}
          className="flex-1 min-w-[130px] p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Zap size={15} className="text-[#00F0FF]" />
          <span>Automation Rules</span>
        </button>

        <button
          onClick={onOpenSets}
          className="flex-1 min-w-[130px] p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Sparkles size={15} className="text-[#7000FF]" />
          <span>Wallpaper Sets</span>
        </button>

        <button
          onClick={onOpenHistory}
          className="flex-1 min-w-[130px] p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Clock size={15} className="text-[#00FFA3]" />
          <span>Trigger History</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-3 px-4 rounded-2xl bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <span>Settings</span>
        </button>
      </div>

      {/* Special Built-in Automation Modes Panel */}
      <div className="p-6 rounded-3xl bg-[#080d1a]/80 border border-white/10 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-['Orbitron'] tracking-wider flex items-center gap-2">
              SPECIAL PROCEDURAL AUTOMATION MODES
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Activate instant procedural wallpaper presets tailored for ambient environment and power states
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {specialModes.map((item) => {
            const isActive = context.activeMode === item.mode;

            return (
              <button
                key={item.mode}
                onClick={() => onActivateSpecialMode(item.mode)}
                className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between space-y-2 group ${
                  isActive
                    ? 'bg-gradient-to-br from-cyan-950/60 to-purple-950/40 border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                    : 'bg-white/5 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="p-2 rounded-xl text-black transition-transform group-hover:scale-110"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.icon}
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
                  )}
                </div>

                <div>
                  <div className="text-xs font-bold text-white group-hover:text-[#00F0FF] transition-colors">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono line-clamp-1 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
