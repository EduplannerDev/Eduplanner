-- Migración: Configuración final del sistema
-- =====================================================
-- Esta migración incluye funciones auxiliares adicionales,
-- vistas del sistema y configuraciones finales

-- 1. FUNCIONES DE UTILIDAD GENERAL
-- =====================================================

-- Función para obtener el perfil completo de un usuario
CREATE OR REPLACE FUNCTION get_user_profile(user_id_param UUID)
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name TEXT,
    role user_role,
    plantel_id UUID,
    plantel_nombre TEXT,
    telefono TEXT,
    activo BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        au.email,
        p.full_name,
        p.role,
        p.plantel_id,
        pl.nombre as plantel_nombre,
        p.telefono,
        p.activo,
        p.created_at,
        p.updated_at
    FROM profiles p
    LEFT JOIN auth.users au ON au.id = p.id
    LEFT JOIN planteles pl ON pl.id = p.plantel_id
    WHERE p.id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas generales del sistema
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS TABLE(
    total_usuarios BIGINT,
    usuarios_activos BIGINT,
    total_planteles BIGINT,
    planteles_activos BIGINT,
    total_grupos BIGINT,
    grupos_activos BIGINT,
    total_alumnos BIGINT,
    total_planeaciones BIGINT,
    total_examenes BIGINT,
    total_mensajes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM profiles) as total_usuarios,
        (SELECT COUNT(*) FROM profiles WHERE activo = true) as usuarios_activos,
        (SELECT COUNT(*) FROM planteles) as total_planteles,
        (SELECT COUNT(*) FROM planteles WHERE activo = true) as planteles_activos,
        (SELECT COUNT(*) FROM grupos) as total_grupos,
        (SELECT COUNT(*) FROM grupos WHERE activo = true) as grupos_activos,
        (SELECT COUNT(*) FROM alumnos) as total_alumnos,
        (SELECT COUNT(*) FROM planeaciones) as total_planeaciones,
        (SELECT COUNT(*) FROM examenes) as total_examenes,
        (SELECT COUNT(*) FROM messages) as total_mensajes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para validar permisos de usuario
CREATE OR REPLACE FUNCTION check_user_permission(
    user_id_param UUID,
    required_role TEXT,
    plantel_id_param UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    user_profile RECORD;
BEGIN
    SELECT role, plantel_id, activo INTO user_profile
    FROM profiles
    WHERE id = user_id_param;
    
    -- Usuario no existe o inactivo
    IF NOT FOUND OR user_profile.activo = false THEN
        RETURN false;
    END IF;
    
    -- Administrador tiene todos los permisos
    IF user_profile.role = 'administrador' THEN
        RETURN true;
    END IF;
    
    -- Verificar rol específico
    IF required_role = 'director' THEN
        IF user_profile.role != 'director' THEN
            RETURN false;
        END IF;
        
        -- Si se especifica plantel, verificar que coincida
        IF plantel_id_param IS NOT NULL AND user_profile.plantel_id != plantel_id_param THEN
            RETURN false;
        END IF;
    END IF;
    
    IF required_role = 'profesor' THEN
        IF user_profile.role NOT IN ('profesor', 'director') THEN
            RETURN false;
        END IF;
        
        -- Si se especifica plantel, verificar que coincida
        IF plantel_id_param IS NOT NULL AND user_profile.plantel_id != plantel_id_param THEN
            RETURN false;
        END IF;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. VISTAS DEL SISTEMA
-- =====================================================

-- Vista para dashboard de administrador
CREATE OR REPLACE VIEW admin_dashboard AS
SELECT 
    'usuarios' as metric_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE activo = true) as activos,
    COUNT(*) FILTER (WHERE role = 'administrador') as administradores,
    COUNT(*) FILTER (WHERE role = 'director') as directores,
    COUNT(*) FILTER (WHERE role = 'profesor') as profesores
FROM profiles
UNION ALL
SELECT 
    'planteles' as metric_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE activo = true) as activos,
    0 as administradores,
    0 as directores,
    0 as profesores
FROM planteles
UNION ALL
SELECT 
    'grupos' as metric_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE activo = true) as activos,
    0 as administradores,
    0 as directores,
    0 as profesores
FROM grupos;

-- Vista para resumen de actividad por plantel
CREATE OR REPLACE VIEW plantel_activity_summary AS
SELECT 
    p.id as plantel_id,
    p.nombre as plantel_nombre,
    p.activo as plantel_activo,
    COUNT(DISTINCT pr.id) as total_usuarios,
    COUNT(DISTINCT pr.id) FILTER (WHERE pr.activo = true) as usuarios_activos,
    COUNT(DISTINCT g.id) as total_grupos,
    COUNT(DISTINCT g.id) FILTER (WHERE g.activo = true) as grupos_activos,
    COUNT(DISTINCT a.id) as total_alumnos,
    COUNT(DISTINCT pl.id) as total_planeaciones,
    COUNT(DISTINCT e.id) as total_examenes
