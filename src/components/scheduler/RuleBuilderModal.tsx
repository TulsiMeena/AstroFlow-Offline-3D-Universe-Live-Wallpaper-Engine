import React, { useState } from 'react';
import {
  AutomationRule,
  RuleCondition,
  ConditionVariable,
  ConditionOperator,
  RuleActionType,
  ContextState
} from '../../scheduler/types';
import { AutomationRuleEngine } from '../../scheduler/AutomationRuleEngine';
import { WallpaperCatalog } from '../../library/WallpaperCatalog';
import { WallpaperSetManager } from '../../scheduler/WallpaperSetManager';
import { X, Plus, Trash2, Check, Zap, Play } from 'lucide-react';

interface RuleBuilderModalProps {
  rule: AutomationRule | null;
  isOpen: boolean;
  context: ContextState;
  onClose: () => void;
  onSave: (rule: AutomationRule) => void;
  onDelete?: (id: string) => void;
}

export const RuleBuilderModal: React.FC<RuleBuilderModalProps> = ({
  rule,
  isOpen,
  context,
  onClose,
  onSave,
  onDelete
}) => {
  if (!isOpen) return null;

  const catalog = WallpaperCatalog.getCatalog();
  const sets = WallpaperSetManager.getInstance().getAllSets();

  const [name, setName] = useState(rule?.name || 'New Context Rule');
  const [description, setDescription] = useState(
    rule?.description || 'Custom trigger rule based on device context'
  );
  const [priority, setPriority] = useState(rule?.priority ?? 50);
  const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>(rule?.logicOperator || 'AND');
  const [category, setCategory] = useState<'BATTERY' | 'TIME' | 'CHARGING' | 'CUSTOM' | 'PERFORMANCE'>(
    rule?.category || 'CUSTOM'
  );
  const [cooldownSeconds, setCooldownSeconds] = useState(rule?.cooldownSeconds ?? 30);
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);

  const [conditions, setConditions] = useState<RuleCondition[]>(
    rule?.conditions || [
      {
        id: `cond-${Date.now()}`,
        variable: 'BATTERY_LEVEL',
        operator: 'LESS_THAN',
        value: 0.20
      }
    ]
  );

  const [actionType, setActionType] = useState<RuleActionType>(
    rule?.action.type || 'ACTIVATE_WALLPAPER'
  );
  const [actionTargetId, setActionTargetId] = useState<string>(
    rule?.action.targetId || catalog[0]?.id || 'cosmic-particle-field'
  );

  // Live test result state
  const [testResult, setTestResult] = useState<{
    matches: boolean;
    conditionResults: { condition: RuleCondition; passed: boolean; message: string }[];
  } | null>(null);

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        id: `cond-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        variable: 'IS_CHARGING',
        operator: 'EQUALS',
        value: true
      }
    ]);
  };

  const removeCondition = (id: string) => {
    if (conditions.length <= 1) return;
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, partial: Partial<RuleCondition>) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, ...partial } : c))
    );
  };

  const handleTestRule = () => {
    const tempRule: AutomationRule = {
      id: 'temp-test-rule',
      name,
      description,
      priority,
      logicOperator,
      category,
      cooldownSeconds,
      enabled: true,
      conditions,
      action: {
        type: actionType,
        targetId: actionTargetId
      }
    };

    const res = AutomationRuleEngine.getInstance().testRule(tempRule, context);
    setTestResult(res);
  };

  const handleSave = () => {
    const updatedRule: AutomationRule = {
      id: rule?.id || `rule-${Date.now()}`,
      name: name.trim() || 'Custom Automation Rule',
      description: description.trim(),
      priority: Number(priority),
      logicOperator,
      category,
      cooldownSeconds: Number(cooldownSeconds),
      enabled,
      conditions,
      action: {
        type: actionType,
        targetId: actionTargetId,
        label: name
      }
    };

    onSave(updatedRule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-3xl bg-[#080d1a] border border-white/10 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-[#00F0FF]" />
            <h3 className="text-base font-bold text-white font-['Orbitron']">
              {rule ? 'Edit Automation Rule' : 'Create Automation Rule'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Name & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-mono text-slate-400">RULE NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#00F0FF] outline-none"
              placeholder="e.g., Night AMOLED Saver"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400">PRIORITY (1-100)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono text-center"
            />
          </div>
        </div>

        {/* Conditions Section (IF ... AND/OR ...) */}
        <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#00FFA3]">IF CONDITIONS</span>
              <div className="flex rounded-lg overflow-hidden border border-white/10 text-[10px] font-mono">
                <button
                  onClick={() => setLogicOperator('AND')}
                  className={`px-2 py-0.5 ${
                    logicOperator === 'AND' ? 'bg-[#00FFA3] text-black font-bold' : 'bg-transparent text-slate-400'
                  }`}
                >
                  ALL (AND)
                </button>
                <button
                  onClick={() => setLogicOperator('OR')}
                  className={`px-2 py-0.5 ${
                    logicOperator === 'OR' ? 'bg-[#00FFA3] text-black font-bold' : 'bg-transparent text-slate-400'
                  }`}
                >
                  ANY (OR)
                </button>
              </div>
            </div>

            <button
              onClick={addCondition}
              className="flex items-center gap-1 text-[11px] font-mono text-[#00F0FF] hover:underline"
            >
              <Plus size={14} /> Add Condition
            </button>
          </div>

          {/* Condition Items */}
          <div className="space-y-2">
            {conditions.map((cond, index) => (
              <div
                key={cond.id}
                className="p-3 rounded-xl bg-[#0c1426] border border-white/10 flex flex-col sm:flex-row sm:items-center gap-2"
              >
                {/* Variable */}
                <select
                  value={cond.variable}
                  onChange={(e) =>
                    updateCondition(cond.id, {
                      variable: e.target.value as ConditionVariable,
                      value: e.target.value === 'IS_CHARGING' ? true : 0.2
                    })
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono outline-none"
                >
                  <option value="BATTERY_LEVEL">Battery Level</option>
                  <option value="IS_CHARGING">Charging State</option>
                  <option value="DAY_OF_WEEK">Day of Week</option>
                  <option value="POWER_MODE">Power Mode</option>
                </select>

                {/* Operator */}
                <select
                  value={cond.operator}
                  onChange={(e) =>
                    updateCondition(cond.id, { operator: e.target.value as ConditionOperator })
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono outline-none"
                >
                  <option value="EQUALS">Equals</option>
                  <option value="LESS_THAN">Less Than (&lt;)</option>
                  <option value="GREATER_THAN">Greater Than (&gt;)</option>
                </select>

                {/* Value Input */}
                {cond.variable === 'BATTERY_LEVEL' ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="range"
                      min={0.05}
                      max={1.0}
                      step={0.05}
                      value={cond.value}
                      onChange={(e) => updateCondition(cond.id, { value: Number(e.target.value) })}
                      className="w-full accent-[#00F0FF]"
                    />
                    <span className="text-xs font-mono text-[#00F0FF] w-12 text-right">
                      {Math.round(cond.value * 100)}%
                    </span>
                  </div>
                ) : cond.variable === 'IS_CHARGING' ? (
                  <select
                    value={cond.value ? 'true' : 'false'}
                    onChange={(e) => updateCondition(cond.id, { value: e.target.value === 'true' })}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono outline-none"
                  >
                    <option value="true">Plugged In (Charging)</option>
                    <option value="false">Unplugged (On Battery)</option>
                  </select>
                ) : cond.variable === 'DAY_OF_WEEK' ? (
                  <select
                    value={cond.value}
                    onChange={(e) => updateCondition(cond.id, { value: Number(e.target.value) })}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono outline-none"
                  >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                    <option value={0}>Sunday</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={cond.value}
                    onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono"
                  />
                )}

                {conditions.length > 1 && (
                  <button
                    onClick={() => removeCondition(cond.id)}
                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Section (THEN ...) */}
        <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
          <span className="text-xs font-mono font-bold text-[#00F0FF]">THEN ACTION</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">ACTION TYPE</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as RuleActionType)}
                className="w-full px-3 py-2 rounded-xl bg-[#0c1426] border border-white/10 text-white text-xs font-mono"
              >
                <option value="ACTIVATE_WALLPAPER">Activate Wallpaper</option>
                <option value="ACTIVATE_SET">Activate Wallpaper Set</option>
                <option value="SET_SPECIAL_MODE">Set Special Mode</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">TARGET VALUE</label>
              {actionType === 'ACTIVATE_WALLPAPER' && (
                <select
                  value={actionTargetId}
                  onChange={(e) => setActionTargetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c1426] border border-white/10 text-white text-xs font-mono"
                >
                  {catalog.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}

              {actionType === 'ACTIVATE_SET' && (
                <select
                  value={actionTargetId}
                  onChange={(e) => setActionTargetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c1426] border border-white/10 text-white text-xs font-mono"
                >
                  {sets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.wallpaperIds.length} items)
                    </option>
                  ))}
                </select>
              )}

              {actionType === 'SET_SPECIAL_MODE' && (
                <select
                  value={actionTargetId}
                  onChange={(e) => setActionTargetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c1426] border border-white/10 text-white text-xs font-mono"
                >
                  <option value="BATTERY_SAVER">Battery Saver Mode</option>
                  <option value="CHARGING">Charging Mode</option>
                  <option value="NIGHT">Night Mode</option>
                  <option value="MORNING">Morning Mode</option>
                  <option value="DAY">Day Mode</option>
                  <option value="SUNSET">Sunset Mode</option>
                  <option value="RANDOM_UNIVERSE">Random Universe</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Live Test Rule Bar */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300">Live Device Context Simulation</span>
            <button
              onClick={handleTestRule}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7000FF]/20 hover:bg-[#7000FF]/30 border border-[#7000FF]/40 text-[#00F0FF] text-xs font-mono font-bold"
            >
              <Play size={13} />
              <span>Test Rule Live</span>
            </button>
          </div>

          {testResult && (
            <div
              className={`p-2.5 rounded-xl text-xs font-mono border ${
                testResult.matches
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {testResult.matches ? 'Rule MATCHES active context!' : 'Rule does not match active context.'}
              </div>
              <ul className="list-disc list-inside mt-1 text-[11px] opacity-90">
                {testResult.conditionResults.map((c, i) => (
                  <li key={i}>{c.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          {rule && onDelete ? (
            <button
              onClick={() => {
                onDelete(rule.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 text-xs font-mono"
            >
              <Trash2 size={15} />
              <span>Delete Rule</span>
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#00F0FF] text-black text-xs font-bold font-mono hover:brightness-110 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              <Check size={15} />
              <span>Save Rule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
