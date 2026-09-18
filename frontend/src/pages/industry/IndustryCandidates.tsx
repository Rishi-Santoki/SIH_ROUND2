import React, { useState, useMemo } from 'react';
import { 
  Search, MapPin, Building, GraduationCap, Lock, Unlock, X, 
  Mail, MessageSquare, CheckCircle2, ExternalLink, ShieldCheck, 
  Award, Briefcase, ChevronRight, FileText, Star 
} from 'lucide-react';
import { MatchScoreVisualizer } from '../../components/ui/MatchScoreVisualizer';
import { ProofBadge } from '../../components/ui/ProofBadge';
import { cn } from '../../lib/utils';
import { useParams, useNavigate } from 'react-router-dom';

interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  hasApplied: true;
  university: string;
  degree: string;
  currentYear: number;
  cgpa: number;
  graduationYear: number;
  location: string;
  bio: string;
  matchScore: number;
  breakdown: { skill: number; evidence: number; projects: number; eligibility: number };
  matchedSkills: { name: string; level: number; verified: boolean; evidence: string }[];
  missingSkills: string[];
  projects: { title: string; description: string; tech: string[]; verified: boolean; link?: string }[];
  certifications: { title: string; issuer: string; date: string; credentialId: string }[];
}

interface AnonymousCandidate {
  id: string;
  name: string;
  hasApplied: false;
  university: string;
  degree: string;
  matchScore: number;
  breakdown: { skill: number; evidence: number; projects: number; eligibility: number };
  matchedSkills: string[];
  missingSkills: string[];
}

type Candidate = CandidateProfile | AnonymousCandidate;

const CANDIDATES: Candidate[] = [
  {
    id: 'c1',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@university.edu',
    hasApplied: true,
    university: 'State University of Technology',
    degree: 'B.Tech in Computer Science & Engineering',
    currentYear: 4,
    cgpa: 8.9,
    graduationYear: 2026,
    location: 'Bangalore / Remote',
    bio: 'Specializing in distributed systems, backend microservices, and high-throughput data processing. Proven track record in open-source ledger protocols.',
    matchScore: 88,
    breakdown: { skill: 40, evidence: 30, projects: 10, eligibility: 8 },
    matchedSkills: [
      { name: 'Python', level: 4, verified: true, evidence: 'Verified via Proctored Assessment (96%) & 2 Projects' },
      { name: 'SQL & Database Architecture', level: 3, verified: true, evidence: 'Verified by Coursework & Schema Benchmarks' },
      { name: 'Distributed Systems', level: 3, verified: true, evidence: 'Verified via Peer Review & GitHub Repository' },
      { name: 'Docker / CI/CD', level: 2, verified: true, evidence: 'Verified via Automated Build Ledger' }
    ],
    missingSkills: ['Cloud Deployment (AWS/GCP)'],
    projects: [
      {
        title: 'Distributed Analytics Pipeline',
        description: 'High-throughput stream processing pipeline handling 50k events/sec with Apache Kafka and PostgreSQL backend.',
        tech: ['Python', 'Kafka', 'PostgreSQL', 'Docker'],
        verified: true,
        link: 'https://github.com/sarahjenkins/analytics-stream'
      },
      {
        title: 'ProofLedger Credential Verifier',
        description: 'Cryptographic signature and audit log verification toolkit for tamper-proof educational records.',
        tech: ['TypeScript', 'FastAPI', 'Cryptography'],
        verified: true,
        link: 'https://github.com/sarahjenkins/proof-verifier'
      }
    ],
    certifications: [
      {
        title: 'Advanced Data Engineering with Python',
        issuer: 'ProofLedger Academy & Industry Council',
        date: 'August 2026',
        credentialId: 'PL-DE-882194'
      },
      {
        title: 'Relational Database Design & Query Optimization',
        issuer: 'State Tech Examination Board',
        date: 'May 2026',
        credentialId: 'ST-SQL-440192'
      }
    ]
  },
  {
    id: 'c2',
    name: 'Anonymous Candidate',
    hasApplied: false,
    university: 'Hidden until application',
    degree: 'B.Tech IT',
    matchScore: 75,
    breakdown: { skill: 35, evidence: 20, projects: 10, eligibility: 10 },
    matchedSkills: ['Python (Verified)'],
    missingSkills: ['SQL']
  }
];

