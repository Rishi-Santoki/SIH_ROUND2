import React from 'react';
import { Briefcase, Building, ExternalLink, MapPin } from 'lucide-react';

const MOCK_COMPANIES = [
  { id: 'c1', name: 'TechCorp Solutions', location: 'Bangalore, KA', applications: 145, placements: 12, collaborations: 2, status: 'Active' },
  { id: 'c2', name: 'Global Systems Inc.', location: 'Hyderabad, TS', applications: 89, placements: 5, collaborations: 1, status: 'Active' },
  { id: 'c3', name: 'NextGen Innovators', location: 'Pune, MH', applications: 230, placements: 28, collaborations: 4, status: 'Highly Engaged' },
  { id: 'c4', name: 'DataFlow Dynamics', location: 'Chennai, TN', applications: 45, placements: 0, collaborations: 0, status: 'New' },
];

export function InstitutionIndustry() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Industry Connections</h1>
          <p className="text-sm text-slate mt-1">Track engagement metrics with verified industry partners.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white p-5 border border-hairline rounded-sm shadow-sm">
           <div className="text-3xl font-bold text-ink mb-1">124</div>
           <div className="text-sm font-bold text-slate">Total Partners</div>
         </div>
         <div className="bg-white p-5 border border-hairline rounded-sm shadow-sm">
           <div className="text-3xl font-bold text-ink mb-1">845</div>
           <div className="text-sm font-bold text-slate">Active Applications</div>
         </div>
         <div className="bg-white p-5 border border-hairline rounded-sm shadow-sm">
           <div className="text-3xl font-bold text-growth-teal mb-1">15</div>
           <div className="text-sm font-bold text-slate">Ongoing Collaborations</div>
         </div>
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-paper border-b border-hairline">
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Company</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider text-center">Applications Sent</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider text-center">Students Placed</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider text-center">Collaborations</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {MOCK_COMPANIES.map((company) => (
              <tr key={company.id} className="hover:bg-slate/5 transition-colors group cursor-pointer">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate/10 rounded-sm flex items-center justify-center text-slate">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-ink flex items-center gap-2">
                        {company.name} <ExternalLink className="h-3 w-3 text-slate opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-xs text-slate flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {company.location}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center text-sm font-bold text-ink">{company.applications}</td>
                <td className="p-4 text-center text-sm font-bold text-growth-teal">{company.placements}</td>
                <td className="p-4 text-center text-sm text-slate">{company.collaborations}</td>
                <td className="p-4">
                  <span className="bg-slate/10 text-slate px-2 py-1 rounded-sm text-xs font-bold">
                    {company.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
