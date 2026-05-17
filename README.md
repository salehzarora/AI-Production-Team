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

When **Vidu** is selected as the Target tool, the Prompt Agent emits a structured 9-block output per shot designed for a real Vidu multi-reference image-to-video production. Every shot card in the Final Package contains:

**1. Character References**
- `needed` — which characters appear in this shot (must match the Character Bible)
- `posePrompt` — body language and stance
- `emotionPrompt` — face / expression
- `consistencyNotes` — how to keep the character on-model relative to the reference sheet (palette, seed, Subject Reference slot)

**2. Place / Environment Reference**
- `imagePrompt` — generates the environment plate
- `consistencyNotes` — how to keep the place identical across shots
- `lightingAndMood` — key-light direction + mood

**3. Props / Objects**
- `objectPrompt` — the featured prop
- `consistencyNotes` — how to keep the prop identical across shots
- `importantDetails` — color, scale, wear pattern, distinguishing marks

**4. Main Image Prompt** — a single complete image-generation prompt for the shot (used to generate the first frame).

**5. Vidu Image-to-Video Prompt** — the prompt you paste into Vidu's video field. Explicitly tells Vidu to keep character, environment, and props consistent with the uploaded references.

**6. Motion Prompt**
- `characterAction` — primary + secondary motion
- `objectMovement` — how the prop moves
- `timing` — beat structure within the shot (setup / action / hold)

**7. Camera Prompt**
- `angle` — wide / OTS / close / etc.
- `movement` — push-in / dolly / hold / etc.
- `framing` — composition + mobile safe-zones

**8. Negative Prompt** — a checklist that explicitly forbids:
- changing character identity
- changing colors / palette
- changing face details
- extra characters
- distorted hands
- flickering
- text artifacts
- random background changes
- style drift
- motion blur on face

**9. Continuity Notes**
- `remainsSame` — exactly what must NOT change vs. the previous shot
- `whatChanges` — what intentionally changes in this shot

The Final Package shows a dedicated **Vidu Prompts** section with one card per shot, each block colored by type (Image / Video / Motion / Camera / Negative / Character / Scene / Refs). Every block has per-field Copy buttons and the whole shot can be copied with **Copy full shot prompt** or downloaded with **Export TXT**.

### Real Vidu multi-reference workflow — how to use this output

For each shot, follow this order:

1. **Generate the first frame.**  Open an image generator. Paste **Main Image Prompt** (block 4). Iterate seeds until the frame matches the storyboard. Save it — this is your shot frame.
2. **Prepare the reference images.**  You'll upload these into Vidu's multi-reference slots:
   - Slot 1: **Character reference sheet** for each character in block 1's `needed` list. Use the SAME character sheet across every shot — never regenerate.
   - Slot 2: **Environment plate** (block 2). Generate once from shot 1's environment prompt, reuse for every following shot.
   - Slot 3: **Prop reference** (block 3) when the prop appears on screen.
   - Slot 4: **Style swatch** (palette + lighting sample).
   - Slot 5+ (shots 2..N): **Last frame of the previous shot** for continuity.
3. **Set up Vidu.**  Choose Image-to-Video with Subject Reference enabled. Upload the references in the order above. Weight character reference highest.
4. **Paste the prompts.**
   - Video prompt field → block 5 (**Vidu Image-to-Video Prompt**)
   - Motion field (if available) → block 6 fields concatenated
   - Camera field (if available) → block 7
   - Negative prompt field → block 8 — paste as a comma-separated line (use the **Copy as line** button)
5. **Lock the seed.**  Same seed across every shot. This is the #1 lever for character identity stability.
6. **Render, then prep the next shot.**  Save the last frame of the rendered video — it becomes a reference image for the next shot's continuity slot.

### Multi-reference consistency — practical rules

- **Identity**: same character sheet image, same seed, every shot. Block 1 `consistencyNotes` is non-negotiable — copy it verbatim into Vidu's prompt if needed.
- **Place**: generate the environment plate once (from shot 1's block 2 prompt), reuse it forever. Block 2's `consistencyNotes` for shots 2..N explicitly tells Vidu not to regenerate the background.
- **Props**: any prop that recurs needs its own reference image in slot 3. Block 3's `importantDetails` lists exactly which attributes to lock.
- **Continuity**: block 9 spells out what must stay the same and what's allowed to change between adjacent shots. When in doubt, lock more, not less.
- **Negative prompt**: copy block 8 as a comma-separated line into Vidu's negative prompt field. These are Vidu's most common failure modes.

### Adding other target tools later

The `TargetTool` union is the single registration point. To add a tool (e.g. `'sora'`):

1. **Extend the union** in `src/types/index.ts`: add `'sora'` to `TargetTool` and a label in `TARGET_TOOL_LABELS`.
2. **Add a branch** in `src/services/productionAiService.ts` `buildPrompts` (alongside the `isVidu` branch). For tools that need a different per-shot structure, add tool-specific optional fields to `PromptShot` (e.g. `soraSpec?: SoraShotBlock`) and populate them.
3. **Render the tool's blocks** in `src/components/OutputPanel.tsx` `PromptView` and in `src/pages/FinalPackage.tsx` `ViduShotCard` (rename / generalize as needed). Both files already pattern-match on which optional fields exist.
4. **Extend the TXT export** in `buildTxtExport > promptsToTxt` to write the new fields.
5. **Update the picker** by adding the tool id to the `TOOLS` array in `NewProduction.tsx`.

The pipeline picks up the new tool automatically — Dashboard badges, project storage, and routing are all driven by the `TargetTool` union.

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
