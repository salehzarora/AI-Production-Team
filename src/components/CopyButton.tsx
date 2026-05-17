import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from '../utils/copy';

interface Props {
  text: string;
  label?: string;
  variant?: 'ghost' | 'soft';
  className?: string;
}

export default function CopyButton({ text, label = 'Copy', variant = 'ghost', className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  async function handle() {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  const base = variant === 'soft' ? 'btn-soft' : 'btn-ghost';

  return (
    <button type="button" onClick={handle} className={`${base} ${className}`}>
      {copied ? <Check className="w-4 h-4 text-accent-lime" /> : <Copy className="w-4 h-4" />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}
