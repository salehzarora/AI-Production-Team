// =============================================================================
// productionAiService.ts
// -----------------------------------------------------------------------------
// Pluggable AI service for the production pipeline.
//
// FRONTEND MVP NOTE:
// ------------------
// Right now this file returns realistic *mock* structured outputs. It does NOT
// make any network calls and does NOT use any API keys.
//
// When you wire up real AI later:
//   1. Build a backend endpoint, e.g.  POST /api/production/run-step
//      Body: { agentId, project, previousOutputs }
//      The backend holds your provider keys (Anthropic, OpenAI, Replicate...)
//      and validates / shapes the model response into the agent's output schema.
//   2. Replace the body of `runAgentStep` with a `fetch` call to that endpoint:
//
//        const res = await fetch('/api/production/run-step', {
//          method: 'POST',
//          headers: { 'Content-Type': 'application/json' },
//          body: JSON.stringify({ agentId: agent.id, project, previousOutputs }),
//        });
//        if (!res.ok) throw new Error('Agent step failed');
//        return (await res.json()) as AgentOutput;
//
//   3. Keep the same return type per agent — the UI is already type-safe and
//      won't need to change.
//
// IMPORTANT: never call AI provider APIs (Anthropic / OpenAI / etc.) directly
// from the browser. API keys belong on the server. The browser only talks to
// your own backend endpoint.
// =============================================================================

import type {
  Agent,
  AgentOutput,
  CharacterOutput,
  ConsistencyOutput,
  MarketingOutput,
  PreviousOutputs,
  ProductionProject,
  PromptOutput,
  SceneOutput,
  ScriptOutput,
  StoryboardOutput,
} from '../types';

