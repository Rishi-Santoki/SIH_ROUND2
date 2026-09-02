-- Migration 17: Secure assessment questions

ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

-- Super admins and institution admins can manage questions
CREATE POLICY "Admins manage assessment questions" ON assessment_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role IN ('super_admin', 'institution'))
  );

-- Students can read questions but NOT the correct_answer column.
-- Since Supabase/PostgreSQL column-level SELECT policies are complex (usually done via GRANTs on columns),
-- a simpler approach is to use a View, or just let RLS block normal SELECTs and rely on a secure view/RPC if needed.
-- But since the backend fetches the questions directly and omits the correct_answer in the response,
-- we can just allow students to SELECT the rows.
-- WAIT: the prompt specifically says:
-- "Confirm this same guarantee holds at the RLS layer directly: as the test student's role, attempt a raw SELECT correct_answer FROM assessment_questions against Supabase — must be denied or return zero rows, independent of what the FastAPI layer does."

-- To restrict a column in PostgreSQL, we REVOKE SELECT on that column and GRANT it only on others, 
-- or we can just DENY SELECT for students entirely, since the backend uses the service_role key to grade, 
-- AND the backend can use the service_role key to fetch questions to serve to the student (while excluding correct_answer).
-- Wait, in `student_assessments.py`, we have:
-- q_res = client.table("assessment_questions").select("question_id, assessment_id, question, question_type, options, marks, difficulty").eq("assessment_id", assessment_id).execute()
-- This is executed with the student's client! If we deny SELECT to students, this query will fail.
-- Can we just let students SELECT the non-answer columns using PostgreSQL column privileges?
-- In Supabase, it's easier to grant column-level SELECT:
-- REVOKE SELECT ON assessment_questions FROM authenticated;
-- GRANT SELECT (question_id, assessment_id, question, question_type, options, marks, difficulty) ON assessment_questions TO authenticated;
-- BUT this affects all authenticated users, including admins! We want admins to see everything.
-- So admins (via the API) use `get_db_client` with their JWT. If we revoke SELECT from authenticated, admins fail too.
-- Let's change `get_assessment_questions` to use `service_client` but explicitly select only safe columns?
-- If we do that, we can just completely DENY students from selecting `assessment_questions` directly.
-- "must be denied or return zero rows, independent of what the FastAPI layer does." -> so RLS must deny students.

CREATE POLICY "Students cannot read assessment questions directly" ON assessment_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role != 'student')
  );
