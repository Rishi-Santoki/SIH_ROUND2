import React from 'react';
import { FileBadge, Briefcase, FileSignature, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

export type EvidenceType = 'assessment' | 'project' | 'certificate' | 'mentor';

interface EvidenceChipProps {
  type: EvidenceType;
  label: string;
  className?: string;
}

const config = {
  assessment: {
    icon: FileBadge,
    color: 'text-slate',
    bg: 'bg-paper',
    border: 'border-hairline',
  },
  project: {
    icon: Briefcase,
    color: 'text-slate',
    bg: 'bg-paper',
    border: 'border-hairline',
  },
  certificate: {
    icon: FileSignature,
    color: 'text-slate',
    bg: 'bg-paper',
    border: 'border-hairline',
  },
  mentor: {
    icon: Users,
    color: 'text-slate',
    bg: 'bg-paper',
    border: 'border-hairline',
  }
};

export function EvidenceChip({ type, label, className }: EvidenceChipProps) {
  const { icon: Icon, color, bg, border } = config[type];
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-xs font-medium shadow-sm transition-colors hover:bg-slate/5",
      color, bg, border,
      className
    )}>
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </div>
  );
}
