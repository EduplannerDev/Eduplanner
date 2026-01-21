-- Migración: Crear tabla para registrar generaciones de IA en fichas
-- =====================================================
-- Esta tabla permite contar cuántas veces un usuario ha usado la IA para fichas
-- y aplicar límites del plan Free.

CREATE TABLE IF NOT EXISTS ficha_ai_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alumno_id UUID, -- Opcional, por si queremos saber para quién fue
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_ficha_ai_user ON ficha_ai_generations(user_id);

-- RLS
ALTER TABLE ficha_ai_generations ENABLE ROW LEVEL SECURITY;

-- Solo el usuario puede ver sus generaciones (para el contador)
CREATE POLICY "Users can view own AI generations" ON ficha_ai_generations
    FOR SELECT USING (auth.uid() = user_id);

-- Solo el usuario puede insertar (aunque realmente lo hará el Server Action con permisos, 
-- pero es buena práctica tener la policy)
CREATE POLICY "Users can insert own AI generations" ON ficha_ai_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- COMENTARIOS
COMMENT ON TABLE ficha_ai_generations IS 'Registro de uso del generador de fichas con IA para límites Freemium';
