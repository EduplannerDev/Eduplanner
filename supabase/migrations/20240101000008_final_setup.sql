-- Migración: Configuración final y funciones auxiliares
-- =====================================================
-- Esta migración incluye funciones auxiliares, vistas útiles
-- y configuraciones finales del sistema

-- 1. FUNCIÓN PARA OBTENER EL PLANTEL PRINCIPAL DE UN USUARIO
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_main_plantel(user_id UUID)
RETURNS UUID AS $$
BEGIN
    -- Primero intentar obtener el plantel principal del perfil
    RETURN (
        SELECT plantel_id 
        FROM profiles 
        WHERE id = user_id 
        AND plantel_id IS NOT NULL
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNCIÓN PARA VERIFICAR SI UN USUARIO PUEDE GESTIONAR UN PLANTEL
-- =====================================================
CREATE OR REPLACE FUNCTION can_manage_plantel(user_id UUID, plantel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = user_id
        AND (
            p.role = 'administrador'
            OR (p.role = 'director' AND p.plantel_id = plantel_id)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. VISTA PARA ESTADÍSTICAS DE PLANTELES
-- =====================================================
CREATE OR REPLACE VIEW plantel_stats AS
SELECT 
    p.id,
    p.nombre,
    p.codigo_plantel,
    p.nivel_educativo,
    p.ciudad,
    p.estado,
    p.activo,
    -- Contar usuarios directos
    COALESCE(direct_users.count, 0) as usuarios_directos,
    -- Contar asignaciones
    COALESCE(assigned_users.count, 0) as usuarios_asignados,
    -- Contar grupos
    COALESCE(grupos_count.count, 0) as total_grupos,
    -- Contar grupos activos
    COALESCE(grupos_activos.count, 0) as grupos_activos
FROM planteles p
LEFT JOIN (
    SELECT plantel_id, COUNT(*) as count
    FROM profiles 
    WHERE plantel_id IS NOT NULL AND activo = true
    GROUP BY plantel_id
) direct_users ON p.id = direct_users.plantel_id
LEFT JOIN (
    SELECT plantel_id, COUNT(*) as count
    FROM user_plantel_assignments 
    WHERE activo = true
    GROUP BY plantel_id
) assigned_users ON p.id = assigned_users.plantel_id
LEFT JOIN (
    SELECT plantel_id, COUNT(*) as count
    FROM grupos 
    WHERE plantel_id IS NOT NULL
    GROUP BY plantel_id
) grupos_count ON p.id = grupos_count.plantel_id
LEFT JOIN (
    SELECT plantel_id, COUNT(*) as count
    FROM grupos 
    WHERE plantel_id IS NOT NULL AND activo = true
    GROUP BY plantel_id
) grupos_activos ON p.id = grupos_activos.plantel_id;

-- 4. VISTA PARA USUARIOS CON SUS PLANTELES
-- =====================================================
CREATE OR REPLACE VIEW users_with_planteles AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.telefono,
    p.role,
    p.activo,
    p.plantel_id as main_plantel_id,
    mp.nombre as main_plantel_nombre,
    mp.codigo_plantel as main_plantel_codigo,
    -- Planteles asignados adicionales
    COALESCE(
        ARRAY_AGG(
            DISTINCT jsonb_build_object(
                'plantel_id', upa.plantel_id,
                'plantel_nombre', ap.nombre,
                'role', upa.role,
                'assigned_at', upa.assigned_at
            )
        ) FILTER (WHERE upa.plantel_id IS NOT NULL),
        ARRAY[]::jsonb[]
    ) as assigned_planteles
FROM profiles p
LEFT JOIN planteles mp ON p.plantel_id = mp.id
LEFT JOIN user_plantel_assignments upa ON p.id = upa.user_id AND upa.activo = true
LEFT JOIN planteles ap ON upa.plantel_id = ap.id
WHERE p.activo = true
GROUP BY 
    p.id, p.full_name, p.email, p.telefono, p.role, p.activo, 
    p.plantel_id, mp.nombre, mp.codigo_plantel;

-- 5. FUNCIÓN PARA LIMPIAR DATOS HUÉRFANOS
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    deleted_count INTEGER;
BEGIN
    -- Limpiar grupos sin plantel válido
    DELETE FROM grupos 
    WHERE plantel_id IS NOT NULL 
    AND plantel_id NOT IN (SELECT id FROM planteles WHERE activo = true);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result := result || 'Grupos huérfanos eliminados: ' || deleted_count || E'\n';
    
    -- Limpiar asignaciones sin usuario o plantel válido
    DELETE FROM user_plantel_assignments 
    WHERE user_id NOT IN (SELECT id FROM profiles WHERE activo = true)
    OR plantel_id NOT IN (SELECT id FROM planteles WHERE activo = true);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result := result || 'Asignaciones huérfanas eliminadas: ' || deleted_count || E'\n';
    
    -- Limpiar referencias de plantel en profiles
    UPDATE profiles 
    SET plantel_id = NULL 
    WHERE plantel_id IS NOT NULL 
    AND plantel_id NOT IN (SELECT id FROM planteles WHERE activo = true);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result := result || 'Referencias de plantel limpiadas: ' || deleted_count || E'\n';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CREAR USUARIO ADMINISTRADOR POR DEFECTO (OPCIONAL)
-- =====================================================
-- Nota: Este usuario debe ser creado manualmente en Supabase Auth
-- y luego actualizado aquí con el rol de administrador

-- Ejemplo de cómo actualizar un usuario existente a administrador:
-- UPDATE profiles 
-- SET role = 'administrador', updated_at = NOW()
-- WHERE email = 'admin@tudominio.com';

-- 7. COMENTARIOS FINALES
-- =====================================================
COMMENT ON FUNCTION get_user_main_plantel(UUID) IS 'Obtiene el plantel principal de un usuario';
COMMENT ON FUNCTION can_manage_plantel(UUID, UUID) IS 'Verifica si un usuario puede gestionar un plantel específico';
COMMENT ON FUNCTION cleanup_orphaned_data() IS 'Limpia datos huérfanos del sistema';
COMMENT ON VIEW plantel_stats IS 'Vista con estadísticas de planteles';
COMMENT ON VIEW users_with_planteles IS 'Vista de usuarios con información de sus planteles';

-- 8. MENSAJE DE FINALIZACIÓN
-- =====================================================
-- Todas las migraciones han sido aplicadas exitosamente
-- El sistema de planteles y roles está listo para usar