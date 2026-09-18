import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

export function InstitutionReports() {
  const [reportType, setReportType] = useState('Comprehensive AICTE Format');
  const [academicYear, setAcademicYear] = useState('2025 - 2026');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const exportMutation = useApiMutation({
    mutationFn: async () => {
      const csvText = await apiClient.get<string>('/institution/reports/summary?format=csv');
      if (!csvText || typeof csvText !== 'string') {
        throw new Error('No data received from report generation service.');
      }
      
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const sanitizedYear = academicYear.replace(/[^a-zA-Z0-9]/g, '_');
      link.setAttribute('download', `institution_master_report_${sanitizedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Report exported successfully! CSV download started.' });
      setTimeout(() => setFeedback(null), 5000);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err?.message || 'Failed to generate report export.' });
    }
  });

  const handleExportCsv = () => {
    exportMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Compliance & Custom Reports</h1>
          <p className="text-sm text-slate mt-1">Generate and export official institutional reports.</p>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-sm border flex items-center gap-2 text-sm ${
          feedback.type === 'success' 
            ? 'bg-growth-teal/10 border-growth-teal/30 text-growth-teal' 
            : 'bg-alert-rust/10 border-alert-rust/30 text-alert-rust'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      <div className="bg-white p-6 border border-hairline rounded-sm shadow-sm space-y-8">
        
        {/* Core Report Generator */}
        <div className="max-w-3xl space-y-6">
           <div>
             <h3 className="font-bold text-ink mb-2">Generate Master Report</h3>
             <p className="text-sm text-slate mb-4">Export the complete composed report including all student metrics, department comparisons, and active industry connections as requested by accreditation bodies.</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Report Type</label>
                  <select 
                    value={reportType} 
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink transition-colors font-medium"
                  >
                    <option>Comprehensive AICTE Format</option>
                    <option>Internal Department Review</option>
                    <option>Industry Partner Summary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Academic Year</label>
                  <select 
                    value={academicYear} 
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink transition-colors font-medium"
                  >
                    <option>2025 - 2026</option>
                    <option>2024 - 2025</option>
                  </select>
                </div>
             </div>
             
             <div className="flex gap-4">
               <button 
                 onClick={handleExportCsv}
                 disabled={exportMutation.isPending}
                 className="bg-ink text-paper px-6 py-2.5 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
               >
                 {exportMutation.isPending ? (
                   <>
                     <Loader2 className="h-4 w-4 animate-spin" /> Generating CSV...
                   </>
                 ) : (
                   <>
                     <Download className="h-4 w-4" /> Export as CSV
                   </>
                 )}
               </button>
               <button 
                 onClick={handleExportCsv}
                 className="bg-white border border-hairline text-ink px-6 py-2.5 rounded-sm text-sm font-bold hover:bg-slate/5 transition-colors flex items-center gap-2"
               >
                 <FileText className="h-4 w-4" /> Export as PDF
               </button>
             </div>
           </div>
        </div>
        
        <hr className="border-hairline" />
        
        {/* Recent Exports */}
        <div>
          <h3 className="font-bold text-ink mb-4">Recent Exports</h3>
          <div className="border border-hairline rounded-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-paper border-b border-hairline">
                  <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Report Name</th>
                  <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Generated By</th>
                  <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                <tr className="hover:bg-slate/5 transition-colors">
                  <td className="p-4 text-sm font-bold text-ink">Q1 2026 CS Dept Review</td>
                  <td className="p-4 text-sm text-slate">Admin User</td>
                  <td className="p-4 text-sm text-slate">Oct 12, 2026</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={handleExportCsv}
                      title="Download CSV" 
                      className="text-slate hover:text-ink transition-colors p-1"
                    >
                      <Download className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-slate/5 transition-colors">
                  <td className="p-4 text-sm font-bold text-ink">Annual AICTE Compliance 24-25</td>
                  <td className="p-4 text-sm text-slate">Admin User</td>
                  <td className="p-4 text-sm text-slate">Jun 01, 2025</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={handleExportCsv}
                      title="Download CSV" 
                      className="text-slate hover:text-ink transition-colors p-1"
                    >
                      <Download className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
