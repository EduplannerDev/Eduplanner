import { createClient } from '@supabase/supabase-js'
import { google } from '@ai-sdk/google'
import { embed } from 'ai'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function debugSearch() {
    const query = "¿como hago una planeacion?"

    console.log(`🔎 Buscando: "${query}"`)

    try {
        const { embedding } = await embed({
            model: google.textEmbeddingModel("text-embedding-004"),
            value: query,
        })

        console.log("✅ Embedding generado. Longitud:", embedding.length)
        console.log("Primeros 5 valores:", embedding.slice(0, 5))

        // Forzar string format como en la insercion original antes de mi cambio a array, por si acaso
        // Pero el RPC espera vector. Vamos a probar tal cual está en el route.ts
        // En el route.ts pasan 'embedding' directo (que es number[]).

        // Veamos que hay en la base de datos primero
        const { count, error: countError } = await supabase
            .from('documentation_embeddings')
            .select('*', { count: 'exact', head: true })

        console.log(`📊 Total docs en DB: ${count}`)
        if (countError) console.error("Error contando:", countError)

        // Probar búsqueda
        const { data: documents, error } = await supabase.rpc('search_documentation_by_similarity', {
            query_embedding: embedding, // Supabase client debería manejar conversion a vector string si es necesario, o el driver lo hace.
            match_threshold: 0.1, // Bajar umbral drasticamente para ver si encuentra ALGO
            match_count: 5
        })

        if (error) {
            console.error("❌ Error en RPC:", error)
        } else {
            console.log(`✅ Resultados encontrados: ${documents?.length || 0}`)
            documents?.forEach((doc: any, i: number) => {
                console.log(`\n--- Resultado ${i + 1} (${doc.similarity.toFixed(4)}) ---`)
                console.log(`Título: ${doc.title}`)
                console.log(`Contenido preview: ${doc.content.substring(0, 100)}...`)
            })
        }

    } catch (e) {
        console.error("Excepción:", e)
    }
}

debugSearch()
