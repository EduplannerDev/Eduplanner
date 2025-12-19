-- Migration: Add 'abierta' estado to the estado_protocolo_enum
-- This represents the state when an incident has been printed but not yet signed
-- Workflow: borrador → generado → abierta → firmado → cerrado

-- Add 'abierta' value to the enum type
-- Note: PostgreSQL doesn't support 'IF NOT EXISTS' with ALTER TYPE ADD VALUE in older versions
-- We use a DO block to handle this safely
DO $$ BEGIN
    -- Try to add the value if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'abierta' 
        AND enumtypid = 'estado_protocolo_enum'::regtype
    ) THEN
        ALTER TYPE estado_protocolo_enum ADD VALUE 'abierta' AFTER 'generado';
    END IF;
END $$;
