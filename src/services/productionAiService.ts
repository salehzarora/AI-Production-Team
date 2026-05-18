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
  AssetOutput,
  CameraBlock,
  Character,
  CharacterOutput,
  CharacterReferenceBlock,
  ConsistencyOutput,
  ContinuityBlock,
  EnvironmentReferenceBlock,
  MarketingOutput,
  MotionBlock,
  PreviousOutputs,
  ProductionProject,
  PromptOutput,
  PromptShot,
  PropsBlock,
  SceneOutput,
  ScriptOutput,
  ShotImageOutput,
  StoryboardShot,
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
    case 'asset':
      return buildAssetPlan(project, previousOutputs.character as CharacterOutput | undefined);
    case 'scene':
      return buildScenes(project);
    case 'storyboard':
      return buildStoryboard(project, previousOutputs.script as ScriptOutput | undefined);
    case 'shotImage':
      return buildShotImages(
        project,
        previousOutputs.storyboard as StoryboardOutput | undefined,
        previousOutputs.character as CharacterOutput | undefined,
        previousOutputs.scene as SceneOutput | undefined
      );
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

// ---------------------------------------------------------------------------
// Asset Agent + Shot Image Agent generators
// ---------------------------------------------------------------------------

function buildAssetPlan(
  project: ProductionProject,
  characters: CharacterOutput | undefined
): AssetOutput {
  const numChars = characters?.characters.length ?? 0;
  const isVidu = (project.targetTool ?? 'general') === 'vidu';
  return {
    productionPlan:
      `For a ${project.duration}s ${project.style} short, you'll need ${numChars} character reference image(s), ` +
      `~3 environment plates, ~3 prop references, and one image per storyboard shot. ` +
      `Generate them in this order so each shot can reuse stable references.`,
    workflow: [
      'Step 1 — Generate the CHARACTER reference images first. Lock seed, save the PNGs.',
      'Step 2 — Generate the ENVIRONMENT plates (one per location). These get reused across every shot in that location.',
      'Step 3 — Generate the PROP references for any object that recurs.',
      'Step 4 — Run the Storyboard + Shot Image agents.',
      'Step 5 — For each shot, generate the first-frame image using the character + environment + prop references.',
      isVidu
        ? 'Step 6 — Upload the first frame and references into Vidu, paste the Vidu video prompt, render.'
        : 'Step 6 — Use the first frame in your image-to-video tool of choice with the shot video prompt.',
    ],
    characterAssetsNote:
      `${numChars} character(s) detected. Each needs a clean reference sheet (front + 3/4 + back) ` +
      `with locked palette. Open Assets Studio → Characters to copy prompts or upload your generated images.`,
    environmentAssetsNote:
      `Environment assets will be auto-seeded after the Scene Agent runs. Plan to generate one plate ` +
      `per unique location and reuse it across every shot in that location.`,
    propAssetsNote:
      `Prop assets will be auto-seeded after the Scene Agent runs. Generate a reference for any prop ` +
      `that appears in more than one shot — otherwise Vidu will reinterpret it shot-to-shot.`,
    totalAssets: numChars + 3 + 3,
  };
}

