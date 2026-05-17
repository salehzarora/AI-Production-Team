import { PIPELINE_LABELS } from '../data/agents';

interface Props {
  /** 0 = Idea, 1 = Script, ... 8 = Final Package. */
  currentIndex: number;
  completedSteps: number; // number of completed agents (0..7)
}

export default function WorkflowPipeline({ currentIndex, completedSteps }: Props) {
  return (
    <div className="card p-4 overflow-x-auto">
      <div className="flex items-center gap-2 min-w-max">
        {PIPELINE_LABELS.map((label, i) => {
          // step indices: 0=Idea, 1..7=agents, 8=Final Package
          const isAgentStep = i >= 1 && i <= 7;
          const agentIndex = i - 1;
          const isDone = isAgentStep ? agentIndex < completedSteps : i === 8 ? completedSteps === 7 : true;
          const isActive = i === currentIndex + 1; // current agent
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={[
                  'px-3 py-1.5 rounded-xl text-xs font-medium border transition whitespace-nowrap',
                  isActive
                    ? 'border-accent-blue text-white bg-accent-blue/15 shadow-glow'
                    : isDone
                      ? 'border-accent-lime/50 text-accent-lime bg-accent-lime/10'
                      : 'border-bg-border text-slate-400 bg-bg-panel/40',
                ].join(' ')}
              >
                {label}
              </div>
              {i < PIPELINE_LABELS.length - 1 && (
                <div
                  className={`w-6 h-px ${
                    isDone ? 'bg-accent-lime/60' : 'bg-bg-border'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
