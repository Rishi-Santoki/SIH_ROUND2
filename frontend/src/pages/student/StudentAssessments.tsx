import React from 'react';
import { Link } from 'react-router-dom';
import { FileBadge, ArrowRight, PlayCircle, BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';

const MOCK_AVAILABLE = [
  { id: 'a1', title: 'Advanced SQL Assessment', skill: 'Advanced SQL', duration: '45 mins', questions: 20 },
  { id: 'a2', title: 'Python Fundamentals', skill: 'Python', duration: '30 mins', questions: 15 },
];

const MOCK_RESULTS = [
  { 
    id: 'r1', 
    title: 'Data Structures in Python', 
    date: 'Oct 15, 2023', 
    score: 92,
    coverage: { total: 6, tested: 4, text: 'Tested 4 of 6 sub-topics' } 
  },
  { 
    id: 'r2', 
    title: 'Machine Learning Basics', 
    date: 'Sep 22, 2023', 
    score: 45,
    coverage: { total: 5, tested: 5, text: 'Tested 5 of 5 sub-topics' }
  }
];

export function StudentAssessments() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Assessments</h1>
        <p className="text-sm text-slate mt-1">Verify your self-declared skills and close your skill gaps.</p>
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate uppercase tracking-wider mb-4">Available to Take</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_AVAILABLE.map(a => (
            <div key={a.id} className="bg-white border border-hairline p-5 rounded-sm shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-ink text-lg">{a.title}</h4>
                  <div className="bg-slate/10 px-2 py-1 rounded-sm flex items-center gap-1">
                    <FileBadge className="h-3 w-3 text-slate" />
                  </div>
                </div>
                <div className="text-sm text-slate mt-2 flex gap-4">
                  <span>{a.skill}</span>
                  <span>•</span>
                  <span>{a.duration}</span>
                  <span>•</span>
                  <span>{a.questions} Qs</span>
                </div>
              </div>
              <div className="mt-6">
                <Link 
                  to={`/student/assessments/${a.id}/take`}
                  className="flex items-center justify-center gap-2 w-full bg-ink text-paper py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors"
                >
                  <PlayCircle className="h-4 w-4" /> Start Assessment
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate uppercase tracking-wider mb-4 mt-8">Past Results</h3>
        <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden divide-y divide-hairline">
          {MOCK_RESULTS.map(r => (
            <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate/5 transition-colors">
              <div>
                <h4 className="font-bold text-ink">{r.title}</h4>
                <p className="text-sm text-slate mt-1">{r.date}</p>
              </div>
              
              <div className="flex items-center gap-6 sm:w-1/2 justify-end">
                <div className="text-right flex-1">
                  <p className="text-xs font-bold text-slate uppercase tracking-wider mb-1">Coverage</p>
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-16 bg-slate/10 rounded-full overflow-hidden flex">
                      <div className="bg-ink h-full" style={{ width: `${(r.coverage.tested/r.coverage.total)*100}%` }} />
                    </div>
                    <span className="text-xs text-slate font-medium">{r.coverage.text}</span>
                  </div>
                </div>
                
                <div className="text-right w-16">
                  <p className="text-xs font-bold text-slate uppercase tracking-wider mb-1">Score</p>
                  <span className={cn("text-lg font-bold", r.score >= 70 ? "text-growth-teal" : "text-alert-rust")}>
                    {r.score}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