function buildShotImages(
  project: ProductionProject,
  storyboard: StoryboardOutput | undefined,
  characters: CharacterOutput | undefined,
  scenes: SceneOutput | undefined
): ShotImageOutput {
  const shots = storyboard?.shots ?? [];
  const hero = characters?.characters[0];
  const sidekick = characters?.characters[1];
  const propsList = scenes?.props ?? [];
  const envPrompt = scenes?.environmentPrompt ?? '';
  const lighting = scenes?.lighting ?? 'soft cinematic key light';
  return {
    shots: shots.map((s, idx) => {
      const refs: string[] = [];
      if (hero) refs.push(hero.name);
      // Sidekick in middle + final
      if (sidekick && (idx === Math.floor(shots.length / 2) || idx === shots.length - 1)) {
        refs.push(sidekick.name);
      }
      const mainLocation = scenes?.locations[0] ?? 'primary location';
      refs.push(mainLocation);
      const prop = propsList.length ? propsList[idx % propsList.length] : null;
      if (prop) refs.push(prop);

      const imagePrompt = [
        `${project.style}, ${s.cameraAngle.toLowerCase()}`,
        `${refs.slice(0, refs.length - (prop ? 2 : 1)).join(' and ') || 'hero'} in ${mainLocation}`,
        `action: ${s.action.toLowerCase()}, expression: ${s.characterEmotion}`,
        prop ? `featured prop: ${prop}` : '',
        `environment reference: ${envPrompt}`,
        `lighting: ${lighting}`,
        `9:16 vertical, sharp focus, cinematic composition, high detail`,
      ]
        .filter(Boolean)
        .join('. ');

      return {
        shotNumber: s.shotNumber,
        imagePrompt,
        referenceAssets: refs,
        notes:
          idx === 0
            ? 'First shot — this image establishes the look. Save it and reuse as a reference plate for later shots.'
            : idx === shots.length - 1
              ? 'Final shot — frame it for a clean loop back to shot 1.'
              : 'Reuse the character + environment references from earlier shots. Lock the same seed.',
      };
    }),
  };
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
  const hero = characters?.characters[0];
  const sidekick = characters?.characters[1];
  const heroRef = hero?.referencePrompt ?? '';
  const heroPalette = (hero?.colors ?? []).join(', ');
  const envPrompt = scenes?.environmentPrompt ?? '';
  const mainLocation = scenes?.locations[0] ?? 'primary location';
  const lighting = scenes?.lighting ?? 'soft cinematic key light';
  const mood = scenes?.mood ?? 'warm and inviting';
  const styleTag = project.style;
  const targetTool = project.targetTool ?? 'general';
  const isVidu = targetTool === 'vidu';

  return {
    shots: shots.map((s, idx) => {
      const camMovement =
        idx === 0
          ? 'Slow cinematic push-in (15% over the shot)'
          : idx === shots.length - 1
            ? 'Hold + slight 5% pull-back, final beat'
            : `Smooth ${idx % 2 === 0 ? 'dolly forward' : 'tracking lateral'} (20% travel)`;

      // ---------- base / general fields (always generated) ----------
      const imagePrompt = isVidu
        ? buildViduImagePrompt(s, styleTag, heroRef, envPrompt, lighting, mood, heroPalette)
        : `${styleTag}, ${s.cameraAngle.toLowerCase()}, hero performing: ${s.action}. ${envPrompt}. Consistent character: ${heroRef}. 9:16, cinematic lighting, sharp focus, high detail --ar 9:16 --v 6`;

      const videoPrompt = isVidu
        ? buildViduVideoPrompt(s, styleTag, mainLocation, camMovement, mood)
        : `${styleTag}, ${s.cameraAngle.toLowerCase()}, ${s.action} ${s.characterEmotion} expression. Camera: ${camMovement.toLowerCase()}. Duration ${s.duration}.`;

      const base: PromptShot = {
        shotNumber: s.shotNumber,
        imagePrompt,
        videoPrompt,
        motionDescription: `Subject moves naturally, secondary motion in hair/cloth/props. Background parallax suggests depth. End on a held expression for clean cut.`,
        cameraMovement: camMovement,
        consistencyReferences: [
          'Character reference sheet from Character Agent',
          'Environment prompt from Scene Agent',
          heroPalette ? `Keep palette: ${heroPalette}` : 'Maintain consistent palette',
        ],
      };

      // ---------- Vidu-specific fields ----------
      if (isVidu) {
        // ---- v1 legacy fields (back-compat) ----
        base.motionPrompt = buildViduMotionPrompt(s, mood);
        base.characterConsistency = buildCharacterConsistency(hero?.name ?? 'Hero', heroPalette, heroRef, sidekick?.name);
        base.sceneContinuity = buildSceneContinuity(mainLocation, lighting, idx, shots.length);
        base.negativePrompt = buildViduNegativePrompt(styleTag);
        base.multiReferenceInstructions = buildMultiRefInstructions(idx);
        base.suggestedReferenceImages = buildSuggestedRefs(hero?.name ?? 'Hero', mainLocation, styleTag, idx === 0);

        // ---- v2 structured production blocks ----
        const charsInShot = pickCharactersForShot(hero?.name, sidekick?.name, idx, shots.length);
        const propsList = scenes?.props ?? [];
        const propForShot = propsList.length
          ? propsList[idx % propsList.length]
          : 'signature prop';
        const isFirst = idx === 0;
        const isLast = idx === shots.length - 1;
        const prevShot = idx > 0 ? shots[idx - 1] : null;

        base.characterReference = buildCharacterReferenceBlock(charsInShot, s, hero, sidekick);
        base.environmentReference = buildEnvironmentReferenceBlock(mainLocation, envPrompt, lighting, mood, styleTag, isFirst);
        base.propsRef = buildPropsBlock(propForShot, heroPalette);
        base.mainImagePrompt = buildMainImagePrompt(s, styleTag, charsInShot, mainLocation, propForShot, lighting, mood, heroPalette);
        base.viduVideoPrompt = buildViduVideoPromptDetailed(s, styleTag, charsInShot, mainLocation, propForShot, camMovement);
        base.motion = buildMotionBlock(s, propForShot);
        base.camera = buildCameraBlock(s, camMovement);
        base.negativeChecklist = buildNegativeChecklist();
        base.continuity = buildContinuityBlock(s, prevShot, mainLocation, propForShot, isFirst, isLast);
      }

      return base;
    }),
  };
}

