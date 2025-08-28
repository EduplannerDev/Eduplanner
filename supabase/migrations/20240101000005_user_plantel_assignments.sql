-- Migración: Crear tabla de asignaciones usuario-plantel
-- =====================================================
-- Esta migración crea la tabla para manejar asignaciones múltiples
-- de usuarios a planteles con roles específicos

-- 1. CREAR TABLA USER_PLANTEL_ASSIGNMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_plantel_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plantel_id UUID NOT NULL REFERENCES planteles(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'profesor',
    activo BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar asignaciones duplicadas
    UNIQUE(user_id, plantel_id)
);

-- 2. CREAR TRIGGER PARA UPDATED_AT
-- =====================================================
CREATE TRIGGER update_user_plantel_assignments_updated_at
    BEFORE UPDATE ON user_plantel_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. CREAR ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_plantel_assignments_user_id ON user_plantel_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plantel_assignments_plantel_id ON user_plantel_assignments(plantel_id);
CREATE INDEX IF NOT EXISTS idx_user_plantel_assignments_role ON user_plantel_assignments(role);
CREATE INDEX IF NOT EXISTS idx_user_plantel_assignments_activo ON user_plantel_assignments(activo);
CREATE INDEX IF NOT EXISTS idx_user_plantel_assignments_assigned_by ON user_plantel_assignments(assigned_by);

-- 4. COMENTARIOS
-- =====================================================
COMMENT ON TABLE user_plantel_assignments IS 'Asignaciones de usuarios a planteles (para casos de múltiples planteles)';
COMMENT ON COLUMN user_plantel_assignments.user_id IS 'ID del usuario asignado';
COMMENT ON COLUMN user_plantel_assignments.plantel_id IS 'ID del plantel al que se asigna';
COMMENT ON COLUMN user_plantel_assignments.role IS 'Rol específico del usuario en este plantel';
COMMENT ON COLUMN user_plantel_assignments.activo IS 'Estado de la asignación';
COMMENT ON COLUMN user_plantel_assignments.assigned_by IS 'Usuario que realizó la asignación';

-- 5. MIGRAR DATOS EXISTENTES (SI LOS HAY)
-- =====================================================
-- Si hay usuarios con plantel_id en profiles, crear asignaciones
INSERT INTO user_plantel_assignments (user_id, plantel_id, role, activo, assigned_at)
SELECT 
    id as user_id,
    plantel_id,
    role,
    activo,
    NOW() as assigned_at
FROM profiles 
WHERE plantel_id IS NOT NULL
ON CONFLICT (user_id, plantel_id) DO NOTHING;