export function IndustryCandidates() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isSearchMode = !id;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);
  const [shortlistedMap, setShortlistedMap] = useState<Record<string, boolean>>({});
  const [messageModalCandidate, setMessageModalCandidate] = useState<CandidateProfile | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageSentToast, setMessageSentToast] = useState<string | null>(null);

  const filteredCandidates = useMemo(() => {
    if (!searchTerm.trim()) return CANDIDATES;
    const term = searchTerm.toLowerCase();
    return CANDIDATES.filter(c => 
      c.name.toLowerCase().includes(term) ||
      c.degree.toLowerCase().includes(term) ||
      c.university.toLowerCase().includes(term) ||
      (c.hasApplied && c.matchedSkills.some(s => s.name.toLowerCase().includes(term))) ||
      (!c.hasApplied && c.matchedSkills.some(s => s.toLowerCase().includes(term)))
    );
  }, [searchTerm]);

  const handleOpenProfile = (candidate: Candidate) => {
    if (candidate.hasApplied) {
      setSelectedCandidate(candidate as CandidateProfile);
    }
  };

  const handleToggleShortlist = (candidateId: string) => {
    setShortlistedMap(prev => ({
      ...prev,
      [candidateId]: !prev[candidateId]
    }));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    const targetName = messageModalCandidate?.name || 'Candidate';
    setMessageSentToast(`Message sent to ${targetName}!`);
    setMessageModalCandidate(null);
    setMessageText('');
    setTimeout(() => setMessageSentToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {messageSentToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-sm flex items-center gap-2 shadow-sm animate-in fade-in-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{messageSentToast}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">
          {isSearchMode ? 'Candidate Search' : 'Applicants: Junior Data Analyst'}
        </h1>
        <p className="text-sm text-slate mt-1">
          {isSearchMode ? 'Discover verified talent across the network.' : 'Review matches for this opportunity.'}
        </p>
      </div>

      {isSearchMode && (
        <div className="bg-white border border-hairline p-2 rounded-sm flex items-center gap-3 shadow-sm mb-6">
          <Search className="h-5 w-5 text-slate ml-2" />
          <input 
            type="text" 
            placeholder="Search by skill, degree, or keyword (e.g. Python, SQL, Computer Science)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none py-1 text-ink"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-xs text-slate hover:text-ink mr-2">
              Clear
            </button>
          )}
        </div>
      )}

      <div className="space-y-6">
        {filteredCandidates.map(candidate => (
          <div key={candidate.id} className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden flex flex-col md:flex-row">
            
            {/* Profile Section */}
            <div className={cn("p-6 flex-1 border-b md:border-b-0 md:border-r border-hairline relative", !candidate.hasApplied && "bg-slate/5")}>
              {!candidate.hasApplied ? (
                <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-slate uppercase tracking-wider bg-white px-2 py-1 rounded-sm border border-hairline shadow-sm">
                  <Lock className="h-3 w-3" /> Reduced Profile
                </div>
              ) : shortlistedMap[candidate.id] ? (
                <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-growth-teal uppercase tracking-wider bg-growth-teal/10 px-2 py-1 rounded-sm border border-growth-teal/20">
                  <CheckCircle2 className="h-3 w-3" /> Shortlisted
                </div>
              ) : null}
              
              <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center font-serif font-bold text-xl",
                  candidate.hasApplied ? "bg-ink text-paper" : "bg-slate/20 text-slate"
                )}>
                  {candidate.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={cn("font-bold text-lg", candidate.hasApplied ? "text-ink" : "text-slate italic")}>
                      {candidate.name}
                    </h3>
                    {candidate.hasApplied && (
                      <span className="text-[10px] bg-growth-teal/10 text-growth-teal border border-growth-teal/20 px-2 py-0.5 rounded-sm font-bold uppercase">
                        Verified Applicant
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate flex flex-col gap-1 mt-1">
                    <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {candidate.degree}</span>
                    <span className="flex items-center gap-1"><Building className="h-4 w-4" /> {candidate.university}</span>
                  </div>
                </div>
              </div>

              {!candidate.hasApplied ? (
                <p className="text-xs text-slate bg-white p-3 rounded-sm border border-hairline mt-4 leading-relaxed">
                  This candidate has not applied yet. Identifying details are protected by ProofLedger privacy standards. Their match score is projected based on public verified ledger records. Full profile unlocks once the candidate submits an application.
                </p>
              ) : (
                <div className="flex gap-2 mt-5">
                   <button 
                     onClick={() => handleOpenProfile(candidate)}
                     className="bg-ink text-paper px-4 py-2 rounded-sm text-xs font-bold hover:bg-ink/90 transition-colors cursor-pointer flex items-center gap-1.5"
                   >
                     View Full Profile
                   </button>
                   <button 
                     onClick={() => setMessageModalCandidate(candidate as CandidateProfile)}
                     className="bg-white border border-hairline text-ink px-4 py-2 rounded-sm text-xs font-bold hover:bg-slate/5 transition-colors cursor-pointer flex items-center gap-1.5"
                   >
                     <MessageSquare className="h-3.5 w-3.5" /> Message
                   </button>
                   <button 
                     onClick={() => handleToggleShortlist(candidate.id)}
                     className={cn(
                       "px-3 py-2 rounded-sm text-xs font-bold border transition-colors cursor-pointer",
                       shortlistedMap[candidate.id]
                         ? "bg-growth-teal/10 text-growth-teal border-growth-teal/20 hover:bg-growth-teal/20"
                         : "bg-white border-hairline text-slate hover:text-ink hover:bg-slate/5"
                     )}
                   >
                     {shortlistedMap[candidate.id] ? 'Shortlisted' : 'Shortlist'}
                   </button>
                </div>
              )}
            </div>

            {/* Match Engine Section */}
            <div className="p-6 md:w-96 flex flex-col justify-between bg-paper">
              <MatchScoreVisualizer score={candidate.matchScore} breakdown={candidate.breakdown} showDetails={true} />
              
              <div className="mt-6 space-y-3">
                <div>
                  <h4 className="text-[10px] font-bold text-slate uppercase tracking-wider mb-2">Matched Requirements</h4>
                  <div className="flex flex-wrap gap-1">
                    {candidate.hasApplied ? (
                      candidate.matchedSkills.map(s => (
                        <span key={s.name} className="bg-growth-teal/10 text-growth-teal border border-growth-teal/20 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" /> {s.name} (Verified)
                        </span>
                      ))
                    ) : (
                      candidate.matchedSkills.map(s => (
                        <span key={s} className="bg-growth-teal/10 text-growth-teal border border-growth-teal/20 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate uppercase tracking-wider mb-2">Missing/Unverified</h4>
                  <div className="flex flex-wrap gap-1">
                    {candidate.missingSkills.map(s => (
                      <span key={s} className="bg-white border border-hairline text-slate px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* FULL CANDIDATE PROFILE MODAL */}
      {selectedCandidate && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-50"
          onClick={() => setSelectedCandidate(null)}
        >
          <div 
            className="bg-white border border-hairline rounded-sm max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-hairline p-6 flex items-start justify-between z-10">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-ink text-paper flex items-center justify-center font-serif font-bold text-2xl shrink-0">
                  {selectedCandidate.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-serif font-bold text-ink">{selectedCandidate.name}</h2>
                    <span className="bg-growth-teal/10 text-growth-teal border border-growth-teal/20 text-xs px-2.5 py-0.5 rounded-sm font-bold uppercase flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> ProofLedger Verified
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs text-slate mt-1.5">
                    <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {selectedCandidate.degree}</span>
                    <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" /> {selectedCandidate.university}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {selectedCandidate.location}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="text-slate hover:text-ink p-1 rounded-sm cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Bio & Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 bg-paper p-4 rounded-sm border border-hairline">
                  <h4 className="text-xs font-bold text-slate uppercase tracking-wider mb-1">Candidate Summary</h4>
                  <p className="text-sm text-ink leading-relaxed">{selectedCandidate.bio}</p>
                </div>
                <div className="bg-paper p-4 rounded-sm border border-hairline flex flex-col justify-center items-center text-center">
                  <span className="text-xs font-bold text-slate uppercase tracking-wider mb-1">Match Rating</span>
                  <span className="text-3xl font-serif font-bold text-growth-teal">{selectedCandidate.matchScore}%</span>
                  <span className="text-[11px] text-slate mt-0.5">High Compatibility</span>
                </div>
              </div>

              {/* Academic Highlights */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 border border-hairline rounded-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Current Year</span>
                  <p className="text-sm font-bold text-ink mt-0.5">Year {selectedCandidate.currentYear}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">CGPA</span>
                  <p className="text-sm font-bold text-ink mt-0.5">{selectedCandidate.cgpa} / 10.0</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Graduation</span>
                  <p className="text-sm font-bold text-ink mt-0.5">Class of {selectedCandidate.graduationYear}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Direct Contact</span>
                  <p className="text-sm font-bold text-ink mt-0.5 truncate">{selectedCandidate.email}</p>
                </div>
              </div>

              {/* Verified Skills Ledger */}
              <div>
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-growth-teal" /> Verified Skill Ledger
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedCandidate.matchedSkills.map(skill => (
                    <div key={skill.name} className="p-3.5 bg-paper rounded-sm border border-hairline">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-ink text-sm">{skill.name}</span>
                        <span className="text-xs font-bold text-growth-teal bg-growth-teal/10 px-2 py-0.5 rounded-sm">
                          Level {skill.level} / 5
                        </span>
                      </div>
                      <p className="text-xs text-slate">{skill.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Portfolio Projects */}
              <div>
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-ink" /> Verified Portfolio Projects
                </h3>
                <div className="space-y-3">
                  {selectedCandidate.projects.map(proj => (
                    <div key={proj.title} className="p-4 bg-white border border-hairline rounded-sm hover:border-slate/40 transition-colors">
                      <div className="flex items-start justify-between mb-1.5">
                        <h4 className="font-bold text-ink text-sm flex items-center gap-2">
                          {proj.title}
                          {proj.verified && (
                            <span className="text-[10px] bg-growth-teal/10 text-growth-teal px-1.5 py-0.2 rounded-sm font-bold">
                              Verified
                            </span>
                          )}
                        </h4>
                        {proj.link && (
                          <a 
                            href={proj.link} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs text-slate hover:text-ink flex items-center gap-1 font-medium"
                          >
                            Repository <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate mb-3 leading-relaxed">{proj.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {proj.tech.map(t => (
                          <span key={t} className="text-[10px] font-bold bg-slate/10 text-ink px-2 py-0.5 rounded-sm">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-verified-gold" /> Cryptographic Credentials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedCandidate.certifications.map(cert => (
                    <div key={cert.credentialId} className="p-3.5 bg-paper rounded-sm border border-hairline">
                      <h4 className="font-bold text-ink text-xs mb-1">{cert.title}</h4>
                      <p className="text-[11px] text-slate">{cert.issuer} • {cert.date}</p>
                      <p className="text-[10px] font-mono text-slate/80 mt-2 bg-white px-2 py-1 rounded-sm border border-hairline inline-block">
                        ID: {cert.credentialId}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-hairline p-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleToggleShortlist(selectedCandidate.id)}
                  className={cn(
                    "px-4 py-2 rounded-sm text-xs font-bold border transition-colors cursor-pointer",
                    shortlistedMap[selectedCandidate.id]
                      ? "bg-growth-teal/10 text-growth-teal border-growth-teal/20 hover:bg-growth-teal/20"
                      : "bg-paper border-hairline text-ink hover:bg-slate/10"
                  )}
                >
                  {shortlistedMap[selectedCandidate.id] ? '✓ Candidate Shortlisted' : 'Shortlist Candidate'}
                </button>
                <button 
                  onClick={() => {
                    setMessageModalCandidate(selectedCandidate);
                  }}
                  className="bg-ink text-paper px-4 py-2 rounded-sm text-xs font-bold hover:bg-ink/90 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Send Direct Message
                </button>
              </div>

              <button 
                onClick={() => setSelectedCandidate(null)}
                className="text-xs font-bold text-slate hover:text-ink px-3 py-2 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK MESSAGE COMPOSER MODAL */}
      {messageModalCandidate && (
        <div 
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50"
          onClick={() => setMessageModalCandidate(null)}
        >
          <div 
            className="bg-white border border-hairline rounded-sm max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-ink text-base">Direct Message to {messageModalCandidate.name}</h3>
                <p className="text-xs text-slate mt-0.5">Send an interview inquiry or invitation directly through ProofLedger.</p>
              </div>
              <button 
                onClick={() => setMessageModalCandidate(null)}
                className="text-slate hover:text-ink cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1.5">Subject</label>
                <input 
                  type="text" 
                  defaultValue={`Opportunity Discussion: Interview Invitation`}
                  className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1.5">Message</label>
                <textarea 
                  rows={4}
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Hi ${messageModalCandidate.name},\n\nWe reviewed your verified profile on ProofLedger and are impressed with your projects and score. We'd love to connect for a brief introductory conversation.`}
                  className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
                <button 
                  type="button" 
                  onClick={() => setMessageModalCandidate(null)}
                  className="px-4 py-2 text-xs font-bold text-slate hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-ink text-paper px-5 py-2 rounded-sm text-xs font-bold hover:bg-ink/90 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" /> Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
