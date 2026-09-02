-- Migration 8: Trust, Verification and Notification Tables

CREATE TABLE verification_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR CHECK (entity_type IN ('institution', 'company', 'certification', 'project')),
  entity_id UUID, -- polymorphic
  submitted_by UUID REFERENCES users(user_id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  status VARCHAR CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  reviewed_at TIMESTAMP
);

CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  type VARCHAR CHECK (type IN ('application_update', 'new_match', 'deadline', 'feedback')),
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  reference_id UUID, -- polymorphic
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  action VARCHAR,
  entity_type VARCHAR,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);
