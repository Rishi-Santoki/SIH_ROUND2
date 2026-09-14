import React, { useState } from 'react';
import { Search, Filter, MoreVertical, X } from 'lucide-react';
import { cn } from '../../lib/utils';

type PipelineStatus = 'applied' | 'reviewing' | 'interviewing' | 'offered' | 'rejected';

interface Candidate {
  id: string;
  name: string;
  role: string;
  status: PipelineStatus;
  score: number;
}

const MOCK_PIPELINE: Candidate[] = [
  { id: 'c1', name: 'Sarah Jenkins', role: 'Junior Data Analyst', status: 'reviewing', score: 88 },
  { id: 'c3', name: 'David Chen', role: 'Frontend Developer', status: 'applied', score: 92 },
  { id: 'c4', name: 'Maya Patel', role: 'Junior Data Analyst', status: 'interviewing', score: 85 },
];

export function IndustryPipeline() {
  const [candidates, setCandidates] = useState(MOCK_PIPELINE);
  const [transitionModal, setTransitionModal] = useState<{candidate: Candidate, newStatus: PipelineStatus} | null>(null);
  const [transitionNote, setTransitionNote] = useState('');

  const handleDragStart = (e: React.DragEvent, candidateId: string) => {
    e.dataTransfer.setData('candidateId', candidateId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: PipelineStatus) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('candidateId');
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate && candidate.status !== newStatus) {
      setTransitionModal({ candidate, newStatus });
    }
  };

  const confirmTransition = () => {
    if (!transitionModal || !transitionNote.trim()) return;
    
    setCandidates(prev => prev.map(c => 
      c.id === transitionModal.candidate.id 
        ? { ...c, status: transitionModal.newStatus } 
        : c
    ));
    setTransitionModal(null);
    setTransitionNote('');
  };

  const columns: { id: PipelineStatus, title: string }[] = [
    { id: 'applied', title: 'Applied' },
    { id: 'reviewing', title: 'Reviewing' },
    { id: 'interviewing', title: 'Interviewing' },
    { id: 'offered', title: 'Offered' },
    { id: 'rejected', title: 'Rejected' },
  ];

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Pipeline</h1>
          <p className="text-sm text-slate mt-1">Drag and drop candidates to manage their progression.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-white border border-hairline p-2 rounded-sm flex items-center gap-2 shadow-sm">
             <Search className="h-4 w-4 text-slate" />
             <input type="text" placeholder="Search..." className="bg-transparent text-sm focus:outline-none w-32" />
           </div>
           <button className="bg-white border border-hairline p-2 rounded-sm text-slate hover:text-ink shadow-sm">
             <Filter className="h-4 w-4" />
           </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const colCandidates = candidates.filter(c => c.status === col.id);
          return (
            <div 
              key={col.id} 
              className="bg-slate/5 border border-hairline rounded-sm flex-1 min-w-[280px] flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="p-3 border-b border-hairline bg-white flex justify-between items-center rounded-t-sm shrink-0">
                <h3 className="font-bold text-ink text-sm">{col.title}</h3>
                <span className="bg-slate/10 text-slate px-2 py-0.5 rounded-sm text-xs font-bold">{colCandidates.length}</span>
              </div>
              
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {colCandidates.map(c => (
                  <div 
                    key={c.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, c.id)}
                    className="bg-white border border-hairline p-4 rounded-sm shadow-sm cursor-grab active:cursor-grabbing hover:border-slate/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-ink text-sm">{c.name}</h4>
                      <button className="text-slate hover:text-ink"><MoreVertical className="h-4 w-4" /></button>
                    </div>
                    <p className="text-xs text-slate mb-3">{c.role}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-hairline">
                       <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Match Score</span>
                       <span className="text-sm font-bold text-ink">{c.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transition Modal */}
      {transitionModal && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper w-full max-w-md rounded-sm shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-white p-4 border-b border-hairline flex justify-between items-center">
              <h3 className="font-bold text-ink text-lg">Move Candidate</h3>
              <button onClick={() => setTransitionModal(null)} className="text-slate hover:text-ink"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-slate mb-2">
                  Moving <strong className="text-ink">{transitionModal.candidate.name}</strong> to <strong className="text-ink uppercase tracking-wider text-xs bg-slate/10 px-2 py-0.5 rounded-sm ml-1">{transitionModal.newStatus}</strong>
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Required: Reason / Notes</label>
                <textarea 
                  value={transitionNote}
                  onChange={(e) => setTransitionNote(e.target.value)}
                  placeholder="Explain why this candidate is moving forward or being rejected. This will be visible internally."
                  className="w-full bg-white border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink h-24 resize-none"
                />
              </div>
            </div>
            <div className="bg-white p-4 border-t border-hairline flex justify-end gap-4">
              <button onClick={() => setTransitionModal(null)} className="text-sm font-medium text-slate hover:text-ink">Cancel</button>
              <button 
                onClick={confirmTransition}
                disabled={!transitionNote.trim()}
                className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-50"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
