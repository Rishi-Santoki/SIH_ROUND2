import React from 'react';
import { Target, ArrowRight, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { ProofBadge } from '../../components/ui/ProofBadge';

export function StudentDashboard() {
  return (
    <div className="space-y-6">
      
      {/* Readiness Hero Card */}
      <div className="bg-white rounded-sm border border-hairline p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
        {/* Radial Progress (Simplified with SVG for now) */}
        <div className="relative w-40 h-40 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate/10"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-growth-teal"
              strokeWidth="3"
              strokeDasharray="65, 100"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-serif font-bold text-ink">65%</span>
            <span className="text-[10px] uppercase tracking-wider text-slate font-medium">Readiness</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate uppercase tracking-wider">Target Role</h2>
            <h1 className="text-2xl font-serif font-bold text-ink">Junior Data Scientist</h1>
            <p className="text-sm text-slate mt-1">Based on 12 verified skills and 3 assessments.</p>
          </div>
          
          <div className="bg-paper p-4 rounded-sm border border-hairline flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate uppercase tracking-wider mb-1 flex items-center gap-1"><Target className="h-3 w-3" /> Next Best Action</div>
              <div className="font-medium text-ink text-sm">Pass the Advanced SQL Assessment to close your highest-ranked gap.</div>
            </div>
            <button className="flex items-center justify-center h-8 w-8 bg-ink text-paper rounded-full hover:bg-ink/90 transition-colors shrink-0">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stat Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-sm border border-hairline flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-slate font-medium">Active Applications</p>
            <p className="text-2xl font-serif font-bold text-ink mt-1">3</p>
          </div>
          <div className="h-10 w-10 bg-slate/5 rounded-full flex items-center justify-center text-slate">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-sm border border-hairline flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-slate font-medium mb-2">Skill Verification</p>
            <div className="flex items-center gap-2">
              <ProofBadge status="verified" label="12" />
              <ProofBadge status="self-declared" label="8" />
            </div>
          </div>
          <div className="h-10 w-10 bg-verified-gold/10 rounded-full flex items-center justify-center text-verified-gold">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-hairline flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-slate font-medium">Upcoming Deadline</p>
            <p className="text-sm font-serif font-bold text-ink mt-1">Google Summer Internship</p>
            <p className="text-xs text-alert-rust mt-1 font-medium">In 3 days</p>
          </div>
          <div className="h-10 w-10 bg-alert-rust/10 rounded-full flex items-center justify-center text-alert-rust">
            <Target className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Continue Where You Left Off */}
      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline bg-paper">
          <h3 className="font-bold text-ink text-sm uppercase tracking-wider">Continue Where You Left Off</h3>
        </div>
        <div className="p-6 flex flex-col sm:flex-row items-center gap-4 justify-between hover:bg-slate/5 transition-colors cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-growth-teal/10 rounded-sm flex items-center justify-center text-growth-teal">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-ink group-hover:text-growth-teal transition-colors">Python Data Structures</h4>
              <p className="text-sm text-slate mt-1">Step 3 of 5 in your Data Scientist Roadmap</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
             <div className="flex-1 sm:w-32 bg-slate/10 h-2 rounded-full overflow-hidden">
                <div className="bg-growth-teal h-full w-3/5" />
             </div>
             <span className="text-xs font-bold text-slate">60%</span>
             <ArrowRight className="h-4 w-4 text-slate opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

    </div>
  );
}
