===============================================================================
                    SISTEMA DE DOCUMENTACIÓN VECTORIZADA
===============================================================================

DESCRIPCIÓN:
Este sistema permite almacenar y buscar la documentación de flujos de manera 
inteligente usando embeddings vectoriales. Facilita encontrar información 
específica sobre cómo usar los diferentes módulos de Eduplanner.

===============================================================================
                              ARCHIVOS CREADOS
===============================================================================

1. **MIGRACIÓN DE BASE DE DATOS**:
   - /supabase/migrations/20250128000001_create_documentation_embeddings.sql
   - Crea la tabla documentation_embeddings con soporte vectorial
   - Incluye políticas RLS y funciones de búsqueda

2. **SCRIPT DE PROCESAMIENTO**:
   - /scripts/generate-documentation-embeddings.ts
   - Procesa archivos .txt y genera embeddings
   - Almacena en la base de datos

3. **HOOK DE BÚSQUEDA**:
   - /hooks/use-documentation-search.ts
   - Proporciona funciones para búsqueda semántica
   - Incluye búsqueda por texto y por similitud

4. **API ENDPOINT**:
   - /app/api/generate-embedding/route.ts
   - Genera embeddings para consultas en tiempo real

===============================================================================
                              CÓMO USAR EL SISTEMA
===============================================================================

PASO 1: EJECUTAR LA MIGRACIÓN
1. Asegúrate de que Supabase esté configurado
2. Ejecuta la migración:
   ```
   supabase db push
   ```

PASO 2: GENERAR EMBEDDINGS INICIALES
1. Configura tu GOOGLE_GENERATIVE_AI_API_KEY en las variables de entorno
2. Ejecuta el script:
   ```
   npx tsx scripts/generate-documentation-embeddings.ts
   ```

PASO 3: USAR EN LA APLICACIÓN
```typescript
import { useDocumentationSearch } from '@/hooks/use-documentation-search'

function DocumentationSearch() {
  const { smartSearch, loading, error } = useDocumentationSearch()
  
  const handleSearch = async (query: string) => {
    const results = await smartSearch(query)
    console.log('Resultados:', results)
  }
  
  return (
    // Tu componente de búsqueda
  )
}
```

===============================================================================
                              ESTRUCTURA DE LA TABLA
===============================================================================

CAMPOS PRINCIPALES:
- **id**: UUID único
- **module_name**: Nombre del módulo (planeaciones, examenes, proyectos, etc.)
- **flow_type**: Tipo de flujo (crear, gestionar, editar, etc.)
- **title**: Título del documento
- **content**: Contenido completo del archivo
- **file_path**: Ruta del archivo original
- **section_title**: Título de sección específica (opcional)
- **section_content**: Contenido de sección específica (opcional)
- **keywords**: Array de palabras clave
- **embedding**: Vector de 768 dimensiones
- **embedding_model**: Modelo usado (text-embedding-004)

===============================================================================
                              FUNCIONES DISPONIBLES
===============================================================================

BÚSQUEDA SEMÁNTICA:
```sql
SELECT * FROM search_documentation_by_similarity(
  query_embedding := '[0.1, 0.2, ...]',
  match_threshold := 0.7,
  match_count := 5,
  module_filter := 'planeaciones'
);
```

OBTENER SIN EMBEDDINGS:
```sql
SELECT * FROM get_documentation_without_embeddings();
```

ACTUALIZAR EMBEDDING:
```sql
SELECT update_documentation_embedding(
  doc_id := 'uuid-here',
  embedding_vector := '[0.1, 0.2, ...]',
  model_name := 'text-embedding-3-small'
);
```

===============================================================================
                              CASOS DE USO
===============================================================================

1. **BÚSQUEDA DE AYUDA EN TIEMPO REAL**:
   - Usuario pregunta "¿cómo creo una planeación?"
   - Sistema busca semánticamente en la documentación
   - Devuelve pasos específicos relevantes

2. **ASISTENTE INTELIGENTE**:
   - Integrar con chat de IA para responder preguntas sobre flujos
   - Proporcionar contexto específico de documentación

3. **SUGERENCIAS CONTEXTUALES**:
   - Mostrar documentación relevante según la página actual
   - Sugerir pasos siguientes basados en la acción del usuario

4. **ANÁLISIS DE CONTENIDO**:
   - Identificar gaps en la documentación
   - Encontrar contenido duplicado o inconsistente

===============================================================================
                              MANTENIMIENTO
===============================================================================

ACTUALIZAR DOCUMENTACIÓN:
1. Modifica los archivos .txt en /docs/flujos/
2. Ejecuta nuevamente el script de embeddings:
   ```
   npx tsx scripts/generate-documentation-embeddings.ts
   ```

AGREGAR NUEVOS MÓDULOS:
1. Crea nuevos archivos .txt siguiendo la convención de nombres
2. El script los procesará automáticamente
3. Actualiza el hook si necesitas lógica específica

MONITOREO:
- Revisa los logs del script para errores
- Verifica que los embeddings se generen correctamente
- Monitorea el uso de la API de OpenAI

===============================================================================
                              CONSIDERACIONES TÉCNICAS
===============================================================================

RENDIMIENTO:
- Los embeddings se generan una vez y se reutilizan
- Búsquedas vectoriales son muy rápidas con índices apropiados
- Considera cache para consultas frecuentes

COSTOS:
- Generación de embeddings usa API de Google Gemini (costo por token)
- Búsquedas no tienen costo adicional
- Regenerar embeddings solo cuando sea necesario

SEGURIDAD:
- RLS habilitado en la tabla
- Solo administradores pueden insertar/actualizar
- Todos los usuarios autenticados pueden leer

===============================================================================
                              PRÓXIMOS PASOS
===============================================================================

MEJORAS SUGERIDAS:
1. Integrar búsqueda en la interfaz principal
2. Crear componente de ayuda contextual
3. Implementar sugerencias automáticas
4. Agregar métricas de uso de documentación
5. Crear sistema de feedback sobre utilidad de la documentación

===============================================================================