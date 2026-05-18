import type { ReactNode } from 'react';
import type {
  AgentId,
  AgentOutput,
  AssetOutput,
  CharacterOutput,
  ConsistencyOutput,
  MarketingOutput,
  PromptOutput,
  SceneOutput,
  ScriptOutput,
  ShotImageOutput,
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
    case 'asset':
      return <AssetPlanView o={output as AssetOutput} />;
    case 'scene':
      return <SceneView o={output as SceneOutput} />;
    case 'storyboard':
      return <StoryboardView o={output as StoryboardOutput} />;
    case 'shotImage':
      return <ShotImageView o={output as ShotImageOutput} />;
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

function AssetPlanView({ o }: { o: AssetOutput }) {
  return (
    <div className="space-y-5">
      <Section title="Production plan" copyText={o.productionPlan}>
        <p>{o.productionPlan}</p>
      </Section>
      <Section title="Workflow" copyText={o.workflow.join('\n')}>
        <ol className="list-decimal pl-5 space-y-1">
          {o.workflow.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ol>
      </Section>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Characters" value={o.characterAssetsNote} />
        <Field label="Environments" value={o.environmentAssetsNote} />
        <Field label="Props" value={o.propAssetsNote} />
      </div>
      <div className="text-xs text-slate-400">
        Planned total: <span className="text-white font-medium">{o.totalAssets}</span> asset prompts.
        Manage them in the <span className="text-accent-blue">Assets Studio</span>.
      </div>
    </div>
  );
}

function ShotImageView({ o }: { o: ShotImageOutput }) {
  return (
    <div className="space-y-3">
      {o.shots.map((s) => (
        <div key={s.shotNumber} className="card p-4 space-y-2 bg-bg-panel/40">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-white">Shot {s.shotNumber}</div>
            <CopyButton text={s.imagePrompt} variant="soft" />
          </div>
          <code className="block bg-bg-panel/70 border border-bg-border rounded-lg p-3 font-mono text-xs whitespace-pre-wrap leading-relaxed">
            {s.imagePrompt}
          </code>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <Field
              label="Reference assets"
              value={s.referenceAssets.length ? s.referenceAssets.join(' · ') : '—'}
            />
            <Field label="Notes" value={s.notes} />
          </div>
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
        const isViduV2 = !!s.characterReference || !!s.environmentReference || !!s.mainImagePrompt;
        const isViduV1 = !isViduV2 && (!!s.motionPrompt || !!s.negativePrompt || !!s.characterConsistency);
        const fullShotText = buildFullShotText(s);
        return (
          <div key={s.shotNumber} className="card p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-semibold text-white">Shot {s.shotNumber}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge border-bg-border text-slate-400">{s.cameraMovement}</span>
                {(isViduV1 || isViduV2) && (
                  <span className="badge border-accent-violet/50 text-accent-violet bg-accent-violet/10">
                    Vidu
                  </span>
                )}
                <CopyButton text={fullShotText} label="Copy full shot" variant="soft" />
              </div>
            </div>

            {isViduV2 ? (
              <ViduDetailedBlocks s={s} />
            ) : (
              <LegacyPromptBlocks s={s} />
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

// ---------- Vidu v2 structured blocks ----------

function ViduDetailedBlocks({ s }: { s: PromptOutput['shots'][number] }) {
  return (
    <div className="space-y-4">
      {/* 1. Character References */}
      {s.characterReference && (
        <BlockCard kind="Character" title="1. Character References">
          {s.characterReference.needed.length > 0 && (
            <SubField
              label="Needed for this shot"
              value={s.characterReference.needed.join(' · ')}
              copyText={s.characterReference.needed.join('\n')}
            />
          )}
          <SubField
            label="Pose prompt"
            value={s.characterReference.posePrompt}
            mono
            copyText={s.characterReference.posePrompt}
          />
          <SubField
            label="Emotion prompt"
            value={s.characterReference.emotionPrompt}
            mono
            copyText={s.characterReference.emotionPrompt}
          />
          <SubField
            label="Consistency notes"
            value={s.characterReference.consistencyNotes}
            copyText={s.characterReference.consistencyNotes}
          />
        </BlockCard>
      )}

      {/* 2. Place / Environment Reference */}
      {s.environmentReference && (
        <BlockCard kind="Scene" title="2. Place / Environment Reference">
          <SubField
            label="Environment image prompt"
            value={s.environmentReference.imagePrompt}
            mono
            copyText={s.environmentReference.imagePrompt}
          />
          <SubField
            label="Place consistency notes"
            value={s.environmentReference.consistencyNotes}
            copyText={s.environmentReference.consistencyNotes}
          />
          <SubField
            label="Lighting and mood"
            value={s.environmentReference.lightingAndMood}
            copyText={s.environmentReference.lightingAndMood}
          />
        </BlockCard>
      )}

      {/* 3. Props / Objects */}
      {s.propsRef && (
        <BlockCard kind="Refs" title="3. Props / Objects">
          <SubField
            label="Object prompt"
            value={s.propsRef.objectPrompt}
            mono
            copyText={s.propsRef.objectPrompt}
          />
          <SubField
            label="Object consistency notes"
            value={s.propsRef.consistencyNotes}
            copyText={s.propsRef.consistencyNotes}
          />
          <SubField
            label="Important details to keep the same"
            value={s.propsRef.importantDetails}
            copyText={s.propsRef.importantDetails}
          />
        </BlockCard>
      )}

      {/* 4. Main Image Prompt */}
      {s.mainImagePrompt && (
        <BlockCard kind="Image" title="4. Main Image Prompt">
          <SubField label="Image generation prompt" value={s.mainImagePrompt} mono copyText={s.mainImagePrompt} />
        </BlockCard>
      )}

      {/* 5. Vidu Image-to-Video Prompt */}
      {s.viduVideoPrompt && (
        <BlockCard kind="Video" title="5. Vidu Image-to-Video Prompt">
          <SubField label="Video prompt" value={s.viduVideoPrompt} mono copyText={s.viduVideoPrompt} />
        </BlockCard>
      )}

      {/* 6. Motion Prompt */}
      {s.motion && (
        <BlockCard kind="Motion" title="6. Motion Prompt">
          <SubField label="Character action" value={s.motion.characterAction} copyText={s.motion.characterAction} />
          <SubField label="Object movement" value={s.motion.objectMovement} copyText={s.motion.objectMovement} />
          <SubField label="Timing" value={s.motion.timing} copyText={s.motion.timing} />
        </BlockCard>
      )}

      {/* 7. Camera Prompt */}
      {s.camera && (
        <BlockCard kind="Camera" title="7. Camera Prompt">
          <SubField label="Camera angle" value={s.camera.angle} copyText={s.camera.angle} />
          <SubField label="Camera movement" value={s.camera.movement} copyText={s.camera.movement} />
          <SubField label="Framing" value={s.camera.framing} copyText={s.camera.framing} />
        </BlockCard>
      )}

      {/* 8. Negative Prompt (checklist) */}
      {s.negativeChecklist && s.negativeChecklist.length > 0 && (
        <BlockCard kind="Negative" title="8. Negative Prompt">
          <div className="flex items-center justify-end -mt-1 mb-1">
            <CopyButton text={s.negativeChecklist.join(', ')} label="Copy as line" variant="soft" />
          </div>
          <ul className="space-y-1 text-sm text-slate-200">
            {s.negativeChecklist.map((n, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent-pink">✕</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </BlockCard>
      )}

      {/* 9. Continuity Notes */}
      {s.continuity && (
        <BlockCard kind="Character" title="9. Continuity Notes">
          <SubField
            label="What must remain the same"
            value={s.continuity.remainsSame}
            copyText={s.continuity.remainsSame}
          />
          <SubField
            label="What changes in this shot"
            value={s.continuity.whatChanges}
            copyText={s.continuity.whatChanges}
          />
        </BlockCard>
      )}
    </div>
  );
}

function BlockCard({
  kind,
  title,
  children,
}: {
  kind: BadgeKind;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="card p-4 bg-bg-panel/40 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <TypeBadge kind={kind} />
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SubField({
  label,
  value,
  copyText,
  mono = false,
}: {
  label: string;
  value: string;
  copyText?: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="section-title">{label}</span>
        {copyText !== undefined && <CopyButton text={copyText} variant="soft" />}
      </div>
      {mono ? (
        <code className="block bg-bg-panel/70 border border-bg-border rounded-lg p-3 font-mono text-xs whitespace-pre-wrap leading-relaxed">
          {value}
        </code>
      ) : (
        <p className="text-sm text-slate-200 leading-relaxed">{value}</p>
      )}
    </div>
  );
}

// ---------- Legacy Vidu v1 / general prompts ----------

function LegacyPromptBlocks({ s }: { s: PromptOutput['shots'][number] }) {
  return (
    <div className="space-y-4">
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
        <Section title="Multi-reference instructions" copyText={s.multiReferenceInstructions}>
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
    </div>
  );
}

function buildFullShotText(s: PromptOutput['shots'][number]): string {
  const lines: string[] = [`=== Shot ${s.shotNumber} ===`];

  // Prefer v2 structured fields when present.
  if (s.characterReference) {
    lines.push(
      '',
      '[1. CHARACTER REFERENCES]',
      `Needed: ${s.characterReference.needed.join(' · ')}`,
      `Pose: ${s.characterReference.posePrompt}`,
      `Emotion: ${s.characterReference.emotionPrompt}`,
      `Consistency: ${s.characterReference.consistencyNotes}`
    );
  }
  if (s.environmentReference) {
    lines.push(
      '',
      '[2. ENVIRONMENT REFERENCE]',
      `Image prompt: ${s.environmentReference.imagePrompt}`,
      `Consistency: ${s.environmentReference.consistencyNotes}`,
      `Lighting & mood: ${s.environmentReference.lightingAndMood}`
    );
  }
  if (s.propsRef) {
    lines.push(
      '',
      '[3. PROPS / OBJECTS]',
      `Object prompt: ${s.propsRef.objectPrompt}`,
      `Consistency: ${s.propsRef.consistencyNotes}`,
      `Important details: ${s.propsRef.importantDetails}`
    );
  }
  if (s.mainImagePrompt) {
    lines.push('', '[4. MAIN IMAGE PROMPT]', s.mainImagePrompt);
  }
  if (s.viduVideoPrompt) {
    lines.push('', '[5. VIDU IMAGE-TO-VIDEO PROMPT]', s.viduVideoPrompt);
  }
  if (s.motion) {
    lines.push(
      '',
      '[6. MOTION PROMPT]',
      `Character action: ${s.motion.characterAction}`,
      `Object movement: ${s.motion.objectMovement}`,
      `Timing: ${s.motion.timing}`
    );
  }
  if (s.camera) {
    lines.push(
      '',
      '[7. CAMERA PROMPT]',
      `Angle: ${s.camera.angle}`,
      `Movement: ${s.camera.movement}`,
      `Framing: ${s.camera.framing}`
    );
  }
  if (s.negativeChecklist && s.negativeChecklist.length > 0) {
    lines.push('', '[8. NEGATIVE PROMPT]', ...s.negativeChecklist.map((n) => `  - ${n}`));
  }
  if (s.continuity) {
    lines.push(
      '',
      '[9. CONTINUITY NOTES]',
      `Remains same: ${s.continuity.remainsSame}`,
      `What changes: ${s.continuity.whatChanges}`
    );
  }

  // If nothing structured was present, fall back to legacy fields.
  if (
    !s.characterReference &&
    !s.environmentReference &&
    !s.propsRef &&
    !s.mainImagePrompt &&
    !s.viduVideoPrompt
  ) {
    lines.push(
      `[Camera] ${s.cameraMovement}`,
      `[Image] ${s.imagePrompt}`,
      `[Video] ${s.videoPrompt}`
    );
    if (s.motionPrompt) lines.push(`[Motion] ${s.motionPrompt}`);
    if (s.negativePrompt) lines.push(`[Negative] ${s.negativePrompt}`);
    if (s.characterConsistency) lines.push(`[Character] ${s.characterConsistency}`);
    if (s.sceneContinuity) lines.push(`[Scene] ${s.sceneContinuity}`);
    if (s.multiReferenceInstructions) lines.push(`[Multi-ref] ${s.multiReferenceInstructions}`);
    if (s.suggestedReferenceImages?.length) {
      lines.push(`[Reference images]\n - ${s.suggestedReferenceImages.join('\n - ')}`);
    }
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
