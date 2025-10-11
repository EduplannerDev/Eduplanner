-- Migración: Crear tabla para controlar modal de bienvenida
-- =====================================================
-- Esta migración crea una tabla para registrar qué usuarios ya han visto el modal de bienvenida

-- 1. CREAR TABLA USER_WELCOME_MODAL
-- =====================================================

CREATE TABLE IF NOT EXISTS user_welcome_modal (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    has_seen_welcome_modal BOOLEAN NOT NULL DEFAULT FALSE,
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Restricción única para que cada usuario tenga solo un registro
    UNIQUE(user_id)
);

-- 2. HABILITAR RLS
-- =====================================================

ALTER TABLE user_welcome_modal ENABLE ROW LEVEL SECURITY;

-- 3. CREAR POLÍTICAS RLS
-- =====================================================

-- Política para que usuarios puedan ver y modificar solo su propio registro
CREATE POLICY "Usuarios pueden ver su propio registro de modal" ON user_welcome_modal
    FOR SELECT USING (user_id = auth.uid());

-- Política para que usuarios puedan insertar su propio registro
CREATE POLICY "Usuarios pueden insertar su propio registro de modal" ON user_welcome_modal
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Política para que usuarios puedan actualizar su propio registro
CREATE POLICY "Usuarios pueden actualizar su propio registro de modal" ON user_welcome_modal
    FOR UPDATE USING (user_id = auth.uid());

-- Política para que administradores puedan ver todos los registros
CREATE POLICY "Administradores pueden ver todos los registros de modal" ON user_welcome_modal
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'administrador'
        )
    );

-- 4. CREAR FUNCIÓN PARA MARCAR MODAL COMO VISTO
-- =====================================================

CREATE OR REPLACE FUNCTION mark_welcome_modal_as_seen()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Intentar actualizar el registro existente
    UPDATE user_welcome_modal 
    SET 
        has_seen_welcome_modal = TRUE,
        last_seen_at = NOW(),
        updated_at = NOW()
    WHERE user_id = auth.uid();
    
    -- Si no se actualizó ningún registro, insertar uno nuevo
    IF NOT FOUND THEN
        INSERT INTO user_welcome_modal (user_id, has_seen_welcome_modal, first_seen_at, last_seen_at)
        VALUES (auth.uid(), TRUE, NOW(), NOW());
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 5. CREAR FUNCIÓN PARA VERIFICAR SI EL USUARIO HA VISTO EL MODAL
-- =====================================================

CREATE OR REPLACE FUNCTION has_user_seen_welcome_modal()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_seen BOOLEAN;
BEGIN
    SELECT COALESCE(has_seen_welcome_modal, FALSE)
    INTO has_seen
    FROM user_welcome_modal
    WHERE user_id = auth.uid();
    
    RETURN COALESCE(has_seen, FALSE);
END;
$$;

-- 6. CREAR FUNCIÓN PARA RESETEAR EL MODAL (SOLO PARA ADMINISTRADORES)
-- =====================================================

CREATE OR REPLACE FUNCTION reset_user_welcome_modal(target_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar que el usuario actual sea administrador
    IF NOT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'administrador'
    ) THEN
        RAISE EXCEPTION 'Solo los administradores pueden resetear el modal de bienvenida';
    END IF;
    
    -- Si no se especifica usuario, resetear el del usuario actual
    IF target_user_id IS NULL THEN
        target_user_id := auth.uid();
    END IF;
    
    -- Actualizar o insertar el registro
    INSERT INTO user_welcome_modal (user_id, has_seen_welcome_modal, first_seen_at, last_seen_at)
    VALUES (target_user_id, FALSE, NOW(), NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        has_seen_welcome_modal = FALSE,
        last_seen_at = NOW(),
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;

-- 7. CREAR TRIGGER PARA ACTUALIZAR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_welcome_modal_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_welcome_modal_updated_at
    BEFORE UPDATE ON user_welcome_modal
    FOR EACH ROW
    EXECUTE FUNCTION update_user_welcome_modal_updated_at();

-- 8. COMENTARIOS
-- =====================================================

COMMENT ON TABLE user_welcome_modal IS 'Registra qué usuarios han visto el modal de bienvenida';
COMMENT ON COLUMN user_welcome_modal.user_id IS 'ID del usuario de auth.users';
COMMENT ON COLUMN user_welcome_modal.has_seen_welcome_modal IS 'Indica si el usuario ha visto el modal de bienvenida';
COMMENT ON COLUMN user_welcome_modal.first_seen_at IS 'Primera vez que se registró la vista del modal';
COMMENT ON COLUMN user_welcome_modal.last_seen_at IS 'Última vez que se actualizó el registro';

COMMENT ON FUNCTION mark_welcome_modal_as_seen() IS 'Marca el modal de bienvenida como visto para el usuario actual';
COMMENT ON FUNCTION has_user_seen_welcome_modal() IS 'Verifica si el usuario actual ha visto el modal de bienvenida';
COMMENT ON FUNCTION reset_user_welcome_modal(UUID) IS 'Resetea el estado del modal para un usuario (solo administradores)';

-- 9. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_welcome_modal_user_id ON user_welcome_modal(user_id);
CREATE INDEX IF NOT EXISTS idx_user_welcome_modal_has_seen ON user_welcome_modal(has_seen_welcome_modal);
