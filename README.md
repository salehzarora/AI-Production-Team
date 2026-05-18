# AI Production Team

Turn one video idea into a complete animation production package — script, characters, **visual assets**, storyboard, **shot images**, Vidu prompts, consistency notes, marketing. The app manages the full asset creation workflow: every reference image you need is auto-prompted, and you can generate or upload images directly from the Assets Studio.

**Architecture**: React + Vite frontend + Node.js / Express backend. The backend holds all API keys; the frontend never touches provider credentials directly.

---

## What it does

1. You write a video idea, pick a platform (YouTube Shorts / TikTok / Reels), a style, a length (15 / 30 / 60s), and a target tool (Vidu by default).
2. The pipeline runs nine specialist agents in order, passing the previous outputs forward:
   - **Script Agent** — logline, full script, dialogue, timing notes.
   - **Character Agent** — character bible (appearance, palette, reference + negative prompts). Auto-seeds character asset prompts.
   - **Asset Agent** — production plan + step-by-step workflow for generating reference images.
   - **Scene Agent** — locations, props, lighting, mood, camera style, environment prompt. Auto-seeds environment + prop asset prompts.
   - **Storyboard Agent** — shot-by-shot table (angle, duration, action, emotion, notes).
   - **Shot Image Agent** — per-shot image prompt that combines character + environment + prop references. Auto-seeds shot image assets.
   - **Vidu Prompt Agent** — structured Vidu image-to-video prompts (9 blocks per shot when Vidu Mode is on).
   - **Consistency Agent** — character / scene / style notes, missing details, fixes.
   - **Marketing Agent** — title, description, hashtags, thumbnail prompt, hook, pinned comment.
3. The **Assets Studio** is where you manage the visual assets. Four tabs (Characters / Environments / Props / Shot Images). Each card has the prompt (copyable), an upload button, an image preview, a status badge, and a notes field.
4. The **Final Package** page shows everything organized — Asset Library, Vidu Prompts, all sections — with Copy + Export JSON + Export TXT.

Projects are saved to `localStorage` so you can close the tab and continue later.

---

## Running the app

### Frontend

```bash
npm install
npm run dev
```

Opens at http://localhost:5173. The app works standalone — all agent outputs are mocked, and you can upload images manually without the backend running.

To build:

```bash
npm run build
npm run preview
```

### Backend (image generation)

```bash
cd server
npm install
npm run dev       # starts with tsx watch on port 3001
```

The backend starts at http://localhost:3001.

**Without a provider configured** the backend runs in *placeholder mode*: the Generate Image button works end-to-end but returns a dark SVG placeholder instead of a real image. This lets you test the full UI flow immediately.

#### Required environment variables

