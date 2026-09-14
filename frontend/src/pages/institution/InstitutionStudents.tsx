import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, AlertTriangle, ArrowLeft, GraduationCap, MapPin, Mail, Phone, Calendar, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MatchScoreVisualizer } from '../../components/ui/MatchScoreVisualizer';

const MOCK_STUDENTS = [
  { id: 's1', name: 'Rahul Sharma', dept: 'Computer Science', year: '4th Year', readiness: 85, status: 'ready', email: 'rahul@example.com' },
  { id: 's2', name: 'Priya Patel', dept: 'Information Tech', year: '3rd Year', readiness: 65, status: 'developing', email: 'priya@example.com' },
  { id: 's3', name: 'Amit Kumar', dept: 'Computer Science', year: '4th Year', readiness: 35, status: 'at-risk', email: 'amit@example.com' },
  { id: 's4', name: 'Neha Singh', dept: 'Electronics', year: '4th Year', readiness: 28, status: 'at-risk', email: 'neha@example.com' },
  { id: 's5', name: 'Vikram Reddy', dept: 'Information Tech', year: '3rd Year', readiness: 92, status: 'ready', email: 'vikram@example.com' },
];

export function InstitutionStudents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [atRiskFilter, setAtRiskFilter] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Initialize filters based on URL
  useEffect(() => {
    if (searchParams.get('filter') === 'at-risk') {
      setAtRiskFilter(true);
    } else {
      setAtRiskFilter(false);
    }
  }, [searchParams]);

  const toggleAtRisk = () => {
    if (atRiskFilter) {
      searchParams.delete('filter');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ filter: 'at-risk' });
    }
  };

  const filteredStudents = MOCK_STUDENTS.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'All Departments' || s.dept === departmentFilter;
    const matchesAtRisk = atRiskFilter ? s.status === 'at-risk' : true;
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

        {/* Individual Student Detail View - Visually distinct, non-aggregate tone */}
        <div className="bg-white border-2 border-slate/10 rounded-sm overflow-hidden shadow-lg">
          {/* Header section with distinct styling */}
          <div className="bg-slate/5 p-8 border-b border-hairline flex items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-ink text-paper flex items-center justify-center text-3xl font-bold font-serif shrink-0 shadow-inner">
              {selectedStudent.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-ink">{selectedStudent.name}</h1>
                  <p className="text-lg text-slate mt-1 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" /> {selectedStudent.dept} • {selectedStudent.year}
                  </p>
                </div>
                {selectedStudent.status === 'at-risk' && (
                   <div className="bg-alert-rust/10 text-alert-rust px-4 py-2 rounded-sm text-sm font-bold flex items-center gap-2 border border-alert-rust/20">
                     <AlertTriangle className="h-4 w-4" /> Intervention Required
                   </div>
                )}
              </div>
              <div className="flex gap-4 mt-6">
                <span className="flex items-center gap-1 text-sm text-slate"><Mail className="h-4 w-4"/> {selectedStudent.email}</span>
                <span className="flex items-center gap-1 text-sm text-slate"><Phone className="h-4 w-4"/> +91 98765 43210</span>
                <span className="flex items-center gap-1 text-sm text-slate"><MapPin className="h-4 w-4"/> New Delhi</span>
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-8">
              <div>
                <h3 className="font-bold text-ink border-b border-hairline pb-2 mb-4">Placement Readiness Score</h3>
                <MatchScoreVisualizer 
                  score={selectedStudent.readiness} 
                  breakdown={{ skill: 40, evidence: 20, projects: 15, eligibility: 25 }} 
                />
              </div>
              
              <div>
                <h3 className="font-bold text-ink border-b border-hairline pb-2 mb-4">Skill Gaps (Individual)</h3>
                <div className="space-y-3">
                  <div className="bg-paper p-4 border border-hairline rounded-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-ink">Cloud Security</span>
                      <span className="text-xs font-bold text-alert-rust uppercase tracking-wider">Critical</span>
                    </div>
                    <p className="text-xs text-slate">Lacks verifiable evidence. No AWS/Azure certifications linked.</p>
                  </div>
                  <div className="bg-paper p-4 border border-hairline rounded-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-ink">System Design</span>
                      <span className="text-xs font-bold text-warning-gold uppercase tracking-wider">Developing</span>
                    </div>
                    <p className="text-xs text-slate">Basic theoretical knowledge. Needs practical architecture project.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate/5 p-5 rounded-sm border border-hairline">
                 <h3 className="font-bold text-ink mb-4 text-sm uppercase tracking-wider">Recommended Interventions</h3>
                 <button className="w-full bg-ink text-paper py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors mb-3">
                   Assign Mentorship
                 </button>
                 <button className="w-full bg-white border border-ink text-ink py-2 rounded-sm text-sm font-bold hover:bg-slate/5 transition-colors">
                   Recommend Assessment
                 </button>
              </div>

              <div>
                <h3 className="font-bold text-ink mb-3">Recent Activity</h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate/20 before:to-transparent">
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white bg-slate text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow"></div>
                     <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white p-3 rounded-sm border border-hairline shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-ink text-xs">Completed React Test</span>
                          <span className="text-[10px] text-slate">2 days ago</span>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Student Roster</h1>
        <p className="text-sm text-slate mt-1">Manage and review individual student progress across the institution.</p>
      </div>

      <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
          <input
            type="text"
            placeholder="Search students by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink transition-colors"
          >
            <option>All Departments</option>
            <option>Computer Science</option>
            <option>Information Tech</option>
            <option>Electronics</option>
          </select>
          <button 
            onClick={toggleAtRisk}
            className={cn(
              "px-4 py-2 rounded-sm text-sm font-bold flex items-center gap-2 transition-colors border",
              atRiskFilter 
                ? "bg-alert-rust/10 text-alert-rust border-alert-rust/30" 
                : "bg-white text-slate border-hairline hover:bg-slate/5"
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            At-Risk Only
          </button>
          <button className="bg-white border border-hairline text-ink p-2 rounded-sm hover:bg-slate/5 transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-paper border-b border-hairline">
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Student Name</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Department</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Year</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Readiness</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-slate/5 transition-colors group cursor-pointer" onClick={() => setSelectedStudent(student)}>
                <td className="p-4">
                  <div className="font-bold text-ink">{student.name}</div>
                  <div className="text-xs text-slate">{student.id}</div>
                </td>
                <td className="p-4 text-sm text-slate">{student.dept}</td>
                <td className="p-4 text-sm text-slate">{student.year}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-full bg-paper rounded-full h-2 max-w-[100px]">
                      <div 
                        className={cn(
                          "h-2 rounded-full",
                          student.readiness >= 70 ? "bg-growth-teal" : 
                          student.readiness >= 40 ? "bg-warning-gold" : "bg-alert-rust"
                        )} 
                        style={{ width: `${student.readiness}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-ink">{student.readiness}%</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button className="text-sm font-bold text-ink underline decoration-slate/30 underline-offset-4 group-hover:decoration-ink transition-colors">
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate">
                  No students found matching the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
