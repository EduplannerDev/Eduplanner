"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Brain,
    DollarSign,
    Zap,
    Clock,
    TrendingUp,
    RefreshCw,
    AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AIUsageStats {
    total_calls: number
    total_input_tokens: number
    total_output_tokens: number
    total_cost_usd: number
    avg_latency_ms: number
    success_rate: number
    calls_by_endpoint: Record<string, number>
    daily_usage: Array<{ date: string; calls: number; tokens: number; cost: number }>
    top_users: Array<{ user_id: string; calls: number; tokens: number }>
}

export function AIUsageWidget() {
    const [stats, setStats] = useState<AIUsageStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [daysBack, setDaysBack] = useState(7)

    const loadStats = async () => {
        setLoading(true)
        setError(null)

        try {
            const { data, error: rpcError } = await supabase.rpc('get_ai_usage_stats', {
                days_back: daysBack
            })

            if (rpcError) throw rpcError
            setStats(data)
        } catch (err) {
            console.error('Error loading AI usage stats:', err)
            setError('No se pudieron cargar las estadísticas. Verifica que la migración se haya ejecutado.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadStats()
    }, [daysBack])

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
        return num.toFixed(0)
    }

    const formatCost = (cost: number) => {
        return `$${cost.toFixed(4)} USD`
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Uso de IA
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-yellow-600">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm">{error}</p>
                    </div>
                    <Button onClick={loadStats} variant="outline" size="sm" className="mt-4">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reintentar
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header con controles */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Brain className="h-6 w-6" />
                        Uso de IA (Gemini)
                    </h2>
                    <p className="text-muted-foreground">
                        Estadísticas de consumo de APIs de inteligencia artificial
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        {[7, 14, 30].map((days) => (
                            <Button
                                key={days}
                                variant={daysBack === days ? "default" : "outline"}
                                size="sm"
                                onClick={() => setDaysBack(days)}
                            >
                                {days}d
                            </Button>
                        ))}
                    </div>
                    <Button onClick={loadStats} variant="outline" size="sm" disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Cargando estadísticas...</p>
                    </div>
                </div>
            ) : stats ? (
                <>
                    {/* Tarjetas principales */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Llamadas</CardTitle>
                                <Zap className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatNumber(stats.total_calls)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Últimos {daysBack} días
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tokens Consumidos</CardTitle>
                                <Brain className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatNumber(stats.total_input_tokens + stats.total_output_tokens)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {formatNumber(stats.total_input_tokens)} in / {formatNumber(stats.total_output_tokens)} out
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Costo Estimado</CardTitle>
                                <DollarSign className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCost(stats.total_cost_usd)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Basado en precios Gemini 2.5 Flash
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Latencia Promedio</CardTitle>
                                <Clock className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.avg_latency_ms.toFixed(0)}ms</div>
                                <p className="text-xs text-muted-foreground">
                                    Tasa de éxito: {stats.success_rate}%
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Uso por endpoint */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Llamadas por Endpoint
                            </CardTitle>
                            <CardDescription>
                                Distribución de uso por funcionalidad
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {stats.calls_by_endpoint && Object.keys(stats.calls_by_endpoint).length > 0 ? (
                                <div className="space-y-3">
                                    {Object.entries(stats.calls_by_endpoint)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([endpoint, calls]) => {
                                            const percentage = (calls / stats.total_calls) * 100
                                            return (
                                                <div key={endpoint} className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="font-mono text-xs truncate max-w-[250px]">
                                                            {endpoint.replace('/api/', '')}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary">{calls}</Badge>
                                                            <span className="text-muted-foreground w-12 text-right">
                                                                {percentage.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full transition-all"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">
                                    No hay datos de uso todavía
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Uso diario */}
                    {stats.daily_usage && stats.daily_usage.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Uso Diario</CardTitle>
                                <CardDescription>Llamadas y tokens por día</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="text-left py-2 px-3 font-semibold text-sm">Fecha</th>
                                                <th className="text-right py-2 px-3 font-semibold text-sm">Llamadas</th>
                                                <th className="text-right py-2 px-3 font-semibold text-sm">Tokens</th>
                                                <th className="text-right py-2 px-3 font-semibold text-sm">Costo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.daily_usage.map((day) => (
                                                <tr key={day.date} className="border-b border-border hover:bg-muted/50">
                                                    <td className="py-2 px-3 text-sm">
                                                        {new Date(day.date).toLocaleDateString('es-MX', {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="py-2 px-3 text-sm text-right">{day.calls}</td>
                                                    <td className="py-2 px-3 text-sm text-right">{formatNumber(day.tokens)}</td>
                                                    <td className="py-2 px-3 text-sm text-right">{formatCost(day.cost)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            ) : null}
        </div>
    )
}
