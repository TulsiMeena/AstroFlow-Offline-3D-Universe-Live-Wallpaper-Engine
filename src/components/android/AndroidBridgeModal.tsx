import React, { useState, useEffect } from 'react';
import { X, Smartphone, Check, Copy, Terminal, Shield, Play, Pause, RefreshCw, Cpu, Layers } from 'lucide-react';
import { AndroidWallpaperBridge } from '../../android/AndroidWallpaperBridge';
import { AMIT_HYPERWALL_SERVICE_CONTRACT, KOTLIN_WALLPAPER_SERVICE_TEMPLATE } from '../../android/AmitHyperWallWallpaperServiceContract';
import { AndroidBridgeMessage, AndroidDeviceState } from '../../android/types';
import { WallpaperStorage } from '../../storage/wallpaperStorage';

interface AndroidBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidBridgeModal: React.FC<AndroidBridgeModalProps> = ({ isOpen, onClose }) => {
  const bridge = AndroidWallpaperBridge.getInstance();
  const [isNative, setIsNative] = useState(bridge.isNativeHost());
  const [deviceState, setDeviceState] = useState<AndroidDeviceState | null>(bridge.getLatestDeviceState());
  const [messages, setMessages] = useState<AndroidBridgeMessage[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'service' | 'protocol' | 'test'>('service');

  useEffect(() => {
    if (!isOpen) return;
    setIsNative(bridge.isNativeHost());

    const unsubState = bridge.subscribeDeviceState((state) => {
      setDeviceState(state);
    });

    const unsubMsg = bridge.subscribeMessages((msg) => {
      setMessages((prev) => [msg, ...prev.slice(0, 19)]);
    });

    return () => {
      unsubState();
      unsubMsg();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyKotlin = async () => {
    try {
      await navigator.clipboard.writeText(KOTLIN_WALLPAPER_SERVICE_TEMPLATE.trim());
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleTriggerTestCommand = (type: string) => {
    const prefs = WallpaperStorage.getPreferences();
    if (type === 'RESUME') {
      bridge.resumeWallpaper();
    } else if (type === 'PAUSE') {
      bridge.pauseWallpaper();
    } else if (type === 'SET_WALLPAPER') {
      bridge.setWallpaper(prefs.activeWallpaperId);
    } else if (type === 'SET_QUALITY') {
      bridge.setQuality(prefs.qualityProfile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-3xl rounded-3xl bg-[#070b16] border border-white/10 shadow-2xl p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#00FFA3]/10 text-[#00FFA3] border border-[#00FFA3]/30">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-['Orbitron'] tracking-wide">
                  ANDROID LIVE WALLPAPER BRIDGE
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${isNative ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                  {isNative ? 'NATIVE HOST CONNECTED' : 'BROWSER SIMULATION HOST'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                IPC Service Contract • Android WallpaperService Architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('service')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${activeTab === 'service' ? 'bg-[#00FFA3]/20 text-[#00FFA3] border border-[#00FFA3]/40' : 'text-slate-400 hover:text-white'}`}
          >
            Service Contract
          </button>
          <button
            onClick={() => setActiveTab('protocol')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${activeTab === 'protocol' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40' : 'text-slate-400 hover:text-white'}`}
          >
            Live IPC Protocol
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${activeTab === 'test' ? 'bg-[#7000FF]/20 text-[#7000FF] border border-[#7000FF]/40' : 'text-slate-400 hover:text-white'}`}
          >
            Bridge Test Suite
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Service Contract Tab */}
          {activeTab === 'service' && (
            <div className="space-y-4">
              {/* Architecture Summary */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wide">
                  <Shield size={14} className="text-[#00FFA3]" />
                  <span>Native Architecture & Sandbox Notice</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Standard Web Browsers and PWAs cannot directly replace the Android OS system wallpaper due to system security barriers. When Amit HyperWall is packaged as an Android application, the <code className="text-[#00FFA3] font-mono">AmitHyperWallWallpaperService</code> bridges the WebGL rendering surface directly into the Android System Live Wallpaper Manager.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-500 block">Service:</span>
                    <span className="text-white font-bold">{AMIT_HYPERWALL_SERVICE_CONTRACT.serviceName}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-500 block">Package Target:</span>
                    <span className="text-[#00F0FF] font-bold">{AMIT_HYPERWALL_SERVICE_CONTRACT.packageTarget}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-500 block">Min SDK:</span>
                    <span className="text-white font-bold">{AMIT_HYPERWALL_SERVICE_CONTRACT.minSdkVersion} (Android 8.0)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-500 block">Target SDK:</span>
                    <span className="text-[#00FFA3] font-bold">{AMIT_HYPERWALL_SERVICE_CONTRACT.targetSdkVersion} (Android 14)</span>
                  </div>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Kotlin WallpaperService Contract:</span>
                  <button
                    onClick={handleCopyKotlin}
                    className="flex items-center gap-1 text-[#00FFA3] hover:underline"
                  >
                    {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedCode ? 'Copied Contract' : 'Copy Kotlin Template'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-black/70 border border-white/10 text-slate-300 font-mono text-[11px] max-h-56 overflow-y-auto whitespace-pre">
                  {KOTLIN_WALLPAPER_SERVICE_TEMPLATE.trim()}
                </pre>
              </div>
            </div>
          )}

          {/* Protocol Tab */}
          {activeTab === 'protocol' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal size={14} className="text-[#00F0FF]" /> IPC Activity Monitor
                  </span>
                  <span className="text-slate-500">{messages.length} Events Logged</span>
                </div>
                {messages.length === 0 ? (
                  <div className="text-center py-6 text-xs font-mono text-slate-500">
                    No IPC messages transmitted yet. Trigger a command in the Bridge Test Suite to view message payload serialization.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {messages.map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-black/50 border border-white/5 text-[11px] font-mono space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[#00FFA3] font-bold">[{m.type}]</span>
                          <span className="text-slate-500">{new Date(m.timestamp).toLocaleTimeString()}</span>
                        </div>
                        {m.payload && (
                          <pre className="text-slate-400 text-[10px] overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(m.payload, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Suite Tab */}
          {activeTab === 'test' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Test Native Bridge Dispatch
                </h4>
                <p className="text-xs text-slate-400">
                  Simulate dispatching lifecycle commands through the Android Live Wallpaper IPC layer:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleTriggerTestCommand('RESUME')}
                    className="flex items-center justify-center gap-1.5 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold"
                  >
                    <Play size={14} /> Resume (Screen On)
                  </button>
                  <button
                    onClick={() => handleTriggerTestCommand('PAUSE')}
                    className="flex items-center justify-center gap-1.5 p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold"
                  >
                    <Pause size={14} /> Pause (Lock/Hide)
                  </button>
                  <button
                    onClick={() => handleTriggerTestCommand('SET_WALLPAPER')}
                    className="flex items-center justify-center gap-1.5 p-3 rounded-xl bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-mono font-bold"
                  >
                    <Layers size={14} /> Sync Wallpaper
                  </button>
                  <button
                    onClick={() => handleTriggerTestCommand('SET_QUALITY')}
                    className="flex items-center justify-center gap-1.5 p-3 rounded-xl bg-[#7000FF]/10 hover:bg-[#7000FF]/20 border border-[#7000FF]/30 text-[#7000FF] text-xs font-mono font-bold"
                  >
                    <Cpu size={14} /> Push Quality
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="text-[11px] font-mono text-slate-500">
            Amit HyperWall Live Wallpaper System • Owner: Amit Meena
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
