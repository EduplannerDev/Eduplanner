-- Migración: Asegurar campos en tabla email_logs
-- =====================================================
-- Esta migración verifica y agrega campos faltantes de forma segura

DO $$                                                                                                        
BEGIN                                                                                                        
    -- Verificar si la tabla email_logs existe primero
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'email_logs'
    ) THEN
        RAISE NOTICE 'Tabla email_logs no existe, saltando migración';
        RETURN;
    END IF;
    
    -- Verificar y agregar recipients_list si no existe                                                      
    IF NOT EXISTS (                                                                                          
        SELECT 1 FROM information_schema.columns                                                             
        WHERE table_name = 'email_logs' AND column_name = 'recipients_list'                                  
    ) THEN
        ALTER TABLE email_logs ADD COLUMN recipients_list JSONB;
        COMMENT ON COLUMN email_logs.recipients_list IS 'Lista de destinatarios específicos en formato JSON';
        RAISE NOTICE 'Campo recipients_list agregado';
    ELSE
        RAISE NOTICE 'Campo recipients_list ya existe';
    END IF;

    -- Verificar y agregar sender_email si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_logs' AND column_name = 'sender_email'
    ) THEN
        ALTER TABLE email_logs ADD COLUMN sender_email TEXT;
        COMMENT ON COLUMN email_logs.sender_email IS 'Email del remitente utilizado para enviar el correo';
        RAISE NOTICE 'Campo sender_email agregado';
    ELSE
        RAISE NOTICE 'Campo sender_email ya existe';
    END IF;

    -- Verificar y agregar full_content si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_logs' AND column_name = 'full_content'
    ) THEN
        ALTER TABLE email_logs ADD COLUMN full_content TEXT;
        COMMENT ON COLUMN email_logs.full_content IS 'Contenido completo del correo en HTML';
        RAISE NOTICE 'Campo full_content agregado';
    ELSE
        RAISE NOTICE 'Campo full_content ya existe';
    END IF;

    -- Crear índice para sender_email si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'email_logs' AND indexname = 'idx_email_logs_sender_email'
    ) THEN
        CREATE INDEX idx_email_logs_sender_email ON email_logs(sender_email);
        RAISE NOTICE 'Índice idx_email_logs_sender_email creado';
    ELSE
        RAISE NOTICE 'Índice idx_email_logs_sender_email ya existe';
    END IF;

    -- Crear índice GIN para recipients_list si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'email_logs' AND indexname = 'idx_email_logs_recipients_list'
    ) THEN
        CREATE INDEX idx_email_logs_recipients_list ON email_logs USING GIN(recipients_list);
        RAISE NOTICE 'Índice idx_email_logs_recipients_list creado';
    ELSE
        RAISE NOTICE 'Índice idx_email_logs_recipients_list ya existe';
    END IF;

    RAISE NOTICE '=== VERIFICACIÓN COMPLETADA ===';
    RAISE NOTICE 'Tabla email_logs verificada y actualizada';
END $$;