import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Users, Target, History, Bell, Briefcase, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

interface RecommendedIntervention {
  skill: string;
  insight: string;
  action: string;
  suggested_collaboration_type?: string;
  affected_students?: number;
}

interface InterventionHistoryItem {
  intervention_id: string;
  action_type: string;
  notes: string;
  created_at: string;
  target_students?: string[];
  readiness_snapshot?: Record<string, number>;
}

export function InstitutionInterventions() {
  const [activeTab, setActiveTab] = useState<'recommended' | 'history'>('recommended');
  const [actingId, setActingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Fetch Recommended Interventions
  const { 
    data: recommendations = [], 
    isLoading: loadingRecs, 
    error: recsError,
    refetch: refetchRecs 
  } = useQuery<RecommendedIntervention[]>({
    queryKey: ['institution', 'interventions', 'recommended'],
    queryFn: async () => {
      return await apiClient.get<RecommendedIntervention[]>('/institution/interventions/recommended');
    }
  });

  // 2. Fetch History
  const { 
    data: history = [], 
    isLoading: loadingHistory, 
    error: historyError,
    refetch: refetchHistory 
  } = useQuery<InterventionHistoryItem[]>({
    queryKey: ['institution', 'interventions', 'history'],
    queryFn: async () => {
      return await apiClient.get<InterventionHistoryItem[]>('/institution/interventions/history');
    }
  });

  // 3. Act on Intervention Mutation
  const actMutation = useApiMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return await apiClient.post(`/institution/interventions/${id}/act`, payload);
    },
    invalidateQueries: [
      ['institution', 'interventions', 'recommended'],
      ['institution', 'interventions', 'history'],
      ['academician', 'collaborations']
    ],
    onSuccess: (data: any) => {
      setActingId(null);
      setFeedback({ 
        type: 'success', 
        message: data?.message || 'Intervention action initiated successfully! Collaboration draft created and logged.' 
      });
      setTimeout(() => setFeedback(null), 5000);
    },
    onError: (err: any) => {
      setActingId(null);
      setFeedback({ type: 'error', message: err?.message || 'Failed to trigger intervention.' });
    }
  });

  const handleAct = (item: RecommendedIntervention, mode: 'collaboration' | 'notification', collabType?: string) => {
    const actKey = `${item.skill}_${mode}_${collabType || ''}`;
    setActingId(actKey);

    actMutation.mutate({
      id: encodeURIComponent(item.skill),
      payload: {
        insight: item.insight,
        action: item.action,
        mode: mode,
        proposed_collaboration_type: collabType || item.suggested_collaboration_type || 'fdp'
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Interventions</h1>
        <p className="text-sm text-slate mt-1">Data-driven recommendations to improve student placement readiness.</p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-sm border flex items-center gap-2 text-sm ${
          feedback.type === 'success' 
            ? 'bg-growth-teal/10 border-growth-teal/30 text-growth-teal' 
            : 'bg-alert-rust/10 border-alert-rust/30 text-alert-rust'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      <div className="flex border-b border-hairline mb-6">
        <button
          onClick={() => setActiveTab('recommended')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-colors relative",
            activeTab === 'recommended' ? "text-ink" : "text-slate hover:text-ink"
          )}
        >
          Recommended Actions ({recommendations.length})
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
          Impact History ({history.length})
          {activeTab === 'history' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-ink"></div>
          )}
        </button>
      </div>

      {activeTab === 'recommended' && (
        <div className="space-y-6">
          {loadingRecs ? (
            <div className="bg-white p-12 border border-hairline rounded-sm flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-growth-teal animate-spin" />
              <p className="text-sm text-slate">Computing recommended institutional interventions...</p>
            </div>
          ) : recsError ? (
            <div className="bg-alert-rust/10 border border-alert-rust/20 rounded-sm p-4 text-alert-rust text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Failed to load recommendations: {(recsError as any)?.message || 'Network error'}</span>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="bg-white border border-hairline rounded-sm p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-growth-teal mx-auto mb-3" />
              <h3 className="font-bold text-ink">Institutional Skill Alignment Healthy</h3>
              <p className="text-sm text-slate mt-1 max-w-md mx-auto">
                All tracked competencies currently meet target employer demand thresholds. Check back as new cohort assessments roll in.
              </p>
            </div>
          ) : (
            recommendations.map((item, idx) => {
              const collabKey = `${item.skill}_collaboration_fdp`;
              const notifyKey = `${item.skill}_notification_`;
              const isCollabPending = actMutation.isPending && actingId === collabKey;
              const isNotifyPending = actMutation.isPending && actingId === notifyKey;

              return (
                <div key={idx} className="bg-white border-2 border-alert-rust/20 rounded-sm p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-alert-rust/10 p-2 rounded-sm text-alert-rust">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-ink text-lg">{item.skill} Competency Gap</h3>
                          <p className="text-sm text-slate mt-1 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-growth-teal" /> High Priority Curriculum Intervention
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-paper p-4 border border-hairline rounded-sm">
                        <span className="text-xs text-slate font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Target className="h-3 w-3" /> The Insight
                        </span>
                        <p className="text-sm text-ink font-medium">
                          {item.insight}
                        </p>
                      </div>
                    </div>

                    <div className="w-full md:w-64 bg-slate/5 p-4 rounded-sm border border-slate/10 space-y-3 shrink-0">
                      <h4 className="text-xs font-bold text-slate uppercase tracking-wider">Suggested Actions</h4>
                      
                      <button 
                        onClick={() => handleAct(item, 'collaboration', 'fdp')}
                        disabled={actMutation.isPending}
                        className="w-full bg-ink text-paper py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                      >
                        {isCollabPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Initiating...
                          </>
                        ) : (
                          <>
                            <Briefcase className="h-4 w-4" /> Propose Faculty FDP
                          </>
                        )}
                      </button>

                      <button 
                        onClick={() => handleAct(item, 'collaboration', 'guest_lecture')}
                        disabled={actMutation.isPending}
                        className="w-full bg-white border border-ink text-ink py-2 rounded-sm text-sm font-bold hover:bg-slate/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isNotifyPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Initiating...
                          </>
                        ) : (
                          <>
                            <Briefcase className="h-4 w-4" /> Propose Guest Lecture
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          {loadingHistory ? (
            <div className="bg-white p-12 border border-hairline rounded-sm flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-growth-teal animate-spin" />
              <p className="text-sm text-slate">Loading intervention log...</p>
            </div>
          ) : historyError ? (
            <div className="bg-alert-rust/10 border border-alert-rust/20 rounded-sm p-4 text-alert-rust text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Failed to load history: {(historyError as any)?.message || 'Network error'}</span>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white border border-hairline rounded-sm p-12 text-center">
              <History className="h-10 w-10 text-slate mx-auto mb-3 opacity-50" />
              <h3 className="font-bold text-ink">No Recorded Interventions</h3>
              <p className="text-sm text-slate mt-1 max-w-md mx-auto">
                Actions initiated from the Recommended Actions tab will be recorded here for longitudinal impact analysis.
              </p>
            </div>
          ) : (
            history.map((h) => (
              <div key={h.intervention_id} className="bg-white border border-hairline rounded-sm p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-ink text-lg capitalize">{h.action_type} Intervention</h3>
                    <p className="text-xs text-slate mt-0.5">
                      Initiated on {new Date(h.created_at).toLocaleDateString()} at {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="bg-growth-teal/10 text-growth-teal px-3 py-1 rounded-sm text-xs font-bold flex items-center gap-2 border border-growth-teal/20">
                    <CheckCircle2 className="h-4 w-4" /> Active in Progress
                  </span>
                </div>

                <div className="bg-slate/5 p-4 rounded-sm border border-slate/10">
                  <p className="text-sm text-ink font-medium">
                    <strong>Action Details:</strong> {h.notes}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
