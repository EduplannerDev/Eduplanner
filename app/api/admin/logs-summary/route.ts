/**
 * API Route ultra-optimizada para resumen de logs
 * - Consultas mínimas a la base de datos
 * - Cache en memoria
 * - Timeout corto
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// Cache simple en memoria (se reinicia con cada deployment)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 60000 // 1 minuto

export async function GET(req: NextRequest) {
  try {
    const now = Date.now()
    const cacheKey = 'logs-summary'

    // Verificar cache
    const cached = cache.get(cacheKey)
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return NextResponse.json(cached.data)
    }

    const supabase = createServiceClient()
    
    // Consulta optimizada para obtener métricas básicas
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Ejecutar consultas en paralelo
    const [logsCount, errorsCount, criticalErrorsCount, avgResponseTime] = await Promise.all([
      // Total de logs en 24h
      supabase
        .from('error_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterday),
      
      // Errores en 24h
      supabase
        .from('error_logs')
        .select('id', { count: 'exact', head: true })
        .eq('level', 'ERROR')
        .gte('created_at', yesterday),
      
      // Errores críticos no resueltos
      supabase
        .from('error_logs')
        .select('id', { count: 'exact', head: true })
        .eq('level', 'FATAL')
        .gte('created_at', yesterday),
      
      // Tiempo promedio de respuesta (solo de logs de API)
      supabase
        .from('error_logs')
        .select('context')
        .eq('category', 'api_success')
        .gte('created_at', yesterday)
        .limit(100) // Solo muestras recientes
    ])

    // Calcular tiempo promedio de respuesta
    let avgResponse = 0
    if (avgResponseTime.data) {
      const responseTimes = avgResponseTime.data
        .map(log => log.context?.responseTime)
        .filter(time => typeof time === 'number')
      
      if (responseTimes.length > 0) {
        avgResponse = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      }
    }

    const summary = {
      totalLogs: logsCount.count || 0,
      errorCount: errorsCount.count || 0,
      criticalErrors: criticalErrorsCount.count || 0,
      avgResponseTime: Math.round(avgResponse),
      activeUsers: 0, // Implementar si es necesario
      timestamp: now
    }

    // Actualizar cache
    cache.set(cacheKey, { data: summary, timestamp: now })

    return NextResponse.json(summary)

  } catch (error) {
    console.error('Error getting logs summary:', error)
    return NextResponse.json(
      { error: 'Failed to get logs summary' },
      { status: 500 }
    )
  }
}
