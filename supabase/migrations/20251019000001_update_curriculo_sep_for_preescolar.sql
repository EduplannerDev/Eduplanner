-- Migración: Actualizar tabla curriculo_sep para soportar preescolar
-- =====================================================
-- Esta migración actualiza el constraint de grado para incluir preescolar
-- usando grados negativos: -3, -2, -1 para preescolar 1°, 2°, 3°

-- 1. ACTUALIZAR CONSTRAINT DE GRADO
-- =====================================================
-- Eliminar el constraint actual
ALTER TABLE curriculo_sep DROP CONSTRAINT IF EXISTS curriculo_sep_grado_check;

-- Agregar nuevo constraint que incluya preescolar
ALTER TABLE curriculo_sep ADD CONSTRAINT curriculo_sep_grado_check 
CHECK (grado >= -3 AND grado <= 12);

-- 2. ACTUALIZAR COMENTARIOS
-- =====================================================
COMMENT ON COLUMN curriculo_sep.grado IS 'Grado escolar: preescolar (-3 a -1), primaria (1-6), secundaria (7-9), bachillerato (10-12)';

-- 3. ACTUALIZAR FUNCIONES EXISTENTES
-- =====================================================
-- Actualizar la función get_curriculo_by_grado_campo para manejar grados negativos
CREATE OR REPLACE FUNCTION get_curriculo_by_grado_campo(
    grado_param INTEGER,
    campo_formativo_param VARCHAR DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    grado INTEGER,
    campo_formativo VARCHAR,
    contenido TEXT,
    pda TEXT,
    ejes_articuladores TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.grado,
        c.campo_formativo,
        c.contenido,
        c.pda,
        c.ejes_articuladores
    FROM curriculo_sep c
    WHERE c.grado = grado_param
    AND (campo_formativo_param IS NULL OR c.campo_formativo = campo_formativo_param)
    ORDER BY c.campo_formativo, c.contenido;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar la función search_curriculo_sep para manejar grados negativos
CREATE OR REPLACE FUNCTION search_curriculo_sep(
    search_text TEXT,
    grado_param INTEGER DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    grado INTEGER,
    campo_formativo VARCHAR,
    contenido TEXT,
    pda TEXT,
    ejes_articuladores TEXT,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.grado,
        c.campo_formativo,
        c.contenido,
        c.pda,
        c.ejes_articuladores,
        ts_rank(to_tsvector('spanish', c.contenido || ' ' || c.pda), plainto_tsquery('spanish', search_text)) as relevance
    FROM curriculo_sep c
    WHERE (
        to_tsvector('spanish', c.contenido || ' ' || c.pda) @@ plainto_tsquery('spanish', search_text)
        OR c.contenido ILIKE '%' || search_text || '%'
        OR c.pda ILIKE '%' || search_text || '%'
    )
    AND (grado_param IS NULL OR c.grado = grado_param)
    ORDER BY relevance DESC, c.grado, c.campo_formativo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREAR FUNCIÓN AUXILIAR PARA CONVERTIR GRADOS
-- =====================================================
-- Función para convertir grados de preescolar a números negativos
CREATE OR REPLACE FUNCTION convert_preescolar_grado(grado_preescolar INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Convertir grados de preescolar (1, 2, 3) a números negativos (-3, -2, -1)
    CASE grado_preescolar
        WHEN 1 THEN RETURN -3; -- Preescolar 1°
        WHEN 2 THEN RETURN -2; -- Preescolar 2°
        WHEN 3 THEN RETURN -1; -- Preescolar 3°
        ELSE RETURN grado_preescolar; -- Mantener otros grados como están
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para convertir grados negativos de vuelta a preescolar
CREATE OR REPLACE FUNCTION convert_grado_to_preescolar(grado_negativo INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Convertir grados negativos de vuelta a preescolar
    CASE grado_negativo
        WHEN -3 THEN RETURN 1; -- Preescolar 1°
        WHEN -2 THEN RETURN 2; -- Preescolar 2°
        WHEN -1 THEN RETURN 3; -- Preescolar 3°
        ELSE RETURN grado_negativo; -- Mantener otros grados como están
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. COMENTARIOS PARA LAS NUEVAS FUNCIONES
-- =====================================================
COMMENT ON FUNCTION convert_preescolar_grado(INTEGER) IS 'Convierte grados de preescolar (1,2,3) a números negativos (-3,-2,-1) para almacenamiento';
COMMENT ON FUNCTION convert_grado_to_preescolar(INTEGER) IS 'Convierte grados negativos (-3,-2,-1) de vuelta a preescolar (1,2,3) para visualización';
