-- Migración: Módulo de Proyectos
-- =====================================================
-- Esta migración crea el sistema completo de proyectos educativos
-- con conexión a PDAs y fases generadas por IA

-- 1. CREAR TABLA PROYECTOS (Ficha Principal del Proyecto)
-- =====================================================
CREATE TABLE IF NOT EXISTS proyectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profesor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    problematica TEXT NOT NULL,
    producto_final VARCHAR(500) NOT NULL,
    metodologia_nem VARCHAR(255) NOT NULL,
    estado VARCHAR(50) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'activo', 'completado', 'archivado')),
    fecha_inicio DATE,
    fecha_fin DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints adicionales
    CONSTRAINT check_fechas CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);

-- Índices para proyectos
CREATE INDEX IF NOT EXISTS idx_proyectos_profesor_id ON proyectos(profesor_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_grupo_id ON proyectos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_fecha_inicio ON proyectos(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_proyectos_created_at ON proyectos(created_at);

-- Comentarios para proyectos
COMMENT ON TABLE proyectos IS 'Tabla principal que almacena la información general de cada proyecto educativo';
COMMENT ON COLUMN proyectos.profesor_id IS 'ID del profesor que creó el proyecto';
COMMENT ON COLUMN proyectos.grupo_id IS 'ID del grupo al que está asignado el proyecto';
COMMENT ON COLUMN proyectos.nombre IS 'Nombre o título del proyecto';
COMMENT ON COLUMN proyectos.problematica IS 'La problemática o tema central que se abordará en el proyecto';
COMMENT ON COLUMN proyectos.producto_final IS 'Descripción del producto final que los alumnos entregarán';
COMMENT ON COLUMN proyectos.metodologia_nem IS 'Metodología de la NEM que se utilizará (ej: Aprendizaje Basado en Proyectos Comunitarios)';
COMMENT ON COLUMN proyectos.estado IS 'Estado actual del proyecto: borrador, activo, completado, archivado';

-- 2. CREAR TABLA PROYECTO_CURRICULO (Puente entre Proyecto y PDAs)
-- =====================================================
CREATE TABLE IF NOT EXISTS proyecto_curriculo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    curriculo_id UUID NOT NULL REFERENCES curriculo_sep(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    CONSTRAINT unique_proyecto_curriculo UNIQUE(proyecto_id, curriculo_id)
);

-- Índices para proyecto_curriculo
CREATE INDEX IF NOT EXISTS idx_proyecto_curriculo_proyecto_id ON proyecto_curriculo(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_curriculo_curriculo_id ON proyecto_curriculo(curriculo_id);

-- Comentarios para proyecto_curriculo
COMMENT ON TABLE proyecto_curriculo IS 'Tabla de relación que conecta proyectos con los PDAs del currículo SEP';
COMMENT ON COLUMN proyecto_curriculo.proyecto_id IS 'ID del proyecto que se está conectando';
COMMENT ON COLUMN proyecto_curriculo.curriculo_id IS 'ID del PDA de la tabla CurriculoSEP que se está incluyendo';

-- 3. CREAR TABLA PROYECTO_FASES (Contenido Generado por IA)
-- =====================================================
CREATE TABLE IF NOT EXISTS proyecto_fases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    fase_nombre VARCHAR(255) NOT NULL,
    momento_nombre VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    orden INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para orden único por proyecto
    CONSTRAINT unique_orden_proyecto UNIQUE(proyecto_id, orden)
);

-- Índices para proyecto_fases
CREATE INDEX IF NOT EXISTS idx_proyecto_fases_proyecto_id ON proyecto_fases(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_fases_orden ON proyecto_fases(proyecto_id, orden);
CREATE INDEX IF NOT EXISTS idx_proyecto_fases_fase_nombre ON proyecto_fases(fase_nombre);

-- Comentarios para proyecto_fases
COMMENT ON TABLE proyecto_fases IS 'Tabla que almacena el contenido generado por IA para cada fase y momento del proyecto';
COMMENT ON COLUMN proyecto_fases.proyecto_id IS 'ID del proyecto al que pertenece este contenido';
COMMENT ON COLUMN proyecto_fases.fase_nombre IS 'Nombre de la Fase principal (ej: "Fase 1: Planeación")';
COMMENT ON COLUMN proyecto_fases.momento_nombre IS 'Nombre del Momento específico dentro de la fase (ej: "Momento 2: Recuperación")';
COMMENT ON COLUMN proyecto_fases.contenido IS 'Contenido generado por la IA para esta fase/momento';
COMMENT ON COLUMN proyecto_fases.orden IS 'Número de orden para mostrar las fases en secuencia correcta';

-- 4. CREAR TRIGGERS PARA UPDATED_AT
-- =====================================================
-- Trigger para proyectos
CREATE TRIGGER update_proyectos_updated_at
    BEFORE UPDATE ON proyectos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para proyecto_fases
CREATE TRIGGER update_proyecto_fases_updated_at
    BEFORE UPDATE ON proyecto_fases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en las nuevas tablas
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyecto_curriculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyecto_fases ENABLE ROW LEVEL SECURITY;

-- Políticas para proyectos
-- Los profesores pueden ver y gestionar sus propios proyectos
CREATE POLICY "Profesores can manage own projects" ON proyectos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'profesor' 
            AND activo = true
        ) AND profesor_id = auth.uid()
    );

-- Los profesores pueden ver proyectos de su mismo plantel
CREATE POLICY "Profesores can view plantel projects" ON proyectos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN grupos g ON g.plantel_id = p.plantel_id
            WHERE p.id = auth.uid() 
            AND p.role = 'profesor' 
            AND p.activo = true
            AND g.id = proyectos.grupo_id
        )
    );

