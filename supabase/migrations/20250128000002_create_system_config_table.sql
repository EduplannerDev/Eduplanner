-- Crear tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración inicial para modo mantenimiento
INSERT INTO system_config (config_key, config_value, description) 
VALUES ('maintenance_mode', 'false', 'Controla si el sistema está en modo mantenimiento')
ON CONFLICT (config_key) DO NOTHING;

-- Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar timestamp automáticamente
CREATE TRIGGER update_system_config_updated_at 
    BEFORE UPDATE ON system_config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Crear función para obtener configuración
CREATE OR REPLACE FUNCTION get_system_config(key_name TEXT)
RETURNS TEXT AS $$
DECLARE
    config_val TEXT;
BEGIN
    SELECT config_value INTO config_val 
    FROM system_config 
    WHERE config_key = key_name;
    
    RETURN config_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para actualizar configuración (solo para admins)
CREATE OR REPLACE FUNCTION update_system_config(key_name TEXT, new_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar si el usuario es admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'administrador'
    ) THEN
        RAISE EXCEPTION 'Solo los administradores pueden modificar la configuración del sistema';
    END IF;
    
    -- Actualizar o insertar la configuración
    INSERT INTO system_config (config_key, config_value) 
    VALUES (key_name, new_value)
    ON CONFLICT (config_key) 
    DO UPDATE SET 
        config_value = EXCLUDED.config_value,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Configurar RLS (Row Level Security)
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan leer la configuración
CREATE POLICY "Todos pueden leer configuración del sistema" ON system_config
    FOR SELECT USING (true);

-- Política para que solo admins puedan modificar
CREATE POLICY "Solo admins pueden modificar configuración" ON system_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'administrador'
        )
    );