// ---------------------------------------------------------------------------
// Vidu-specific prompt builders
// ---------------------------------------------------------------------------
// Vidu is a multi-reference image-to-video model. Best results come from:
//   - a strong, descriptive first-frame image prompt
//   - a video prompt that describes ACTION and CAMERA in short, concrete clauses
//   - a separate motion prompt isolating subject + secondary motion
//   - explicit character + scene consistency notes
//   - a negative prompt that strips realism / artifacts
//   - multi-reference image inputs (character sheet + env + style)
// ---------------------------------------------------------------------------

function buildViduImagePrompt(
  s: { cameraAngle: string; action: string; characterEmotion: string; visualNotes: string },
  styleTag: string,
  heroRef: string,
  envPrompt: string,
  lighting: string,
  mood: string,
  palette: string
): string {
  return [
    `${styleTag}, ${s.cameraAngle.toLowerCase()}`,
    `subject: hero ${s.characterEmotion}, ${s.action.toLowerCase()}`,
    `environment: ${envPrompt}`,
    `lighting: ${lighting}`,
    `mood: ${mood}`,
    palette ? `palette: ${palette}` : '',
    `reference: ${heroRef}`,
    s.visualNotes,
    `9:16 vertical framing, sharp focus, high detail, clean composition`,
  ]
    .filter(Boolean)
    .join('. ');
}

function buildViduVideoPrompt(
  s: { cameraAngle: string; action: string; characterEmotion: string; duration: string },
  styleTag: string,
  location: string,
  camMovement: string,
  mood: string
): string {
  return [
    `${styleTag} animation`,
    `${s.cameraAngle.toLowerCase()} in ${location}`,
    `hero ${s.action.toLowerCase()} with ${s.characterEmotion} expression`,
    `camera: ${camMovement.toLowerCase()}`,
    `mood: ${mood}`,
    `duration ${s.duration}, smooth 24fps motion, no flicker`,
  ].join('. ');
}

