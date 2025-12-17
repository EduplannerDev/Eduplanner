-- Migración: Limitar cambios de contexto por ciclo escolar
-- =====================================================
-- Restringe a los usuarios a máximo 2 cambios de grado por ciclo escolar
-- para prevenir comportamientos sospechosos (compartir cuenta)

CREATE OR REPLACE FUNCTION set_contexto_trabajo(
    profesor_id_param UUID,
    grado_param INTEGER,
    ciclo_escolar_param VARCHAR,
    notas_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    contexto_id UUID;
    count_changes INTEGER;
BEGIN
    -- Validar límite de cambios para este ciclo escolar
    -- Se cuenta cuántos registros existen ya para este profesor y este ciclo
    SELECT COUNT(*) INTO count_changes
    FROM contexto_trabajo
    WHERE profesor_id = profesor_id_param
    AND ciclo_escolar = ciclo_escolar_param;

    -- Permitimos 3 registros en total (1 inicial + 2 cambios)
    IF count_changes >= 3 THEN
        RAISE EXCEPTION 'Límite de cambios excedido. Solo puedes cambiar tu grado escolar 2 veces por ciclo. Contacta a soporte si fue un error.';
    END IF;

    -- Desactivar contexto anterior si existe
    UPDATE contexto_trabajo 
    SET es_activo = false, updated_at = NOW()
    WHERE profesor_id = profesor_id_param 
    AND es_activo = true;
    
    -- Crear nuevo contexto activo
    INSERT INTO contexto_trabajo (
        profesor_id, 
        grado, 
        ciclo_escolar, 
        es_activo, 
        notas
    ) VALUES (
        profesor_id_param, 
        grado_param, 
        ciclo_escolar_param, 
        true, 
        notas_param
    ) RETURNING id INTO contexto_id;
    
    RETURN contexto_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION set_contexto_trabajo(UUID, INTEGER, VARCHAR, TEXT) IS 'Crea o actualiza el contexto de trabajo, limitado a 2 cambios por ciclo';
