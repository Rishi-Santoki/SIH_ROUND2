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
