import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Boxes, Package, PlayCircle } from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { AGENTS, AGENT_PIPELINE } from '../data/agents';
import { runAgentStep } from '../services/productionAiService';
import {
  applyStepOutput,
  collectPreviousOutputs,
  isProjectComplete,
  setStepStatus,
  updateStepOutput,
} from '../utils/project';
import AgentCard from '../components/AgentCard';
import WorkflowPipeline from '../components/WorkflowPipeline';
import type { AgentId, AgentOutput } from '../types';

export default function Workflow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { project, loading, update } = useProject(id);

  const completedCount = useMemo(
    () => project?.steps.filter((s) => s.status === 'complete').length ?? 0,
    [project]
  );

  if (loading) {
    return <div className="text-slate-400">Loading project...</div>;
  }
  if (!project) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-300">Project not found.</p>
        <Link to="/" className="btn-ghost mt-4 inline-flex">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  async function runAgent(agentId: AgentId) {
    if (!project) return;
    const agent = AGENTS[agentId];

    // mark working
    const working = setStepStatus(project, agentId, 'working');
    update(working);

    try {
      const previous = collectPreviousOutputs(working);
      const output = await runAgentStep(agent, working, previous);
      const next = applyStepOutput(working, agentId, output);
      update(next);
    } catch (err) {
      console.error(err);
      const failed = setStepStatus(working, agentId, 'pending');
      update(failed);
    }
  }

  async function regenerate(agentId: AgentId) {
    if (!project) return;
    // Reset and re-run.
    const reset = setStepStatus(project, agentId, 'pending');
    update(reset);
    await runAgent(agentId);
  }

  function continueNext(agentId: AgentId) {
    if (!project) return;
    const idx = AGENT_PIPELINE.indexOf(agentId);
    const nextId = AGENT_PIPELINE[idx + 1];
    if (!nextId) {
      // pipeline done -> go to final package
      navigate(`/project/${project.id}/final`);
      return;
    }
    // If next agent is still pending, kick it off automatically.
    const nextStep = project.steps.find((s) => s.agentId === nextId);
    if (nextStep && nextStep.status === 'pending') {
      runAgent(nextId);
    }
  }

  function editOutput(agentId: AgentId, output: AgentOutput) {
    if (!project) return;
    update(updateStepOutput(project, agentId, output));
  }

  const allDone = isProjectComplete(project);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <Link to="/" className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1 truncate">{project.title}</h1>
          <div className="text-sm text-slate-400 mt-0.5">
            {project.platform} · {project.style} · {project.duration}s
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to={`/project/${project.id}/assets`} className="btn-ghost">
            <Boxes className="w-4 h-4" />
            Assets Studio
          </Link>
          {allDone ? (
            <Link to={`/project/${project.id}/final`} className="btn-primary">
              <Package className="w-4 h-4" />
              View Final Package
            </Link>
          ) : (
            <button
              onClick={() => {
                const firstPending = project.steps.find((s) => s.status === 'pending');
                if (firstPending) runAgent(firstPending.agentId);
              }}
              className="btn-primary"
            >
              <PlayCircle className="w-4 h-4" />
              Run next pending
            </button>
          )}
        </div>
      </div>

      <WorkflowPipeline currentIndex={project.currentStep} completedSteps={completedCount} />

      <div className="card p-5 bg-bg-panel/40">
        <div className="section-title mb-1.5">Idea</div>
        <p className="text-slate-200 leading-relaxed">{project.idea}</p>
      </div>

      <div className="space-y-3">
        {project.steps.map((step, i) => {
          const agent = AGENTS[step.agentId];
          const canRun =
            step.status !== 'working' &&
            // can run if pending and either first step OR previous step is complete
            (i === 0 || project.steps[i - 1].status === 'complete');
          return (
            <AgentCard
              key={step.id}
              agent={agent}
              step={step}
              isCurrent={i === project.currentStep}
              canRun={canRun}
              onRun={() => runAgent(step.agentId)}
              onRegenerate={() => regenerate(step.agentId)}
              onContinue={() => continueNext(step.agentId)}
              onEdit={(out) => editOutput(step.agentId, out)}
            />
          );
        })}
      </div>

      {allDone && (
        <div className="card p-6 bg-gradient-to-br from-accent-blue/10 to-accent-violet/10 border-accent-blue/40 text-center">
          <h3 className="text-lg font-semibold">Production complete</h3>
          <p className="text-slate-300 mt-1">All 7 agents finished. Open the Final Package.</p>
          <Link to={`/project/${project.id}/final`} className="btn-primary mt-4 inline-flex">
            <Package className="w-4 h-4" /> View Final Package
          </Link>
        </div>
      )}
    </div>
  );
}
