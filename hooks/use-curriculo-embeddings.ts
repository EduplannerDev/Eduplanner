"use client"

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface CurriculoSearchResult {
  id: string
  contenido: string
  materia: string
  grado: number
  bloque?: string
  campo_formativo?: string
  similarity?: number
}

interface UseCurriculoEmbeddingsReturn {
  searchByText: (query: string, grado?: number, materia?: string) => Promise<CurriculoSearchResult[]>
  searchBySimilarity: (queryEmbedding: number[], grado?: number, limit?: number) => Promise<CurriculoSearchResult[]>
  getWithoutEmbeddings: () => Promise<CurriculoSearchResult[]>
  loading: boolean
  error: string | null
}

export function useCurriculoEmbeddings(): UseCurriculoEmbeddingsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Búsqueda por texto (usando búsqueda de texto tradicional)
  const searchByText = useCallback(async (
    query: string, 
    grado?: number, 
    materia?: string
  ): Promise<CurriculoSearchResult[]> => {
    setLoading(true)
    setError(null)

    try {
      let queryBuilder = supabase
        .from('curriculo_sep')
        .select('id, contenido, materia, grado, bloque, campo_formativo')
        .textSearch('contenido', query, {
          type: 'websearch',
          config: 'spanish'
        })

      if (grado) {
        queryBuilder = queryBuilder.eq('grado', grado)
      }

      if (materia) {
        queryBuilder = queryBuilder.eq('materia', materia)
      }

      const { data, error } = await queryBuilder
        .limit(20)
        .order('grado', { ascending: true })

      if (error) {
        throw new Error(`Error en búsqueda de texto: ${error.message}`)
      }

      return data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error en búsqueda de texto:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Búsqueda por similitud vectorial (requiere que el embedding esté en la base de datos)
  const searchBySimilarity = useCallback(async (
    queryEmbedding: number[], 
    grado?: number, 
    limit: number = 10
  ): Promise<CurriculoSearchResult[]> => {
    setLoading(true)
    setError(null)

    try {
      // Convertir el array a formato vector para la consulta
      const vectorString = `[${queryEmbedding.join(',')}]`
      
      // Usar una consulta SQL directa para búsqueda vectorial
      const { data, error } = await supabase.rpc('search_curriculo_by_similarity', {
        query_embedding: vectorString,
        match_threshold: 0.7,
        match_count: limit,
        grado_filter: grado || null
      })

      if (error) {
        throw new Error(`Error en búsqueda vectorial: ${error.message}`)
      }

      return data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error en búsqueda vectorial:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener registros sin embeddings
  const getWithoutEmbeddings = useCallback(async (): Promise<CurriculoSearchResult[]> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.rpc('get_curriculo_without_embeddings')

      if (error) {
        throw new Error(`Error obteniendo registros sin embeddings: ${error.message}`)
      }

      return data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error obteniendo registros sin embeddings:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    searchByText,
    searchBySimilarity,
    getWithoutEmbeddings,
    loading,
    error
  }
}

// Hook específico para obtener sugerencias de PDAs usando Gemini
export function useSuggestPdas() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suggestPdas = useCallback(async (
    problematica: string, 
    grado: number, 
    materia?: string, 
    limit?: number
  ): Promise<CurriculoSearchResult[]> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/proyectos/suggest-pdas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problematica, grado, materia, limit })
      })

      if (!response.ok) {
        throw new Error(`Error obteniendo sugerencias: ${response.statusText}`)
      }

      const data = await response.json()
      return data.suggestions || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error obteniendo sugerencias:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    suggestPdas,
    loading,
    error
  }
}
