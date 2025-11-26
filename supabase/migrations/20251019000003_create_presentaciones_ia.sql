-- Crear tabla de presentaciones IA
CREATE TABLE IF NOT EXISTS public.presentaciones_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    fuente_tipo TEXT NOT NULL CHECK (fuente_tipo IN ('planeacion', 'proyecto', 'libre')),
    fuente_id UUID,
    diapositivas_json JSONB NOT NULL,
    tema_visual TEXT NOT NULL DEFAULT '#3498db',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_presentaciones_ia_user_id ON public.presentaciones_ia(user_id);
CREATE INDEX IF NOT EXISTS idx_presentaciones_ia_created_at ON public.presentaciones_ia(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presentaciones_ia_fuente ON public.presentaciones_ia(fuente_tipo, fuente_id);

-- Row Level Security (RLS)
ALTER TABLE public.presentaciones_ia ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
-- Los usuarios solo pueden ver sus propias presentaciones
CREATE POLICY "Users can view own presentaciones"
    ON public.presentaciones_ia
    FOR SELECT
    USING (auth.uid() = user_id);

-- Los usuarios solo pueden crear sus propias presentaciones
CREATE POLICY "Users can create own presentaciones"
    ON public.presentaciones_ia
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Los usuarios solo pueden actualizar sus propias presentaciones
CREATE POLICY "Users can update own presentaciones"
    ON public.presentaciones_ia
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Los usuarios solo pueden eliminar sus propias presentaciones
CREATE POLICY "Users can delete own presentaciones"
    ON public.presentaciones_ia
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_presentaciones_ia_updated_at
    BEFORE UPDATE ON public.presentaciones_ia
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios de documentación
COMMENT ON TABLE public.presentaciones_ia IS 'Almacena las presentaciones PowerPoint generadas con IA';
COMMENT ON COLUMN public.presentaciones_ia.fuente_tipo IS 'Tipo de fuente: planeacion, proyecto o libre';
COMMENT ON COLUMN public.presentaciones_ia.fuente_id IS 'ID de la planeación o proyecto de origen (NULL si es libre)';
COMMENT ON COLUMN public.presentaciones_ia.diapositivas_json IS 'Estructura JSON completa de la presentación generada por IA';
COMMENT ON COLUMN public.presentaciones_ia.tema_visual IS 'Color hexadecimal del tema visual de la presentación';
