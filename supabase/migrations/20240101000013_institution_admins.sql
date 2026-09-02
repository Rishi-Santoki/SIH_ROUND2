-- Migration 13: Institution Admins

CREATE TABLE institution_admins (
  admin_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(institution_id) ON DELETE CASCADE,
  designation VARCHAR,
  is_primary_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE institution_admins ENABLE ROW LEVEL SECURITY;

-- Admins can view their own profile
CREATE POLICY "Admins view own profile" ON institution_admins
  FOR SELECT USING (admin_id = auth.uid());

-- Admins can update their own profile
CREATE POLICY "Admins update own profile" ON institution_admins
  FOR UPDATE USING (admin_id = auth.uid());
