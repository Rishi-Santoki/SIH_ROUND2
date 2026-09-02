-- Migration 10: Indexes

CREATE INDEX idx_student_skills_lookup ON student_skills(student_id, skill_id);
CREATE INDEX idx_opportunity_skills_lookup ON opportunity_skills(opportunity_id, skill_id);
CREATE INDEX idx_role_skills_lookup ON role_skills(career_role_id, skill_id);

CREATE INDEX idx_applications_student_status ON applications(student_id, status);
CREATE INDEX idx_applications_opportunity_status ON applications(opportunity_id, status);

CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- pgvector index on document_chunks
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_audit_logs_actor_date ON audit_logs(actor_id, created_at);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
