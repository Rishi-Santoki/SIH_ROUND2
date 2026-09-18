import React, { useState } from 'react';
import { ShieldCheck, Upload, AlertCircle, FileText, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ProofBadge } from '../../components/ui/ProofBadge';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

export function AlumniVerification() {
  const { data: verificationData, isLoading, error } = useQuery({
    queryKey: ['alumni-verification'],
    queryFn: () => apiClient.get<any>('/alumni/verification')
  });

  const [graduationYear, setGraduationYear] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [fileAttached, setFileAttached] = useState(false);

  const submitMutation = useApiMutation({
    mutationFn: (data: any) => apiClient.post('/alumni/verification', data),
    invalidateQueries: [['alumni-verification'], ['alumni-profile']],
    successMessage: 'Verification request submitted successfully!'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      graduation_year: graduationYear.trim() || undefined,
      roll_number: rollNumber.trim() || undefined,
      document_name: fileAttached ? 'degree_certificate.pdf' : undefined
    });
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate text-sm font-medium flex items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-ink" /> Loading verification status...
      </div>
    );
  }

  const isVerified = Boolean(verificationData?.is_verified || verificationData?.status === 'approved');
  const isPending = !isVerified && verificationData?.status === 'pending';

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Alumni Verification</h1>
        <p className="text-sm text-slate mt-1">Verify your degree to unlock network features.</p>
      </div>

      {submitMutation.isSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-growth-teal" /> Verification request submitted successfully. The institution's administration will review your details.
        </div>
      )}

      {submitMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 text-alert-rust rounded-sm text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {submitMutation.error?.message || 'Failed to submit verification request'}
        </div>
      )}

      <div className="bg-white border border-hairline rounded-sm shadow-sm p-8 flex items-start gap-6">
        <div className="pt-1">
          <ProofBadge status={isVerified ? 'verified' : 'unverified'} size="lg" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-ink mb-2">
            {isVerified ? 'Identity Verified' : 
             isPending ? 'Verification Under Review' : 
             'Not Yet Verified'}
          </h2>
          
          {isVerified && (
            <div className="space-y-3">
              <p className="text-sm text-slate">
                Your alumni status has been confirmed by the institution. Your profile is now visible to students and faculty, and they can send you messages.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-sm">
                <CheckCircle2 className="h-3.5 w-3.5" /> Institution Proof Ledger Verified
              </div>
            </div>
          )}

          {isPending && (
            <div className="space-y-4 text-sm text-slate">
              <p>
                Your verification documents have been submitted and are currently being reviewed by the institution's administration. 
              </p>
              <div className="flex items-center gap-2 bg-slate/5 p-3 rounded-sm border border-slate/10">
                <FileText className="h-4 w-4 text-ink" />
                <span className="font-bold text-ink">
                  {verificationData?.notes?.includes('Document:') 
                    ? verificationData.notes.split('Document:')[1].split('|')[0].trim() 
                    : 'degree_certificate.pdf'}
                </span>
                <span className="text-xs text-slate ml-auto">
                  {verificationData?.created_at ? new Date(verificationData.created_at).toLocaleDateString() : 'Submitted Today'}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-sm">
                <Clock className="h-3.5 w-3.5" /> Request In Progress — Awaiting Institution Approval
              </div>
              <p className="text-xs">
                This process usually takes 1-2 business days. There's nothing more you need to do right now.
              </p>
            </div>
          )}

          {!isVerified && !isPending && (
            <div className="space-y-6">
              <div className="bg-slate/5 border border-slate/10 rounded-sm p-4 text-sm text-ink leading-relaxed">
                <span className="font-bold block mb-1">Why verify?</span>
                Once verified, students and faculty at your institution will be able to find you in the Alumni Network directory and send you direct messages. Until then, your profile remains private.
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 border border-hairline p-5 rounded-sm bg-paper">
                <h3 className="font-bold text-sm text-ink uppercase tracking-wider mb-2">Submit Proof of Graduation</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate block mb-1">Graduation Year</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. 2024" 
                      value={graduationYear}
                      onChange={e => setGraduationYear(e.target.value)}
                      className="w-full bg-white border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate block mb-1">Student ID / Roll Number (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. CS16B021" 
                      value={rollNumber}
                      onChange={e => setRollNumber(e.target.value)}
                      className="w-full bg-white border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" 
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-slate block mb-1">Upload Degree or Provisional Certificate</label>
                    <div className="border-2 border-dashed border-hairline rounded-sm p-6 text-center hover:bg-white hover:border-slate/30 transition-colors cursor-pointer group">
                       {!fileAttached ? (
                         <div onClick={() => setFileAttached(true)} className="flex flex-col items-center gap-2">
                           <Upload className="h-6 w-6 text-slate group-hover:text-ink transition-colors" />
                           <div className="text-sm font-bold text-ink">Click to upload document</div>
                           <div className="text-xs text-slate">PDF, JPG, or PNG (Max 5MB)</div>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center gap-2">
                           <CheckCircle2 className="h-6 w-6 text-growth-teal" />
                           <div className="text-sm font-bold text-ink">Document attached: degree_certificate.pdf</div>
                           <button type="button" onClick={() => setFileAttached(false)} className="text-xs text-alert-rust hover:underline">Remove</button>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={!fileAttached || !graduationYear || submitMutation.isPending}
                    className="w-full bg-ink text-paper py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting Request...
                      </>
                    ) : (
                      'Submit for Verification'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
