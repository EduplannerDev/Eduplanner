-- Function to notify directors on new planning submission
CREATE OR REPLACE FUNCTION notify_directors_on_submission()
RETURNS TRIGGER AS $$
DECLARE
    director_record RECORD;
    profesor_name TEXT;
    planeacion_title TEXT;
BEGIN
    -- Get professor name
    SELECT COALESCE(full_name, 'Un profesor') INTO profesor_name
    FROM profiles
    WHERE id = NEW.profesor_id;

    -- Get planeacion title
    SELECT titulo INTO planeacion_title
    FROM planeaciones
    WHERE id = NEW.planeacion_id;

    -- Loop through all directors of the plantel
    FOR director_record IN 
        SELECT id 
        FROM profiles 
        WHERE role = 'director' 
        AND plantel_id = NEW.plantel_id
    LOOP
        INSERT INTO app_notifications (user_id, title, message, type, link)
        VALUES (
            director_record.id,
            'Nueva Planeación para Revisar',
            profesor_name || ' ha enviado "' || planeacion_title || '" para revisión.',
            'action_required',
            '/?section=administracion-plantel&tab=revisiones' -- Deep link to home with parameters
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On Insert Planeacion Enviada
DROP TRIGGER IF EXISTS on_planeacion_enviada_notify_directors ON planeaciones_enviadas;
CREATE TRIGGER on_planeacion_enviada_notify_directors
    AFTER INSERT ON planeaciones_enviadas
    FOR EACH ROW
    EXECUTE FUNCTION notify_directors_on_submission();


-- Function to notify professor on review status change
CREATE OR REPLACE FUNCTION notify_professor_on_review()
RETURNS TRIGGER AS $$
DECLARE
    planeacion_title TEXT;
BEGIN
    -- Only notify if status changed
    IF OLD.estado = NEW.estado THEN
        RETURN NEW;
    END IF;

    -- Get planeacion title
    SELECT titulo INTO planeacion_title
    FROM planeaciones
    WHERE id = NEW.planeacion_id;

    IF NEW.estado = 'revisada' THEN
        -- Check if comments imply approval or changes (logic depends on how you handle approval vs changes)
        -- Assuming 'revisada' means approved for now, or we look at comments
        
        INSERT INTO app_notifications (user_id, title, message, type, link)
        VALUES (
            NEW.profesor_id,
            'Planeación Revisada',
            'Tu planeación "' || planeacion_title || '" ha sido revisada por la dirección.',
            'info',
            '/?section=mis-planeaciones&id=' || NEW.planeacion_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On Update Planeacion Enviada
DROP TRIGGER IF EXISTS on_planeacion_revisada_notify_professor ON planeaciones_enviadas;
CREATE TRIGGER on_planeacion_revisada_notify_professor
    AFTER UPDATE ON planeaciones_enviadas
    FOR EACH ROW
    EXECUTE FUNCTION notify_professor_on_review();
