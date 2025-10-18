-- Migración: Agregar política RLS para DELETE en error_logs
-- =====================================================
-- Esta migración agrega la política necesaria para que los administradores puedan eliminar logs

-- Política para que los administradores puedan eliminar logs
CREATE POLICY "Admins can delete error logs" ON error_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'administrador'
        )
    );

-- Comentario explicativo
COMMENT ON POLICY "Admins can delete error logs" ON error_logs IS 'Permite a los administradores eliminar logs de errores del sistema';
