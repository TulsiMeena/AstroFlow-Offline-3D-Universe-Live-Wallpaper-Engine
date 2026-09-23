import React, { useState } from 'react';
import { AutomationRule, ContextState } from '../../scheduler/types';
import { AutomationRuleEngine } from '../../scheduler/AutomationRuleEngine';
import { RuleBuilderModal } from './RuleBuilderModal';
import { Zap, Plus, X, Trash2, Edit3, CheckCircle2, Circle } from 'lucide-react';

interface RulesManagerModalProps {
  isOpen: boolean;
  context: ContextState;
  onClose: () => void;
}

export const RulesManagerModal: React.FC<RulesManagerModalProps> = ({
  isOpen,
  context,
  onClose
}) => {
  if (!isOpen) return null;

  const ruleEngine = AutomationRuleEngine.getInstance();
  const [rules, setRules] = useState<AutomationRule[]>(ruleEngine.getAllRules());
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const refreshRules = () => {
    setRules(ruleEngine.getAllRules());
  };

  const handleToggle = (id: string) => {
    ruleEngine.toggleRule(id);
    refreshRules();
  };

  const handleDelete = (id: string) => {
    ruleEngine.deleteRule(id);
    refreshRules();
  };

  const handleSaveRule = (saved: AutomationRule) => {
    if (editingRule) {
      ruleEngine.updateRule(saved);
    } else {
      ruleEngine.createRule(saved);
    }
    refreshRules();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-3xl bg-[#080d1a] border border-white/10 shadow-2xl p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-[#00F0FF]" />
            <div>
              <h3 className="text-base font-bold text-white font-['Orbitron']">
                CONTEXT AUTOMATION RULES
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Trigger procedural changes based on battery, power, day, or system context
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            {rules.length} Configured Rules
          </span>
          <button
            onClick={() => {
              setEditingRule(null);
              setIsBuilderOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-mono font-bold"
          >
            <Plus size={14} />
            <span>New Rule</span>
          </button>
        </div>

        {/* Rules List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {rules.map((r) => (
            <div
              key={r.id}
              className={`p-4 rounded-2xl border transition-all ${
                r.enabled
                  ? 'bg-white/5 border-white/10'
                  : 'bg-black/30 border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(r.id)}
                    className="mt-0.5 text-slate-400 hover:text-white"
                  >
                    {r.enabled ? (
                      <CheckCircle2 size={18} className="text-[#00FFA3]" />
                    ) : (
                      <Circle size={18} className="text-slate-500" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{r.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                        Pri: {r.priority}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F0FF]/10 text-[#00F0FF] font-mono">
                        {r.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-mono">
                      {r.description || 'Context automation rule'}
                    </p>

                    <div className="text-[11px] text-[#00FFA3] font-mono pt-1">
                      Action: {r.action.type.replace('_', ' ')} • Target: {r.action.targetId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingRule(r);
                      setIsBuilderOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono"
          >
            Close
          </button>
        </div>
      </div>

      {/* Embedded Rule Builder Modal */}
      {isBuilderOpen && (
        <RuleBuilderModal
          rule={editingRule}
          isOpen={isBuilderOpen}
          context={context}
          onClose={() => setIsBuilderOpen(false)}
          onSave={handleSaveRule}
          onDelete={editingRule ? () => handleDelete(editingRule.id) : undefined}
        />
      )}
    </div>
  );
};
