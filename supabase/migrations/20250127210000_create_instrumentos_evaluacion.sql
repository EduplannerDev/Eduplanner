-- Migración: Crear tabla de instrumentos de evaluación
-- Fecha: 2025-01-27 21:00:00
-- Descripción: Tabla para almacenar rúbricas analíticas y otros instrumentos de evaluación generados por IA

-- Crear ENUM para tipos de instrumentos
CREATE TYPE instrumento_tipo AS ENUM (
  'rubrica_analitica',
  'lista_cotejo',
  'escala_estimacion'
);

-- Crear tabla de instrumentos de evaluación
CREATE TABLE instrumentos_evaluacion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  profesor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo instrumento_tipo NOT NULL DEFAULT 'rubrica_analitica',
  titulo TEXT NOT NULL,
  contenido JSONB NOT NULL,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'activo', 'archivado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_instrumentos_evaluacion_proyecto_id ON instrumentos_evaluacion(proyecto_id);
CREATE INDEX idx_instrumentos_evaluacion_profesor_id ON instrumentos_evaluacion(profesor_id);
CREATE INDEX idx_instrumentos_evaluacion_tipo ON instrumentos_evaluacion(tipo);
CREATE INDEX idx_instrumentos_evaluacion_estado ON instrumentos_evaluacion(estado);
CREATE INDEX idx_instrumentos_evaluacion_created_at ON instrumentos_evaluacion(created_at);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_instrumentos_evaluacion_updated_at
  BEFORE UPDATE ON instrumentos_evaluacion
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE instrumentos_evaluacion IS 'Tabla para almacenar instrumentos de evaluación generados por IA (rúbricas, listas de cotejo, etc.)';
COMMENT ON COLUMN instrumentos_evaluacion.proyecto_id IS 'ID del proyecto al que pertenece el instrumento';
COMMENT ON COLUMN instrumentos_evaluacion.profesor_id IS 'ID del profesor que creó el instrumento';
COMMENT ON COLUMN instrumentos_evaluacion.tipo IS 'Tipo de instrumento de evaluación';
COMMENT ON COLUMN instrumentos_evaluacion.titulo IS 'Título del instrumento de evaluación';
COMMENT ON COLUMN instrumentos_evaluacion.contenido IS 'Contenido del instrumento en formato JSON';
COMMENT ON COLUMN instrumentos_evaluacion.estado IS 'Estado del instrumento (borrador, activo, archivado)';

-- Habilitar Row Level Security (RLS)
ALTER TABLE instrumentos_evaluacion ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
-- Los profesores pueden gestionar sus propios instrumentos
CREATE POLICY "Profesores pueden gestionar sus instrumentos" ON instrumentos_evaluacion
  FOR ALL USING (
    auth.uid() = profesor_id
  );

-- Los profesores pueden ver instrumentos de proyectos de su mismo plantel
CREATE POLICY "Profesores pueden ver instrumentos de su plantel" ON instrumentos_evaluacion
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.plantel_id = p2.plantel_id
      WHERE p1.id = auth.uid() 
      AND p2.id = profesor_id
      AND p1.role = 'profesor'
    )
  );

-- Los administradores pueden gestionar todos los instrumentos
CREATE POLICY "Administradores pueden gestionar todos los instrumentos" ON instrumentos_evaluacion
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Función para obtener instrumentos de un proyecto específico
CREATE OR REPLACE FUNCTION get_project_instruments(project_id UUID)
RETURNS TABLE (
  id UUID,
  proyecto_id UUID,
  profesor_id UUID,
  tipo instrumento_tipo,
  titulo TEXT,
  contenido JSONB,
  estado TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  profesor_nombre TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ie.id,
    ie.proyecto_id,
    ie.profesor_id,
    ie.tipo,
    ie.titulo,
    ie.contenido,
    ie.estado,
    ie.created_at,
    ie.updated_at,
    COALESCE(p.nombre_completo, p.email) as profesor_nombre
  FROM instrumentos_evaluacion ie
  JOIN profiles p ON ie.profesor_id = p.id
  WHERE ie.proyecto_id = project_id
  ORDER BY ie.created_at DESC;
END;
$$;

-- Función para obtener instrumentos creados por un profesor específico
CREATE OR REPLACE FUNCTION get_professor_instruments(professor_id UUID)
RETURNS TABLE (
  id UUID,
  proyecto_id UUID,
  proyecto_nombre TEXT,
  tipo instrumento_tipo,
  titulo TEXT,
  contenido JSONB,
  estado TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ie.id,
    ie.proyecto_id,
    pr.nombre as proyecto_nombre,
    ie.tipo,
    ie.titulo,
    ie.contenido,
    ie.estado,
    ie.created_at,
    ie.updated_at
  FROM instrumentos_evaluacion ie
  JOIN proyectos pr ON ie.proyecto_id = pr.id
  WHERE ie.profesor_id = professor_id
  ORDER BY ie.created_at DESC;
END;
$$;