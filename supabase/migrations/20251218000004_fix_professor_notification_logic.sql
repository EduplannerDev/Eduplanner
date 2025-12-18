-- Update function to notify professor on review status change (Fix for correct states)
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

    -- Handle 'aprobada' state
    IF NEW.estado = 'aprobada' THEN
        INSERT INTO app_notifications (user_id, title, message, type, link)
        VALUES (
            NEW.profesor_id,
            'Planeación Aprobada',
            'Tu planeación "' || planeacion_title || '" ha sido aprobada por la dirección.',
            'success',
            '/?section=mis-planeaciones&id=' || NEW.planeacion_id
        );
    
    -- Handle 'cambios_solicitados' state
    ELSIF NEW.estado = 'cambios_solicitados' THEN
        INSERT INTO app_notifications (user_id, title, message, type, link)
        VALUES (
            NEW.profesor_id,
            'Cambios Solicitados',
            'La dirección ha solicitado cambios en tu planeación "' || planeacion_title || '". Revisa los comentarios.',
            'warning',
            '/?section=mis-planeaciones&id=' || NEW.planeacion_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