function buildViduMotionPrompt(
  s: { action: string; characterEmotion: string },
  mood: string
): string {
  return [
    `Primary motion: hero ${s.action.toLowerCase()}.`,
    `Secondary motion: subtle hair/cloth physics, breathing, micro-blinks.`,
    `Background: gentle parallax + ambient particle drift to enhance ${mood} mood.`,
    `Emotion arc: settles into ${s.characterEmotion} by mid-shot, holds through end.`,
    `Avoid: sudden teleporting, limb morphing, abrupt cuts mid-shot.`,
  ].join(' ');
}

function buildCharacterConsistency(
  heroName: string,
  palette: string,
  heroRef: string,
  sidekickName?: string
): string {
  const parts = [
    `${heroName} must match the reference sheet exactly: same proportions, same outfit, same hair.`,
    palette ? `Lock palette to: ${palette}.` : '',
    `Inject the reference image (${heroRef}) into Vidu's first reference slot.`,
    sidekickName
      ? `If ${sidekickName} appears, use their reference sheet in slot 2 — do not blend features with ${heroName}.`
      : '',
    `Re-use the SAME seed across shots for cross-shot identity stability.`,
  ];
  return parts.filter(Boolean).join(' ');
}

function buildSceneContinuity(
  location: string,
  lighting: string,
  idx: number,
  total: number
): string {
  const transition =
    idx === 0
      ? 'Establishing shot — sets the world.'
      : idx === total - 1
        ? 'Final shot — close the loop back to the opening framing.'
        : `Mid-shot ${idx + 1} of ${total} — continue from the previous shot without breaking lighting direction.`;
  return [
    `Location: ${location}.`,
    `Lighting direction: ${lighting}.`,
    transition,
    `Re-use the environment reference image so background details (signage, props, sky color) stay identical to neighboring shots.`,
  ].join(' ');
}

function buildViduNegativePrompt(styleTag: string): string {
  return [
    'photorealistic faces (unless style requires)',
    'extra fingers',
    'extra limbs',
    'deformed hands',
    'distorted face',
    'mismatched eyes',
    'morphing identity',
    'flickering',
    'watermark',
    'text artifacts',
    'low resolution',
    'motion blur on subject face',
    `style drift away from ${styleTag}`,
  ].join(', ');
}

function buildMultiRefInstructions(idx: number): string {
  return [
    `Upload up to 7 reference images into Vidu's multi-reference slots:`,
    `1) Character reference sheet (hero) — locks identity.`,
    `2) Sidekick reference sheet (if present) — keeps secondary character on-model.`,
    `3) Environment / location plate — locks the world.`,
    `4) Style swatch (color palette + lighting sample) — locks look.`,
    `5) Previous shot's last frame${idx === 0 ? ' (skip for shot 1)' : ' — for continuity'}.`,
    `Set "Subject Reference" mode and weight character ref highest.`,
  ].join(' ');
}

function buildSuggestedRefs(
  heroName: string,
  location: string,
  styleTag: string,
  isFirstShot: boolean
): string[] {
  const refs = [
    `${heroName} character sheet (front + 3/4 + back)`,
    `${location} environment plate (wide establishing)`,
    `${styleTag} style swatch (palette + lighting)`,
  ];
  if (!isFirstShot) refs.push('Last frame of previous shot');
  return refs;
}

// ---------------------------------------------------------------------------
// Vidu Mode v2 — structured production blocks
// ---------------------------------------------------------------------------

function pickCharactersForShot(
  heroName: string | undefined,
  sidekickName: string | undefined,
  idx: number,
  total: number
): string[] {
  const out: string[] = [];
  if (heroName) out.push(heroName);
  // Sidekick appears in middle and final shots if present
  if (sidekickName && (idx === Math.floor(total / 2) || idx === total - 1)) {
    out.push(sidekickName);
  }
  return out;
}

