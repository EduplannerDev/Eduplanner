# Sistema de Vectorización de Libros SEP

Sistema automatizado para extraer, procesar y vectorizar el contenido de los libros de texto gratuitos oficiales de la SEP (CONALITEG) para uso en el sistema RAG de EduPlanner.

## 📚 Descripción General

Este sistema permite que el asistente de IA "Edu" cite y use contenido oficial de los libros de texto de la SEP al responder preguntas de los usuarios, mejorando dramáticamente la precisión y confiabilidad de las respuestas.

### Tecnologías Utilizadas

- **Google Cloud Vision API**: OCR de alta precisión para extraer texto de imágenes
- **Google AI (Gemini)**: Generación de embeddings vectoriales
- **Supabase**: Almacenamiento de vectores y búsqueda semántica
- **TypeScript**: Scripts de procesamiento

## 📊 Catálogo de Libros

### Preescolar (16 libros)
- 1° a 3° grado
- Materias: Lenguajes, Exploración, Matemáticas, Arte y Cultura, Guías para Docentes/Familias

### Primaria (24 libros)
- 1° a 6° grado
- Materias: Proyectos de Aula, Lengua Materna, Matemáticas, Nuestros Saberes

### Secundaria (13 libros)
- 1° a 3° grado
- Materias: Español, Matemáticas, Ciencia y Tecnología, Historia, Geografía

**Total: 53 libros | ~13,200 páginas**

## 🏗️ Arquitectura

```
┌─────────────────────┐
│  CONALITEG Website  │
│  (Imágenes JPG)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  1. Scraper         │
│  - Detecta páginas  │
│  - Descarga JPGs    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  2. OCR Processor   │
│  - Google Vision    │
│  - Extrae texto     │
│  - Confianza >95%   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  3. Chunking        │
│  - Divide texto     │
│  - Detecta secciones│
│  - Overlap 200 chars│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  4. Vectorization   │
│  - Genera embeddings│
│  - text-embedding-  │
│    004 (768 dims)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Supabase           │
│  sep_books_content  │
│  - 15,000 chunks    │
│  - Búsqueda         │
│    semántica        │
└─────────────────────┘
```

## 🚀 Uso Rápido

### Prueba con 1 Libro
```bash
# Descargar, procesar y vectorizar un solo libro
npm run sep:scrape -- --libro=P1PCA
npm run sep:ocr -- --libro=P1PCA  
npm run sep:vectorize -- --libro=P1PCA
```

### Modo Test (Solo 5 páginas)
```bash
npm run sep:scrape:test -- --libro=P3MAT
npm run sep:ocr:test -- --libro=P3MAT
```

### Procesamiento Completo
```bash
# Todo el catálogo (16-25 horas)
npm run sep:process-all
```

## 📁 Estructura de Archivos

```
eduplanner/
├── lib/
│   └── catalogo-libros-sep.ts        # Catálogo de 37 libros
├── scripts/
│   ├── scrape-conaliteg-books.ts     # Paso 1: Descarga
│   ├── process-books-ocr.ts          # Paso 2: OCR
│   └── vectorize-sep-books.ts        # Paso 3: Vectorización
├── supabase/
│   └── migrations/
│       └── 20260120000000_create_sep_books_content.sql
└── downloads/
    ├── sep-books/                    # Imágenes descargadas
    │   └── 2025/
    │       ├── P1PCA/
    │       │   ├── 001.jpg
    │       │   ├── 002.jpg
    │       │   └── metadata.json
    │       └── ...
    └── sep-books-ocr/                # Texto extraído
        └── 2025/
            ├── P1PCA/
            │   ├── page_001.json
            │   ├── page_002.json
            │   └── libro_completo.json
            └── ...
```

## ⚙️ Configuración

### Variables de Entorno Requeridas

```bash
# .env.local
GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Habilitar APIs en Google Cloud

1. [Cloud Vision API](https://console.cloud.google.com/apis/library/vision.googleapis.com)
2. [Generative AI API](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com)

## 💰 Costos

| Servicio | Costo Unitario | Total (53 libros) |
|----------|----------------|-------------------|
| Google Vision OCR | $0.0015/página | ~$19.80 USD |
| Google Embeddings | $0.00002/chunk | ~$0.53 USD |
| Supabase Storage | Incluido | $0 |
| **TOTAL** | | **~$20.33 USD** |

## 🔍 Búsqueda Semántica

### Ejemplo de Consulta
```typescript
const { data } = await supabase.rpc('search_sep_books_by_similarity', {
  query_embedding: embedding,
  match_threshold: 0.6,
  match_count: 5,
  grado_filter: '3°',
  nivel_filter: 'Primaria',
  materia_filter: 'Matemáticas'
});
```

### Resultado
```json
[
  {
    "libro_nombre": "Matemáticas",
    "grado": "3°",
    "nivel": "Primaria",
    "seccion": "Unidad 2",
    "contenido": "La suma es una operación...",
    "pagina_inicio": 25,
    "pagina_fin": 28,
    "similarity": 0.87
  }
]
```

## 📈 Estadísticas

Después del procesamiento completo:

- **Libros procesados**: 53
- **Páginas totales**: ~13,200
- **Chunks vectorizados**: ~26,400
- **Confianza OCR promedio**: 96.5%
- **Palabras extraídas**: ~2,640,000

## 🔄 Actualización Anual

Cada ciclo escolar (Julio):

1. Actualizar `lib/catalogo-libros-sep.ts` con nuevos códigos
2. Ejecutar `npm run sep:process-all`
3. (Opcional) Eliminar libros del ciclo anterior

**Costo anual**: ~$20 USD

## 🐛 Troubleshooting

### Problema: OCR muy lento
**Solución**: Es normal. Google Vision procesa ~60 páginas/minuto.

### Problema: Error "API quota exceeded"
**Solución**: El script tiene rate limiting. Espera 1 minuto y reintenta.

### Problema: Chunks vacíos
**Solución**: El script filtra chunks < 100 chars automáticamente.

## 📚 Recursos

- [Docs de Google Vision API](https://cloud.google.com/vision/docs)
- [Supabase Vector Search](https://supabase.com/docs/guides/ai/vector-columns)
- [CONALITEG](https://libros.conaliteg.gob.mx/)

## 📝 Licencia

Los libros de texto son propiedad de CONALITEG/SEP y están distribuidos gratuitamente al público. Este sistema se usa únicamente con fines educativos.

---

**Desarrollado para EduPlanner** 🎓
