-- Migration 12: Collaboration Applications

CREATE TABLE collaboration_applications (
  application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID REFERENCES faculty_collaborations(collaboration_id) ON DELETE CASCADE,
  academician_id UUID REFERENCES academician_profiles(academician_id) ON DELETE CASCADE,
  status VARCHAR CHECK (status IN ('applied', 'accepted', 'rejected')) DEFAULT 'applied',
  applied_at TIMESTAMP DEFAULT now()
);

ALTER TABLE collaboration_applications ENABLE ROW LEVEL SECURITY;

-- Owner can view and manage their own applications
CREATE POLICY "Academicians manage own applications" ON collaboration_applications
  FOR ALL USING (academician_id = auth.uid());

-- Companies or Academicians who own the collaboration can view applications
CREATE POLICY "Collaboration owners view applications" ON collaboration_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM faculty_collaborations fc
      LEFT JOIN recruiter_profiles rp ON fc.company_id = rp.company_id
      WHERE fc.collaboration_id = collaboration_applications.collaboration_id
      AND (fc.academician_id = auth.uid() OR rp.recruiter_id = auth.uid())
    )
  );

-- Companies or Academicians who own the collaboration can update applications (accept/reject)
CREATE POLICY "Collaboration owners manage applications" ON collaboration_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM faculty_collaborations fc
      LEFT JOIN recruiter_profiles rp ON fc.company_id = rp.company_id
      WHERE fc.collaboration_id = collaboration_applications.collaboration_id
      AND (fc.academician_id = auth.uid() OR rp.recruiter_id = auth.uid())
    )
  );
