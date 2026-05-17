import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Sparkles, Wand2 } from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { AGENTS } from '../data/agents';
import OutputPanel from '../components/OutputPanel';
import CopyButton from '../components/CopyButton';
import type {
  AgentId,
  CharacterOutput,
  ConsistencyOutput,
  MarketingOutput,
  ProductionProject,
  PromptOutput,
  PromptShot,
  SceneOutput,
  ScriptOutput,
  StoryboardOutput,
} from '../types';
import { TARGET_TOOL_LABELS } from '../types';

export default function FinalPackage() {
  const { id } = useParams();
  const { project, loading } = useProject(id);

  if (loading) return <div className="text-slate-400">Loading...</div>;
  if (!project) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-300">Project not found.</p>
        <Link to="/" className="btn-ghost mt-4 inline-flex">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const targetTool = project.targetTool ?? 'general';
  const isVidu = targetTool === 'vidu';
  const promptOutput = project.finalPackage.prompts;
  const fileBase = project.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'production';

  function downloadBlob(content: string, mime: string, ext: string) {
    if (!project) return;
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileBase}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportJson() {
    if (!project) return;
    downloadBlob(JSON.stringify(project, null, 2), 'application/json', 'json');
  }

  function exportTxt() {
    if (!project) return;
    downloadBlob(buildTxtExport(project), 'text/plain;charset=utf-8', 'txt');
  }

  const sections: { agentId: AgentId; title: string }[] = [
    { agentId: 'script', title: 'Script' },
    { agentId: 'character', title: 'Character Bible' },
    { agentId: 'scene', title: 'Scene Bible' },
    { agentId: 'storyboard', title: 'Storyboard' },
    { agentId: 'prompt', title: 'Prompts by Shot' },
    { agentId: 'consistency', title: 'Consistency Checklist' },
    { agentId: 'marketing', title: 'Marketing Package' },
  ];

  const allVideoPrompts = (promptOutput?.shots ?? [])
    .map((s) => `Shot ${s.shotNumber}:\n${s.videoPrompt}`)
    .join('\n\n');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            to={`/project/${project.id}`}
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> Back to workflow
          </Link>
          <h1 className="text-3xl font-bold mt-1">Final Package</h1>
          <div className="text-sm text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
            <span>
              {project.platform} · {project.style} · {project.duration}s
            </span>
            <span
              className={`badge ${
                isVidu
                  ? 'border-accent-violet/50 text-accent-violet bg-accent-violet/10'
                  : 'border-bg-border text-slate-400 bg-bg-panel/50'
              }`}
            >
              {isVidu && <Sparkles className="w-3 h-3" />}
              {TARGET_TOOL_LABELS[targetTool]}
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {promptOutput && promptOutput.shots.length > 0 && (
            <CopyButton
              text={allVideoPrompts}
              label="Copy all video prompts"
              variant="ghost"
            />
          )}
          <button onClick={exportTxt} className="btn-ghost">
            <FileText className="w-4 h-4" />
            Export TXT
          </button>
          <button onClick={exportJson} className="btn-primary">
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      <div className="card p-5 bg-bg-panel/40 flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="section-title mb-1.5">Original idea</div>
          <p className="text-slate-200 leading-relaxed">{project.idea}</p>
        </div>
        <CopyButton text={project.idea} variant="soft" />
      </div>

      {/* Vidu Prompts dedicated section — clean shot cards */}
      {isVidu && promptOutput && promptOutput.shots.length > 0 && (
        <section className="card p-5 space-y-4 border-accent-violet/30 bg-gradient-to-br from-accent-violet/5 to-transparent">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-accent-violet" />
                Vidu Prompts
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-reference image-to-video prompts, one card per shot. Copy individual fields
                or the full shot.
              </p>
            </div>
            <CopyButton
              text={allVideoPrompts}
              label="Copy all video prompts"
              variant="soft"
            />
          </div>
          <div className="grid gap-3">
            {promptOutput.shots.map((s) => (
              <ViduShotCard key={s.shotNumber} shot={s} />
            ))}
          </div>
        </section>
      )}

      {sections.map((s) => {
        const step = project.steps.find((st) => st.agentId === s.agentId);
        if (!step?.output) {
          return (
            <section key={s.agentId} className="card p-5">
              <h2 className="text-lg font-semibold mb-1">{s.title}</h2>
              <p className="text-sm text-slate-400">
                Not yet generated. Run the {AGENTS[s.agentId].name} in the workflow.
              </p>
            </section>
          );
        }
        return (
          <section key={s.agentId} className="card p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <CopyButton
                text={JSON.stringify(step.output, null, 2)}
                label="Copy JSON"
                variant="soft"
              />
            </div>
            <OutputPanel agentId={s.agentId} output={step.output} editable={false} />
          </section>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Vidu shot card — focused, scannable, copyable.
// ----------------------------------------------------------------------------

function ViduShotCard({ shot }: { shot: PromptShot }) {
  const fullText = buildFullShotText(shot);
  return (
    <div className="card p-4 space-y-3 bg-bg-panel/40">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Shot {shot.shotNumber}</span>
          <span className="badge border-bg-border text-slate-400">{shot.cameraMovement}</span>
        </div>
        <CopyButton text={fullText} label="Copy full shot prompt" variant="soft" />
      </div>

      <FieldBlock badge="Image" text={shot.imagePrompt} />
      <FieldBlock badge="Video" text={shot.videoPrompt} />
      {shot.motionPrompt && <FieldBlock badge="Motion" text={shot.motionPrompt} />}
      <FieldBlock badge="Camera" text={shot.cameraMovement} mono={false} />
      {shot.negativePrompt && <FieldBlock badge="Negative" text={shot.negativePrompt} />}
    </div>
  );
}

const BADGE_STYLES: Record<string, string> = {
  Image: 'border-accent-blue/40 text-accent-blue bg-accent-blue/10',
  Video: 'border-accent-violet/40 text-accent-violet bg-accent-violet/10',
  Motion: 'border-accent-cyan/40 text-accent-cyan bg-accent-cyan/10',
  Camera: 'border-accent-lime/40 text-accent-lime bg-accent-lime/10',
  Negative: 'border-accent-pink/40 text-accent-pink bg-accent-pink/10',
};

function FieldBlock({
  badge,
  text,
  mono = true,
}: {
  badge: string;
  text: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className={`badge ${BADGE_STYLES[badge] ?? 'border-bg-border text-slate-300'}`}>
          {badge}
        </span>
        <CopyButton text={text} variant="soft" />
      </div>
      {mono ? (
        <code className="block bg-bg-panel/70 border border-bg-border rounded-lg p-3 font-mono text-xs whitespace-pre-wrap leading-relaxed">
          {text}
        </code>
      ) : (
        <p className="text-sm text-slate-200 pl-1">{text}</p>
      )}
    </div>
  );
}

function buildFullShotText(s: PromptShot): string {
  const lines: string[] = [
    `=== Shot ${s.shotNumber} ===`,
    `[Camera] ${s.cameraMovement}`,
    `[Image] ${s.imagePrompt}`,
    `[Video] ${s.videoPrompt}`,
  ];
  if (s.motionPrompt) lines.push(`[Motion] ${s.motionPrompt}`);
  if (s.negativePrompt) lines.push(`[Negative] ${s.negativePrompt}`);
  if (s.characterConsistency) lines.push(`[Character] ${s.characterConsistency}`);
  if (s.sceneContinuity) lines.push(`[Scene] ${s.sceneContinuity}`);
  if (s.multiReferenceInstructions) lines.push(`[Multi-ref] ${s.multiReferenceInstructions}`);
  if (s.suggestedReferenceImages?.length) {
    lines.push(`[Reference images]\n - ${s.suggestedReferenceImages.join('\n - ')}`);
  }
  return lines.join('\n');
}

// ----------------------------------------------------------------------------
// TXT export — single file containing everything the user needs to upload.
// ----------------------------------------------------------------------------

function buildTxtExport(project: ProductionProject): string {
  const fp = project.finalPackage;
  const lines: string[] = [];
  const hr = '═'.repeat(60);
  const sub = '─'.repeat(60);

  lines.push(hr);
  lines.push(`  AI PRODUCTION PACKAGE — ${project.title.toUpperCase()}`);
  lines.push(hr);
  lines.push(
    `  Platform : ${project.platform}`,
    `  Style    : ${project.style}`,
    `  Duration : ${project.duration}s`,
    `  Tool     : ${TARGET_TOOL_LABELS[project.targetTool ?? 'general']}`,
    `  Created  : ${new Date(project.createdAt).toLocaleString()}`,
    ''
  );

  lines.push(hr, '  ORIGINAL IDEA', hr);
  lines.push(project.idea, '');

  if (fp.script) lines.push(...scriptToTxt(fp.script));
  if (fp.characters) lines.push(...charactersToTxt(fp.characters));
  if (fp.scenes) lines.push(...scenesToTxt(fp.scenes));
  if (fp.storyboard) lines.push(...storyboardToTxt(fp.storyboard));
  if (fp.prompts) lines.push(...promptsToTxt(fp.prompts));
  if (fp.consistency) lines.push(...consistencyToTxt(fp.consistency));
  if (fp.marketing) lines.push(...marketingToTxt(fp.marketing));

  lines.push(hr, '  END OF PACKAGE', hr);
  return lines.join('\n');

  function scriptToTxt(s: ScriptOutput): string[] {
    return [
      hr, '  SCRIPT', hr,
      `Logline: ${s.logline}`,
      '',
      'Full script:',
      s.fullScript,
      '',
      `Scene summary: ${s.sceneSummary}`,
      '',
      'Dialogue:',
      ...s.dialogue.map((d) => `  ${d.speaker}: ${d.line}`),
      '',
      `Timing notes: ${s.timingNotes}`,
      '',
    ];
  }

  function charactersToTxt(c: CharacterOutput): string[] {
    const out = [hr, '  CHARACTER BIBLE', hr];
    c.characters.forEach((ch) => {
      out.push(
        sub,
        `Name: ${ch.name}`,
        `Personality: ${ch.personality}`,
        `Visual: ${ch.visualAppearance}`,
        `Colors: ${ch.colors.join(', ')}`,
        `Face: ${ch.facialFeatures}`,
        `Body: ${ch.bodyShape}`,
        `Reference prompt: ${ch.referencePrompt}`,
        `Negative prompt: ${ch.negativePrompt}`,
        ''
      );
    });
    return out;
  }

  function scenesToTxt(s: SceneOutput): string[] {
    return [
      hr, '  SCENE BIBLE', hr,
      'Locations:',
      ...s.locations.map((l) => `  - ${l}`),
      'Props:',
      ...s.props.map((p) => `  - ${p}`),
      `Lighting: ${s.lighting}`,
      `Mood: ${s.mood}`,
      `Camera style: ${s.cameraStyle}`,
      `Environment prompt: ${s.environmentPrompt}`,
      '',
    ];
  }

  function storyboardToTxt(s: StoryboardOutput): string[] {
    const out = [hr, '  STORYBOARD', hr];
    s.shots.forEach((sh) => {
      out.push(
        `Shot ${sh.shotNumber}  (${sh.duration})  ${sh.cameraAngle}`,
        `  Action  : ${sh.action}`,
        `  Emotion : ${sh.characterEmotion}`,
        `  Notes   : ${sh.visualNotes}`,
        ''
      );
    });
    return out;
  }

  function promptsToTxt(p: PromptOutput): string[] {
    const out = [hr, '  PROMPTS BY SHOT', hr];
    p.shots.forEach((s) => {
      out.push(
        sub,
        `SHOT ${s.shotNumber}`,
        `Camera: ${s.cameraMovement}`,
        '',
        `[IMAGE PROMPT]`,
        s.imagePrompt,
        '',
        `[VIDEO PROMPT]`,
        s.videoPrompt,
        ''
      );
      if (s.motionPrompt) out.push(`[MOTION PROMPT]`, s.motionPrompt, '');
      if (s.negativePrompt) out.push(`[NEGATIVE PROMPT]`, s.negativePrompt, '');
      if (s.characterConsistency) out.push(`[CHARACTER CONSISTENCY]`, s.characterConsistency, '');
      if (s.sceneContinuity) out.push(`[SCENE CONTINUITY]`, s.sceneContinuity, '');
      if (s.multiReferenceInstructions)
        out.push(`[MULTI-REFERENCE INSTRUCTIONS]`, s.multiReferenceInstructions, '');
      if (s.suggestedReferenceImages?.length) {
        out.push('[SUGGESTED REFERENCE IMAGES]', ...s.suggestedReferenceImages.map((r) => `  - ${r}`), '');
      }
    });
    return out;
  }

  function consistencyToTxt(c: ConsistencyOutput): string[] {
    return [
      hr, '  CONSISTENCY CHECKLIST', hr,
      'Character notes:',
      ...c.characterNotes.map((n) => `  - ${n}`),
      'Scene notes:',
      ...c.sceneNotes.map((n) => `  - ${n}`),
      'Style notes:',
      ...c.styleNotes.map((n) => `  - ${n}`),
      'Missing details:',
      ...c.missingDetails.map((n) => `  - ${n}`),
      'Fixes:',
      ...c.fixes.map((n) => `  - ${n}`),
      '',
    ];
  }

  function marketingToTxt(m: MarketingOutput): string[] {
    return [
      hr, '  MARKETING PACKAGE', hr,
      `Title: ${m.title}`,
      '',
      'Description:',
      m.description,
      '',
      `Hashtags: ${m.hashtags.join(' ')}`,
      '',
      `Hook: ${m.hookText}`,
      `Pinned comment: ${m.pinnedComment}`,
      '',
      `Thumbnail prompt: ${m.thumbnailPrompt}`,
      '',
    ];
  }
}
