-- Migración: Crear tablas de Alumnos y Seguimiento Diario
-- =====================================================
-- Esta migración crea las tablas para gestión de alumnos
-- y su seguimiento académico diario

-- 1. TABLA ALUMNOS
-- =====================================================
CREATE TABLE IF NOT EXISTS alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo VARCHAR(255) NOT NULL,
    numero_lista INTEGER,
    foto_url TEXT,
    notas_generales TEXT,
    
    -- Información de los padres
    nombre_padre VARCHAR(255),
    correo_padre VARCHAR(255),
    telefono_padre VARCHAR(20),
    nombre_madre VARCHAR(255),
    correo_madre VARCHAR(255),
    telefono_madre VARCHAR(20),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para número de lista único por grupo
    CONSTRAINT unique_numero_lista_por_grupo UNIQUE(grupo_id, numero_lista)
);

-- Índices para alumnos
CREATE INDEX IF NOT EXISTS idx_alumnos_grupo_id ON alumnos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_alumnos_user_id ON alumnos(user_id);
CREATE INDEX IF NOT EXISTS idx_alumnos_numero_lista ON alumnos(grupo_id, numero_lista);
CREATE INDEX IF NOT EXISTS idx_alumnos_nombre ON alumnos(nombre_completo);
CREATE INDEX IF NOT EXISTS idx_alumnos_correo_padre ON alumnos(correo_padre);
CREATE INDEX IF NOT EXISTS idx_alumnos_correo_madre ON alumnos(correo_madre);

-- Trigger para updated_at en alumnos
CREATE TRIGGER update_alumnos_updated_at
    BEFORE UPDATE ON alumnos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. TABLA SEGUIMIENTO_DIARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS seguimiento_diario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    nota TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'general' CHECK (tipo IN ('general', 'academico', 'comportamiento', 'logro')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para seguimiento_diario
CREATE INDEX IF NOT EXISTS idx_seguimiento_alumno_id ON seguimiento_diario(alumno_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_user_id ON seguimiento_diario(user_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_fecha ON seguimiento_diario(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_seguimiento_tipo ON seguimiento_diario(tipo);
CREATE INDEX IF NOT EXISTS idx_seguimiento_alumno_fecha ON seguimiento_diario(alumno_id, fecha DESC);

-- Trigger para updated_at en seguimiento_diario
CREATE TRIGGER update_seguimiento_diario_updated_at
    BEFORE UPDATE ON seguimiento_diario
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE alumnos IS 'Tabla para almacenar información de los alumnos';
COMMENT ON COLUMN alumnos.grupo_id IS 'ID del grupo al que pertenece el alumno';
COMMENT ON COLUMN alumnos.user_id IS 'ID del profesor que registró al alumno';
COMMENT ON COLUMN alumnos.nombre_completo IS 'Nombre completo del alumno';
COMMENT ON COLUMN alumnos.numero_lista IS 'Número de lista del alumno en el grupo';
COMMENT ON COLUMN alumnos.foto_url IS 'URL de la foto del alumno';
COMMENT ON COLUMN alumnos.notas_generales IS 'Notas generales sobre el alumno';
COMMENT ON COLUMN alumnos.nombre_padre IS 'Nombre completo del padre';
COMMENT ON COLUMN alumnos.correo_padre IS 'Correo electrónico del padre';
COMMENT ON COLUMN alumnos.telefono_padre IS 'Teléfono del padre';
COMMENT ON COLUMN alumnos.nombre_madre IS 'Nombre completo de la madre';
COMMENT ON COLUMN alumnos.correo_madre IS 'Correo electrónico de la madre';
COMMENT ON COLUMN alumnos.telefono_madre IS 'Teléfono de la madre';

COMMENT ON TABLE seguimiento_diario IS 'Tabla para el seguimiento diario de los alumnos';
COMMENT ON COLUMN seguimiento_diario.alumno_id IS 'ID del alumno al que se refiere el seguimiento';
COMMENT ON COLUMN seguimiento_diario.user_id IS 'ID del profesor que realizó el seguimiento';
COMMENT ON COLUMN seguimiento_diario.fecha IS 'Fecha del seguimiento';
COMMENT ON COLUMN seguimiento_diario.nota IS 'Nota o comentario del seguimiento';
COMMENT ON COLUMN seguimiento_diario.tipo IS 'Tipo de seguimiento: general, academico, comportamiento, logro';

-- 4. POLÍTICAS RLS PARA ALUMNOS
-- =====================================================
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;

-- Política para ver alumnos
CREATE POLICY "Ver alumnos según rol y plantel" ON alumnos
    FOR SELECT USING (
        user_id = auth.uid() -- Profesor propietario
        OR EXISTS (
            SELECT 1 FROM grupos g
            JOIN profiles p ON p.id = auth.uid()
            WHERE g.id = alumnos.grupo_id
            AND (
                p.role = 'administrador'
                OR (p.role = 'director' AND p.plantel_id = g.plantel_id)
                OR (p.role = 'profesor' AND g.user_id = auth.uid())
            )
        )
    );

-- Política para crear alumnos
CREATE POLICY "Crear alumnos según permisos" ON alumnos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM grupos g
            JOIN profiles p ON p.id = auth.uid()
            WHERE g.id = alumnos.grupo_id
            AND (
                p.role = 'administrador'
                OR (p.role = 'director' AND p.plantel_id = g.plantel_id)
                OR (p.role = 'profesor' AND g.user_id = auth.uid())
            )
        )
    );

-- Política para actualizar alumnos
CREATE POLICY "Actualizar alumnos según permisos" ON alumnos
    FOR UPDATE USING (
        user_id = auth.uid() -- Profesor propietario
        OR EXISTS (
            SELECT 1 FROM grupos g
            JOIN profiles p ON p.id = auth.uid()
            WHERE g.id = alumnos.grupo_id
            AND (
                p.role = 'administrador'
                OR (p.role = 'director' AND p.plantel_id = g.plantel_id)
            )
        )
    );

-- Política para eliminar alumnos
CREATE POLICY "Eliminar alumnos según permisos" ON alumnos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM grupos g
            JOIN profiles p ON p.id = auth.uid()
            WHERE g.id = alumnos.grupo_id
            AND (
                p.role = 'administrador'
                OR (p.role = 'director' AND p.plantel_id = g.plantel_id)
            )
        )
    );

