-- Migración: Crear tabla de asistencia
-- =====================================
-- Esta migración crea la estructura para el sistema de asistencia

-- 1. CREAR ENUM PARA ESTADOS DE ASISTENCIA
-- ========================================
CREATE TYPE estado_asistencia AS ENUM ('presente', 'ausente', 'retardo', 'justificado');

-- 2. CREAR TABLA DE ASISTENCIA
-- ===========================
CREATE TABLE IF NOT EXISTS asistencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    estado estado_asistencia NOT NULL DEFAULT 'presente',
    notas TEXT,
    hora_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicados (un alumno solo puede tener un registro por día)
    UNIQUE(alumno_id, fecha)
);

-- 3. CREAR TRIGGER PARA UPDATED_AT
-- ===============================
CREATE TRIGGER update_asistencia_updated_at
    BEFORE UPDATE ON asistencia
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- ========================================
CREATE INDEX idx_asistencia_alumno_id ON asistencia(alumno_id);
CREATE INDEX idx_asistencia_grupo_id ON asistencia(grupo_id);
CREATE INDEX idx_asistencia_user_id ON asistencia(user_id);
CREATE INDEX idx_asistencia_fecha ON asistencia(fecha);
CREATE INDEX idx_asistencia_estado ON asistencia(estado);
CREATE INDEX idx_asistencia_alumno_fecha ON asistencia(alumno_id, fecha);
CREATE INDEX idx_asistencia_grupo_fecha ON asistencia(grupo_id, fecha);

-- 5. HABILITAR RLS (Row Level Security)
-- ===================================
ALTER TABLE asistencia ENABLE ROW LEVEL SECURITY;

-- 6. CREAR POLÍTICAS DE SEGURIDAD
-- ==============================
-- Política para que los usuarios solo puedan ver asistencia de sus grupos
CREATE POLICY "Users can view attendance for their groups" ON asistencia
    FOR SELECT USING (
        user_id = auth.uid() OR
        grupo_id IN (
            SELECT id FROM grupos WHERE user_id = auth.uid()
        )
    );

-- Política para que los usuarios solo puedan crear asistencia en sus grupos
CREATE POLICY "Users can create attendance for their groups" ON asistencia
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        grupo_id IN (
            SELECT id FROM grupos WHERE user_id = auth.uid()
        )
    );

-- Política para que los usuarios solo puedan actualizar asistencia de sus grupos
CREATE POLICY "Users can update attendance for their groups" ON asistencia
    FOR UPDATE USING (
        user_id = auth.uid() AND
        grupo_id IN (
            SELECT id FROM grupos WHERE user_id = auth.uid()
        )
    );

-- Política para que los usuarios solo puedan eliminar asistencia de sus grupos
CREATE POLICY "Users can delete attendance for their groups" ON asistencia
    FOR DELETE USING (
        user_id = auth.uid() AND
        grupo_id IN (
            SELECT id FROM grupos WHERE user_id = auth.uid()
        )
    );

-- 7. FUNCIÓN PARA OBTENER ASISTENCIA POR GRUPO Y FECHA
-- ===================================================
CREATE OR REPLACE FUNCTION get_asistencia_by_grupo_fecha(p_grupo_id UUID, p_fecha DATE)
RETURNS TABLE (
    id UUID,
    alumno_id UUID,
    alumno_nombre TEXT,
    alumno_numero_lista INTEGER,
    estado estado_asistencia,
    notas TEXT,
    hora_registro TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.alumno_id,
        al.nombre_completo as alumno_nombre,
        al.numero_lista as alumno_numero_lista,
        a.estado,
        a.notas,
        a.hora_registro
    FROM asistencia a
    JOIN alumnos al ON a.alumno_id = al.id
    WHERE a.grupo_id = p_grupo_id 
    AND a.fecha = p_fecha
    ORDER BY al.numero_lista ASC NULLS LAST, al.nombre_completo ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FUNCIÓN PARA OBTENER ESTADÍSTICAS DE ASISTENCIA
-- =================================================
CREATE OR REPLACE FUNCTION get_asistencia_stats(p_grupo_id UUID, p_fecha_inicio DATE, p_fecha_fin DATE)
RETURNS TABLE (
    total_dias INTEGER,
    total_registros BIGINT,
    presentes BIGINT,
    ausentes BIGINT,
    retardos BIGINT,
    justificados BIGINT,
    porcentaje_asistencia NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (p_fecha_fin - p_fecha_inicio + 1)::INTEGER as total_dias,
        COUNT(*) as total_registros,
        COUNT(*) FILTER (WHERE estado = 'presente') as presentes,
        COUNT(*) FILTER (WHERE estado = 'ausente') as ausentes,
        COUNT(*) FILTER (WHERE estado = 'retardo') as retardos,
        COUNT(*) FILTER (WHERE estado = 'justificado') as justificados,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND(
                    (COUNT(*) FILTER (WHERE estado IN ('presente', 'retardo', 'justificado'))::NUMERIC / COUNT(*)) * 100, 
                    2
                )
            ELSE 0
        END as porcentaje_asistencia
    FROM asistencia
    WHERE grupo_id = p_grupo_id 
    AND fecha BETWEEN p_fecha_inicio AND p_fecha_fin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. FUNCIÓN PARA MARCAR TODOS COMO PRESENTES
-- ==========================================
CREATE OR REPLACE FUNCTION marcar_todos_presentes(p_grupo_id UUID, p_fecha DATE, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    registros_creados INTEGER := 0;
    alumno_record RECORD;
BEGIN
    -- Verificar que el usuario sea dueño del grupo
    IF NOT EXISTS (
        SELECT 1 FROM grupos 
        WHERE id = p_grupo_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Usuario no autorizado para este grupo';
    END IF;
    
    -- Insertar asistencia para todos los alumnos que no tengan registro ese día
    FOR alumno_record IN 
        SELECT id FROM alumnos 
        WHERE grupo_id = p_grupo_id 
        AND id NOT IN (
            SELECT alumno_id FROM asistencia 
            WHERE grupo_id = p_grupo_id AND fecha = p_fecha
        )
    LOOP
        INSERT INTO asistencia (alumno_id, grupo_id, user_id, fecha, estado)
        VALUES (alumno_record.id, p_grupo_id, p_user_id, p_fecha, 'presente');
        
        registros_creados := registros_creados + 1;
    END LOOP;
    
    RETURN registros_creados;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. COMENTARIOS PARA DOCUMENTACIÓN
-- =================================
COMMENT ON TABLE asistencia IS 'Tabla para registrar la asistencia diaria de los alumnos';
COMMENT ON COLUMN asistencia.estado IS 'Estado de asistencia: presente, ausente, retardo, justificado';
COMMENT ON COLUMN asistencia.notas IS 'Notas adicionales sobre la asistencia (opcional)';
COMMENT ON COLUMN asistencia.hora_registro IS 'Hora en que se registró la asistencia';
COMMENT ON FUNCTION get_asistencia_by_grupo_fecha(UUID, DATE) IS 'Obtiene la asistencia de un grupo en una fecha específica';
COMMENT ON FUNCTION get_asistencia_stats(UUID, DATE, DATE) IS 'Obtiene estadísticas de asistencia para un grupo en un rango de fechas';
COMMENT ON FUNCTION marcar_todos_presentes(UUID, DATE, UUID) IS 'Marca a todos los alumnos de un grupo como presentes en una fecha específica';