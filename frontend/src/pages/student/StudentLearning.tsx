import React, { useState } from 'react';
import { BookOpen, ExternalLink, ShieldAlert, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

const MOCK_COURSES = [
  { id: 'c1', title: 'Python for Data Science', provider: 'Coursera', gapTarget: 'Advanced Python', progress: 100, completed: true },
  { id: 'c2', title: 'SQL Window Functions', provider: 'DataCamp', gapTarget: 'Advanced SQL', progress: 45, completed: false },
];

export function StudentLearning() {
  const [showInterstitial, setShowInterstitial] = useState<string | null>(null);

  return (
    <div className="space-y-8 relative">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Learning Resources</h1>
        <p className="text-sm text-slate mt-1">Targeted programs to close your specific skill gaps.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_COURSES.map(course => (
          <div key={course.id} className="bg-white border border-hairline rounded-sm p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-ink text-lg">{course.title}</h3>
                <p className="text-sm text-slate">{course.provider}</p>
              </div>
              <div className="bg-slate/5 p-2 rounded-sm border border-hairline flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Targets Gap</span>
                <span className="text-xs font-medium text-ink">{course.gapTarget}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-slate">Progress</span>
                <span className={course.completed ? "text-growth-teal" : "text-ink"}>{course.progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate/10 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all", course.completed ? "bg-growth-teal" : "bg-ink")}
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              {course.completed ? (
                <button 
                  onClick={() => setShowInterstitial(course.gapTarget)}
                  className="bg-paper border border-hairline text-ink px-4 py-2 rounded-sm text-sm font-medium hover:bg-slate/5 transition-colors"
                >
                  View Next Steps
                </button>
              ) : (
                <button className="bg-ink text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors flex items-center gap-2">
                  Continue Learning <ExternalLink className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Closed-loop Interstitial */}
      {showInterstitial && (
        <>
          <div className="fixed inset-0 bg-ink/20 z-40 backdrop-blur-sm" onClick={() => setShowInterstitial(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white border border-hairline rounded-sm shadow-xl z-50 p-6 animate-in zoom-in-95">
            <div className="h-12 w-12 rounded-full bg-growth-teal/10 flex items-center justify-center mb-4 text-growth-teal">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-serif font-bold text-ink mb-2">Nice work completing the course.</h3>
            <p className="text-sm text-slate mb-6 leading-relaxed">
              To officially count this toward your <span className="font-bold text-ink">{showInterstitial}</span> skill profile and close the gap, you need to pass a quick re-assessment. We verify knowledge, not just participation.
            </p>
            <div className="flex flex-col gap-3">
              <Link 
                to="/student/assessments" 
                className="bg-ink text-paper text-center px-4 py-2.5 rounded-sm font-medium hover:bg-ink/90 transition-colors"
              >
                Take Re-assessment Now
              </Link>
              <button 
                onClick={() => setShowInterstitial(null)}
                className="text-slate text-sm font-medium hover:text-ink transition-colors py-2"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
