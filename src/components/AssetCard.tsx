import { useRef, useState } from 'react';
import { Image as ImageIcon, Sparkles, Upload, X } from 'lucide-react';
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
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploadError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      onImageUploaded(dataUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      // Most likely localStorage quota — surface plainly.
      setUploadError(msg);
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
        <button onClick={() => fileRef.current?.click()} className="btn-ghost">
          <Upload className="w-4 h-4" />
          {asset.imageUrl ? 'Replace image' : 'Upload image'}
        </button>
        <button
          type="button"
          disabled
          className="btn-soft cursor-not-allowed opacity-60"
          title="AI image generation will be wired through a backend later"
        >
          <Sparkles className="w-4 h-4" />
          Generate Image
        </button>
      </div>

      {uploadError && (
        <p className="text-xs text-accent-pink">{uploadError}</p>
      )}

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Image generation will be connected later through a backend API. For now, copy the prompt
        into Vidu (or your image tool) or upload your generated reference image.
      </p>

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
