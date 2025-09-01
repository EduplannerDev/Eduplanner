-- Migración: Corregir tipos de datos en funciones RPC
-- ===================================================
-- Esta migración corrige los tipos de retorno de las funciones RPC
-- para que coincidan con los tipos reales de las columnas en las tablas

-- 1. ELIMINAR FUNCIONES EXISTENTES
-- ================================
DROP FUNCTION IF EXISTS get_available_planeaciones_for_events(UUID);
DROP FUNCTION IF EXISTS get_available_examenes_for_events(UUID);

-- 2. RECREAR FUNCIÓN DE PLANEACIONES CON TIPOS CORRECTOS
-- =====================================================
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

-- 3. RECREAR FUNCIÓN DE EXÁMENES CON TIPOS CORRECTOS
-- =================================================
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

-- 4. COMENTARIOS PARA DOCUMENTACIÓN
-- ================================
COMMENT ON FUNCTION get_available_planeaciones_for_events(UUID) IS 'Obtiene planeaciones disponibles para enlazar con eventos - tipos corregidos';
COMMENT ON FUNCTION get_available_examenes_for_events(UUID) IS 'Obtiene exámenes disponibles para enlazar con eventos - tipos corregidos';

-- 5. VERIFICACIÓN DE LA MIGRACIÓN
-- ==============================
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: RPC function types fixed';
    RAISE NOTICE 'Functions recreated with correct VARCHAR types';
    RAISE NOTICE 'This should resolve the character varying vs text type mismatch';
END $$;