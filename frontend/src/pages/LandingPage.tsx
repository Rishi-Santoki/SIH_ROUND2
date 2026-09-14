import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Search, LineChart, FileSignature, ShieldCheck, XCircle } from 'lucide-react';
import { ProofBadge } from '../components/ui/ProofBadge';

export function LandingPage() {
  const [heroSkillStatus, setHeroSkillStatus] = useState<'self-declared' | 'verified'>('self-declared');

  useEffect(() => {
    // Animate from self-declared to verified after 1.5 seconds
    const timer = setTimeout(() => {
      setHeroSkillStatus('verified');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-verified-gold/20">
      {/* Navigation */}
      <nav className="border-b border-hairline px-6 py-4 flex items-center justify-between sticky top-0 bg-paper/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2 font-serif text-xl font-bold tracking-tight">
          <ShieldCheck className="h-6 w-6 text-ink" />
          <span>ProofLedger</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-medium hover:text-verified-gold transition-colors">
            Log in
          </Link>
          <Link to="/signup" className="text-sm font-medium bg-ink text-paper px-4 py-2 rounded-sm hover:bg-ink/90 transition-colors shadow-sm">
            Sign up
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7 space-y-6">
            <h1 className="text-5xl md:text-6xl font-serif font-semibold leading-tight tracking-tight text-balance">
              Skills you can prove. <br /> Not just skills you claim.
            </h1>
            <p className="text-lg text-slate max-w-xl leading-relaxed">
              The academia-industry collaboration platform built on verified evidence. Stop relying on self-reported keywords and start hiring, teaching, and matching based on a cryptographic chain of proof.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Link to="/signup?role=Industry" className="inline-flex items-center gap-2 bg-ink text-paper px-6 py-3 rounded-sm font-medium hover:bg-ink/90 transition-colors shadow-sm">
                I'm hiring
              </Link>
              <Link to="/signup?role=Student" className="inline-flex items-center gap-2 border border-hairline bg-transparent text-ink px-6 py-3 rounded-sm font-medium hover:bg-slate/5 transition-colors">
                I'm a student
              </Link>
            </div>
          </div>
          <div className="md:col-span-5 flex justify-center md:justify-end">
            {/* The One Orchestrated Moment */}
            <div className="relative w-full max-w-sm bg-white border border-hairline rounded-sm shadow-xl p-8 space-y-6">
              <div className="space-y-2 border-b border-hairline pb-6">
                <div className="text-sm text-slate uppercase tracking-wider font-medium">Candidate Profile</div>
                <div className="text-2xl font-serif font-medium">Full Stack Engineering</div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate">React Native</span>
                  <ProofBadge status="verified" showLabel />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate">PostgreSQL</span>
                  <ProofBadge status="verified" showLabel />
                </div>
                <div className="flex items-center justify-between bg-slate/5 -mx-4 px-4 py-3 border-y border-hairline">
                  <span className="font-medium">System Design</span>
                  <div className="transition-all duration-700 ease-in-out" style={{ transform: heroSkillStatus === 'verified' ? 'scale(1)' : 'scale(0.95)' }}>
                     <ProofBadge status={heroSkillStatus} showLabel />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem */}
        <section className="border-t border-hairline bg-white">
          <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
            <div className="max-w-3xl space-y-6">
              <h2 className="text-3xl font-serif font-semibold">The resume is a broken ledger.</h2>
              <p className="text-lg text-slate leading-relaxed">
                Existing platforms match on keywords and self-reported claims. A course certificate doesn't mean the skill is real, and a self-rated 5-star skill level tells you nothing about actual readiness. We replace the static resume with a dynamic Skill DNA—every node backed by assessments, projects, and mentor validation.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-hairline py-24 px-6 md:px-12 bg-paper">
          <div className="max-w-7xl mx-auto space-y-12">
            <h2 className="text-3xl font-serif font-semibold">The Ledger Flow</h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="space-y-4 relative">
                <div className="text-4xl font-serif font-light text-slate/40 absolute -top-8 -left-4 z-0">01</div>
                <div className="relative z-10 space-y-2">
                  <h3 className="font-medium text-lg border-b border-hairline pb-2">Assess</h3>
                  <p className="text-sm text-slate">Complete industry-standard technical assessments to establish a baseline.</p>
                </div>
              </div>
              <div className="space-y-4 relative">
                <div className="text-4xl font-serif font-light text-slate/40 absolute -top-8 -left-4 z-0">02</div>
                <div className="relative z-10 space-y-2">
                  <h3 className="font-medium text-lg border-b border-hairline pb-2">Get Verified</h3>
                  <p className="text-sm text-slate">Submissions are reviewed and signed off by academic and industry mentors.</p>
                </div>
              </div>
              <div className="space-y-4 relative">
                <div className="text-4xl font-serif font-light text-slate/40 absolute -top-8 -left-4 z-0">03</div>
                <div className="relative z-10 space-y-2">
                  <h3 className="font-medium text-lg border-b border-hairline pb-2">See Your Gaps</h3>
                  <p className="text-sm text-slate">Compare your verified Skill DNA against actual live job requirements.</p>
                </div>
              </div>
              <div className="space-y-4 relative">
                <div className="text-4xl font-serif font-light text-slate/40 absolute -top-8 -left-4 z-0">04</div>
                <div className="relative z-10 space-y-2">
                  <h3 className="font-medium text-lg border-b border-hairline pb-2">Match on Proof</h3>
                  <p className="text-sm text-slate">Companies filter candidates exclusively by verified, evidence-backed skills.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For every role */}
        <section className="border-t border-hairline py-24 px-6 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto space-y-12">
            <h2 className="text-3xl font-serif font-semibold">The complete ecosystem</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="border border-hairline p-6 rounded-sm space-y-4 shadow-sm hover:border-slate/40 transition-colors group bg-paper/50">
                <h3 className="font-medium text-lg flex justify-between items-center">
                  Students
                  <ProofBadge status="verified" />
                </h3>
                <p className="text-sm text-slate">Build a verifiable portfolio of skills that bypasses automated resume filters.</p>
                <Link to="/signup?role=Student" className="text-sm font-medium text-ink inline-flex items-center gap-1 group-hover:gap-2 transition-all">Join as Student <ArrowRight className="h-4 w-4" /></Link>
              </div>

              <div className="border border-hairline p-6 rounded-sm space-y-4 shadow-sm hover:border-slate/40 transition-colors group">
                <h3 className="font-medium text-lg flex justify-between items-center">
                  Industry
                  <ProofBadge status="verified" />
                </h3>
                <p className="text-sm text-slate">Source candidates based on cryptographic proof of capability, not inflated claims.</p>
                <Link to="/signup?role=Industry" className="text-sm font-medium text-ink inline-flex items-center gap-1 group-hover:gap-2 transition-all">Start Hiring <ArrowRight className="h-4 w-4" /></Link>
              </div>

              <div className="border border-dashed border-slate/40 p-6 rounded-sm space-y-4 hover:border-slate/60 transition-colors group bg-slate/5">
                <h3 className="font-medium text-lg">Academicians</h3>
                <p className="text-sm text-slate">Review student evidence, assign assessments, and manage industry collaborations.</p>
                <Link to="/signup?role=Academician" className="text-sm font-medium text-ink inline-flex items-center gap-1 group-hover:gap-2 transition-all">Join Faculty <ArrowRight className="h-4 w-4" /></Link>
              </div>

              <div className="border border-hairline p-6 rounded-sm space-y-4 shadow-sm hover:border-slate/40 transition-colors group">
                <h3 className="font-medium text-lg">Institutions</h3>
                <p className="text-sm text-slate">Track departmental readiness in real-time and intervene before placement season.</p>
                <Link to="/signup?role=Institution" className="text-sm font-medium text-ink inline-flex items-center gap-1 group-hover:gap-2 transition-all">Register Institution <ArrowRight className="h-4 w-4" /></Link>
              </div>

            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="border-t border-hairline py-24 px-6 md:px-12 bg-paper">
          <div className="max-w-5xl mx-auto space-y-12">
            <h2 className="text-3xl font-serif font-semibold">How this is different</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-hairline text-slate">
                    <th className="py-4 px-4 font-medium w-1/4">Feature</th>
                    <th className="py-4 px-4 font-medium">Standard Portals (Naukri, Unstop)</th>
                    <th className="py-4 px-4 font-medium bg-white shadow-sm border-x border-t border-hairline rounded-t-sm">ProofLedger</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-hairline">
                    <td className="py-4 px-4 font-medium">Skill Validation</td>
                    <td className="py-4 px-4 text-slate flex items-center gap-2"><XCircle className="h-4 w-4 text-slate/50" /> Self-reported claims</td>
                    <td className="py-4 px-4 bg-white border-x border-hairline flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-verified-gold" /> Evidence-backed verification</td>
                  </tr>
                  <tr className="border-b border-hairline">
                    <td className="py-4 px-4 font-medium">Match Score</td>
                    <td className="py-4 px-4 text-slate flex items-center gap-2"><XCircle className="h-4 w-4 text-slate/50" /> Keyword overlap</td>
                    <td className="py-4 px-4 bg-white border-x border-hairline flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-verified-gold" /> Deterministic gap analysis</td>
                  </tr>
                  <tr className="border-b border-hairline">
                    <td className="py-4 px-4 font-medium">Institution Oversight</td>
                    <td className="py-4 px-4 text-slate flex items-center gap-2"><XCircle className="h-4 w-4 text-slate/50" /> Post-facto placement reports</td>
                    <td className="py-4 px-4 bg-white shadow-sm border-x border-b border-hairline rounded-b-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-verified-gold" /> Live cohort intervention tracking</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Trust/verification explainer */}
        <section className="border-t border-hairline py-24 px-6 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-serif font-semibold">The Trust Layer</h2>
              <p className="text-lg text-slate leading-relaxed">
                Verification isn't just for students. Industry partners cannot post live opportunities until their institutional identity is verified by the platform admin. The ecosystem only works when every participant is real.
              </p>
            </div>
            <div className="border border-hairline bg-paper p-8 rounded-sm space-y-6 relative">
              <div className="absolute left-6 top-8 bottom-8 w-px bg-hairline" />
              <div className="relative flex gap-4">
                <div className="h-3 w-3 rounded-full bg-slate mt-1.5 ring-4 ring-paper" />
                <div className="space-y-1">
                  <p className="font-medium">Company Registers</p>
                  <p className="text-sm text-slate">Status: <span className="border-b border-dashed border-slate/40">Unverified</span></p>
                  <p className="text-xs text-alert-rust">Action Blocked: Post Job Opportunity</p>
                </div>
              </div>
              <div className="relative flex gap-4">
                <div className="h-3 w-3 rounded-full bg-verified-gold mt-1.5 ring-4 ring-paper" />
                <div className="space-y-1">
                  <p className="font-medium">Admin Approval</p>
                  <p className="text-sm text-slate flex items-center gap-1">Status: <ProofBadge status="verified" /></p>
                  <p className="text-xs text-growth-teal">Action Allowed: Live network access</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline bg-paper py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-serif font-bold text-slate">
            <ShieldCheck className="h-5 w-5" />
            <span>ProofLedger</span>
          </div>
          <div className="flex gap-6 text-sm text-slate">
            <Link to="/signup?role=Student" className="hover:text-ink">Students</Link>
            <Link to="/signup?role=Industry" className="hover:text-ink">Employers</Link>
            <Link to="/signup?role=Institution" className="hover:text-ink">Universities</Link>
            <Link to="#" className="hover:text-ink">Privacy</Link>
            <Link to="#" className="hover:text-ink">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
