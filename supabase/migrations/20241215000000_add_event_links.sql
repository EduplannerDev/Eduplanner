-- Migración: Agregar enlaces a planeaciones y exámenes en eventos
-- ==========================================================
-- Esta migración agrega campos para enlazar eventos con planeaciones y exámenes

-- 1. AGREGAR COLUMNAS DE ENLACE A LA TABLA EVENTS
-- ===============================================
ALTER TABLE events 
ADD COLUMN linked_planeacion_id UUID REFERENCES planeaciones(id) ON DELETE SET NULL,
ADD COLUMN linked_examen_id UUID REFERENCES examenes(id) ON DELETE SET NULL;

-- Las columnas de examenes mantienen sus tipos originales (VARCHAR)

-- 2. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- ========================================
CREATE INDEX idx_events_linked_planeacion ON events(linked_planeacion_id) WHERE linked_planeacion_id IS NOT NULL;
CREATE INDEX idx_events_linked_examen ON events(linked_examen_id) WHERE linked_examen_id IS NOT NULL;

-- 3. AGREGAR COMENTARIOS PARA DOCUMENTACIÓN
-- ========================================
COMMENT ON COLUMN events.linked_planeacion_id IS 'ID de la planeación enlazada al evento (opcional)';
COMMENT ON COLUMN events.linked_examen_id IS 'ID del examen enlazado al evento (opcional)';

-- 4. FUNCIÓN PARA OBTENER EVENTOS CON SUS ENLACES
-- ==============================================
CREATE OR REPLACE FUNCTION get_events_with_links(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    description TEXT,
    category event_category,
    event_date DATE,
    event_time TIME,
    hashtags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    linked_planeacion_id UUID,
    linked_examen_id UUID,
    planeacion_title TEXT,
    examen_title TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.user_id,
        e.title,
        e.description,
        e.category,
        e.event_date,
        e.event_time,
        e.hashtags,
        e.created_at,
        e.updated_at,
        e.linked_planeacion_id,
        e.linked_examen_id,
        p.titulo as planeacion_title,
        ex.title as examen_title
    FROM events e
    LEFT JOIN planeaciones p ON e.linked_planeacion_id = p.id
    LEFT JOIN examenes ex ON e.linked_examen_id = ex.id
    WHERE e.user_id = user_uuid
    ORDER BY e.event_date ASC, e.event_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNCIÓN PARA OBTENER PLANEACIONES DISPONIBLES PARA ENLAZAR
-- ============================================================
DROP FUNCTION IF EXISTS get_available_planeaciones_for_events(UUID);

CREATE FUNCTION get_available_planeaciones_for_events(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    titulo VARCHAR(255),
    materia VARCHAR(100),
    grado VARCHAR(50),
    grupo TEXT,
    fecha_inicio TEXT,
    fecha_fin TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.titulo,
        COALESCE(p.materia, 'Sin materia'),
        COALESCE(p.grado, 'N/A'),
        'N/A'::TEXT as grupo,
        p.created_at::DATE::TEXT as fecha_inicio,
        p.created_at::DATE::TEXT as fecha_fin
    FROM planeaciones p
    WHERE p.user_id = user_uuid
    AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC, p.titulo ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCIÓN PARA OBTENER EXÁMENES DISPONIBLES PARA ENLAZAR
-- ========================================================
DROP FUNCTION IF EXISTS get_available_examenes_for_events(UUID);

CREATE FUNCTION get_available_examenes_for_events(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    titulo VARCHAR(255),
    materia VARCHAR(100),
    grado TEXT,
    grupo TEXT,
    fecha_examen TEXT,
    duracion_minutos INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        COALESCE(e.title, 'Sin título') as titulo,
        COALESCE(e.subject, 'Sin materia') as materia,
        'N/A'::TEXT as grado,
        'N/A'::TEXT as grupo,
        e.created_at::DATE::TEXT as fecha_examen,
        0 as duracion_minutos
    FROM examenes e
    WHERE e.owner_id = user_uuid
    ORDER BY e.created_at DESC, e.title ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. TRIGGER PARA VALIDAR QUE NO SE ENLACEN AMBOS TIPOS A LA VEZ
-- =============================================================
CREATE OR REPLACE FUNCTION validate_event_links()
RETURNS TRIGGER AS $$
BEGIN
    -- Un evento no puede estar enlazado a una planeación Y un examen al mismo tiempo
    IF NEW.linked_planeacion_id IS NOT NULL AND NEW.linked_examen_id IS NOT NULL THEN
        RAISE EXCEPTION 'Un evento no puede estar enlazado a una planeación y un examen al mismo tiempo';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_event_links_trigger
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION validate_event_links();

-- 8. COMENTARIOS FINALES
-- ======================
COMMENT ON FUNCTION get_events_with_links(UUID) IS 'Obtiene eventos con información de planeaciones y exámenes enlazados';
COMMENT ON FUNCTION get_available_planeaciones_for_events(UUID) IS 'Obtiene planeaciones disponibles para enlazar a eventos';
COMMENT ON FUNCTION get_available_examenes_for_events(UUID) IS 'Obtiene exámenes disponibles para enlazar a eventos';
COMMENT ON FUNCTION validate_event_links() IS 'Valida que un evento no esté enlazado a planeación y examen simultáneamente';