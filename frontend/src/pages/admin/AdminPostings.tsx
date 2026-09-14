import React, { useState } from 'react';
import { Search, Layers, Eye, Trash2, Filter, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const MOCK_POSTINGS = [
  { id: 'p-1', title: 'SDE-2 Backend Engineer', company: 'TechCorp Solutions', type: 'Full-time', applicants: 142, status: 'active', posted: '2026-08-28' },
  { id: 'p-2', title: 'Data Science Intern', company: 'DataMinds AI', type: 'Internship', applicants: 89, status: 'active', posted: '2026-09-01' },
  { id: 'p-3', title: 'Product Designer', company: 'DesignHub Studios', type: 'Full-time', applicants: 56, status: 'pending', posted: '2026-09-03' },
  { id: 'p-4', title: 'Cloud Engineer', company: 'CloudScale India', type: 'Full-time', applicants: 210, status: 'active', posted: '2026-08-15' },
  { id: 'p-5', title: 'Marketing Content Writer', company: 'BrandSpark', type: 'Contract', applicants: 34, status: 'flagged', posted: '2026-09-02' },
  { id: 'p-6', title: 'ML Research Fellow', company: 'IISC Bangalore', type: 'Research', applicants: 67, status: 'closed', posted: '2026-07-20' },
];

export function AdminPostings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [postings] = useState(MOCK_POSTINGS);

  const filtered = postings.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink flex items-center gap-2">
            <Layers className="h-6 w-6" /> Opportunity Postings
          </h1>
          <p className="text-sm text-slate mt-1">Review and moderate all job, internship, and research postings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Total Postings</span>
          <div className="text-2xl font-serif font-bold text-ink mt-1">{postings.length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Active</span>
          <div className="text-2xl font-serif font-bold text-growth-teal mt-1">{postings.filter(p => p.status === 'active').length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Pending Review</span>
          <div className="text-2xl font-serif font-bold text-warning-gold mt-1">{postings.filter(p => p.status === 'pending').length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Flagged</span>
          <div className="text-2xl font-serif font-bold text-alert-rust mt-1">{postings.filter(p => p.status === 'flagged').length}</div>
        </div>
      </div>

      <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
          <input
            type="text"
            placeholder="Search postings by title or company..."
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
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Title</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Company</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Type</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Applicants</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Posted</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline text-sm">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate/5 transition-colors">
                <td className="p-4 font-bold text-ink">{p.title}</td>
                <td className="p-4 text-slate">{p.company}</td>
                <td className="p-4 text-slate">{p.type}</td>
                <td className="p-4 text-ink font-bold">{p.applicants}</td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-sm text-xs font-bold tracking-wider",
                    p.status === 'active' ? "bg-growth-teal/10 text-growth-teal border border-growth-teal/20" :
                    p.status === 'pending' ? "bg-warning-gold/10 text-warning-gold border border-warning-gold/20" :
                    p.status === 'flagged' ? "bg-alert-rust/10 text-alert-rust border border-alert-rust/20" :
                    "bg-slate/10 text-slate border border-slate/20"
                  )}>
                    {p.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-slate">{p.posted}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button className="p-1.5 text-slate hover:text-ink transition-colors"><Eye className="h-3.5 w-3.5" /></button>
                    <button className="p-1.5 text-slate hover:text-growth-teal transition-colors"><CheckCircle className="h-3.5 w-3.5" /></button>
                    <button className="p-1.5 text-slate hover:text-alert-rust transition-colors"><XCircle className="h-3.5 w-3.5" /></button>
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
