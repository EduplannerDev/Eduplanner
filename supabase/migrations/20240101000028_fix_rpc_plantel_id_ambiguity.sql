-- Fix ambiguous plantel_id references in RPC functions
-- This addresses the root cause of the error in get_plantel_user_count function

-- Fix get_plantel_user_count function
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
        -- Users with direct plantel_id assignment in profiles
        SELECT prof.role FROM profiles prof
        WHERE prof.plantel_id = get_plantel_user_count.plantel_id 
        AND prof.activo = true
        
        UNION
        
        -- Users assigned through user_plantel_assignments
        SELECT upa.role FROM user_plantel_assignments upa
        JOIN profiles prof ON upa.user_id = prof.id
        WHERE upa.plantel_id = get_plantel_user_count.plantel_id 
        AND prof.activo = true
        AND upa.activo = true
    ) combined_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'RPC function get_plantel_user_count fixed: plantel_id references properly qualified';
END $$;