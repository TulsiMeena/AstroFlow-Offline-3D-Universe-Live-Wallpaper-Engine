import { TouchPointerState } from '../types/engine';

export class InputManager {
  private element: HTMLElement | null = null;
  private state: TouchPointerState = {
    x: 0,
    y: 0,
    deltaX: 0,
    deltaY: 0,
    isDown: false,
    pinchScale: 1.0,
    worldX: 0,
    worldY: 0,
    gestureType: 'none',
    energyPulse: 0,
    longPressActive: false,
    swipeDirection: { x: 0, y: 0, speed: 0 },
    pointerCount: 0
  };

  // Gesture tracking variables
  private pointerDownTime: number = 0;
  private pointerDownX: number = 0;
  private pointerDownY: number = 0;
  private isDragging: boolean = false;
  private longPressTimer: number | null = null;
  private recentVelocities: { dx: number; dy: number; dt: number }[] = [];
  private lastTouchDistance: number = 0;

  // Active touch points
  private activePointers: Map<number, { x: number; y: number }> = new Map();

  // Bound listeners
  private boundPointerDown = this.onPointerDown.bind(this);
  private boundPointerMove = this.onPointerMove.bind(this);
  private boundPointerUp = this.onPointerUp.bind(this);
  private boundTouchStart = this.onTouchStart.bind(this);
  private boundTouchMove = this.onTouchMove.bind(this);
  private boundTouchEnd = this.onTouchEnd.bind(this);

  public attach(element: HTMLElement) {
    this.detach();
    this.element = element;

    element.addEventListener('pointerdown', this.boundPointerDown, { passive: true });
    window.addEventListener('pointermove', this.boundPointerMove, { passive: true });
    window.addEventListener('pointerup', this.boundPointerUp, { passive: true });
    window.addEventListener('pointercancel', this.boundPointerUp, { passive: true });

    element.addEventListener('touchstart', this.boundTouchStart, { passive: true });
    element.addEventListener('touchmove', this.boundTouchMove, { passive: true });
    element.addEventListener('touchend', this.boundTouchEnd, { passive: true });
  }

  public detach() {
    if (!this.element) return;
    this.element.removeEventListener('pointerdown', this.boundPointerDown);
    window.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerup', this.boundPointerUp);
    window.removeEventListener('pointercancel', this.boundPointerUp);

    this.element.removeEventListener('touchstart', this.boundTouchStart);
    this.element.removeEventListener('touchmove', this.boundTouchMove);
    this.element.removeEventListener('touchend', this.boundTouchEnd);

    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    this.element = null;
    this.state.isDown = false;
    this.activePointers.clear();
  }

  private onPointerDown(e: PointerEvent) {
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.state.pointerCount = this.activePointers.size;

    this.state.isDown = true;
    this.pointerDownTime = performance.now();
    this.isDragging = false;
    this.state.longPressActive = false;
    this.state.gestureType = 'none';

    this.updateCoordinates(e.clientX, e.clientY);
    this.pointerDownX = this.state.x;
    this.pointerDownY = this.state.y;
    this.recentVelocities = [];

    // Schedule long press (after 450ms of holding with minimal movement)
    if (this.longPressTimer !== null) clearTimeout(this.longPressTimer);
    this.longPressTimer = window.setTimeout(() => {
      if (this.state.isDown && !this.isDragging) {
        this.state.longPressActive = true;
        this.state.gestureType = 'longPress';
        // Long press triggers a localized persistent gravitational core
        this.state.energyPulse = 1.0;
      }
    }, 450);
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.element) return;
    if (this.activePointers.has(e.pointerId)) {
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    const prevX = this.state.x;
    const prevY = this.state.y;
    this.updateCoordinates(e.clientX, e.clientY);

    this.state.deltaX = this.state.x - prevX;
    this.state.deltaY = this.state.y - prevY;

    if (this.state.isDown) {
      const movedDist = Math.sqrt(
        Math.pow(this.state.x - this.pointerDownX, 2) +
        Math.pow(this.state.y - this.pointerDownY, 2)
      );

      // If pointer moved more than threshold, it's a drag
      if (movedDist > 0.04) {
        this.isDragging = true;
        if (!this.state.longPressActive) {
          this.state.gestureType = 'drag';
        }
        if (this.longPressTimer !== null) {
          clearTimeout(this.longPressTimer);
          this.longPressTimer = null;
        }
      }

      // Record velocity samples for swipe detection
      this.recentVelocities.push({
        dx: this.state.deltaX,
        dy: this.state.deltaY,
        dt: 16
      });
      if (this.recentVelocities.length > 5) this.recentVelocities.shift();
    }
  }

