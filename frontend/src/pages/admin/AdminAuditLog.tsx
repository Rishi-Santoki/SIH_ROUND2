import React, { useState } from 'react';
import { Search, Filter, History, Download, Calendar, User, ShieldAlert, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const MOCK_LOGS = [
  { id: 'log-1', timestamp: '2026-09-04 14:32:45', user: 'ops@platform.admin', action: 'TAXONOMY_MERGE', details: 'Merged s1-4 into s1-1. Target kept.', ip: '192.168.1.45', severity: 'high' },
  { id: 'log-2', timestamp: '2026-09-04 13:15:22', user: 'ops@platform.admin', action: 'WEIGHT_PROPOSAL_APPROVED', details: 'Approved proposal prop-1 (Software Engineering)', ip: '192.168.1.45', severity: 'medium' },
  { id: 'log-3', timestamp: '2026-09-04 11:05:10', user: 'anita@nit.edu', action: 'USER_LOGIN', details: 'Successful authentication', ip: '10.0.0.12', severity: 'low' },
  { id: 'log-4', timestamp: '2026-09-03 16:45:00', user: 'super@platform.admin', action: 'USER_SUSPENDED', details: 'Suspended u2 (Ravi Kumar). Reason: Violation of terms.', ip: '192.168.1.10', severity: 'high' },
  { id: 'log-5', timestamp: '2026-09-03 09:20:15', user: 'system', action: 'COMPANY_VERIFIED', details: 'Auto-verified TechCorp Solutions via MCA API', ip: 'internal', severity: 'info' },
];

export function AdminAuditLog() {
  const [logs] = useState(MOCK_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);

  const filteredLogs = logs.filter(l => 
    (l.user || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (l.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.details || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCsv = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch('/admin/audit-logs?format=csv');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.position = 'fixed';
        a.style.top = '-9999px';
        a.href = url;
        a.download = `system_audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try {
            if (document.body.contains(a)) document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          } catch {}
        }, 30000);
      } else {
        window.location.assign('/admin/audit-logs?format=csv');
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.warn('Fetch export fallback:', err);
      window.location.assign('/admin/audit-logs?format=csv');
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink flex items-center gap-2">
            <History className="h-6 w-6" /> System Audit Log
          </h1>
          <p className="text-sm text-slate mt-1">Immutable record of all administrative and system-level actions.</p>
        </div>
        <button 
          type="button"
          onClick={handleExportCsv}
          className={cn(
            "border border-hairline px-4 py-2 rounded-sm text-sm font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer select-none active:scale-95",
            exportSuccess 
              ? "bg-growth-teal/15 border-growth-teal text-growth-teal" 
              : "bg-white text-slate hover:bg-slate/5 hover:text-ink hover:border-slate"
          )}
          title="Export audit logs to CSV"
        >
          {exportSuccess ? (
            <>
              <Check className="h-4 w-4 text-growth-teal" /> Exported!
            </>
          ) : (
            <>
              <Download className="h-4 w-4" /> Export CSV
            </>
          )}
        </button>
      </div>

      <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
          <input
            type="text"
            placeholder="Search by user, action, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink transition-colors"
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
             <select className="w-full pl-10 pr-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink appearance-none">
               <option>Last 7 Days</option>
               <option>Last 30 Days</option>
               <option>This Year</option>
               <option>All Time</option>
             </select>
          </div>
          <button className="bg-white border border-hairline text-slate p-2 rounded-sm hover:bg-slate/5 transition-colors">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap md:whitespace-normal">
          <thead>
            <tr className="bg-paper border-b border-hairline">
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider w-48">Timestamp</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider w-48">User / Actor</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider w-48">Action Type</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Details</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider w-32">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline font-mono text-sm">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate/5 transition-colors">
                <td className="p-4 text-slate">{log.timestamp}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-slate" />
                    <span className="text-ink truncate max-w-[150px]" title={log.user}>{log.user}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-sm text-xs font-bold tracking-wider",
                    log.severity === 'high' ? "bg-alert-rust/10 text-alert-rust border border-alert-rust/20" :
                    log.severity === 'medium' ? "bg-warning-gold/10 text-warning-gold border border-warning-gold/20" :
                    log.severity === 'info' ? "bg-growth-teal/10 text-growth-teal border border-growth-teal/20" :
                    "bg-slate/10 text-slate border border-slate/20"
                  )}>
                    {log.action}
                  </span>
                </td>
                <td className="p-4 text-slate break-words whitespace-normal min-w-[300px]">
                  {log.severity === 'high' && <ShieldAlert className="inline h-3 w-3 text-alert-rust mr-1 -mt-0.5" />}
                  {log.details}
                </td>
                <td className="p-4 text-slate text-xs">{log.ip}</td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate font-sans">
                  No logs found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
