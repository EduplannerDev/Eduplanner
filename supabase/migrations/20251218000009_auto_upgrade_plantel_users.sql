-- Create function to handle auto-upgrade AND auto-downgrade based on plantel assignments

CREATE OR REPLACE FUNCTION public.handle_plantel_assignment_change()
RETURNS TRIGGER AS $$
DECLARE
    plantel_info RECORD;
    active_assignments_count INTEGER;
    target_user_id UUID;
BEGIN
    -- Determine target user_id based on operation
    IF (TG_OP = 'DELETE') THEN
        target_user_id := OLD.user_id;
    ELSE
        target_user_id := NEW.user_id;
    END IF;

    -- CASE 1: Upgrade to PRO
    -- Only on INSERT or UPDATE when setting to active
    IF (TG_OP IN ('INSERT', 'UPDATE') AND NEW.activo = true) THEN
        -- Get plantel details
        SELECT nombre, ciudad, estado INTO plantel_info
        FROM planteles
        WHERE id = NEW.plantel_id;

        UPDATE profiles
        SET 
            subscription_plan = 'pro',
            subscription_status = 'active',
            city = COALESCE(plantel_info.ciudad, city),
            state = COALESCE(plantel_info.estado, state),
            school = COALESCE(plantel_info.nombre, school),
            updated_at = NOW()
        WHERE id = target_user_id;
    END IF;

    -- CASE 2: Potentially Downgrade to FREE
    -- On DELETE or UPDATE to inactive
    IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.activo = false)) THEN
        -- Check if user has ANY other active assignments
        -- We count assignments that are active for this user
        -- Note: If this is an UPDATE, the NEW row is already committed? 
        -- Triggers are part of the transaction.
        -- For AFTER triggers, the table is already modified.
        
        SELECT COUNT(*) INTO active_assignments_count
        FROM user_plantel_assignments
        WHERE user_id = target_user_id 
          AND activo = true;
          -- We don't need to exclude current ID because:
          -- If DELETE: The row is gone, so count won't include it.
          -- If UPDATE (to false): The row exists but activo is false, so count won't include it.

        -- If no active assignments remain, downgrade
        IF active_assignments_count = 0 THEN
            UPDATE profiles
            SET 
                subscription_plan = 'free',
                -- We clear the school name since they are no longer assigned
                school = null, 
                updated_at = NOW()
            WHERE id = target_user_id;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_plantel_assignment_change ON user_plantel_assignments;
-- Also drop the old trigger name if it exists from previous attempts
DROP TRIGGER IF EXISTS on_plantel_assignment_created ON user_plantel_assignments;

CREATE TRIGGER on_plantel_assignment_change
    AFTER INSERT OR UPDATE OR DELETE ON user_plantel_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_plantel_assignment_change();
