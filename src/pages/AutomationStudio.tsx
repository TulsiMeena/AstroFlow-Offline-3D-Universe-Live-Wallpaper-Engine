import React, { useState, useEffect } from 'react';
import {
  SmartSchedulerEngine,
  ContextStateManager,
  ContextState,
  TimeSlotConfig,
  WallpaperSet,
  AutomationMode
} from '../scheduler';
import { VisualTimeline24h } from '../components/scheduler/VisualTimeline24h';
import { AutomationDashboard } from '../components/scheduler/AutomationDashboard';
import { ScheduleSlotEditorModal } from '../components/scheduler/ScheduleSlotEditorModal';
import { RulesManagerModal } from '../components/scheduler/RulesManagerModal';
import { WallpaperSetsEditor } from '../components/scheduler/WallpaperSetsEditor';
import { SchedulerHistoryModal } from '../components/scheduler/SchedulerHistoryModal';
import { AutomationSettingsModal } from '../components/scheduler/AutomationSettingsModal';
import { Clock, Play, Pause, RotateCw, Sparkles, Sliders } from 'lucide-react';

interface AutomationStudioProps {
  onApplyWallpaper: (wallpaperId: string) => void;
  onOpenLivePreview?: () => void;
}

export const AutomationStudio: React.FC<AutomationStudioProps> = ({
  onApplyWallpaper,
  onOpenLivePreview
}) => {
  const engine = SmartSchedulerEngine.getInstance();
  const contextManager = ContextStateManager.getInstance();
  const scheduleManager = engine.getScheduleRuleManager();

  const [context, setContext] = useState<ContextState>(contextManager.getState());
  const [slots, setSlots] = useState<TimeSlotConfig[]>(scheduleManager.getAllSlots());
  const [settings, setSettings] = useState(engine.getSettings());

  // Modals state
  const [slotEditorOpen, setSlotEditorOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlotConfig | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [setsOpen, setSetsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Subscribe to context updates
  useEffect(() => {
    const unsub = contextManager.subscribe((newState) => {
      setContext(newState);
    });
    return unsub;
  }, []);

  const refreshSlots = () => {
    setSlots(scheduleManager.getAllSlots());
  };

  const handleToggleMasterEnabled = () => {
    const updated = !settings.enabled;
    engine.updateSettings({ enabled: updated });
    setSettings(engine.getSettings());
  };

  const handleTriggerManualRotate = () => {
    engine.getRotationEngine().executeIntervalStep();
  };

  const handleActivateSpecialMode = (mode: AutomationMode) => {
    const wpId = engine['contextEngine'].getWallpaperForSpecialMode(mode);
    engine.applyWallpaperChange(wpId, `Manual Override: ${mode}`);
    onApplyWallpaper(wpId);
  };

  const handleSaveSlot = (slot: TimeSlotConfig) => {
    if (editingSlot) {
      scheduleManager.updateSlot(slot);
    } else {
      scheduleManager.createSlot(slot);
    }
    refreshSlots();
  };

  const handleDeleteSlot = (id: string) => {
    scheduleManager.deleteSlot(id);
    refreshSlots();
  };

  const handleActivateSet = (set: WallpaperSet) => {
    const nextWp = engine.getWallpaperSetManager().getNextWallpaperInSet(set.id);
    if (nextWp) {
      engine.applyWallpaperChange(nextWp, `Wallpaper Pack: ${set.name}`);
      onApplyWallpaper(nextWp);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto pt-16 pb-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
      {/* Top Banner / Hero */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0c1426]/90 via-[#070b16]/90 to-[#0e0d22]/90 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#00F0FF]/20 to-[#7000FF]/30 border border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <Clock size={24} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-wide font-['Orbitron'] text-white">
                SMART <span className="text-[#00F0FF]">SCHEDULER</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                100% OFFLINE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Local Context Automation • 24-Hour Timeline • Battery-Aware Procedural Switching
            </p>
          </div>
        </div>

        {/* Master Control Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTriggerManualRotate}
            title="Rotate Next Wallpaper Now"
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all active:scale-95 flex items-center gap-1.5 text-xs font-mono"
          >
            <RotateCw size={15} />
            <span className="hidden sm:inline">Rotate Next</span>
          </button>

          <button
            onClick={handleToggleMasterEnabled}
            className={`px-4 py-2.5 rounded-2xl border text-xs font-mono font-bold transition-all flex items-center gap-2 active:scale-95 shadow-lg ${
              settings.enabled
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-emerald-950/40'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            {settings.enabled ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>SCHEDULER RUNNING</span>
              </>
            ) : (
              <>
                <Pause size={14} />
                <span>SCHEDULER PAUSED</span>
              </>
            )}
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2.5 rounded-2xl bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] transition-all active:scale-95"
            title="Configure Settings"
          >
            <Sliders size={18} />
          </button>
        </div>
      </div>

      {/* 24-Hour Visual Schedule Timeline */}
      <VisualTimeline24h
        slots={slots}
        context={context}
        onSelectSlot={(slot) => {
          setEditingSlot(slot);
          setSlotEditorOpen(true);
        }}
        onAddNewSlot={() => {
          setEditingSlot(null);
          setSlotEditorOpen(true);
        }}
      />

      {/* Automation Dashboard & Quick Override Modes */}
      <AutomationDashboard
        context={context}
        onActivateSpecialMode={handleActivateSpecialMode}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenSets={() => setSetsOpen(true)}
        onOpenRules={() => setRulesOpen(true)}
      />

      {/* Modals */}
      <ScheduleSlotEditorModal
        slot={editingSlot}
        isOpen={slotEditorOpen}
        onClose={() => setSlotEditorOpen(false)}
        onSave={handleSaveSlot}
        onDelete={editingSlot ? handleDeleteSlot : undefined}
      />

      <RulesManagerModal
        isOpen={rulesOpen}
        context={context}
        onClose={() => setRulesOpen(false)}
      />

      <WallpaperSetsEditor
        isOpen={setsOpen}
        onClose={() => setSetsOpen(false)}
        onActivateSet={handleActivateSet}
      />

      <SchedulerHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      <AutomationSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};
