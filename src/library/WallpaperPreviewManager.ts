import * as THREE from 'three';
import { LibraryWallpaperItem } from './types';

export class WallpaperPreviewManager {
  private static instance: WallpaperPreviewManager | null = null;
  private activePreviewId: string | null = null;
  private previewSubscribers: Set<(activeId: string | null) => void> = new Set();
  private isScrolling: boolean = false;
  private scrollTimeout: any = null;

  public static getInstance(): WallpaperPreviewManager {
    if (!WallpaperPreviewManager.instance) {
      WallpaperPreviewManager.instance = new WallpaperPreviewManager();
    }
    return WallpaperPreviewManager.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    }
  }

  private handleScroll(): void {
    this.isScrolling = true;
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
    }, 200);
  }

  public canAnimateCard(cardId: string): boolean {
    if (this.isScrolling) return false;
    // Allow animation only for the active/hovered card or a single focused card
    return this.activePreviewId === cardId;
  }

  public setActivePreview(id: string | null): void {
    if (this.activePreviewId === id) return;
    this.activePreviewId = id;
    for (const sub of this.previewSubscribers) {
      sub(id);
    }
  }

  public getActivePreview(): string | null {
    return this.activePreviewId;
  }

  public subscribe(callback: (activeId: string | null) => void): () => void {
    this.previewSubscribers.add(callback);
    return () => {
      this.previewSubscribers.delete(callback);
    };
  }

  /**
   * Generates a deterministic high-performance canvas visual signature
   * without running heavy full-scene 3D loops for every card.
   */
  public drawProceduralThumbnail(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    item: LibraryWallpaperItem,
    time: number = 0
  ): void {
    const seed = item.numericSeed;
    ctx.clearRect(0, 0, width, height);

    // Deep Dark AMOLED Canvas
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 0, width, height);

    // Radial gradient glow based on accent colors
    const cx = width * (0.35 + ((seed % 30) / 100));
    const cy = height * (0.4 + ((seed % 20) / 100));
    const radius = Math.max(width, height) * 0.75;

    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
    grad.addColorStop(0, item.accentColor + '55');
    grad.addColorStop(0.5, item.secondaryColor + '25');
    grad.addColorStop(1, '#06081000');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Category-specific procedural element
    const particleCount = 20;
    ctx.save();
    for (let i = 0; i < particleCount; i++) {
      const pSeed = (seed + i * 199) % 10000;
      const angle = (pSeed / 10000) * Math.PI * 2;
      const dist = ((pSeed % 300) / 300) * (width * 0.45);
      const px = width / 2 + Math.cos(angle + time * 0.5) * dist;
      const py = height / 2 + Math.sin(angle + time * 0.5) * (dist * 0.6);
      const size = 1 + (pSeed % 3.5);

      ctx.fillStyle = i % 2 === 0 ? item.accentColor : item.secondaryColor;
      ctx.globalAlpha = 0.4 + 0.5 * Math.sin(time * 2 + i);
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Geometric accent ring
    ctx.save();
    ctx.strokeStyle = item.accentColor + '40';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, width * 0.38, height * 0.22, (seed % 60) * 0.05, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
