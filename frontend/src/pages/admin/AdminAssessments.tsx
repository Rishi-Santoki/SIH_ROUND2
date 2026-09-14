import React, { useState } from 'react';
import { Search, Plus, FileCheck, Eye, Trash2, Filter, BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';

const MOCK_ASSESSMENTS = [
  { id: 'a-1', title: 'React & TypeScript Proficiency', category: 'Frontend Development', questions: 40, attempts: 1240, avgScore: 72, status: 'active' },
  { id: 'a-2', title: 'Python Data Engineering', category: 'Data Science', questions: 35, attempts: 890, avgScore: 68, status: 'active' },
  { id: 'a-3', title: 'Cloud Architecture Fundamentals', category: 'Cloud Computing', questions: 50, attempts: 654, avgScore: 61, status: 'active' },
  { id: 'a-4', title: 'UI/UX Design Principles', category: 'Design', questions: 30, attempts: 432, avgScore: 78, status: 'draft' },
  { id: 'a-5', title: 'Cybersecurity Essentials', category: 'Security', questions: 45, attempts: 0, avgScore: 0, status: 'draft' },
  { id: 'a-6', title: 'Machine Learning Basics', category: 'Data Science', questions: 38, attempts: 1560, avgScore: 65, status: 'flagged' },
];

export function AdminAssessments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [assessments] = useState(MOCK_ASSESSMENTS);

  const filtered = assessments.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink flex items-center gap-2">
            <FileCheck className="h-6 w-6" /> Assessment Management
          </h1>
          <p className="text-sm text-slate mt-1">Create, review, and monitor platform-wide skill assessments.</p>
        </div>
        <button className="bg-ink text-white px-4 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Create Assessment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Total</span>
          <div className="text-2xl font-serif font-bold text-ink mt-1">{assessments.length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Active</span>
          <div className="text-2xl font-serif font-bold text-growth-teal mt-1">{assessments.filter(a => a.status === 'active').length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Drafts</span>
          <div className="text-2xl font-serif font-bold text-warning-gold mt-1">{assessments.filter(a => a.status === 'draft').length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Flagged</span>
          <div className="text-2xl font-serif font-bold text-alert-rust mt-1">{assessments.filter(a => a.status === 'flagged').length}</div>
        </div>
      </div>

      <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
          <input
            type="text"
            placeholder="Search assessments..."
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
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Assessment</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Category</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Questions</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Attempts</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Avg Score</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline text-sm">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-slate/5 transition-colors">
                <td className="p-4 font-bold text-ink">{a.title}</td>
                <td className="p-4 text-slate">{a.category}</td>
                <td className="p-4 text-ink font-bold">{a.questions}</td>
                <td className="p-4 text-slate">{a.attempts.toLocaleString()}</td>
                <td className="p-4">
                  <span className={cn("font-bold", a.avgScore >= 70 ? "text-growth-teal" : a.avgScore >= 50 ? "text-warning-gold" : "text-alert-rust")}>
                    {a.avgScore > 0 ? `${a.avgScore}%` : '—'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-sm text-xs font-bold tracking-wider",
                    a.status === 'active' ? "bg-growth-teal/10 text-growth-teal border border-growth-teal/20" :
                    a.status === 'flagged' ? "bg-alert-rust/10 text-alert-rust border border-alert-rust/20" :
                    "bg-slate/10 text-slate border border-slate/20"
                  )}>
                    {a.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button className="p-1.5 text-slate hover:text-ink transition-colors"><Eye className="h-3.5 w-3.5" /></button>
                    <button className="p-1.5 text-slate hover:text-ink transition-colors"><BarChart3 className="h-3.5 w-3.5" /></button>
                    <button className="p-1.5 text-slate hover:text-alert-rust transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
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