function buildCharacterReferenceBlock(
  charsInShot: string[],
  s: StoryboardShot,
  hero: Character | undefined,
  sidekick: Character | undefined
): CharacterReferenceBlock {
  const heroName = hero?.name ?? 'Hero';
  const charsDisplay = charsInShot.join(' + ') || heroName;
  const refLines = charsInShot.map((name) => {
    if (name === hero?.name) return `${name} reference sheet (${hero.referencePrompt})`;
    if (sidekick && name === sidekick.name) return `${name} reference sheet (${sidekick.referencePrompt})`;
    return `${name} reference sheet`;
  });

  return {
    needed: refLines.length ? refLines : [`${heroName} reference sheet`],
    posePrompt:
      `${charsDisplay}: ${s.action.toLowerCase()}. Body language reads as ${s.characterEmotion}. ` +
      `Clear silhouette, no occlusion of the face by hands or props.`,
    emotionPrompt:
      `${charsDisplay} face shows ${s.characterEmotion} — eyes ${
        s.characterEmotion === 'surprised' || s.characterEmotion === 'elated' ? 'wide' : 'focused'
      }, mouth ${
        s.characterEmotion === 'frustrated' ? 'tight' : s.characterEmotion === 'sly' ? 'half-smile' : 'natural'
      }, micro-expression consistent with the reference sheet.`,
    consistencyNotes:
      `Match the reference sheet exactly: same hair, same outfit, same proportions, same palette ` +
      `(${(hero?.colors ?? []).join(', ') || 'locked palette'}). Do NOT regenerate the character ` +
      `from scratch — feed the reference image into Vidu's Subject Reference slot and reuse the ` +
      `same seed as previous shots.`,
  };
}

function buildEnvironmentReferenceBlock(
  location: string,
  envPrompt: string,
  lighting: string,
  mood: string,
  styleTag: string,
  isFirstShot: boolean
): EnvironmentReferenceBlock {
  return {
    imagePrompt:
      `${styleTag} environment plate of ${location}. ${envPrompt}. Vertical 9:16, ` +
      `${lighting}, atmospheric depth, clear foreground / midground / background separation, ` +
      `clean negative space for character placement.`,
    consistencyNotes: isFirstShot
      ? `Establishing the location. Save this generated environment plate — every following ` +
        `shot must use it as a reference so background details (architecture, signage, props, ` +
        `sky color) stay identical.`
      : `Re-use the SAME environment plate from shot 1 as reference. Do not regenerate from ` +
        `scratch — that will cause background drift. Only re-render the foreground action.`,
    lightingAndMood: `${lighting} · Mood: ${mood}. Keep key-light direction consistent across all shots in this scene.`,
  };
}

function buildPropsBlock(prop: string, palette: string): PropsBlock {
  return {
    objectPrompt:
      `${prop}, hero-readable scale, sharp focus, matches scene palette ` +
      `${palette ? `(${palette})` : ''}, no logos, no random text.`,
    consistencyNotes:
      `If ${prop} appears in multiple shots it must be IDENTICAL: same color, same wear ` +
      `pattern, same scale. Re-use the prop reference image across shots — do not let Vidu ` +
      `re-imagine it.`,
    importantDetails:
      `Lock: silhouette, primary color, surface finish (matte / glossy), any distinguishing ` +
      `mark. Inject the prop image into Vidu's secondary reference slot when the prop is ` +
      `on-screen.`,
  };
}

function buildMainImagePrompt(
  s: StoryboardShot,
  styleTag: string,
  charsInShot: string[],
  location: string,
  prop: string,
  lighting: string,
  mood: string,
  palette: string
): string {
  const charsDisplay = charsInShot.join(' and ') || 'hero';
  return [
    `${styleTag}`,
    `${s.cameraAngle.toLowerCase()} of ${charsDisplay} in ${location}`,
    `action: ${s.action.toLowerCase()}`,
    `expression: ${s.characterEmotion}`,
    `featured prop: ${prop}`,
    `lighting: ${lighting}`,
    `mood: ${mood}`,
    palette ? `palette locked to: ${palette}` : '',
    s.visualNotes,
    `9:16 vertical, sharp focus, cinematic composition, high detail, clean negative space top`,
  ]
    .filter(Boolean)
    .join('. ');
}

