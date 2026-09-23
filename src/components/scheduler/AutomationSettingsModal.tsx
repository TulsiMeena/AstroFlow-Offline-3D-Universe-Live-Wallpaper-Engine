import React, { useState } from 'react';
import { SchedulerSettings, RotationMode, TransitionType } from '../../scheduler/types';
import { SmartSchedulerEngine } from '../../scheduler/SmartSchedulerEngine';
import { X, Settings2, Sliders, Check } from 'lucide-react';

interface AutomationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutomationSettingsModal: React.FC<AutomationSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const engine = SmartSchedulerEngine.getInstance();
  const [settings, setSettings] = useState<SchedulerSettings>(engine.getSettings());

  const handleToggle = (key: keyof SchedulerSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    engine.updateSettings(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-[#080d1a] border border-white/10 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Settings2 size={18} className="text-[#00F0FF]" />
            <div>
              <h3 className="text-base font-bold text-white font-['Orbitron']">
                SCHEDULER & ROTATION SETTINGS
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Configure offline automation policies and visual transition dynamics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Master Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
            <div>
              <div className="text-xs font-bold text-white">Master Automation Engine</div>
              <div className="text-[10px] text-slate-400 font-mono">
                Enable smart context evaluation and automatic switches
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={() => handleToggle('enabled')}
              className="w-5 h-5 accent-[#00F0FF]"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
            <div>
              <div className="text-xs font-bold text-white">Time-of-Day Scheduling</div>
              <div className="text-[10px] text-slate-400 font-mono">
                Follow 24-hour visual schedule timeline
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.timeSchedulingEnabled}
              onChange={() => handleToggle('timeSchedulingEnabled')}
              className="w-5 h-5 accent-[#00F0FF]"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
            <div>
              <div className="text-xs font-bold text-white">Battery Context Rules</div>
              <div className="text-[10px] text-slate-400 font-mono">
                Auto-switch to dark AMOLED worlds on low battery (if supported)
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.batteryRulesEnabled}
              onChange={() => handleToggle('batteryRulesEnabled')}
              className="w-5 h-5 accent-[#00F0FF]"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
            <div>
              <div className="text-xs font-bold text-white">Charging High Performance</div>
              <div className="text-[10px] text-slate-400 font-mono">
                Unlock maximal visual fidelity and energetic worlds while plugged in
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.allowHighQualityWhileCharging}
              onChange={() => handleToggle('allowHighQualityWhileCharging')}
              className="w-5 h-5 accent-[#00F0FF]"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
            <div>
              <div className="text-xs font-bold text-white">Respect Reduced Motion</div>
              <div className="text-[10px] text-slate-400 font-mono">
                Limit transition animations and camera velocity for accessibility
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.respectReducedMotion}
              onChange={() => handleToggle('respectReducedMotion')}
              className="w-5 h-5 accent-[#00F0FF]"
            />
          </div>
        </div>

        {/* Rotation Mode & Interval */}
        <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
            <Sliders size={14} className="text-[#00FFA3]" />
            AUTOMATIC ROTATION POLICY
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">ROTATION MODE</label>
              <select
                value={settings.rotationMode}
                onChange={(e) =>
                  setSettings({ ...settings, rotationMode: e.target.value as RotationMode })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0c1426] border border-white/10 text-white text-xs font-mono"
              >
                <option value="SCHEDULED">Scheduled Only</option>
                <option value="FIXED_INTERVAL">Fixed Interval</option>
                <option value="RANDOM">Smart Random</option>
                <option value="SEQUENTIAL">Sequential Cycle</option>
                <option value="SMART">Smart Context-Aware</option>
                <option value="MANUAL">Manual Only</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">INTERVAL (MINUTES)</label>
              <select
                value={settings.defaultRotationIntervalMinutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultRotationIntervalMinutes: Number(e.target.value)
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0c1426] border border-white/10 text-white text-xs font-mono"
              >
                <option value={5}>Every 5 minutes</option>
                <option value={10}>Every 10 minutes</option>
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every 1 hour</option>
                <option value={120}>Every 2 hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transitions Engine */}
        <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-xs font-bold text-white font-mono">3D TRANSITION DYNAMICS</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">EFFECT STYLE</label>
              <select
                value={settings.defaultTransition}
                onChange={(e) =>
                  setSettings({ ...settings, defaultTransition: e.target.value as TransitionType })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0c1426] border border-white/10 text-white text-xs font-mono"
              >
                <option value="crossfade">Smooth Crossfade</option>
                <option value="smooth_camera">Smooth Camera Pan</option>
                <option value="particle_dissolve">Particle Dissolve</option>
                <option value="portal">Glowing Portal</option>
                <option value="energy">Energy Burst</option>
                <option value="fade">AMOLED Fade</option>
                <option value="instant">Instant Swap</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-mono text-slate-400">DURATION</label>
                <span className="text-[11px] font-mono text-[#00F0FF]">
                  {settings.defaultTransitionDuration.toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={4.0}
                step={0.1}
                value={settings.defaultTransitionDuration}
                onChange={(e) =>
                  setSettings({ ...settings, defaultTransitionDuration: Number(e.target.value) })
                }
                className="w-full accent-[#00F0FF]"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
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
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
