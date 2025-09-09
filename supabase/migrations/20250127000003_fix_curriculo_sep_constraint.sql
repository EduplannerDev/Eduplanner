-- Migración: Corregir constraint de la tabla curriculo_sep
-- =====================================================
-- Esta migración corrige el constraint de unicidad para permitir
-- múltiples PDAs por contenido, evitando solo duplicados exactos

-- Eliminar la restricción actual que impide múltiples PDAs por contenido
ALTER TABLE curriculo_sep DROP CONSTRAINT IF EXISTS unique_grado_campo_contenido;

-- Agregar nueva restricción que permita múltiples PDAs por contenido
-- pero evite duplicados exactos de grado+campo+contenido+pda
ALTER TABLE curriculo_sep ADD CONSTRAINT unique_grado_campo_contenido_pda 
UNIQUE(grado, campo_formativo, contenido, pda);

-- Comentario sobre el cambio
COMMENT ON CONSTRAINT unique_grado_campo_contenido_pda ON curriculo_sep IS 
'Permite múltiples PDAs por contenido, pero evita duplicados exactos de la combinación grado+campo_formativo+contenido+pda';
