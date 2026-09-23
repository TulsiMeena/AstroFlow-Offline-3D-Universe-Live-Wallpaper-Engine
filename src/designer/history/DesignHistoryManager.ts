import { DesignDNA } from '../types/designDNA';

export class DesignHistoryManager {
  private undoStack: DesignDNA[] = [];
  private redoStack: DesignDNA[] = [];
  private initialDNA: DesignDNA | null = null;
  private maxHistory: number = 25;

  constructor(initialState?: DesignDNA) {
    if (initialState) {
      this.init(initialState);
    }
  }

  public init(initialState: DesignDNA): void {
    this.initialDNA = JSON.parse(JSON.stringify(initialState));
    this.undoStack = [];
    this.redoStack = [];
  }

  public pushState(currentState: DesignDNA): void {
    // Only push if different from top of undo stack
    const clone = JSON.parse(JSON.stringify(currentState));
    if (this.undoStack.length > 0) {
      const top = this.undoStack[this.undoStack.length - 1];
      if (top.seed === clone.seed && JSON.stringify(top) === JSON.stringify(clone)) {
        return;
      }
    }

    this.undoStack.push(clone);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    // Clear redo stack on new action
    this.redoStack = [];
  }

  public undo(currentState: DesignDNA): DesignDNA | null {
    if (!this.canUndo()) return null;

    // Push current to redo
    this.redoStack.push(JSON.parse(JSON.stringify(currentState)));

    // Pop from undo
    const previous = this.undoStack.pop();
    return previous ? JSON.parse(JSON.stringify(previous)) : null;
  }

  public redo(currentState: DesignDNA): DesignDNA | null {
    if (!this.canRedo()) return null;

    // Push current to undo
    this.undoStack.push(JSON.parse(JSON.stringify(currentState)));

    // Pop from redo
    const next = this.redoStack.pop();
    return next ? JSON.parse(JSON.stringify(next)) : null;
  }

  public reset(): DesignDNA | null {
    if (!this.initialDNA) return null;
    this.undoStack = [];
    this.redoStack = [];
    return JSON.parse(JSON.stringify(this.initialDNA));
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}