-- Los administradores pueden gestionar todos los proyectos
CREATE POLICY "Admins can manage all projects" ON proyectos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'administrador' 
            AND activo = true
        )
    );

-- Políticas para proyecto_curriculo
-- Los profesores pueden gestionar las conexiones de sus proyectos
CREATE POLICY "Profesores can manage own project curriculo" ON proyecto_curriculo
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM proyectos p
            JOIN profiles pr ON pr.id = p.profesor_id
            WHERE p.id = proyecto_curriculo.proyecto_id
            AND pr.id = auth.uid()
            AND pr.role = 'profesor'
            AND pr.activo = true
        )
    );

-- Los administradores pueden gestionar todas las conexiones
CREATE POLICY "Admins can manage all project curriculo" ON proyecto_curriculo
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'administrador' 
            AND activo = true
        )
    );

-- Políticas para proyecto_fases
-- Los profesores pueden gestionar las fases de sus proyectos
CREATE POLICY "Profesores can manage own project phases" ON proyecto_fases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM proyectos p
            JOIN profiles pr ON pr.id = p.profesor_id
            WHERE p.id = proyecto_fases.proyecto_id
            AND pr.id = auth.uid()
            AND pr.role = 'profesor'
            AND pr.activo = true
        )
    );

-- Los profesores pueden ver fases de proyectos de su plantel
CREATE POLICY "Profesores can view plantel project phases" ON proyecto_fases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM proyectos p
            JOIN grupos g ON g.id = p.grupo_id
            JOIN profiles pr ON pr.plantel_id = g.plantel_id
            WHERE p.id = proyecto_fases.proyecto_id
            AND pr.id = auth.uid()
            AND pr.role = 'profesor'
            AND pr.activo = true
        )
    );

-- Los administradores pueden gestionar todas las fases
CREATE POLICY "Admins can manage all project phases" ON proyecto_fases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'administrador' 
            AND activo = true
        )
    );

-- 6. CREAR FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para obtener proyectos de un profesor
CREATE OR REPLACE FUNCTION get_professor_projects(p_professor_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    id UUID,
    nombre VARCHAR(255),
    problematica TEXT,
    producto_final VARCHAR(500),
    metodologia_nem VARCHAR(255),
    estado VARCHAR(50),
    fecha_inicio DATE,
    fecha_fin DATE,
    grupo_nombre VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nombre,
        p.problematica,
        p.producto_final,
        p.metodologia_nem,
        p.estado,
        p.fecha_inicio,
        p.fecha_fin,
        g.nombre as grupo_nombre,
        p.created_at
    FROM proyectos p
    JOIN grupos g ON g.id = p.grupo_id
    WHERE p.profesor_id = p_professor_id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener fases de un proyecto ordenadas
CREATE OR REPLACE FUNCTION get_project_phases(p_proyecto_id UUID)
RETURNS TABLE (
    id UUID,
    fase_nombre VARCHAR(255),
    momento_nombre VARCHAR(255),
    contenido TEXT,
    orden INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pf.id,
        pf.fase_nombre,
        pf.momento_nombre,
        pf.contenido,
        pf.orden,
        pf.created_at
    FROM proyecto_fases pf
    WHERE pf.proyecto_id = p_proyecto_id
    ORDER BY pf.orden ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener PDAs de un proyecto
CREATE OR REPLACE FUNCTION get_project_curriculo(p_proyecto_id UUID)
RETURNS TABLE (
    id UUID,
    curriculo_id UUID,
    contenido VARCHAR(255),
    grado INTEGER,
    materia VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id,
        pc.curriculo_id,
        cs.contenido,
        cs.grado,
        cs.materia
    FROM proyecto_curriculo pc
    JOIN curriculo_sep cs ON cs.id = pc.curriculo_id
    WHERE pc.proyecto_id = p_proyecto_id
    ORDER BY cs.grado, cs.materia, cs.contenido;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para las funciones
COMMENT ON FUNCTION get_professor_projects(UUID) IS 'Obtiene todos los proyectos de un profesor específico';
COMMENT ON FUNCTION get_project_phases(UUID) IS 'Obtiene todas las fases de un proyecto ordenadas por secuencia';
COMMENT ON FUNCTION get_project_curriculo(UUID) IS 'Obtiene todos los PDAs asociados a un proyecto';

-- 7. MENSAJE DE FINALIZACIÓN
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Módulo de proyectos creado exitosamente';
    RAISE NOTICE 'Tablas creadas: proyectos, proyecto_curriculo, proyecto_fases';
    RAISE NOTICE 'Funciones creadas: get_professor_projects, get_project_phases, get_project_curriculo';
    RAISE NOTICE 'Políticas RLS configuradas para profesores y administradores';
END $$;
