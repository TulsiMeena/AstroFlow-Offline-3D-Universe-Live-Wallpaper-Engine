export type VisibilityState = 'VISIBLE' | 'HIDDEN' | 'BACKGROUND';

export class VisibilityManager {
  private isVisible: boolean = true;
  private isDocumentHidden: boolean = false;
  private isWindowBlurred: boolean = false;
  private isElementIntersecting: boolean = true;
  private intersectionObserver: IntersectionObserver | null = null;
  private targetElement: HTMLElement | null = null;
  private listeners: ((visible: boolean, state: VisibilityState) => void)[] = [];

  private boundVisibilityChange = this.handleVisibilityChange.bind(this);
  private boundFocus = this.handleFocus.bind(this);
  private boundBlur = this.handleBlur.bind(this);

  constructor() {
    this.initListeners();
  }

  private initListeners() {
    if (typeof document !== 'undefined') {
      this.isDocumentHidden = document.hidden;
      document.addEventListener('visibilitychange', this.boundVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.boundFocus);
      window.addEventListener('blur', this.boundBlur);
    }
    this.updateVisibility();
  }

  public attachElement(element: HTMLElement) {
    this.targetElement = element;
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver?.disconnect();
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.target === this.targetElement) {
              this.isElementIntersecting = entry.isIntersecting;
              this.updateVisibility();
            }
          }
        },
        { threshold: [0.0, 0.1] }
      );
      this.intersectionObserver.observe(element);
    }
  }

  private handleVisibilityChange() {
    if (typeof document !== 'undefined') {
      this.isDocumentHidden = document.hidden;
      this.updateVisibility();
    }
  }

  private handleFocus() {
    this.isWindowBlurred = false;
    this.updateVisibility();
  }

  private handleBlur() {
    // Only register blur as backgrounding if desired, but keep preview alive if tab is still visible
    this.isWindowBlurred = false; // We don't pause purely on click-away inside preview
    this.updateVisibility();
  }

  private updateVisibility() {
    const wasVisible = this.isVisible;
    // Hidden if document is hidden or element is scrolled off-screen
    this.isVisible = !this.isDocumentHidden && this.isElementIntersecting;

    if (wasVisible !== this.isVisible) {
      const state: VisibilityState = this.isVisible
        ? 'VISIBLE'
        : this.isDocumentHidden
        ? 'HIDDEN'
        : 'BACKGROUND';
      this.notify(this.isVisible, state);
    }
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }

  public subscribe(fn: (visible: boolean, state: VisibilityState) => void): () => void {
    this.listeners.push(fn);
    const state: VisibilityState = this.isVisible ? 'VISIBLE' : 'HIDDEN';
    fn(this.isVisible, state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify(visible: boolean, state: VisibilityState) {
    for (const fn of this.listeners) {
      fn(visible, state);
    }
  }

  public dispose() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.boundVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this.boundFocus);
      window.removeEventListener('blur', this.boundBlur);
    }
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    this.listeners = [];
  }
}
