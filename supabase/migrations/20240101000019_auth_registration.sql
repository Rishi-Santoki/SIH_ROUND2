-- Migration 19: Auth Registration Trigger

-- This function runs AFTER INSERT on auth.users (Supabase's auth table)
-- It reads the raw_user_meta_data to get full_name and role,
-- validates the role, and inserts a row into the public.users table.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    requested_role VARCHAR;
    requested_name VARCHAR;
BEGIN
    -- Extract metadata
    requested_role := new.raw_user_meta_data->>'role';
    requested_name := new.raw_user_meta_data->>'full_name';
    
    -- Default role if none provided (optional, but let's enforce explicitly)
    IF requested_role IS NULL THEN
        requested_role := 'student';
    END IF;

    -- Security Guard: Reject super_admin role assignment via public registration
    IF requested_role = 'super_admin' THEN
        RAISE EXCEPTION 'Cannot register as super_admin';
    END IF;
    
    -- Validate allowed roles
    IF requested_role NOT IN ('student', 'industry', 'academician', 'institution') THEN
        RAISE EXCEPTION 'Invalid role specified during registration';
    END IF;
    
    -- Insert into public.users
    INSERT INTO public.users (user_id, email, full_name, role, is_active)
    VALUES (
        new.id,
        new.email,
        requested_name,
        requested_role,
        true
    );
    
    RETURN NEW;
END;
$$;

-- Drop trigger if it exists just in case
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
