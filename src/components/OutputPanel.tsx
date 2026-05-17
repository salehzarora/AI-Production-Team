import type { ReactNode } from 'react';
import type {
  AgentId,
  AgentOutput,
  CharacterOutput,
  ConsistencyOutput,
  MarketingOutput,
  PromptOutput,
  SceneOutput,
  ScriptOutput,
  StoryboardOutput,
} from '../types';
import CopyButton from './CopyButton';

interface Props {
  agentId: AgentId;
  output: AgentOutput;
  editable: boolean;
  onEdit?: (next: AgentOutput) => void;
}

function Section({
  title,
  children,
  copyText,
}: {
  title: ReactNode;
  children: ReactNode;
  copyText?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="section-title flex items-center gap-2">{title}</div>
        {copyText !== undefined && <CopyButton text={copyText} variant="soft" />}
      </div>
      <div className="text-sm text-slate-200 leading-relaxed">{children}</div>
    </div>
  );
}

function MultilineTextarea({
  value,
  onChange,
  rows = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="pill-input font-mono text-xs leading-relaxed"
    />
  );
}

export default function OutputPanel({ agentId, output, editable, onEdit }: Props) {
  // Editable mode: show raw JSON for power editing.
  if (editable && onEdit) {
    return (
      <div className="space-y-2">
        <div className="section-title">Raw output (JSON)</div>
        <MultilineTextarea
          rows={16}
          value={JSON.stringify(output, null, 2)}
          onChange={(v) => {
            try {
              const parsed = JSON.parse(v);
              onEdit(parsed);
            } catch {
              // ignore until valid JSON
            }
          }}
        />
        <p className="text-xs text-slate-500">
          Edit and the change saves automatically when JSON is valid.
        </p>
      </div>
    );
  }

  switch (agentId) {
    case 'script':
      return <ScriptView o={output as ScriptOutput} />;
    case 'character':
      return <CharacterView o={output as CharacterOutput} />;
    case 'scene':
      return <SceneView o={output as SceneOutput} />;
    case 'storyboard':
      return <StoryboardView o={output as StoryboardOutput} />;
    case 'prompt':
      return <PromptView o={output as PromptOutput} />;
    case 'consistency':
      return <ConsistencyView o={output as ConsistencyOutput} />;
    case 'marketing':
      return <MarketingView o={output as MarketingOutput} />;
  }
}

// ----- per-agent renderers -----

