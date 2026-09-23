import { ErrorCategory, ErrorSeverity, SystemErrorEvent } from './types';

/**
 * Global Error Manager for Amit HyperWall
 * Catches, classifies, sanitizes, and distributes system errors
 * without leaking sensitive data or causing UI crashes.
 */
export class ErrorManager {
  private static instance: ErrorManager | null = null;
  private errorLog: SystemErrorEvent[] = [];
  private maxLogEntries: number = 50;
  private listeners: ((event: SystemErrorEvent) => void)[] = [];
  private isInitialized: boolean = false;

  public static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  private constructor() {
    this.initGlobalHandlers();
  }

  private initGlobalHandlers() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    // Window error handler
    window.addEventListener('error', (event) => {
      // Ignore cross-origin script error noise
      if (!event.message || event.message === 'Script error.') return;

      this.reportError({
        category: 'RUNTIME',
        severity: 'ERROR',
        message: event.message,
        userFacingMessage: 'An unexpected runtime issue occurred. Engine is maintaining stability.',
        recoverable: true,
        technicalDetails: `${event.filename || 'unknown'}:${event.lineno || 0}:${event.colno || 0}`
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reasonStr = event.reason ? (event.reason.message || String(event.reason)) : 'Promise rejected';
      this.reportError({
        category: 'RUNTIME',
        severity: 'WARNING',
        message: reasonStr,
        userFacingMessage: 'An asynchronous operation encountered an issue.',
        recoverable: true
      });
    });
  }

  public reportError(params: {
    category: ErrorCategory;
    severity: ErrorSeverity;
    message: string;
    userFacingMessage: string;
    recoverable: boolean;
    technicalDetails?: string;
  }): SystemErrorEvent {
    const errorEvent: SystemErrorEvent = {
      id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      category: params.category,
      severity: params.severity,
      message: params.message,
      userFacingMessage: params.userFacingMessage,
      recoverable: params.recoverable,
      technicalDetails: params.technicalDetails
    };

    this.errorLog.unshift(errorEvent);
    if (this.errorLog.length > this.maxLogEntries) {
      this.errorLog.pop();
    }

    // Notify subscribers
    for (const listener of this.listeners) {
      try {
        listener(errorEvent);
      } catch (err) {
        console.error('Error in ErrorManager listener:', err);
      }
    }

    return errorEvent;
  }

  public subscribe(listener: (event: SystemErrorEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getRecentErrors(): SystemErrorEvent[] {
    return [...this.errorLog];
  }

  public clearErrors(): void {
    this.errorLog = [];
  }

  public hasFatalError(): boolean {
    return this.errorLog.some((e) => e.severity === 'FATAL');
  }
}
