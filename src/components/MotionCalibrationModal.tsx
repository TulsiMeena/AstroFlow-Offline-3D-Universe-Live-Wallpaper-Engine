import React, { useState, useEffect } from 'react';
import { MotionManager } from '../engine/MotionManager';
import { MotionCalibrationSettings, MotionData } from '../types/engine';
import { Smartphone, RotateCcw, Crosshair, Check, X, ShieldAlert, Sparkles } from 'lucide-react';

interface MotionCalibrationModalProps {
  motionManager: MotionManager;
  isOpen: boolean;
  onClose: () => void;
}

export const MotionCalibrationModal: React.FC<MotionCalibrationModalProps> = ({
  motionManager,
  isOpen,
  onClose
}) => {
  const [settings, setSettings] = useState<MotionCalibrationSettings>(() => motionManager.getSettings());
  const [motionData, setMotionData] = useState<MotionData>(() => motionManager.getMotionData());
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [calibratedSuccess, setCalibratedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Fast interval for smooth visual bubble level feedback
    const interval = window.setInterval(() => {
      setMotionData(motionManager.getMotionData());
    }, 33);

    return () => clearInterval(interval);
  }, [isOpen, motionManager]);

  if (!isOpen) return null;

  const handleUpdate = (partial: Partial<MotionCalibrationSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    motionManager.updateCalibration(partial);
  };

  const handleCalibrateCenter = () => {
    motionManager.calibrateCenter();
    setSettings(motionManager.getSettings());
    setCalibratedSuccess(true);
    setTimeout(() => setCalibratedSuccess(false), 1500);
  };

  const handleResetCalibration = () => {
    motionManager.resetCalibration();
    setSettings(motionManager.getSettings());
  };

  const handleRequestPermission = async () => {
    const granted = await motionManager.requestSensorPermission();
    setPermissionState(granted ? 'granted' : 'denied');
  };

  // Clamp bubble coordinates for visual level [-40, 40]
  const bubbleX = Math.max(-40, Math.min(40, motionData.tiltX * 40));
  const bubbleY = Math.max(-40, Math.min(40, -motionData.tiltY * 40));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0a0f1d] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl shadow-cyan-950/50 space-y-5 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Smartphone size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Orbitron'] tracking-wide">
                MOTION & SENSOR CALIBRATION
              </h2>
              <p className="text-xs text-slate-400">Sensor Fusion • 3D Parallax Calibration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Real-time Bubble Level & Guidance */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-cyan-950/20 to-black/40 border border-cyan-500/20 space-y-3">
          <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase font-semibold">
            Move your phone naturally
          </span>

          <div className="relative w-36 h-36 rounded-full border-2 border-dashed border-cyan-500/40 flex items-center justify-center bg-black/60 shadow-inner">
            {/* Center crosshairs */}
            <div className="absolute w-full h-[1px] bg-cyan-500/20" />
            <div className="absolute h-full w-[1px] bg-cyan-500/20" />
            <div className="w-12 h-12 rounded-full border border-cyan-400/30" />

            {/* Bubble element */}
            <div
              className="absolute w-6 h-6 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 shadow-lg shadow-cyan-400/50 transition-transform duration-75"
              style={{
                transform: `translate(${bubbleX}px, ${bubbleY}px)`
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 w-full text-center text-[11px] font-mono text-slate-400 pt-1">
            <div className="p-2 rounded-xl bg-white/5">
              <span className="text-slate-500 block text-[9px]">PITCH</span>
              <span className="text-cyan-300 font-bold">{(motionData.tiltY * 90).toFixed(1)}°</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5">
              <span className="text-slate-500 block text-[9px]">ROLL</span>
              <span className="text-cyan-300 font-bold">{(motionData.tiltX * 90).toFixed(1)}°</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5">
              <span className="text-slate-500 block text-[9px]">SENSOR</span>
              <span className={motionData.isAvailable ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {motionData.isAvailable ? 'ACTIVE' : 'TOUCH SIM'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Calibrate Center & Reset */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCalibrateCenter}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/20"
          >
            {calibratedSuccess ? <Check size={16} /> : <Crosshair size={16} />}
            {calibratedSuccess ? 'CALIBRATED!' : 'SET CENTER'}
          </button>

          <button
            onClick={handleResetCalibration}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/10 active:scale-95 transition-all"
          >
            <RotateCcw size={16} />
            RESET DEFAULTS
          </button>
        </div>

        {/* Sensor Permission Request (iOS / Secure environments) */}
        {!motionData.isAvailable && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              <ShieldAlert size={16} />
              <span>Enable hardware gyro permissions</span>
            </div>
            <button
              onClick={handleRequestPermission}
              className="py-1.5 px-3 rounded-lg bg-amber-500 text-black font-bold text-[11px] hover:bg-amber-400"
            >
              Request
            </button>
          </div>
        )}

        {/* Controls and Sliders */}
        <div className="space-y-4 pt-2">
          {/* Motion Master Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <div>
              <span className="text-xs font-semibold text-white block">Device Motion & Tilt</span>
              <span className="text-[11px] text-slate-400">Drive 3D perspective with phone rotation</span>
            </div>
            <button
              onClick={() => handleUpdate({ enabled: !settings.enabled })}
              className={`w-11 h-6 rounded-full p-1 transition-all ${
                settings.enabled ? 'bg-cyan-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-black transition-transform ${
                  settings.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <div>
              <span className="text-xs font-semibold text-white block">Reduced Motion Mode</span>
              <span className="text-[11px] text-slate-400">Damps camera movement and sudden flashes</span>
            </div>
            <button
              onClick={() => handleUpdate({ reducedMotion: !settings.reducedMotion })}
              className={`w-11 h-6 rounded-full p-1 transition-all ${
                settings.reducedMotion ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-black transition-transform ${
                  settings.reducedMotion ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sensitivity Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Sensitivity Multiplier</span>
              <span className="text-cyan-400 font-bold">{settings.sensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.8"
              step="0.1"
              value={settings.sensitivity}
              onChange={e => handleUpdate({ sensitivity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Motion Smoothing Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Cinematic Damping / Smoothing</span>
              <span className="text-cyan-400 font-bold">{(settings.smoothing * 10).toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.25"
              step="0.01"
              value={settings.smoothing}
              onChange={e => handleUpdate({ smoothing: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Invert Axis Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => handleUpdate({ invertX: !settings.invertX })}
              className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium transition-all ${
                settings.invertX
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                  : 'border-white/10 bg-white/5 text-slate-400'
              }`}
            >
              Invert Roll (X): {settings.invertX ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => handleUpdate({ invertY: !settings.invertY })}
              className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium transition-all ${
                settings.invertY
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                  : 'border-white/10 bg-white/5 text-slate-400'
              }`}
            >
              Invert Pitch (Y): {settings.invertY ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold font-mono tracking-wider transition-all"
          >
            APPLY & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
