import type { Agent, AgentId } from '../types';

export const AGENTS: Record<AgentId, Agent> = {
  script: {
    id: 'script',
    name: 'Script Agent',
    role: 'Writes the script',
    description:
      'Turns the raw idea into a tight, performable short script with logline, beats, and dialogue.',
    systemPrompt:
      'You are a senior short-form video screenwriter. Produce a concise script with a logline, full script, scene summary, dialogue, and timing notes appropriate for the platform and target duration.',
    outputSchema: ['logline', 'fullScript', 'sceneSummary', 'dialogue', 'timingNotes'],
    color: 'blue',
  },
  character: {
    id: 'character',
    name: 'Character Agent',
    role: 'Designs consistent characters',
    description:
      'Reads the script and produces character bibles: appearance, colors, personality, reference + negative prompts.',
    systemPrompt:
      'You are a character designer. Produce a consistent character bible for every speaking or featured character: visual appearance, palette, facial features, body shape, reference prompt, negative prompt.',
    outputSchema: [
      'name',
      'personality',
      'visualAppearance',
      'colors',
      'facialFeatures',
      'bodyShape',
      'referencePrompt',
      'negativePrompt',
    ],
    color: 'violet',
  },
  scene: {
    id: 'scene',
    name: 'Scene Agent',
    role: 'Builds the visual world',
    description:
      'Designs locations, props, lighting, mood, and camera language for the production.',
    systemPrompt:
      'You are an art director. Define the visual world: locations, props, lighting, mood, camera style, and a reusable environment prompt for image generators.',
    outputSchema: ['locations', 'props', 'lighting', 'mood', 'cameraStyle', 'environmentPrompt'],
    color: 'cyan',
  },
  storyboard: {
    id: 'storyboard',
    name: 'Storyboard Agent',
    role: 'Breaks the story into shots',
    description:
      'Splits the script and scene world into individual shots with angle, action, emotion, and visual notes.',
    systemPrompt:
      'You are a storyboard artist. Break the script into individual shots with shot number, duration, camera angle, action, character emotion, and visual notes.',
    outputSchema: ['shotNumber', 'duration', 'cameraAngle', 'action', 'characterEmotion', 'visualNotes'],
    color: 'lime',
  },
  prompt: {
    id: 'prompt',
    name: 'Prompt Agent',
    role: 'Writes generation prompts',
    description:
      'Produces ready-to-copy image and video prompts for tools like Midjourney, Runway, Kling, Sora, Veo.',
    systemPrompt:
      'You are a prompt engineer for image/video generation. For every shot, produce an image prompt, a video prompt, a motion description, a camera movement, and references for consistency.',
    outputSchema: [
      'imagePrompt',
      'videoPrompt',
      'motionDescription',
      'cameraMovement',
      'consistencyReferences',
    ],
    color: 'pink',
  },
  consistency: {
    id: 'consistency',
    name: 'Consistency Agent',
    role: 'Quality control reviewer',
    description:
      'Reviews everything the previous agents produced and flags inconsistencies, gaps, and required fixes.',
    systemPrompt:
      'You are a continuity supervisor. Review character, scene, and style consistency across the full project. Flag missing details and propose specific fixes.',
    outputSchema: ['characterNotes', 'sceneNotes', 'styleNotes', 'missingDetails', 'fixes'],
    color: 'gold',
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing Agent',
    role: 'Creates upload package',
    description:
      'Writes the title, description, hashtags, thumbnail prompt, hook, and pinned comment for upload.',
    systemPrompt:
      'You are a short-form growth strategist. Produce a viral-ready upload package: title, description, hashtags, thumbnail prompt, hook text, pinned comment.',
    outputSchema: [
      'title',
      'description',
      'hashtags',
      'thumbnailPrompt',
      'hookText',
      'pinnedComment',
    ],
    color: 'pink',
  },
};

/** Execution order of the production pipeline. */
export const AGENT_PIPELINE: AgentId[] = [
  'script',
  'character',
  'scene',
  'storyboard',
  'prompt',
  'consistency',
  'marketing',
];

export const PIPELINE_LABELS = [
  'Idea',
  'Script',
  'Characters',
  'Scenes',
  'Storyboard',
  'Prompts',
  'Consistency',
  'Marketing',
  'Final Package',
];
