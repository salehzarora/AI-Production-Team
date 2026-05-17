# AI Production Team

Turn one video idea into a complete animation production package. Seven specialist AI agents work as a connected pipeline — script, characters, scenes, storyboard, prompts, consistency, marketing — and hand the final package off to you, ready to copy into your generation tools.

This is a **frontend-only MVP**. All AI outputs are **mocked** (deterministic structured data derived from your inputs). The architecture is built so a real backend can be slotted in later without rewriting the UI.

---

## What it does

1. You write a video idea, pick a platform (YouTube Shorts / TikTok / Reels), a style, and a length (15 / 30 / 60s).
2. The pipeline runs each agent in order, passing the previous outputs forward:
   - **Script Agent** — logline, full script, dialogue, timing notes.
   - **Character Agent** — character bible with appearance, palette, reference + negative prompts.
   - **Scene Agent** — locations, props, lighting, mood, camera style, environment prompt.
   - **Storyboard Agent** — shot-by-shot table (angle, duration, action, emotion, notes).
   - **Prompt Agent** — image + video prompts per shot, motion + camera movement.
   - **Consistency Agent** — character / scene / style notes, missing details, fixes.
   - **Marketing Agent** — title, description, hashtags, thumbnail prompt, hook, pinned comment.
3. The **Final Package** page shows everything organized with Copy buttons and JSON export.

Projects are saved to `localStorage` so you can close the tab and continue later.

---

## Run it

```bash
npm install
npm run dev
```

