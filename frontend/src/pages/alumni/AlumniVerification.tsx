import React, { useState } from 'react';
import { ShieldCheck, Upload, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { ProofBadge } from '../../components/ui/ProofBadge';

type VerificationStatus = 'unverified' | 'pending' | 'verified';

export function AlumniVerification() {
  const [status, setStatus] = useState<VerificationStatus>('unverified');
  const [fileAttached, setFileAttached] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('pending');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Alumni Verification</h1>
        <p className="text-sm text-slate mt-1">Verify your degree to unlock network features.</p>
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm p-8 flex items-start gap-6">
        <div className="pt-1">
          <ProofBadge status={status === 'verified' ? 'verified' : 'unverified'} size="lg" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-ink mb-2">
            {status === 'verified' ? 'Identity Verified' : 
             status === 'pending' ? 'Verification Under Review' : 
             'Not Yet Verified'}
          </h2>
          
          {status === 'verified' && (
            <p className="text-sm text-slate">
              Your alumni status has been confirmed by the institution. Your profile is now visible to students and faculty, and they can send you messages.
            </p>
          )}

          {status === 'pending' && (
            <div className="space-y-4 text-sm text-slate">
              <p>
                Your verification documents have been submitted and are currently being reviewed by the institution's administration. 
              </p>
              <div className="flex items-center gap-2 bg-slate/5 p-3 rounded-sm border border-slate/10">
                <FileText className="h-4 w-4 text-ink" />
                <span className="font-bold text-ink">degree_certificate.pdf</span>
                <span className="text-xs text-slate ml-auto">Submitted Today</span>
              </div>
              <p className="text-xs">
                This process usually takes 1-2 business days. There's nothing more you need to do right now.
              </p>
            </div>
          )}

          {status === 'unverified' && (
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
                    <input required type="text" placeholder="e.g. 2020" className="w-full bg-white border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate block mb-1">Student ID / Roll Number (Optional)</label>
                    <input type="text" placeholder="e.g. CS16B021" className="w-full bg-white border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" />
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
                           <div className="text-sm font-bold text-ink">Document attached successfully</div>
                           <button type="button" onClick={() => setFileAttached(false)} className="text-xs text-alert-rust hover:underline">Remove</button>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={!fileAttached}
                    className="w-full bg-ink text-paper py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit for Verification
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
