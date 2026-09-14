import React, { useState } from 'react';
import { Scale, ArrowRight, Check, X, FileText, Database } from 'lucide-react';
import { cn } from '../../lib/utils';

const MOCK_PROPOSALS = [
  {
    id: 'prop-1',
    status: 'pending',
    submitter: 'Auto-Tuning Engine',
    date: '3 hours ago',
    rationale: 'Recent analysis of 4,500 successful placements in Q1 indicates that verified GitHub contributions correlate more strongly with offer rates than standard certification evidence for Software Engineering roles.',
    sampleSize: 4500,
    currentWeights: { skillMatch: 40, verifiedEvidence: 30, projects: 20, eligibility: 10 },
    proposedWeights: { skillMatch: 35, verifiedEvidence: 20, projects: 35, eligibility: 10 }
  }
];

export function AdminMatching() {
  const [proposals, setProposals] = useState(MOCK_PROPOSALS);

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status: action } : p));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Matching Engine Configurations</h1>
        <p className="text-sm text-slate mt-1">Review and approve global match score weight adjustments.</p>
      </div>

      <div className="space-y-6">
        {proposals.map(proposal => (
          <div key={proposal.id} className="bg-white border-2 border-slate/10 rounded-sm shadow-sm overflow-hidden">
            <div className="bg-slate/5 p-4 border-b border-hairline flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-ink" />
                <div>
                   <h3 className="font-bold text-ink">Weight Adjustment Proposal</h3>
                   <p className="text-xs text-slate">Submitted by {proposal.submitter} • {proposal.date}</p>
                </div>
              </div>
              {proposal.status === 'pending' ? (
                <span className="bg-warning-gold/10 text-warning-gold px-3 py-1 rounded-sm text-xs font-bold border border-warning-gold/20">
                  Review Required
                </span>
              ) : (
                <span className={cn(
                  "px-3 py-1 rounded-sm text-xs font-bold border",
                  proposal.status === 'approve' ? "bg-growth-teal/10 text-growth-teal border-growth-teal/20" : "bg-alert-rust/10 text-alert-rust border-alert-rust/20"
                )}>
                  {proposal.status === 'approve' ? 'Approved & Applied' : 'Rejected'}
                </span>
              )}
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-paper p-4 border border-hairline rounded-sm">
                <h4 className="text-xs font-bold text-slate uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Rationale for Change
                </h4>
                <p className="text-sm text-ink mb-3">{proposal.rationale}</p>
                <div className="inline-flex items-center gap-2 bg-slate/10 px-3 py-1.5 rounded-sm text-xs font-bold text-slate">
                  <Database className="h-3 w-3" /> Sample Size: {proposal.sampleSize.toLocaleString()} placements
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate uppercase tracking-wider mb-4">Weight Comparison</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                   
                   {/* Current Weights */}
                   <div className="md:col-span-2 bg-slate/5 border border-hairline rounded-sm p-4 space-y-3">
                     <div className="text-sm font-bold text-ink mb-4 pb-2 border-b border-slate/20">Current Weights</div>
                     <WeightRow label="Skill Match" value={proposal.currentWeights.skillMatch} />
                     <WeightRow label="Verified Evidence" value={proposal.currentWeights.verifiedEvidence} />
                     <WeightRow label="Project Portfolios" value={proposal.currentWeights.projects} />
                     <WeightRow label="Eligibility Criteria" value={proposal.currentWeights.eligibility} />
                   </div>

                   {/* Arrow */}
                   <div className="flex justify-center md:col-span-1">
                     <ArrowRight className="h-8 w-8 text-slate opacity-50" />
                   </div>

                   {/* Proposed Weights */}
                   <div className="md:col-span-2 bg-white border-2 border-warning-gold/30 rounded-sm p-4 space-y-3 shadow-sm relative">
                     <div className="absolute top-0 right-0 w-16 h-16 bg-warning-gold/5 rounded-bl-full -z-10"></div>
                     <div className="text-sm font-bold text-warning-gold mb-4 pb-2 border-b border-slate/10">Proposed Weights</div>
                     <WeightRow label="Skill Match" value={proposal.proposedWeights.skillMatch} diff={proposal.proposedWeights.skillMatch - proposal.currentWeights.skillMatch} />
                     <WeightRow label="Verified Evidence" value={proposal.proposedWeights.verifiedEvidence} diff={proposal.proposedWeights.verifiedEvidence - proposal.currentWeights.verifiedEvidence} />
                     <WeightRow label="Project Portfolios" value={proposal.proposedWeights.projects} diff={proposal.proposedWeights.projects - proposal.currentWeights.projects} />
                     <WeightRow label="Eligibility Criteria" value={proposal.proposedWeights.eligibility} diff={proposal.proposedWeights.eligibility - proposal.currentWeights.eligibility} />
                   </div>

                </div>
              </div>

              {proposal.status === 'pending' && (
                <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
                  <button 
                    onClick={() => handleAction(proposal.id, 'reject')}
                    className="bg-white border border-alert-rust/30 text-alert-rust px-6 py-2 rounded-sm text-sm font-bold hover:bg-alert-rust/10 transition-colors flex items-center gap-2"
                  >
                    <X className="h-4 w-4" /> Reject Proposal
                  </button>
                  <button 
                    onClick={() => handleAction(proposal.id, 'approve')}
                    className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" /> Approve & Apply Global Update
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeightRow({ label, value, diff }: { label: string, value: number, diff?: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {diff !== undefined && diff !== 0 && (
            <span className={diff > 0 ? "text-growth-teal" : "text-alert-rust"}>
              {diff > 0 ? '+' : ''}{diff}%
            </span>
          )}
          <span className="font-bold text-ink">{value}%</span>
        </div>
      </div>
      <div className="w-full bg-slate/10 rounded-full h-1.5 overflow-hidden">
        <div className={cn("h-1.5 rounded-full", diff ? (diff > 0 ? "bg-growth-teal" : "bg-alert-rust") : "bg-slate")} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}
