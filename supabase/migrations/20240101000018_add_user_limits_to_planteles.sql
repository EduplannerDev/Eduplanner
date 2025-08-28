-- Migración: Agregar límites de usuarios a planteles
-- =====================================================
-- Esta migración agrega campos para controlar el número máximo
-- de usuarios que pueden ser asignados a cada plantel

-- 1. AGREGAR COLUMNAS DE LÍMITES A PLANTELES
-- =====================================================

-- Límite máximo de usuarios totales por plantel
ALTER TABLE planteles 
ADD COLUMN IF NOT EXISTS max_usuarios INTEGER DEFAULT 50;

-- Límite máximo de profesores por plantel
ALTER TABLE planteles 
ADD COLUMN IF NOT EXISTS max_profesores INTEGER DEFAULT 40;

-- Límite máximo de directores por plantel (normalmente 1-3)
ALTER TABLE planteles 
ADD COLUMN IF NOT EXISTS max_directores INTEGER DEFAULT 3;

-- Plan de suscripción del plantel
ALTER TABLE planteles 
ADD COLUMN IF NOT EXISTS plan_suscripcion TEXT DEFAULT 'basico' CHECK (plan_suscripcion IN ('basico', 'premium', 'enterprise'));

-- Estado de la suscripción del plantel
ALTER TABLE planteles 
ADD COLUMN IF NOT EXISTS estado_suscripcion TEXT DEFAULT 'activa' CHECK (estado_suscripcion IN ('activa', 'suspendida', 'cancelada', 'trial'));

-- Fecha de vencimiento de la suscripción
ALTER TABLE planteles 
ADD COLUMN IF NOT EXISTS fecha_vencimiento TIMESTAMP WITH TIME ZONE;

-- 2. CREAR ÍNDICES PARA LAS NUEVAS COLUMNAS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_planteles_plan_suscripcion ON planteles(plan_suscripcion);
CREATE INDEX IF NOT EXISTS idx_planteles_estado_suscripcion ON planteles(estado_suscripcion);
CREATE INDEX IF NOT EXISTS idx_planteles_fecha_vencimiento ON planteles(fecha_vencimiento);

-- 3. COMENTARIOS PARA LAS NUEVAS COLUMNAS
-- =====================================================
COMMENT ON COLUMN planteles.max_usuarios IS 'Límite máximo de usuarios totales que pueden ser asignados al plantel';
COMMENT ON COLUMN planteles.max_profesores IS 'Límite máximo de profesores que pueden ser asignados al plantel';
COMMENT ON COLUMN planteles.max_directores IS 'Límite máximo de directores que pueden ser asignados al plantel';
COMMENT ON COLUMN planteles.plan_suscripcion IS 'Plan de suscripción del plantel (basico, premium, enterprise)';
COMMENT ON COLUMN planteles.estado_suscripcion IS 'Estado actual de la suscripción del plantel';
COMMENT ON COLUMN planteles.fecha_vencimiento IS 'Fecha de vencimiento de la suscripción del plantel';

