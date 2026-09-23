import React, { useState } from 'react';
import { TimeSlotConfig, DayOfWeek, DayScheduleType, BuiltinTimePeriod } from '../../scheduler/types';
import { X, Clock, Trash2, Check } from 'lucide-react';
import { WallpaperCatalog } from '../../library/WallpaperCatalog';

interface ScheduleSlotEditorModalProps {
  slot: TimeSlotConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (slot: TimeSlotConfig) => void;
  onDelete?: (id: string) => void;
}

export const ScheduleSlotEditorModal: React.FC<ScheduleSlotEditorModalProps> = ({
  slot,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  if (!isOpen) return null;

  const catalog = WallpaperCatalog.getCatalog();

  const [name, setName] = useState(slot?.name || 'New Schedule Slot');
  const [period, setPeriod] = useState<BuiltinTimePeriod>(slot?.period || 'CUSTOM');
  const [startHour, setStartHour] = useState(slot?.startHour ?? 8);
  const [startMinute, setStartMinute] = useState(slot?.startMinute ?? 0);
  const [endHour, setEndHour] = useState(slot?.endHour ?? 12);
  const [endMinute, setEndMinute] = useState(slot?.endMinute ?? 0);
  const [targetWallpaperId, setTargetWallpaperId] = useState(
    slot?.targetWallpaperId || catalog[0]?.id || 'cosmic-particle-field'
  );
  const [daysType, setDaysType] = useState<DayScheduleType>(slot?.daysType || 'EVERY_DAY');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(
    slot?.selectedDays || [0, 1, 2, 3, 4, 5, 6]
  );
  const [enabled, setEnabled] = useState(slot?.enabled ?? true);
  const [color, setColor] = useState(slot?.color || '#00F0FF');

  const daysList: { day: DayOfWeek; label: string }[] = [
    { day: 1, label: 'Mon' },
    { day: 2, label: 'Tue' },
    { day: 3, label: 'Wed' },
    { day: 4, label: 'Thu' },
    { day: 5, label: 'Fri' },
    { day: 6, label: 'Sat' },
    { day: 0, label: 'Sun' }
  ];

  const toggleDay = (d: DayOfWeek) => {
    if (selectedDays.includes(d)) {
      setSelectedDays(selectedDays.filter((x) => x !== d));
    } else {
      setSelectedDays([...selectedDays, d]);
    }
  };

  const handleSave = () => {
    const updatedSlot: TimeSlotConfig = {
      id: slot?.id || `slot-${Date.now()}`,
      name: name.trim() || 'Schedule Range',
      period,
      startHour: Number(startHour),
      startMinute: Number(startMinute),
      endHour: Number(endHour),
      endMinute: Number(endMinute),
      targetWallpaperId,
      daysType,
      selectedDays,
      enabled,
      color
    };
    onSave(updatedSlot);
    onClose();
  };

  const colors = ['#00F0FF', '#00FFA3', '#FF007F', '#7000FF', '#EAB308', '#3B82F6', '#EC4899'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-[#080d1a] border border-white/10 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[#00F0FF]" />
            <h3 className="text-base font-bold text-white font-['Orbitron']">
              {slot ? 'Edit Time Schedule' : 'Create Time Schedule'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Slot Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-slate-400">RANGE LABEL</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#00F0FF] outline-none"
            placeholder="e.g., Morning Focus"
          />
        </div>

        {/* Time Ranges (Start & End) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400">START TIME</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={23}
                value={startHour}
                onChange={(e) => setStartHour(Math.min(23, Math.max(0, Number(e.target.value))))}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-center font-mono text-sm"
              />
              <span className="text-slate-400">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={startMinute}
                onChange={(e) => setStartMinute(Math.min(59, Math.max(0, Number(e.target.value))))}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-center font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400">END TIME</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={24}
                value={endHour}
                onChange={(e) => setEndHour(Math.min(24, Math.max(0, Number(e.target.value))))}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-center font-mono text-sm"
              />
              <span className="text-slate-400">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={endMinute}
                onChange={(e) => setEndMinute(Math.min(59, Math.max(0, Number(e.target.value))))}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-center font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Wallpaper Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-slate-400">TARGET WALLPAPER</label>
          <select
            value={targetWallpaperId}
            onChange={(e) => setTargetWallpaperId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c1426] border border-white/10 text-white text-sm focus:border-[#00F0FF] outline-none"
          >
            {catalog.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.category})
              </option>
            ))}
          </select>
        </div>

        {/* Days of Week */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-400">DAYS OF WEEK</label>
          <div className="flex gap-2">
            {(['EVERY_DAY', 'WEEKDAYS', 'WEEKENDS', 'CUSTOM'] as DayScheduleType[]).map((type) => (
              <button
                key={type}
                onClick={() => setDaysType(type)}
                className={`flex-1 py-1.5 rounded-xl text-[11px] font-mono transition-all ${
                  daysType === type
                    ? 'bg-[#00F0FF] text-black font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          {daysType === 'CUSTOM' && (
            <div className="flex gap-1.5 pt-1">
              {daysList.map(({ day, label }) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`flex-1 py-1 rounded-lg text-xs font-mono ${
                      isSelected
                        ? 'bg-[#00FFA3] text-black font-bold'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Color Marker */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-slate-400">TIMELINE COLOR</label>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  color === c ? 'scale-110 border-white' : 'border-transparent opacity-70'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Enabled Toggle */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-mono text-slate-300">Enable Schedule Slot</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 accent-[#00F0FF]"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          {slot && onDelete ? (
            <button
              onClick={() => {
                onDelete(slot.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 text-xs font-mono"
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#00F0FF] text-black text-xs font-bold font-mono hover:brightness-110 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              <Check size={15} />
              <span>Save Slot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
