-- Fix notification link for directors to point to Director Dashboard
-- Update logic in notify_directors_on_submission and notify_directors_on_resubmission

CREATE OR REPLACE FUNCTION notify_directors_on_submission()
RETURNS TRIGGER AS $$
DECLARE
    profesor_name TEXT;
    planeacion_title TEXT;
    director_id UUID;
BEGIN
    -- Get professor name
    SELECT COALESCE(full_name, 'Un profesor') INTO profesor_name
    FROM profiles
    WHERE id = NEW.profesor_id;

    -- Get planeacion title
    SELECT titulo INTO planeacion_title
    FROM planeaciones
    WHERE id = NEW.planeacion_id;

    -- Create a temporary table or cursor to hold distinct directors
    FOR director_id IN 
        SELECT DISTINCT user_id 
        FROM (
            SELECT id as user_id FROM profiles 
            WHERE role = 'director' AND plantel_id = NEW.plantel_id
            UNION
            SELECT user_id FROM user_plantel_assignments
            WHERE role = 'director' AND plantel_id = NEW.plantel_id AND (activo = true OR activo IS NULL)
        ) AS all_directors
    LOOP
        INSERT INTO app_notifications (user_id, title, message, type, link)
        VALUES (
            director_id,
            'Nueva Planeación para Revisar',
            profesor_name || ' ha enviado "' || planeacion_title || '" para revisión.',
            'action_required',
            '/?section=director-dashboard&tab=planeaciones' -- Updated to Director Dashboard
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION notify_directors_on_resubmission()
RETURNS TRIGGER AS $$
DECLARE
    profesor_name TEXT;
    planeacion_title TEXT;
    director_id UUID;
BEGIN
    -- Only notify if status changed to 'pendiente' (re-submission)
    IF NEW.estado = 'pendiente' AND OLD.estado != 'pendiente' THEN
        
        -- Get professor name
        SELECT COALESCE(full_name, 'Un profesor') INTO profesor_name
        FROM profiles
        WHERE id = NEW.profesor_id;

        -- Get planeacion title
        SELECT titulo INTO planeacion_title
        FROM planeaciones
        WHERE id = NEW.planeacion_id;

        -- Loop through directors
        FOR director_id IN 
            SELECT DISTINCT user_id 
            FROM (
                SELECT id as user_id FROM profiles 
                WHERE role = 'director' AND plantel_id = NEW.plantel_id
                UNION
                SELECT user_id FROM user_plantel_assignments
                WHERE role = 'director' AND plantel_id = NEW.plantel_id AND (activo = true OR activo IS NULL)
            ) AS all_directors
        LOOP
            INSERT INTO app_notifications (user_id, title, message, type, link)
            VALUES (
                director_id,
                'Planeación Re-enviada',
                profesor_name || ' ha corregido y re-enviado "' || planeacion_title || '" para revisión.',
                'action_required',
                '/?section=director-dashboard&tab=planeaciones' -- Updated to Director Dashboard
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