function buildViduVideoPromptDetailed(
  s: StoryboardShot,
  styleTag: string,
  charsInShot: string[],
  location: string,
  prop: string,
  camMovement: string
): string {
  const charsDisplay = charsInShot.join(' and ') || 'hero';
  return [
    `${styleTag} animation, ${s.cameraAngle.toLowerCase()}`,
    `${charsDisplay} ${s.action.toLowerCase()} with ${s.characterEmotion} expression in ${location}`,
    `featured prop: ${prop}`,
    `camera: ${camMovement.toLowerCase()}`,
    `duration ${s.duration}, 24fps smooth motion, no flicker`,
    `IMPORTANT: keep character identity, environment, and props 100% consistent with the ` +
      `uploaded reference images — do not reinterpret them`,
  ].join('. ');
}

function buildMotionBlock(s: StoryboardShot, prop: string): MotionBlock {
  return {
    characterAction:
      `Primary: hero ${s.action.toLowerCase()}. Secondary: subtle breathing, micro-blinks, ` +
      `hair / cloth physics. Emotion arc settles into "${s.characterEmotion}" by mid-shot.`,
    objectMovement:
      `${prop} moves with the action — natural physics, no teleporting, no morphing. If ` +
      `held by the hero, it follows the hand without slipping.`,
    timing:
      `Shot duration: ${s.duration}. First 20% = setup pose. Middle 60% = main action. ` +
      `Last 20% = held expression for a clean cut. Avoid sudden mid-shot speed changes.`,
  };
}

function buildCameraBlock(s: StoryboardShot, camMovement: string): CameraBlock {
  return {
    angle: s.cameraAngle,
    movement: camMovement,
    framing:
      `9:16 vertical. Hero positioned on the rule-of-thirds line, eyes in the upper third. ` +
      `Top 15% kept clear for caption overlay. No critical detail in the bottom 10% (mobile ` +
      `UI safe zone).`,
  };
}

function buildNegativeChecklist(): string[] {
  return [
    'Do not change character identity',
    'Do not change character colors / palette',
    'Do not change face details (eyes, nose, mouth proportions)',
    'No extra characters appearing in the background',
    'No distorted or extra hands / fingers',
    'No flickering between frames',
    'No text / watermark artifacts',
    'No random background changes vs. the environment reference',
    'No style drift away from the reference style',
    'No motion blur on the face',
  ];
}

function buildContinuityBlock(
  s: StoryboardShot,
  prev: StoryboardShot | null,
  location: string,
  prop: string,
  isFirst: boolean,
  isLast: boolean
): ContinuityBlock {
  if (isFirst) {
    return {
      remainsSame:
        `This is the establishing shot — nothing to carry over. Lock the character ` +
        `reference, environment plate, and prop reference here so every following shot ` +
        `can reuse them.`,
      whatChanges: `Sets the world. Introduces the hero and the location (${location}).`,
    };
  }
  const carry = [
    `Character identity, outfit, palette (same as shot ${s.shotNumber - 1})`,
    `Location: ${location} (same environment plate)`,
    `Lighting direction (same key-light side)`,
    `${prop} appearance (identical color, scale, wear)`,
  ].join('; ');
  const changes = isLast
    ? `Final beat — hero arrives at the payoff pose. Camera holds longer. Frame composed for loop back to shot 1.`
    : `Action evolves: ${prev?.action.toLowerCase() ?? 'previous beat'} → ${s.action.toLowerCase()}. ` +
      `Emotion shifts to ${s.characterEmotion}. Camera moves to ${s.cameraAngle.toLowerCase()}.`;
  return {
    remainsSame: carry,
    whatChanges: changes,
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
