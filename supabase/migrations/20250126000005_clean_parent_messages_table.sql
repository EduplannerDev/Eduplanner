-- Migración: Limpiar tabla parent_messages eliminando campos innecesarios
-- =====================================================
-- Esta migración elimina campos que no se están utilizando en la aplicación

-- PASO 1: ELIMINAR CAMPOS INNECESARIOS
-- =====================================================

-- Eliminar campos relacionados con información del destinatario (se obtiene de alumnos)
ALTER TABLE parent_messages DROP COLUMN IF EXISTS parent_name;
ALTER TABLE parent_messages DROP COLUMN IF EXISTS parent_email;
ALTER TABLE parent_messages DROP COLUMN IF EXISTS parent_phone;

-- Eliminar campos de estado de envío (no se están usando)
ALTER TABLE parent_messages DROP COLUMN IF EXISTS is_sent;
ALTER TABLE parent_messages DROP COLUMN IF EXISTS sent_at;

-- PASO 2: ELIMINAR ÍNDICES INNECESARIOS
-- =====================================================
DROP INDEX IF EXISTS idx_parent_messages_is_sent;
DROP INDEX IF EXISTS idx_parent_messages_parent_email;

-- PASO 3: MODIFICAR COLUMNA ALUMNO_ID PARA PERMITIR NULL
-- =====================================================
-- Esto permite mensajes generales sin alumno específico
ALTER TABLE parent_messages ALTER COLUMN alumno_id DROP NOT NULL;

-- PASO 4: COMENTARIOS ACTUALIZADOS
-- =====================================================
COMMENT ON TABLE parent_messages IS 'Tabla simplificada para mensajes dirigidos a padres de familia';
COMMENT ON COLUMN parent_messages.user_id IS 'ID del usuario que creó el mensaje';
COMMENT ON COLUMN parent_messages.alumno_id IS 'ID del alumno (opcional para mensajes generales)';
COMMENT ON COLUMN parent_messages.title IS 'Título del mensaje';
COMMENT ON COLUMN parent_messages.content IS 'Contenido del mensaje';
COMMENT ON COLUMN parent_messages.message_type IS 'Tipo de mensaje: general, academico, comportamiento, etc.';
COMMENT ON COLUMN parent_messages.delivery_method IS 'Método de entrega: email, whatsapp, sms, manual';

-- Mensaje de finalización
DO $$
BEGIN
    RAISE NOTICE 'Tabla parent_messages limpiada exitosamente';
    RAISE NOTICE 'Campos eliminados: parent_name, parent_email, parent_phone, is_sent, sent_at';
    RAISE NOTICE 'Columna alumno_id ahora permite NULL para mensajes generales';
END $$;