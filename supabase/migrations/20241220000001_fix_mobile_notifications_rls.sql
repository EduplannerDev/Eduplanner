-- Fix RLS policies for mobile_notifications table

-- Primero, eliminar las políticas existentes si existen
DROP POLICY IF EXISTS "Allow public email capture" ON mobile_notifications;
DROP POLICY IF EXISTS "Allow authenticated users to read" ON mobile_notifications;

-- Crear nueva política más permisiva para inserción pública (usuarios anónimos y autenticados)
CREATE POLICY "Enable insert for everyone" ON mobile_notifications
    FOR INSERT WITH CHECK (true);

-- Crear política para lectura (solo usuarios autenticados pueden leer)
CREATE POLICY "Enable read for authenticated users" ON mobile_notifications
    FOR SELECT USING (auth.role() = 'authenticated');

-- Crear política para actualización (solo usuarios autenticados)
CREATE POLICY "Enable update for authenticated users" ON mobile_notifications
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Crear política para eliminación (solo usuarios autenticados)
CREATE POLICY "Enable delete for authenticated users" ON mobile_notifications
    FOR DELETE USING (auth.role() = 'authenticated');

-- Asegurar que RLS esté habilitado
ALTER TABLE mobile_notifications ENABLE ROW LEVEL SECURITY;

-- Comentarios para claridad
COMMENT ON POLICY "Enable insert for everyone" ON mobile_notifications IS 'Permite a cualquiera insertar emails para notificaciones';
COMMENT ON POLICY "Enable read for authenticated users" ON mobile_notifications IS 'Solo usuarios autenticados pueden leer emails';
COMMENT ON POLICY "Enable update for authenticated users" ON mobile_notifications IS 'Solo usuarios autenticados pueden actualizar';
COMMENT ON POLICY "Enable delete for authenticated users" ON mobile_notifications IS 'Solo usuarios autenticados pueden eliminar';
