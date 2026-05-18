import { AGENT_PIPELINE, PIPELINE_LABELS } from '../data/agents';

interface Props {
  /** Index into AGENT_PIPELINE of the current agent (0..AGENT_PIPELINE.length-1). */
  currentIndex: number;
  /** Number of agents that have status 'complete'. */
  completedSteps: number;
}

export default function WorkflowPipeline({ currentIndex, completedSteps }: Props) {
  const totalAgents = AGENT_PIPELINE.length;
  const lastLabelIndex = PIPELINE_LABELS.length - 1; // Final Package
  return (
    <div className="card p-4 overflow-x-auto">
      <div className="flex items-center gap-2 min-w-max">
        {PIPELINE_LABELS.map((label, i) => {
          // Layout: 0 = Idea, 1..totalAgents = agents, lastLabelIndex = Final Package.
          const isIdea = i === 0;
          const isFinal = i === lastLabelIndex;
          const isAgentStep = !isIdea && !isFinal;
          const agentIndex = i - 1;
          const isDone = isIdea
            ? true
            : isFinal
              ? completedSteps === totalAgents
              : isAgentStep && agentIndex < completedSteps;
          const isActive = isAgentStep && i === currentIndex + 1;
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
                <div className={`w-6 h-px ${isDone ? 'bg-accent-lime/60' : 'bg-bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
