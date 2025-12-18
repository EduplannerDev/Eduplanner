-- Helper function to notify directors (Updated to check user_plantel_assignments)
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
            -- Directors from profiles
            SELECT id as user_id
            FROM profiles 
            WHERE role = 'director' 
            AND plantel_id = NEW.plantel_id
            
            UNION
            
            -- Directors from assignments
            SELECT user_id
            FROM user_plantel_assignments
            WHERE role = 'director'
            AND plantel_id = NEW.plantel_id
            AND (activo = true OR activo IS NULL) -- Assuming active status check
        ) AS all_directors
    LOOP
        INSERT INTO app_notifications (user_id, title, message, type, link)
        VALUES (
            director_id,
            'Nueva Planeación para Revisar',
            profesor_name || ' ha enviado "' || planeacion_title || '" para revisión.',
            'action_required',
            '/?section=administracion-plantel&tab=revisiones'
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
