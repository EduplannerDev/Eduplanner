-- Script para insertar datos de prueba
-- =====================================================
-- Este script crea datos de prueba para verificar el funcionamiento
-- del sistema de grupos y mensajes

-- 1. INSERTAR GRUPO DE PRUEBA PARA EL PROFESOR ACTUAL
-- =====================================================
-- Primero necesitamos obtener el user_id y plantel_id del profesor actual
-- Reemplaza 'hazzel90@gmail.com' con el email del profesor actual

DO $$
DECLARE
    profesor_user_id UUID;
    profesor_plantel_id UUID;
BEGIN
    -- Obtener el user_id del profesor desde auth.users
    SELECT au.id INTO profesor_user_id
    FROM auth.users au
    WHERE au.email = 'hazzel90@gmail.com';
    
    -- Obtener el plantel_id del profesor desde profiles
    SELECT p.plantel_id INTO profesor_plantel_id
    FROM profiles p
    WHERE p.id = profesor_user_id;
    
    -- Verificar que encontramos los datos
    IF profesor_user_id IS NULL THEN
        RAISE NOTICE 'No se encontró el usuario con email hazzel90@gmail.com';
        RETURN;
    END IF;
    
    IF profesor_plantel_id IS NULL THEN
        RAISE NOTICE 'El profesor no tiene plantel_id asignado';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Profesor encontrado: user_id = %, plantel_id = %', profesor_user_id, profesor_plantel_id;
    
    -- Insertar grupo de prueba si no existe
    INSERT INTO grupos (nombre, grado, grupo, ciclo_escolar, user_id, plantel_id, activo)
    VALUES (
        'Matemáticas 1° A',
        '1°',
        'A',
        '2025-2026',
        profesor_user_id,
        profesor_plantel_id,
        true
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Grupo de prueba creado o ya existía';
    
    -- Insertar algunos alumnos de prueba
    INSERT INTO alumnos (nombre, apellido_paterno, apellido_materno, grupo_id, plantel_id, activo)
    SELECT 
        'Alumno' || generate_series,
        'Apellido' || generate_series,
        'Materno' || generate_series,
        g.id,
        profesor_plantel_id,
        true
    FROM generate_series(1, 3)
    CROSS JOIN grupos g
    WHERE g.user_id = profesor_user_id
    AND g.nombre = 'Matemáticas 1° A'
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Alumnos de prueba creados';
    
END $$;

-- 2. VERIFICAR LOS DATOS CREADOS
-- =====================================================
-- Consultar grupos del profesor
SELECT 
    g.id,
    g.nombre,
    g.grado,
    g.grupo,
    g.ciclo_escolar,
    g.user_id,
    g.plantel_id,
    au.email as profesor_email
FROM grupos g
JOIN auth.users au ON g.user_id = au.id
WHERE au.email = 'hazzel90@gmail.com';

-- Consultar alumnos del grupo
SELECT 
    a.id,
    a.nombre,
    a.apellido_paterno,
    a.apellido_materno,
    g.nombre as grupo_nombre
FROM alumnos a
JOIN grupos g ON a.grupo_id = g.id
JOIN auth.users au ON g.user_id = au.id
WHERE au.email = 'hazzel90@gmail.com';