-- 5. POLÍTICAS RLS PARA SEGUIMIENTO_DIARIO
-- =====================================================
ALTER TABLE seguimiento_diario ENABLE ROW LEVEL SECURITY;

-- Política para ver seguimiento
CREATE POLICY "Ver seguimiento según permisos" ON seguimiento_diario
    FOR SELECT USING (
        user_id = auth.uid() -- Profesor que creó el seguimiento
        OR EXISTS (
            SELECT 1 FROM alumnos a
            JOIN grupos g ON g.id = a.grupo_id
            JOIN profiles p ON p.id = auth.uid()
            WHERE a.id = seguimiento_diario.alumno_id
            AND (
                p.role = 'administrador'
                OR (p.role = 'director' AND p.plantel_id = g.plantel_id)
                OR (p.role = 'profesor' AND g.user_id = auth.uid())
            )
        )
    );

-- Política para crear seguimiento
CREATE POLICY "Crear seguimiento según permisos" ON seguimiento_diario
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM alumnos a
            JOIN grupos g ON g.id = a.grupo_id
            JOIN profiles p ON p.id = auth.uid()
            WHERE a.id = seguimiento_diario.alumno_id
            AND (
                p.role = 'administrador'
                OR (p.role = 'director' AND p.plantel_id = g.plantel_id)
                OR (p.role = 'profesor' AND g.user_id = auth.uid())
            )
        )
    );

-- Política para actualizar seguimiento
CREATE POLICY "Actualizar seguimiento propio" ON seguimiento_diario
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- Política para eliminar seguimiento
CREATE POLICY "Eliminar seguimiento propio" ON seguimiento_diario
    FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 6. FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener estadísticas de alumnos por grupo
CREATE OR REPLACE FUNCTION get_alumnos_stats_by_grupo(grupo_id_param UUID)
RETURNS TABLE(
    total_alumnos BIGINT,
    con_foto BIGINT,
    con_datos_padre BIGINT,
    con_datos_madre BIGINT,
    con_seguimiento BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_alumnos,
        COUNT(*) FILTER (WHERE foto_url IS NOT NULL) as con_foto,
        COUNT(*) FILTER (WHERE correo_padre IS NOT NULL OR telefono_padre IS NOT NULL) as con_datos_padre,
        COUNT(*) FILTER (WHERE correo_madre IS NOT NULL OR telefono_madre IS NOT NULL) as con_datos_madre,
        COUNT(DISTINCT s.alumno_id) as con_seguimiento
    FROM alumnos a
    LEFT JOIN seguimiento_diario s ON a.id = s.alumno_id
    WHERE a.grupo_id = grupo_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener seguimiento reciente de un alumno
CREATE OR REPLACE FUNCTION get_seguimiento_reciente(alumno_id_param UUID, dias INTEGER DEFAULT 30)
RETURNS TABLE(
    fecha DATE,
    nota TEXT,
    tipo VARCHAR(20),
    profesor_nombre TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.fecha,
        s.nota,
        s.tipo,
        p.full_name as profesor_nombre
    FROM seguimiento_diario s
    JOIN profiles p ON p.id = s.user_id
    WHERE s.alumno_id = alumno_id_param
    AND s.fecha >= CURRENT_DATE - INTERVAL '%s days' % dias
    ORDER BY s.fecha DESC, s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar número de alumnos en grupo
CREATE OR REPLACE FUNCTION update_grupo_numero_alumnos()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE grupos 
        SET numero_alumnos = (
            SELECT COUNT(*) 
            FROM alumnos 
            WHERE grupo_id = NEW.grupo_id
        )
        WHERE id = NEW.grupo_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE grupos 
        SET numero_alumnos = (
            SELECT COUNT(*) 
            FROM alumnos 
            WHERE grupo_id = OLD.grupo_id
        )
        WHERE id = OLD.grupo_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente el número de alumnos
CREATE TRIGGER trigger_update_grupo_numero_alumnos
    AFTER INSERT OR DELETE ON alumnos
    FOR EACH ROW
    EXECUTE FUNCTION update_grupo_numero_alumnos();

COMMENT ON FUNCTION get_alumnos_stats_by_grupo(UUID) IS 'Obtiene estadísticas de alumnos para un grupo específico';
COMMENT ON FUNCTION get_seguimiento_reciente(UUID, INTEGER) IS 'Obtiene el seguimiento reciente de un alumno';
COMMENT ON FUNCTION update_grupo_numero_alumnos() IS 'Actualiza automáticamente el número de alumnos en un grupo';
COMMENT ON TRIGGER trigger_update_grupo_numero_alumnos ON alumnos IS 'Trigger que actualiza el contador de alumnos en grupos';