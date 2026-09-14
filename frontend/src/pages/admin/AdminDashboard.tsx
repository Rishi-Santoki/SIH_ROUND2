import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Users, Building2, GraduationCap, ShieldCheck, FileCheck, Layers } from 'lucide-react';

const GROWTH_DATA = [
  { month: 'Jan', users: 1200, companies: 45, verifications: 800 },
  { month: 'Feb', users: 1800, companies: 62, verifications: 1200 },
  { month: 'Mar', users: 2400, companies: 85, verifications: 1850 },
  { month: 'Apr', users: 3100, companies: 112, verifications: 2600 },
  { month: 'May', users: 4200, companies: 145, verifications: 3800 },
  { month: 'Jun', users: 5800, companies: 180, verifications: 5200 },
];

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Platform Overview</h1>
          <p className="text-sm text-slate mt-1">System-wide metrics and growth tracking.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate uppercase tracking-wider">Total Users</span>
            <Users className="h-4 w-4 text-slate" />
          </div>
          <div className="text-2xl font-serif font-bold text-ink">24,582</div>
          <div className="text-xs text-growth-teal font-bold mt-1">+12% this month</div>
        </div>

        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate uppercase tracking-wider">Institutions</span>
            <Building2 className="h-4 w-4 text-slate" />
          </div>
          <div className="text-2xl font-serif font-bold text-ink">45</div>
          <div className="text-xs text-slate mt-1">2 pending review</div>
        </div>

        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate uppercase tracking-wider">Companies</span>
            <BriefcaseIcon className="h-4 w-4 text-slate" />
          </div>
          <div className="text-2xl font-serif font-bold text-ink">342</div>
          <div className="text-xs text-alert-rust font-bold mt-1">12 pending verification</div>
        </div>

        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate uppercase tracking-wider">Verifications</span>
            <ShieldCheck className="h-4 w-4 text-warning-gold" />
          </div>
          <div className="text-2xl font-serif font-bold text-ink">142K</div>
          <div className="text-xs text-slate mt-1">Proofs processed</div>
        </div>

        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate uppercase tracking-wider">Assessments</span>
            <FileCheck className="h-4 w-4 text-slate" />
          </div>
          <div className="text-2xl font-serif font-bold text-ink">1,204</div>
          <div className="text-xs text-alert-rust font-bold mt-1">5 flagged</div>
        </div>

        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate uppercase tracking-wider">Postings</span>
            <Layers className="h-4 w-4 text-slate" />
          </div>
          <div className="text-2xl font-serif font-bold text-ink">8,450</div>
          <div className="text-xs text-slate mt-1">Active opportunities</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 border border-hairline rounded-sm shadow-sm">
          <h3 className="font-bold text-ink mb-6 text-sm uppercase tracking-wider">Growth Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={GROWTH_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="users" name="Active Users" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="verifications" name="Verifications" stroke="#facc15" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 border border-hairline rounded-sm shadow-sm flex flex-col">
          <h3 className="font-bold text-ink mb-6 text-sm uppercase tracking-wider">System Health</h3>
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate">API Uptime</span>
                <span className="font-bold text-growth-teal">99.98%</span>
              </div>
              <div className="w-full bg-paper rounded-full h-1.5"><div className="bg-growth-teal h-1.5 rounded-full" style={{ width: '99.98%' }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate">Verification Queue SLA</span>
                <span className="font-bold text-warning-gold">85% &lt; 24h</span>
              </div>
              <div className="w-full bg-paper rounded-full h-1.5"><div className="bg-warning-gold h-1.5 rounded-full" style={{ width: '85%' }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate">Matching Engine Load</span>
                <span className="font-bold text-ink">42%</span>
              </div>
              <div className="w-full bg-paper rounded-full h-1.5"><div className="bg-ink h-1.5 rounded-full" style={{ width: '42%' }}></div></div>
            </div>
            
            <div className="mt-8 p-4 bg-slate/5 border border-hairline rounded-sm">
               <h4 className="font-bold text-ink text-sm mb-2">Pending Actions</h4>
               <ul className="space-y-2 text-sm text-slate">
                 <li className="flex justify-between"><a href="/admin/verifications" className="hover:text-ink underline">Company Verifications</a> <span className="font-bold text-alert-rust">12</span></li>
                 <li className="flex justify-between"><a href="/admin/complaints" className="hover:text-ink underline">Open Complaints</a> <span className="font-bold text-ink">8</span></li>
                 <li className="flex justify-between"><a href="/admin/matching" className="hover:text-ink underline">Weight Proposals</a> <span className="font-bold text-ink">2</span></li>
               </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BriefcaseIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
}
