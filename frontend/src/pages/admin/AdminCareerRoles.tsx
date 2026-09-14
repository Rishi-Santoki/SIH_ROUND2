import React, { useState } from 'react';
import { Search, Plus, Briefcase, TrendingUp, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const MOCK_ROLES = [
  { id: 'cr-1', title: 'Full Stack Developer', sector: 'Information Technology', demandLevel: 'high', mappedSkills: 14, avgSalary: '₹8–18 LPA', openPositions: 342 },
  { id: 'cr-2', title: 'Data Scientist', sector: 'Information Technology', demandLevel: 'high', mappedSkills: 11, avgSalary: '₹10–25 LPA', openPositions: 218 },
  { id: 'cr-3', title: 'Mechanical Design Engineer', sector: 'Manufacturing', demandLevel: 'medium', mappedSkills: 9, avgSalary: '₹5–12 LPA', openPositions: 87 },
  { id: 'cr-4', title: 'Digital Marketing Manager', sector: 'Marketing', demandLevel: 'medium', mappedSkills: 12, avgSalary: '₹6–15 LPA', openPositions: 156 },
  { id: 'cr-5', title: 'Civil Site Engineer', sector: 'Construction', demandLevel: 'low', mappedSkills: 8, avgSalary: '₹4–9 LPA', openPositions: 45 },
  { id: 'cr-6', title: 'Cloud Solutions Architect', sector: 'Information Technology', demandLevel: 'high', mappedSkills: 16, avgSalary: '₹15–35 LPA', openPositions: 128 },
];

export function AdminCareerRoles() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roles] = useState(MOCK_ROLES);

  const filteredRoles = roles.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink flex items-center gap-2">
            <Briefcase className="h-6 w-6" /> Career Role Taxonomy
          </h1>
          <p className="text-sm text-slate mt-1">Define and manage career roles mapped to the national skills taxonomy.</p>
        </div>
        <button className="bg-ink text-white px-4 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Add Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Total Roles</span>
          <div className="text-2xl font-serif font-bold text-ink mt-1">{roles.length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">High Demand</span>
          <div className="text-2xl font-serif font-bold text-growth-teal mt-1">{roles.filter(r => r.demandLevel === 'high').length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Total Open Positions</span>
          <div className="text-2xl font-serif font-bold text-ink mt-1">{roles.reduce((sum, r) => sum + r.openPositions, 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
          <input
            type="text"
            placeholder="Search roles by title or sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink transition-colors"
          />
        </div>
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-paper border-b border-hairline">
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Role Title</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Sector</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Demand</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Mapped Skills</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Avg. Salary</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Open Positions</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline text-sm">
            {filteredRoles.map((role) => (
              <tr key={role.id} className="hover:bg-slate/5 transition-colors">
                <td className="p-4 font-bold text-ink">{role.title}</td>
                <td className="p-4 text-slate">{role.sector}</td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-sm text-xs font-bold tracking-wider",
                    role.demandLevel === 'high' ? "bg-growth-teal/10 text-growth-teal border border-growth-teal/20" :
                    role.demandLevel === 'medium' ? "bg-warning-gold/10 text-warning-gold border border-warning-gold/20" :
                    "bg-slate/10 text-slate border border-slate/20"
                  )}>
                    {role.demandLevel.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-ink font-bold">{role.mappedSkills}</td>
                <td className="p-4 text-slate">{role.avgSalary}</td>
                <td className="p-4 text-ink font-bold">{role.openPositions}</td>
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
