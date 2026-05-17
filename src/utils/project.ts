import { AGENTS, AGENT_PIPELINE } from '../data/agents';
import type {
  AgentId,
  AgentOutput,
  CharacterOutput,
  ConsistencyOutput,
  FinalPackage,
  MarketingOutput,
  Platform,
  PreviousOutputs,
  ProductionProject,
  PromptOutput,
  SceneOutput,
  ScriptOutput,
  StoryboardOutput,
  TargetTool,
  VideoDuration,
  VideoStyle,
  WorkflowStep,
} from '../types';
import { uid } from './id';

export function createProject(input: {
  idea: string;
  platform: Platform;
  style: VideoStyle;
  duration: VideoDuration;
  targetTool: TargetTool;
}): ProductionProject {
  const now = new Date().toISOString();
  const steps: WorkflowStep[] = AGENT_PIPELINE.map((agentId) => ({
    id: uid('step'),
    agentId,
    title: AGENTS[agentId].name,
    status: 'pending',
    input: '',
    output: null,
    updatedAt: now,
  }));
  return {
    id: uid('proj'),
    title: deriveTitle(input.idea),
    idea: input.idea,
    platform: input.platform,
    style: input.style,
    duration: input.duration,
    targetTool: input.targetTool,
    createdAt: now,
    updatedAt: now,
    currentStep: 0,
    steps,
    finalPackage: emptyFinalPackage(input.idea),
  };
}

function deriveTitle(idea: string): string {
  const trimmed = idea.trim().replace(/\s+/g, ' ');
  return trimmed.length <= 60 ? trimmed : trimmed.slice(0, 57) + '...';
}

function emptyFinalPackage(idea: string): FinalPackage {
  return {
    idea,
    script: null,
    characters: null,
    scenes: null,
    storyboard: null,
    prompts: null,
    consistency: null,
    marketing: null,
  };
}

export function collectPreviousOutputs(project: ProductionProject): PreviousOutputs {
  const out: PreviousOutputs = {};
  for (const step of project.steps) {
    if (step.output) {
      out[step.agentId] = step.output;
    }
  }
  return out;
}

export function applyStepOutput(
  project: ProductionProject,
  agentId: AgentId,
  output: AgentOutput
): ProductionProject {
  const now = new Date().toISOString();
  const steps = project.steps.map((s) =>
    s.agentId === agentId
      ? { ...s, status: 'complete' as const, output, updatedAt: now }
      : s
  );

  const finalPackage = mergeFinalPackage(project.finalPackage, agentId, output);

  // Advance currentStep to the next pending step (or pipeline length if done).
  let next = project.currentStep;
  while (next < steps.length && steps[next].status === 'complete') {
    next += 1;
  }

  return { ...project, steps, finalPackage, currentStep: next, updatedAt: now };
}

export function setStepStatus(
  project: ProductionProject,
  agentId: AgentId,
  status: 'pending' | 'working' | 'complete'
): ProductionProject {
  const now = new Date().toISOString();
  const steps = project.steps.map((s) =>
    s.agentId === agentId ? { ...s, status, updatedAt: now } : s
  );
  return { ...project, steps, updatedAt: now };
}

export function updateStepOutput(
  project: ProductionProject,
  agentId: AgentId,
  output: AgentOutput
): ProductionProject {
  const now = new Date().toISOString();
  const steps = project.steps.map((s) =>
    s.agentId === agentId ? { ...s, output, updatedAt: now } : s
  );
  const finalPackage = mergeFinalPackage(project.finalPackage, agentId, output);
  return { ...project, steps, finalPackage, updatedAt: now };
}

function mergeFinalPackage(
  fp: FinalPackage,
  agentId: AgentId,
  output: AgentOutput
): FinalPackage {
  switch (agentId) {
    case 'script':
      return { ...fp, script: output as ScriptOutput };
    case 'character':
      return { ...fp, characters: output as CharacterOutput };
    case 'scene':
      return { ...fp, scenes: output as SceneOutput };
    case 'storyboard':
      return { ...fp, storyboard: output as StoryboardOutput };
    case 'prompt':
      return { ...fp, prompts: output as PromptOutput };
    case 'consistency':
      return { ...fp, consistency: output as ConsistencyOutput };
    case 'marketing':
      return { ...fp, marketing: output as MarketingOutput };
    default:
      return fp;
  }
}

export function isProjectComplete(project: ProductionProject): boolean {
  return project.steps.every((s) => s.status === 'complete');
}

export function progressPct(project: ProductionProject): number {
  const done = project.steps.filter((s) => s.status === 'complete').length;
  return Math.round((done / project.steps.length) * 100);
}
