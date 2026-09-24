import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, RotateCcw } from 'lucide-react';
import { ErrorManager } from '../../diagnostics/ErrorManager';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Amit HyperWall] React Error Boundary caught:', error, errorInfo);
    ErrorManager.getInstance().reportError({
      category: 'RUNTIME',
      severity: 'FATAL',
      message: error?.message || 'Component render exception',
      userFacingMessage: 'Interface crashed during rendering.',
      recoverable: true,
      technicalDetails: errorInfo?.componentStack || error?.stack
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#05070E] text-white">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#0c1324] border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.25)] text-center space-y-5">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertOctagon size={28} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-wide font-['Orbitron'] text-white">
                Engine UI Exception
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                An unexpected UI rendering error occurred. You can reload or reset to safe factory defaults.
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-red-300 text-left overflow-x-auto max-h-32">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#00d8e6] text-black font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
              >
                <RefreshCw size={14} />
                <span>Reload</span>
              </button>

              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
              >
                <RotateCcw size={14} />
                <span>Safe Reset</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
