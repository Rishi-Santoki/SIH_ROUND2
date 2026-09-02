-- Migration 15: Super Admin Tables (Complaints and Platform Settings)

CREATE TABLE complaints (
    complaint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raised_by UUID REFERENCES users(user_id) ON DELETE CASCADE,
    against_entity_type VARCHAR CHECK (against_entity_type IN ('user', 'opportunity', 'company', 'institution', 'assessment')),
    against_entity_id UUID,
    category VARCHAR,
    description TEXT,
    status VARCHAR CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')) DEFAULT 'open',
    resolved_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    resolved_at TIMESTAMP
);

CREATE TABLE platform_settings (
    setting_key VARCHAR PRIMARY KEY,
    setting_value JSONB,
    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE learning_programs ADD COLUMN is_active BOOLEAN DEFAULT true;

-- RLS Policies
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Super Admin can do everything
CREATE POLICY "Super Admins full access complaints"
    ON complaints
    FOR ALL
    USING ( (SELECT role FROM users WHERE user_id = auth.uid()) = 'super_admin' );

CREATE POLICY "Super Admins full access platform_settings"
    ON platform_settings
    FOR ALL
    USING ( (SELECT role FROM users WHERE user_id = auth.uid()) = 'super_admin' );

-- Users can insert and read their own complaints
CREATE POLICY "Users can insert their own complaints"
    ON complaints
    FOR INSERT
    WITH CHECK ( auth.uid() = raised_by );

CREATE POLICY "Users can read their own complaints"
    ON complaints
    FOR SELECT
    USING ( auth.uid() = raised_by );

-- Seed Data
INSERT INTO platform_settings (setting_key, setting_value) VALUES 
('readiness_at_risk_threshold', '40'::jsonb),
('default_assessment_duration_minutes', '60'::jsonb),
('min_verified_evidence_rate_flag', '50'::jsonb),
('match_score_weights', '{"skills": 40, "experience": 20, "assessment": 15, "education": 10, "portfolio": 15}'::jsonb);

-- RPC for merging skills
CREATE OR REPLACE FUNCTION merge_skills(old_skill_id UUID, new_skill_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    student_count INT := 0;
    role_count INT := 0;
    opp_count INT := 0;
    prog_count INT := 0;
BEGIN
    -- student_skills: delete old if new already exists for same student, else update
    DELETE FROM student_skills 
    WHERE skill_id = old_skill_id 
      AND student_id IN (SELECT student_id FROM student_skills WHERE skill_id = new_skill_id);
    UPDATE student_skills SET skill_id = new_skill_id WHERE skill_id = old_skill_id;
    GET DIAGNOSTICS student_count = ROW_COUNT;
    
    -- role_skills: delete old if new already exists for same target_career_id
    DELETE FROM role_skills 
    WHERE skill_id = old_skill_id 
      AND target_career_id IN (SELECT target_career_id FROM role_skills WHERE skill_id = new_skill_id);
    UPDATE role_skills SET skill_id = new_skill_id WHERE skill_id = old_skill_id;
    GET DIAGNOSTICS role_count = ROW_COUNT;
    
    -- opportunity_skills: delete old if new already exists for same opportunity_id
    DELETE FROM opportunity_skills 
    WHERE skill_id = old_skill_id 
      AND opportunity_id IN (SELECT opportunity_id FROM opportunity_skills WHERE skill_id = new_skill_id);
    UPDATE opportunity_skills SET skill_id = new_skill_id WHERE skill_id = old_skill_id;
    GET DIAGNOSTICS opp_count = ROW_COUNT;
    
    -- program_skills: delete old if new already exists for same program_id
    DELETE FROM program_skills 
    WHERE skill_id = old_skill_id 
      AND program_id IN (SELECT program_id FROM program_skills WHERE skill_id = new_skill_id);
    UPDATE program_skills SET skill_id = new_skill_id WHERE skill_id = old_skill_id;
    GET DIAGNOSTICS prog_count = ROW_COUNT;
    
    -- Delete the old skill
    DELETE FROM skills WHERE skill_id = old_skill_id;
    
    RETURN jsonb_build_object(
        'student_skills_updated', student_count,
        'role_skills_updated', role_count,
        'opportunity_skills_updated', opp_count,
        'program_skills_updated', prog_count
    );
END;
$$;
