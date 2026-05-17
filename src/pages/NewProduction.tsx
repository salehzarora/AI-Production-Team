import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Rocket } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { createProject } from '../utils/project';
import type { Platform, VideoDuration, VideoStyle } from '../types';

const PLATFORMS: Platform[] = ['YouTube Shorts', 'TikTok', 'Instagram Reels'];
const STYLES: VideoStyle[] = [
  'Pixar-style claymation',
  '3D cartoon',
  'anime',
  'cinematic',
  'simple kids animation',
];
const DURATIONS: VideoDuration[] = [15, 30, 60];

export default function NewProduction() {
  const navigate = useNavigate();
  const { save } = useProjects();

  const [idea, setIdea] = useState('');
  const [platform, setPlatform] = useState<Platform>('YouTube Shorts');
  const [style, setStyle] = useState<VideoStyle>('Pixar-style claymation');
  const [duration, setDuration] = useState<VideoDuration>(30);

  function handleStart() {
    const trimmed = idea.trim();
    if (!trimmed) return;
    const project = createProject({ idea: trimmed, platform, style, duration });
    save(project);
    navigate(`/project/${project.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-bg-border bg-bg-panel/60 text-xs text-slate-300 mb-4">
          <Sparkles className="w-3 h-3 text-accent-blue" />
          New production
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold">Start a new production</h1>
        <p className="text-slate-400 mt-2">
          Describe the idea, pick a platform and style, and the agents take it from there.
        </p>
      </div>

      <div className="card p-6 space-y-6">
        <div className="space-y-2">
          <label className="section-title block">Video idea</label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={5}
            placeholder="e.g. A tiny detective hamster solves the mystery of the missing sunflower seeds in a backyard noir."
            className="pill-input resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="section-title block">Target platform</label>
          <div className="grid grid-cols-3 gap-2">
            {PLATFORMS.map((p) => (
              <ChoiceButton
                key={p}
                label={p}
                active={platform === p}
                onClick={() => setPlatform(p)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="section-title block">Style</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STYLES.map((s) => (
              <ChoiceButton key={s} label={s} active={style === s} onClick={() => setStyle(s)} />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="section-title block">Video length</label>
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map((d) => (
              <ChoiceButton
                key={d}
                label={`${d} seconds`}
                active={duration === d}
                onClick={() => setDuration(d)}
              />
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleStart}
            disabled={!idea.trim()}
            className="btn-primary w-full py-3 text-base"
          >
            <Rocket className="w-5 h-5" />
            Start Production
          </button>
        </div>
      </div>
    </div>
  );
}

function ChoiceButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-2.5 rounded-xl border text-sm font-medium transition text-left',
        active
          ? 'border-accent-blue/70 bg-accent-blue/10 text-white shadow-glow'
          : 'border-bg-border bg-bg-panel/40 text-slate-300 hover:border-accent-blue/40 hover:text-white',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
