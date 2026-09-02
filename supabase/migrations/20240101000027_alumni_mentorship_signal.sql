-- Migration: Alumni Mentorship Signal
ALTER TABLE alumni_skills
ADD COLUMN willing_to_mentor BOOLEAN DEFAULT false,
ADD COLUMN found_challenging BOOLEAN DEFAULT false;
