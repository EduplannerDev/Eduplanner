-- Temporalmente deshabilitar RLS para mobile_notifications para permitir inserción pública
-- Esto es seguro porque solo almacenamos emails para notificaciones

-- Deshabilitar RLS para la tabla mobile_notifications
ALTER TABLE mobile_notifications DISABLE ROW LEVEL SECURITY;

-- Agregar comentario explicativo
COMMENT ON TABLE mobile_notifications IS 'Tabla para emails de notificaciones móviles - RLS deshabilitado para permitir inserción pública de emails';
