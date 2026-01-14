-- Migración: Soporte Multigrado para Usuarios Pro y Selección de Contexto
-- =====================================================================

-- 1. Modificar tabla contexto_trabajo
-- ===================================

-- Agregar columna 'selected' para indicar cuál de los contextos activos está actualmente en uso
ALTER TABLE contexto_trabajo 
ADD COLUMN IF NOT EXISTS selected BOOLEAN DEFAULT false;

-- Inicializar 'selected' para los registros que ya son 'es_activo'
UPDATE contexto_trabajo SET selected = true WHERE es_activo = true;

-- Eliminar índices/constraints anteriores que enforces single active context
DROP INDEX IF EXISTS idx_unique_profesor_activo;

-- Crear nuevo índice único para asegurar SOLO UN contexto SELECCIONADO por profesor
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_profesor_selected
ON contexto_trabajo(profesor_id)
WHERE selected = true;

-- Índice para búsquedas rápidas de todos los contextos activos
CREATE INDEX IF NOT EXISTS idx_contexto_trabajo_es_activo_true ON contexto_trabajo(profesor_id) WHERE es_activo = true;

-- 2. Trigger Actualizado para Validación de Límites (Free vs Pro)
-- ===============================================================

CREATE OR REPLACE FUNCTION validate_active_context_limit()
RETURNS TRIGGER AS $$
DECLARE
    user_plan text;
    active_count integer;
    max_allowed integer;
BEGIN
    -- Si no se está marcando como activo, no nos importa
    IF NEW.es_activo = false THEN
        RETURN NEW;
    END IF;

    -- Obtener el plan del usuario
    -- Asumimos que si no tiene perfil o plan definido es 'free'
    SELECT subscription_plan INTO user_plan
    FROM profiles
    WHERE id = NEW.profesor_id;

    IF user_plan IS NULL THEN
        user_plan := 'free';
    END IF;

    -- Definir límites
    IF user_plan = 'pro' THEN
        max_allowed := 3;
    ELSE
        max_allowed := 1;
    END IF;

    -- Contar cuántos activos tiene YA (excluyendo el que se está actualizando si es update)
    SELECT COUNT(*) INTO active_count
    FROM contexto_trabajo
    WHERE profesor_id = NEW.profesor_id 
    AND es_activo = true
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000');

    -- Validar
    IF active_count >= max_allowed THEN
        RAISE EXCEPTION 'Límite de grados activos alcanzado para tu plan (%). Actuales: %, Máximo: %', user_plan, active_count, max_allowed;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reemplazar el trigger anterior
DROP TRIGGER IF EXISTS trigger_validate_single_active_contexto ON contexto_trabajo;

CREATE TRIGGER trigger_validate_active_context_limit
    BEFORE INSERT OR UPDATE ON contexto_trabajo
    FOR EACH ROW
    EXECUTE FUNCTION validate_active_context_limit();


-- Trigger adicional para asegurar que cuando se seleccione uno, se deseleccionen otros
CREATE OR REPLACE FUNCTION maintain_single_selected_context()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.selected = true THEN
        UPDATE contexto_trabajo
        SET selected = false
        WHERE profesor_id = NEW.profesor_id
        AND id != NEW.id
        AND selected = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_maintain_single_selected
    BEFORE INSERT OR UPDATE ON contexto_trabajo
    FOR EACH ROW
    WHEN (NEW.selected = true)
    EXECUTE FUNCTION maintain_single_selected_context();


-- 3. Funciones RPC Actualizadas/Nuevas
-- ====================================