FROM planteles p
LEFT JOIN profiles pr ON pr.plantel_id = p.id
LEFT JOIN grupos g ON g.plantel_id = p.id
LEFT JOIN alumnos a ON a.grupo_id = g.id
LEFT JOIN planeaciones pl ON pl.user_id = pr.id
LEFT JOIN examenes e ON e.owner_id = pr.id
GROUP BY p.id, p.nombre, p.activo;

-- Vista para actividad reciente del sistema
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
    'usuario_creado' as activity_type,
    p.id as entity_id,
    p.full_name as entity_name,
    p.created_at as activity_date,
    pr.nombre as plantel_nombre
FROM profiles p
LEFT JOIN planteles pr ON pr.id = p.plantel_id
WHERE p.created_at >= NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
    'grupo_creado' as activity_type,
    g.id as entity_id,
    g.nombre as entity_name,
    g.created_at as activity_date,
    p.nombre as plantel_nombre
FROM grupos g
LEFT JOIN planteles p ON p.id = g.plantel_id
WHERE g.created_at >= NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
    'planeacion_creada' as activity_type,
    pl.id as entity_id,
    pl.titulo as entity_name,
    pl.created_at as activity_date,
    pt.nombre as plantel_nombre
FROM planeaciones pl
JOIN profiles pr ON pr.id = pl.user_id
LEFT JOIN planteles pt ON pt.id = pr.plantel_id
WHERE pl.created_at >= NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
    'examen_creado' as activity_type,
    e.id as entity_id,
    e.title as entity_name,
    e.created_at as activity_date,
    pt.nombre as plantel_nombre
FROM examenes e
JOIN profiles pr ON pr.id = e.owner_id
LEFT JOIN planteles pt ON pt.id = pr.plantel_id
WHERE e.created_at >= NOW() - INTERVAL '30 days'
ORDER BY activity_date DESC;

-- 3. FUNCIONES DE LIMPIEZA Y MANTENIMIENTO
-- =====================================================
-- Nota: La función cleanup_orphaned_data() ya está definida en 20240101000008_final_setup.sql

-- Función para actualizar estadísticas de grupos
CREATE OR REPLACE FUNCTION refresh_grupo_stats()
RETURNS VOID AS $$
BEGIN
    -- Actualizar número de alumnos en grupos
    UPDATE grupos 
    SET numero_alumnos = (
        SELECT COUNT(*) 
        FROM alumnos 
        WHERE grupo_id = grupos.id
    );
    
    -- Desactivar grupos sin alumnos (opcional)
    -- UPDATE grupos SET activo = false WHERE numero_alumnos = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGERS ADICIONALES
-- =====================================================

-- Trigger para actualizar estadísticas cuando se elimina un alumno
CREATE OR REPLACE FUNCTION trigger_update_grupo_stats_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar número de alumnos del grupo
    UPDATE grupos 
    SET numero_alumnos = numero_alumnos - 1,
        updated_at = NOW()
    WHERE id = OLD.grupo_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_grupo_stats_on_alumno_delete
    AFTER DELETE ON alumnos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_grupo_stats_on_delete();

