/**
 * API Route para errores críticos
 * - Solo errores no resueltos
 * - Limitado a 50 resultados
 * - Cache corto
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5000 // Reducir cache a 5 segundos para testing

export async function GET(req: NextRequest) {
  try {
    const now = Date.now()
    const cacheKey = 'critical-errors'

    // Verificar cache
    const cached = cache.get(cacheKey)
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return NextResponse.json(cached.data)
    }

    const supabase = createServiceClient()
    
    // Solo errores no resueltos de los últimos 7 días
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: errors, error } = await supabase
      .from('error_logs')
      .select('id, level, category, message, context, user_id, user_email, user_role, module, component, action, created_at')
      .in('level', ['ERROR', 'FATAL'])
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    const result = { errors: errors || [] }

    // Actualizar cache
    cache.set(cacheKey, { data: result, timestamp: now })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error getting critical errors:', error)
    return NextResponse.json(
      { error: 'Failed to get critical errors' },
      { status: 500 }
    )
  }
}
