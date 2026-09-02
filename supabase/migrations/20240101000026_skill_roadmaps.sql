-- Migration: Skill Roadmaps
CREATE TABLE skill_roadmaps (
    roadmap_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
    roadmap_json JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT now(),
    based_on_proficiency_level INTEGER NOT NULL,
    UNIQUE(student_id, skill_id)
);

ALTER TABLE skill_roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own roadmaps"
    ON skill_roadmaps
    FOR SELECT
    USING (student_id = auth.uid());

-- Service layer will handle inserts/updates securely
