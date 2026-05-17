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
