-- Migration: Alumni Profile, Verification & Institution-Scoped Directory

-- Update the role enum
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'industry', 'academician', 'institution', 'super_admin', 'alumni'));

CREATE TABLE alumni_profiles (
    alumni_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(institution_id) ON DELETE CASCADE,
    graduation_year INTEGER NOT NULL,
    degree VARCHAR,
    department VARCHAR,
    current_profession VARCHAR,
    current_company VARCHAR,
    current_designation VARCHAR,
    previous_experience TEXT,
    expertise TEXT,
    bio TEXT,
    linkedin_url TEXT,
    profile_image TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE alumni_skills (
    alumni_skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumni_id UUID REFERENCES alumni_profiles(alumni_id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
    proficiency_level INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(alumni_id, skill_id)
);

-- RLS
ALTER TABLE alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_skills ENABLE ROW LEVEL SECURITY;

-- alumni_profiles policies
CREATE POLICY "Alumni can manage their own profile"
    ON alumni_profiles
    FOR ALL
    USING (auth.uid() = alumni_id)
    WITH CHECK (auth.uid() = alumni_id);

-- Protect institution_id, role, is_verified from being updated by owner
-- We do this via a trigger to strictly enforce it
CREATE OR REPLACE FUNCTION protect_alumni_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.institution_id IS DISTINCT FROM OLD.institution_id THEN
        RAISE EXCEPTION 'Cannot update institution_id';
    END IF;
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
        RAISE EXCEPTION 'Cannot update is_verified status';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_protect_alumni_profile_fields
    BEFORE UPDATE ON alumni_profiles
    FOR EACH ROW
    EXECUTE FUNCTION protect_alumni_profile_fields();

-- Students and Academicians can view verified alumni from their own institution
CREATE POLICY "Institution scoped alumni visibility"
    ON alumni_profiles
    FOR SELECT
    USING (
        is_verified = true 
        AND 
        institution_id = (
            SELECT COALESCE(
                (SELECT institution_id FROM student_profiles WHERE student_id = auth.uid()),
                (SELECT institution_id FROM academician_profiles WHERE academician_id = auth.uid())
            )
        )
    );

-- alumni_skills policies
CREATE POLICY "Alumni can manage their own skills"
    ON alumni_skills
    FOR ALL
    USING (auth.uid() = alumni_id)
    WITH CHECK (auth.uid() = alumni_id);

CREATE POLICY "Institution scoped alumni skills visibility"
    ON alumni_skills
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM alumni_profiles p
            WHERE p.alumni_id = alumni_skills.alumni_id
            AND p.is_verified = true
            AND p.institution_id = (
                SELECT COALESCE(
                    (SELECT institution_id FROM student_profiles WHERE student_id = auth.uid()),
                    (SELECT institution_id FROM academician_profiles WHERE academician_id = auth.uid())
                )
            )
        )
    );
