import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, Filter, AlertTriangle, ArrowLeft, GraduationCap, MapPin, Mail, Phone, Calendar, 
  Download, ShieldCheck, Check, X, Loader2, CheckCircle2, AlertCircle, Building, Clock 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import { MatchScoreVisualizer } from '../../components/ui/MatchScoreVisualizer';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';
import { ProofBadge } from '../../components/ui/ProofBadge';

interface StudentItem {
  student_id: string;
  full_name: string;
  email: string;
  department: string;
  current_year: number;
  readiness_percentage: number;
  target_career_role_id?: string;
  status?: string;
}

interface AlumniVerificationRequest {
  request_id: string;
  entity_id: string;
  entity_type: string;
  submitted_by: string;
  status: string;
  notes?: string;
  created_at: string;
  alumni_profile?: {
    alumni_id: string;
    graduation_year: number;
    department: string;
    degree: string;
    current_company: string;
    current_designation: string;
    users?: {
      full_name: string;
      email: string;
    };
  };
}

export function InstitutionStudents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentTab, setCurrentTab] = useState<'students' | 'alumni'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [atRiskFilter, setAtRiskFilter] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [processingReqId, setProcessingReqId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Read URL query params
  useEffect(() => {
    if (searchParams.get('tab') === 'alumni') {
      setCurrentTab('alumni');
    }
    if (searchParams.get('filter') === 'at-risk') {
      setAtRiskFilter(true);
    }
  }, [searchParams]);

  // 1. Fetch Students
  const { data: students = [], isLoading: loadingStudents, error: studentsError } = useQuery<StudentItem[]>({
    queryKey: ['institution', 'students'],
    queryFn: async () => {
      return await apiClient.get<StudentItem[]>('/institution/students');
    }
  });

  // 2. Fetch Alumni Verifications
  const { 
    data: alumniVerifications = [], 
    isLoading: loadingVerifications, 
    error: verificationsError,
    refetch: refetchVerifications 
  } = useQuery<AlumniVerificationRequest[]>({
    queryKey: ['admin', 'verifications', 'alumni'],
    queryFn: async () => {
      return await apiClient.get<AlumniVerificationRequest[]>('/admin/verifications?entity_type=alumni');
    }
  });

  // 3. Approve Mutation
  const approveMutation = useApiMutation({
    mutationFn: async (requestId: string) => {
      return await apiClient.patch(`/admin/verifications/${requestId}/approve`);
    },
    invalidateQueries: [
      ['admin', 'verifications', 'alumni'],
      ['academician', 'alumni'],
      ['student', 'alumni'],
      ['institution', 'profile']
    ],
    onSuccess: () => {
      setProcessingReqId(null);
      setFeedback({ 
        type: 'success', 
        message: 'Alumni verified successfully! Their profile is now live across student and faculty networks.' 
      });
      setTimeout(() => setFeedback(null), 5000);
    },
    onError: (err: any) => {
      setProcessingReqId(null);
      setFeedback({ type: 'error', message: err?.message || 'Failed to approve verification.' });
    }
  });

  // 4. Reject Mutation
  const rejectMutation = useApiMutation({
    mutationFn: async (requestId: string) => {
      return await apiClient.patch(`/admin/verifications/${requestId}/reject`, {
        notes: 'Verification credentials could not be validated.'
      });
    },
    invalidateQueries: [
      ['admin', 'verifications', 'alumni']
    ],
    onSuccess: () => {
      setProcessingReqId(null);
      setFeedback({ type: 'success', message: 'Alumni verification request rejected.' });
      setTimeout(() => setFeedback(null), 5000);
    },
    onError: (err: any) => {
      setProcessingReqId(null);
      setFeedback({ type: 'error', message: err?.message || 'Failed to reject verification.' });
    }
  });

  const handleApprove = (requestId: string) => {
    setProcessingReqId(requestId);
    approveMutation.mutate(requestId);
  };

  const handleReject = (requestId: string) => {
    setProcessingReqId(requestId);
    rejectMutation.mutate(requestId);
  };

  const toggleAtRisk = () => {
    const nextAtRisk = !atRiskFilter;
    setAtRiskFilter(nextAtRisk);
    if (nextAtRisk) {
      searchParams.set('filter', 'at-risk');
    } else {
      searchParams.delete('filter');
    }
    setSearchParams(searchParams);
  };

  const switchTab = (tab: 'students' | 'alumni') => {
    setCurrentTab(tab);
    searchParams.set('tab', tab);
    setSearchParams(searchParams);
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const name = s.full_name || '';
    const dept = s.department || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || dept.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'All Departments' || dept === departmentFilter;
    const isAtRisk = s.readiness_percentage < 40;
    const matchesAtRisk = atRiskFilter ? isAtRisk : true;
    return matchesSearch && matchesDept && matchesAtRisk;
  });

  if (selectedStudent) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedStudent(null)}
          className="text-sm font-bold text-slate hover:text-ink flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Student List
        </button>

        {/* Individual Student Detail View */}
        <div className="bg-white border-2 border-slate/10 rounded-sm overflow-hidden shadow-lg">
          <div className="bg-slate/5 p-8 border-b border-hairline flex items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-ink text-paper flex items-center justify-center text-3xl font-bold font-serif shrink-0 shadow-inner">
              {selectedStudent.full_name?.charAt(0) || 'S'}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-ink">{selectedStudent.full_name}</h1>
                  <p className="text-lg text-slate mt-1 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" /> {selectedStudent.department} • Year {selectedStudent.current_year}
                  </p>
                </div>
                {selectedStudent.readiness_percentage < 40 && (
                   <div className="bg-alert-rust/10 text-alert-rust px-4 py-2 rounded-sm text-sm font-bold flex items-center gap-2 border border-alert-rust/20">
                     <AlertTriangle className="h-4 w-4" /> Intervention Required
                   </div>
                )}
              </div>
              <div className="flex gap-4 mt-6">
                <span className="flex items-center gap-1 text-sm text-slate"><Mail className="h-4 w-4"/> {selectedStudent.email}</span>
                <span className="flex items-center gap-1 text-sm text-slate"><MapPin className="h-4 w-4"/> Gandhinagar / Gujarat</span>
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-8">
              <div>
                <h3 className="font-bold text-ink border-b border-hairline pb-2 mb-4">Placement Readiness Score</h3>
                <MatchScoreVisualizer 
                  score={selectedStudent.readiness_percentage} 
                  breakdown={{ skill: 40, evidence: 20, projects: 15, eligibility: 25 }} 
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-paper p-5 border border-hairline rounded-sm space-y-3">
                <h4 className="font-bold text-ink text-sm uppercase tracking-wider">Department Details</h4>
                <p className="text-xs text-slate"><strong>Program:</strong> Bachelor of Technology</p>
                <p className="text-xs text-slate"><strong>Status:</strong> {selectedStudent.readiness_percentage >= 70 ? 'Placement Ready' : selectedStudent.readiness_percentage < 40 ? 'At-Risk' : 'Developing'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Students & Alumni Records</h1>
          <p className="text-sm text-slate mt-1">Manage current cohort readiness and verify graduate credentials.</p>
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

      {/* Tabs */}
      <div className="flex border-b border-hairline">
        <button
          onClick={() => switchTab('students')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-colors relative flex items-center gap-2",
            currentTab === 'students' ? "text-ink" : "text-slate hover:text-ink"
          )}
        >
          <GraduationCap className="h-4 w-4" /> Active Students ({students.length})
          {currentTab === 'students' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-ink"></div>
          )}
        </button>

        <button
          onClick={() => switchTab('alumni')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-colors relative flex items-center gap-2",
            currentTab === 'alumni' ? "text-ink" : "text-slate hover:text-ink"
          )}
        >
          <ShieldCheck className="h-4 w-4" /> Alumni Verifications
          {alumniVerifications.length > 0 && (
            <span className="bg-alert-rust text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
              {alumniVerifications.length}
            </span>
          )}
          {currentTab === 'alumni' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-ink"></div>
          )}
        </button>
      </div>

      {/* TAB 1: ACTIVE STUDENTS */}
      {currentTab === 'students' && (
        <div className="space-y-6">
          <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate" />
              <input 
                type="text" 
                placeholder="Search students by name or department..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink transition-colors"
              />
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <select 
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink font-medium"
              >
                <option>All Departments</option>
                <option>Computer Science</option>
                <option>Information Tech</option>
                <option>Electronics</option>
                <option>CSE</option>
              </select>

              <button 
                onClick={toggleAtRisk}
                className={cn(
                  "px-4 py-2 rounded-sm text-sm font-bold flex items-center gap-2 transition-colors border",
                  atRiskFilter 
                    ? "bg-alert-rust text-white border-alert-rust" 
                    : "bg-white border-hairline text-slate hover:text-ink"
                )}
              >
                <AlertTriangle className="h-4 w-4" />
                At-Risk Only (&lt;40%)
              </button>
            </div>
          </div>

          {loadingStudents ? (
            <div className="bg-white p-12 border border-hairline rounded-sm flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-growth-teal animate-spin" />
              <p className="text-sm text-slate">Loading student records...</p>
            </div>
          ) : studentsError ? (
            <div className="bg-alert-rust/10 border border-alert-rust/20 rounded-sm p-4 text-alert-rust text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Failed to load students: {(studentsError as any)?.message || 'Network error'}</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white border border-hairline rounded-sm p-12 text-center">
              <GraduationCap className="h-10 w-10 text-slate mx-auto mb-3 opacity-50" />
              <h3 className="font-bold text-ink">No Students Found</h3>
              <p className="text-sm text-slate mt-1">Try adjusting your search terms or filters.</p>
            </div>
          ) : (
            <div className="bg-white border border-hairline rounded-sm overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-hairline text-xs font-bold text-slate uppercase tracking-wider">
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Year</th>
                    <th className="p-4">Placement Readiness</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredStudents.map((s) => {
                    const readiness = s.readiness_percentage;
                    const statusColor = readiness >= 70 ? 'text-growth-teal bg-growth-teal/10' : readiness < 40 ? 'text-alert-rust bg-alert-rust/10' : 'text-warning-gold bg-warning-gold/10';
                    const statusText = readiness >= 70 ? 'Ready' : readiness < 40 ? 'At-Risk' : 'Developing';

                    return (
                      <tr key={s.student_id} className="hover:bg-slate/5 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-ink">{s.full_name}</div>
                          <div className="text-xs text-slate">{s.email}</div>
                        </td>
                        <td className="p-4 text-sm text-slate font-medium">{s.department}</td>
                        <td className="p-4 text-sm text-slate">Year {s.current_year}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-ink w-8">{readiness}%</span>
                            <div className="w-28 bg-hairline rounded-full h-2 overflow-hidden">
                              <div 
                                className={cn("h-full", readiness >= 70 ? "bg-growth-teal" : readiness < 40 ? "bg-alert-rust" : "bg-warning-gold")}
                                style={{ width: `${readiness}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={cn("px-2.5 py-1 rounded-sm text-xs font-bold uppercase tracking-wider", statusColor)}>
                            {statusText}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => setSelectedStudent(s)}
                            className="text-sm font-bold text-ink hover:underline"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALUMNI VERIFICATIONS */}
      {currentTab === 'alumni' && (
        <div className="space-y-6">
          <div className="bg-paper p-4 border border-hairline rounded-sm">
            <h3 className="font-bold text-ink text-sm">Institution Alumni Verification Queue</h3>
            <p className="text-xs text-slate mt-1">
              As an Institution Admin, review graduation and degree credentials submitted by alumni. Approving flips their verified status, enabling them to connect with students and faculty.
            </p>
          </div>

          {loadingVerifications ? (
            <div className="bg-white p-12 border border-hairline rounded-sm flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-growth-teal animate-spin" />
              <p className="text-sm text-slate">Loading pending alumni verification requests...</p>
            </div>
          ) : verificationsError ? (
            <div className="bg-alert-rust/10 border border-alert-rust/20 rounded-sm p-4 text-alert-rust text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Failed to load verifications: {(verificationsError as any)?.message || 'Network error'}</span>
            </div>
          ) : alumniVerifications.length === 0 ? (
            <div className="bg-white border border-hairline rounded-sm p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-growth-teal mx-auto mb-3" />
              <h3 className="font-bold text-ink">No Pending Alumni Verifications</h3>
              <p className="text-sm text-slate mt-1 max-w-md mx-auto">
                All alumni verification submissions from your institution have been reviewed. New requests from registered alumni will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {alumniVerifications.map((req) => {
                const isProcessing = (approveMutation.isPending || rejectMutation.isPending) && processingReqId === req.request_id;
                const prof = req.alumni_profile;
                const name = prof?.users?.full_name || 'Alumni Candidate';
                const email = prof?.users?.email || '';
                const degree = prof?.degree || 'B.Tech';
                const dept = prof?.department || 'Engineering';
                const year = prof?.graduation_year || 2024;
                const company = prof?.current_company || 'Industry';
                const designation = prof?.current_designation || 'Professional';

                return (
                  <div key={req.request_id} className="bg-white border-2 border-hairline hover:border-slate/40 rounded-sm shadow-sm p-6 flex flex-col justify-between transition-all">
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-slate/10 flex items-center justify-center text-ink font-bold font-serif text-lg">
                            {name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-ink text-lg">{name}</h4>
                            <p className="text-xs text-slate">{email}</p>
                          </div>
                        </div>

                        <span className="bg-warning-gold/10 text-warning-gold border border-warning-gold/30 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Pending Review
                        </span>
                      </div>

                      <div className="space-y-2 bg-paper p-4 rounded-sm border border-hairline mb-4 text-xs">
                        <div className="flex items-center gap-2 text-slate">
                          <GraduationCap className="h-4 w-4 text-ink shrink-0" />
                          <span><strong>Degree / Dept:</strong> {degree} in {dept}, Class of {year}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate">
                          <Building className="h-4 w-4 text-ink shrink-0" />
                          <span><strong>Current Employment:</strong> {designation} at {company}</span>
                        </div>
                        {req.notes && (
                          <div className="text-slate pt-2 border-t border-hairline">
                            <strong>Applicant Note:</strong> {req.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleApprove(req.request_id)}
                        disabled={isProcessing}
                        className="flex-1 bg-growth-teal text-white py-2.5 rounded-sm text-sm font-bold hover:bg-growth-teal/90 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        {isProcessing && approveMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" /> Approve & Verify
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleReject(req.request_id)}
                        disabled={isProcessing}
                        className="px-4 py-2.5 border border-alert-rust/40 text-alert-rust hover:bg-alert-rust/5 rounded-sm text-sm font-bold transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {isProcessing && rejectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4" /> Reject
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
