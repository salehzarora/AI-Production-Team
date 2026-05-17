import { Check, Circle, Loader2 } from 'lucide-react';
import type { StepStatus } from '../types';

const CONFIG: Record<StepStatus, { label: string; classes: string; Icon: typeof Check }> = {
  pending: {
    label: 'Pending',
    classes: 'border-bg-border text-slate-400 bg-bg-panel/50',
    Icon: Circle,
  },
  working: {
    label: 'Working',
    classes: 'border-accent-blue/60 text-accent-blue bg-accent-blue/10',
    Icon: Loader2,
  },
  complete: {
    label: 'Complete',
    classes: 'border-accent-lime/60 text-accent-lime bg-accent-lime/10',
    Icon: Check,
  },
};

export default function StatusBadge({ status }: { status: StepStatus }) {
  const { label, classes, Icon } = CONFIG[status];
  return (
    <span className={`badge ${classes}`}>
      <Icon className={`w-3 h-3 ${status === 'working' ? 'animate-spin' : ''}`} />
      {label}
    </span>
  );
}
