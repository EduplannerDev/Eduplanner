-- Migración: Crear función para obtener contenidos dosificados del mes actual
-- =====================================================
-- Esta migración crea una función para obtener los contenidos curriculares
-- que han sido dosificados para el mes actual

-- Función para obtener contenidos dosificados del mes actual
CREATE OR REPLACE FUNCTION get_contenidos_mes_actual(
    profesor_id_param UUID,
    contexto_id_param UUID,
    mes_actual_param VARCHAR(3)
)
RETURNS TABLE(
    contenido_id UUID,
    grado INTEGER,
    campo_formativo VARCHAR,
    contenido TEXT,
    pda TEXT,
    ejes_articuladores TEXT,
    mes VARCHAR(3)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as contenido_id,
        c.grado,
        c.campo_formativo,
        c.contenido,
        c.pda,
        c.ejes_articuladores,
        dm.mes
    FROM dosificacion_meses dm
    JOIN curriculo_sep c ON c.id = dm.contenido_id
    WHERE dm.profesor_id = profesor_id_param
    AND dm.contexto_id = contexto_id_param
    AND dm.mes = mes_actual_param
    AND dm.seleccionado = true
    ORDER BY c.campo_formativo, c.contenido;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario sobre la función
COMMENT ON FUNCTION get_contenidos_mes_actual(UUID, UUID, VARCHAR(3)) IS 'Obtiene los contenidos curriculares dosificados para el mes actual';
