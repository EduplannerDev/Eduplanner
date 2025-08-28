-- Force fix for ambiguous plantel_id column in planteles_with_limits view
-- This migration ensures the view is properly recreated with explicit table qualifications

-- Drop the existing view completely
DROP VIEW IF EXISTS public.planteles_with_limits CASCADE;

-- Recreate the view with explicit table qualifications to prevent ambiguity
CREATE VIEW public.planteles_with_limits AS
SELECT 
    p.id,
    p.nombre,
    p.direccion,
    p.telefono,
    p.email,
    p.activo,
    p.created_at,
    p.updated_at,
    p.max_usuarios,
    p.max_profesores,
    p.max_directores,
    p.estado_suscripcion,
    COALESCE(user_counts.usuarios_actuales, 0) as usuarios_actuales,
    COALESCE(user_counts.profesores_actuales, 0) as profesores_actuales,
    COALESCE(user_counts.directores_actuales, 0) as directores_actuales,
    COALESCE(user_counts.administradores_actuales, 0) as administradores_actuales
FROM planteles p
LEFT JOIN (
    SELECT 
        plantel_id,
        COUNT(*) as usuarios_actuales,
        COUNT(CASE WHEN role = 'profesor' THEN 1 END) as profesores_actuales,
        COUNT(CASE WHEN role = 'director' THEN 1 END) as directores_actuales,
        COUNT(CASE WHEN role = 'administrador' THEN 1 END) as administradores_actuales
    FROM (
        -- Users from profiles table
        SELECT DISTINCT 
            prof.plantel_id,
            prof.role
        FROM profiles prof
        WHERE prof.plantel_id IS NOT NULL
        
        UNION
        
        -- Users from user_plantel_assignments table
        SELECT DISTINCT 
            upa.plantel_id,
            upa.role
        FROM user_plantel_assignments upa
        WHERE upa.plantel_id IS NOT NULL
    ) combined_users
    GROUP BY plantel_id
) user_counts ON p.id = user_counts.plantel_id;

-- Grant appropriate permissions
GRANT SELECT ON public.planteles_with_limits TO authenticated;
GRANT SELECT ON public.planteles_with_limits TO service_role;

-- Add comment to document the fix
COMMENT ON VIEW public.planteles_with_limits IS 'View that combines plantel information with user counts. Fixed ambiguous plantel_id references by explicitly qualifying table aliases (prof.plantel_id and upa.plantel_id).';