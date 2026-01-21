import { createClient } from '@supabase/supabase-js'
import { google } from "@ai-sdk/google"
import { embed } from "ai"

export interface LibroReferencia {
    libro: string
    codigo: string
    grado: string
    paginas: string
    contenido: string
    relevancia: number
}

/**
 * Busca contenido relevante en los libros SEP vectorizados
 * basado en el tema de la planeación
 */
export async function buscarContenidoLibrosSEP(
    grado: number,
    materia: string,
    tema: string,
    contexto?: string
): Promise<LibroReferencia[]> {
    try {
        // 1. Crear embedding de la consulta
        const query = `${materia} ${tema} ${contexto || ''} grado ${grado}`
        console.log('🔍 Buscando en libros SEP:', query)

        const { embedding } = await embed({
            model: google.textEmbeddingModel("text-embedding-004"),
            value: query,
        })

        // 2. Búsqueda semántica en Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data, error } = await supabase.rpc('match_sep_books_content', {
            query_embedding: embedding,
            match_threshold: 0.7,
            match_count: 5,
            grado_filter: `${grado}°`
        })

        if (error) {
            console.error('❌ Error en búsqueda SEP:', error)
            return []
        }

        if (!data || data.length === 0) {
            console.log('ℹ️ No se encontraron referencias en libros SEP')
            return []
        }

        console.log(`✅ Encontrados ${data.length} chunks relevantes`)

        // 3. Formatear resultados agrupados por libro
        return agruparPorLibro(data)
    } catch (error) {
        console.error('❌ Error buscando contenido en libros SEP:', error)
        return []
    }
}

/**
 * Agrupa los chunks encontrados por libro y formatea las páginas
 */
function agruparPorLibro(chunks: any[]): LibroReferencia[] {
    const librosMap = new Map()

    chunks.forEach(chunk => {
        if (!librosMap.has(chunk.libro_codigo)) {
            librosMap.set(chunk.libro_codigo, {
                libro: chunk.libro_titulo,
                codigo: chunk.libro_codigo,
                grado: chunk.grado,
                paginas: [],
                contenido: [],
                relevancia: chunk.similarity
            })
        }

        const libro = librosMap.get(chunk.libro_codigo)
        libro.paginas.push(chunk.pagina)
        libro.contenido.push(chunk.contenido)
        // Actualizar relevancia si es mayor
        if (chunk.similarity > libro.relevancia) {
            libro.relevancia = chunk.similarity
        }
    })

    // Formatear y ordenar por relevancia
    return Array.from(librosMap.values())
        .map(libro => ({
            ...libro,
            paginas: formatearRangoPaginas(libro.paginas),
            contenido: libro.contenido.join(' ').substring(0, 300)
        }))
        .sort((a, b) => b.relevancia - a.relevancia)
        .slice(0, 3) // Máximo 3 libros diferentes
}

/**
 * Formatea un array de páginas en rangos (ej: [1,2,3,5,6] -> "1-3, 5-6")
 */
function formatearRangoPaginas(paginas: number[]): string {
    const ordenadas = [...new Set(paginas)].sort((a, b) => a - b)

    if (ordenadas.length === 0) return ''
    if (ordenadas.length === 1) return `${ordenadas[0]}`

    const rangos: string[] = []
    let inicio = ordenadas[0]
    let fin = ordenadas[0]

    for (let i = 1; i < ordenadas.length; i++) {
        if (ordenadas[i] === fin + 1) {
            fin = ordenadas[i]
        } else {
            rangos.push(inicio === fin ? `${inicio}` : `${inicio}-${fin}`)
            inicio = ordenadas[i]
            fin = ordenadas[i]
        }
    }

    rangos.push(inicio === fin ? `${inicio}` : `${inicio}-${fin}`)

    return rangos.join(', ')
}

/**
 * Extrae el tema principal de un mensaje de usuario
 */
export function extraerTema(mensaje: string): string {
    // Extraer texto entre comillas o después de "sobre"
    const patronComillas = /"([^"]+)"/
    const patronSobre = /sobre\s+([^.,]+)/i

    const matchComillas = mensaje.match(patronComillas)
    if (matchComillas) return matchComillas[1]

    const matchSobre = mensaje.match(patronSobre)
    if (matchSobre) return matchSobre[1].trim()

    // Si no encuentra patrón, devolver las primeras 50 palabras
    return mensaje.substring(0, 200)
}
