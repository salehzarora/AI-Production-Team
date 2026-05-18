import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Boxes, Image as ImageIcon, MapPin, Users, Package } from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { ensureAssets, updateAsset } from '../utils/project';
import AssetCard from '../components/AssetCard';
import type { AssetKind } from '../utils/project';
import type { ProductionAsset } from '../types';

type Tab = AssetKind;

const TABS: { id: Tab; label: string; Icon: typeof Users }[] = [
  { id: 'characters', label: 'Characters', Icon: Users },
  { id: 'environments', label: 'Environments', Icon: MapPin },
  { id: 'props', label: 'Props', Icon: Package },
  { id: 'shotImages', label: 'Shot Images', Icon: ImageIcon },
];

export default function AssetsStudio() {
  const { id } = useParams();
  const { project, loading, update } = useProject(id);
  const [tab, setTab] = useState<Tab>('characters');
  // Normalize so we always have an `assets` object even on legacy projects.
  const safeProject = useMemo(
    () => (project ? ensureAssets(project) : null),
    [project]
  );

  if (loading) return <div className="text-slate-400">Loading...</div>;
  if (!safeProject) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-300">Project not found.</p>
        <Link to="/" className="btn-ghost mt-4 inline-flex">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const assets = safeProject.assets!; // ensureAssets guarantees this

  const counts = {
    characters: assets.characters.length,
    environments: assets.environments.length,
    props: assets.props.length,
    shotImages: assets.shotImages.length,
  };
  const totalAssets = counts.characters + counts.environments + counts.props + counts.shotImages;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            to={`/project/${safeProject.id}`}
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> Back to workflow
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-accent-gold" />
            Assets Studio
          </h1>
          <div className="text-sm text-slate-400 mt-0.5">
            {safeProject.title} · {totalAssets} asset{totalAssets === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div className="card p-3 bg-bg-panel/40">
        <p className="text-xs text-slate-300 leading-relaxed">
          <span className="text-accent-blue font-medium">Workflow:</span>{' '}
          1) Generate character images from these prompts. 2) Upload them so every shot can reuse
          the same identity. 3) Repeat for environments and props. 4) For each shot, generate the
          shot image using its prompt + the character / environment references. 5) Feed everything
          into Vidu image-to-video.
        </p>
      </div>

      {/* Tabs */}
      <div className="card p-2 flex flex-wrap gap-1">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          const Icon = t.Icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition',
                isActive
                  ? 'bg-accent-blue/15 text-white shadow-glow border border-accent-blue/40'
                  : 'border border-transparent text-slate-300 hover:text-white hover:bg-bg-border/40',
              ].join(' ')}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              <span className="badge border-bg-border text-slate-400 ml-1">
                {counts[t.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Empty state for current tab */}
      {counts[tab] === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-slate-300">No {TABS.find((t) => t.id === tab)?.label.toLowerCase()} yet.</p>
          <p className="text-sm text-slate-500 mt-1">
            {tab === 'characters' && 'Run the Character Agent to generate character asset prompts.'}
            {tab === 'environments' && 'Run the Scene Agent to generate environment plates.'}
            {tab === 'props' && 'Run the Scene Agent to generate prop references.'}
            {tab === 'shotImages' && 'Run the Shot Image Agent (after the Storyboard Agent) to generate per-shot image prompts.'}
          </p>
          <Link to={`/project/${safeProject.id}`} className="btn-ghost mt-4 inline-flex">
            Open workflow
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {tab === 'characters' &&
            assets.characters.map((a) => (
              <AssetCard
                key={a.id}
                asset={a}
                subtitle={a.roleInStory}
                onImageUploaded={(dataUrl) => updateOne('characters', a.id, { imageUrl: dataUrl, status: 'uploaded' })}
                onImageCleared={() => updateOne('characters', a.id, { imageUrl: undefined, status: 'prompt-ready' })}
                onNotesChanged={(notes) => updateOne('characters', a.id, { notes })}
              />
            ))}
          {tab === 'environments' &&
            assets.environments.map((a) => (
              <AssetCard
                key={a.id}
                asset={a}
                subtitle={a.description}
                onImageUploaded={(dataUrl) => updateOne('environments', a.id, { imageUrl: dataUrl, status: 'uploaded' })}
                onImageCleared={() => updateOne('environments', a.id, { imageUrl: undefined, status: 'prompt-ready' })}
                onNotesChanged={(notes) => updateOne('environments', a.id, { notes })}
              />
            ))}
          {tab === 'props' &&
            assets.props.map((a) => (
              <AssetCard
                key={a.id}
                asset={a}
                subtitle={a.description}
                onImageUploaded={(dataUrl) => updateOne('props', a.id, { imageUrl: dataUrl, status: 'uploaded' })}
                onImageCleared={() => updateOne('props', a.id, { imageUrl: undefined, status: 'prompt-ready' })}
                onNotesChanged={(notes) => updateOne('props', a.id, { notes })}
              />
            ))}
          {tab === 'shotImages' &&
            assets.shotImages.map((a) => (
              <AssetCard
                key={a.id}
                asset={a}
                subtitle={`Shot ${a.shotNumber} · refs: ${a.referenceAssets.join(', ') || '—'}`}
                onImageUploaded={(dataUrl) => updateOne('shotImages', a.id, { imageUrl: dataUrl, status: 'uploaded' })}
                onImageCleared={() => updateOne('shotImages', a.id, { imageUrl: undefined, status: 'prompt-ready' })}
                onNotesChanged={(notes) => updateOne('shotImages', a.id, { notes })}
              />
            ))}
        </div>
      )}
    </div>
  );

  function updateOne(kind: AssetKind, assetId: string, patch: Partial<ProductionAsset>) {
    update(updateAsset(safeProject!, kind, assetId, patch));
  }
}