const MOCK_LATENCY_MS = 900;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run a single agent step. Receives the agent definition, the full project, and
 * a map of previously-completed agent outputs so this agent can build on them.
 *
 * Returns the structured output for this agent (matches the agent's schema).
 */
export async function runAgentStep(
  agent: Agent,
  project: ProductionProject,
  previousOutputs: PreviousOutputs
): Promise<AgentOutput> {
  // Simulate network/inference latency so the UI shows "working" status.
  await delay(MOCK_LATENCY_MS);

  switch (agent.id) {
    case 'script':
      return buildScript(project);
    case 'character':
      return buildCharacters(project, previousOutputs.script as ScriptOutput | undefined);
    case 'scene':
      return buildScenes(project);
    case 'storyboard':
      return buildStoryboard(project, previousOutputs.script as ScriptOutput | undefined);
    case 'prompt':
      return buildPrompts(
        project,
        previousOutputs.storyboard as StoryboardOutput | undefined,
        previousOutputs.character as CharacterOutput | undefined,
        previousOutputs.scene as SceneOutput | undefined
      );
    case 'consistency':
      return buildConsistency(project, previousOutputs);
    case 'marketing':
      return buildMarketing(project, previousOutputs.script as ScriptOutput | undefined);
  }
}

// ============================================================================
// Mock generators — each one produces a realistic, deterministic-ish payload
// derived from the user's idea / platform / style / duration. Replace with
// real backend calls when ready.
// ============================================================================

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function shortIdea(project: ProductionProject) {
  return project.idea.trim().replace(/\s+/g, ' ').slice(0, 90);
}

function buildScript(project: ProductionProject): ScriptOutput {
  const { duration, style, platform } = project;
  const beats = duration === 15 ? 3 : duration === 30 ? 5 : 7;
  return {
    logline: `In ${duration} seconds, ${shortIdea(project).toLowerCase()} — told in ${style} for ${platform}.`,
    fullScript: [
      `[HOOK 0:00] Open on a striking visual that pays off the idea: "${shortIdea(project)}".`,
      ...Array.from({ length: beats - 2 }, (_, i) => {
        const t = Math.round(((i + 1) / (beats - 1)) * duration);
        return `[BEAT ${i + 1} ~0:${String(t).padStart(2, '0')}] Escalate the situation. Add a surprise that pushes the story forward.`;
      }),
      `[PAYOFF 0:${duration}] Land the joke / emotion / twist. Cut on the strongest frame for a loop-friendly ending.`,
    ].join('\n\n'),
    sceneSummary: `A ${duration}s ${style} short for ${platform}. ${beats} beats. Clear protagonist, one rising obstacle, one satisfying payoff.`,
    dialogue: [
      { speaker: 'NARRATOR', line: `What if ${shortIdea(project).toLowerCase()}?` },
      { speaker: 'HERO', line: `Wait... that actually worked?` },
      { speaker: 'NARRATOR', line: `Subscribe before it stops working.` },
    ],
    timingNotes: `Hook must land in <2s. No shot longer than 2.5s for ${platform}. Cut on motion. Loop the last frame back to the first for replays.`,
  };
}

function buildCharacters(
  project: ProductionProject,
  _script: ScriptOutput | undefined
): CharacterOutput {
  const styleHint = project.style;
  return {
    characters: [
      {
        name: 'Hero',
        personality: 'Curious, determined, slightly out of their depth but charming.',
        visualAppearance: `${titleCase(styleHint)} protagonist, age 12-18, expressive eyes, layered outfit with one signature color.`,
        colors: ['#5b8cff', '#ffd45b', '#ffffff'],
        facialFeatures: 'Large round eyes, soft cheekbones, expressive brows, small confident smile.',
        bodyShape: 'Slim, athletic, slightly cartoonish proportions (1:6 head-to-body for stylized appeal).',
        referencePrompt: `${styleHint} character sheet, full body and close-up, neutral T-pose, consistent lighting, soft studio backdrop, sharp edges`,
        negativePrompt: 'photo-realistic, extra fingers, deformed hands, watermark, text, low quality, blurry, distorted face',
      },
      {
        name: 'Sidekick',
        personality: 'Sarcastic, loyal, comic relief that lands the punchline.',
        visualAppearance: `${titleCase(styleHint)} sidekick, smaller frame, exaggerated expression, accessory prop that signals personality.`,
        colors: ['#9b5bff', '#37e0ff'],
        facialFeatures: 'Wide grin, raised eyebrow default, oversized eyes for comedic reactions.',
        bodyShape: 'Compact, rounded, bouncy silhouette that animates well in tight shots.',
        referencePrompt: `${styleHint} sidekick character sheet, three angles, consistent palette, soft rim light`,
        negativePrompt: 'gritty realism, extra limbs, ugly, distorted, low resolution',
      },
    ],
  };
}

function buildScenes(project: ProductionProject): SceneOutput {
  return {
    locations: [
      'Opening location that establishes the world in one frame',
      'Mid-story environment where the obstacle escalates',
      'Final location where the payoff lands',
    ],
    props: ['Signature object the hero carries', 'Object that triggers the twist', 'Reward / payoff object'],
    lighting:
      project.style === 'cinematic'
        ? 'Soft key + rim light, low-key cinematic contrast, warm practicals.'
        : 'Bright, saturated key light with soft ambient fill — readable on mobile at small thumbnails.',
    mood: 'Curious → tense → triumphant. Warm-cool-warm color arc.',
    cameraStyle:
      project.style === 'cinematic'
        ? '35mm anamorphic, shallow depth of field, controlled handheld.'
        : 'Static + smooth dolly. Punchy angles. Vertical 9:16 framing.',
    environmentPrompt: `${project.style}, vertical 9:16 composition, ${project.platform}-optimized, vibrant palette, clean negative space for text overlays, consistent lighting across shots`,
  };
}

function buildStoryboard(
  project: ProductionProject,
  _script: ScriptOutput | undefined
): StoryboardOutput {
  const shotCount = project.duration === 15 ? 4 : project.duration === 30 ? 7 : 12;
  const avgDur = project.duration / shotCount;
  const angles = ['Wide establishing', 'Medium close-up', 'Over-the-shoulder', 'Top-down', 'Dutch tilt', 'Close-up insert', 'Tracking follow'];
  const emotions = ['curious', 'determined', 'surprised', 'frustrated', 'elated', 'sly', 'triumphant'];
  return {
    shots: Array.from({ length: shotCount }, (_, i) => ({
      shotNumber: i + 1,
      duration: `${avgDur.toFixed(1)}s`,
      cameraAngle: angles[i % angles.length],
      action:
        i === 0
          ? `Hero is introduced doing something that immediately signals the premise.`
          : i === shotCount - 1
            ? `Payoff frame — strongest possible composition, loop-friendly.`
            : `Escalation beat ${i}: a new complication appears and hero reacts.`,
      characterEmotion: emotions[i % emotions.length],
      visualNotes: `Keep the signature color (#5b8cff) in frame. Negative space top for caption overlay.`,
    })),
  };
}

function buildPrompts(
  project: ProductionProject,
  storyboard: StoryboardOutput | undefined,
  characters: CharacterOutput | undefined,
  scenes: SceneOutput | undefined
): PromptOutput {
  const shots = storyboard?.shots ?? [];
  const heroRef = characters?.characters[0]?.referencePrompt ?? '';
  const envPrompt = scenes?.environmentPrompt ?? '';
  return {
    shots: shots.map((s) => ({
      shotNumber: s.shotNumber,
      imagePrompt: `${project.style}, ${s.cameraAngle.toLowerCase()}, hero performing: ${s.action}. ${envPrompt}. Consistent character: ${heroRef}. 9:16, cinematic lighting, sharp focus, high detail --ar 9:16 --v 6`,
      videoPrompt: `${project.style}, ${s.cameraAngle.toLowerCase()}, ${s.action} ${s.characterEmotion} expression. Camera: ${s.shotNumber === 1 ? 'slow push-in' : 'smooth dolly forward'}. Duration ${s.duration}.`,
      motionDescription: `Subject moves naturally, secondary motion in hair/cloth. Background parallax. End on a held expression for clean cut.`,
      cameraMovement: s.shotNumber === 1 ? 'Slow push-in' : s.shotNumber === shots.length ? 'Hold + slight zoom out' : 'Smooth dolly / tracking',
      consistencyReferences: [
        'Use character reference sheet from Character Agent',
        'Use environment prompt from Scene Agent',
        `Keep palette: ${(characters?.characters[0]?.colors ?? []).join(', ')}`,
      ],
    })),
  };
}

function buildConsistency(
  project: ProductionProject,
  previous: PreviousOutputs
): ConsistencyOutput {
  const hasChars = !!previous.character;
  const hasScene = !!previous.scene;
  const hasStory = !!previous.storyboard;
  return {
    characterNotes: [
      hasChars
        ? 'Hero palette is locked. Ensure the same accent color appears in every shot for instant recognition.'
        : 'No character bible found — generate it first.',
      'Sidekick should appear in at least 2 shots to feel intentional, not decorative.',
    ],
    sceneNotes: [
      hasScene
        ? 'Lighting direction shifts between shots 3 and 4 — keep key light side consistent.'
        : 'No scene bible found — generate it first.',
      'Reuse the same hero prop across all locations to signal continuity.',
    ],
    styleNotes: [
      `Style "${project.style}" should be applied uniformly — no realistic frames mixed in.`,
      'Maintain 9:16 framing across every generated shot.',
    ],
    missingDetails: [
      hasStory ? 'Define what the hero is wearing in the final shot.' : 'Storyboard missing.',
      'Specify the exact thumbnail frame (recommend shot with strongest emotion).',
    ],
    fixes: [
      'Lock palette in negative prompts to prevent color drift.',
      'Add seed value to every image prompt for reproducibility.',
      'Re-render any shot where the hero\'s signature color is missing.',
    ],
  };
}

function buildMarketing(
  project: ProductionProject,
  script: ScriptOutput | undefined
): MarketingOutput {
  const hook = script?.dialogue[0]?.line ?? `What if ${shortIdea(project).toLowerCase()}?`;
  const platformTag =
    project.platform === 'YouTube Shorts'
      ? '#shorts'
      : project.platform === 'TikTok'
        ? '#fyp'
        : '#reels';
  return {
    title: `${titleCase(shortIdea(project))} 🤯 (${project.duration}s)`,
    description: `${hook}\n\nMade with the AI Production Team. ${project.style} animation, optimized for ${project.platform}.\n\nFollow for more.`,
    hashtags: [platformTag, '#ai', '#animation', `#${project.style.replace(/\s|-/g, '').toLowerCase()}`, '#viral', '#aiart'],
    thumbnailPrompt: `${project.style} thumbnail, hero center-frame, intense expression, bold ${project.duration === 15 ? '"15s"' : project.duration === 30 ? '"30s"' : '"60s"'} text overlay, high contrast, mobile-readable at small sizes, 9:16`,
    hookText: hook,
    pinnedComment: `Which scene was your favorite? 👀  (Drop the shot number 1-${project.duration === 15 ? 4 : project.duration === 30 ? 7 : 12})`,
  };
}