Copy `server/.env.example` → `server/.env` and fill in your values:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port the server listens on |
| `APP_ACCESS_KEY` | _(off)_ | Optional shared secret — see [Access protection](#access-protection) below |
| `IMAGE_RATE_LIMIT_WINDOW_MINUTES` | `60` | Rate limit window in minutes |
| `IMAGE_RATE_LIMIT_MAX` | `5` | Max image generations per IP per window |
| `IMAGE_API_KEY` | _(off)_ | API key for your image generation provider |
| `IMAGE_API_URL` | _(off)_ | Endpoint URL for your provider |

Provider credentials are **server-side only** — they are never sent to the browser.

#### Optional frontend env

Copy `.env.example` → `.env` in the project root if your backend runs on a different port or host:

```
VITE_BACKEND_URL=http://localhost:3001
```

### How image generation works

1. User clicks **Generate Image** on any asset card in Assets Studio.
2. The frontend calls `POST /api/images/generate` on the backend (never the provider directly).
3. The backend validates the access key (if set) and enforces the rate limit.
4. The backend reads `IMAGE_API_KEY` / `IMAGE_API_URL` from `server/.env` and calls your image provider.
5. The provider returns an image URL (or binary, which the server base64-encodes into a data URL).
6. The backend forwards `{ success, imageUrl, provider, promptUsed }` to the frontend.
7. The asset's image preview updates immediately and its status changes to `generated`.

#### Adding a real provider

Open [server/services/imageGenerationService.ts](server/services/imageGenerationService.ts) and replace the `TODO` block with your provider's `fetch` call. The file contains commented-out examples for **Replicate**, **Stability AI**, and **fal.ai**.

### Access protection

#### Why API keys must stay in the backend

Browsers have no secure secret storage. Anything in frontend code is visible to anyone who opens DevTools — including API keys. Every call to a paid image provider costs real money. If your key is in the browser, anyone can extract it and run up charges on your account.

The backend is a secure proxy: the browser only ever talks to `localhost:3001` (or your hosted URL), and the actual provider credentials never leave the server process.

#### Why public exposure costs money

If you expose the backend URL publicly without any protection, anyone who discovers it can call `POST /api/images/generate` and consume your image generation quota. Each call to a real provider costs $0.01–$0.10 per image.

Two layers of protection are built in:

**1. Rate limiting** — limits how many images can be generated per IP per hour.

Set in `server/.env`:
```
IMAGE_RATE_LIMIT_WINDOW_MINUTES=60
IMAGE_RATE_LIMIT_MAX=5
```

Response when exceeded (HTTP 429):
```json
{ "success": false, "error": "Rate limit exceeded — max 5 images per 60 min per IP. Try again later." }
```

**2. Access key** — a shared secret your frontend must present with every request.

Set in `server/.env`:
```
APP_ACCESS_KEY=some-long-random-string
```

When set, `POST /api/images/generate` requires the header `x-app-access-key: <key>`.

The frontend detects this automatically via the health endpoint and shows a password input in the Assets Studio header. You enter the key once — it's saved in localStorage and sent with every generation request. Responses when missing or wrong:

```json
{ "success": false, "error": "Access key required. Set the x-app-access-key header." }  // 401
{ "success": false, "error": "Invalid access key." }                                     // 403
```

Leave `APP_ACCESS_KEY` empty to disable access key protection (fine for local-only use).

#### Error messages reference

| Situation | HTTP | `error` field |
|---|---|---|
| Missing `prompt` | 400 | `` `prompt` is required and must be a non-empty string. `` |
| No access key sent | 401 | `Access key required. Set the x-app-access-key header.` |
| Wrong access key | 403 | `Invalid access key.` |
| Rate limit hit | 429 | `Rate limit exceeded — max N images per M min per IP. Try again later.` |
| Provider error | 500 | Provider-specific message |

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

## Assets Studio

After the Character Agent runs, character asset prompts appear in the Studio automatically. After the Scene Agent runs, environment + prop prompts are seeded. After the Shot Image Agent runs, per-shot image prompts are seeded.

For each asset card you can:
- **Generate Image** — calls the backend which calls your image provider. Status changes to `generated` and the preview appears immediately. Button is greyed out if the backend is offline.
- **Copy prompt** — paste into your image generator (Midjourney, Vidu, etc.) instead.
- **Upload image** — pick a local PNG/JPG if you generated elsewhere. Stored inline (data URL) in localStorage.
- **Notes** — record seed, generator, palette decisions, anything you want to remember.
- **Status badge**: `missing` → `prompt-ready` → `uploaded` / `generated`

The header shows a live **backend connection status** chip. If the backend is offline the Generate button is disabled but everything else still works.

> **localStorage note**: images are stored as data URLs. Browsers cap that at ~5 MB per origin. Large projects with many uploads will hit the limit. Backend storage / IndexedDB is the future fix.

### The full production workflow

```
1. Generate character prompts  →  copy them or upload generated images
2. Generate environment prompts →  copy them or upload generated images
3. Generate prop prompts        →  copy them or upload generated images
4. Generate shot image prompts  →  copy them or upload generated images
5. Use the shot image + character + env + prop refs in Vidu image-to-video
```

The Asset Agent's output is a checklist of these exact steps tailored to your project's character count, style, and duration.

---

## Workflow

```
Idea → Script → Characters → Assets → Scenes → Storyboard → Shot Images → Vidu Prompts → Consistency → Marketing → Final Package
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
server/                         # Express backend (Node.js + TypeScript)
  index.ts                      # Server entry — CORS, JSON, routes
  routes/images.ts              # POST /api/images/generate
  controllers/imageController.ts
  services/imageGenerationService.ts  # Provider-agnostic image generation (add your provider here)
  .env.example                  # Required env vars template
  package.json

src/                            # React + Vite frontend
  components/        # AgentCard, AssetCard, WorkflowPipeline, StatusBadge, OutputPanel, CopyButton, Layout
  data/              # agents.ts — agent catalog + pipeline order
  hooks/             # useProjects, useProject (localStorage-backed)
  pages/             # Dashboard, NewProduction, Workflow, AssetsStudio, FinalPackage
  services/          # productionAiService.ts (mock agents), imageApi.ts (backend client)
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
- No database (localStorage only).
- No API keys in the client — backend proxy only.
- No video generation yet (image generation first).
- Agent outputs are still mocked; real LLM integration is the next phase.
