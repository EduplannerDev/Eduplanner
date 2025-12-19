-- 1. Crear ENUMs para estandarizar (Basado en el Glosario y Tipos de Violencia del PDF)
DO $$ BEGIN
    CREATE TYPE tipo_incidencia_enum AS ENUM (
        'portacion_armas',      -- [cite: 1231]
        'consumo_sustancias',   -- [cite: 459]
        'acoso_escolar',        -- [cite: 1219]
        'violencia_fisica',     -- [cite: 1268]
        'accidente_escolar',
        'disturbio_externo',    -- [cite: 772]
        'otro'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE nivel_riesgo_enum AS ENUM (
        'bajo',      -- Objetos prohibidos sin riesgo inminente 
        'alto',      -- Riesgo a la integridad (armas/drogas) 
        'critico'    -- Emergencia activa (disparos, heridos) [cite: 753]
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_protocolo_enum AS ENUM (
        'borrador',
        'generado',  -- Acta generada por IA
        'firmado',   -- Acta firmada y subida
        'cerrado'    -- Caso concluido con seguimiento [cite: 891]
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabla Principal de Incidencias
CREATE TABLE IF NOT EXISTS public.incidencias (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plantel_id uuid NOT NULL REFERENCES public.planteles(id),
  created_by uuid NOT NULL REFERENCES auth.users(id), -- Corregido: referencia a auth.users
  alumno_id uuid REFERENCES public.alumnos(id), -- El "portador" o involucrado 
  
  -- Datos Temporales Críticos 
  fecha_incidente timestamptz DEFAULT now() NOT NULL,
  
  -- Clasificación del Hecho
  tipo tipo_incidencia_enum NOT NULL,
  nivel_riesgo nivel_riesgo_enum NOT NULL,
  
  -- Narrativa (Input para la IA)
  descripcion_hechos text NOT NULL, -- Descripción objetiva sin juicios de valor [cite: 673]
  
  -- Datos para el Acta (Snapshot de la realidad en ese momento)
  ubicacion_detallada text, -- Ej: "Aula 3B", "Patio", "Mochila" [cite: 1230]
  objetos_asegurados text[], -- Lista de objetos: ["Navaja", "Encendedor"] 
  testigos jsonb, -- Array de nombres: ["Mtra. Ana", "Sr. Juan (Padre)"] [cite: 657]
  
  -- Lista de Verificación de Protocolo (Audit Log)
  -- Guardamos qué pasos del PDF se cumplieron
  protocolo_check jsonb DEFAULT '{
    "aviso_padres": false,
    "aviso_supervisor": false,
    "aviso_911": false,
    "resguardo_objeto": false,
    "sin_contacto_fisico": false
  }'::jsonb,
  
  -- El Documento Generado por IA
  acta_hechos_content text, -- El contenido markdown/html generado
  acta_firmada_url text, -- Link al PDF escaneado y firmado
  
  estado estado_protocolo_enum DEFAULT 'borrador',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Habilitar Seguridad (RLS) - CRÍTICO: Datos Sensibles y Confidenciales [cite: 641]
ALTER TABLE public.incidencias ENABLE ROW LEVEL SECURITY;

-- Política: Director ve TODO lo de su plantel
CREATE POLICY "Directores ven incidencias de su plantel"
ON public.incidencias
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_plantel_assignments pu  -- Corregido: nombre de tabla correcto
    WHERE pu.user_id = auth.uid()
    AND pu.role = 'director'
    AND pu.plantel_id = public.incidencias.plantel_id
    AND pu.activo = true
  )
);

-- Política: Profesores solo pueden CREAR (Insertar) reportes y VER los suyos propios (y tal vez del plantel?)
-- Ajuste: Profesores solo ven las que crearon O las de su plantel si es necesario colab? 
-- Por seguridad/privacidad, usualmente solo el director ve todo. El profesor ve lo que reportó.
CREATE POLICY "Profesores pueden reportar e inspeccionar sus incidencias"
ON public.incidencias
FOR ALL -- Insert + Select + Update propio
TO authenticated
USING (
    created_by = auth.uid() OR
    (
        -- Permitir insertar si pertenecen al plantel
        EXISTS (
            SELECT 1 FROM public.user_plantel_assignments pu
            WHERE pu.user_id = auth.uid()
            AND pu.plantel_id = public.incidencias.plantel_id
            AND pu.activo = true
        )
    )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_plantel_assignments pu
    WHERE pu.user_id = auth.uid()
    AND pu.plantel_id = public.incidencias.plantel_id
    AND pu.activo = true
  )
);
