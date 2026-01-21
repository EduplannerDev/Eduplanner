
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts'
import { getHistoricalData, getUsersContextCheck, GRADES_MAP, ChartDataPoint, Period } from '@/lib/admin-charts'
import { Loader2 } from 'lucide-react'

export function AnalyticsCharts() {
    const [period, setPeriod] = useState<Period>('week')
    const [chartData, setChartData] = useState<{
        users: ChartDataPoint[],
        planeaciones: ChartDataPoint[],
        examenes: ChartDataPoint[],
        presentaciones: ChartDataPoint[],
        proyectos: ChartDataPoint[],
        planesAnaliticos: ChartDataPoint[],
        fichas: ChartDataPoint[]
    }>({
        users: [],
        planeaciones: [],
        examenes: [],
        presentaciones: [],
        proyectos: [],
        planesAnaliticos: [],
        fichas: []
    })

    const [loading, setLoading] = useState(true)
    const [gradeFilter, setGradeFilter] = useState<string>("all")

    useEffect(() => {
        loadData()
    }, [period, gradeFilter])

    const loadData = async () => {
        setLoading(true)
        try {
            const grade = gradeFilter !== "all" ? parseInt(gradeFilter) : undefined

            const [
                users,
                planeaciones,
                examenes,
                presentaciones,
                proyectos,
                planesAnaliticos,
                fichas
            ] = await Promise.all([
                getUsersContextCheck(period, grade),
                getHistoricalData('planeacion_creations', period),
                getHistoricalData('examenes', period),
                getHistoricalData('presentaciones_ia', period),
                getHistoricalData('proyectos', period),
                getHistoricalData('planes_analiticos', period),
                getHistoricalData('fichas_descriptivas', period)
            ])

            setChartData({
                users,
                planeaciones,
                examenes,
                presentaciones,
                proyectos,
                planesAnaliticos,
                fichas
            })
        } catch (error) {
            console.error("Error loading charts data:", error)
        } finally {
            setLoading(false)
        }
    }

    const renderGradeFilter = () => (
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por grado" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los grados</SelectItem>
                {Object.entries(GRADES_MAP).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    )

    const renderPeriodSelector = () => (
        <div className="flex bg-muted rounded-lg p-1">
            <Button
                variant={period === 'week' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setPeriod('week')}
                className="text-xs"
            >
                7 Días
            </Button>
            <Button
                variant={period === 'month' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setPeriod('month')}
                className="text-xs"
            >
                30 Días
            </Button>
            <Button
                variant={period === 'year' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setPeriod('year')}
                className="text-xs"
            >
                Año
            </Button>
        </div>
    )

    if (loading) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Filtros Globales y Usuarios */}
            <h2 className="text-xl font-bold tracking-tight">Crecimiento de Usuarios</h2>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle>Usuarios Registrados</CardTitle>
                        <CardDescription>
                            {gradeFilter !== 'all'
                                ? `Usuarios del grado: ${GRADES_MAP[parseInt(gradeFilter)]}`
                                : 'Nuevos usuarios en la plataforma'}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        {renderGradeFilter()}
                        {renderPeriodSelector()}
                    </div>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData.users}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                            <YAxis className="text-xs text-muted-foreground" />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#8884d8"
                                fillOpacity={1}
                                fill="url(#colorUsers)"
                                name="Usuarios"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <h2 className="text-xl font-bold tracking-tight">Generación de Contenido</h2>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Planeaciones y Examenes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Planeaciones y Exámenes</CardTitle>
                        <CardDescription>Comparativa de generación</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.planeaciones.map((p, i) => ({
                                date: p.date,
                                planeaciones: p.value,
                                examenes: chartData.examenes[i]?.value || 0
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                                <YAxis className="text-xs text-muted-foreground" />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="planeaciones" name="Planeaciones" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="examenes" name="Exámenes" fill="#a855f7" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Presentaciones, Proyectos, Fichas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recursos Adicionales</CardTitle>
                        <CardDescription>Presentaciones, Proyectos y Fichas</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData.presentaciones.map((p, i) => ({
                                date: p.date,
                                presentaciones: p.value,
                                proyectos: chartData.proyectos[i]?.value || 0,
                                fichas: chartData.fichas[i]?.value || 0,
                                planes: chartData.planesAnaliticos[i]?.value || 0
                            }))}>
                                {/* @ts-ignore */}
                                <LineChart>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                                    <YAxis className="text-xs text-muted-foreground" />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="presentaciones" name="Presentaciones" stroke="#ec4899" strokeWidth={2} />
                                    <Line type="monotone" dataKey="proyectos" name="Proyectos" stroke="#6366f1" strokeWidth={2} />
                                    <Line type="monotone" dataKey="fichas" name="Fichas" stroke="#f59e0b" strokeWidth={2} />
                                    <Line type="monotone" dataKey="planes" name="Planes Anl." stroke="#14b8a6" strokeWidth={2} />
                                </LineChart>
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Fix for Recharts LineChart typescript issue with ResponsiveContainer
import { LineChart, Line } from 'recharts'
