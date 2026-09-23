import React, { useState } from 'react';
import { SchedulerHistoryItem } from '../../scheduler/types';
import { SchedulerHistoryManager } from '../../scheduler/SchedulerHistoryManager';
import { X, Clock, Trash2, ArrowRight } from 'lucide-react';

interface SchedulerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchedulerHistoryModal: React.FC<SchedulerHistoryModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const historyManager = SchedulerHistoryManager.getInstance();
  const [history, setHistory] = useState<SchedulerHistoryItem[]>(historyManager.getHistory());

  const handleClear = () => {
    historyManager.clear();
    setHistory([]);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-[#080d1a] border border-white/10 shadow-2xl p-6 space-y-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[#00FFA3]" />
            <div>
              <h3 className="text-base font-bold text-white font-['Orbitron']">
                AUTOMATION TRIGGER LOG
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Recent automated wallpaper switches and context triggers
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

        {/* List of Log Items */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              No automation triggers recorded yet.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate">{item.wallpaperName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#00F0FF] font-mono mt-0.5 truncate">
                    {item.reason}
                  </div>
                </div>

                {item.mode && item.mode !== 'NONE' && (
                  <span className="px-2 py-0.5 rounded-full bg-[#7000FF]/20 text-[#00FFA3] text-[9px] font-mono font-bold shrink-0">
                    {item.mode}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            onClick={handleClear}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-red-400 hover:bg-red-500/10 text-xs font-mono disabled:opacity-30"
          >
            <Trash2 size={14} />
            <span>Clear Log</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