Then open the printed URL (default http://localhost:5173).

To build for production:

```bash
npm run build
npm run preview
```

---

## Vidu Mode

When you pick **Vidu** as the Target tool on the New Production form, the Prompt Agent switches into a richer output mode designed for Vidu's multi-reference image-to-video pipeline. Each shot gets:

- **Image Prompt** — descriptive first-frame prompt with character + environment + lighting baked in.
- **Video Prompt** — short, concrete action + camera clauses (Vidu prefers terse).
- **Motion Prompt** — primary + secondary motion isolated, plus what to avoid.
- **Camera Movement** — explicit camera language (push-in, dolly, tracking).
- **Character Consistency** — instructions to lock identity across shots (seed + reference slot).
- **Scene Continuity** — how this shot connects to the previous / next shot.
- **Negative Prompt** — common Vidu failure modes stripped out.
- **Multi-Reference Instructions** — exactly which images to upload to which slot.
- **Suggested Reference Images** — the list of images you should prepare.

The Final Package page shows a dedicated **Vidu Prompts** section with one card per shot, badges for each field type (Image / Video / Motion / Camera / Negative), per-field Copy buttons, and a **Copy full shot prompt** button.

### How to use Vidu prompts in Vidu

1. Open Vidu and pick **Image to Video** with **Subject Reference** enabled.
2. Upload reference images to the multi-reference slots in this priority:
   1. Hero character sheet (front + 3/4 + back) — locks identity.
   2. Sidekick character sheet (if present).
   3. Environment / location plate (from the Scene Bible).
   4. Style swatch (palette + lighting sample).
   5. From shot 2 onward: the **last frame of the previous shot** for continuity.
3. Paste the **Image Prompt** into the prompt field and generate the first frame. Iterate until the frame matches the storyboard.
4. Switch to video, paste the **Video Prompt** + **Motion Prompt**, paste the **Negative Prompt** into Vidu's negative field, and generate.
5. Lock the seed for the project and reuse it across every shot — this is the single biggest lever for character consistency.

### Multi-reference consistency — how to handle it

- **Identity**: weight the character reference highest. Same seed across shots. Re-use the same character sheet image — don't regenerate it shot to shot.
- **Look**: keep the style swatch + environment plate in every shot's reference set. If you drop them, Vidu will drift the look.
- **Continuity**: for any shot after the first, swap the lowest-priority reference slot for the last frame of the previous shot. This is how you stitch shots together.
- **Negative prompt**: copy the generated negative prompt verbatim — it already excludes Vidu's most common failure modes (extra fingers, morphing identity, style drift, flickering).

### Adding other target tools later

The `TargetTool` union is the single registration point. To add a tool (e.g. `'sora'`):

1. **Extend the union** in `src/types/index.ts`: add `'sora'` to `TargetTool` and a label in `TARGET_TOOL_LABELS`.
2. **Add a branch** in `src/services/productionAiService.ts` `buildPrompts` (alongside the `isVidu` branch). Write tool-specific image/video/motion prompt builders.
3. **(Optional) Add a dedicated section** in `src/pages/FinalPackage.tsx` that renders only when `targetTool === 'sora'`, similar to the Vidu Prompts section.
4. **(Optional) Add tool-specific fields** to `PromptShot` in `src/types/index.ts` if the tool needs extras (e.g. Sora's `duration` parameter or aspect-ratio variants).

The UI picks up the new tool automatically — it iterates over `TOOLS` in `NewProduction.tsx` (update the array), and Dashboard cards read from `TARGET_TOOL_LABELS`.

---

## Workflow

```
Idea → Script → Characters → Scenes → Storyboard → Prompts → Consistency → Marketing → Final Package
```

Each agent card supports:
- **Run agent** — generate a structured output.
- **Continue** — kick off the next pending agent.
- **Regenerate** — re-run the current agent.
- **Edit output** — open a JSON editor for the agent's output (autosaves on valid JSON).

The pipeline strip at the top shows progress at a glance.

---

## Project structure

```
src/
  components/        # AgentCard, WorkflowPipeline, StatusBadge, OutputPanel, CopyButton, Layout
  data/              # agents.ts — agent catalog + pipeline order
  hooks/             # useProjects, useProject (localStorage-backed)
  pages/             # Dashboard, NewProduction, Workflow, FinalPackage
  services/          # productionAiService.ts — mock AI service (swap point for backend)
  types/             # All TS types: ProductionProject, WorkflowStep, Agent, output shapes
  utils/             # storage, project (immutable transforms), id, copy
```

---

## Adding a new agent

1. **Define the output shape** in `src/types/index.ts` (e.g. `MusicOutput`). Add it to the `AgentOutput` union and to `FinalPackage`.
2. **Register the agent** in `src/data/agents.ts`:
   - Add a new entry in the `AGENTS` map with id, name, role, description, systemPrompt, outputSchema, color.
   - Add the id to `AGENT_PIPELINE` in the position you want it to run.
   - Add the display label to `PIPELINE_LABELS`.
3. **Add a mock generator** in `src/services/productionAiService.ts`:
   - Add a `case 'music':` to the `runAgentStep` switch.
   - Write a `buildMusic(project, previous)` function that returns realistic mock data.
4. **Render the output** in `src/components/OutputPanel.tsx`:
   - Add a renderer (`MusicView`) and a case in the agent switch.
5. **Merge into the final package** in `src/utils/project.ts` `mergeFinalPackage()`.
6. **Add to the final page sections** in `src/pages/FinalPackage.tsx`.

That's it — the UI, persistence, and workflow logic all pick it up automatically.

---

## Connecting real AI later (backend integration)

The mock service in `src/services/productionAiService.ts` is the single replacement point. The contract is:

```ts
runAgentStep(agent: Agent, project: ProductionProject, previousOutputs: PreviousOutputs)
  => Promise<AgentOutput>
```

To go live:

1. **Build a backend** (Node/Express, Bun, Cloudflare Worker, FastAPI, anything). Store provider API keys server-side only.
2. **Expose one endpoint**: `POST /api/production/run-step` with body `{ agentId, project, previousOutputs }`.
3. **On the server**, fan out to your AI provider (Anthropic, OpenAI, etc.) using the agent's `systemPrompt` and the relevant context from `project` + `previousOutputs`. Validate the model's response against the agent's expected output shape (Zod is a good fit) and return it as JSON.
4. **Replace the body** of `runAgentStep` with a single `fetch` call to that endpoint — see the comment block at the top of `productionAiService.ts` for the exact snippet.

**Never call AI providers directly from the browser.** API keys belong on the server.

---

## Future improvements

- **Real backend** with provider-agnostic adapter (Anthropic / OpenAI / Gemini).
- **Image / video preview** per shot using Replicate, Runway, Kling, or Veo.
- **Multi-character bible** with linked references across shots.
- **Versioning** for each agent run so you can diff outputs.
- **Collaboration** — multi-user editing, shared projects.
- **Export to .fdx / .pdf** for traditional production tools.
- **Realtime streaming** of agent outputs (SSE) instead of polling.
- **Cost estimator** showing $ per agent run when real APIs are wired in.

---

## Constraints

- No authentication.
- No backend, no database.
- No paid APIs.
- No API keys in the client.
- Frontend MVP only. Build it, ship it, then plug AI in behind the same interface.
