-- Migration to add 'medio' to nivel_riesgo_enum
-- This aligns the database with the AI classification system

ALTER TYPE nivel_riesgo_enum ADD VALUE IF NOT EXISTS 'medio';
