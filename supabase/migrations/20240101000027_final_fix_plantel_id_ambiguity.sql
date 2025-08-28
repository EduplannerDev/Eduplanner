-- Final fix for ambiguous plantel_id column in planteles_with_limits view
-- This migration addresses the root cause in the original view definition

-- Drop the problematic view
DROP VIEW IF EXISTS public.planteles_with_limits CASCADE;

-- Recreate the view with properly qualified column references
CREATE VIEW public.planteles_with_limits AS
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
        -- Users with direct plantel_id assignment in profiles
        SELECT role FROM profiles prof
        WHERE prof.plantel_id = p.id AND prof.activo = true
        UNION
        -- Users assigned through user_plantel_assignments
        SELECT upa.role FROM user_plantel_assignments upa
        JOIN profiles prof ON upa.user_id = prof.id
        WHERE upa.plantel_id = p.id AND prof.activo = true AND upa.activo = true
    ) combined_users
) user_counts ON true;

-- Set permissions
ALTER VIEW public.planteles_with_limits OWNER TO postgres;
GRANT SELECT ON public.planteles_with_limits TO authenticated;
GRANT SELECT ON public.planteles_with_limits TO service_role;

-- Add comment
COMMENT ON VIEW public.planteles_with_limits IS 'View that combines plantel information with user counts. Fixed ambiguous plantel_id references by explicitly qualifying table aliases (prof.plantel_id and upa.plantel_id).';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Final fix applied: planteles_with_limits view recreated with fully qualified plantel_id references';
END $$;