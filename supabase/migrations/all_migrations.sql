-- Migration 1: Identity and Institution Tables

CREATE TABLE users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR,
  email VARCHAR UNIQUE,
  role VARCHAR CHECK (role IN ('student', 'industry', 'academician', 'institution', 'super_admin', 'alumni')),
  profile_image TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE institutions (
  institution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR,
  institution_type VARCHAR,
  city VARCHAR,
  state VARCHAR,
  country VARCHAR,
  website TEXT,
  verification_status VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE student_profiles (
  student_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(institution_id) ON DELETE SET NULL,
  department VARCHAR,
  current_year INTEGER,
  cgpa DECIMAL,
  graduation_year INTEGER,
  target_career_id UUID,
  resume_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT now()
);
-- Migration 2: Industry and Recruiter Tables

CREATE TABLE companies (
  company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR,
  description TEXT,
  industry_type VARCHAR,
  website TEXT,
  company_size VARCHAR,
  location VARCHAR,
  logo_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE recruiter_profiles (
  recruiter_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  designation VARCHAR,
  department VARCHAR,
  is_primary_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
-- Migration 3: Academician and Faculty Collaboration Tables

CREATE TABLE academician_profiles (
  academician_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(institution_id) ON DELETE CASCADE,
  department VARCHAR,
  designation VARCHAR,
  expertise_areas JSONB DEFAULT '[]'::jsonb,
  research_interests TEXT,
  linkedin_url TEXT,
  orcid_id TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE faculty_collaborations (
  collaboration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academician_id UUID REFERENCES academician_profiles(academician_id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
  collaboration_type VARCHAR CHECK (collaboration_type IN ('fdp', 'industrial_training', 'research', 'consultancy', 'guest_lecture', 'mentorship')),
  title VARCHAR,
  description TEXT,
  status VARCHAR CHECK (status IN ('proposed', 'ongoing', 'completed')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT now()
);
-- Migration 4: Skill Intelligence Tables

CREATE TABLE skills (
  skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR,
  category VARCHAR,
  description TEXT,
  parent_skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE career_roles (
  career_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR,
  category VARCHAR,
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Adding the foreign key for student_profiles here
ALTER TABLE student_profiles ADD CONSTRAINT fk_career_roles FOREIGN KEY (target_career_id) REFERENCES career_roles(career_role_id) ON DELETE SET NULL;

CREATE TABLE role_skills (
  role_skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_role_id UUID REFERENCES career_roles(career_role_id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
  required_level INTEGER,
  importance_weight DECIMAL,
  is_mandatory BOOLEAN,
  UNIQUE(career_role_id, skill_id)
);

CREATE TABLE student_skills (
  student_skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
  proficiency_level INTEGER,
  confidence_score DECIMAL,
  verification_status VARCHAR,
  source VARCHAR,
  last_updated TIMESTAMP DEFAULT now(),
  UNIQUE(student_id, skill_id)
);

CREATE TABLE skill_evidence (
  evidence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_skill_id UUID REFERENCES student_skills(student_skill_id) ON DELETE CASCADE,
  evidence_type VARCHAR CHECK (evidence_type IN ('assessment', 'project', 'certification', 'mentor', 'internship')),
  evidence_ref_id UUID, -- polymorphic
  weight DECIMAL,
  verified_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now()
);
-- Migration 5: Assessment Tables

CREATE TABLE assessments (
  assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR,
  description TEXT,
  assessment_type VARCHAR,
  skill_id UUID REFERENCES skills(skill_id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(user_id) ON DELETE CASCADE,
  duration_minutes INTEGER,
  total_marks INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE assessment_questions (
  question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(assessment_id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(skill_id) ON DELETE SET NULL,
  question TEXT,
  question_type VARCHAR,
  options JSONB,
  correct_answer TEXT,
  marks INTEGER,
  difficulty VARCHAR
);

CREATE TABLE assessment_results (
  result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(assessment_id) ON DELETE CASCADE,
  score DECIMAL,
  percentage DECIMAL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  attempt_number INTEGER
);
-- Migration 6: Opportunity and Application Tables

CREATE TABLE opportunities (
  opportunity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  title VARCHAR,
  description TEXT,
  opportunity_type VARCHAR CHECK (opportunity_type IN ('internship', 'job', 'apprenticeship', 'fdp', 'project')),
  location VARCHAR,
  work_mode VARCHAR,
  duration VARCHAR,
  stipend DECIMAL,
  application_deadline DATE,
  min_cgpa DECIMAL,
  status VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE opportunity_skills (
  opportunity_skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
  required_level INTEGER,
  importance_weight DECIMAL,
  is_mandatory BOOLEAN,
  UNIQUE(opportunity_id, skill_id)
);

CREATE TABLE applications (
  application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
  match_score DECIMAL,
  status VARCHAR,
  applied_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  recruiter_notes TEXT,
  rejection_reason TEXT
);

CREATE TABLE internship_tracking (
  tracking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(application_id) ON DELETE CASCADE,
  milestone VARCHAR,
  status VARCHAR CHECK (status IN ('not_started', 'in_progress', 'completed')),
  mentor_feedback TEXT,
  mentor_rating DECIMAL,
  updated_at TIMESTAMP DEFAULT now()
);
-- Migration 7: Learning and Portfolio Tables

CREATE TABLE learning_programs (
  program_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES institutions(institution_id) ON DELETE SET NULL,
  title VARCHAR,
  description TEXT,
  program_type VARCHAR,
  mode VARCHAR,
  duration VARCHAR,
  url TEXT,
  is_free BOOLEAN,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE program_skills (
  program_skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES learning_programs(program_id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
  skill_level_after_completion INTEGER,
  UNIQUE(program_id, skill_id)
);

CREATE TABLE student_learning_progress (
  progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  program_id UUID REFERENCES learning_programs(program_id) ON DELETE CASCADE,
  status VARCHAR,
  progress_percentage INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  certificate_url TEXT
);

CREATE TABLE projects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR,
  description TEXT,
  github_url TEXT,
  project_url TEXT,
  verification_status VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE certifications (
  certification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR,
  provider VARCHAR,
  issue_date DATE,
  credential_id VARCHAR,
  credential_url TEXT,
  verification_status VARCHAR
);
-- Migration 8: Trust, Verification and Notification Tables

CREATE TABLE verification_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR CHECK (entity_type IN ('institution', 'company', 'certification', 'project')),
  entity_id UUID, -- polymorphic
  submitted_by UUID REFERENCES users(user_id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  status VARCHAR CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  reviewed_at TIMESTAMP
);

CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  type VARCHAR CHECK (type IN ('application_update', 'new_match', 'deadline', 'feedback')),
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  reference_id UUID, -- polymorphic
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  action VARCHAR,
  entity_type VARCHAR,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);
-- Migration 9: RAG and Conversation Tables

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE knowledge_documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR,
  document_type VARCHAR,
  source VARCHAR,
  file_url TEXT,
  uploaded_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  access_level VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE document_chunks (
  chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge_documents(document_id) ON DELETE CASCADE,
  content TEXT,
  chunk_index INTEGER,
  embedding VECTOR(1536), -- assuming typical openai embeddings size
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE chat_history (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  session_id UUID,
  role VARCHAR,
  message TEXT,
  created_at TIMESTAMP DEFAULT now()
);
-- Migration 10: Indexes

CREATE INDEX idx_student_skills_lookup ON student_skills(student_id, skill_id);
CREATE INDEX idx_opportunity_skills_lookup ON opportunity_skills(opportunity_id, skill_id);
CREATE INDEX idx_role_skills_lookup ON role_skills(career_role_id, skill_id);

CREATE INDEX idx_applications_student_status ON applications(student_id, status);
CREATE INDEX idx_applications_opportunity_status ON applications(opportunity_id, status);

CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- pgvector index on document_chunks
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_audit_logs_actor_date ON audit_logs(actor_id, created_at);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
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

-- internship_tracking: Owner access
CREATE POLICY "Users view own tracking" ON internship_tracking
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM applications a WHERE a.application_id = internship_tracking.application_id AND a.student_id = auth.uid())
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
-- Migration 23: Outcome-Learning Batch Job Schema

-- 1. Add match_score_breakdown to applications to freeze score components
ALTER TABLE applications ADD COLUMN match_score_breakdown JSONB;

-- 2. Create weight_adjustment_proposals table
CREATE TABLE weight_adjustment_proposals (
    proposal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposed_weights JSONB NOT NULL,
    based_on_sample_size INTEGER NOT NULL,
    rationale TEXT NOT NULL,
    status VARCHAR CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE weight_adjustment_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admins full access weight_adjustment_proposals"
    ON weight_adjustment_proposals
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM users WHERE role = 'super_admin'
        )
    );

-- 3. Add weights_version to platform_settings (only if it doesn't exist, we will just add it. But platform_settings is key-value!)
-- Wait, platform_settings is a key-value store (setting_key, setting_value JSONB).
-- So we just insert a new setting_key.
INSERT INTO platform_settings (setting_key, setting_value) 
VALUES ('weights_version', '1')
ON CONFLICT (setting_key) DO NOTHING;
-- Migration: Alumni Profile, Verification & Institution-Scoped Directory

-- Update the role enum
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'industry', 'academician', 'institution', 'super_admin', 'alumni'));

CREATE TABLE alumni_profiles (
    alumni_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(institution_id) ON DELETE CASCADE,
    graduation_year INTEGER NOT NULL,
    degree VARCHAR,
    department VARCHAR,
    current_profession VARCHAR,
    current_company VARCHAR,
    current_designation VARCHAR,
    previous_experience TEXT,
    expertise TEXT,
    bio TEXT,
    linkedin_url TEXT,
    profile_image TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE alumni_skills (
    alumni_skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumni_id UUID REFERENCES alumni_profiles(alumni_id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
    proficiency_level INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(alumni_id, skill_id)
);

-- RLS
ALTER TABLE alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_skills ENABLE ROW LEVEL SECURITY;

-- alumni_profiles policies
CREATE POLICY "Alumni can manage their own profile"
    ON alumni_profiles
    FOR ALL
    USING (auth.uid() = alumni_id)
    WITH CHECK (auth.uid() = alumni_id);

-- Protect institution_id, role, is_verified from being updated by owner
-- We do this via a trigger to strictly enforce it
CREATE OR REPLACE FUNCTION protect_alumni_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.institution_id IS DISTINCT FROM OLD.institution_id THEN
        RAISE EXCEPTION 'Cannot update institution_id';
    END IF;
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
        RAISE EXCEPTION 'Cannot update is_verified status';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_protect_alumni_profile_fields
    BEFORE UPDATE ON alumni_profiles
    FOR EACH ROW
    EXECUTE FUNCTION protect_alumni_profile_fields();

-- Students and Academicians can view verified alumni from their own institution
CREATE POLICY "Institution scoped alumni visibility"
    ON alumni_profiles
    FOR SELECT
    USING (
        is_verified = true 
        AND 
        institution_id = (
            SELECT COALESCE(
                (SELECT institution_id FROM student_profiles WHERE student_id = auth.uid()),
                (SELECT institution_id FROM academician_profiles WHERE academician_id = auth.uid())
            )
        )
    );

-- alumni_skills policies
CREATE POLICY "Alumni can manage their own skills"
    ON alumni_skills
    FOR ALL
    USING (auth.uid() = alumni_id)
    WITH CHECK (auth.uid() = alumni_id);

CREATE POLICY "Institution scoped alumni skills visibility"
    ON alumni_skills
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM alumni_profiles p
            WHERE p.alumni_id = alumni_skills.alumni_id
            AND p.is_verified = true
            AND p.institution_id = (
                SELECT COALESCE(
                    (SELECT institution_id FROM student_profiles WHERE student_id = auth.uid()),
                    (SELECT institution_id FROM academician_profiles WHERE academician_id = auth.uid())
                )
            )
        )
    );
-- Migration: Alumni Community Messaging

CREATE TABLE conversations (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    last_message_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE conversation_participants (
    participant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT now(),
    last_read_at TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(user_id),
    message TEXT NOT NULL,
    reply_to_id UUID REFERENCES messages(message_id),
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender_created ON messages(sender_id, created_at);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations RLS
CREATE POLICY "Users can view their conversations"
    ON conversations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversations.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

-- Conversation Participants RLS (SELECT only, NO INSERT/UPDATE for clients)
CREATE POLICY "Users can view participants of their conversations"
    ON conversation_participants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_participants.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

-- Messages RLS
CREATE POLICY "Users can view messages in their conversations"
    ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = messages.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages to their conversations"
    ON messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = messages.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can edit their own messages"
    ON messages
    FOR UPDATE
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
    ON messages
    FOR DELETE
    USING (sender_id = auth.uid());

-- Realtime Publication
-- Create publication if it doesn't exist, though supabase_realtime normally exists.
-- Supabase specifically handles real-time via `supabase_realtime` publication.
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
-- Migration: Skill Roadmaps
CREATE TABLE skill_roadmaps (
    roadmap_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
    roadmap_json JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT now(),
    based_on_proficiency_level INTEGER NOT NULL,
    UNIQUE(student_id, skill_id)
);

ALTER TABLE skill_roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own roadmaps"
    ON skill_roadmaps
    FOR SELECT
    USING (student_id = auth.uid());

-- Service layer will handle inserts/updates securely
-- Migration: Alumni Mentorship Signal
ALTER TABLE alumni_skills
ADD COLUMN willing_to_mentor BOOLEAN DEFAULT false,
ADD COLUMN found_challenging BOOLEAN DEFAULT false;

-- Migration 28: Subtopic Skill Decomposition

CREATE TABLE skill_topic_weights (
  parent_skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
  child_skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
  weight DECIMAL DEFAULT 1.0,
  is_mandatory BOOLEAN DEFAULT false,
  PRIMARY KEY (parent_skill_id, child_skill_id)
);

CREATE INDEX idx_skill_topic_weights_parent ON skill_topic_weights(parent_skill_id);
