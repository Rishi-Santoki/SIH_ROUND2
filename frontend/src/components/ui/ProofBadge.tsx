import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ProofBadgeProps {
  status: 'verified' | 'pending' | 'self-declared' | 'unverified';
  className?: string;
  showLabel?: boolean;
  label?: string;
}

export function ProofBadge({ status, className, showLabel = false, label }: ProofBadgeProps) {
  const isVerified = status === 'verified';
  const isPending = status === 'pending';

  if (isVerified) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-verified-gold text-paper shadow-sm">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={3} />
        </div>
        {(label || showLabel) && <span className="text-sm font-medium text-ink">{label || "Verified"}</span>}
      </div>
    );
  }

  if (isPending) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-slate/40 text-slate">
          <Clock className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        {(label || showLabel) && <span className="text-sm font-medium text-slate">{label || "Verification Pending"}</span>}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="rounded-sm border border-dashed border-slate/30 bg-slate/5 px-2 py-0.5 text-xs font-medium text-slate">
        {label || "Self-Declared"}
      </div>
    </div>
  );
}
