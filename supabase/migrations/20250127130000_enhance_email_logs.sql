-- Migración: Mejorar tabla email_logs para almacenar más detalles
-- =====================================================
-- Esta migración agrega campos para almacenar destinatarios específicos y remitente

-- PASO 1: AGREGAR NUEVOS CAMPOS
-- =====================================================

-- Agregar campo para almacenar la lista de destinatarios específicos
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS recipients_list JSONB;

-- Agregar campo para almacenar información del remitente
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS sender_email TEXT;

-- Agregar campo para almacenar el contenido completo del HTML
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS full_content TEXT;

-- PASO 2: COMENTARIOS EXPLICATIVOS
-- =====================================================
COMMENT ON COLUMN email_logs.recipients_list IS 'Lista de destinatarios específicos en formato JSON';
COMMENT ON COLUMN email_logs.sender_email IS 'Email del remitente utilizado para enviar el correo';
COMMENT ON COLUMN email_logs.full_content IS 'Contenido completo del correo en HTML';

-- PASO 3: ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_email_logs_sender_email ON email_logs(sender_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipients_list ON email_logs USING GIN(recipients_list);

-- Mensaje de finalización
DO $$
BEGIN
    RAISE NOTICE 'Tabla email_logs mejorada exitosamente';
    RAISE NOTICE 'Campos agregados: recipients_list, sender_email, full_content';
    RAISE NOTICE 'Índices creados para mejorar el rendimiento';
END $$;