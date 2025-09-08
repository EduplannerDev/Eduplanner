-- Migración: Crear tabla CurriculoSEP (Biblioteca Central de Currículo)
-- =====================================================
-- Esta migración crea la tabla para almacenar el currículo oficial de la SEP
-- de forma estática. Es la fuente de verdad para el contenido curricular.

-- 1. TABLA CURRICULO_SEP
-- =====================================================
CREATE TABLE IF NOT EXISTS curriculo_sep (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grado INTEGER NOT NULL CHECK (grado >= 1 AND grado <= 12),
    campo_formativo VARCHAR(100) NOT NULL,
    contenido TEXT NOT NULL,
    pda TEXT NOT NULL, -- Proceso de Desarrollo de Aprendizaje
    ejes_articuladores TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para evitar duplicados por grado y campo formativo con el mismo contenido
    CONSTRAINT unique_grado_campo_contenido UNIQUE(grado, campo_formativo, contenido)
);

-- Índices para curriculo_sep
CREATE INDEX IF NOT EXISTS idx_curriculo_sep_grado ON curriculo_sep(grado);
CREATE INDEX IF NOT EXISTS idx_curriculo_sep_campo_formativo ON curriculo_sep(campo_formativo);
CREATE INDEX IF NOT EXISTS idx_curriculo_sep_grado_campo ON curriculo_sep(grado, campo_formativo);
CREATE INDEX IF NOT EXISTS idx_curriculo_sep_created_at ON curriculo_sep(created_at DESC);

-- Índice para búsqueda de texto completo en contenido y PDA
CREATE INDEX IF NOT EXISTS idx_curriculo_sep_contenido_text ON curriculo_sep USING gin(to_tsvector('spanish', contenido));
CREATE INDEX IF NOT EXISTS idx_curriculo_sep_pda_text ON curriculo_sep USING gin(to_tsvector('spanish', pda));

-- Trigger para updated_at en curriculo_sep
CREATE TRIGGER update_curriculo_sep_updated_at
    BEFORE UPDATE ON curriculo_sep
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE curriculo_sep IS 'Tabla para almacenar el currículo oficial de la SEP - Biblioteca Central';
COMMENT ON COLUMN curriculo_sep.grado IS 'Grado escolar del 1 al 12 (primaria: 1-6, secundaria: 7-9, bachillerato: 10-12)';
COMMENT ON COLUMN curriculo_sep.campo_formativo IS 'Campo formativo del currículo (ej: Lenguajes, Saberes y Pensamiento Científico)';
COMMENT ON COLUMN curriculo_sep.contenido IS 'Contenido oficial del currículo SEP';
COMMENT ON COLUMN curriculo_sep.pda IS 'Proceso de Desarrollo de Aprendizaje asociado al contenido';
COMMENT ON COLUMN curriculo_sep.ejes_articuladores IS 'Ejes articuladores del contenido curricular';

-- 3. POLÍTICAS RLS PARA CURRICULO_SEP
-- =====================================================
ALTER TABLE curriculo_sep ENABLE ROW LEVEL SECURITY;

-- Política para ver currículo - Todos los usuarios autenticados pueden ver
CREATE POLICY "Todos pueden ver el currículo SEP" ON curriculo_sep
    FOR SELECT USING (
        auth.uid() IS NOT NULL -- Solo usuarios autenticados
    );

-- Política para crear currículo - Solo administradores
CREATE POLICY "Solo administradores pueden crear currículo" ON curriculo_sep
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para actualizar currículo - Solo administradores
CREATE POLICY "Solo administradores pueden actualizar currículo" ON curriculo_sep
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para eliminar currículo - Solo administradores
CREATE POLICY "Solo administradores pueden eliminar currículo" ON curriculo_sep
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 4. FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener currículo por grado y campo formativo
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

-- Función para buscar en el currículo por texto
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
        ts_rank(
            to_tsvector('spanish', c.contenido || ' ' || c.pda),
            plainto_tsquery('spanish', search_text)
        ) as relevance
    FROM curriculo_sep c
    WHERE (
        to_tsvector('spanish', c.contenido || ' ' || c.pda) @@ plainto_tsquery('spanish', search_text)
    )
    AND (grado_param IS NULL OR c.grado = grado_param)
    ORDER BY relevance DESC, c.grado, c.campo_formativo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas del currículo
CREATE OR REPLACE FUNCTION get_curriculo_stats()
RETURNS TABLE(
    total_contenidos BIGINT,
    por_grado JSONB,
    por_campo_formativo JSONB,
    grados_disponibles INTEGER[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_contenidos,
        jsonb_object_agg(grado::text, count_grado) as por_grado,
        jsonb_object_agg(campo_formativo, count_campo) as por_campo_formativo,
        array_agg(DISTINCT grado ORDER BY grado) as grados_disponibles
    FROM (
        SELECT 
            grado,
            campo_formativo,
            COUNT(*) OVER (PARTITION BY grado) as count_grado,
            COUNT(*) OVER (PARTITION BY campo_formativo) as count_campo
        FROM curriculo_sep
    ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. DATOS INICIALES DE EJEMPLO (OPCIONAL)
-- =====================================================
-- Insertar algunos datos de ejemplo para diferentes campos formativos

INSERT INTO curriculo_sep (grado, campo_formativo, contenido, pda, ejes_articuladores) VALUES
-- Grado 1 - Lenguajes
(1, 'Lenguajes', 
 'Identificación de las letras del alfabeto en mayúsculas y minúsculas.',
 'Reconoce e identifica las letras del alfabeto en diferentes tipos de texto.',
 'Interculturalidad crítica, Igualdad de género, Vida saludable'),

-- Grado 1 - Saberes y Pensamiento Científico
(1, 'Saberes y Pensamiento Científico',
 'Exploración de los cinco sentidos.',
 'Identifica y describe las características de los objetos usando los cinco sentidos.',
 'Interculturalidad crítica, Vida saludable'),

-- Grado 2 - Lenguajes
(2, 'Lenguajes',
 'Lectura y escritura de palabras con sílabas simples.',
 'Lee y escribe palabras y oraciones cortas con sílabas directas.',
 'Interculturalidad crítica, Igualdad de género'),

-- Grado 3 - Ética, Naturaleza y Sociedades
(3, 'Ética, Naturaleza y Sociedades',
 'Reconocimiento de la diversidad cultural en México.',
 'Valora y respeta las diferentes culturas y tradiciones de su comunidad y país.',
 'Interculturalidad crítica, Igualdad de género, Vida saludable'),

-- Grado 4 - De lo Humano y lo Comunitario
(4, 'De lo Humano y lo Comunitario',
 'Desarrollo de habilidades socioemocionales básicas.',
 'Identifica y expresa sus emociones de manera asertiva.',
 'Vida saludable, Igualdad de género')

ON CONFLICT (grado, campo_formativo, contenido) DO NOTHING;

COMMENT ON FUNCTION get_curriculo_by_grado_campo(INTEGER, VARCHAR) IS 'Obtiene contenidos curriculares por grado y campo formativo';
COMMENT ON FUNCTION search_curriculo_sep(TEXT, INTEGER) IS 'Busca contenidos curriculares por texto en contenido y PDA';
COMMENT ON FUNCTION get_curriculo_stats() IS 'Obtiene estadísticas generales del currículo SEP';
