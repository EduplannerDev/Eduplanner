-- Migración: Restaurar función de calendario escolar para uso manual
-- ================================================================
-- Esta migración restaura la función add_school_calendar_to_new_user
-- para que pueda ser utilizada manualmente desde la API

-- 1. RECREAR LA FUNCIÓN DE CALENDARIO ESCOLAR
-- ==========================================
CREATE OR REPLACE FUNCTION public.add_school_calendar_to_new_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Insertar eventos del calendario escolar 2025-2026 para el usuario especificado
    -- Estos eventos están basados en el archivo ICS oficial
    
    -- Consejos Técnicos Escolares (sesiones ordinarias)
    INSERT INTO events (user_id, title, description, category, event_date, hashtags) VALUES
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2025-08-29', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2025-09-27', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2025-10-31', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2025-11-28', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-01-30', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-02-27', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-03-27', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-04-24', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-05-29', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-06-26', ARRAY['#calendario-escolar', '#consejo-tecnico']);
    
    -- Eventos escolares importantes
    INSERT INTO events (user_id, title, description, category, event_date, hashtags) VALUES
    (p_user_id, 'Inicio del Ciclo Escolar 2025-2026', 'Inicio oficial del ciclo escolar', 'evento-escolar', '2025-08-26', ARRAY['#calendario-escolar', '#inicio-ciclo']),
    (p_user_id, 'Suspensión de Labores - Día de la Independencia', 'Suspensión de labores por festividad nacional', 'evento-escolar', '2025-09-16', ARRAY['#calendario-escolar', '#suspension']),
    (p_user_id, 'Suspensión de Labores - Día de Muertos', 'Suspensión de labores por Día de Muertos', 'evento-escolar', '2025-11-02', ARRAY['#calendario-escolar', '#suspension']),
    (p_user_id, 'Suspensión de Labores - Revolución Mexicana', 'Suspensión de labores por Revolución Mexicana', 'evento-escolar', '2025-11-20', ARRAY['#calendario-escolar', '#suspension']),
    (p_user_id, 'Vacaciones de Invierno - Inicio', 'Inicio del período vacacional de invierno', 'evento-escolar', '2025-12-23', ARRAY['#calendario-escolar', '#vacaciones']),
    (p_user_id, 'Vacaciones de Invierno - Fin', 'Fin del período vacacional de invierno', 'evento-escolar', '2026-01-06', ARRAY['#calendario-escolar', '#vacaciones']),
    (p_user_id, 'Suspensión de Labores - Día de la Constitución', 'Suspensión de labores por Día de la Constitución', 'evento-escolar', '2026-02-05', ARRAY['#calendario-escolar', '#suspension']),
    (p_user_id, 'Suspensión de Labores - Natalicio de Benito Juárez', 'Suspensión de labores por Natalicio de Benito Juárez', 'evento-escolar', '2026-03-21', ARRAY['#calendario-escolar', '#suspension']),
    (p_user_id, 'Vacaciones de Primavera - Inicio', 'Inicio del período vacacional de primavera', 'evento-escolar', '2026-04-06', ARRAY['#calendario-escolar', '#vacaciones']),
    (p_user_id, 'Vacaciones de Primavera - Fin', 'Fin del período vacacional de primavera', 'evento-escolar', '2026-04-17', ARRAY['#calendario-escolar', '#vacaciones']),
    (p_user_id, 'Suspensión de Labores - Día del Trabajo', 'Suspensión de labores por Día del Trabajo', 'evento-escolar', '2026-05-01', ARRAY['#calendario-escolar', '#suspension']),
    (p_user_id, 'Fin del Ciclo Escolar 2025-2026', 'Fin oficial del ciclo escolar', 'evento-escolar', '2026-07-15', ARRAY['#calendario-escolar', '#fin-ciclo']);
    
    -- Períodos de evaluación
    INSERT INTO events (user_id, title, description, category, event_date, hashtags) VALUES
    (p_user_id, 'Primera Evaluación - Inicio', 'Inicio del primer período de evaluación', 'entrega', '2025-10-01', ARRAY['#calendario-escolar', '#evaluacion']),
    (p_user_id, 'Primera Evaluación - Fin', 'Fin del primer período de evaluación', 'entrega', '2025-10-31', ARRAY['#calendario-escolar', '#evaluacion']),
    (p_user_id, 'Segunda Evaluación - Inicio', 'Inicio del segundo período de evaluación', 'entrega', '2025-12-01', ARRAY['#calendario-escolar', '#evaluacion']),
    (p_user_id, 'Segunda Evaluación - Fin', 'Fin del segundo período de evaluación', 'entrega', '2025-12-20', ARRAY['#calendario-escolar', '#evaluacion']),
    (p_user_id, 'Tercera Evaluación - Inicio', 'Inicio del tercer período de evaluación', 'entrega', '2026-03-01', ARRAY['#calendario-escolar', '#evaluacion']),
    (p_user_id, 'Tercera Evaluación - Fin', 'Fin del tercer período de evaluación', 'entrega', '2026-03-31', ARRAY['#calendario-escolar', '#evaluacion']),
    (p_user_id, 'Evaluación Final - Inicio', 'Inicio del período de evaluación final', 'entrega', '2026-06-01', ARRAY['#calendario-escolar', '#evaluacion']),
    (p_user_id, 'Evaluación Final - Fin', 'Fin del período de evaluación final', 'entrega', '2026-07-10', ARRAY['#calendario-escolar', '#evaluacion']);
    
    -- Log de éxito
    RAISE NOTICE 'Calendario escolar agregado exitosamente para usuario %', p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. COMENTARIOS Y DOCUMENTACIÓN
-- ==============================
COMMENT ON FUNCTION public.add_school_calendar_to_new_user(UUID) IS 'Agrega eventos del calendario escolar 2025-2026 a un usuario específico. Para uso manual desde la API.';

-- 3. VERIFICACIÓN DE LA MIGRACIÓN
-- ===============================
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: School calendar function restored';
    RAISE NOTICE 'Function add_school_calendar_to_new_user is now available for manual use';
    RAISE NOTICE 'The function will add 30 school calendar events to the specified user';
END $$;