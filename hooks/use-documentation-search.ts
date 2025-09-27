"use client"

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface DocumentationSearchResult {
  id: string
  module_name: string
  flow_type: string
  title: string
  content: string
  section_title?: string
  section_content?: string
  similarity: number
}

export function useDocumentationSearch() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Búsqueda por texto simple (sin embeddings)
  const searchByText = useCallback(async (
    query: string,
    moduleFilter?: string
  ): Promise<DocumentationSearchResult[]> => {
    setLoading(true)
    setError(null)

    try {
      let queryBuilder = supabase
        .from('documentation_embeddings')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,section_content.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(10)

      if (moduleFilter) {
        queryBuilder = queryBuilder.eq('module_name', moduleFilter)
      }

      const { data, error } = await queryBuilder

      if (error) {
        throw new Error(`Error en búsqueda de texto: ${error.message}`)
      }

      return data?.map(item => ({
        ...item,
        similarity: 1.0 // Asignar similitud máxima para búsqueda de texto
      })) || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Búsqueda por similitud semántica (requiere embeddings)
  const searchBySimilarity = useCallback(async (
    queryEmbedding: number[],
    moduleFilter?: string,
    threshold: number = 0.7,
    limit: number = 5
  ): Promise<DocumentationSearchResult[]> => {
    setLoading(true)
    setError(null)

    try {
      // Convertir el array a formato vector para la consulta
      const vectorString = `[${queryEmbedding.join(',')}]`
      
      const { data, error } = await supabase.rpc('search_documentation_by_similarity', {
        query_embedding: vectorString,
        match_threshold: threshold,
        match_count: limit,
        module_filter: moduleFilter || null
      })

      if (error) {
        throw new Error(`Error en búsqueda vectorial: ${error.message}`)
      }

      return data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Generar embedding para una consulta de texto
  const generateQueryEmbedding = useCallback(async (query: string): Promise<number[] | null> => {
    try {
      const response = await fetch('/api/generate-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: query })
      })

      if (!response.ok) {
        throw new Error('Error generando embedding')
      }

      const { embedding } = await response.json()
      return embedding
    } catch (err) {
      console.error('Error generando embedding:', err)
      setError('Error generando embedding para la búsqueda')
      return null
    }
  }, [])

  // Búsqueda inteligente que combina texto y semántica
  const smartSearch = useCallback(async (
    query: string,
    moduleFilter?: string,
    useSemanticSearch: boolean = true
  ): Promise<DocumentationSearchResult[]> => {
    setLoading(true)
    setError(null)

    try {
      let results: DocumentationSearchResult[] = []

      if (useSemanticSearch) {
        // Intentar búsqueda semántica primero
        const embedding = await generateQueryEmbedding(query)
        if (embedding) {
          results = await searchBySimilarity(embedding, moduleFilter, 0.6, 5)
        }
      }

      // Si no hay resultados semánticos o no se usa búsqueda semántica, usar búsqueda de texto
      if (results.length === 0) {
        results = await searchByText(query, moduleFilter)
      }

      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [searchBySimilarity, searchByText, generateQueryEmbedding])

  // Obtener documentación por módulo
  const getDocumentationByModule = useCallback(async (
    moduleName: string
  ): Promise<DocumentationSearchResult[]> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('documentation_embeddings')
        .select('*')
        .eq('module_name', moduleName)
        .order('flow_type', { ascending: true })

      if (error) {
        throw new Error(`Error obteniendo documentación: ${error.message}`)
      }

      return data?.map(item => ({
        ...item,
        similarity: 1.0
      })) || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener todos los módulos disponibles
  const getAvailableModules = useCallback(async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('documentation_embeddings')
        .select('module_name')
        .order('module_name')

      if (error) {
        throw new Error(`Error obteniendo módulos: ${error.message}`)
      }

      // Eliminar duplicados
      const modules = [...new Set(data?.map(item => item.module_name) || [])]
      return modules
    } catch (err) {
      console.error('Error obteniendo módulos:', err)
      return []
    }
  }, [])

  return {
    loading,
    error,
    searchByText,
    searchBySimilarity,
    smartSearch,
    getDocumentationByModule,
    getAvailableModules,
    generateQueryEmbedding
  }
}