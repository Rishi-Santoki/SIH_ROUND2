-- Migration 23: Outcome-Learning Batch Job Schema

-- 1. Add match_score_breakdown to applications to freeze score components
ALTER TABLE applications ADD COLUMN match_score_breakdown JSONB;

-- 2. Create weight_adjustment_proposals table
CREATE TABLE weight_adjustment_proposals (
    proposal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposed_weights JSONB NOT NULL,
    based_on_sample_size INTEGER NOT NULL,
    rationale TEXT NOT NULL,
    status VARCHAR CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE weight_adjustment_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admins full access weight_adjustment_proposals"
    ON weight_adjustment_proposals
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM users WHERE role = 'super_admin'
        )
    );

-- 3. Add weights_version to platform_settings (only if it doesn't exist, we will just add it. But platform_settings is key-value!)
-- Wait, platform_settings is a key-value store (setting_key, setting_value JSONB).
-- So we just insert a new setting_key.
INSERT INTO platform_settings (setting_key, setting_value) 
VALUES ('weights_version', '1')
ON CONFLICT (setting_key) DO NOTHING;
