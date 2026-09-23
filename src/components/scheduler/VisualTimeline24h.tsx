import React from 'react';
import { TimeSlotConfig, ContextState } from '../../scheduler/types';
import { Clock, ChevronRight, Sparkles } from 'lucide-react';
import { WallpaperCatalog } from '../../library/WallpaperCatalog';

interface VisualTimeline24hProps {
  slots: TimeSlotConfig[];
  context: ContextState;
  onSelectSlot: (slot: TimeSlotConfig) => void;
  onAddNewSlot: () => void;
}

export const VisualTimeline24h: React.FC<VisualTimeline24hProps> = ({
  slots,
  context,
  onSelectSlot,
  onAddNewSlot
}) => {
  const currentMinutes = context.currentHour * 60 + context.currentMinute;
  const currentPercent = (currentMinutes / 1440) * 100;

  const hoursMarks = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  // Helper to compute block position & width on the 24h bar
  const getSlotPosition = (slot: TimeSlotConfig) => {
    const startMins = slot.startHour * 60 + slot.startMinute;
    let endMins = slot.endHour * 60 + slot.endMinute;
    if (endMins <= startMins) endMins += 1440; // Wraparound overnight

    const durationMins = endMins - startMins;
    const left = (startMins / 1440) * 100;
    const width = Math.min(100, (durationMins / 1440) * 100);

    return { left, width };
  };

  const nextWpItem = context.nextWallpaperId
    ? WallpaperCatalog.getItemById(context.nextWallpaperId)
    : null;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#080d1a]/90 border border-white/10 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#00F0FF]/10 text-[#00F0FF]">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-['Orbitron'] tracking-wider flex items-center gap-2">
              24-HOUR SMART SCHEDULE TIMELINE
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Local Device Time • Automatic 3D Wallpaper Transitions
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2">
          {context.nextChangeTime && (
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-ping" />
              <span>Next: <strong className="text-white">{context.nextWallpaperName || 'Scheduled World'}</strong></span>
              <span className="text-[#00F0FF]">at {context.nextChangeTime}</span>
            </div>
          )}

          <button
            onClick={onAddNewSlot}
            className="px-3 py-1.5 rounded-xl bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-mono font-bold transition-all active:scale-95"
          >
            + Add Range
          </button>
        </div>
      </div>

      {/* 24-Hour Visual Bar Track */}
      <div className="space-y-2 pt-2">
        <div className="relative h-12 w-full rounded-2xl bg-black/60 border border-white/10 overflow-hidden select-none">
          {/* Render Scheduled Time Blocks */}
          {slots.map((slot) => {
            const { left, width } = getSlotPosition(slot);
            const wp = WallpaperCatalog.getItemById(slot.targetWallpaperId);

            return (
              <div
                key={slot.id}
                onClick={() => onSelectSlot(slot)}
                title={`${slot.name}: ${String(slot.startHour).padStart(2, '0')}:${String(slot.startMinute).padStart(2, '0')} - ${String(slot.endHour).padStart(2, '0')}:${String(slot.endMinute).padStart(2, '0')} (${wp?.name || 'World'})`}
                className={`absolute top-0 bottom-0 cursor-pointer transition-all hover:brightness-125 border-r border-black/40 flex items-center justify-center overflow-hidden px-1 group ${
                  slot.enabled ? 'opacity-90' : 'opacity-40'
                }`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor: slot.color || '#00F0FF'
                }}
              >
                <div className="text-black font-extrabold text-[10px] tracking-tight font-mono truncate px-1 drop-shadow-sm group-hover:scale-105 transition-transform">
                  {slot.name}
                </div>
              </div>
            );
          })}

          {/* Current Time Needle Marker */}
          <div
            className="absolute top-0 bottom-0 z-20 w-0.5 bg-[#FF007F] shadow-[0_0_10px_#FF007F] pointer-events-none transition-all duration-300"
            style={{ left: `${currentPercent}%` }}
          >
            <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 rounded-full bg-[#FF007F] border-2 border-white shadow-[0_0_8px_#FF007F]" />
          </div>
        </div>

        {/* 24-Hour Ticks & Labels */}
        <div className="relative w-full flex justify-between text-[10px] font-mono text-slate-400 px-1">
          {hoursMarks.map((h) => (
            <span key={h} className="text-center">
              {String(h).padStart(2, '0')}:00
            </span>
          ))}
        </div>
      </div>

      {/* Active Time Slot Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {slots.map((slot) => {
          const wp = WallpaperCatalog.getItemById(slot.targetWallpaperId);
          const isCurrent =
            context.activeWallpaperId === slot.targetWallpaperId && slot.enabled;

          return (
            <div
              key={slot.id}
              onClick={() => onSelectSlot(slot)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                isCurrent
                  ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900 border-[#00F0FF]/60 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                  : 'bg-white/5 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className="w-3 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: slot.color || '#00F0FF' }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">{slot.name}</span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.2 rounded bg-[#00F0FF] text-black text-[9px] font-bold font-mono">
                        ACTIVE NOW
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate font-mono">
                    {String(slot.startHour).padStart(2, '0')}:{String(slot.startMinute).padStart(2, '0')} - {String(slot.endHour).padStart(2, '0')}:{String(slot.endMinute).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] text-[#00FFA3] truncate">
                    {wp?.name || 'Procedural Wallpaper'}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 shrink-0 ml-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
