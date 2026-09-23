import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Cpu, Activity, ShieldAlert } from 'lucide-react';
import { DiagnosticManager } from '../../diagnostics/DiagnosticManager';

interface WebGLFailureScreenProps {
  onRetry: () => void;
  onLowPerformanceMode: () => void;
  errorDetails?: string;
}

export const WebGLFailureScreen: React.FC<WebGLFailureScreenProps> = ({
  onRetry,
  onLowPerformanceMode,
  errorDetails
}) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticsReport, setDiagnosticsReport] = useState('');

  const handleToggleDiagnostics = () => {
    if (!showDiagnostics) {
      setDiagnosticsReport(DiagnosticManager.getInstance().formatDiagnosticsReport());
    }
    setShowDiagnostics(!showDiagnostics);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03060f]/95 backdrop-blur-xl">
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0e1628] to-[#070c18] border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center space-y-6">
        {/* Warning Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
          <AlertTriangle size={32} />
        </div>

        {/* Header */}
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-bold tracking-wider">
            GRAPHICS HARDWARE NOTICE
          </span>
          <h2 className="text-xl sm:text-2xl font-black font-['Orbitron'] tracking-wide text-white">
            3D Rendering Unavailable
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            3D rendering is unavailable on this device/browser. The graphics processor either encountered context loss, memory pressure, or lacks WebGL2 support.
          </p>
          {errorDetails && (
            <p className="text-xs text-amber-400/80 font-mono mt-1 bg-black/40 p-2 rounded-xl border border-amber-500/20">
              {errorDetails}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#00F0FF] hover:bg-[#00d8e6] text-black font-extrabold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
          >
            <RefreshCw size={16} />
            <span>Retry Engine</span>
          </button>

          <button
            onClick={onLowPerformanceMode}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
          >
            <Cpu size={16} className="text-[#00FFA3]" />
            <span>Safe Low Mode</span>
          </button>
        </div>

        {/* Diagnostic Toggle Button */}
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={handleToggleDiagnostics}
            className="flex items-center justify-center gap-1.5 text-xs font-mono text-slate-400 hover:text-[#00F0FF] transition-colors mx-auto"
          >
            <Activity size={14} />
            <span>{showDiagnostics ? 'Hide System Diagnostics' : 'View Diagnostic Information'}</span>
          </button>

          {showDiagnostics && (
            <div className="mt-4 text-left p-4 rounded-2xl bg-black/60 border border-white/10 text-slate-300 font-mono text-[11px] max-h-52 overflow-y-auto whitespace-pre-wrap">
              {diagnosticsReport}
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-500 font-mono">
          Amit HyperWall Engine • 100% Offline Procedural Architecture
        </p>
      </div>
    </div>
  );
};
