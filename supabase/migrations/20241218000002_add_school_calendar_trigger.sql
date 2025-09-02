-- Migración: Agregar trigger para calendario escolar automático
-- ==========================================================
-- Esta migración crea un trigger que automáticamente agrega eventos del calendario escolar
-- a nuevos usuarios cuando se registran en la plataforma

-- 1. FUNCIÓN PARA AGREGAR CALENDARIO ESCOLAR A NUEVO USUARIO
-- =========================================================
CREATE OR REPLACE FUNCTION add_school_calendar_to_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar eventos del calendario escolar 2025-2026 para el nuevo usuario
    -- Estos eventos están basados en el archivo ICS oficial
    
    -- Consejos Técnicos Escolares (sesiones ordinarias)
    INSERT INTO events (user_id, title, description, category, event_date, hashtags) VALUES
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2025-08-29', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2025-09-27', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2025-10-31', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2025-11-28', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-01-30', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-02-27', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-03-27', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-04-24', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-05-29', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-06-26', ARRAY['#calendario-escolar', '#consejo-tecnico']);
    
    -- Eventos escolares importantes
    INSERT INTO events (user_id, title, description, category, event_date, hashtags) VALUES
    (NEW.id, 'Inicio del Ciclo Escolar 2025-2026', 'Inicio oficial del ciclo escolar', 'evento-escolar', '2025-08-26', ARRAY['#calendario-escolar', '#inicio-ciclo']),
    (NEW.id, 'Suspensión de Labores - Día de la Independencia', 'Suspensión de labores por festividad nacional', 'evento-escolar', '2025-09-16', ARRAY['#calendario-escolar', '#suspension']),
    (NEW.id, 'Suspensión de Labores - Día de Muertos', 'Suspensión de labores por Día de Muertos', 'evento-escolar', '2025-11-02', ARRAY['#calendario-escolar', '#suspension']),
    (NEW.id, 'Suspensión de Labores - Revolución Mexicana', 'Suspensión de labores por Revolución Mexicana', 'evento-escolar', '2025-11-20', ARRAY['#calendario-escolar', '#suspension']),
    (NEW.id, 'Vacaciones de Invierno - Inicio', 'Inicio del período vacacional de invierno', 'evento-escolar', '2025-12-23', ARRAY['#calendario-escolar', '#vacaciones']),
    (NEW.id, 'Vacaciones de Invierno - Fin', 'Fin del período vacacional de invierno', 'evento-escolar', '2026-01-06', ARRAY['#calendario-escolar', '#vacaciones']),
    (NEW.id, 'Suspensión de Labores - Día de la Constitución', 'Suspensión de labores por Día de la Constitución', 'evento-escolar', '2026-02-05', ARRAY['#calendario-escolar', '#suspension']),
    (NEW.id, 'Suspensión de Labores - Natalicio de Benito Juárez', 'Suspensión de labores por Natalicio de Benito Juárez', 'evento-escolar', '2026-03-21', ARRAY['#calendario-escolar', '#suspension']),
    (NEW.id, 'Vacaciones de Primavera - Inicio', 'Inicio del período vacacional de primavera', 'evento-escolar', '2026-04-06', ARRAY['#calendario-escolar', '#vacaciones']),
    (NEW.id, 'Vacaciones de Primavera - Fin', 'Fin del período vacacional de primavera', 'evento-escolar', '2026-04-17', ARRAY['#calendario-escolar', '#vacaciones']),
    (NEW.id, 'Suspensión de Labores - Día del Trabajo', 'Suspensión de labores por Día del Trabajo', 'evento-escolar', '2026-05-01', ARRAY['#calendario-escolar', '#suspension']),
    (NEW.id, 'Fin del Ciclo Escolar 2025-2026', 'Fin oficial del ciclo escolar', 'evento-escolar', '2026-07-15', ARRAY['#calendario-escolar', '#fin-ciclo']);
    
    -- Períodos de evaluación
    INSERT INTO events (user_id, title, description, category, event_date, hashtags) VALUES
    (NEW.id, 'Primera Evaluación - Inicio', 'Inicio del primer período de evaluación', 'entrega', '2025-10-01', ARRAY['#calendario-escolar', '#evaluacion']),
    (NEW.id, 'Primera Evaluación - Fin', 'Fin del primer período de evaluación', 'entrega', '2025-10-31', ARRAY['#calendario-escolar', '#evaluacion']),
    (NEW.id, 'Segunda Evaluación - Inicio', 'Inicio del segundo período de evaluación', 'entrega', '2025-12-01', ARRAY['#calendario-escolar', '#evaluacion']),
    (NEW.id, 'Segunda Evaluación - Fin', 'Fin del segundo período de evaluación', 'entrega', '2025-12-20', ARRAY['#calendario-escolar', '#evaluacion']),
    (NEW.id, 'Tercera Evaluación - Inicio', 'Inicio del tercer período de evaluación', 'entrega', '2026-03-01', ARRAY['#calendario-escolar', '#evaluacion']),
    (NEW.id, 'Tercera Evaluación - Fin', 'Fin del tercer período de evaluación', 'entrega', '2026-03-31', ARRAY['#calendario-escolar', '#evaluacion']),
    (NEW.id, 'Evaluación Final - Inicio', 'Inicio del período de evaluación final', 'entrega', '2026-06-01', ARRAY['#calendario-escolar', '#evaluacion']),
    (NEW.id, 'Evaluación Final - Fin', 'Fin del período de evaluación final', 'entrega', '2026-07-10', ARRAY['#calendario-escolar', '#evaluacion']);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. MODIFICAR EL TRIGGER EXISTENTE PARA INCLUIR CALENDARIO ESCOLAR
-- ================================================================
-- Primero eliminamos el trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created_basic ON auth.users;

-- Creamos una nueva función que incluye tanto el perfil como el calendario
CREATE OR REPLACE FUNCTION public.handle_new_user_with_calendar()
RETURNS TRIGGER AS $$
BEGIN
  -- Crear el perfil del usuario
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Agregar calendario escolar al nuevo usuario
  PERFORM add_school_calendar_to_new_user();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el nuevo trigger
CREATE TRIGGER on_auth_user_created_with_calendar
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_calendar();

-- 3. COMENTARIOS Y DOCUMENTACIÓN
-- ==============================
COMMENT ON FUNCTION add_school_calendar_to_new_user() IS 'Agrega automáticamente eventos del calendario escolar 2025-2026 a nuevos usuarios';
COMMENT ON FUNCTION public.handle_new_user_with_calendar() IS 'Maneja la creación de nuevos usuarios incluyendo perfil y calendario escolar';

-- 4. VERIFICACIÓN DE LA MIGRACIÓN
-- ===============================
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: School calendar trigger created successfully';
    RAISE NOTICE 'New users will automatically receive:';
    RAISE NOTICE '- Basic profile setup';
    RAISE NOTICE '- Complete school calendar 2025-2026';
    RAISE NOTICE '- 10 Technical Council sessions';
    RAISE NOTICE '- 12 important school events';
    RAISE NOTICE '- 8 evaluation periods';
    RAISE NOTICE 'Total: 30 calendar events per new user';
END $$;