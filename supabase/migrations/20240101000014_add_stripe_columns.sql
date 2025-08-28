-- Migración: Agregar columnas de Stripe a la tabla profiles
-- =====================================================
-- Esta migración agrega las columnas necesarias para manejar
-- suscripciones y pagos con Stripe

-- 1. AGREGAR COLUMNAS DE STRIPE A PROFILES
-- =====================================================

-- Columna para el plan de suscripción
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro'));

-- Columna para el estado de la suscripción
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'cancelling', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing', 'paused'));

-- Columna para el ID del cliente en Stripe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Columna para el ID de la suscripción en Stripe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;

-- Columna para la fecha de fin de la suscripción
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- Columna para la fecha de renovación de la suscripción
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_renew_date TIMESTAMP WITH TIME ZONE;

-- Columna para el ID del precio en Stripe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Columna para indicar si la suscripción se cancelará al final del período
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- 2. CREAR ÍNDICES PARA LAS NUEVAS COLUMNAS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON profiles(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_end_date ON profiles(subscription_end_date);

-- 3. AGREGAR COLUMNA UPDATED_AT SI NO EXISTE
-- =====================================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. ACTUALIZAR PERFILES EXISTENTES
-- =====================================================
-- Asegurar que todos los perfiles tengan el plan 'free' por defecto
UPDATE profiles 
SET 
    subscription_plan = 'free',
    updated_at = NOW()
WHERE subscription_plan IS NULL;

-- 4. COMENTARIOS PARA LAS NUEVAS COLUMNAS
-- =====================================================
COMMENT ON COLUMN profiles.subscription_plan IS 'Plan de suscripción del usuario (free o pro)';
COMMENT ON COLUMN profiles.subscription_status IS 'Estado de la suscripción en Stripe';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'ID del cliente en Stripe';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'ID de la suscripción en Stripe';
COMMENT ON COLUMN profiles.subscription_end_date IS 'Fecha de finalización de la suscripción';
COMMENT ON COLUMN profiles.subscription_renew_date IS 'Fecha de renovación de la suscripción';
COMMENT ON COLUMN profiles.stripe_price_id IS 'ID del precio en Stripe';
COMMENT ON COLUMN profiles.cancel_at_period_end IS 'Si la suscripción se cancelará al final del período';

-- 5. ACTUALIZAR FUNCIÓN PARA MANEJAR NUEVOS USUARIOS
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  plantel_id_meta UUID;
  invited_by_meta UUID;
BEGIN
  -- Extraer metadatos de invitación si existen
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'profesor');
  plantel_id_meta := (NEW.raw_user_meta_data->>'plantel_id')::UUID;
  invited_by_meta := (NEW.raw_user_meta_data->>'invited_by')::UUID;

  -- Crear perfil del usuario
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    role, 
    activo,
    subscription_plan
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    NEW.email,
    user_role::user_role, -- Usar rol de invitación o por defecto
    true, -- Activo por defecto
    'free' -- Plan gratuito por defecto
  )
  ON CONFLICT (id) DO NOTHING; -- Evitar errores si ya existe

  -- Si hay metadatos de invitación, crear asignación al plantel
  IF plantel_id_meta IS NOT NULL THEN
    INSERT INTO public.user_plantel_assignments (
      user_id,
      plantel_id,
      role,
      assigned_by,
      activo,
      assigned_at
    )
    VALUES (
      NEW.id,
      plantel_id_meta,
      user_role::user_role,
      invited_by_meta,
      true,
      NOW()
    )
    ON CONFLICT (user_id, plantel_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CREAR FUNCIÓN PARA VERIFICAR SI UN USUARIO ES PRO
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_user_pro(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_plan TEXT;
    user_status TEXT;
BEGIN
    SELECT subscription_plan, subscription_status 
    INTO user_plan, user_status
    FROM profiles 
    WHERE id = user_id;
    
    -- Usuario es pro si tiene plan pro y estado activo
    RETURN (user_plan = 'pro' AND user_status = 'active');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CREAR FUNCIÓN PARA OBTENER LÍMITES DE USUARIO
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_limits(user_id UUID)
RETURNS TABLE(
    planeaciones_limit INTEGER,
    examenes_limit INTEGER,
    mensajes_limit INTEGER
) AS $$
DECLARE
    is_pro BOOLEAN;
BEGIN
    SELECT public.is_user_pro(user_id) INTO is_pro;
    
    IF is_pro THEN
        -- Límites para usuarios pro (ilimitado = -1)
        RETURN QUERY SELECT -1, -1, -1;
    ELSE
        -- Límites para usuarios free
        RETURN QUERY SELECT 5, 3, 10;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CREAR VISTA PARA INFORMACIÓN DE SUSCRIPCIÓN
-- =====================================================
CREATE OR REPLACE VIEW user_subscription_info AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.subscription_plan,
    p.subscription_status,
    p.stripe_customer_id,
    p.stripe_subscription_id,
    p.subscription_end_date,
    p.subscription_renew_date,
    p.cancel_at_period_end,
    public.is_user_pro(p.id) as is_pro_active,
    CASE 
        WHEN p.subscription_plan = 'pro' AND p.subscription_status = 'active' THEN 'Suscripción Pro Activa'
        WHEN p.subscription_plan = 'pro' AND p.subscription_status = 'cancelled' THEN 'Suscripción Pro Cancelada'
        WHEN p.subscription_plan = 'pro' AND p.subscription_status = 'past_due' THEN 'Suscripción Pro Vencida'
        ELSE 'Plan Gratuito'
    END as subscription_display_status
FROM profiles p;

-- 9. CONFIGURAR PERMISOS DE LA VISTA
-- =====================================================
ALTER VIEW user_subscription_info OWNER TO postgres;
GRANT SELECT ON user_subscription_info TO authenticated;
GRANT SELECT ON user_subscription_info TO service_role;

-- Nota: Las políticas RLS se aplican a través de la tabla profiles subyacente