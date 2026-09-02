-- Migration 1: Identity and Institution Tables

CREATE TABLE users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR,
  email VARCHAR UNIQUE,
  role VARCHAR CHECK (role IN ('student', 'industry', 'academician', 'institution', 'super_admin')),
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
