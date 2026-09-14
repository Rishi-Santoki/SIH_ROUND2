import React, { useState } from 'react';
import { Settings, Save, Shield, Bell, Globe, Database, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');

  const TABS = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
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
          <p className="text-sm text-slate mt-1">Configure platform-wide settings, security policies, and integrations.</p>
        </div>
        <button className="bg-ink text-white px-4 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors flex items-center gap-2 shadow-sm">
          <Save className="h-4 w-4" /> Save Changes
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

      {activeTab === 'general' && (
        <div className="bg-white border border-hairline rounded-sm shadow-sm p-6 space-y-6">
          <h3 className="font-bold text-ink text-sm uppercase tracking-wider">General Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-ink mb-1">Platform Name</label>
              <input type="text" defaultValue="SIH SkillBridge" className="w-full px-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-bold text-ink mb-1">Support Email</label>
              <input type="email" defaultValue="support@skillbridge.gov.in" className="w-full px-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-bold text-ink mb-1">Default Language</label>
              <select className="w-full px-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink appearance-none">
                <option>English</option>
                <option>Hindi</option>
                <option>Tamil</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-ink mb-1">Timezone</label>
              <select className="w-full px-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink appearance-none">
                <option>Asia/Kolkata (IST)</option>
                <option>UTC</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-ink mb-1">Maintenance Mode</label>
            <div className="flex items-center gap-3">
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate/20 transition-colors">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform translate-x-1" />
              </button>
              <span className="text-sm text-slate">Disabled — platform is live</span>
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
                <p className="text-xs text-slate mt-0.5">Require two-factor authentication for all admin users.</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-growth-teal transition-colors">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform translate-x-6" />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-paper border border-hairline rounded-sm">
              <div>
                <p className="text-sm font-bold text-ink">Session Timeout (minutes)</p>
                <p className="text-xs text-slate mt-0.5">Auto-logout idle users after this duration.</p>
              </div>
              <input type="number" defaultValue={30} className="w-20 px-3 py-1.5 bg-white border border-hairline rounded-sm text-sm text-right focus:outline-none focus:border-ink" />
            </div>
            <div className="flex items-center justify-between p-4 bg-paper border border-hairline rounded-sm">
              <div>
                <p className="text-sm font-bold text-ink">Rate Limiting</p>
                <p className="text-xs text-slate mt-0.5">Max API requests per user per minute.</p>
              </div>
              <input type="number" defaultValue={100} className="w-20 px-3 py-1.5 bg-white border border-hairline rounded-sm text-sm text-right focus:outline-none focus:border-ink" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-white border border-hairline rounded-sm shadow-sm p-6 space-y-6">
          <h3 className="font-bold text-ink text-sm uppercase tracking-wider">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { label: 'New user registration alerts', enabled: true },
              { label: 'Company verification requests', enabled: true },
              { label: 'Complaint escalation notifications', enabled: true },
              { label: 'Weekly analytics digest', enabled: false },
              { label: 'System health warnings', enabled: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-paper border border-hairline rounded-sm">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate" />
                  <span className="text-sm font-bold text-ink">{item.label}</span>
                </div>
                <button className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  item.enabled ? "bg-growth-teal" : "bg-slate/20"
                )}>
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                    item.enabled ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="bg-white border border-hairline rounded-sm shadow-sm p-6 space-y-6">
          <h3 className="font-bold text-ink text-sm uppercase tracking-wider">External Integrations</h3>
          <div className="space-y-4">
            {[
              { name: 'MCA Company Verification API', status: 'connected', description: 'Auto-verify companies via Ministry of Corporate Affairs.' },
              { name: 'DigiLocker Integration', status: 'connected', description: 'Verify academic certificates and credentials.' },
              { name: 'SMTP Email Service', status: 'connected', description: 'Transactional email delivery.' },
              { name: 'LinkedIn OAuth', status: 'disconnected', description: 'Allow sign-in and profile import from LinkedIn.' },
            ].map((integration, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-paper border border-hairline rounded-sm">
                <div>
                  <p className="text-sm font-bold text-ink">{integration.name}</p>
                  <p className="text-xs text-slate mt-0.5">{integration.description}</p>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-sm text-xs font-bold tracking-wider",
                  integration.status === 'connected' ? "bg-growth-teal/10 text-growth-teal border border-growth-teal/20" :
                  "bg-slate/10 text-slate border border-slate/20"
                )}>
                  {integration.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