-- A. Obtener contexto ACTIVO Y SELECCIONADO (El "Current")
CREATE OR REPLACE FUNCTION get_contexto_trabajo_activo(profesor_id_param UUID)
RETURNS TABLE(
    id UUID,
    grado INTEGER,
    ciclo_escolar VARCHAR,
    fecha_inicio DATE,
    fecha_fin DATE,
    notas TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.grado,
        c.ciclo_escolar,
        c.fecha_inicio,
        c.fecha_fin,
        c.notas
    FROM contexto_trabajo c
    WHERE c.profesor_id = profesor_id_param
    AND c.es_activo = true
    AND c.selected = true -- Solo el seleccionado
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- B. Obtener TODOS los contextos DISPONIBLES (Activos pero no necesariamente seleccionados)
CREATE OR REPLACE FUNCTION get_available_contexts(profesor_id_param UUID)
RETURNS TABLE(
    id UUID,
    grado INTEGER,
    ciclo_escolar VARCHAR,
    selected BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.grado,
        c.ciclo_escolar,
        c.selected,
        c.created_at
    FROM contexto_trabajo c
    WHERE c.profesor_id = profesor_id_param
    AND c.es_activo = true
    ORDER BY c.grado ASC; -- Ordenado por grado
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- C. Switch Context (Cambiar selección)
CREATE OR REPLACE FUNCTION switch_context(
    profesor_id_param UUID,
    context_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    found_id UUID;
BEGIN
    -- Validar que el contexto exista y pertenezca al usuario y esté activo
    SELECT id INTO found_id
    FROM contexto_trabajo
    WHERE id = context_id_param 
    AND profesor_id = profesor_id_param
    AND es_activo = true;

    IF found_id IS NULL THEN
        RAISE EXCEPTION 'Contexto no encontrado o no activo';
    END IF;

    -- Actualizar selected
    -- El trigger trigger_maintain_single_selected se encargará de poner false a los demás
    UPDATE contexto_trabajo
    SET selected = true, updated_at = NOW()
    WHERE id = found_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- D. Actualizar set_contexto_trabajo (Para "Agregar" o "Seleccionar si existe")
--    Esta función ahora debe:
--    1. Verificar si ya existe ese grado/ciclo ACTIVO. Si sí -> Switch to it.
--    2. Si no existe -> Intentar INSERTAR (El trigger validará el límite).
--    3. Si inserta -> Marcarlo como selected (Trigger deselecciona anterior).

CREATE OR REPLACE FUNCTION set_contexto_trabajo(
    profesor_id_param UUID,
    grado_param INTEGER,
    ciclo_escolar_param VARCHAR,
    notas_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    existing_id UUID;
    new_id UUID;
BEGIN
    -- 1. Buscar si ya existe este contexto como ACTIVO
    SELECT id INTO existing_id
    FROM contexto_trabajo
    WHERE profesor_id = profesor_id_param
    AND grado = grado_param
    AND ciclo_escolar = ciclo_escolar_param
    AND es_activo = true;

    IF existing_id IS NOT NULL THEN
        -- Si existe, solo hacemos switch
        PERFORM switch_context(profesor_id_param, existing_id);
        RETURN existing_id;
    END IF;

    -- 2. Si no existe, creamos uno nuevo
    -- Nota: Si el usuario es Free y ya tiene 1, el Trigger validate_active_context_limit lanzará error.
    -- El frontend debe manejar ese error y ofrecer "Reemplazar" si es necesario.
    
    -- Para facilitar la migración de Free users (reemplazo automático si es Free), 
    -- podríamos verificar el plan aquí, pero el requerimiento dice "Pro users can have up to 3".
    -- Si asumimos que la UI manejará el "Tu plan solo permite 1, ¿quieres reemplazarlo?", 
    -- entonces aquí dejamos que falle el INSERT.
    
    -- SIN EMBARGO, para mantener compatibilidad con el comportamiento anterior para Free users (que simplemente sobreescribía),
    -- podemos hacer una lógica mixta:

    DECLARE
        user_plan text;
        active_count integer;
    BEGIN
        SELECT subscription_plan INTO user_plan FROM profiles WHERE id = profesor_id_param;
        IF user_plan IS NULL THEN user_plan := 'free'; END IF;

        SELECT COUNT(*) INTO active_count 
        FROM contexto_trabajo 
        WHERE profesor_id = profesor_id_param AND es_activo = true;

        -- Comportamiento Legacy para Free o si ya está lleno: 
        -- Si es Free y ya tiene 1, desactivamos el anterior automáticamente (Replace strategy)
        -- O si es Pro y tiene 3, hacemos lo mismo? O forzamos error?
        -- El requerimiento dice "move between dosage groups", implying switching.
        
        -- Decisión: Si está lleno, desactivamos el "selected" actual y creamos uno nuevo? 
        -- No, eso borraría el historial del anterior.
        -- Mejor: Dejar que el trigger proteja. PERO, para el caso de 'set_contexto_trabajo' que usa el onboarding,
        -- si el usuario es FREE, deberíamos reemplazar su único slot.
        
        IF user_plan = 'free' AND active_count >= 1 THEN
             UPDATE contexto_trabajo 
             SET es_activo = false 
             WHERE profesor_id = profesor_id_param AND es_activo = true;
        END IF;
        
        -- Si es PRO y está lleno (>=3), lanzamos error para que la UI le diga "Borra uno primero".
        -- El trigger lo hará.
    END;

    INSERT INTO contexto_trabajo (
        profesor_id, 
        grado, 
        ciclo_escolar, 
        es_activo, 
        selected,
        notas
    ) VALUES (
        profesor_id_param, 
        grado_param, 
        ciclo_escolar_param, 
        true, 
        true, -- Lo seleccionamos automáticamente
        notas_param
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- E. Función para eliminar/desactivar un contexto específico
CREATE OR REPLACE FUNCTION deactivate_context(
    profesor_id_param UUID,
    context_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    was_selected BOOLEAN;
    other_id UUID;
BEGIN
    SELECT selected INTO was_selected
    FROM contexto_trabajo
    WHERE id = context_id_param AND profesor_id = profesor_id_param;

    UPDATE contexto_trabajo
    SET es_activo = false, selected = false, updated_at = NOW()
    WHERE id = context_id_param AND profesor_id = profesor_id_param;

    -- Si el que borramos estaba seleccionado, intentamos seleccionar otro automáticamente para no dejar al usuario en el limbo
    IF was_selected THEN
        SELECT id INTO other_id
        FROM contexto_trabajo
        WHERE profesor_id = profesor_id_param AND es_activo = true
        ORDER BY created_at DESC
        LIMIT 1;

        IF other_id IS NOT NULL THEN
            UPDATE contexto_trabajo SET selected = true WHERE id = other_id;
        END IF;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
