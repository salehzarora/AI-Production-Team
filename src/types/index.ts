// =============================================================
// Core domain types for the AI Production Team workflow.
// =============================================================

export type Platform = 'YouTube Shorts' | 'TikTok' | 'Instagram Reels';

export type VideoStyle =
  | 'Pixar-style claymation'
  | '3D cartoon'
  | 'anime'
  | 'cinematic'
  | 'simple kids animation';

export type VideoDuration = 15 | 30 | 60;

export type AgentId =
  | 'script'
  | 'character'
  | 'scene'
  | 'storyboard'
  | 'prompt'
  | 'consistency'
  | 'marketing';

export type StepStatus = 'pending' | 'working' | 'complete';

// ---------- Agent ----------

export interface Agent {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  /** Plain-language description of what the agent's structured output contains. */
  outputSchema: string[];
  /** UI accent color (tailwind token) */
  color: 'blue' | 'violet' | 'cyan' | 'pink' | 'lime' | 'gold';
}

// ---------- Agent Output Shapes ----------

export interface ScriptOutput {
  logline: string;
  fullScript: string;
  sceneSummary: string;
  dialogue: { speaker: string; line: string }[];
  timingNotes: string;
}

export interface Character {
  name: string;
  personality: string;
  visualAppearance: string;
  colors: string[];
  facialFeatures: string;
  bodyShape: string;
  referencePrompt: string;
  negativePrompt: string;
}

export interface CharacterOutput {
  characters: Character[];
}

export interface SceneOutput {
  locations: string[];
  props: string[];
  lighting: string;
  mood: string;
  cameraStyle: string;
  environmentPrompt: string;
}

export interface StoryboardShot {
  shotNumber: number;
  duration: string;
  cameraAngle: string;
  action: string;
  characterEmotion: string;
  visualNotes: string;
}

export interface StoryboardOutput {
  shots: StoryboardShot[];
}

export interface PromptShot {
  shotNumber: number;
  imagePrompt: string;
  videoPrompt: string;
  motionDescription: string;
  cameraMovement: string;
  consistencyReferences: string[];
}

export interface PromptOutput {
  shots: PromptShot[];
}

export interface ConsistencyOutput {
  characterNotes: string[];
  sceneNotes: string[];
  styleNotes: string[];
  missingDetails: string[];
  fixes: string[];
}

export interface MarketingOutput {
  title: string;
  description: string;
  hashtags: string[];
  thumbnailPrompt: string;
  hookText: string;
  pinnedComment: string;
}

export type AgentOutput =
  | ScriptOutput
  | CharacterOutput
  | SceneOutput
  | StoryboardOutput
  | PromptOutput
  | ConsistencyOutput
  | MarketingOutput;

// ---------- Workflow ----------

export interface WorkflowStep {
  id: string;
  agentId: AgentId;
  title: string;
  status: StepStatus;
  /** Input passed to the agent (idea + accumulated previous outputs reference). */
  input: string;
  /** Structured output produced by the agent (null until complete). */
  output: AgentOutput | null;
  updatedAt: string;
}

export interface FinalPackage {
  idea: string;
  script: ScriptOutput | null;
  characters: CharacterOutput | null;
  scenes: SceneOutput | null;
  storyboard: StoryboardOutput | null;
  prompts: PromptOutput | null;
  consistency: ConsistencyOutput | null;
  marketing: MarketingOutput | null;
}

export interface ProductionProject {
  id: string;
  title: string;
  idea: string;
  platform: Platform;
  style: VideoStyle;
  duration: VideoDuration;
  createdAt: string;
  updatedAt: string;
  /** Index in the AGENT_PIPELINE order. -1 means not started. */
  currentStep: number;
  steps: WorkflowStep[];
  finalPackage: FinalPackage;
}

/** Map of agent id -> output. Used when running an agent so it can see previous results. */
export type PreviousOutputs = Partial<Record<AgentId, AgentOutput>>;
