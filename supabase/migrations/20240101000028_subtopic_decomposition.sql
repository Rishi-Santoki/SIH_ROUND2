-- Migration 28: Subtopic Skill Decomposition

CREATE TABLE skill_topic_weights (
  parent_skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
  child_skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
  weight DECIMAL DEFAULT 1.0,
  is_mandatory BOOLEAN DEFAULT false,
  PRIMARY KEY (parent_skill_id, child_skill_id)
);

-- Note: We can add an index here for quick lookup
CREATE INDEX idx_skill_topic_weights_parent ON skill_topic_weights(parent_skill_id);

-- Attach skill_id to assessment questions
ALTER TABLE assessment_questions ADD COLUMN skill_id UUID REFERENCES skills(skill_id) ON DELETE SET NULL;
