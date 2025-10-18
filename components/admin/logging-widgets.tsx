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
  TrendingDown,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

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
  level: string
  category: string
  message: string
  context?: any
  user_id?: string
  user_email?: string
  user_role?: string
  module?: string
  component?: string
  action?: string
  created_at: string
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
  const [currentPage, setCurrentPage] = useState(1)
  const [errorsPerPage] = useState(10)
  const [clearingErrors, setClearingErrors] = useState(false)

  // Cache para evitar requests innecesarios
  const cacheRef = useRef<{ data: any; timestamp: number } | null>(null)
  const CACHE_DURATION = 30000 // 30 segundos

  /**
   * Marcar error como resuelto
   */
  const markErrorAsResolved = async (errorId: string) => {
    try {
      const response = await fetch(`/api/admin/resolve-error/${errorId}`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error marking error as resolved')
      }

      const result = await response.json()
      
      // Recargar métricas después de marcar como resuelto
      await loadMetrics(true)
      
      toast.success(result.message || 'Error marcado como resuelto')
      
    } catch (error) {
      console.error('Error marking error as resolved:', error)
      toast.error(error instanceof Error ? error.message : 'Error al marcar como resuelto')
    }
  }

  /**
   * Limpiar errores antiguos
   */
  const clearOldErrors = async () => {
    try {
      setClearingErrors(true)
      
      const response = await fetch('/api/admin/clear-old-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          olderThanDays: 1 // Limpiar errores más antiguos que 1 día
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error clearing old errors')
      }

      const result = await response.json()
      
      // Recargar métricas después de limpiar
      await loadMetrics(true)
      
      toast.success(result.message)
      
    } catch (error) {
      console.error('Error clearing old errors:', error)
      toast.error(error instanceof Error ? error.message : 'Error al limpiar errores antiguos')
    } finally {
      setClearingErrors(false)
    }
  }

  /**
   * Limpiar todos los errores
   */
  const clearAllErrors = async () => {
    try {
      setClearingErrors(true)
      
      const response = await fetch('/api/admin/clear-old-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clearAll: true // Limpiar todos los errores
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error clearing all errors')
      }

      const result = await response.json()
      
      // Recargar métricas después de limpiar
      await loadMetrics(true)
      
      toast.success(result.message)
      
    } catch (error) {
      console.error('Error clearing all errors:', error)
      toast.error(error instanceof Error ? error.message : 'Error al limpiar todos los errores')
    } finally {
      setClearingErrors(false)
    }
  }

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
      setCurrentPage(1) // Resetear a la primera página

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
          <Button
            variant="destructive"
            size="sm"
            onClick={clearOldErrors}
            disabled={clearingErrors || isLoading}
          >
            <Trash2 className={`w-4 h-4 mr-2 ${clearingErrors ? 'animate-spin' : ''}`} />
            {clearingErrors ? 'Limpiando...' : 'Limpiar Antiguos'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={clearAllErrors}
            disabled={clearingErrors || isLoading}
          >
            <Trash2 className={`w-4 h-4 mr-2 ${clearingErrors ? 'animate-spin' : ''}`} />
            {clearingErrors ? 'Limpiando...' : 'Limpiar Todos'}
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
          title="Errores Recientes"
          value={criticalErrors.length}
          icon={<AlertTriangle className="w-4 h-4" />}
          color={criticalErrors.length > 0 ? 'red' : 'green'}
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

      {/* Errores recientes - SIEMPRE mostrar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Errores Recientes ({criticalErrors.length})
          </CardTitle>
          <CardDescription>
            Últimos errores del sistema que requieren atención
          </CardDescription>
        </CardHeader>
        <CardContent>
          {criticalErrors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No hay errores recientes</p>
              <p className="text-sm">Los errores aparecerán aquí cuando ocurran</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {criticalErrors
                  .slice((currentPage - 1) * errorsPerPage, currentPage * errorsPerPage)
                  .map((error) => (
                    <div
                      key={error.id}
                      className="p-4 rounded-lg border bg-red-50 border-red-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={error.level === 'FATAL' ? 'destructive' : 'secondary'}>
                              {error.level}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(error.created_at).toLocaleString()}
                            </span>
                          </div>
                          <h4 className="font-medium text-sm">{error.category}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {error.message.substring(0, 200)}
                            {error.message.length > 200 && '...'}
                          </p>
                          {/* Mostrar información del usuario y contexto */}
                          <div className="mt-2 text-xs text-gray-600 space-y-1">
                            {/* Información del usuario */}
                            {(error.user_email || error.user_role || error.user_id) && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border-l-2 border-blue-200 dark:border-blue-800">
                                <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">👤 Usuario:</div>
                                {error.user_email && (
                                  <div><strong>Email:</strong> {error.user_email}</div>
                                )}
                                {error.user_role && (
                                  <div><strong>Rol:</strong> {error.user_role}</div>
                                )}
                                {error.user_id && (
                                  <div><strong>ID:</strong> {error.user_id}</div>
                                )}
                              </div>
                            )}
                            
                            {/* Información del módulo y contexto */}
                            {(error.module || error.component || error.action || error.context) && (
                              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded border-l-2 border-gray-200 dark:border-gray-700">
                                <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">🔧 Contexto:</div>
                                {error.module && error.module !== 'unknown' && (
                                  <div><strong>Módulo:</strong> {error.module}</div>
                                )}
                                {error.component && error.component !== 'unknown' && (
                                  <div><strong>Componente:</strong> {error.component}</div>
                                )}
                                {error.action && error.action !== 'unknown' && (
                                  <div><strong>Acción:</strong> {error.action}</div>
                                )}
                                
                                {/* Información adicional del contexto */}
                                {error.context && (() => {
                                  try {
                                    const context = typeof error.context === 'string' 
                                      ? JSON.parse(error.context) 
                                      : error.context;
                                    
                                    return (
                                      <div className="mt-1">
                                        {context.module && context.module !== 'unknown' && !error.module && (
                                          <div><strong>Módulo:</strong> {context.module}</div>
                                        )}
                                        {context.component && context.component !== 'unknown' && !error.component && (
                                          <div><strong>Componente:</strong> {context.component}</div>
                                        )}
                                        {context.action && context.action !== 'unknown' && !error.action && (
                                          <div><strong>Acción:</strong> {context.action}</div>
                                        )}
                                        {context.url && (
                                          <div><strong>URL:</strong> {context.url}</div>
                                        )}
                                        {context.userAgent && (
                                          <div><strong>Navegador:</strong> {context.userAgent.substring(0, 50)}...</div>
                                        )}
                                      </div>
                                    );
                                  } catch (e) {
                                    return null;
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markErrorAsResolved(error.id)}
                            className="text-xs"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolver
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              
              {/* Paginación */}
              {criticalErrors.length > errorsPerPage && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * errorsPerPage) + 1} - {Math.min(currentPage * errorsPerPage, criticalErrors.length)} de {criticalErrors.length} errores
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(criticalErrors.length / errorsPerPage)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
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
