import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Users, Target, History, Bell, Briefcase } from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export function InstitutionInterventions() {
  const [activeTab, setActiveTab] = useState<'recommended' | 'history'>('recommended');
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const handleAction = (id: string) => {
    setShowConfirm(id);
    // In a real app, this would trigger an API call, then show success
    setTimeout(() => {
      setShowConfirm(null);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Interventions</h1>
        <p className="text-sm text-slate mt-1">Data-driven recommendations to improve student placement readiness.</p>
      </div>

      <div className="flex border-b border-hairline mb-6">
        <button
          onClick={() => setActiveTab('recommended')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-colors relative",
            activeTab === 'recommended' ? "text-ink" : "text-slate hover:text-ink"
          )}
        >
          Recommended Actions
          {activeTab === 'recommended' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-ink"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-colors relative flex items-center gap-2",
            activeTab === 'history' ? "text-ink" : "text-slate hover:text-ink"
          )}
        >
          Impact History
          {activeTab === 'history' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-ink"></div>
          )}
        </button>
      </div>

      {activeTab === 'recommended' && (
        <div className="space-y-6">
          {/* Action 1 */}
          <div className="bg-white border-2 border-alert-rust/20 rounded-sm p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-alert-rust/10 p-2 rounded-sm text-alert-rust">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-lg">Cloud Security Gap in CS Dept</h3>
                    <p className="text-sm text-slate mt-1 flex items-center gap-2">
                      <Users className="h-4 w-4" /> 145 students affected (4th Year)
                    </p>
                  </div>
                </div>
                
                <div className="bg-paper p-4 border border-hairline rounded-sm">
                  <span className="text-xs text-slate font-bold uppercase tracking-wider mb-2 block flex items-center gap-2">
                    <Target className="h-3 w-3" /> The Insight
                  </span>
                  <p className="text-sm text-ink font-medium">
                    Industry demand for Cloud Security is at 92%, but current 4th-year CS students average only 25% readiness in verifiable skills for this domain.
                  </p>
                </div>
              </div>

              <div className="w-full md:w-64 bg-slate/5 p-4 rounded-sm border border-slate/10 space-y-3 shrink-0">
                <h4 className="text-xs font-bold text-slate uppercase tracking-wider">Suggested Actions</h4>
                
                {showConfirm === 'act1' ? (
                  <div className="bg-growth-teal/10 text-growth-teal border border-growth-teal/20 p-3 rounded-sm flex items-center gap-2 text-sm font-bold justify-center">
                    <CheckCircle2 className="h-4 w-4" /> Action Initiated
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => handleAction('act1')}
                      className="w-full bg-ink text-paper py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Briefcase className="h-4 w-4" /> Propose FDP
                    </button>
                    <button 
                      className="w-full bg-white border border-ink text-ink py-2 rounded-sm text-sm font-bold hover:bg-slate/5 transition-colors flex items-center justify-center gap-2"
                    >
                      <Bell className="h-4 w-4" /> Notify Students
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action 2 */}
          <div className="bg-white border border-warning-gold/40 rounded-sm p-6 shadow-sm">
             <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-warning-gold/10 p-2 rounded-sm text-warning-gold">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-lg">System Design Practical Evidence</h3>
                    <p className="text-sm text-slate mt-1 flex items-center gap-2">
                      <Users className="h-4 w-4" /> 89 students affected (IT Dept)
                    </p>
                  </div>
                </div>
                
                <div className="bg-paper p-4 border border-hairline rounded-sm">
                  <span className="text-xs text-slate font-bold uppercase tracking-wider mb-2 block flex items-center gap-2">
                    <Target className="h-3 w-3" /> The Insight
                  </span>
                  <p className="text-sm text-ink font-medium">
                    High theoretical knowledge scores, but 0 verifiable GitHub repositories or architecture diagrams linked for System Design.
                  </p>
                </div>
              </div>

              <div className="w-full md:w-64 bg-slate/5 p-4 rounded-sm border border-slate/10 space-y-3 shrink-0">
                <h4 className="text-xs font-bold text-slate uppercase tracking-wider">Suggested Actions</h4>
                
                {showConfirm === 'act2' ? (
                  <div className="bg-growth-teal/10 text-growth-teal border border-growth-teal/20 p-3 rounded-sm flex items-center gap-2 text-sm font-bold justify-center">
                    <CheckCircle2 className="h-4 w-4" /> Action Initiated
                  </div>
                ) : (
                  <button 
                    onClick={() => handleAction('act2')}
                    className="w-full bg-white border border-ink text-ink py-2 rounded-sm text-sm font-bold hover:bg-slate/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <Bell className="h-4 w-4" /> Notify Students (Mandate Project)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white border border-hairline rounded-sm p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-ink text-lg">React Bootcamp (Feb 2026)</h3>
                <p className="text-sm text-slate">Intervention for IT Dept 3rd Years</p>
              </div>
              <span className="bg-growth-teal/10 text-growth-teal px-3 py-1 rounded-sm text-xs font-bold flex items-center gap-2 border border-growth-teal/20">
                <CheckCircle2 className="h-4 w-4" /> Completed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="bg-slate/5 p-4 rounded-sm border border-slate/10">
                  <p className="text-sm text-ink">
                    <strong>Action Taken:</strong> 2-week intensive hands-on React workshop mandated for all 3rd-year IT students.
                  </p>
                </div>
                <div className="flex justify-between items-center bg-paper p-4 rounded-sm border border-hairline">
                  <div className="text-center">
                    <p className="text-xs text-slate font-bold uppercase tracking-wider mb-1">Target Group</p>
                    <p className="text-xl font-serif font-bold text-ink">120 Students</p>
                  </div>
                  <div className="w-px h-10 bg-hairline"></div>
                  <div className="text-center">
                    <p className="text-xs text-slate font-bold uppercase tracking-wider mb-1">Net Impact</p>
                    <p className="text-xl font-serif font-bold text-growth-teal">+42% Readiness</p>
                  </div>
                </div>
              </div>

              {/* Before/After Impact Visual */}
              <div className="bg-paper p-4 rounded-sm border border-hairline">
                <h4 className="text-xs text-slate font-bold uppercase tracking-wider mb-4 text-center">
                  Readiness Snapshot: Before vs After
                </h4>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Before (Jan 2026)', readiness: 28 },
                        { name: 'After (Mar 2026)', readiness: 70 },
                      ]}
                      margin={{ top: 5, right: 0, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#14213D', fontWeight: 600 }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        contentStyle={{ borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="readiness" radius={[4, 4, 0, 0]}>
                        {
                          [
                            { name: 'Before', color: '#f87171' }, // rust
                            { name: 'After', color: '#10b981' }   // teal
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
