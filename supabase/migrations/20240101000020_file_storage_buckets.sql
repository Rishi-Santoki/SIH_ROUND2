-- Migration 20: File Storage Buckets and RLS

-- Add media_url to projects
ALTER TABLE projects ADD COLUMN media_url TEXT;

-- We rely on Supabase's storage schema which is typically pre-installed
-- Insert the buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('resumes', 'resumes', false),
('profile-images', 'profile-images', true), -- Public read
('company-logos', 'company-logos', true), -- Public read
('certificates', 'certificates', false),
('project-media', 'project-media', false),
('knowledge-base', 'knowledge-base', false)
ON CONFLICT (id) DO NOTHING;

-- Normally, we would write RLS policies for storage.objects here.
-- The prompt specifies that authorization logic is primarily handled in the FastAPI signed-url retrieval logic for private buckets.
-- However, we can add basic RLS to ensure direct access isn't permitted outside of the service role for private buckets.
-- Public buckets can be read by anyone.

-- Enable RLS on storage.objects if not already enabled (Supabase standard)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read for profile-images
CREATE POLICY "Public Access for profile-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

-- Allow public read for company-logos
CREATE POLICY "Public Access for company-logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Allow service role full access (which the backend uses via get_service_client when needed, 
-- though it will usually use the user's token. Wait, if it uses the user's token, the user needs SELECT/INSERT/DELETE).
-- For this backend architecture, we will manage strict file-level authorization via `GET /files/signed-url` and `POST /files/upload`
-- passing the user's token. So the user must be able to insert/select their own files.

-- Users can insert objects into any bucket where the path starts with their user_id
CREATE POLICY "Users can insert their own files"
ON storage.objects FOR INSERT
WITH CHECK (
    auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Users can select their own files
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (
    auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
    auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Admins / Service Role bypasses these via the service_role key automatically.
