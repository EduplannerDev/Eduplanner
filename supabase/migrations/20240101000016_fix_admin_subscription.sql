-- Migración: Corregir suscripción del usuario administrador
-- =====================================================
-- Esta migración actualiza la suscripción del usuario admin a pro

-- 1. ACTUALIZAR SUSCRIPCIÓN DEL USUARIO ADMIN A PRO
-- =====================================================
UPDATE profiles 
SET 
    subscription_plan = 'pro',
    subscription_status = 'active',
    subscription_end_date = NULL,
    subscription_renew_date = (CURRENT_DATE + INTERVAL '1 month')::date,
    cancel_at_period_end = false,
    updated_at = NOW()
WHERE role = 'administrador';

-- 2. VERIFICAR QUE LA ACTUALIZACIÓN FUE EXITOSA
-- =====================================================
-- Esta consulta mostrará los resultados en los logs
DO $$
DECLARE
    admin_record RECORD;
BEGIN
    FOR admin_record IN 
        SELECT 
            id,
            full_name,
            role,
            subscription_plan,
            subscription_status,
            is_user_pro(id) as is_pro_result
        FROM profiles 
        WHERE role = 'administrador'
    LOOP
        RAISE NOTICE 'Usuario Admin: % - Plan: % - Status: % - is_pro: %', 
            admin_record.full_name, 
            admin_record.subscription_plan, 
            admin_record.subscription_status,
            admin_record.is_pro_result;
    END LOOP;
END $$;

-- 3. COMENTARIOS
-- =====================================================
COMMENT ON TABLE profiles IS 'Tabla de perfiles de usuario con información de suscripción actualizada';