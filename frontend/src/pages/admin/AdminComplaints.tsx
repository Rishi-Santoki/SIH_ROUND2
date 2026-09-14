import React, { useState } from 'react';
import { Search, MessageSquareWarning, Eye, CheckCircle, Filter, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

const MOCK_COMPLAINTS = [
  { id: 'c-1', subject: 'Inappropriate job posting content', from: 'student@nit.edu', against: 'TechRecruit Ltd.', category: 'Content Violation', status: 'open', severity: 'high', date: '2026-09-04' },
  { id: 'c-2', subject: 'Skill verification rejected incorrectly', from: 'ravi.k@gmail.com', against: 'System', category: 'Verification', status: 'in-progress', severity: 'medium', date: '2026-09-03' },
  { id: 'c-3', subject: 'Misleading company profile', from: 'anita@iit.ac.in', against: 'FakeStartup Inc.', category: 'Fraud', status: 'open', severity: 'high', date: '2026-09-02' },
  { id: 'c-4', subject: 'Assessment timer glitch', from: 'priya@nit.edu', against: 'System', category: 'Technical', status: 'resolved', severity: 'low', date: '2026-08-30' },
  { id: 'c-5', subject: 'Discriminatory job requirement', from: 'amit@student.edu', against: 'OldSchool Corp.', category: 'Content Violation', status: 'open', severity: 'high', date: '2026-09-04' },
];

export function AdminComplaints() {
  const [searchQuery, setSearchQuery] = useState('');
  const [complaints] = useState(MOCK_COMPLAINTS);

  const filtered = complaints.filter(c =>
    c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.against.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink flex items-center gap-2">
            <MessageSquareWarning className="h-6 w-6" /> Complaint Management
          </h1>
          <p className="text-sm text-slate mt-1">Review and resolve user-submitted complaints and reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Total</span>
          <div className="text-2xl font-serif font-bold text-ink mt-1">{complaints.length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Open</span>
          <div className="text-2xl font-serif font-bold text-alert-rust mt-1">{complaints.filter(c => c.status === 'open').length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">In Progress</span>
          <div className="text-2xl font-serif font-bold text-warning-gold mt-1">{complaints.filter(c => c.status === 'in-progress').length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Resolved</span>
          <div className="text-2xl font-serif font-bold text-growth-teal mt-1">{complaints.filter(c => c.status === 'resolved').length}</div>
        </div>
      </div>

      <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
          <input
            type="text"
            placeholder="Search complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink transition-colors"
          />
        </div>
        <button className="bg-white border border-hairline text-slate p-2 rounded-sm hover:bg-slate/5 transition-colors">
          <Filter className="h-4 w-4" />
        </button>
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-paper border-b border-hairline">
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Subject</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">From</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Against</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Category</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Severity</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline text-sm">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate/5 transition-colors">
                <td className="p-4 font-bold text-ink max-w-[250px] truncate" title={c.subject}>{c.subject}</td>
                <td className="p-4 text-slate text-xs font-mono">{c.from}</td>
                <td className="p-4 text-slate">{c.against}</td>
                <td className="p-4 text-slate">{c.category}</td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-sm text-xs font-bold tracking-wider",
                    c.severity === 'high' ? "bg-alert-rust/10 text-alert-rust border border-alert-rust/20" :
                    c.severity === 'medium' ? "bg-warning-gold/10 text-warning-gold border border-warning-gold/20" :
                    "bg-slate/10 text-slate border border-slate/20"
                  )}>
                    {c.severity.toUpperCase()}
                  </span>
                </td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-sm text-xs font-bold tracking-wider",
                    c.status === 'open' ? "bg-alert-rust/10 text-alert-rust border border-alert-rust/20" :
                    c.status === 'in-progress' ? "bg-warning-gold/10 text-warning-gold border border-warning-gold/20" :
                    "bg-growth-teal/10 text-growth-teal border border-growth-teal/20"
                  )}>
                    {c.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button className="p-1.5 text-slate hover:text-ink transition-colors"><Eye className="h-3.5 w-3.5" /></button>
                    <button className="p-1.5 text-slate hover:text-growth-teal transition-colors"><CheckCircle className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
