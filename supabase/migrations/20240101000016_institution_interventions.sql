-- Migration 16: Institution Interventions

CREATE TABLE institution_interventions (
  intervention_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(institution_id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  action_type VARCHAR, -- 'notification', 'collaboration'
  target_students JSONB, -- Array of student_ids
  readiness_snapshot JSONB, -- Snapshot of readiness at creation time
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE institution_interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage their institution's interventions" ON institution_interventions
  FOR ALL USING (institution_id IN (
    SELECT institution_id FROM institution_admins WHERE admin_id = auth.uid()
  ));
