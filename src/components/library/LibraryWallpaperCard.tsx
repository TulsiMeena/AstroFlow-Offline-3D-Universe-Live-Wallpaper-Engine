import React, { useRef, useEffect, useState } from 'react';
import {
  Heart,
  Play,
  Zap,
  BatteryCharging,
  Maximize2,
  Copy,
  Trash2,
  Edit3,
  BookmarkPlus,
  Share2,
  Sparkles,
  Layers,
  Compass,
  Cpu
} from 'lucide-react';
import { LibraryWallpaperItem } from '../../library/types';
import { WallpaperPreviewManager } from '../../library/WallpaperPreviewManager';

interface LibraryWallpaperCardProps {
  item: LibraryWallpaperItem;
  isActive: boolean;
  onOpen: (item: LibraryWallpaperItem) => void;
  onSelectDetails: (item: LibraryWallpaperItem) => void;
  onToggleFavorite: (id: string) => void;
  onDuplicate: (item: LibraryWallpaperItem) => void;
  onDelete?: (item: LibraryWallpaperItem) => void;
  onEdit?: (item: LibraryWallpaperItem) => void;
  onAddToCollection?: (item: LibraryWallpaperItem) => void;
  onExport?: (item: LibraryWallpaperItem) => void;
}

export const LibraryWallpaperCard: React.FC<LibraryWallpaperCardProps> = ({
  item,
  isActive,
  onOpen,
  onSelectDetails,
  onToggleFavorite,
  onDuplicate,
  onDelete,
  onEdit,
  onAddToCollection,
  onExport
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const animFrameRef = useRef<number | null>(null);
  const previewManager = WallpaperPreviewManager.getInstance();

  // Draw procedural thumbnail efficiently
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    let running = true;

    const render = () => {
      if (!running || !canvas) return;
      time += 0.02;
      previewManager.drawProceduralThumbnail(ctx, canvas.width, canvas.height, item, time);

      // Only loop animation if hovered or active preview
      if (isHovered && previewManager.canAnimateCard(item.id)) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [item, isHovered]);

  const getBatteryBadge = (impact: string) => {
    switch (impact) {
      case 'LOW':
        return {
          label: 'Eco Draw',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
        };
      case 'MEDIUM':
        return {
          label: 'Balanced',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        };
      case 'HIGH':
      default:
        return {
          label: 'Ultra Fidelity',
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
        };
    }
  };

  const battery = getBatteryBadge(item.batteryImpact);

  return (
    <div
      onMouseEnter={() => {
        setIsHovered(true);
        previewManager.setActivePreview(item.id);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (previewManager.getActivePreview() === item.id) {
          previewManager.setActivePreview(null);
        }
      }}
      className={`group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 border bg-[#080c16]/80 backdrop-blur-md ${
        isActive
          ? 'border-[#00F0FF] shadow-[0_0_25px_rgba(0,240,255,0.35)] ring-1 ring-[#00F0FF]/40'
          : 'border-white/10 hover:border-white/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)]'
      }`}
    >
      {/* Visual Canvas Container */}
      <div
        onClick={() => onSelectDetails(item)}
        className="relative w-full aspect-[16/10] overflow-hidden cursor-pointer bg-black/40"
      >
        <canvas
          ref={canvasRef}
          width={320}
          height={200}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-black/60 backdrop-blur-md border border-white/15 text-white">
              {item.category}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border backdrop-blur-md ${battery.color}`}>
              {battery.label}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item.id);
            }}
            className={`pointer-events-auto p-1.5 rounded-full backdrop-blur-md transition-all ${
              item.isFavorite
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-black/50 text-slate-300 hover:text-white border border-white/10'
            }`}
            title="Toggle Favorite"
          >
            <Heart size={14} className={item.isFavorite ? 'fill-rose-400' : ''} />
          </button>
        </div>

        {/* Center Hover Action */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(item);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#7000FF] text-white text-xs font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)] active:scale-95 transition-all"
          >
            <Play size={13} fill="white" />
            <span>APPLY</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectDetails(item);
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md active:scale-95 transition-all"
            title="Inspect Details"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        {/* Active Pill Indicator */}
        {isActive && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-[#00F0FF] text-black font-bold text-[9px] font-mono tracking-wider flex items-center gap-1 shadow-[0_0_10px_#00F0FF]">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
            <span>LIVE NOW</span>
          </div>
        )}
      </div>

      {/* Card Information Body */}
      <div className="p-3.5 flex flex-col justify-between flex-1 space-y-2.5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h4
              onClick={() => onSelectDetails(item)}
              className="text-sm font-bold text-white hover:text-[#00F0FF] transition-colors truncate cursor-pointer font-['Orbitron']"
            >
              {item.name}
            </h4>
            <span className="text-[10px] font-mono text-slate-400 shrink-0">
              {item.style}
            </span>
          </div>
          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
            {item.description}
          </p>
        </div>

        {/* Feature Icons Row */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            {item.motionSupport !== 'STATIC' && (
              <span className="flex items-center gap-0.5 text-cyan-400" title="Motion / Gyroscope Support">
                <Compass size={12} />
                <span className="text-[9px]">{item.motionSupport}</span>
              </span>
            )}
            {item.interactiveSupport && (
              <span className="flex items-center gap-0.5 text-emerald-400" title="Touch & Gesture Interactive">
                <Sparkles size={12} />
                <span className="text-[9px]">Touch</span>
              </span>
            )}
            {item.livingWorld && (
              <span className="flex items-center gap-0.5 text-amber-400" title="Living World Simulation">
                <Layers size={12} />
                <span className="text-[9px]">Living</span>
              </span>
            )}
          </div>

          <span className="text-[10px] text-slate-500 font-mono">
            {item.author === 'Created By You' ? 'Custom' : 'Engine'}
          </span>
        </div>

        {/* Card Action Buttons Toolbar */}
        <div className="flex items-center justify-between gap-1 pt-2 border-t border-white/5">
          <button
            onClick={() => onOpen(item)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/30 text-[#00F0FF] text-[11px] font-bold active:scale-95 transition-all"
          >
            <Play size={12} />
            <span>Open</span>
          </button>

          {onAddToCollection && (
            <button
              onClick={() => onAddToCollection(item)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 active:scale-95 transition-all"
              title="Add to Collection"
            >
              <BookmarkPlus size={13} />
            </button>
          )}

          <button
            onClick={() => onDuplicate(item)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 active:scale-95 transition-all"
            title="Duplicate World"
          >
            <Copy size={13} />
          </button>

          {onExport && (
            <button
              onClick={() => onExport(item)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 active:scale-95 transition-all"
              title="Share / Export Code"
            >
              <Share2 size={13} />
            </button>
          )}

          {onEdit && (item.personalWorld || item.designDNA) && (
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 active:scale-95 transition-all"
              title="Edit in Lab"
            >
              <Edit3 size={13} />
            </button>
          )}

          {onDelete && (item.source === 'personal' || item.source === 'fusion') && (
            <button
              onClick={() => onDelete(item)}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 active:scale-95 transition-all"
              title="Delete World"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
