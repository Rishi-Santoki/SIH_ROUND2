-- Migration 18: DB-level Audit Trigger for Users Table

-- We need a function to capture changes to the users table and write to audit_logs
-- Particularly for role changes or suspensions.
-- When a user is modified directly in the DB, auth.uid() gives us the actor if executed via API,
-- but if executed via service role or direct DB connection, auth.uid() might be null.
-- We'll log the DB user or auth.uid() as the actor.

CREATE OR REPLACE FUNCTION audit_users_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    actor_id UUID;
    action_name VARCHAR;
    changes JSONB;
BEGIN
    -- Determine actor. Try auth.uid(), fallback to a system UUID or NULL
    actor_id := auth.uid();
    
    changes := '{}'::jsonb;
    action_name := 'user_updated';

    IF TG_OP = 'UPDATE' THEN
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            action_name := 'role_changed';
            changes := changes || jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role);
        END IF;
        
        IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
            IF NEW.is_active = false THEN
                action_name := 'user_suspended';
            ELSE
                action_name := 'user_reactivated';
            END IF;
            changes := changes || jsonb_build_object('old_is_active', OLD.is_active, 'new_is_active', NEW.is_active);
        END IF;
        
        -- If no tracked changes occurred, we might skip logging or log a generic update
        IF changes = '{}'::jsonb THEN
            RETURN NEW;
        END IF;
        
        INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (actor_id, action_name, 'user', NEW.user_id, changes);
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (actor_id, 'user_deleted', 'user', OLD.user_id, '{}'::jsonb);
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Drop trigger if it exists just in case
DROP TRIGGER IF EXISTS trg_audit_users_changes ON users;

CREATE TRIGGER trg_audit_users_changes
AFTER UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION audit_users_changes();
