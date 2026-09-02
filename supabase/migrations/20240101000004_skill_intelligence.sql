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
