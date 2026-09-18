import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Onboarding } from './pages/Onboarding';
import { ForgotPassword } from './pages/ForgotPassword';

// Layouts
import { StudentLayout } from './components/layout/StudentLayout';
import { IndustryLayout } from './components/layout/IndustryLayout';
import { AcademicianLayout } from './components/layout/AcademicianLayout';
import { InstitutionLayout } from './components/layout/InstitutionLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Shared Pages
import { SharedAlumniNetwork } from './pages/shared/SharedAlumniNetwork';
import { SharedMessages } from './pages/shared/SharedMessages';

// Alumni Pages
import { AlumniLayout } from './components/layout/AlumniLayout';
import { AlumniProfile } from './pages/alumni/AlumniProfile';
import { AlumniVerification } from './pages/alumni/AlumniVerification';
import { AlumniMessages } from './pages/alumni/AlumniMessages';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentSkills } from './pages/student/StudentSkills';
import { StudentSkillGap } from './pages/student/StudentSkillGap';
import { StudentRoadmap } from './pages/student/StudentRoadmap';
import { StudentAssessments } from './pages/student/StudentAssessments';
import { StudentAssessmentTake } from './pages/student/StudentAssessmentTake';
import { StudentLearning } from './pages/student/StudentLearning';
import { StudentOpportunities } from './pages/student/StudentOpportunities';
import { StudentApplications } from './pages/student/StudentApplications';
import { StudentPortfolio } from './pages/student/StudentPortfolio';
import { StudentAlumniDetail } from './pages/student/StudentAlumniDetail';

// Industry Pages
import { IndustryDashboard } from './pages/industry/IndustryDashboard';
import { IndustryCompany } from './pages/industry/IndustryCompany';
import { IndustryOpportunities } from './pages/industry/IndustryOpportunities';
import { IndustryCandidates } from './pages/industry/IndustryCandidates';
import { IndustryPipeline } from './pages/industry/IndustryPipeline';
import { IndustryInterns } from './pages/industry/IndustryInterns';
import { IndustryMessages } from './pages/industry/IndustryMessages';

// Academician Pages
import { AcademicianDashboard } from './pages/academician/AcademicianDashboard';
import { AcademicianCollaborations } from './pages/academician/AcademicianCollaborations';
import { AcademicianSkillPulse } from './pages/academician/AcademicianSkillPulse';

// Institution Pages
import { InstitutionDashboard } from './pages/institution/InstitutionDashboard';
import { InstitutionStudents } from './pages/institution/InstitutionStudents';
import { InstitutionAnalytics } from './pages/institution/InstitutionAnalytics';
import { InstitutionDepartments } from './pages/institution/InstitutionDepartments';
import { InstitutionInterventions } from './pages/institution/InstitutionInterventions';
import { InstitutionIndustry } from './pages/institution/InstitutionIndustry';
import { InstitutionReports } from './pages/institution/InstitutionReports';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminVerifications } from './pages/admin/AdminVerifications';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminTaxonomy } from './pages/admin/AdminTaxonomy';
import { AdminCareerRoles } from './pages/admin/AdminCareerRoles';
import { AdminAssessments } from './pages/admin/AdminAssessments';
import { AdminPostings } from './pages/admin/AdminPostings';
import { AdminComplaints } from './pages/admin/AdminComplaints';
import { AdminMatching } from './pages/admin/AdminMatching';
import { AdminKnowledgeBase } from './pages/admin/AdminKnowledgeBase';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminAuditLog } from './pages/admin/AdminAuditLog';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Assessment Taking Flow - Full Screen (Outside Shell) */}
          <Route path="/student/assessments/:assessmentId/take" element={<StudentAssessmentTake />} />

          {/* Student Dashboard */}
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="skills" element={<StudentSkills />} />
            <Route path="skill-gap" element={<StudentSkillGap />} />
            <Route path="roadmap" element={<StudentRoadmap />} />
            <Route path="assessments" element={<StudentAssessments />} />
            <Route path="learning" element={<StudentLearning />} />
            <Route path="opportunities" element={<StudentOpportunities />} />
            <Route path="applications" element={<StudentApplications />} />
            <Route path="portfolio" element={<StudentPortfolio />} />
            <Route path="alumni" element={<SharedAlumniNetwork />} />
            <Route path="alumni/:alumniId" element={<StudentAlumniDetail />} />
            <Route path="messages" element={<SharedMessages />} />
            <Route path="messages/:conversationId" element={<SharedMessages />} />
          </Route>

          {/* Industry Dashboard */}
          <Route path="/industry" element={<IndustryLayout />}>
            <Route index element={<IndustryDashboard />} />
            <Route path="company" element={<IndustryCompany />} />
            <Route path="opportunities" element={<IndustryOpportunities />} />
            <Route path="opportunities/:id/candidates" element={<IndustryCandidates />} />
            <Route path="candidates/search" element={<IndustryCandidates />} />
            <Route path="pipeline" element={<IndustryPipeline />} />
            <Route path="interns" element={<IndustryInterns />} />
            <Route path="messages" element={<IndustryMessages />} />
          </Route>

          {/* Academician Dashboard */}
          <Route path="/academician" element={<AcademicianLayout />}>
            <Route index element={<AcademicianDashboard />} />
            <Route path="collaborations" element={<AcademicianCollaborations />} />
            <Route path="skill-pulse" element={<AcademicianSkillPulse />} />
            <Route path="alumni" element={<SharedAlumniNetwork />} />
            <Route path="alumni/:alumniId" element={<StudentAlumniDetail />} />
            <Route path="messages" element={<SharedMessages />} />
            <Route path="messages/:conversationId" element={<SharedMessages />} />
          </Route>

          {/* Institution Dashboard */}
          <Route path="/institution" element={<InstitutionLayout />}>
            <Route index element={<InstitutionDashboard />} />
            <Route path="students" element={<InstitutionStudents />} />
            <Route path="analytics" element={<InstitutionAnalytics />} />
            <Route path="departments" element={<InstitutionDepartments />} />
            <Route path="interventions" element={<InstitutionInterventions />} />
            <Route path="industry-connections" element={<InstitutionIndustry />} />
            <Route path="reports" element={<InstitutionReports />} />
          </Route>

          {/* Super Admin Dashboard */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="verifications" element={<AdminVerifications />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="skills" element={<AdminTaxonomy />} />
            <Route path="career-roles" element={<AdminCareerRoles />} />
            <Route path="assessments" element={<AdminAssessments />} />
            <Route path="opportunities" element={<AdminPostings />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="matching" element={<AdminMatching />} />
            <Route path="knowledge-base" element={<AdminKnowledgeBase />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="audit-logs" element={<AdminAuditLog />} />
          </Route>

          {/* Alumni Dashboard */}
          <Route path="/alumni" element={<AlumniLayout />}>
            <Route index element={<AlumniProfile />} />
            <Route path="verification" element={<AlumniVerification />} />
            <Route path="messages" element={<AlumniMessages />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
