import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Bell, Globe, Database, Mail, Loader2, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

interface SettingItem {
  setting_key: string;
  setting_value: any;
  updated_at?: string;
}

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');

  // Form state
  const [atRiskThreshold, setAtRiskThreshold] = useState<number>(40);
  const [assessmentDuration, setAssessmentDuration] = useState<number>(60);
  const [evidenceRateFlag, setEvidenceRateFlag] = useState<number>(50);

  const { data: settings = [], isLoading, isError, refetch } = useQuery<SettingItem[]>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      return await apiClient.get<SettingItem[]>('/admin/settings');
    }
  });

  useEffect(() => {
    if (settings.length > 0) {
      settings.forEach(s => {
        if (s.setting_key === 'readiness_at_risk_threshold') {
          setAtRiskThreshold(typeof s.setting_value === 'number' ? s.setting_value : Number(s.setting_value) || 40);
        } else if (s.setting_key === 'default_assessment_duration_minutes') {
          setAssessmentDuration(typeof s.setting_value === 'number' ? s.setting_value : Number(s.setting_value) || 60);
        } else if (s.setting_key === 'min_verified_evidence_rate_flag') {
          setEvidenceRateFlag(typeof s.setting_value === 'number' ? s.setting_value : Number(s.setting_value) || 50);
        }
      });
    }
  }, [settings]);

  const updateSettingMutation = useApiMutation(
    async ({ key, value }: { key: string; value: any }) => {
      return await apiClient.patch(`/admin/settings/${key}`, { setting_value: value });
    },
    {
      successMessage: 'Platform settings saved successfully.',
      invalidateQueries: [['admin-settings']],
    }
  );

  const handleSave = async () => {
    await updateSettingMutation.mutateAsync({
      key: 'readiness_at_risk_threshold',
      value: atRiskThreshold
    });
    await updateSettingMutation.mutateAsync({
      key: 'default_assessment_duration_minutes',
      value: assessmentDuration
    });
    await updateSettingMutation.mutateAsync({
      key: 'min_verified_evidence_rate_flag',
      value: evidenceRateFlag
    });
  };

  const TABS = [
    { id: 'general', label: 'General & Thresholds', icon: Globe },
    { id: 'security', label: 'Security Policies', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Database },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink flex items-center gap-2">
            <Settings className="h-6 w-6" /> Platform Settings
          </h1>
          <p className="text-sm text-slate mt-1">Configure platform-wide settings, AI scoring benchmarks, and thresholds.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={updateSettingMutation.isPending}
          className="bg-ink text-white px-4 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          {updateSettingMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Save Changes
            </>
          )}
        </button>
      </div>

      <div className="flex gap-2 border-b border-hairline">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors -mb-px",
              activeTab === tab.id
                ? "border-ink text-ink"
                : "border-transparent text-slate hover:text-ink"
            )}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-white border border-hairline rounded-sm p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-ink mb-3" />
          <span className="text-sm text-slate">Loading platform settings...</span>
        </div>
      ) : isError ? (
        <div className="bg-alert-rust/5 border border-alert-rust/30 p-8 rounded-sm text-center">
          <p className="text-sm font-bold text-alert-rust">Failed to load platform settings.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 text-xs font-bold bg-alert-rust text-white px-3 py-1.5 rounded-sm hover:bg-alert-rust/90 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'general' && (
            <div className="bg-white border border-hairline rounded-sm shadow-sm p-6 space-y-6">
              <h3 className="font-bold text-ink text-sm uppercase tracking-wider">Engine Benchmarks & Thresholds</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-ink mb-1">At-Risk Readiness Threshold (%)</label>
                  <p className="text-xs text-slate mb-2">Students below this readiness score will trigger institutional intervention alerts.</p>
                  <input 
                    type="number"
                    min="1"
                    max="100"
                    value={atRiskThreshold}
                    onChange={(e) => setAtRiskThreshold(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink transition-colors font-bold text-ink" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-ink mb-1">Default Assessment Duration (Minutes)</label>
                  <p className="text-xs text-slate mb-2">Default countdown timer allocated for standard platform skill assessments.</p>
                  <input 
                    type="number"
                    min="10"
                    max="240"
                    value={assessmentDuration}
                    onChange={(e) => setAssessmentDuration(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink transition-colors font-bold text-ink" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-ink mb-1">Min. Verified Evidence Flag (%)</label>
                  <p className="text-xs text-slate mb-2">Minimum verified evidence score expected before candidates can apply to premium tier jobs.</p>
                  <input 
                    type="number"
                    min="1"
                    max="100"
                    value={evidenceRateFlag}
                    onChange={(e) => setEvidenceRateFlag(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink transition-colors font-bold text-ink" 
                  />
                </div>
              </div>

              <div className="border-t border-hairline pt-6">
                <h4 className="text-xs font-bold text-slate uppercase tracking-wider mb-3">Live Platform Setting Values (DB Key-Value)</h4>
                <div className="space-y-2">
                  {settings.map(s => (
                    <div key={s.setting_key} className="flex justify-between items-center p-2.5 bg-paper rounded-sm border border-hairline text-xs">
                      <span className="font-mono font-bold text-ink">{s.setting_key}</span>
                      <span className="font-mono text-slate bg-white px-2 py-0.5 rounded border border-hairline">
                        {typeof s.setting_value === 'object' ? JSON.stringify(s.setting_value) : String(s.setting_value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white border border-hairline rounded-sm shadow-sm p-6 space-y-6">
              <h3 className="font-bold text-ink text-sm uppercase tracking-wider">Security Policies</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-paper border border-hairline rounded-sm">
                  <div>
                    <p className="text-sm font-bold text-ink">Enforce 2FA for Admin Accounts</p>
                    <p className="text-xs text-slate mt-0.5">Require two-factor authentication for all administrative logins.</p>
                  </div>
                  <span className="text-xs font-bold bg-growth-teal/10 text-growth-teal px-2 py-1 rounded border border-growth-teal/20 uppercase">
                    Enforced
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-paper border border-hairline rounded-sm">
                  <div>
                    <p className="text-sm font-bold text-ink">Session Inactivity Timeout</p>
                    <p className="text-xs text-slate mt-0.5">Auto-logout idle sessions after 60 minutes.</p>
                  </div>
                  <span className="text-xs font-bold text-slate bg-white px-2 py-1 rounded border border-hairline">
                    60 mins
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white border border-hairline rounded-sm shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-ink text-sm uppercase tracking-wider">Notification Preferences</h3>
              <p className="text-sm text-slate">Administrative alert dispatches are routed automatically based on incident priority and audit logs.</p>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="bg-white border border-hairline rounded-sm shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-ink text-sm uppercase tracking-wider">External Integrations</h3>
              <div className="space-y-3">
                <div className="p-3 bg-paper border border-hairline rounded-sm flex justify-between items-center">
                  <div>
                    <div className="font-bold text-ink text-sm">Supabase PostgreSQL & Auth</div>
                    <div className="text-xs text-slate">Trust Layer DB and JWT session validation</div>
                  </div>
                  <span className="text-xs font-bold text-growth-teal bg-growth-teal/10 px-2 py-0.5 rounded border border-growth-teal/20">Connected</span>
                </div>
                <div className="p-3 bg-paper border border-hairline rounded-sm flex justify-between items-center">
                  <div>
                    <div className="font-bold text-ink text-sm">Gemini AI Engine</div>
                    <div className="text-xs text-slate">Autonomous recommendation copilot and matching signal tuning</div>
                  </div>
                  <span className="text-xs font-bold text-growth-teal bg-growth-teal/10 px-2 py-0.5 rounded border border-growth-teal/20">Active</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
