import React from 'react';
import { cn } from '../../lib/utils';

interface Breakdown {
  skill: number;
  evidence: number;
  projects: number;
  eligibility: number;
}

interface MatchScoreVisualizerProps {
  score: number;
  breakdown: Breakdown;
  showDetails?: boolean;
}

export function MatchScoreVisualizer({ score, breakdown, showDetails = false }: MatchScoreVisualizerProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-1">
        <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Match Score</span>
        <span className="text-lg font-bold text-ink">{score}%</span>
      </div>
      
      {/* Stacked bar visualization */}
      <div className="w-full h-2 bg-slate/10 rounded-full overflow-hidden flex">
        <div className="bg-growth-teal h-full border-r border-white/30 transition-all" style={{ width: `${breakdown.skill}%` }} title={`Skill Match: ${breakdown.skill}%`} />
        <div className="bg-verified-gold h-full border-r border-white/30 transition-all" style={{ width: `${breakdown.evidence}%` }} title={`Evidence Weight: ${breakdown.evidence}%`} />
        <div className="bg-ink h-full border-r border-white/30 transition-all" style={{ width: `${breakdown.projects}%` }} title={`Project Relevance: ${breakdown.projects}%`} />
        <div className="bg-slate h-full transition-all" style={{ width: `${breakdown.eligibility}%` }} title={`Eligibility: ${breakdown.eligibility}%`} />
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-growth-teal shrink-0" />
            <span className="text-xs text-slate">Skill Match ({breakdown.skill}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-verified-gold shrink-0" />
            <span className="text-xs text-slate">Evidence Weight ({breakdown.evidence}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-ink shrink-0" />
            <span className="text-xs text-slate">Projects ({breakdown.projects}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-slate shrink-0" />
            <span className="text-xs text-slate">Eligibility ({breakdown.eligibility}%)</span>
          </div>
        </div>
      )}
    </div>
  );
}
