-- Migration 14: Assessment Answers and Reassessment tracking

CREATE TABLE assessment_answers (
    answer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID REFERENCES assessment_results(result_id) ON DELETE CASCADE,
    question_id UUID REFERENCES assessment_questions(question_id) ON DELETE CASCADE,
    submitted_answer TEXT,
    marks_awarded INTEGER,
    is_correct BOOLEAN,
    created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE student_learning_progress ADD COLUMN reassessment_completed_at TIMESTAMP;
