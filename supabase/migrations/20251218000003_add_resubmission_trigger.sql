-- Trigger: On Update Planeacion Enviada (Re-envío)
-- We reuse the same function notify_directors_on_submission
-- But we need to modify the trigger condition or create a new trigger

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

        -- Loop through directors (same logic as before)
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
                '/?section=administracion-plantel&tab=revisiones'
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_planeacion_reenviada_notify_directors ON planeaciones_enviadas;
CREATE TRIGGER on_planeacion_reenviada_notify_directors
    AFTER UPDATE ON planeaciones_enviadas
    FOR EACH ROW
    EXECUTE FUNCTION notify_directors_on_resubmission();
