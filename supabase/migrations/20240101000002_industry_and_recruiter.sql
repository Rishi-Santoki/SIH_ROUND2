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