-- 4. FUNCIÓN PARA OBTENER CONTEO ACTUAL DE USUARIOS POR PLANTEL
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_plantel_user_count(plantel_id UUID)
RETURNS TABLE(
    total_usuarios INTEGER,
    total_profesores INTEGER,
    total_directores INTEGER,
    total_administradores INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_usuarios,
        COUNT(CASE WHEN role = 'profesor' THEN 1 END)::INTEGER as total_profesores,
        COUNT(CASE WHEN role = 'director' THEN 1 END)::INTEGER as total_directores,
        COUNT(CASE WHEN role = 'administrador' THEN 1 END)::INTEGER as total_administradores
    FROM (
        -- Usuarios con plantel_id principal
        SELECT role FROM profiles 
        WHERE plantel_id = get_plantel_user_count.plantel_id 
        AND activo = true
        
        UNION
        
        -- Usuarios asignados a través de user_plantel_assignments
        SELECT upa.role FROM user_plantel_assignments upa
        JOIN profiles p ON upa.user_id = p.id
        WHERE upa.plantel_id = get_plantel_user_count.plantel_id 
        AND p.activo = true
        AND upa.activo = true
    ) combined_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNCIÓN PARA VERIFICAR SI SE PUEDE AGREGAR UN USUARIO AL PLANTEL
-- =====================================================
CREATE OR REPLACE FUNCTION public.can_add_user_to_plantel(
    plantel_id UUID, 
    user_role user_role
)
RETURNS BOOLEAN AS $$
DECLARE
    current_counts RECORD;
    plantel_limits RECORD;
BEGIN
    -- Obtener límites del plantel
    SELECT max_usuarios, max_profesores, max_directores, estado_suscripcion
    INTO plantel_limits
    FROM planteles 
    WHERE id = plantel_id;
    
    -- Verificar que el plantel existe y está activo
    IF plantel_limits IS NULL OR plantel_limits.estado_suscripcion != 'activa' THEN
        RETURN FALSE;
    END IF;
    
    -- Obtener conteos actuales
    SELECT * INTO current_counts
    FROM public.get_plantel_user_count(plantel_id);
    
    -- Verificar límite total de usuarios
    IF current_counts.total_usuarios >= plantel_limits.max_usuarios THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar límites específicos por rol
    CASE user_role
        WHEN 'profesor' THEN
            IF current_counts.total_profesores >= plantel_limits.max_profesores THEN
                RETURN FALSE;
            END IF;
        WHEN 'director' THEN
            IF current_counts.total_directores >= plantel_limits.max_directores THEN
                RETURN FALSE;
            END IF;
        WHEN 'administrador' THEN
            -- Los administradores no tienen límite específico por plantel
            NULL;
    END CASE;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCIÓN PARA OBTENER INFORMACIÓN COMPLETA DEL PLANTEL CON LÍMITES
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_plantel_info_with_limits(plantel_id UUID)
RETURNS TABLE(
    id UUID,
    nombre TEXT,
    plan_suscripcion TEXT,
    estado_suscripcion TEXT,
    fecha_vencimiento TIMESTAMP WITH TIME ZONE,
    max_usuarios INTEGER,
    max_profesores INTEGER,
    max_directores INTEGER,
    usuarios_actuales INTEGER,
    profesores_actuales INTEGER,
    directores_actuales INTEGER,
    administradores_actuales INTEGER,
    usuarios_disponibles INTEGER,
    profesores_disponibles INTEGER,
    directores_disponibles INTEGER
) AS $$
DECLARE
    current_counts RECORD;
BEGIN
    -- Obtener conteos actuales
    SELECT * INTO current_counts
    FROM public.get_plantel_user_count(plantel_id);
    
    RETURN QUERY
    SELECT 
        p.id,
        p.nombre,
        p.plan_suscripcion,
        p.estado_suscripcion,
        p.fecha_vencimiento,
        p.max_usuarios,
        p.max_profesores,
        p.max_directores,
        current_counts.total_usuarios as usuarios_actuales,
        current_counts.total_profesores as profesores_actuales,
        current_counts.total_directores as directores_actuales,
        current_counts.total_administradores as administradores_actuales,
        (p.max_usuarios - current_counts.total_usuarios) as usuarios_disponibles,
        (p.max_profesores - current_counts.total_profesores) as profesores_disponibles,
        (p.max_directores - current_counts.total_directores) as directores_disponibles
    FROM planteles p
    WHERE p.id = plantel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ACTUALIZAR PLANTELES EXISTENTES CON LÍMITES SEGÚN EL PLAN
-- =====================================================
UPDATE planteles 
SET 
    plan_suscripcion = 'basico',
    estado_suscripcion = 'activa',
    max_usuarios = CASE 
        WHEN plan_suscripcion = 'premium' THEN 100
        WHEN plan_suscripcion = 'enterprise' THEN 500
        ELSE 50
    END,
    max_profesores = CASE 
        WHEN plan_suscripcion = 'premium' THEN 80
        WHEN plan_suscripcion = 'enterprise' THEN 400
        ELSE 40
    END,
    max_directores = CASE 
        WHEN plan_suscripcion = 'premium' THEN 5
        WHEN plan_suscripcion = 'enterprise' THEN 10
        ELSE 3
    END,
    updated_at = NOW()
WHERE plan_suscripcion IS NULL;

-- 8. CREAR VISTA PARA INFORMACIÓN DE PLANTELES CON LÍMITES
-- =====================================================
CREATE OR REPLACE VIEW planteles_with_limits AS
SELECT 
    p.*,
    COALESCE(user_counts.total_usuarios, 0) as usuarios_actuales,
    COALESCE(user_counts.total_profesores, 0) as profesores_actuales,
    COALESCE(user_counts.total_directores, 0) as directores_actuales,
    COALESCE(user_counts.total_administradores, 0) as administradores_actuales,
    (p.max_usuarios - COALESCE(user_counts.total_usuarios, 0)) as usuarios_disponibles,
    (p.max_profesores - COALESCE(user_counts.total_profesores, 0)) as profesores_disponibles,
    (p.max_directores - COALESCE(user_counts.total_directores, 0)) as directores_disponibles,
    CASE 
        WHEN p.estado_suscripcion = 'activa' AND (p.fecha_vencimiento IS NULL OR p.fecha_vencimiento > NOW()) THEN true
        ELSE false
    END as suscripcion_vigente
FROM planteles p
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*)::INTEGER as total_usuarios,
        COUNT(CASE WHEN role = 'profesor' THEN 1 END)::INTEGER as total_profesores,
        COUNT(CASE WHEN role = 'director' THEN 1 END)::INTEGER as total_directores,
        COUNT(CASE WHEN role = 'administrador' THEN 1 END)::INTEGER as total_administradores
    FROM (
        SELECT role FROM profiles 
        WHERE plantel_id = p.id AND activo = true
        UNION
        SELECT upa.role FROM user_plantel_assignments upa
        JOIN profiles prof ON upa.user_id = prof.id
        WHERE upa.plantel_id = p.id AND prof.activo = true AND upa.activo = true
    ) combined_users
) user_counts ON true;

