/**
 * Widgets de logging para el dashboard de administradores
 * - Métricas de sistema en tiempo real
 * - Errores críticos
 * - Estado del sistema
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface LoggingMetrics {
  totalLogs: number
  errorCount: number
  criticalErrors: number
  avgResponseTime: number
  activeUsers: number
  timestamp: number
}

interface CriticalError {
  id: string
  error_type: string
  error_message: string
  user_id: string
  created_at: string
  resolved: boolean
}

interface SystemStatus {
  database: 'healthy' | 'warning' | 'error'
  api: 'healthy' | 'warning' | 'error'
  external: 'healthy' | 'warning' | 'error'
}

export function LoggingMetricsWidget() {
  const [metrics, setMetrics] = useState<LoggingMetrics | null>(null)
  const [criticalErrors, setCriticalErrors] = useState<CriticalError[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'healthy',
    api: 'healthy',
    external: 'healthy'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Cache para evitar requests innecesarios
  const cacheRef = useRef<{ data: any; timestamp: number } | null>(null)
  const CACHE_DURATION = 30000 // 30 segundos

  /**
   * Cargar métricas con cache inteligente
   */
  const loadMetrics = async (forceRefresh = false) => {
    const now = Date.now()
    
    // Verificar cache
    if (!forceRefresh && cacheRef.current && (now - cacheRef.current.timestamp) < CACHE_DURATION) {
      setMetrics(cacheRef.current.data.metrics)
      setCriticalErrors(cacheRef.current.data.criticalErrors)
      setSystemStatus(cacheRef.current.data.systemStatus)
      setIsLoading(false)
      setLastUpdate(new Date(cacheRef.current.data.timestamp))
      return
    }

    try {
      setIsLoading(true)
      
      // Cargar datos en paralelo
      const [metricsRes, errorsRes] = await Promise.all([
        fetch('/api/admin/logs-summary'),
        fetch('/api/admin/critical-errors')
      ])

      const [metricsData, errorsData] = await Promise.all([
        metricsRes.json(),
        errorsRes.json()
      ])

      // Determinar estado del sistema basado en métricas
      const newSystemStatus: SystemStatus = {
        database: 'healthy',
        api: metricsData.avgResponseTime > 3000 ? 'warning' : 'healthy',
        external: 'healthy'
      }

      // Si hay muchos errores, marcar como warning
      if (metricsData.errorCount > 10) {
        newSystemStatus.api = 'warning'
      }
      if (metricsData.errorCount > 50) {
        newSystemStatus.api = 'error'
      }

      const data = {
        metrics: metricsData,
        criticalErrors: errorsData.errors || [],
        systemStatus: newSystemStatus,
        timestamp: now
      }

      // Actualizar cache
      cacheRef.current = { data, timestamp: now }
      
      setMetrics(metricsData)
      setCriticalErrors(errorsData.errors || [])
      setSystemStatus(newSystemStatus)
      setLastUpdate(new Date())

    } catch (error) {
      console.error('Error loading logging metrics:', error)
      setSystemStatus({
        database: 'error',
        api: 'error',
        external: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar métricas inicial
  useEffect(() => {
    loadMetrics()
  }, [])

  // Auto-refresh cada 2 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      loadMetrics()
    }, 120000) // 2 minutos

    return () => clearInterval(interval)
  }, [])

  /**
   * Resolver error crítico
   */
  const resolveError = async (errorId: string) => {
    try {
      await fetch(`/api/admin/resolve-error/${errorId}`, {
        method: 'POST'
      })
      
      // Actualizar estado local
      setCriticalErrors(prev => 
        prev.map(error => 
          error.id === errorId 
            ? { ...error, resolved: true }
            : error
        )
      )
      
      // Limpiar cache para forzar refresh
      cacheRef.current = null
      
    } catch (error) {
      console.error('Error resolving critical error:', error)
    }
  }

  /**
   * Obtener color del estado
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'error': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  /**
   * Obtener icono del estado
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-3 h-3" />
      case 'warning': return <AlertTriangle className="w-3 h-3" />
      case 'error': return <XCircle className="w-3 h-3" />
      default: return <Activity className="w-3 h-3" />
    }
  }

  if (isLoading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Monitoreo del Sistema</h3>
          <p className="text-sm text-muted-foreground">
            Métricas de logging y estado del sistema
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {lastUpdate.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadMetrics(true)}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Logs (24h)"
          value={metrics?.totalLogs || 0}
          icon={<Activity className="w-4 h-4" />}
          color="blue"
          trend={metrics?.totalLogs > 1000 ? 'up' : 'stable'}
        />
        <MetricCard
          title="Errores"
          value={metrics?.errorCount || 0}
          icon={<XCircle className="w-4 h-4" />}
          color={metrics?.errorCount > 10 ? 'red' : 'green'}
          trend={metrics?.errorCount > 20 ? 'up' : 'down'}
        />
        <MetricCard
          title="Tiempo Respuesta"
          value={`${metrics?.avgResponseTime || 0}ms`}
          icon={<Clock className="w-4 h-4" />}
          color={metrics?.avgResponseTime > 2000 ? 'orange' : 'green'}
          trend={metrics?.avgResponseTime > 3000 ? 'up' : 'down'}
        />
        <MetricCard
          title="Errores Críticos"
          value={criticalErrors.filter(e => !e.resolved).length}
          icon={<AlertTriangle className="w-4 h-4" />}
          color={criticalErrors.filter(e => !e.resolved).length > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Estado del sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Estado del Sistema
          </CardTitle>
          <CardDescription>
            Estado actual de los componentes principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${getStatusColor(systemStatus.database)}`}>
                  {getStatusIcon(systemStatus.database)}
                </div>
                <span className="text-sm font-medium">Base de Datos</span>
              </div>
              <Badge variant={systemStatus.database === 'healthy' ? 'default' : 'destructive'}>
                {systemStatus.database === 'healthy' ? 'Saludable' : 
                 systemStatus.database === 'warning' ? 'Advertencia' : 'Error'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${getStatusColor(systemStatus.api)}`}>
                  {getStatusIcon(systemStatus.api)}
                </div>
                <span className="text-sm font-medium">API Routes</span>
              </div>
              <Badge variant={systemStatus.api === 'healthy' ? 'default' : 'destructive'}>
                {systemStatus.api === 'healthy' ? 'Saludable' : 
                 systemStatus.api === 'warning' ? 'Advertencia' : 'Error'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${getStatusColor(systemStatus.external)}`}>
                  {getStatusIcon(systemStatus.external)}
                </div>
                <span className="text-sm font-medium">Servicios Externos</span>
              </div>
              <Badge variant={systemStatus.external === 'healthy' ? 'default' : 'destructive'}>
                {systemStatus.external === 'healthy' ? 'Saludable' : 
                 systemStatus.external === 'warning' ? 'Advertencia' : 'Error'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Errores críticos */}
      {criticalErrors.filter(e => !e.resolved).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Errores Críticos ({criticalErrors.filter(e => !e.resolved).length} sin resolver)
            </CardTitle>
            <CardDescription>
              Errores que requieren atención inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalErrors.filter(e => !e.resolved).slice(0, 5).map((error) => (
                <div
                  key={error.id}
                  className="p-4 rounded-lg border bg-red-50 border-red-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive">
                          Pendiente
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(error.created_at).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm">{error.error_type}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {error.error_message.substring(0, 200)}
                        {error.error_message.length > 200 && '...'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveError(error.id)}
                      className="ml-4"
                    >
                      Marcar Resuelto
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Componente de métrica optimizado
 */
function MetricCard({ 
  title, 
  value, 
  icon, 
  color,
  trend
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'red' | 'orange'
  trend?: 'up' | 'down' | 'stable'
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    orange: 'text-orange-600 bg-orange-50'
  }

  const getTrendIcon = () => {
    if (!trend) return null
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-red-500" />
      case 'down': return <TrendingDown className="w-3 h-3 text-green-500" />
      default: return null
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
              {icon}
            </div>
            {getTrendIcon()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
