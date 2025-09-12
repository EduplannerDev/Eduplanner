-- Migración: Corregir función get_contexto_trabajo_activo
-- =====================================================
-- Esta migración corrige la función RPC sin afectar datos existentes

-- Recrear la función con la estructura correcta
CREATE OR REPLACE FUNCTION get_contexto_trabajo_activo(profesor_id_param UUID)
RETURNS TABLE(
    id UUID,
    grado INTEGER,
    ciclo_escolar VARCHAR,
    fecha_inicio DATE,
    fecha_fin DATE,
    notas TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.grado,
        c.ciclo_escolar,
        c.fecha_inicio,
        c.fecha_fin,
        c.notas
    FROM contexto_trabajo c
    WHERE c.profesor_id = profesor_id_param
    AND c.es_activo = true
    ORDER BY c.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario sobre la corrección
COMMENT ON FUNCTION get_contexto_trabajo_activo(UUID) IS 'Función corregida para obtener el contexto de trabajo activo de un profesor';

-- Verificación de la migración
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: get_contexto_trabajo_activo function fixed';
    RAISE NOTICE 'Function now returns correct field order and includes ORDER BY for consistency';
END $$;