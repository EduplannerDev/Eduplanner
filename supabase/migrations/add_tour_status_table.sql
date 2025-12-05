-- Migración para sistema de tours guiados

-- Crear tabla para guardar el estado del tour por usuario
CREATE TABLE IF NOT EXISTS user_tour_status (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    has_seen_tour BOOLEAN DEFAULT FALSE,
    first_seen_at TIMESTAMP WITH TIME ZONE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE user_tour_status ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver/editar su propio registro
CREATE POLICY "Users can view their own tour status"
    ON user_tour_status FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tour status"
    ON user_tour_status FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tour status"
    ON user_tour_status FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Función para marcar el tour como visto
CREATE OR REPLACE FUNCTION mark_tour_as_seen()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Obtener el ID del usuario actual
    current_user_id := auth.uid();
    
    -- Verificar que el usuario esté autenticado
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Insertar o actualizar el registro
    INSERT INTO user_tour_status (user_id, has_seen_tour, first_seen_at, last_seen_at, updated_at)
    VALUES (current_user_id, TRUE, NOW(), NOW(), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        has_seen_tour = TRUE,
        last_seen_at = NOW(),
        updated_at = NOW(),
        first_seen_at = COALESCE(user_tour_status.first_seen_at, NOW());
    
    RETURN TRUE;
END;
$$;

-- Función para verificar si el usuario ha visto el tour
CREATE OR REPLACE FUNCTION has_user_seen_tour()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    seen BOOLEAN;
BEGIN
    -- Obtener el ID del usuario actual
    current_user_id := auth.uid();
    
    -- Si no hay usuario autenticado, retornar FALSE
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar si existe un registro y si ha visto el tour
    SELECT COALESCE(has_seen_tour, FALSE) INTO seen
    FROM user_tour_status
    WHERE user_id = current_user_id;
    
    -- Si no hay registro, retornar FALSE
    RETURN COALESCE(seen, FALSE);
END;
$$;

-- Función para resetear el tour (útil para administradores o testing)
CREATE OR REPLACE FUNCTION reset_user_tour(target_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_to_reset UUID;
BEGIN
    -- Obtener el ID del usuario actual
    current_user_id := auth.uid();
    
    -- Verificar que el usuario esté autenticado
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Determinar qué usuario resetear
    IF target_user_id IS NULL THEN
        user_to_reset := current_user_id;
    ELSE
        user_to_reset := target_user_id;
    END IF;
    
    -- Resetear el tour
    UPDATE user_tour_status
    SET has_seen_tour = FALSE,
        updated_at = NOW()
    WHERE user_id = user_to_reset;
    
    -- Si no existía registro, crearlo
    IF NOT FOUND THEN
        INSERT INTO user_tour_status (user_id, has_seen_tour, updated_at)
        VALUES (user_to_reset, FALSE, NOW());
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Comentarios para documentación
COMMENT ON TABLE user_tour_status IS 'Almacena el estado del tour guiado por usuario';
COMMENT ON FUNCTION mark_tour_as_seen IS 'Marca el tour guiado como visto para el usuario actual';
COMMENT ON FUNCTION has_user_seen_tour IS 'Verifica si el usuario actual ha visto el tour guiado';
COMMENT ON FUNCTION reset_user_tour IS 'Resetea el estado del tour para un usuario (por defecto el actual)';
