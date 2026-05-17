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

/**
 * The target AI video tool the prompts are optimized for.
 * - 'general' = generic / tool-agnostic prompts (legacy behavior)
 * - 'vidu'    = optimized for Vidu's multi-reference image-to-video pipeline
 * - 'runway'  = Runway Gen-3/Alpha style
 * - 'kling'   = Kling-style
 * - 'pika'    = Pika-style
 */
export type TargetTool = 'general' | 'vidu' | 'runway' | 'kling' | 'pika';

export const TARGET_TOOL_LABELS: Record<TargetTool, string> = {
  general: 'General AI Video',
  vidu: 'Vidu',
  runway: 'Runway',
  kling: 'Kling',
  pika: 'Pika',
};

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

// ---------------------------------------------------------------------------
// Vidu Mode — structured per-shot blocks designed for a real multi-reference
// image-to-video production workflow.
// ---------------------------------------------------------------------------

export interface CharacterReferenceBlock {
  /** Names of characters that appear in this shot (must match Character Bible). */
  needed: string[];
  /** Pose prompt for the shot — describes body language and stance. */
  posePrompt: string;
  /** Emotion prompt — face / expression for the shot. */
  emotionPrompt: string;
  /** How to keep the character on-model relative to the reference sheet. */
  consistencyNotes: string;
}

export interface EnvironmentReferenceBlock {
  /** Image prompt that builds the environment plate for this shot. */
  imagePrompt: string;
  /** Notes for keeping the place identical across shots. */
  consistencyNotes: string;
  /** Lighting direction + mood for the shot. */
  lightingAndMood: string;
}

export interface PropsBlock {
  /** Prompt for the prop / object featured in the shot. */
  objectPrompt: string;
  /** How to keep the prop identical across shots. */
  consistencyNotes: string;
  /** Specific details (color, scale, wear) that must not drift. */
  importantDetails: string;
}

export interface MotionBlock {
  characterAction: string;
  objectMovement: string;
  timing: string;
}

export interface CameraBlock {
  angle: string;
  movement: string;
  framing: string;
}

export interface ContinuityBlock {
  /** Elements that must NOT change vs. the previous shot. */
  remainsSame: string;
  /** Elements that intentionally change in this shot. */
  whatChanges: string;
}

export interface PromptShot {
  shotNumber: number;
  imagePrompt: string;
  videoPrompt: string;
  motionDescription: string;
  cameraMovement: string;
  consistencyReferences: string[];

  // ---- Vidu Mode v1 (legacy free-form, kept for back-compat) ----
  motionPrompt?: string;
  characterConsistency?: string;
  sceneContinuity?: string;
  negativePrompt?: string;
  multiReferenceInstructions?: string;
  suggestedReferenceImages?: string[];

  // ---- Vidu Mode v2 (structured production blocks) ----
  characterReference?: CharacterReferenceBlock;
  environmentReference?: EnvironmentReferenceBlock;
  propsRef?: PropsBlock;
  mainImagePrompt?: string;
  viduVideoPrompt?: string;
  motion?: MotionBlock;
  camera?: CameraBlock;
  negativeChecklist?: string[];
  continuity?: ContinuityBlock;
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
  /** Target AI video tool. Optional for backward compat with old saved projects. */
  targetTool?: TargetTool;
  createdAt: string;
  updatedAt: string;
  /** Index in the AGENT_PIPELINE order. -1 means not started. */
  currentStep: number;
  steps: WorkflowStep[];
  finalPackage: FinalPackage;
}

/** Map of agent id -> output. Used when running an agent so it can see previous results. */
export type PreviousOutputs = Partial<Record<AgentId, AgentOutput>>;
