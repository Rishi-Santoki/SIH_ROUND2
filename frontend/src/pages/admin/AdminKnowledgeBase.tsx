import React, { useState } from 'react';
import { Search, Plus, BookOpen, Edit2, Trash2, Filter, FolderOpen, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

const MOCK_ARTICLES = [
  { id: 'kb-1', title: 'How Skill Verification Works', category: 'Platform Guide', author: 'System Admin', views: 4520, status: 'published', updated: '2026-08-28' },
  { id: 'kb-2', title: 'Matching Algorithm Explained', category: 'Technical', author: 'System Admin', views: 2180, status: 'published', updated: '2026-09-01' },
  { id: 'kb-3', title: 'Industry Partner Onboarding', category: 'Onboarding', author: 'Ops Team', views: 1340, status: 'published', updated: '2026-08-15' },
  { id: 'kb-4', title: 'Assessment Best Practices', category: 'Platform Guide', author: 'Ops Team', views: 890, status: 'draft', updated: '2026-09-03' },
  { id: 'kb-5', title: 'Data Privacy & DPDP Compliance', category: 'Legal', author: 'Legal Team', views: 3200, status: 'published', updated: '2026-07-20' },
  { id: 'kb-6', title: 'Student Roadmap FAQ', category: 'FAQ', author: 'System Admin', views: 5600, status: 'published', updated: '2026-08-10' },
];

const CATEGORIES = ['All', 'Platform Guide', 'Technical', 'Onboarding', 'Legal', 'FAQ'];

export function AdminKnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [articles] = useState(MOCK_ARTICLES);

  const filtered = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || a.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink flex items-center gap-2">
            <BookOpen className="h-6 w-6" /> Knowledge Base
          </h1>
          <p className="text-sm text-slate mt-1">Manage platform documentation, FAQs, and help articles.</p>
        </div>
        <button className="bg-ink text-white px-4 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> New Article
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Total Articles</span>
          <div className="text-2xl font-serif font-bold text-ink mt-1">{articles.length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Published</span>
          <div className="text-2xl font-serif font-bold text-growth-teal mt-1">{articles.filter(a => a.status === 'published').length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Total Views</span>
          <div className="text-2xl font-serif font-bold text-ink mt-1">{articles.reduce((sum, a) => sum + a.views, 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-sm text-xs font-bold tracking-wider transition-colors border",
                activeCategory === cat
                  ? "bg-ink text-white border-ink"
                  : "bg-white text-slate border-hairline hover:bg-slate/5"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-paper border-b border-hairline">
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Article</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Category</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Author</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Views</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Updated</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline text-sm">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-slate/5 transition-colors">
                <td className="p-4 font-bold text-ink flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate flex-shrink-0" /> {a.title}
                </td>
                <td className="p-4">
                  <span className="flex items-center gap-1 text-slate">
                    <FolderOpen className="h-3 w-3" /> {a.category}
                  </span>
                </td>
                <td className="p-4 text-slate">{a.author}</td>
                <td className="p-4 text-ink font-bold">{a.views.toLocaleString()}</td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-sm text-xs font-bold tracking-wider",
                    a.status === 'published' ? "bg-growth-teal/10 text-growth-teal border border-growth-teal/20" :
                    "bg-slate/10 text-slate border border-slate/20"
                  )}>
                    {a.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-slate">{a.updated}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button className="p-1.5 text-slate hover:text-ink transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
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
