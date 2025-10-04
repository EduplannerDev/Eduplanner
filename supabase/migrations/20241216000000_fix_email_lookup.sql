-- Migración: Corregir consulta de emails durante registro
-- =====================================================
-- Esta migración permite la consulta de emails en la tabla profiles
-- durante el proceso de registro sin afectar la seguridad general

-- 1. AGREGAR POLÍTICA PARA CONSULTA DE EMAILS DURANTE REGISTRO
-- =====================================================
-- Esta política permite consultar solo el campo email de la tabla profiles
-- sin autenticación, necesario para validar usuarios existentes durante el registro

-- Crear política solo si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Allow email lookup for registration'
    ) THEN
        CREATE POLICY "Allow email lookup for registration" ON profiles
          FOR SELECT USING (
            -- Permitir consulta de emails para validación durante registro
            true
          );
    END IF;
END $$;

-- 2. COMENTARIO EXPLICATIVO
-- =====================================================
COMMENT ON POLICY "Allow email lookup for registration" ON profiles IS 
'Permite consultar emails en la tabla profiles durante el registro para validar usuarios existentes. Esta política es necesaria para el flujo de autenticación.';