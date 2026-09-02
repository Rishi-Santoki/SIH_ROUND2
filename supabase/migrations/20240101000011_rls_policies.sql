-- Migration 11: RLS Policies

-- Enable RLS on core tables
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academician_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- student_profiles: Owners can view and update their own profile
CREATE POLICY "Users can view and update own profile" ON student_profiles
  FOR ALL USING (student_id = auth.uid());

-- Institutions / companies could view student profiles (example simplified policy for select)
CREATE POLICY "Recruiters and institutions can view student profiles" ON student_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM recruiter_profiles WHERE recruiter_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM academician_profiles WHERE academician_id = auth.uid())
  );

-- student_skills: Owner access
CREATE POLICY "Users manage own skills" ON student_skills
  FOR ALL USING (student_id = auth.uid());

-- skill_evidence: Owner access (via student_skills)
CREATE POLICY "Users manage own skill evidence" ON skill_evidence
  FOR ALL USING (
    EXISTS (SELECT 1 FROM student_skills ss WHERE ss.student_skill_id = skill_evidence.student_skill_id AND ss.student_id = auth.uid())
  );

-- assessment_results: Owner access
CREATE POLICY "Users view own assessment results" ON assessment_results
  FOR ALL USING (student_id = auth.uid());

-- projects: Owner access
CREATE POLICY "Users manage own projects" ON projects
  FOR ALL USING (student_id = auth.uid());

-- certifications: Owner access
CREATE POLICY "Users manage own certifications" ON certifications
  FOR ALL USING (student_id = auth.uid());

-- applications: Owner access + Recruiter access
CREATE POLICY "Users manage own applications" ON applications
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Recruiters view applications for their opportunities" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM opportunities o
      JOIN recruiter_profiles rp ON o.company_id = rp.company_id
      WHERE o.opportunity_id = applications.opportunity_id AND rp.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters manage applications for their opportunities" ON applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM opportunities o
      JOIN recruiter_profiles rp ON o.company_id = rp.company_id
      WHERE o.opportunity_id = applications.opportunity_id AND rp.recruiter_id = auth.uid()
    )
  );

-- internship_tracking: Owner access
CREATE POLICY "Users view own tracking" ON internship_tracking
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM applications a WHERE a.application_id = internship_tracking.application_id AND a.student_id = auth.uid())
  );

CREATE POLICY "Recruiters manage own tracking" ON internship_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.opportunity_id
      JOIN recruiter_profiles rp ON o.company_id = rp.company_id
      WHERE a.application_id = internship_tracking.application_id AND rp.recruiter_id = auth.uid()
    )
  );

-- opportunities: Industry access + Public Read
CREATE POLICY "Public read opportunities" ON opportunities
  FOR SELECT USING (status = 'active' OR status = 'closed');

CREATE POLICY "Recruiters manage own opportunities" ON opportunities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recruiter_profiles rp
      WHERE rp.company_id = opportunities.company_id AND rp.recruiter_id = auth.uid()
    )
  );

-- companies: Public Read + Industry manage
CREATE POLICY "Public read companies" ON companies
  FOR SELECT USING (true);

CREATE POLICY "Recruiters manage own company" ON companies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM recruiter_profiles rp
      WHERE rp.company_id = companies.company_id AND rp.recruiter_id = auth.uid() AND rp.is_primary_contact = true
    )
  );

-- student_learning_progress: Owner access
CREATE POLICY "Users manage own learning progress" ON student_learning_progress
  FOR ALL USING (student_id = auth.uid());

-- notifications: Owner access
CREATE POLICY "Users manage own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- chat_history: Owner access
CREATE POLICY "Users manage own chat history" ON chat_history
  FOR ALL USING (user_id = auth.uid());

-- recruiter_profiles: Owner access
CREATE POLICY "Users manage own recruiter profile" ON recruiter_profiles
  FOR ALL USING (recruiter_id = auth.uid());

-- academician_profiles: Owner access
CREATE POLICY "Users manage own academician profile" ON academician_profiles
  FOR ALL USING (academician_id = auth.uid());
