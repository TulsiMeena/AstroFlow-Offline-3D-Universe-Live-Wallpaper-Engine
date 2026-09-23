import {
  AutomationRule,
  RuleCondition,
  ContextState
} from './types';
import { SchedulerStorageManager } from './SchedulerStorageManager';

export class AutomationRuleEngine {
  private static instance: AutomationRuleEngine;
  private rules: AutomationRule[] = [];

  private constructor() {
    this.rules = SchedulerStorageManager.loadRules();
  }

  public static getInstance(): AutomationRuleEngine {
    if (!AutomationRuleEngine.instance) {
      AutomationRuleEngine.instance = new AutomationRuleEngine();
    }
    return AutomationRuleEngine.instance;
  }

  public getAllRules(): AutomationRule[] {
    return [...this.rules];
  }

  public getRuleById(id: string): AutomationRule | null {
    return this.rules.find((r) => r.id === id) || null;
  }

  public createRule(rule: Omit<AutomationRule, 'id'>): AutomationRule {
    const newRule: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      lastTriggered: undefined
    };
    this.rules.push(newRule);
    this.save();
    return newRule;
  }

  public updateRule(updated: AutomationRule): boolean {
    const idx = this.rules.findIndex((r) => r.id === updated.id);
    if (idx === -1) return false;
    this.rules[idx] = { ...updated };
    this.save();
    return true;
  }

  public deleteRule(id: string): boolean {
    const prev = this.rules.length;
    this.rules = this.rules.filter((r) => r.id !== id);
    if (this.rules.length !== prev) {
      this.save();
      return true;
    }
    return false;
  }

  public toggleRule(id: string): boolean {
    const rule = this.getRuleById(id);
    if (!rule) return false;
    rule.enabled = !rule.enabled;
    this.save();
    return true;
  }

  public setRulePriority(id: string, priority: number): boolean {
    const rule = this.getRuleById(id);
    if (!rule) return false;
    rule.priority = Math.max(1, Math.min(100, priority));
    this.save();
    return true;
  }

  /**
   * Evaluates all enabled rules against the active context.
   */
  public evaluateRules(context: ContextState): AutomationRule[] {
    const matching: AutomationRule[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      if (rule.conditions.length === 0) continue;

      const isMatch = this.evaluateRuleConditions(rule, context);
      if (isMatch) {
        matching.push(rule);
      }
    }

    return matching;
  }

  /**
   * Tests a single rule against a context.
   */
  public testRule(rule: AutomationRule, context: ContextState): {
    matches: boolean;
    conditionResults: { condition: RuleCondition; passed: boolean; message: string }[];
  } {
    const conditionResults: { condition: RuleCondition; passed: boolean; message: string }[] = [];

    for (const cond of rule.conditions) {
      const res = this.evaluateSingleCondition(cond, context);
      conditionResults.push({
        condition: cond,
        passed: res.passed,
        message: res.message
      });
    }

    const matches =
      rule.logicOperator === 'AND'
        ? conditionResults.every((c) => c.passed)
        : conditionResults.some((c) => c.passed);

    return { matches, conditionResults };
  }

  private evaluateRuleConditions(rule: AutomationRule, context: ContextState): boolean {
    if (rule.logicOperator === 'AND') {
      return rule.conditions.every((c) => this.evaluateSingleCondition(c, context).passed);
    } else {
      return rule.conditions.some((c) => this.evaluateSingleCondition(c, context).passed);
    }
  }

  private evaluateSingleCondition(
    condition: RuleCondition,
    context: ContextState
  ): { passed: boolean; message: string } {
    switch (condition.variable) {
      case 'BATTERY_LEVEL': {
        if (!context.isBatterySupported || context.batteryLevel === null) {
          return {
            passed: false,
            message: 'Battery API not supported on this platform.'
          };
        }
        const currentLvl = context.batteryLevel;
        const targetLvl = Number(condition.value);
        let passed = false;

        if (condition.operator === 'LESS_THAN') passed = currentLvl < targetLvl;
        else if (condition.operator === 'GREATER_THAN') passed = currentLvl > targetLvl;
        else if (condition.operator === 'EQUALS') passed = Math.abs(currentLvl - targetLvl) < 0.05;

        return {
          passed,
          message: `Battery level is ${(currentLvl * 100).toFixed(0)}% (Condition: ${condition.operator} ${(targetLvl * 100).toFixed(0)}%)`
        };
      }

      case 'IS_CHARGING': {
        if (!context.isBatterySupported || context.isCharging === null) {
          return {
            passed: false,
            message: 'Charging detection not available on this platform.'
          };
        }
        const passed = Boolean(context.isCharging) === Boolean(condition.value);
        return {
          passed,
          message: `Charging is currently ${context.isCharging ? 'YES' : 'NO'}`
        };
      }

      case 'CURRENT_TIME': {
        const currentTotal = context.currentHour * 60 + context.currentMinute;
        const targetStart = condition.value; // total minutes or HH:mm
        const targetEnd = condition.secondaryValue;

        if (typeof targetStart === 'number' && typeof targetEnd === 'number') {
          let passed = false;
          if (targetStart <= targetEnd) {
            passed = currentTotal >= targetStart && currentTotal < targetEnd;
          } else {
            passed = currentTotal >= targetStart || currentTotal < targetEnd;
          }
          return {
            passed,
            message: `Current time is ${context.currentTime}`
          };
        }
        return { passed: false, message: 'Invalid time condition' };
      }

      case 'DAY_OF_WEEK': {
        const targetDay = Number(condition.value);
        const passed = context.dayOfWeek === targetDay;
        return {
          passed,
          message: `Current day is ${context.dayName} (Target: ${targetDay})`
        };
      }

      case 'APP_VISIBILITY': {
        const passed = context.isAppVisible === Boolean(condition.value);
        return {
          passed,
          message: `App visibility is ${context.isAppVisible}`
        };
      }

      case 'POWER_MODE': {
        const passed = context.powerMode === condition.value;
        return {
          passed,
          message: `Active power mode is ${context.powerMode}`
        };
      }

      case 'PERFORMANCE_TIER': {
        const passed = context.performanceTier === condition.value;
        return {
          passed,
          message: `Device GPU performance tier is ${context.performanceTier}`
        };
      }

      default:
        return { passed: false, message: 'Unknown condition' };
    }
  }

  private save() {
    SchedulerStorageManager.saveRules(this.rules);
  }
}
