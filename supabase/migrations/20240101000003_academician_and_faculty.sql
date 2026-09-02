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
