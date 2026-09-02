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