-- 5. ÍNDICES ADICIONALES PARA RENDIMIENTO
-- =====================================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_profiles_plantel_role ON profiles(plantel_id, role) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_grupos_plantel_activo ON grupos(plantel_id, activo);
CREATE INDEX IF NOT EXISTS idx_alumnos_grupo_activo ON alumnos(grupo_id) WHERE grupo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_planeaciones_user_fecha ON planeaciones(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_examenes_owner_public ON examenes(owner_id, is_public);
CREATE INDEX IF NOT EXISTS idx_seguimiento_alumno_fecha ON seguimiento_diario(alumno_id, fecha);

-- Índices para búsqueda de texto
CREATE INDEX IF NOT EXISTS idx_profiles_nombre_search ON profiles USING gin(to_tsvector('spanish', full_name));
CREATE INDEX IF NOT EXISTS idx_planteles_nombre_search ON planteles USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_grupos_nombre_search ON grupos USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_alumnos_nombre_search ON alumnos USING gin(to_tsvector('spanish', nombre_completo));

-- 6. CONFIGURACIONES DE SEGURIDAD ADICIONALES
-- =====================================================

-- Política adicional para vistas
ALTER VIEW admin_dashboard OWNER TO postgres;
ALTER VIEW plantel_activity_summary OWNER TO postgres;
ALTER VIEW recent_activity OWNER TO postgres;

-- Permisos para funciones
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_permission(UUID, TEXT, UUID) TO authenticated;
-- GRANT EXECUTE ON FUNCTION cleanup_orphaned_data() TO authenticated; -- Ya definida en migración anterior
GRANT EXECUTE ON FUNCTION refresh_grupo_stats() TO authenticated;

-- 7. COMENTARIOS FINALES
-- =====================================================
COMMENT ON FUNCTION get_user_profile(UUID) IS 'Obtiene el perfil completo de un usuario con información del plantel';
COMMENT ON FUNCTION get_system_stats() IS 'Obtiene estadísticas generales del sistema para dashboard';
COMMENT ON FUNCTION check_user_permission(UUID, TEXT, UUID) IS 'Valida permisos de usuario según rol y plantel';
-- COMMENT ON FUNCTION cleanup_orphaned_data() IS 'Limpia registros huérfanos del sistema'; -- Ya definida en migración anterior
COMMENT ON FUNCTION refresh_grupo_stats() IS 'Actualiza estadísticas de grupos (número de alumnos)';

COMMENT ON VIEW admin_dashboard IS 'Vista para dashboard de administrador con métricas del sistema';
COMMENT ON VIEW plantel_activity_summary IS 'Resumen de actividad por plantel';
COMMENT ON VIEW recent_activity IS 'Actividad reciente del sistema (últimos 30 días)';

-- 8. DATOS INICIALES (OPCIONAL)
-- =====================================================

-- Insertar plantillas de mensajes por defecto (solo si no existen)
-- Nota: Se omite la inserción de plantillas por defecto ya que requiere usuarios existentes
-- Las plantillas se pueden crear posteriormente desde la interfaz de usuario

-- DO $$
-- DECLARE
--     admin_user_id UUID;
-- BEGIN
--     -- Buscar un usuario administrador existente
--     SELECT id INTO admin_user_id FROM profiles WHERE role = 'administrador' LIMIT 1;
--     
--     -- Solo insertar si existe un administrador
--     IF admin_user_id IS NOT NULL THEN
--         INSERT INTO message_templates (id, user_id, name, description, template_type, subject_template, content_template, variables, is_public)
--         VALUES 
--             (
--                 gen_random_uuid(),
--                 admin_user_id,
--                 'Citatorio General',
--                 'Plantilla para citatorios generales a padres de familia',
--                 'citatorio',
--                 'Citatorio - {{alumno_nombre}}',
--                 'Estimado(a) {{padre_nombre}},\n\nPor medio de la presente, le solicitamos su presencia en el plantel {{plantel_nombre}} el día {{fecha}} a las {{hora}} para tratar asuntos relacionados con {{alumno_nombre}}.\n\nMotivo: {{motivo}}\n\nAgradecemos su atención y puntual asistencia.\n\nAtentamente,\n{{profesor_nombre}}',
--                 '["alumno_nombre", "padre_nombre", "plantel_nombre", "fecha", "hora", "motivo", "profesor_nombre"]'::jsonb,
--                 true
--             ),
--             (
--                 gen_random_uuid(),
--                 admin_user_id,
--                 'Reporte Académico',
--                 'Plantilla para reportes académicos',
--                 'academico',
--                 'Reporte Académico - {{alumno_nombre}}',
--                 'Estimado(a) {{padre_nombre}},\n\nLe informamos sobre el desempeño académico de {{alumno_nombre}} en el período {{periodo}}.\n\n{{contenido_reporte}}\n\nRecomendaciones:\n{{recomendaciones}}\n\nQuedamos a su disposición para cualquier consulta.\n\nSaludos cordiales,\n{{profesor_nombre}}',
--                 '["alumno_nombre", "padre_nombre", "periodo", "contenido_reporte", "recomendaciones", "profesor_nombre"]'::jsonb,
--                 true
--             )
--         ON CONFLICT DO NOTHING;
--     END IF;
-- END $$;

-- Mensaje de finalización
DO $$
BEGIN
    RAISE NOTICE 'Migración completada: Sistema EduPlanner configurado correctamente';
    RAISE NOTICE 'Tablas creadas: planteles, profiles, grupos, alumnos, seguimiento_diario, planeaciones, examenes, messages, parent_messages, message_templates, user_plantel_assignments';
    RAISE NOTICE 'Funciones auxiliares: %, vistas del sistema: %, políticas RLS: configuradas', 
        'get_user_profile, get_system_stats, check_user_permission, refresh_grupo_stats',
        'admin_dashboard, plantel_activity_summary, recent_activity';
END $$;