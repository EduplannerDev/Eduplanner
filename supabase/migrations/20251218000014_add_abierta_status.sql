-- Migration to add 'abierta' to estado_protocolo_enum
ALTER TYPE estado_protocolo_enum ADD VALUE IF NOT EXISTS 'abierta';
