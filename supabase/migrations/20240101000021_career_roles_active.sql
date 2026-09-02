-- Migration 21: Career Roles active flag

ALTER TABLE career_roles ADD COLUMN is_active BOOLEAN DEFAULT true;