function ScriptView({ o }: { o: ScriptOutput }) {
  return (
    <div className="space-y-5">
      <Section title="Logline" copyText={o.logline}>
        <p>{o.logline}</p>
      </Section>
      <Section title="Full script" copyText={o.fullScript}>
        <pre className="whitespace-pre-wrap font-mono text-xs bg-bg-panel/60 border border-bg-border rounded-xl p-4 leading-relaxed">
          {o.fullScript}
        </pre>
      </Section>
      <Section title="Scene summary" copyText={o.sceneSummary}>
        <p>{o.sceneSummary}</p>
      </Section>
      <Section
        title="Dialogue"
        copyText={o.dialogue.map((d) => `${d.speaker}: ${d.line}`).join('\n')}
      >
        <ul className="space-y-1.5">
          {o.dialogue.map((d, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-accent-blue font-semibold min-w-[80px]">{d.speaker}</span>
              <span>{d.line}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Timing notes" copyText={o.timingNotes}>
        <p>{o.timingNotes}</p>
      </Section>
    </div>
  );
}

function CharacterView({ o }: { o: CharacterOutput }) {
  return (
    <div className="space-y-4">
      {o.characters.map((c, i) => (
        <div key={i} className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">{c.name}</div>
              <div className="text-xs text-slate-400">{c.personality}</div>
            </div>
            <div className="flex gap-1">
              {c.colors.map((color, j) => (
                <span
                  key={j}
                  className="w-5 h-5 rounded-full border border-bg-border"
                  style={{ background: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <Field label="Visual appearance" value={c.visualAppearance} />
            <Field label="Body shape" value={c.bodyShape} />
            <Field label="Facial features" value={c.facialFeatures} />
            <Field label="Colors" value={c.colors.join(', ')} />
          </div>
          <Section title="Reference prompt" copyText={c.referencePrompt}>
            <code className="block bg-bg-panel/60 border border-bg-border rounded-lg p-3 font-mono text-xs">
              {c.referencePrompt}
            </code>
          </Section>
          <Section title="Negative prompt" copyText={c.negativePrompt}>
            <code className="block bg-bg-panel/60 border border-bg-border rounded-lg p-3 font-mono text-xs">
              {c.negativePrompt}
            </code>
          </Section>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="section-title">{label}</div>
      <div className="text-slate-200 mt-1">{value}</div>
    </div>
  );
}

function SceneView({ o }: { o: SceneOutput }) {
  return (
    <div className="space-y-5">
      <Section title="Locations" copyText={o.locations.join('\n')}>
        <ul className="list-disc pl-5 space-y-1">
          {o.locations.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </Section>
      <Section title="Props" copyText={o.props.join(', ')}>
        <div className="flex flex-wrap gap-2">
          {o.props.map((p, i) => (
            <span key={i} className="badge border-bg-border text-slate-300">
              {p}
            </span>
          ))}
        </div>
      </Section>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Lighting" value={o.lighting} />
        <Field label="Mood" value={o.mood} />
        <Field label="Camera style" value={o.cameraStyle} />
      </div>
      <Section title="Environment prompt" copyText={o.environmentPrompt}>
        <code className="block bg-bg-panel/60 border border-bg-border rounded-lg p-3 font-mono text-xs">
          {o.environmentPrompt}
        </code>
      </Section>
    </div>
  );
}

function StoryboardView({ o }: { o: StoryboardOutput }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-slate-400">
          <tr className="text-left">
            <th className="py-2 pr-3">#</th>
            <th className="py-2 pr-3">Duration</th>
            <th className="py-2 pr-3">Angle</th>
            <th className="py-2 pr-3">Action</th>
            <th className="py-2 pr-3">Emotion</th>
            <th className="py-2 pr-3">Notes</th>
          </tr>
        </thead>
        <tbody className="text-slate-200">
          {o.shots.map((s) => (
            <tr key={s.shotNumber} className="border-t border-bg-border/60">
              <td className="py-2 pr-3 font-semibold text-accent-lime">{s.shotNumber}</td>
              <td className="py-2 pr-3">{s.duration}</td>
              <td className="py-2 pr-3">{s.cameraAngle}</td>
              <td className="py-2 pr-3 max-w-xs">{s.action}</td>
              <td className="py-2 pr-3">{s.characterEmotion}</td>
              <td className="py-2 pr-3 max-w-xs text-slate-400">{s.visualNotes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type BadgeKind = 'Image' | 'Video' | 'Motion' | 'Camera' | 'Negative' | 'Character' | 'Scene' | 'Refs';

const BADGE_STYLES: Record<BadgeKind, string> = {
  Image: 'border-accent-blue/40 text-accent-blue bg-accent-blue/10',
  Video: 'border-accent-violet/40 text-accent-violet bg-accent-violet/10',
  Motion: 'border-accent-cyan/40 text-accent-cyan bg-accent-cyan/10',
  Camera: 'border-accent-lime/40 text-accent-lime bg-accent-lime/10',
  Negative: 'border-accent-pink/40 text-accent-pink bg-accent-pink/10',
  Character: 'border-accent-gold/40 text-accent-gold bg-accent-gold/10',
  Scene: 'border-accent-cyan/40 text-accent-cyan bg-accent-cyan/10',
  Refs: 'border-bg-border text-slate-300 bg-bg-panel/50',
};

function TypeBadge({ kind }: { kind: BadgeKind }) {
  return <span className={`badge ${BADGE_STYLES[kind]}`}>{kind}</span>;
}

function PromptView({ o }: { o: PromptOutput }) {
  return (
    <div className="space-y-4">
      {o.shots.map((s) => {
        const isVidu = !!s.motionPrompt || !!s.negativePrompt || !!s.characterConsistency;
        const fullShotText = buildFullShotText(s);
        return (
          <div key={s.shotNumber} className="card p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-semibold text-white">Shot {s.shotNumber}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge border-bg-border text-slate-400">{s.cameraMovement}</span>
                {isVidu && (
                  <span className="badge border-accent-violet/50 text-accent-violet bg-accent-violet/10">
                    Vidu
                  </span>
                )}
                <CopyButton text={fullShotText} label="Copy full shot" variant="soft" />
              </div>
            </div>

            <Section
              title={<><TypeBadge kind="Image" /> Image prompt</>}
              copyText={s.imagePrompt}
            >
              <code className="block bg-bg-panel/60 border border-bg-border rounded-lg p-3 font-mono text-xs whitespace-pre-wrap">
                {s.imagePrompt}
              </code>
            </Section>

            <Section
              title={<><TypeBadge kind="Video" /> Video prompt</>}
              copyText={s.videoPrompt}
            >
              <code className="block bg-bg-panel/60 border border-bg-border rounded-lg p-3 font-mono text-xs whitespace-pre-wrap">
                {s.videoPrompt}
              </code>
            </Section>

            {s.motionPrompt && (
              <Section
                title={<><TypeBadge kind="Motion" /> Motion prompt</>}
                copyText={s.motionPrompt}
              >
                <code className="block bg-bg-panel/60 border border-bg-border rounded-lg p-3 font-mono text-xs whitespace-pre-wrap">
                  {s.motionPrompt}
                </code>
              </Section>
            )}

            <Section
              title={<><TypeBadge kind="Camera" /> Camera movement</>}
              copyText={s.cameraMovement}
            >
              <p className="text-sm">{s.cameraMovement}</p>
            </Section>

            {s.negativePrompt && (
              <Section
                title={<><TypeBadge kind="Negative" /> Negative prompt</>}
                copyText={s.negativePrompt}
              >
                <code className="block bg-bg-panel/60 border border-bg-border rounded-lg p-3 font-mono text-xs whitespace-pre-wrap">
                  {s.negativePrompt}
                </code>
              </Section>
            )}

            {s.characterConsistency && (
              <Section
                title={<><TypeBadge kind="Character" /> Character consistency</>}
                copyText={s.characterConsistency}
              >
                <p className="text-sm text-slate-200">{s.characterConsistency}</p>
              </Section>
            )}

            {s.sceneContinuity && (
              <Section
                title={<><TypeBadge kind="Scene" /> Scene continuity</>}
                copyText={s.sceneContinuity}
              >
                <p className="text-sm text-slate-200">{s.sceneContinuity}</p>
              </Section>
            )}

            {s.multiReferenceInstructions && (
              <Section
                title="Multi-reference instructions"
                copyText={s.multiReferenceInstructions}
              >
                <p className="text-sm text-slate-200">{s.multiReferenceInstructions}</p>
              </Section>
            )}

            {s.suggestedReferenceImages && s.suggestedReferenceImages.length > 0 && (
              <Section
                title={<><TypeBadge kind="Refs" /> Suggested reference images</>}
                copyText={s.suggestedReferenceImages.join('\n')}
              >
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-200">
                  {s.suggestedReferenceImages.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </Section>
            )}

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <Field label="Motion description" value={s.motionDescription} />
              <Field label="Consistency refs" value={s.consistencyReferences.join(' · ')} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildFullShotText(s: PromptOutput['shots'][number]): string {
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

function ConsistencyView({ o }: { o: ConsistencyOutput }) {
  const sections: { title: string; items: string[] }[] = [
    { title: 'Character notes', items: o.characterNotes },
    { title: 'Scene notes', items: o.sceneNotes },
    { title: 'Style notes', items: o.styleNotes },
    { title: 'Missing details', items: o.missingDetails },
    { title: 'Fixes', items: o.fixes },
  ];
  return (
    <div className="space-y-5">
      {sections.map((s) => (
        <Section key={s.title} title={s.title} copyText={s.items.join('\n')}>
          <ul className="list-disc pl-5 space-y-1">
            {s.items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        </Section>
      ))}
    </div>
  );
}

function MarketingView({ o }: { o: MarketingOutput }) {
  return (
    <div className="space-y-5">
      <Section title="Title" copyText={o.title}>
        <p className="font-semibold text-white">{o.title}</p>
      </Section>
      <Section title="Description" copyText={o.description}>
        <pre className="whitespace-pre-wrap font-mono text-xs bg-bg-panel/60 border border-bg-border rounded-xl p-4 leading-relaxed">
          {o.description}
        </pre>
      </Section>
      <Section title="Hashtags" copyText={o.hashtags.join(' ')}>
        <div className="flex flex-wrap gap-2">
          {o.hashtags.map((h, i) => (
            <span key={i} className="badge border-accent-pink/40 text-accent-pink bg-accent-pink/10">
              {h}
            </span>
          ))}
        </div>
      </Section>
      <Section title="Thumbnail prompt" copyText={o.thumbnailPrompt}>
        <code className="block bg-bg-panel/60 border border-bg-border rounded-lg p-3 font-mono text-xs">
          {o.thumbnailPrompt}
        </code>
      </Section>
      <Section title="Hook text" copyText={o.hookText}>
        <p>{o.hookText}</p>
      </Section>
      <Section title="Pinned comment" copyText={o.pinnedComment}>
        <p>{o.pinnedComment}</p>
      </Section>
    </div>
  );
}