  private onPointerUp(e: PointerEvent) {
    this.activePointers.delete(e.pointerId);
    this.state.pointerCount = this.activePointers.size;

    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const pressDuration = performance.now() - this.pointerDownTime;
    const movedDist = Math.sqrt(
      Math.pow(this.state.x - this.pointerDownX, 2) +
      Math.pow(this.state.y - this.pointerDownY, 2)
    );

    // 1. Check for Tap: short duration (< 300ms) and minimal movement
    if (pressDuration < 300 && movedDist < 0.05) {
      this.state.gestureType = 'tap';
      this.state.energyPulse = 0.8; // Small energy pulse on tap
    }
    // 2. Check for Swipe: dragged fast before release
    else if (this.isDragging && this.recentVelocities.length > 0) {
      let sumDx = 0;
      let sumDy = 0;
      for (const v of this.recentVelocities) {
        sumDx += v.dx;
        sumDy += v.dy;
      }
      const avgSpeed = Math.sqrt(sumDx * sumDx + sumDy * sumDy);
      if (avgSpeed > 0.035) {
        this.state.gestureType = 'swipe';
        const invLen = avgSpeed > 0 ? 1 / avgSpeed : 1;
        this.state.swipeDirection = {
          x: sumDx * invLen,
          y: sumDy * invLen,
          speed: Math.min(avgSpeed * 20, 2.5)
        };
        this.state.energyPulse = 1.0;
      }
    }

    this.state.isDown = false;
    this.state.longPressActive = false;
  }

  private onTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      this.lastTouchDistance = this.getTouchDistance(e.touches);
      this.state.gestureType = 'pinch';
    }
  }

  private onTouchMove(e: TouchEvent) {
    if (e.touches.length === 2) {
      const distance = this.getTouchDistance(e.touches);
      if (this.lastTouchDistance > 0) {
        const factor = distance / this.lastTouchDistance;
        this.state.pinchScale = Math.min(Math.max(this.state.pinchScale * factor, 0.4), 3.0);
        this.state.gestureType = 'pinch';
      }
      this.lastTouchDistance = distance;
    }
  }

  private onTouchEnd(e: TouchEvent) {
    if (e.touches.length < 2) {
      this.lastTouchDistance = 0;
    }
  }

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private updateCoordinates(clientX: number, clientY: number) {
    if (!this.element) return;
    const rect = this.element.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
    this.state.x = Math.max(-1, Math.min(1, nx));
    this.state.y = Math.max(-1, Math.min(1, ny));

    // Approximate 3D projection on camera plane
    this.state.worldX = this.state.x * 16.0;
    this.state.worldY = this.state.y * 10.0;
  }

  public getState(): TouchPointerState {
    return { ...this.state };
  }

  public triggerManualPulse(strength: number = 1.0) {
    this.state.energyPulse = strength;
  }

  // Smooth decay for inertia and energy pulses
  public updateDecay() {
    if (!this.state.isDown) {
      this.state.deltaX *= 0.90;
      this.state.deltaY *= 0.90;
    }

    // Decay energy pulse smoothly
    if (this.state.energyPulse && this.state.energyPulse > 0.01) {
      this.state.energyPulse *= 0.92;
    } else {
      this.state.energyPulse = 0;
    }

    // Decay swipe impulse
    if (this.state.swipeDirection && this.state.swipeDirection.speed > 0.01) {
      this.state.swipeDirection.speed *= 0.91;
    }

    // Reset single-frame gestures if not held
    if (!this.state.isDown && this.state.gestureType !== 'swipe') {
      this.state.gestureType = 'none';
    }
  }
}
