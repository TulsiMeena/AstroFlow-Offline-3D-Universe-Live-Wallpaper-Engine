import React from 'react';
import { QualityProfile } from '../types/engine';
import { Zap } from 'lucide-react';

interface QualityBadgeProps {
  quality: QualityProfile;
  onChange?: (quality: QualityProfile) => void;
  interactive?: boolean;
}

export const QualityBadge: React.FC<QualityBadgeProps> = ({
  quality,
  onChange,
  interactive = false
}) => {
  const profiles: QualityProfile[] = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];

  const getStyle = (p: QualityProfile) => {
    switch (p) {
      case 'ULTRA':
        return 'text-[#FF00EA] border-[#FF00EA]/40 bg-[#FF00EA]/10 shadow-[0_0_10px_rgba(255,0,234,0.2)]';
      case 'HIGH':
        return 'text-[#00F0FF] border-[#00F0FF]/40 bg-[#00F0FF]/10 shadow-[0_0_10px_rgba(0,240,255,0.2)]';
      case 'MEDIUM':
        return 'text-[#00FFA3] border-[#00FFA3]/40 bg-[#00FFA3]/10';
      case 'LOW':
        return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
    }
  };

  if (!interactive) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-wider ${getStyle(quality)}`}>
        <Zap size={10} />
        {quality}
      </span>
    );
  }

  return (
    <div className="inline-flex p-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md gap-1">
      {profiles.map((p) => {
        const isSelected = p === quality;
        return (
          <button
            key={p}
            onClick={() => onChange?.(p)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
              isSelected
                ? getStyle(p) + ' scale-105'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
};
