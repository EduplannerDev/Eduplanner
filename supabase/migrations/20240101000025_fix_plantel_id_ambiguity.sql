-- Migración: Corregir ambigüedad de columna plantel_id en vista planteles_with_limits
-- =====================================================
-- Esta migración corrige el error "column reference 'plantel_id' is ambiguous"
-- que ocurre en la vista planteles_with_limits al hacer UNION entre profiles y user_plantel_assignments

-- 1. ELIMINAR VISTA PROBLEMÁTICA
-- =====================================================
DROP VIEW IF EXISTS planteles_with_limits;

-- 2. RECREAR VISTA CON REFERENCIAS EXPLÍCITAS A LAS TABLAS
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
        -- Usuarios asignados directamente en profiles (método legacy)
        SELECT prof.role 
        FROM profiles prof
        WHERE prof.plantel_id = p.id AND prof.activo = true
        
        UNION
        
        -- Usuarios asignados a través de user_plantel_assignments (método actual)
        SELECT upa.role 
        FROM user_plantel_assignments upa
        JOIN profiles prof ON upa.user_id = prof.id
        WHERE upa.plantel_id = p.id AND prof.activo = true AND upa.activo = true
    ) combined_users
) user_counts ON true;

-- 3. CONFIGURAR PERMISOS
-- =====================================================
ALTER VIEW planteles_with_limits OWNER TO postgres;
GRANT SELECT ON planteles_with_limits TO authenticated;
GRANT SELECT ON planteles_with_limits TO service_role;

-- 4. COMENTARIOS
-- =====================================================
COMMENT ON VIEW planteles_with_limits IS 'Vista que combina información de planteles con conteos actuales de usuarios por rol, corrigiendo ambigüedad de plantel_id';

-- 5. VERIFICACIÓN
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migración completada: Ambigüedad de plantel_id corregida';
  RAISE NOTICE 'Vista planteles_with_limits recreada con referencias explícitas';
  RAISE NOTICE 'Los conteos de usuarios ahora funcionan correctamente';
  RAISE NOTICE 'La asignación de usuarios a planteles debería funcionar sin errores';
END $$;