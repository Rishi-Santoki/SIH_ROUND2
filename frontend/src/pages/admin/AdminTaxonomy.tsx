import React, { useState, useMemo } from 'react';
import { Network, Plus, Search, GitMerge, AlertTriangle, Save, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

interface SkillItem {
  skill_id: string;
  name: string;
  category: string;
  description?: string;
  parent_skill_id?: string | null;
}

export function AdminTaxonomy() {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [tempWeights, setTempWeights] = useState<Record<string, number>>({});
  
  // Merge state
  const [merging, setMerging] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [mergeConfirmStep, setMergeConfirmStep] = useState(0); // 0=none, 1=first click

  const { data: skills = [], isLoading, isError, refetch } = useQuery<SkillItem[]>({
    queryKey: ['admin-skills'],
    queryFn: async () => {
      return await apiClient.get<SkillItem[]>('/admin/skills');
    }
  });

  const mergeMutation = useApiMutation(
    async ({ srcId, tgtId }: { srcId: string; tgtId: string }) => {
      return await apiClient.post(`/admin/skills/${srcId}/merge`, { merge_into_skill_id: tgtId });
    },
    {
      successMessage: 'Skills merged successfully. All references migrated to target skill.',
      invalidateQueries: [['admin-skills']],
    }
  );

  const saveTopicWeightMutation = useApiMutation(
    async ({ parentId, childId, weight }: { parentId: string; childId: string; weight: number }) => {
      return await apiClient.post(`/admin/skills/${parentId}/topics`, {
        child_skill_id: childId,
        weight,
        is_mandatory: false
      });
    },
    {
      successMessage: 'Subtopic weights updated successfully.',
      invalidateQueries: [['admin-skills']],
    }
  );

  // Group into parent and children
  const taxonomy = useMemo(() => {
    // Collect root skills (parent_skill_id is null or categories)
    const parents = skills.filter(s => !s.parent_skill_id);
    const childMap = new Map<string, SkillItem[]>();

    skills.forEach(s => {
      if (s.parent_skill_id) {
        const list = childMap.get(s.parent_skill_id) || [];
        list.push(s);
        childMap.set(s.parent_skill_id, list);
      }
    });

    if (parents.length === 0 && skills.length > 0) {
      // Group by category if no explicit tree
      const catMap = new Map<string, SkillItem[]>();
      skills.forEach(s => {
        const list = catMap.get(s.category) || [];
        list.push(s);
        catMap.set(s.category, list);
      });

      return Array.from(catMap.entries()).map(([cat, sks]) => ({
        id: `cat-${cat}`,
        name: `${cat} Domain`,
        children: sks.map(s => ({
          id: s.skill_id,
          name: s.name,
          weight: 1.0 / Math.max(1, sks.length)
        }))
      }));
    }

    return parents.map(p => {
      const children = childMap.get(p.skill_id) || [];
      return {
        id: p.skill_id,
        name: p.name,
        children: children.map(c => ({
          id: c.skill_id,
          name: c.name,
          weight: 1.0 / Math.max(1, children.length)
        }))
      };
    });
  }, [skills]);

  // Calculate sum of temp weights
  const tempWeightSum = Object.values(tempWeights).reduce((a, b) => a + b, 0);
  const isWeightValid = Math.abs(tempWeightSum - 1.0) < 0.05;

  const startEditingWeights = (nodeId: string, children: any[]) => {
    setEditingNodeId(nodeId);
    const initialWeights: Record<string, number> = {};
    children.forEach(c => (initialWeights[c.id] = c.weight));
    setTempWeights(initialWeights);
  };

  const handleWeightChange = (childId: string, value: string) => {
    const val = parseFloat(value) || 0;
    setTempWeights(prev => ({ ...prev, [childId]: val }));
  };

  const saveWeights = async () => {
    if (!editingNodeId || !isWeightValid) return;
    const parentNode = taxonomy.find(t => t.id === editingNodeId);
    if (!parentNode) return;

    for (const child of parentNode.children) {
      const weight = tempWeights[child.id] ?? child.weight;
      await saveTopicWeightMutation.mutateAsync({
        parentId: editingNodeId,
        childId: child.id,
        weight
      });
    }
    setEditingNodeId(null);
  };

  const handleMerge = () => {
    if (mergeConfirmStep === 0) {
      setMergeConfirmStep(1);
    } else if (mergeConfirmStep === 1) {
      mergeMutation.mutate(
        { srcId: sourceId, tgtId: targetId },
        {
          onSuccess: () => {
            setMerging(false);
            setMergeConfirmStep(0);
            setSourceId('');
            setTargetId('');
          }
        }
      );
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
          onClick={() => {
            setMerging(!merging);
            setMergeConfirmStep(0);
          }}
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
                 Merging will migrate all user claims, assessments, and evidence from the Source skill to the Target skill, then permanently delete the Source skill.
               </p>
             </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-end gap-4 max-w-3xl">
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1">Source Skill (to be deleted)</label>
              <select
                value={sourceId}
                onChange={(e) => {
                  setSourceId(e.target.value);
                  setMergeConfirmStep(0);
                }}
                className="w-full bg-white border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-alert-rust"
              >
                <option value="">Select skill to merge and delete...</option>
                {skills.map(s => (
                  <option key={s.skill_id} value={s.skill_id} disabled={s.skill_id === targetId}>
                    {s.name} ({s.category}) — {s.skill_id.slice(0, 8)}...
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1">Target Skill (to keep)</label>
              <select
                value={targetId}
                onChange={(e) => {
                  setTargetId(e.target.value);
                  setMergeConfirmStep(0);
                }}
                className="w-full bg-white border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink"
              >
                <option value="">Select skill to retain...</option>
                {skills.map(s => (
                  <option key={s.skill_id} value={s.skill_id} disabled={s.skill_id === sourceId}>
                    {s.name} ({s.category}) — {s.skill_id.slice(0, 8)}...
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={handleMerge}
              disabled={!sourceId || !targetId || sourceId === targetId || mergeMutation.isPending}
              className={cn(
                "px-6 py-2 rounded-sm text-sm font-bold transition-colors disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-1.5",
                mergeConfirmStep === 0 ? "bg-alert-rust text-white hover:bg-alert-rust/90" :
                "bg-alert-rust text-white border-2 border-white ring-2 ring-alert-rust animate-pulse"
              )}
            >
              {mergeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Merging...
                </>
              ) : mergeConfirmStep === 0 ? (
                "Initiate Merge"
              ) : (
                "Click Again to Confirm"
              )}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-hairline rounded-sm shadow-sm p-6 space-y-8">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-ink mb-3" />
            <span className="text-sm text-slate">Loading skill taxonomy...</span>
          </div>
        ) : isError ? (
          <div className="bg-alert-rust/5 border border-alert-rust/30 p-8 rounded-sm text-center">
            <p className="text-sm font-bold text-alert-rust">Failed to load skills taxonomy.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-xs font-bold bg-alert-rust text-white px-3 py-1.5 rounded-sm hover:bg-alert-rust/90 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : taxonomy.length === 0 ? (
          <div className="text-center p-8 text-slate text-sm">
            No taxonomy roots found. Reference skills are empty.
          </div>
        ) : (
          taxonomy.map(parent => (
            <div key={parent.id} className="border border-slate/10 rounded-sm p-5 bg-paper">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-hairline">
                <div className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-slate" />
                  <h3 className="font-bold text-ink text-lg">{parent.name}</h3>
                  <span className="text-xs font-mono text-slate bg-slate/10 px-1.5 py-0.5 rounded-sm">{parent.id.slice(0, 10)}</span>
                </div>
                {parent.children.length > 0 && (
                  editingNodeId !== parent.id ? (
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
                        disabled={!isWeightValid || saveTopicWeightMutation.isPending}
                        className="bg-ink text-paper px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 hover:bg-ink/90 disabled:opacity-50 transition-colors"
                      >
                        {saveTopicWeightMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save Weights
                      </button>
                    </div>
                  )
                )}
              </div>

              <div className="pl-6 border-l-2 border-slate/10 space-y-3">
                {parent.children.length === 0 ? (
                  <div className="text-xs text-slate italic py-2">No sub-skills currently mapped to this parent.</div>
                ) : (
                  parent.children.map(child => (
                    <div key={child.id} className="flex items-center gap-4 bg-white p-3 border border-hairline rounded-sm shadow-sm">
                      <div className="w-1/3 flex items-center gap-2">
                        <span className="font-bold text-sm text-ink">{child.name}</span>
                        <span className="text-[10px] font-mono text-slate bg-slate/10 px-1 py-0.5 rounded-sm">{child.id.slice(0, 8)}</span>
                      </div>
                      
                      {editingNodeId === parent.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input 
                            type="number" 
                            step="0.05" 
                            min="0" 
                            max="1"
                            value={tempWeights[child.id] !== undefined ? tempWeights[child.id] : child.weight}
                            onChange={(e) => handleWeightChange(child.id, e.target.value)}
                            className="w-20 bg-paper border border-hairline rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-ink"
                          />
                          <div className="w-full bg-paper rounded-full h-1.5">
                            <div 
                              className={cn("h-1.5 rounded-full transition-all", isWeightValid ? "bg-growth-teal" : "bg-alert-rust")}
                              style={{ width: `${Math.min(100, Math.max(0, (tempWeights[child.id] || 0) * 100))}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm font-bold text-slate w-12">{(child.weight || 0).toFixed(2)}</span>
                          <div className="w-full bg-paper rounded-full h-1.5">
                            <div 
                              className="bg-slate h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, (child.weight || 0) * 100))}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
