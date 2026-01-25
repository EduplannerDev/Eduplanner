"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    AlertTriangle,
    Search,
    Filter,
    Download,
    TrendingDown,
    Minus,
    CheckCircle,
    AlertCircle
} from "lucide-react"
import { getRiesgoDesercion, type EstadisticasRiesgo, type AlumnoRiesgo } from "@/lib/riesgo-desercion"

interface SemaforoDesercionProps {
    plantelId: string
}

export function SemaforoDesercion({ plantelId }: SemaforoDesercionProps) {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<EstadisticasRiesgo | null>(null)
    const [filterText, setFilterText] = useState("")
    const [filterRiesgo, setFilterRiesgo] = useState<string>("todos") // todos, alto, medio, bajo

    useEffect(() => {
        loadData()
    }, [plantelId])

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await getRiesgoDesercion(plantelId)
            setStats(data)
        } catch (error) {
            console.error("Error loading risk data:", error)
        } finally {
            setLoading(false)
        }
    }

    const getRiskColor = (nivel: string) => {
        switch (nivel) {
            case 'alto': return 'bg-red-100 text-red-800 border-red-200'
            case 'medio': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'bajo': return 'bg-green-100 text-green-800 border-green-200'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getRiskBadge = (nivel: string) => {
        switch (nivel) {
            case 'alto': return <Badge className="bg-red-500 hover:bg-red-600">Alto Riesgo</Badge>
            case 'medio': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Riesgo Medio</Badge>
            case 'bajo': return <Badge className="bg-green-500 hover:bg-green-600">Bajo Riesgo</Badge>
            default: return null
        }
    }

    const filteredAlumnos = stats?.alumnos.filter(alumno => {
        const matchesText = alumno.nombre.toLowerCase().includes(filterText.toLowerCase()) ||
            alumno.grupo.toLowerCase().includes(filterText.toLowerCase())
        const matchesRiesgo = filterRiesgo === "todos" || alumno.nivelRiesgo === filterRiesgo
        return matchesText && matchesRiesgo
    }) || []

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Alto Riesgo</p>
                                <h3 className="text-3xl font-bold mt-2 text-red-600">{stats?.altoRiesgo}</h3>
                            </div>
                            <div className="p-2 bg-red-100 rounded-full">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Requieren atención inmediata</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Riesgo Medio</p>
                                <h3 className="text-3xl font-bold mt-2 text-yellow-600">{stats?.medioRiesgo}</h3>
                            </div>
                            <div className="p-2 bg-yellow-100 rounded-full">
                                <Minus className="h-5 w-5 text-yellow-600" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Monitorear progreso</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Bajo Riesgo</p>
                                <h3 className="text-3xl font-bold mt-2 text-green-600">{stats?.bajoRiesgo}</h3>
                            </div>
                            <div className="p-2 bg-green-100 rounded-full">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Situación estable</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Alumnos</p>
                                <h3 className="text-3xl font-bold mt-2">{stats?.totalAlumnos}</h3>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-full">
                                <TrendingDown className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Población analizada</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>Semáforo de Alumnos</CardTitle>
                            <CardDescription>
                                Listado detallado de alumnos clasificados por nivel de riesgo de deserción.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={loadData}>
                                Actualizar Análisis
                            </Button>
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Exportar
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o grupo..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Select value={filterRiesgo} onValueChange={setFilterRiesgo}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Nivel de Riesgo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos los niveles</SelectItem>
                                <SelectItem value="alto">🔴 Alto Riesgo</SelectItem>
                                <SelectItem value="medio">🟡 Riesgo Medio</SelectItem>
                                <SelectItem value="bajo">🟢 Bajo Riesgo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Alumno</TableHead>
                                    <TableHead>Grupo</TableHead>
                                    <TableHead className="text-center">Promedio</TableHead>
                                    <TableHead className="text-center">Asistencia</TableHead>
                                    <TableHead className="text-center">Incidencias</TableHead>
                                    <TableHead>Factores de Riesgo</TableHead>
                                    <TableHead className="text-right">Nivel</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAlumnos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No se encontraron alumnos con los filtros seleccionados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAlumnos.map((alumno) => (
                                        <TableRow key={alumno.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={alumno.foto_url} />
                                                        <AvatarFallback>{alumno.nombre.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="font-medium">{alumno.nombre}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{alumno.grupo}</span>
                                                    <span className="text-xs text-muted-foreground">{alumno.grado} {alumno.nivel}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`font-bold ${alumno.promedio < 6.0 ? 'text-red-600' : ''}`}>
                                                    {alumno.promedio || '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`font-bold ${alumno.asistencia < 80 ? 'text-red-600' : ''}`}>
                                                    {alumno.asistencia}%
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center bg-gray-50/50">
                                                {alumno.incidencias > 0 ? (
                                                    <Badge variant="outline" className={alumno.incidencias > 3 ? "border-red-500 text-red-700 bg-red-50" : ""}>
                                                        {alumno.incidencias}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {alumno.factores.map((factor, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-[10px] px-1 h-5">
                                                            {factor}
                                                        </Badge>
                                                    ))}
                                                    {alumno.factores.length === 0 && (
                                                        <span className="text-xs text-muted-foreground italic">Ninguno detectado</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {getRiskBadge(alumno.nivelRiesgo)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
