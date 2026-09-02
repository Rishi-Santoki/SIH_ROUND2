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
