import { AutomationRule } from './types';

export interface ConflictResolutionResult {
  winner: AutomationRule | null;
  conflictCount: number;
  reason: string;
  competingRules: AutomationRule[];
}

export class ScheduleConflictManager {
  private static lastSwitchTime: number = 0;
  private static switchCountInWindow: number = 0;
  private static windowStartTime: number = Date.now();
  private static readonly MAX_SWITCHES_PER_MINUTE = 6;
  private static readonly MIN_COOLDOWN_MS = 3000; // 3 seconds debounce

  /**
   * Resolves competing matched automation rules.
   */
  public static resolve(
    matchingRules: AutomationRule[],
    respectBatterySaver: boolean
  ): ConflictResolutionResult {
    if (matchingRules.length === 0) {
      return {
        winner: null,
        conflictCount: 0,
        reason: 'No rules matched current context.',
        competingRules: []
      };
    }

    if (matchingRules.length === 1) {
      return {
        winner: matchingRules[0],
        conflictCount: 1,
        reason: `Rule "${matchingRules[0].name}" matched active context.`,
        competingRules: matchingRules
      };
    }

    // Sort by priority descending (higher number = higher priority)
    const sorted = [...matchingRules].sort((a, b) => {
      // If respectBatterySaver is on, give BATTERY rules priority boost
      if (respectBatterySaver) {
        if (a.category === 'BATTERY' && b.category !== 'BATTERY') return -1;
        if (b.category === 'BATTERY' && a.category !== 'BATTERY') return 1;
      }
      return b.priority - a.priority;
    });

    const winner = sorted[0];
    const runnersUp = sorted.slice(1);
    const runnerNames = runnersUp.map((r) => `"${r.name}" (Pri ${r.priority})`).join(', ');

    const reason = `${matchingRules.length} rules matched simultaneously. "${winner.name}" (Priority ${winner.priority}) selected over ${runnerNames}.`;

    return {
      winner,
      conflictCount: matchingRules.length,
      reason,
      competingRules: sorted
    };
  }

  /**
   * Checks if a rule change is throttled by cooldown or rapid oscillation protection.
   */
  public static canTriggerRule(rule: AutomationRule): { allowed: boolean; reason?: string } {
    const now = Date.now();

    // 1. Sliding window oscillation prevention
    if (now - this.windowStartTime > 60000) {
      this.windowStartTime = now;
      this.switchCountInWindow = 0;
    }

    if (this.switchCountInWindow >= this.MAX_SWITCHES_PER_MINUTE) {
      return {
        allowed: false,
        reason: 'Rate limit reached: Maximum 6 automation switches per minute to protect GPU stability.'
      };
    }

    // 2. Minimum cooldown between any rule triggers
    if (now - this.lastSwitchTime < this.MIN_COOLDOWN_MS) {
      return {
        allowed: false,
        reason: 'Debounce active: Waiting 3s stabilization period.'
      };
    }

    // 3. Rule-specific cooldown
    if (rule.lastTriggered && now - rule.lastTriggered < rule.cooldownSeconds * 1000) {
      const remaining = Math.ceil((rule.cooldownSeconds * 1000 - (now - rule.lastTriggered)) / 1000);
      return {
        allowed: false,
        reason: `Rule-specific cooldown active (${remaining}s remaining).`
      };
    }

    return { allowed: true };
  }

  public static recordTrigger(rule: AutomationRule) {
    this.lastSwitchTime = Date.now();
    this.switchCountInWindow++;
    rule.lastTriggered = Date.now();
  }
}