-- 9. CONFIGURAR PERMISOS
-- =====================================================
ALTER VIEW planteles_with_limits OWNER TO postgres;
GRANT SELECT ON planteles_with_limits TO authenticated;
GRANT SELECT ON planteles_with_limits TO service_role;

-- 10. TRIGGER PARA VALIDAR LÍMITES ANTES DE ASIGNAR USUARIOS
-- =====================================================
CREATE OR REPLACE FUNCTION validate_user_assignment_limits()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo validar en INSERT y UPDATE que cambie el plantel
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.plantel_id IS DISTINCT FROM NEW.plantel_id) THEN
        -- Verificar si se puede agregar el usuario al plantel
        IF NEW.plantel_id IS NOT NULL AND NOT public.can_add_user_to_plantel(NEW.plantel_id, NEW.role) THEN
            RAISE EXCEPTION 'No se puede asignar el usuario al plantel. Se ha alcanzado el límite máximo de usuarios para este plantel.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a la tabla profiles
CREATE TRIGGER validate_profiles_user_limits
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_assignment_limits();

-- Aplicar trigger a la tabla user_plantel_assignments
CREATE OR REPLACE FUNCTION validate_assignment_limits()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo validar en INSERT y UPDATE activos
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.activo = false)) AND NEW.activo = true THEN
        -- Obtener el rol del usuario
        DECLARE
            user_role user_role;
        BEGIN
            SELECT role INTO user_role FROM profiles WHERE id = NEW.user_id;
            
            -- Verificar si se puede agregar el usuario al plantel
            IF NOT public.can_add_user_to_plantel(NEW.plantel_id, COALESCE(NEW.role, user_role)) THEN
                RAISE EXCEPTION 'No se puede asignar el usuario al plantel. Se ha alcanzado el límite máximo de usuarios para este plantel.';
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_assignment_user_limits
    BEFORE INSERT OR UPDATE ON user_plantel_assignments
    FOR EACH ROW
    EXECUTE FUNCTION validate_assignment_limits();