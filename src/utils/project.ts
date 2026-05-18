import { AGENTS, AGENT_PIPELINE } from '../data/agents';
import type {
  AgentId,
  AgentOutput,
  AssetOutput,
  CharacterAsset,
  CharacterOutput,
  ConsistencyOutput,
  EnvironmentAsset,
  FinalPackage,
  MarketingOutput,
  Platform,
  PreviousOutputs,
  ProductionAsset,
  ProductionAssets,
  ProductionProject,
  PromptOutput,
  PropAsset,
  SceneOutput,
  ScriptOutput,
  ShotImageAsset,
  ShotImageOutput,
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
    assets: emptyAssets(),
  };
}

export function emptyAssets(): ProductionAssets {
  return { characters: [], environments: [], props: [], shotImages: [] };
}

/** Ensures `project.assets` is defined — used when reading legacy projects. */
export function ensureAssets(project: ProductionProject): ProductionProject {
  if (project.assets) return project;
  return { ...project, assets: emptyAssets() };
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
    assetPlan: null,
    scenes: null,
    storyboard: null,
    shotImages: null,
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
  const assets = seedAssets(project, agentId, output);

  // Advance currentStep to the next pending step (or pipeline length if done).
  let next = project.currentStep;
  while (next < steps.length && steps[next].status === 'complete') {
    next += 1;
  }

  return { ...project, steps, finalPackage, assets, currentStep: next, updatedAt: now };
}

/**
 * Side-effect: when certain agents complete, seed the project's asset prompts
 * so the user can see them in the Assets Studio immediately.
 *  - Character Agent → character assets
 *  - Scene Agent → environment + prop assets
 *  - Shot Image Agent → shot image assets
 * Existing assets keep any uploaded imageUrl + notes; only missing assets are added.
 */
function seedAssets(
  project: ProductionProject,
  agentId: AgentId,
  output: AgentOutput
): ProductionAssets {
  const now = new Date().toISOString();
  const existing: ProductionAssets = project.assets ?? emptyAssets();

  if (agentId === 'character') {
    const co = output as CharacterOutput;
    const next: CharacterAsset[] = co.characters.map((c) => {
      const found = existing.characters.find((a) => a.name === c.name);
      if (found) return found; // preserve uploaded images / notes
      const asset: CharacterAsset = {
        id: uid('asset'),
        kind: 'character',
        name: c.name,
        roleInStory: c.personality,
        visualDescription: c.visualAppearance,
        prompt: c.referencePrompt,
        negativePrompt: c.negativePrompt,
        status: 'prompt-ready',
        notes: '',
        createdAt: now,
        updatedAt: now,
      };
      return asset;
    });
    return { ...existing, characters: next };
  }

  if (agentId === 'scene') {
    const so = output as SceneOutput;
    const envs: EnvironmentAsset[] = so.locations.map((loc) => {
      const found = existing.environments.find((a) => a.name === loc);
      if (found) return found;
      const asset: EnvironmentAsset = {
        id: uid('asset'),
        kind: 'environment',
        name: loc,
        description: loc,
        prompt: `${so.environmentPrompt}. Specific location: ${loc}. Lighting: ${so.lighting}. Mood: ${so.mood}. 9:16 vertical environment plate.`,
        status: 'prompt-ready',
        notes: '',
        createdAt: now,
        updatedAt: now,
      };
      return asset;
    });
    const props: PropAsset[] = so.props.map((p) => {
      const found = existing.props.find((a) => a.name === p);
      if (found) return found;
      const asset: PropAsset = {
        id: uid('asset'),
        kind: 'prop',
        name: p,
        description: p,
        prompt: `${p}, hero-readable scale, sharp focus, isolated on neutral background, consistent palette, no logos, no text.`,
        status: 'prompt-ready',
        notes: '',
        createdAt: now,
        updatedAt: now,
      };
      return asset;
    });
    return { ...existing, environments: envs, props };
  }

  if (agentId === 'shotImage') {
    const so = output as ShotImageOutput;
    const shotImages: ShotImageAsset[] = so.shots.map((s) => {
      const found = existing.shotImages.find((a) => a.shotNumber === s.shotNumber);
      if (found) {
        // refresh prompt but keep image + notes
        return {
          ...found,
          prompt: s.imagePrompt,
          referenceAssets: s.referenceAssets,
          updatedAt: now,
        };
      }
      const asset: ShotImageAsset = {
        id: uid('asset'),
        kind: 'shotImage',
        name: `Shot ${s.shotNumber}`,
        shotNumber: s.shotNumber,
        prompt: s.imagePrompt,
        referenceAssets: s.referenceAssets,
        status: 'prompt-ready',
        notes: s.notes,
        createdAt: now,
        updatedAt: now,
      };
      return asset;
    });
    return { ...existing, shotImages };
  }

  return existing;
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
    case 'asset':
      return { ...fp, assetPlan: output as AssetOutput };
    case 'scene':
      return { ...fp, scenes: output as SceneOutput };
    case 'storyboard':
      return { ...fp, storyboard: output as StoryboardOutput };
    case 'shotImage':
      return { ...fp, shotImages: output as ShotImageOutput };
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

export type AssetKind = 'characters' | 'environments' | 'props' | 'shotImages';

/**
 * Updates one asset by id within a specific bucket, preserving everything else.
 * Patch is typed as `Partial<ProductionAsset>` — the common shared fields
 * (imageUrl, status, notes, prompt, negativePrompt). Subtype-specific fields
 * (roleInStory, shotNumber, etc.) are set at seed time and aren't mutated here.
 */
export function updateAsset(
  project: ProductionProject,
  kind: AssetKind,
  assetId: string,
  patch: Partial<ProductionAsset>
): ProductionProject {
  const now = new Date().toISOString();
  const assets: ProductionAssets = project.assets ?? emptyAssets();
  const bucket = assets[kind] as ProductionAsset[];
  const nextBucket = bucket.map((a) =>
    a.id === assetId ? { ...a, ...patch, updatedAt: now } : a
  );
  const nextAssets: ProductionAssets = { ...assets, [kind]: nextBucket } as ProductionAssets;
  return { ...project, assets: nextAssets, updatedAt: now };
}

export function isProjectComplete(project: ProductionProject): boolean {
  return project.steps.every((s) => s.status === 'complete');
}

export function progressPct(project: ProductionProject): number {
  const done = project.steps.filter((s) => s.status === 'complete').length;
  return Math.round((done / project.steps.length) * 100);
}
