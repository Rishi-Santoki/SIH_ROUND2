import React, { useState, useEffect } from 'react';
import { Network, Plus, Search, GitMerge, AlertTriangle, Save, X } from 'lucide-react';
import { cn } from '../../lib/utils';

// Mock taxonomy data
const MOCK_TAXONOMY = [
  { 
    id: 's1', 
    name: 'Frontend Development',
    children: [
      { id: 's1-1', name: 'React', weight: 0.6 },
      { id: 's1-2', name: 'Vue', weight: 0.2 },
      { id: 's1-3', name: 'Angular', weight: 0.2 },
    ]
  },
  { 
    id: 's2', 
    name: 'Backend Development',
    children: [
      { id: 's2-1', name: 'Node.js', weight: 0.4 },
      { id: 's2-2', name: 'Python', weight: 0.4 },
      { id: 's2-3', name: 'Go', weight: 0.2 },
    ]
  }
];

export function AdminTaxonomy() {
  const [taxonomy, setTaxonomy] = useState(MOCK_TAXONOMY);
  
  // Weights editor state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [tempWeights, setTempWeights] = useState<Record<string, number>>({});
  
  // Merge state
  const [merging, setMerging] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [mergeConfirmStep, setMergeConfirmStep] = useState(0); // 0=none, 1=first click, 2=confirmed

  // Calculate sum of temp weights
  const tempWeightSum = Object.values(tempWeights).reduce((a, b) => a + b, 0);
  const isWeightValid = Math.abs(tempWeightSum - 1.0) < 0.001;

  const startEditingWeights = (nodeId: string, children: any[]) => {
    setEditingNodeId(nodeId);
    const initialWeights: Record<string, number> = {};
    children.forEach(c => initialWeights[c.id] = c.weight);
    setTempWeights(initialWeights);
  };

  const handleWeightChange = (childId: string, value: string) => {
    const val = parseFloat(value) || 0;
    setTempWeights(prev => ({ ...prev, [childId]: val }));
  };

  const saveWeights = () => {
    if (!isWeightValid) return;
    setTaxonomy(prev => prev.map(node => {
      if (node.id === editingNodeId) {
        return {
          ...node,
          children: node.children.map(c => ({
            ...c,
            weight: tempWeights[c.id] !== undefined ? tempWeights[c.id] : c.weight
          }))
        };
      }
      return node;
    }));
    setEditingNodeId(null);
  };

  const handleMerge = () => {
    if (mergeConfirmStep === 0) setMergeConfirmStep(1);
    else if (mergeConfirmStep === 1) setMergeConfirmStep(2);
    else if (mergeConfirmStep === 2) {
      // Execute merge logic here
      console.log(`Merged ${sourceId} into ${targetId}`);
      setMerging(false);
      setMergeConfirmStep(0);
      setSourceId('');
      setTargetId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Taxonomy Management</h1>
          <p className="text-sm text-slate mt-1">Manage the global skill tree and sub-topic weights.</p>
        </div>
        <button 
          onClick={() => setMerging(!merging)}
          className={cn(
            "px-4 py-2 rounded-sm text-sm font-bold flex items-center gap-2 transition-colors border",
            merging ? "bg-alert-rust/10 text-alert-rust border-alert-rust/30" : "bg-white text-ink border-hairline hover:bg-slate/5"
          )}
        >
          <GitMerge className="h-4 w-4" /> Merge Duplicate Skills
        </button>
      </div>

      {merging && (
        <div className="bg-alert-rust/5 border-2 border-alert-rust/30 rounded-sm p-6 space-y-4">
          <div className="flex items-start gap-3">
             <AlertTriangle className="h-5 w-5 text-alert-rust shrink-0 mt-0.5" />
             <div>
               <h3 className="font-bold text-alert-rust">Merge Skills (Destructive Action)</h3>
               <p className="text-sm text-alert-rust/80 mt-1 max-w-2xl">
                 Merging will migrate all user claims, assessments, and evidence from the Source skill to the Target skill, then permanently delete the Source skill. This cannot be undone.
               </p>
             </div>
          </div>
          
          <div className="flex items-end gap-4 max-w-3xl">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1">Source Skill ID (to be deleted)</label>
              <input 
                type="text" 
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                placeholder="e.g. s1-4 (React.js)" 
                className="w-full bg-white border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-alert-rust"
              />
            </div>
            <ArrowRightIcon className="h-5 w-5 text-slate mb-3" />
            <div className="flex-1">
              <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1">Target Skill ID (to keep)</label>
              <input 
                type="text" 
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="e.g. s1-1 (React)" 
                className="w-full bg-white border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink"
              />
            </div>
            <button 
              onClick={handleMerge}
              disabled={!sourceId || !targetId}
              className={cn(
                "px-6 py-2 rounded-sm text-sm font-bold transition-colors disabled:opacity-50",
                mergeConfirmStep === 0 ? "bg-alert-rust text-white hover:bg-alert-rust/90" :
                mergeConfirmStep === 1 ? "bg-alert-rust text-white border-2 border-white ring-2 ring-alert-rust animate-pulse" :
                "bg-growth-teal text-white"
              )}
            >
              {mergeConfirmStep === 0 ? "Initiate Merge" :
               mergeConfirmStep === 1 ? "Click Again to Confirm" :
               "Merging..."}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-hairline rounded-sm shadow-sm p-6 space-y-8">
        {taxonomy.map(parent => (
          <div key={parent.id} className="border border-slate/10 rounded-sm p-5 bg-paper">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-hairline">
              <div className="flex items-center gap-2">
                <Network className="h-5 w-5 text-slate" />
                <h3 className="font-bold text-ink text-lg">{parent.name}</h3>
                <span className="text-xs font-mono text-slate bg-slate/10 px-1.5 py-0.5 rounded-sm">{parent.id}</span>
              </div>
              {editingNodeId !== parent.id ? (
                <button 
                  onClick={() => startEditingWeights(parent.id, parent.children)}
                  className="text-xs font-bold text-ink hover:underline"
                >
                  Edit Sub-topic Weights
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-sm border",
                    isWeightValid ? "bg-growth-teal/10 text-growth-teal border-growth-teal/20" : "bg-alert-rust/10 text-alert-rust border-alert-rust/20"
                  )}>
                    Sum: {tempWeightSum.toFixed(2)} / 1.00
                  </div>
                  <button onClick={() => setEditingNodeId(null)} className="text-slate hover:text-ink"><X className="h-4 w-4" /></button>
                  <button 
                    onClick={saveWeights}
                    disabled={!isWeightValid}
                    className="bg-ink text-paper px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 hover:bg-ink/90 disabled:opacity-50 transition-colors"
                  >
                    <Save className="h-3 w-3" /> Save Weights
                  </button>
                </div>
              )}
            </div>

            <div className="pl-6 border-l-2 border-slate/10 space-y-3">
              {parent.children.map(child => (
                <div key={child.id} className="flex items-center gap-4 bg-white p-3 border border-hairline rounded-sm shadow-sm">
                  <div className="w-1/3 flex items-center gap-2">
                    <span className="font-bold text-sm text-ink">{child.name}</span>
                    <span className="text-[10px] font-mono text-slate bg-slate/10 px-1 py-0.5 rounded-sm">{child.id}</span>
                  </div>
                  
                  {editingNodeId === parent.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input 
                        type="number" 
                        step="0.1" 
                        min="0" 
                        max="1"
                        value={tempWeights[child.id] || 0}
                        onChange={(e) => handleWeightChange(child.id, e.target.value)}
                        className="w-20 bg-paper border border-hairline rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-ink"
                      />
                      <div className="w-full bg-paper rounded-full h-1.5">
                        <div 
                          className={cn("h-1.5 rounded-full transition-all", isWeightValid ? "bg-growth-teal" : "bg-alert-rust")}
                          style={{ width: `${(tempWeights[child.id] || 0) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-bold text-slate w-12">{child.weight.toFixed(1)}</span>
                      <div className="w-full bg-paper rounded-full h-1.5">
                        <div 
                          className="bg-slate h-1.5 rounded-full"
                          style={{ width: `${child.weight * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button className="text-xs font-bold text-slate flex items-center gap-1 hover:text-ink transition-colors mt-2">
                <Plus className="h-3 w-3" /> Add Child Skill
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArrowRightIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
}
