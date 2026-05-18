import { useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, Sparkles, Upload, X } from 'lucide-react';
import type { AssetStatus, ProductionAsset } from '../types';
import { fileToDataUrl } from '../utils/image';
import CopyButton from './CopyButton';

interface Props {
  asset: ProductionAsset;
  /** Optional subtitle line under the name (e.g. "Shot 3 · references: Hero, Park"). */
  subtitle?: string;
  onImageUploaded: (dataUrl: string) => void;
  onImageCleared: () => void;
  onNotesChanged: (notes: string) => void;
  /** When provided, the Generate Image button becomes active. Should call the backend and resolve with the image URL, or throw on failure. */
  onGenerate?: () => Promise<void>;
}

const STATUS_STYLES: Record<AssetStatus, string> = {
  missing: 'border-bg-border text-slate-400 bg-bg-panel/50',
  'prompt-ready': 'border-accent-blue/40 text-accent-blue bg-accent-blue/10',
  uploaded: 'border-accent-lime/40 text-accent-lime bg-accent-lime/10',
  generated: 'border-accent-violet/40 text-accent-violet bg-accent-violet/10',
};

const STATUS_LABEL: Record<AssetStatus, string> = {
  missing: 'Missing',
  'prompt-ready': 'Prompt ready',
  uploaded: 'Image uploaded',
  generated: 'AI generated',
};

export default function AssetCard({
  asset,
  subtitle,
  onImageUploaded,
  onImageCleared,
  onNotesChanged,
  onGenerate,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploadError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      onImageUploaded(dataUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      setUploadError(msg);
    }
  }

  async function handleGenerate() {
    if (!onGenerate) return;
    setGenerateError(null);
    setGenerating(true);
    try {
      await onGenerate();
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-white truncate">{asset.name}</div>
          {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
        </div>
        <span className={`badge ${STATUS_STYLES[asset.status]}`}>{STATUS_LABEL[asset.status]}</span>
      </div>

      {/* Image preview */}
      {asset.imageUrl ? (
        <div className="relative group">
          <img
            src={asset.imageUrl}
            alt={asset.name}
            className="w-full max-h-72 object-contain rounded-lg border border-bg-border bg-bg-panel"
          />
          <button
            type="button"
            onClick={onImageCleared}
            className="absolute top-2 right-2 btn-soft px-2 py-1 opacity-80 hover:opacity-100"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="border border-dashed border-bg-border rounded-lg p-6 grid place-items-center text-slate-500">
          <div className="flex flex-col items-center gap-2 text-center">
            <ImageIcon className="w-6 h-6" />
            <p className="text-xs">No image yet. Copy the prompt below or upload one.</p>
          </div>
        </div>
      )}

      {/* Prompt */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="section-title">Prompt</span>
          <CopyButton text={asset.prompt} variant="soft" />
        </div>
        <code className="block bg-bg-panel/70 border border-bg-border rounded-lg p-3 font-mono text-xs whitespace-pre-wrap leading-relaxed">
          {asset.prompt}
        </code>
      </div>

      {asset.negativePrompt && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="section-title">Negative prompt</span>
            <CopyButton text={asset.negativePrompt} variant="soft" />
          </div>
          <code className="block bg-bg-panel/70 border border-bg-border rounded-lg p-3 font-mono text-xs whitespace-pre-wrap leading-relaxed">
            {asset.negativePrompt}
          </code>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            // reset so the same file can be re-uploaded if needed
            e.target.value = '';
          }}
        />
        <button onClick={() => fileRef.current?.click()} className="btn-ghost" disabled={generating}>
          <Upload className="w-4 h-4" />
          {asset.imageUrl ? 'Replace image' : 'Upload image'}
        </button>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!onGenerate || generating}
          className={`btn-soft ${!onGenerate ? 'cursor-not-allowed opacity-40' : ''}`}
          title={onGenerate ? 'Generate via backend API' : 'Backend not reachable'}
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {generating ? 'Generating…' : 'Generate Image'}
        </button>
      </div>

      {uploadError && (
        <p className="text-xs text-accent-pink">{uploadError}</p>
      )}

      {generateError && (
        <p className="text-xs text-accent-pink">{generateError}</p>
      )}

      {/* Notes */}
      <div className="space-y-1.5">
        <span className="section-title">Notes</span>
        <textarea
          value={asset.notes}
          onChange={(e) => onNotesChanged(e.target.value)}
          rows={2}
          placeholder="e.g. used seed 12345, generated in Midjourney v6, palette locked"
          className="pill-input text-xs"
        />
      </div>
    </div>
  );
}
