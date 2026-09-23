import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  X,
  Play,
  Heart,
  Copy,
  Edit3,
  BookmarkPlus,
  Share2,
  Cpu,
  Zap,
  Activity,
  Compass,
  Volume2,
  Shield,
  Layers,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { LibraryWallpaperItem } from '../../library/types';

interface WallpaperDetailsModalProps {
  item: LibraryWallpaperItem;
  isActive: boolean;
  onClose: () => void;
  onApply: (item: LibraryWallpaperItem) => void;
  onToggleFavorite: (id: string) => void;
  onDuplicate: (item: LibraryWallpaperItem) => void;
  onEdit?: (item: LibraryWallpaperItem) => void;
  onAddToCollection?: (item: LibraryWallpaperItem) => void;
  onExport?: (item: LibraryWallpaperItem) => void;
}

export const WallpaperDetailsModal: React.FC<WallpaperDetailsModalProps> = ({
  item,
  isActive,
  onClose,
  onApply,
  onToggleFavorite,
  onDuplicate,
  onEdit,
  onAddToCollection,
  onExport
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [touchFeedback, setTouchFeedback] = useState<string>('Ready for gesture input');

  // Mini live interactive 3D WebGL preview
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // Procedural 3D scene elements corresponding to item
    const group = new THREE.Group();
    scene.add(group);

    // Particles system
    const particleCount = 200;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(item.accentColor);
    const color2 = new THREE.Color(item.secondaryColor);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const u = Math.random();
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.2 + Math.random() * 1.5;

      positions[idx] = r * Math.sin(phi) * Math.cos(theta);
      positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[idx + 2] = r * Math.cos(phi);

      const mixed = color1.clone().lerp(color2, u);
      colors[idx] = mixed.r;
      colors[idx + 1] = mixed.g;
      colors[idx + 2] = mixed.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geo, mat);
    group.add(points);

    // Central procedural visual mesh
    const coreGeo = new THREE.IcosahedronGeometry(0.8, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: item.accentColor,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Pointer interactivity
    let targetRotX = 0;
    let targetRotY = 0;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((clientY - rect.top) / rect.height) * 2 - 1);

      targetRotY = x * 1.2;
      targetRotX = -y * 1.2;
      setTouchFeedback(`Orbit: X ${(x * 100).toFixed(0)}% • Y ${(y * 100).toFixed(0)}%`);
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('touchmove', handlePointerMove, { passive: true });

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      group.rotation.y += (targetRotY - group.rotation.y) * 0.08 + delta * 0.2;
      group.rotation.x += (targetRotX - group.rotation.x) * 0.08;
      coreMesh.rotation.z += delta * 0.15;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('touchmove', handlePointerMove);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
    };
  }, [item]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#080d1a] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col md:flex-row overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition-all"
        >
          <X size={18} />
        </button>

        {/* Left Side: 3D Interactive Stage */}
        <div className="w-full md:w-1/2 flex flex-col bg-gradient-to-b from-[#0a1224] to-[#05070e] border-b md:border-b-0 md:border-r border-white/10">
          <div className="relative w-full h-72 sm:h-80 md:h-full min-h-[300px]">
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Stage Overlays */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
              <span className="px-2.5 py-1 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF] text-[10px] font-mono font-bold tracking-wider uppercase">
                {item.category}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-slate-300 text-[10px] font-mono">
                Seed: {item.seed}
              </span>
            </div>

            {/* Gesture Feedback HUD */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <span className="flex items-center gap-1.5">
                <Sparkles size={11} className="text-[#00F0FF]" />
                <span>Interactive WebGL Stage</span>
              </span>
              <span>{touchFeedback}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Metadata & Specs */}
        <div className="w-full md:w-1/2 p-6 sm:p-7 flex flex-col justify-between space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#00FFA3] tracking-wider uppercase font-semibold">
                  {item.environment} • {item.style}
                </span>
                {isActive && (
                  <span className="px-2 py-0.5 rounded-full bg-[#00F0FF] text-black text-[9px] font-mono font-bold">
                    ACTIVE NOW
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-white font-['Orbitron'] tracking-wide mt-1">
                {item.name}
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Technical Specifications Matrix */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <Zap size={12} className="text-emerald-400" />
                  <span>BATTERY IMPACT</span>
                </div>
                <div className="text-xs font-bold text-white uppercase font-mono">
                  {item.batteryImpact}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <Cpu size={12} className="text-cyan-400" />
                  <span>PERFORMANCE</span>
                </div>
                <div className="text-xs font-bold text-white uppercase font-mono">
                  {item.performance}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <Compass size={12} className="text-purple-400" />
                  <span>MOTION / SENSORS</span>
                </div>
                <div className="text-xs font-bold text-white uppercase font-mono">
                  {item.motionSupport}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <Volume2 size={12} className="text-pink-400" />
                  <span>AUDIO REACTIVE</span>
                </div>
                <div className="text-xs font-bold text-white uppercase font-mono">
                  {item.audioReactive ? 'ENABLED' : 'INACTIVE'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <Layers size={12} className="text-amber-400" />
                  <span>WEATHER / BIOME</span>
                </div>
                <div className="text-xs font-bold text-white uppercase font-mono truncate">
                  {item.weather}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <Shield size={12} className="text-indigo-400" />
                  <span>PHYSICS & FORCES</span>
                </div>
                <div className="text-xs font-bold text-white uppercase font-mono">
                  {item.physicsSupport ? 'ACTIVE' : 'STANDARD'}
                </div>
              </div>
            </div>

            {/* Tags Pill List */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400">PROCEDURAL TAGS</span>
              <div className="flex flex-wrap gap-1.5">
                {(item.tags || []).map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 text-[10px] font-mono border border-white/10"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <button
              onClick={() => onApply(item)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#00F0FF] via-[#00A3FF] to-[#7000FF] hover:brightness-110 text-white font-extrabold text-sm shadow-[0_0_25px_rgba(0,240,255,0.4)] active:scale-95 transition-all"
            >
              <Play size={16} fill="white" />
              <span>APPLY AS LIVE WALLPAPER</span>
            </button>

            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => onToggleFavorite(item.id)}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-[10px] font-mono transition-all ${
                  item.isFavorite
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <Heart size={14} className={item.isFavorite ? 'fill-rose-400' : ''} />
                <span>Favorite</span>
              </button>

              <button
                onClick={() => onDuplicate(item)}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[10px] font-mono transition-all"
              >
                <Copy size={14} />
                <span>Duplicate</span>
              </button>

              {onAddToCollection && (
                <button
                  onClick={() => onAddToCollection(item)}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[10px] font-mono transition-all"
                >
                  <BookmarkPlus size={14} />
                  <span>Collect</span>
                </button>
              )}

              {onExport && (
                <button
                  onClick={() => onExport(item)}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[10px] font-mono transition-all"
                >
                  <Share2 size={14} />
                  <span>Export</span>
                </button>
              )}
            </div>

            {onEdit && (item.personalWorld || item.designDNA) && (
              <button
                onClick={() => onEdit(item)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold active:scale-95 transition-all"
              >
                <Edit3 size={14} />
                <span>Edit Parameters in Lab</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
