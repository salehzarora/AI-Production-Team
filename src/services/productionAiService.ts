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
import { classifyIdea, deriveSubjectName } from '../utils/ideaClassifier';
import type { IdeaType } from '../utils/ideaClassifier';

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
// Utilities
// ---------------------------------------------------------------------------

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function shortIdea(project: ProductionProject) {
  return project.idea.trim().replace(/\s+/g, ' ').slice(0, 90);
}

// ---------------------------------------------------------------------------
// Script Agent
// ---------------------------------------------------------------------------

function buildScript(project: ProductionProject): ScriptOutput {
  const type = classifyIdea(project.idea);
  const { duration, style, platform } = project;
  const beats = duration === 15 ? 3 : duration === 30 ? 5 : 7;
  const subject = deriveSubjectName(project.idea, type);

  if (type === 'vehicle-driven') {
    return {
      logline: `In ${duration} seconds, ${subject.toLowerCase()} tears across the world — pure machine cinema for ${platform}.`,
      fullScript: [
        `[HOOK 0:00] Cold open: ${subject} sits still. Engine idling. Anticipation.`,
        ...Array.from({ length: beats - 2 }, (_, i) => {
          const t = Math.round(((i + 1) / (beats - 1)) * duration);
          return `[BEAT ${i + 1} ~0:${String(t).padStart(2, '0')}] ${subject} unleashes — escalating speed, camera angles dropping lower.`;
        }),
        `[PAYOFF 0:${duration}] Final frame: ${subject} vanishes into the horizon. Cut to black.`,
      ].join('\n\n'),
      sceneSummary: `A ${duration}s ${style} machine film. ${beats} beats. ${subject} as sole protagonist — no dialogue, pure visual speed.`,
      dialogue: [],
      timingNotes: `Hook under 2s. Every cut on motion peak. No shot longer than 2.5s. Slow-motion inserts at peak speed moments for maximum impact.`,
    };
  }

  if (type === 'environment-driven') {
    return {
      logline: `In ${duration} seconds, ${shortIdea(project).toLowerCase()} — a wordless atmospheric journey for ${platform}.`,
      fullScript: [
        `[HOOK 0:00] ${subject} at its most striking — one frame that makes you stop scrolling.`,
        ...Array.from({ length: beats - 2 }, (_, i) => {
          const t = Math.round(((i + 1) / (beats - 1)) * duration);
          return `[BEAT ${i + 1} ~0:${String(t).padStart(2, '0')}] The environment evolves — light shifts, atmosphere deepens.`;
        }),
        `[PAYOFF 0:${duration}] Wide final frame. The world breathes. Silence is the payoff.`,
      ].join('\n\n'),
      sceneSummary: `A ${duration}s ${style} landscape film. ${beats} beats. No characters — the environment IS the story.`,
      dialogue: [],
      timingNotes: `Slow lingering shots. Let the atmosphere build. Cut on light changes, not action. Loop-friendly final frame.`,
    };
  }

  if (type === 'product-driven') {
    return {
      logline: `In ${duration} seconds, ${subject} is revealed — a cinematic product moment for ${platform}.`,
      fullScript: [
        `[HOOK 0:00] Problem: life without ${subject}. Friction. The gap.`,
        ...Array.from({ length: beats - 2 }, (_, i) => {
          const t = Math.round(((i + 1) / (beats - 1)) * duration);
          return `[BEAT ${i + 1} ~0:${String(t).padStart(2, '0')}] ${subject} in action — feature reveal, close-up detail, real-world benefit.`;
        }),
        `[PAYOFF 0:${duration}] ${subject} hero shot. Tagline lands. Product name holds.`,
      ].join('\n\n'),
      sceneSummary: `A ${duration}s ${style} product film. ${beats} beats. ${subject} as hero — minimal voiceover, let the product speak.`,
      dialogue: [
        { speaker: 'VOICEOVER', line: `Introducing ${subject}.` },
        { speaker: 'VOICEOVER', line: `Engineered for the moment.` },
      ],
      timingNotes: `Product reveal in first 3s. Feature demo in middle beats. Logo + tagline hold for at least 2s at end.`,
    };
  }

  if (type === 'abstract') {
    return {
      logline: `In ${duration} seconds, ${shortIdea(project).toLowerCase()} — a visual concept piece for ${platform}.`,
      fullScript: [
        `[HOOK 0:00] The concept appears: a single striking image that defines the theme.`,
        ...Array.from({ length: beats - 2 }, (_, i) => {
          const t = Math.round(((i + 1) / (beats - 1)) * duration);
          return `[BEAT ${i + 1} ~0:${String(t).padStart(2, '0')}] The concept evolves — visual metaphors deepen the emotion.`;
        }),
        `[PAYOFF 0:${duration}] Resolution: the concept crystallizes into its final form. Silence.`,
      ].join('\n\n'),
      sceneSummary: `A ${duration}s ${style} conceptual piece. ${beats} beats. No dialogue — surreal visuals carry the meaning.`,
      dialogue: [],
      timingNotes: `Let images breathe. No rushed cuts. End on a held frame for maximum emotional impact.`,
    };
  }

  // character-driven (default)
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

// ---------------------------------------------------------------------------
// Character Agent
// ---------------------------------------------------------------------------

function buildCharacters(
  project: ProductionProject,
  _script: ScriptOutput | undefined
): CharacterOutput {
  const type = classifyIdea(project.idea);
  const styleHint = project.style;
  const subject = deriveSubjectName(project.idea, type);

  if (type === 'vehicle-driven') {
    return {
      characters: [
        {
          name: subject,
          personality: 'Raw mechanical power — the road is its domain. It does not ask permission.',
          visualAppearance: `${titleCase(styleHint)} vehicle — aggressive aerodynamic body, wide track, muscular fenders, dominant presence.`,
          colors: ['#c0392b', '#2c3e50', '#ecf0f1'],
          facialFeatures: 'N/A — the "face" is the front grille, headlights, and aggressive front bumper.',
          bodyShape: 'Low to the ground, wide stance, motion-blur-ready silhouette. Every line speaks speed.',
          referencePrompt: `${styleHint} vehicle reference sheet, front view + 3/4 angle + side profile, studio lighting, clean white background, sharp detail, no people`,
          negativePrompt: 'people, characters, distorted body, deformed wheels, extra wheels, low quality, blurry, watermark',
        },
      ],
    };
  }

  if (type === 'product-driven') {
    return {
      characters: [
        {
          name: subject,
          personality: 'Precision-engineered. Purposeful. Every detail earns its place.',
          visualAppearance: `${titleCase(styleHint)} product shot — clean lines, premium finish, hero-scale presence.`,
          colors: ['#1a1a2e', '#e0e0e0', '#4fc3f7'],
          facialFeatures: 'N/A — focus on surfaces, logo, ports, and distinguishing design elements.',
          bodyShape: 'Hero-scale product shot. Product fills the frame with confidence, clean negative space around it.',
          referencePrompt: `${styleHint} product reference sheet, front view + angle view + detail close-up, studio lighting, gradient backdrop, sharp focus`,
          negativePrompt: 'people, hands, distortion, logo errors, color inaccuracies, blurry, watermark',
        },
      ],
    };
  }

  // environment-driven and abstract: no character subjects
  if (type === 'environment-driven' || type === 'abstract') {
    return { characters: [] };
  }

  // character-driven (default)
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

// ---------------------------------------------------------------------------
// Asset Agent
// ---------------------------------------------------------------------------

function buildAssetPlan(
  project: ProductionProject,
  characters: CharacterOutput | undefined
): AssetOutput {
  const type = classifyIdea(project.idea);
  const numChars = characters?.characters.length ?? 0;
  const isVidu = (project.targetTool ?? 'general') === 'vidu';
  const subject = deriveSubjectName(project.idea, type);

  if (type === 'vehicle-driven') {
    return {
      productionPlan: `For a ${project.duration}s ${project.style} vehicle film, you need 1 vehicle reference sheet (multiple angles), ~3 environment plates, and one hero shot per storyboard beat. No character reference images required.`,
      workflow: [
        `Step 1 — Generate the VEHICLE reference sheet first (front + 3/4 + side profile). Lock the seed.`,
        `Step 2 — Generate ENVIRONMENT plates: open road, track, or chosen location. Reuse across shots.`,
        `Step 3 — Run the Storyboard + Shot Image agents.`,
        `Step 4 — For each shot, generate the first-frame using vehicle + environment references.`,
        isVidu
          ? `Step 5 — Upload first frame and vehicle reference into Vidu. Paste the video prompt. Render.`
          : `Step 5 — Use the first frame in your image-to-video tool with the shot video prompt.`,
      ],
      characterAssetsNote: `1 vehicle subject (${subject}). Generate a multi-angle reference sheet — front, 3/4, profile. Lock the seed so paint and body remain identical across all shots.`,
      environmentAssetsNote: `Generate one environment plate per unique road/track/location. Reuse across all shots in that location — do NOT regenerate between shots or the background will drift.`,
      propAssetsNote: `Speed elements (dust cloud, tire marks, motion blur) are composited in the video step, not separate assets. Focus on vehicle + environment references only.`,
      totalAssets: 1 + 3,
    };
  }

  if (type === 'environment-driven') {
    return {
      productionPlan: `For a ${project.duration}s ${project.style} environment film, generate ~5 environment plates (wide, mid, close, different lighting conditions). No character assets needed — the environment IS the protagonist.`,
      workflow: [
        `Step 1 — Generate the ESTABLISHING environment plate (widest angle). This is the master reference.`,
        `Step 2 — Generate mid-shot and close-up environment plates to vary depth.`,
        `Step 3 — Generate lighting variation plates (dawn, golden hour, storm, etc.) for the mood arc.`,
        `Step 4 — Run the Storyboard + Shot Image agents.`,
        isVidu
          ? `Step 5 — Upload environment plates into Vidu. Use atmospheric video prompts. Render.`
          : `Step 5 — Feed environment plates into your image-to-video tool with the shot video prompts.`,
      ],
      characterAssetsNote: `No character subjects for this project type. The environment IS the protagonist.`,
      environmentAssetsNote: `Generate at least 3–5 environment plates at different angles and lighting conditions. Reuse across shots to maintain world consistency.`,
      propAssetsNote: `Natural elements (light shafts, particle effects, weather) are rendered by the video tool — not separate prop assets.`,
      totalAssets: 5,
    };
  }

  if (type === 'product-driven') {
    return {
      productionPlan: `For a ${project.duration}s ${project.style} product film, generate 1 product reference sheet (multiple angles), ~2 backdrop plates, and one hero shot per storyboard beat.`,
      workflow: [
        `Step 1 — Generate the PRODUCT reference sheet (front + 3/4 + detail close-up). Lock the seed.`,
        `Step 2 — Generate BACKDROP plates: studio gradient + lifestyle setting.`,
        `Step 3 — Run the Storyboard + Shot Image agents.`,
        `Step 4 — For each shot, generate the first-frame using product + backdrop references.`,
        isVidu
          ? `Step 5 — Upload first frame and product reference into Vidu. Paste the video prompt. Render.`
          : `Step 5 — Use the first frame in your image-to-video tool with the shot video prompt.`,
      ],
      characterAssetsNote: `1 product subject (${subject}). Multi-angle reference sheet — front, 3/4, detail. Lock seed so appearance is identical across shots.`,
      environmentAssetsNote: `Product backdrop plates: clean gradient studio + lifestyle context. Keep lighting consistent across all shots.`,
      propAssetsNote: `Product accessories (cables, packaging, lifestyle props) should be generated as separate references if they appear in multiple shots.`,
      totalAssets: 1 + 2 + 2,
    };
  }

  if (type === 'abstract') {
    return {
      productionPlan: `For a ${project.duration}s ${project.style} abstract film, focus on style references and color palettes. Each shot is a unique visual metaphor — no rigid character references needed.`,
      workflow: [
        `Step 1 — Create a STYLE REFERENCE: one image that locks the color palette and visual tone.`,
        `Step 2 — Generate 2–3 KEY FRAME images — the visual metaphors that carry the concept.`,
        `Step 3 — Run the Storyboard + Shot Image agents (each shot is a standalone visual poem).`,
        `Step 4 — For each shot, generate a first-frame guided by the style reference.`,
        isVidu
          ? `Step 5 — Upload style reference into Vidu. Use atmospheric prompts. Let the model explore.`
          : `Step 5 — Feed key frames into your image-to-video tool with the atmospheric prompts.`,
      ],
      characterAssetsNote: `No character subjects for this abstract project. Visual metaphors carry the concept.`,
      environmentAssetsNote: `Style reference and mood boards act as your "environment." Generate 2–3 key-frame images that define the visual language.`,
      propAssetsNote: `Symbolic objects (if any) should each have a reference image to prevent reinterpretation shot-to-shot.`,
      totalAssets: 3 + 2,
    };
  }

  // character-driven (default)
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

// ---------------------------------------------------------------------------
// Scene Agent
// ---------------------------------------------------------------------------

function buildScenes(project: ProductionProject): SceneOutput {
  const type = classifyIdea(project.idea);
  const subject = deriveSubjectName(project.idea, type);

  if (type === 'vehicle-driven') {
    return {
      locations: [
        `Open desert highway at dawn — infinite straight, heat haze on asphalt, horizon bleeding orange`,
        `High-speed track straight at night — barrier lights blurring past, LED streaks`,
        `Mountain switchback at golden hour — guardrail edge, dramatic cliff drop, tight turns`,
      ],
      props: ['Dust and debris cloud at wheel spin', 'Tire track marks burned into asphalt', 'Speed motion blur streaks'],
      lighting: 'Hard directional low sun — maximizes chrome reflections and body shadow drama. Night shots: practical LED and headlamp lighting only.',
      mood: 'Tension → release → euphoria. Pre-dawn cold blue → midday sharp heat → golden hour triumph.',
      cameraStyle: 'Ground-level tracking (inches off the road), drone top-down chase, driver cabin POV, wheel close-up at speed. Slow-motion inserts at 240fps.',
      environmentPrompt: `${project.style}, vertical 9:16, ${subject.toLowerCase()} on empty road, dramatic directional lighting, cinematic depth, no people`,
    };
  }

  if (type === 'environment-driven') {
    return {
      locations: [
        `${subject} — wide establishing angle, full depth of field, layered foreground/midground/background`,
        `${subject} mid-shot — texture and detail layer, atmospheric depth`,
        `${subject} close-up — intimate detail that reveals a surprising quality`,
      ],
      props: ['Atmospheric particles (dust, pollen, mist, snow)', 'Natural light shafts through elements', 'Environmental movement (wind, water, stillness)'],
      lighting: 'Natural light driven by environment type. Golden hour for warmth, overcast for drama, dawn blue for quiet. Let the environment dictate.',
      mood: 'Wonder → intimacy → awe. The world reveals itself in layers.',
      cameraStyle: 'Long static wide shots, slow drift forward, time-lapse compressed into shot duration. Minimize movement — let the world move itself.',
      environmentPrompt: `${project.style}, vertical 9:16, ${shortIdea(project)}, breathtaking natural beauty, cinematic atmosphere, no people, no characters`,
    };
  }

  if (type === 'product-driven') {
    return {
      locations: [
        `Clean studio backdrop — gradient from deep to light, ${subject.toLowerCase()} as sole subject`,
        `Lifestyle context — ${subject.toLowerCase()} in natural everyday use, soft bokeh background`,
        `Detail close-up station — surface texture, logo, premium finish in razor-sharp focus`,
      ],
      props: [`${subject} packaging or carrying case`, 'Premium lifestyle accessory that contextualizes the product', 'Surface it rests on (marble, wood, brushed metal)'],
      lighting: 'Studio three-point setup: key light for shape, fill to soften shadows, rim light to separate product from background. Premium and clean.',
      mood: 'Discovery → desire → confidence. The product earns its place in every frame.',
      cameraStyle: '360° orbital reveal, extreme close-up push-in, hero-scale static. No handheld — everything precise and intentional.',
      environmentPrompt: `${project.style}, vertical 9:16, ${subject.toLowerCase()} product hero shot, premium studio lighting, clean composition, sharp focus`,
    };
  }

  if (type === 'abstract') {
    return {
      locations: [
        'Liminal space — undefined, dreamlike void that suggests rather than defines',
        'Surreal transformed environment — familiar elements in impossible configurations',
        'Resolution space — where the concept crystallizes into its final visual state',
      ],
      props: ['Symbolic object that embodies the core concept', 'Light or particle system that reacts to the concept', 'Texture that carries emotional weight'],
      lighting: 'Non-physical — light that defies source. Emotional rather than realistic. Color as narrative.',
      mood: 'Unease → recognition → transcendence. The viewer should feel before they understand.',
      cameraStyle: 'Slow drift through undefined space, impossible camera angles, match cuts between metaphors. Time is non-linear.',
      environmentPrompt: `${project.style}, vertical 9:16, surreal abstract visuals, ${shortIdea(project)}, dreamlike atmosphere, conceptual art, no literal characters`,
    };
  }

  // character-driven (default)
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

// ---------------------------------------------------------------------------
// Storyboard Agent
// ---------------------------------------------------------------------------

function buildStoryboard(
  project: ProductionProject,
  _script: ScriptOutput | undefined
): StoryboardOutput {
  const type = classifyIdea(project.idea);
  const shotCount = project.duration === 15 ? 4 : project.duration === 30 ? 7 : 12;
  const avgDur = project.duration / shotCount;
  const subject = deriveSubjectName(project.idea, type);

  if (type === 'vehicle-driven') {
    const angles = ['Ground-level front tracking', 'Aerial top-down chase', 'Driver POV through windshield', 'Wheel close-up spinning', 'Side profile tracking', 'Rear three-quarter', 'Extreme low angle'];
    const states = ['coiled / still', 'building power', 'unleashed', 'at full speed', 'dominant', 'cresting the limit', 'triumphant'];
    const actions = [
      `${subject} sits still — engine idles, exhaust whispers.`,
      `Cold start: wheel spin, surface erupts beneath.`,
      `Full throttle — ${subject} lunges forward, all traction spent.`,
      `Peak speed — world blurs, ${subject} owns the frame.`,
      `${subject} carves a corner — controlled aggression.`,
      `Brief pause — heat shimmer on the hood.`,
      `${subject} disappears into the vanishing point.`,
    ];
    return {
      shots: Array.from({ length: shotCount }, (_, i) => ({
        shotNumber: i + 1,
        duration: `${avgDur.toFixed(1)}s`,
        cameraAngle: angles[i % angles.length],
        action: actions[i % actions.length],
        characterEmotion: states[i % states.length],
        visualNotes: `No people in frame. ${subject} is the sole subject. Negative space for speed lines. Keep the signature paint color consistent.`,
      })),
    };
  }

  if (type === 'environment-driven') {
    const angles = ['Wide panoramic', 'Mid-distance depth shot', 'Close-up texture', 'Sky-to-ground sweep', 'Ground-level looking up', 'Aerial overview', 'Intimate hidden detail'];
    const states = ['still / waiting', 'breathing', 'shifting', 'alive', 'dramatic', 'golden', 'transcendent'];
    const actions = [
      `${subject} at rest — atmosphere thick, light barely touching.`,
      `A subtle shift: wind stirs, light changes angle.`,
      `The world breathes — foreground element drifts into frame.`,
      `Full atmospheric reveal — the environment at its most dramatic.`,
      `Light peaks: golden ratio of shadow and glow.`,
      `Intimate moment: a tiny detail reveals the scale.`,
      `Wide final frame — the world exhales. Silence.`,
    ];
    return {
      shots: Array.from({ length: shotCount }, (_, i) => ({
        shotNumber: i + 1,
        duration: `${avgDur.toFixed(1)}s`,
        cameraAngle: angles[i % angles.length],
        action: actions[i % actions.length],
        characterEmotion: states[i % states.length],
        visualNotes: `No people. Camera movement minimal — let the environment be the motion. Negative space top for captions.`,
      })),
    };
  }

  if (type === 'product-driven') {
    const angles = ['Hero front-facing static', 'Slow 360° orbital', 'Detail extreme close-up', 'Lifestyle context wide', 'Surface texture macro', 'Logo / branding hold', 'Final product hero'];
    const states = ['reveal', 'detail', 'in-use', 'lifestyle', 'premium', 'brand moment', 'aspirational'];
    const actions = [
      `${subject} enters frame — slow reveal from darkness to full light.`,
      `Orbital: product rotates to show all angles.`,
      `Macro detail: surface texture, precision engineering.`,
      `Lifestyle shot: ${subject} in context, natural use.`,
      `Feature highlight: key selling point in clear view.`,
      `Logo / branding frame: product + brand identity.`,
      `Final hero: ${subject} centered, tagline-ready framing.`,
    ];
    return {
      shots: Array.from({ length: shotCount }, (_, i) => ({
        shotNumber: i + 1,
        duration: `${avgDur.toFixed(1)}s`,
        cameraAngle: angles[i % angles.length],
        action: actions[i % actions.length],
        characterEmotion: states[i % states.length],
        visualNotes: `${subject} is the undisputed hero. Clean, precise, premium. Negative space for copy/logo overlay.`,
      })),
    };
  }

  if (type === 'abstract') {
    const angles = ['Undefined floating perspective', 'Macro impossible close-up', 'Drift through void', 'Match cut entry', 'Wide surreal establishing', 'Intimate concept reveal', 'Resolution frame'];
    const states = ['forming', 'unstable', 'transforming', 'realizing', 'dissolving', 'converging', 'resolved'];
    const actions = [
      `Core concept emerges — first visual metaphor takes shape.`,
      `Concept deepens — tension between form and formlessness.`,
      `A shift: the metaphor transforms into something new.`,
      `The idea crystallizes — clarity breaking through abstraction.`,
      `Elements dissolve and reform — evolution of the concept.`,
      `Two metaphors merge — the idea completes itself.`,
      `Final state: concept at rest. The viewer understands.`,
    ];
    return {
      shots: Array.from({ length: shotCount }, (_, i) => ({
        shotNumber: i + 1,
        duration: `${avgDur.toFixed(1)}s`,
        cameraAngle: angles[i % angles.length],
        action: actions[i % actions.length],
        characterEmotion: states[i % states.length],
        visualNotes: `Surreal, dreamlike, no literal characters. Color carries emotion. Negative space is intentional.`,
      })),
    };
  }

  // character-driven (default)
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

// ---------------------------------------------------------------------------
// Shot Image Agent
// ---------------------------------------------------------------------------

function buildShotImages(
  project: ProductionProject,
  storyboard: StoryboardOutput | undefined,
  characters: CharacterOutput | undefined,
  scenes: SceneOutput | undefined
): ShotImageOutput {
  const type = classifyIdea(project.idea);
  const shots = storyboard?.shots ?? [];
  const subject = deriveSubjectName(project.idea, type);
  const propsList = scenes?.props ?? [];
  const envPrompt = scenes?.environmentPrompt ?? '';
  const lighting = scenes?.lighting ?? 'soft cinematic key light';

  if (type === 'vehicle-driven') {
    const mainLocation = scenes?.locations[0] ?? 'open road';
    return {
      shots: shots.map((s, idx) => {
        const refs: string[] = [subject, mainLocation];
        const imagePrompt = [
          `${project.style}, ${s.cameraAngle.toLowerCase()}`,
          `${subject} on ${mainLocation.toLowerCase()}`,
          `vehicle state: ${s.characterEmotion}, action: ${s.action.toLowerCase()}`,
          `environment reference: ${envPrompt}`,
          `lighting: ${lighting}`,
          `no people, no characters, vehicle only`,
          `9:16 vertical, sharp focus, cinematic composition, high detail`,
        ].filter(Boolean).join('. ');
        return {
          shotNumber: s.shotNumber,
          imagePrompt,
          referenceAssets: refs,
          notes:
            idx === 0
              ? 'Establishing vehicle shot — lock paint color, body shape, and angle as the master reference.'
              : idx === shots.length - 1
                ? 'Final shot — frame for a clean loop. Same vehicle paint and lighting direction as shot 1.'
                : 'Reuse vehicle reference exactly. Do not regenerate from scratch — lock the seed.',
        };
      }),
    };
  }

  if (type === 'environment-driven') {
    const mainLocation = scenes?.locations[0] ?? 'the location';
    return {
      shots: shots.map((s, idx) => {
        const refs: string[] = [mainLocation];
        if (propsList.length) refs.push(propsList[idx % propsList.length]);
        const imagePrompt = [
          `${project.style}, ${s.cameraAngle.toLowerCase()}`,
          `${mainLocation} — ${s.action.toLowerCase()}`,
          `atmosphere: ${s.characterEmotion}`,
          `environment reference: ${envPrompt}`,
          `lighting: ${lighting}`,
          `no people, no characters, environment only`,
          `9:16 vertical, cinematic composition, breathtaking detail`,
        ].filter(Boolean).join('. ');
        return {
          shotNumber: s.shotNumber,
          imagePrompt,
          referenceAssets: refs,
          notes:
            idx === 0
              ? 'Master environment plate — save this and reuse as the reference for all following shots.'
              : idx === shots.length - 1
                ? 'Final frame — wide, still, loop-friendly. Same light direction as shot 1.'
                : 'Reuse the environment plate from shot 1. Only re-render the foreground atmospheric element.',
        };
      }),
    };
  }

  if (type === 'product-driven') {
    const backdrop = scenes?.locations[0] ?? 'studio backdrop';
    return {
      shots: shots.map((s, idx) => {
        const refs: string[] = [subject, backdrop];
        const imagePrompt = [
          `${project.style}, ${s.cameraAngle.toLowerCase()}`,
          `${subject} — ${s.action.toLowerCase()}`,
          `product state: ${s.characterEmotion}`,
          `backdrop: ${envPrompt}`,
          `lighting: ${lighting}`,
          `9:16 vertical, razor-sharp focus, premium product photography`,
        ].filter(Boolean).join('. ');
        return {
          shotNumber: s.shotNumber,
          imagePrompt,
          referenceAssets: refs,
          notes:
            idx === 0
              ? 'Product reveal shot — lock the exact color, finish, and form. This is the master reference.'
              : idx === shots.length - 1
                ? 'Hero final shot — product centered, clean framing, brand-ready.'
                : 'Reuse product reference exactly. Consistent color and surface finish across all shots.',
        };
      }),
    };
  }

  if (type === 'abstract') {
    return {
      shots: shots.map((s, idx) => {
        const imagePrompt = [
          `${project.style}, ${s.cameraAngle.toLowerCase()}`,
          `abstract visual: ${s.action.toLowerCase()}`,
          `state: ${s.characterEmotion}`,
          `visual field: ${envPrompt}`,
          `lighting: ${lighting}`,
          `surreal, dreamlike, no literal people or characters`,
          `9:16 vertical, conceptual art direction, emotional color palette`,
        ].filter(Boolean).join('. ');
        return {
          shotNumber: s.shotNumber,
          imagePrompt,
          referenceAssets: ['style reference', `shot ${Math.max(1, s.shotNumber - 1)} last frame`],
          notes:
            idx === 0
              ? 'First visual metaphor — establish the color palette and emotional tone here.'
              : idx === shots.length - 1
                ? 'Final resolution frame — the concept at rest. Hold long.'
                : 'Evolve from the previous frame. Maintain the color palette and style reference.',
        };
      }),
    };
  }

  // character-driven (default)
  const hero = characters?.characters[0];
  const sidekick = characters?.characters[1];
  const mainLocation = scenes?.locations[0] ?? 'primary location';
  return {
    shots: shots.map((s, idx) => {
      const refs: string[] = [];
      if (hero) refs.push(hero.name);
      if (sidekick && (idx === Math.floor(shots.length / 2) || idx === shots.length - 1)) {
        refs.push(sidekick.name);
      }
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

// ---------------------------------------------------------------------------
// Prompt Agent
// ---------------------------------------------------------------------------

function buildPrompts(
  project: ProductionProject,
  storyboard: StoryboardOutput | undefined,
  characters: CharacterOutput | undefined,
  scenes: SceneOutput | undefined
): PromptOutput {
  const type = classifyIdea(project.idea);
  const subject = deriveSubjectName(project.idea, type);
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

      const imagePrompt = buildImagePromptForType(type, s, styleTag, subject, hero, heroRef, heroPalette, envPrompt, lighting, mood, isVidu);
      const videoPrompt = buildVideoPromptForType(type, s, styleTag, subject, mainLocation, camMovement, mood, isVidu);

      const base: PromptShot = {
        shotNumber: s.shotNumber,
        imagePrompt,
        videoPrompt,
        motionDescription:
          type === 'vehicle-driven'
            ? `${subject} motion: acceleration physics, tire deformation, suspension travel. Background parallax at speed. End on a held composition for clean cut.`
            : type === 'environment-driven'
              ? `Atmospheric motion: wind in foliage, water drift, cloud movement. Very slow, deliberate. End on a held wide frame.`
              : type === 'abstract'
                ? `Visual concept evolves fluidly. Secondary motion: particle drift, color bleed, form dissolution. End on held state for clean cut.`
                : `Subject moves naturally, secondary motion in hair/cloth/props. Background parallax suggests depth. End on a held expression for clean cut.`,
        cameraMovement: camMovement,
        consistencyReferences: buildConsistencyRefs(type, subject, hero, heroPalette, mainLocation),
      };

      if (isVidu) {
        buildViduFields(base, type, s, idx, shots, subject, hero, sidekick, scenes, mainLocation, envPrompt, lighting, mood, styleTag, heroPalette, camMovement);
      }

      return base;
    }),
  };
}

function buildImagePromptForType(
  type: IdeaType,
  s: StoryboardShot,
  styleTag: string,
  subject: string,
  hero: Character | undefined,
  heroRef: string,
  heroPalette: string,
  envPrompt: string,
  lighting: string,
  mood: string,
  isVidu: boolean
): string {
  if (isVidu) {
    switch (type) {
      case 'vehicle-driven':
        return [styleTag, s.cameraAngle.toLowerCase(), `subject: ${subject} — ${s.action.toLowerCase()}`, `vehicle state: ${s.characterEmotion}`, `environment: ${envPrompt}`, `lighting: ${lighting}`, `mood: ${mood}`, `no people, vehicle only`, s.visualNotes, `9:16 vertical framing, sharp focus, cinematic motion composition`].filter(Boolean).join('. ');
      case 'environment-driven':
        return [styleTag, s.cameraAngle.toLowerCase(), `${subject}: ${s.action.toLowerCase()}`, `atmosphere: ${s.characterEmotion}`, `environment: ${envPrompt}`, `lighting: ${lighting}`, `mood: ${mood}`, `no people, no characters`, s.visualNotes, `9:16 vertical framing, breathtaking atmosphere, cinematic depth`].filter(Boolean).join('. ');
      case 'product-driven':
        return [styleTag, s.cameraAngle.toLowerCase(), `subject: ${subject} — ${s.action.toLowerCase()}`, `product state: ${s.characterEmotion}`, `backdrop: ${envPrompt}`, `lighting: ${lighting}`, `mood: ${mood}`, s.visualNotes, `9:16 vertical framing, razor-sharp focus, premium product photography`].filter(Boolean).join('. ');
      case 'abstract':
        return [styleTag, s.cameraAngle.toLowerCase(), `abstract concept: ${s.action.toLowerCase()}`, `state: ${s.characterEmotion}`, `visual field: ${envPrompt}`, `lighting / color: ${lighting}`, `mood: ${mood}`, `surreal, no literal characters or people`, s.visualNotes, `9:16 vertical framing, dreamlike, conceptual art direction`].filter(Boolean).join('. ');
      default:
        return buildViduImagePrompt(s, styleTag, heroRef, envPrompt, lighting, mood, heroPalette);
    }
  }

  // non-Vidu
  switch (type) {
    case 'vehicle-driven':
      return `${styleTag}, ${s.cameraAngle.toLowerCase()}, ${subject} ${s.action.toLowerCase()}. ${envPrompt}. No people. 9:16, cinematic lighting, sharp focus --ar 9:16`;
    case 'environment-driven':
      return `${styleTag}, ${s.cameraAngle.toLowerCase()}, ${subject}: ${s.action.toLowerCase()}. No people. ${envPrompt}. 9:16, atmospheric, breathtaking --ar 9:16`;
    case 'product-driven':
      return `${styleTag}, ${s.cameraAngle.toLowerCase()}, ${subject} — ${s.action.toLowerCase()}. ${envPrompt}. 9:16, premium product photography, sharp focus --ar 9:16`;
    case 'abstract':
      return `${styleTag}, ${s.cameraAngle.toLowerCase()}, abstract visual: ${s.action.toLowerCase()}. State: ${s.characterEmotion}. ${envPrompt}. 9:16, surreal, conceptual --ar 9:16`;
    default:
      return `${styleTag}, ${s.cameraAngle.toLowerCase()}, hero performing: ${s.action}. ${envPrompt}. Consistent character: ${heroRef}. 9:16, cinematic lighting, sharp focus, high detail --ar 9:16 --v 6`;
  }
}

function buildVideoPromptForType(
  type: IdeaType,
  s: StoryboardShot,
  styleTag: string,
  subject: string,
  location: string,
  camMovement: string,
  mood: string,
  isVidu: boolean
): string {
  if (isVidu) {
    switch (type) {
      case 'vehicle-driven':
        return [`${styleTag} animation`, `${s.cameraAngle.toLowerCase()} of ${subject} in ${location}`, `${subject} ${s.action.toLowerCase()} — vehicle state: ${s.characterEmotion}`, `camera: ${camMovement.toLowerCase()}`, `mood: ${mood}`, `duration ${s.duration}, no people, smooth motion, no flicker`].join('. ');
      case 'environment-driven':
        return [`${styleTag} animation`, `${location}: ${s.action.toLowerCase()}`, `atmosphere: ${s.characterEmotion}`, `camera: ${camMovement.toLowerCase()}`, `mood: ${mood}`, `duration ${s.duration}, no people, slow deliberate motion, atmospheric`].join('. ');
      case 'product-driven':
        return [`${styleTag} animation`, `${s.cameraAngle.toLowerCase()} of ${subject} in ${location}`, `${subject}: ${s.action.toLowerCase()} — product state: ${s.characterEmotion}`, `camera: ${camMovement.toLowerCase()}`, `mood: ${mood}`, `duration ${s.duration}, premium product motion, no flicker`].join('. ');
      case 'abstract':
        return [`${styleTag} animation`, `abstract atmospheric`, s.action.toLowerCase(), `state: ${s.characterEmotion}`, `camera: ${camMovement.toLowerCase()}`, `mood: ${mood}`, `duration ${s.duration}, surreal fluid motion`].join('. ');
      default:
        return buildViduVideoPrompt(s, styleTag, location, camMovement, mood);
    }
  }

  // non-Vidu
  switch (type) {
    case 'vehicle-driven':
      return `${styleTag}, ${s.cameraAngle.toLowerCase()}, ${subject} ${s.action.toLowerCase()}. Vehicle state: ${s.characterEmotion}. Camera: ${camMovement.toLowerCase()}. Duration ${s.duration}.`;
    case 'environment-driven':
      return `${styleTag}, ${s.cameraAngle.toLowerCase()}, ${subject} atmosphere: ${s.characterEmotion}. ${s.action.toLowerCase()}. Camera: ${camMovement.toLowerCase()}. Duration ${s.duration}.`;
    case 'product-driven':
      return `${styleTag}, ${s.cameraAngle.toLowerCase()}, ${subject} ${s.action.toLowerCase()}. Product state: ${s.characterEmotion}. Camera: ${camMovement.toLowerCase()}. Duration ${s.duration}.`;
    case 'abstract':
      return `${styleTag}, abstract atmospheric, ${s.action.toLowerCase()}. State: ${s.characterEmotion}. Camera: ${camMovement.toLowerCase()}. Duration ${s.duration}.`;
    default:
      return `${styleTag}, ${s.cameraAngle.toLowerCase()}, ${s.action} ${s.characterEmotion} expression. Camera: ${camMovement.toLowerCase()}. Duration ${s.duration}.`;
  }
}

function buildConsistencyRefs(
  type: IdeaType,
  subject: string,
  hero: Character | undefined,
  heroPalette: string,
  mainLocation: string
): string[] {
  switch (type) {
    case 'vehicle-driven':
      return [`${subject} reference sheet (front + 3/4 + profile)`, 'Environment plate from Scene Agent', 'Lock vehicle paint color and badging across shots'];
    case 'environment-driven':
      return ['Master environment plate from Scene Agent', 'Lock lighting direction across shots', 'Atmospheric consistency: same weather / time-of-day'];
    case 'product-driven':
      return [`${subject} reference sheet from Character Agent`, 'Backdrop plate from Scene Agent', 'Lock product color, finish, and logo across shots'];
    case 'abstract':
      return ['Style reference image (palette + visual tone)', 'Emotional consistency across shot sequence', 'Color palette locked to style reference'];
    default:
      return [
        'Character reference sheet from Character Agent',
        'Environment prompt from Scene Agent',
        heroPalette ? `Keep palette: ${heroPalette}` : 'Maintain consistent palette',
      ];
  }
}

function buildViduFields(
  base: PromptShot,
  type: IdeaType,
  s: StoryboardShot,
  idx: number,
  shots: StoryboardShot[],
  subject: string,
  hero: Character | undefined,
  sidekick: Character | undefined,
  scenes: SceneOutput | undefined,
  mainLocation: string,
  envPrompt: string,
  lighting: string,
  mood: string,
  styleTag: string,
  heroPalette: string,
  camMovement: string
): void {
  const propsList = scenes?.props ?? [];
  const propForShot = propsList.length ? propsList[idx % propsList.length] : 'featured element';
  const isFirst = idx === 0;
  const isLast = idx === shots.length - 1;
  const prevShot = idx > 0 ? shots[idx - 1] : null;

  // Motion prompt (v1 field used by all types)
  base.motionPrompt = buildViduMotionPromptForType(s, mood, type, subject);

  if (type === 'character-driven') {
    const charsInShot = pickCharactersForShot(hero?.name, sidekick?.name, idx, shots.length);
    base.characterConsistency = buildCharacterConsistency(hero?.name ?? 'Hero', heroPalette, hero?.referencePrompt ?? '', sidekick?.name);
    base.sceneContinuity = buildSceneContinuity(mainLocation, lighting, idx, shots.length);
    base.negativePrompt = buildViduNegativePrompt(styleTag);
    base.multiReferenceInstructions = buildMultiRefInstructions(idx);
    base.suggestedReferenceImages = buildSuggestedRefs(hero?.name ?? 'Hero', mainLocation, styleTag, idx === 0);
    base.characterReference = buildCharacterReferenceBlock(charsInShot, s, hero, sidekick);
    base.environmentReference = buildEnvironmentReferenceBlock(mainLocation, envPrompt, lighting, mood, styleTag, isFirst);
    base.propsRef = buildPropsBlock(propForShot, heroPalette);
    base.mainImagePrompt = buildMainImagePrompt(s, styleTag, charsInShot, mainLocation, propForShot, lighting, mood, heroPalette);
    base.viduVideoPrompt = buildViduVideoPromptDetailed(s, styleTag, charsInShot, mainLocation, propForShot, camMovement);
    base.motion = buildMotionBlock(s, propForShot);
    base.camera = buildCameraBlock(s, camMovement);
    base.negativeChecklist = buildNegativeChecklist();
    base.continuity = buildContinuityBlock(s, prevShot, mainLocation, propForShot, isFirst, isLast);
    return;
  }

  if (type === 'vehicle-driven') {
    base.characterConsistency = `${subject} must match the reference sheet exactly: same paint, same body, same wheels. No people in frame. Lock seed for cross-shot identity.`;
    base.sceneContinuity = buildSceneContinuity(mainLocation, lighting, idx, shots.length);
    base.negativePrompt = `people, characters, distorted vehicle body, extra wheels, logo errors, watermark, text, low quality, style drift away from ${styleTag}`;
    base.multiReferenceInstructions = `Upload the ${subject} reference sheet into Vidu's Subject Reference slot. Upload the environment plate into the Background slot. Weight Subject Reference highest.`;
    base.suggestedReferenceImages = [`${subject} reference sheet (front + 3/4)`, `${mainLocation} environment plate`, `${styleTag} style swatch`];
    base.characterReference = {
      needed: [`${subject} reference sheet (front + 3/4 + profile)`],
      posePrompt: `${subject}: ${s.action.toLowerCase()}. ${s.characterEmotion} mechanical state. Low-angle shot emphasizes aggressive stance.`,
      emotionPrompt: `${subject} visual state: ${s.characterEmotion}. Headlights, exhaust, and wheels reflect the vehicle's current intensity.`,
      consistencyNotes: `${subject} must match the reference sheet: same paint, same wheels, same badging. No people. Use the same seed as shot 1.`,
    };
    base.environmentReference = buildEnvironmentReferenceBlock(mainLocation, envPrompt, lighting, mood, styleTag, isFirst);
    base.mainImagePrompt = [styleTag, `${s.cameraAngle.toLowerCase()} of ${subject} in ${mainLocation}`, `action: ${s.action.toLowerCase()}`, `vehicle state: ${s.characterEmotion}`, `lighting: ${lighting}`, `no people, vehicle only`, `9:16 vertical, sharp focus, cinematic composition`].join('. ');
    base.viduVideoPrompt = `${styleTag} animation, ${s.cameraAngle.toLowerCase()}, ${subject} ${s.action.toLowerCase()} with ${s.characterEmotion} state in ${mainLocation}. Camera: ${camMovement.toLowerCase()}. Duration ${s.duration}. No people.`;
    base.motion = {
      characterAction: `${subject}: ${s.action.toLowerCase()}. Vehicle physics: suspension compression, tire deformation, exhaust rhythm.`,
      objectMovement: `${propForShot} reacts naturally to vehicle motion.`,
      timing: `Shot duration: ${s.duration}. First 20% = setup pose. Middle 60% = peak action. Last 20% = held frame for clean cut.`,
    };
    base.camera = buildCameraBlock(s, camMovement);
    base.negativeChecklist = ['Do not add people or characters', 'Do not change vehicle paint or body', 'No distorted wheels or extra axles', 'No flickering', 'No watermark', 'No style drift'];
    base.continuity = buildContinuityBlock(s, prevShot, mainLocation, propForShot, isFirst, isLast);
    return;
  }

  if (type === 'environment-driven' || type === 'abstract') {
    base.sceneContinuity = buildSceneContinuity(mainLocation, lighting, idx, shots.length);
    base.negativePrompt = buildViduNegativePrompt(styleTag);
    base.multiReferenceInstructions = `Upload the environment plate into Vidu's Background Reference slot. Use atmospheric prompts. The environment is the subject — no character reference needed.`;
    base.suggestedReferenceImages = [`${mainLocation} environment plate`, `${styleTag} style swatch`];
    // No characterReference block for environment-driven and abstract
    base.environmentReference = buildEnvironmentReferenceBlock(mainLocation, envPrompt, lighting, mood, styleTag, isFirst);
    base.mainImagePrompt = [styleTag, `${s.cameraAngle.toLowerCase()} of ${mainLocation}`, s.action.toLowerCase(), `atmosphere: ${s.characterEmotion}`, `lighting: ${lighting}`, `no people, no characters`, `9:16 vertical, cinematic atmosphere`].join('. ');
    base.viduVideoPrompt = `${styleTag} animation, ${mainLocation}: ${s.action.toLowerCase()}. Atmosphere: ${s.characterEmotion}. Camera: ${camMovement.toLowerCase()}. Duration ${s.duration}. No people.`;
    base.motion = {
      characterAction: type === 'abstract' ? `Visual concept: ${s.action.toLowerCase()}.` : `Environmental motion: ${s.action.toLowerCase()}.`,
      objectMovement: `Atmospheric elements drift naturally — particles, light, ambient movement.`,
      timing: `Shot duration: ${s.duration}. Slow, deliberate motion throughout. Hold the final frame for a clean cut.`,
    };
    base.camera = buildCameraBlock(s, camMovement);
    base.negativeChecklist = ['Do not add people or characters', 'No flickering', 'No watermark', 'No style drift', 'No sudden unnatural motion'];
    base.continuity = buildContinuityBlock(s, prevShot, mainLocation, propForShot, isFirst, isLast);
    return;
  }

  if (type === 'product-driven') {
    base.characterConsistency = `${subject} must match the reference sheet exactly: same color, same finish, same logo. Lock seed across shots.`;
    base.sceneContinuity = buildSceneContinuity(mainLocation, lighting, idx, shots.length);
    base.negativePrompt = `distorted product, logo errors, color inaccuracies, blurry, extra objects, watermark, style drift away from ${styleTag}`;
    base.multiReferenceInstructions = `Upload the ${subject} reference sheet into Vidu's Subject Reference slot. Upload the backdrop plate into the Background slot.`;
    base.suggestedReferenceImages = [`${subject} reference sheet (front + 3/4 + detail)`, `${mainLocation} backdrop plate`, `${styleTag} style swatch`];
    base.characterReference = {
      needed: [`${subject} reference sheet (front + 3/4 + detail)`],
      posePrompt: `${subject}: ${s.action.toLowerCase()}. Product at optimal angle — ${s.characterEmotion} presentation.`,
      emotionPrompt: `${subject} state: ${s.characterEmotion}. Surface finish, logo, and key features clearly visible.`,
      consistencyNotes: `${subject} must match the reference: same color, same finish, same logo. Lock seed across shots.`,
    };
    base.environmentReference = buildEnvironmentReferenceBlock(mainLocation, envPrompt, lighting, mood, styleTag, isFirst);
    base.mainImagePrompt = [styleTag, `${s.cameraAngle.toLowerCase()} of ${subject}`, s.action.toLowerCase(), `product state: ${s.characterEmotion}`, `backdrop: ${mainLocation}`, `lighting: ${lighting}`, `9:16 vertical, razor-sharp focus, premium product photography`].join('. ');
    base.viduVideoPrompt = `${styleTag} animation, ${s.cameraAngle.toLowerCase()}, ${subject} ${s.action.toLowerCase()} with ${s.characterEmotion} presentation in ${mainLocation}. Camera: ${camMovement.toLowerCase()}. Duration ${s.duration}.`;
    base.motion = {
      characterAction: `${subject}: ${s.action.toLowerCase()}. Smooth, controlled product motion.`,
      objectMovement: `Surface light reflections shift naturally as the product moves. No jitter, no distortion.`,
      timing: `Shot duration: ${s.duration}. First 20% = reveal. Middle 60% = feature display. Last 20% = hold for logo/tagline.`,
    };
    base.camera = buildCameraBlock(s, camMovement);
    base.negativeChecklist = ['Do not change product color or finish', 'No distorted product shape', 'No unintended hands in frame', 'No logo errors', 'No flickering', 'No watermark'];
    base.continuity = buildContinuityBlock(s, prevShot, mainLocation, propForShot, isFirst, isLast);
  }
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

function buildViduMotionPromptForType(
  s: StoryboardShot,
  mood: string,
  type: IdeaType,
  subject: string
): string {
  if (type === 'vehicle-driven') {
    return [
      `Primary motion: ${subject} ${s.action.toLowerCase()}.`,
      `Secondary motion: suspension travel, exhaust smoke, tire deformation, surface debris.`,
      `Background: speed-reactive parallax — faster speed = more blur.`,
      `Avoid: people appearing, vehicle morphing, wheel distortion, sudden teleporting.`,
    ].join(' ');
  }
  if (type === 'environment-driven') {
    return [
      `Primary motion: atmospheric — ${s.action.toLowerCase()}.`,
      `Secondary motion: wind in foliage, water drift, particle movement, light shift.`,
      `Background: the world breathes. Very slow, organic motion to suggest passage of time.`,
      `Avoid: sudden unnatural motion, people appearing, style drift.`,
    ].join(' ');
  }
  if (type === 'product-driven') {
    return [
      `Primary motion: ${subject} ${s.action.toLowerCase()}.`,
      `Secondary motion: surface light reflections shift naturally as the product moves.`,
      `Background: very subtle bokeh drift. Product stays sharp at all times.`,
      `Avoid: people hands (unless lifestyle shot), product distortion, color drift.`,
    ].join(' ');
  }
  if (type === 'abstract') {
    return [
      `Primary motion: visual concept ${s.action.toLowerCase()}.`,
      `Secondary motion: particle drift, color bleed, form dissolution and reformation.`,
      `Background: the concept space breathes — non-physical, emotional motion.`,
      `Avoid: literal characters appearing, sudden realistic motion, style drift.`,
    ].join(' ');
  }
  // character-driven
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
      `clean negative space for subject placement.`,
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
      `9:16 vertical. Subject positioned on the rule-of-thirds line. ` +
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
        `This is the establishing shot — nothing to carry over. Lock the subject ` +
        `reference, environment plate, and prop reference here so every following shot ` +
        `can reuse them.`,
      whatChanges: `Sets the world. Introduces the subject and the location (${location}).`,
    };
  }
  const carry = [
    `Subject identity, palette (same as shot ${s.shotNumber - 1})`,
    `Location: ${location} (same environment plate)`,
    `Lighting direction (same key-light side)`,
    `${prop} appearance (identical color, scale, wear)`,
  ].join('; ');
  const changes = isLast
    ? `Final beat — subject arrives at the payoff state. Camera holds longer. Frame composed for loop back to shot 1.`
    : `Action evolves: ${prev?.action.toLowerCase() ?? 'previous beat'} → ${s.action.toLowerCase()}. ` +
      `State shifts to ${s.characterEmotion}. Camera moves to ${s.cameraAngle.toLowerCase()}.`;
  return {
    remainsSame: carry,
    whatChanges: changes,
  };
}

// ---------------------------------------------------------------------------
// Consistency Agent
// ---------------------------------------------------------------------------

function buildConsistency(
  project: ProductionProject,
  previous: PreviousOutputs
): ConsistencyOutput {
  const type = classifyIdea(project.idea);
  const subject = deriveSubjectName(project.idea, type);
  const hasChars = !!previous.character;
  const hasScene = !!previous.scene;
  const hasStory = !!previous.storyboard;

  if (type === 'vehicle-driven') {
    return {
      characterNotes: [
        `${subject} paint color and body must be identical across all shots. Lock the seed from the first reference image.`,
        'Wheel design, badge, and trim must not drift between shots — use the same reference sheet in every prompt.',
      ],
      sceneNotes: [
        hasScene
          ? 'Road surface and horizon line must match across shots in the same location.'
          : 'No scene bible found — generate it first.',
        'If the same stretch of road appears in multiple shots, reuse the environment plate — do not regenerate.',
      ],
      styleNotes: [
        `Style "${project.style}" must be uniform. No realistic frames mixed with stylized.`,
        'No people should appear in any shot. Pure vehicle + environment.',
      ],
      missingDetails: [
        hasStory ? `Confirm license plate / badge detail stays consistent in close-ups.` : 'Storyboard missing.',
        'Specify the exact ground reflection behavior for the hero shot.',
      ],
      fixes: [
        'Add the vehicle reference image to every prompt as the primary anchor.',
        'Lock palette in every prompt: paint color, chrome finish, window tint.',
        'Re-render any shot where the vehicle paint or wheel design has drifted.',
      ],
    };
  }

  if (type === 'environment-driven') {
    return {
      characterNotes: [
        'No character subjects in this project. Consistency is environment-only.',
        'If any atmospheric element (specific rock formation, tree, signage) appears in multiple shots, it must stay identical.',
      ],
      sceneNotes: [
        hasScene
          ? 'Lighting direction must stay consistent across shots in the same location. Re-use the master environment plate.'
          : 'No scene bible found — generate it first.',
        'Time-of-day must be consistent within each act: dawn shots stay dawn, golden hour stays golden hour.',
      ],
      styleNotes: [
        `Style "${project.style}" must be uniform across all shots. No realistic frames.`,
        'Atmospheric mood arc should be intentional, not accidental color drift.',
      ],
      missingDetails: [
        hasStory ? 'Confirm the final frame has the same horizon line as the opening frame for a clean loop.' : 'Storyboard missing.',
        'Specify which time of day each location group is set in.',
      ],
      fixes: [
        'Lock the master environment plate as a reference for every following shot.',
        'Check that cloud/sky state is consistent within each lighting act.',
        'Re-render any shot where the horizon line has shifted unexpectedly.',
      ],
    };
  }

  if (type === 'product-driven') {
    return {
      characterNotes: [
        `${subject} color, finish, and logo must be identical across all shots. Lock the reference seed.`,
        'Logo and brand markings must be legible in every close-up shot.',
      ],
      sceneNotes: [
        hasScene
          ? 'Backdrop gradient and lighting color temperature must stay consistent in studio shots.'
          : 'No scene bible found — generate it first.',
        'Surface the product rests on must not change within the same scene group.',
      ],
      styleNotes: [
        `Style "${project.style}" must be consistent. Premium aesthetic throughout — no rough or noisy frames.`,
        'Product scale relative to frame must not drift between matching shots.',
      ],
      missingDetails: [
        hasStory ? `Confirm logo is visible and legible in the final hero shot.` : 'Storyboard missing.',
        'Specify the exact tagline text to overlay on the final product hero frame.',
      ],
      fixes: [
        'Add the product reference image to every prompt as the primary anchor.',
        'Lock the studio lighting color temperature (Kelvin value) in all prompts.',
        'Re-render any shot where the product color or finish looks different from the reference.',
      ],
    };
  }

  if (type === 'abstract') {
    return {
      characterNotes: [
        'No character subjects in this abstract project.',
        'If a symbolic object appears in multiple shots, it must remain visually consistent.',
      ],
      sceneNotes: [
        'Color palette must be consistent as the concept evolves — palette is the continuity anchor.',
        hasScene ? 'The visual space/void must feel like a coherent world, not random unrelated frames.' : 'No scene bible found.',
      ],
      styleNotes: [
        `Style "${project.style}" must be maintained. Dreamlike frames must share the same visual language.`,
        'Emotional arc (unease → recognition → transcendence) must be readable without words.',
      ],
      missingDetails: [
        hasStory ? 'Confirm the final frame delivers a resolved emotional state — the concept at rest.' : 'Storyboard missing.',
        'Define the one key symbolic object or visual motif that ties all shots together.',
      ],
      fixes: [
        'Use a style reference image in every prompt to anchor the visual language.',
        'Check that the color palette does not drift — saturation and hue must stay in the defined range.',
        'Re-render any shot where the surreal atmosphere feels inconsistent with the established concept.',
      ],
    };
  }

  // character-driven (default)
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
      "Re-render any shot where the hero's signature color is missing.",
    ],
  };
}

// ---------------------------------------------------------------------------
// Marketing Agent
// ---------------------------------------------------------------------------

function buildMarketing(
  project: ProductionProject,
  script: ScriptOutput | undefined
): MarketingOutput {
  const type = classifyIdea(project.idea);
  const subject = deriveSubjectName(project.idea, type);
  const platformTag =
    project.platform === 'YouTube Shorts'
      ? '#shorts'
      : project.platform === 'TikTok'
        ? '#fyp'
        : '#reels';
  const shotCount = project.duration === 15 ? 4 : project.duration === 30 ? 7 : 12;

  if (type === 'vehicle-driven') {
    const hook = `Zero to breathless in ${project.duration} seconds.`;
    return {
      title: `${subject} Unleashed (${project.duration}s)`,
      description: `${hook}\n\nCinematic ${project.style} vehicle film. ${project.platform}-optimized.\n\nFollow for more.`,
      hashtags: [platformTag, '#cars', '#automotive', '#speed', `#${project.style.replace(/\s|-/g, '').toLowerCase()}`, '#cinematic', '#viral'],
      thumbnailPrompt: `${project.style} thumbnail, ${subject.toLowerCase()} at speed, dramatic angle, intense lighting, bold text space at top, high contrast, 9:16`,
      hookText: hook,
      pinnedComment: `Which shot hit hardest? Drop the number (1–${shotCount}) 🔥`,
    };
  }

  if (type === 'environment-driven') {
    const hook = `Some places don't need a story. They just need a camera.`;
    return {
      title: `${subject} — A ${project.duration}s Journey`,
      description: `${hook}\n\n${project.style} landscape film for ${project.platform}. No narration needed.\n\nFollow for more.`,
      hashtags: [platformTag, '#nature', '#landscape', '#cinematic', `#${project.style.replace(/\s|-/g, '').toLowerCase()}`, '#atmospheric', '#viral'],
      thumbnailPrompt: `${project.style} thumbnail, ${subject.toLowerCase()} at its most dramatic moment, breathtaking atmosphere, golden light, 9:16`,
      hookText: hook,
      pinnedComment: `Where would you want to be right now? Drop a 📍`,
    };
  }

  if (type === 'product-driven') {
    const hook = `${subject} — engineered for the moment.`;
    return {
      title: `Introducing ${subject} (${project.duration}s)`,
      description: `${hook}\n\n${project.style} product film optimized for ${project.platform}.\n\nFollow for more.`,
      hashtags: [platformTag, '#product', '#tech', '#design', `#${project.style.replace(/\s|-/g, '').toLowerCase()}`, '#commercial', '#viral'],
      thumbnailPrompt: `${project.style} thumbnail, ${subject.toLowerCase()} hero shot center-frame, premium lighting, brand-ready framing, 9:16`,
      hookText: hook,
      pinnedComment: `Would you use this? Drop ✅ or ❌`,
    };
  }

  if (type === 'abstract') {
    const hook = `Some ideas can't be explained. Only felt.`;
    return {
      title: `${titleCase(shortIdea(project))} — ${project.duration}s`,
      description: `${hook}\n\n${project.style} conceptual film for ${project.platform}.\n\nFollow for more.`,
      hashtags: [platformTag, '#abstract', '#conceptual', '#art', `#${project.style.replace(/\s|-/g, '').toLowerCase()}`, '#viral'],
      thumbnailPrompt: `${project.style} thumbnail, surreal abstract visual from the project, emotionally striking, bold color, 9:16`,
      hookText: hook,
      pinnedComment: `What did this make you feel? One word only ⬇️`,
    };
  }

  // character-driven (default)
  const hook = script?.dialogue[0]?.line ?? `What if ${shortIdea(project).toLowerCase()}?`;
  return {
    title: `${titleCase(shortIdea(project))} 🤯 (${project.duration}s)`,
    description: `${hook}\n\nMade with the AI Production Team. ${project.style} animation, optimized for ${project.platform}.\n\nFollow for more.`,
    hashtags: [platformTag, '#ai', '#animation', `#${project.style.replace(/\s|-/g, '').toLowerCase()}`, '#viral', '#aiart'],
    thumbnailPrompt: `${project.style} thumbnail, hero center-frame, intense expression, bold ${project.duration === 15 ? '"15s"' : project.duration === 30 ? '"30s"' : '"60s"'} text overlay, high contrast, mobile-readable at small sizes, 9:16`,
    hookText: hook,
    pinnedComment: `Which scene was your favorite? 👀  (Drop the shot number 1-${shotCount})`,
  };
}
