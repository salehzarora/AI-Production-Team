import { useState } from 'react';
import { ChevronRight, RefreshCw, Pencil, Play, Sparkles, X } from 'lucide-react';
import type { Agent, AgentOutput, WorkflowStep } from '../types';
import StatusBadge from './StatusBadge';
import OutputPanel from './OutputPanel';

interface Props {
  agent: Agent;
  step: WorkflowStep;
  isCurrent: boolean;
  canRun: boolean;
  onRun: () => void;
  onRegenerate: () => void;
  onContinue: () => void;
  onEdit: (next: AgentOutput) => void;
}

const ACCENT: Record<Agent['color'], string> = {
  blue: 'from-accent-blue/80 to-accent-blue/30',
  violet: 'from-accent-violet/80 to-accent-violet/30',
  cyan: 'from-accent-cyan/80 to-accent-cyan/30',
  pink: 'from-accent-pink/80 to-accent-pink/30',
  lime: 'from-accent-lime/80 to-accent-lime/30',
  gold: 'from-accent-gold/80 to-accent-gold/30',
};

export default function AgentCard({
  agent,
  step,
  isCurrent,
  canRun,
  onRun,
  onRegenerate,
  onContinue,
  onEdit,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(isCurrent || step.status === 'complete');

  const accent = ACCENT[agent.color];

  return (
    <div
      className={[
        'card transition-all',
        isCurrent ? 'border-accent-blue/60 shadow-glow' : '',
      ].join(' ')}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5 flex items-center gap-4"
      >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} grid place-items-center shrink-0`}>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white">{agent.name}</span>
            <StatusBadge status={step.status} />
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{agent.role}</div>
        </div>
        <ChevronRight
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-bg-border/60 pt-4">
          <p className="text-sm text-slate-300">{agent.description}</p>

          {/* Output area */}
          <div className="space-y-3">
            {step.status === 'pending' && (
              <div className="card p-5 border-dashed text-sm text-slate-400">
                Waiting to run. Click <span className="text-white font-medium">Run agent</span> when ready.
              </div>
            )}
            {step.status === 'working' && (
              <div className="card p-5 border-dashed text-sm text-accent-blue flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating structured output...
              </div>
            )}
            {step.status === 'complete' && step.output && (
              <div className="card p-5 bg-bg-panel/40">
                <OutputPanel
                  agentId={agent.id}
                  output={step.output}
                  editable={editing}
                  onEdit={onEdit}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {step.status === 'pending' && (
              <button onClick={onRun} disabled={!canRun} className="btn-primary">
                <Play className="w-4 h-4" />
                Run agent
              </button>
            )}
            {step.status === 'complete' && (
              <>
                <button onClick={onContinue} className="btn-primary">
                  <ChevronRight className="w-4 h-4" />
                  Continue
                </button>
                <button onClick={onRegenerate} className="btn-ghost" title="Regenerate (placeholder)">
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
                <button
                  onClick={() => setEditing((v) => !v)}
                  className={editing ? 'btn-soft' : 'btn-ghost'}
                >
                  {editing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                  {editing ? 'Close editor' : 'Edit output'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
