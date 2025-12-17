"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, Search, User, Filter, Eye, FileText, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { ViewPlaneacion } from "./view-planeacion"

interface PlaneacionesHistorySectionProps {
    plantelId: string
}

export function PlaneacionesHistorySection({ plantelId }: PlaneacionesHistorySectionProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [planeaciones, setPlaneaciones] = useState<any[]>([])
    const [filteredPlaneaciones, setFilteredPlaneaciones] = useState<any[]>([])

    // Filtros
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedProfesor, setSelectedProfesor] = useState<string>("all")
    const [selectedGrado, setSelectedGrado] = useState<string>("all")

    // Listas para selects
    const [profesores, setProfesores] = useState<{ id: string, nombre: string }[]>([])
    const [grados, setGrados] = useState<string[]>([])

    // Estado para ver detalle
    const [viewPlaneacionId, setViewPlaneacionId] = useState<string | null>(null)

    useEffect(() => {
        if (plantelId) {
            loadHistory()
        }
    }, [plantelId])

    useEffect(() => {
        filterData()
    }, [searchTerm, selectedProfesor, selectedGrado, planeaciones])

    const loadHistory = async () => {
        try {
            setLoading(true)

            // 1. Obtener IDs de usuarios del plantel
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('plantel_id', plantelId)
                .eq('role', 'profesor')

            if (profilesError) throw profilesError

            const teacherIds = profiles.map(p => p.id)

            // Preparar lista de profesores para el filtro
            const teachersList = profiles.map(p => ({
                id: p.id,
                nombre: p.full_name || 'Sin nombre'
            }))
            setProfesores(teachersList)

            if (teacherIds.length === 0) {
                setPlaneaciones([])
                setLoading(false)
                return
            }

            // Crear mapa de perfiles para acceso rápido
            const profilesMap = new Map(profiles.map(p => [p.id, p]))

            // 2. Obtener planeaciones APROBADAS de esos profesores
            // Hacemos join solo con planeaciones
            const { data: envios, error: enviosError } = await supabase
                .from('planeaciones_enviadas')
                .select(`
          id,
          created_at,
          estado,
          fecha_revision,
          comentarios_director,
          planeacion_id,
          profesor_id,
          planeaciones!planeacion_id (
            id,
            titulo,
            materia,
            grado,
            duracion,
            created_at
          )
        `)
                .in('profesor_id', teacherIds)
                .eq('estado', 'aprobada')
                .order('fecha_revision', { ascending: false })

            if (enviosError) throw enviosError

            // Procesar datos para facilitar filtrado
            const processedData = envios.map((envio: any) => {
                const profile = profilesMap.get(envio.profesor_id)
                return {
                    id: envio.id,
                    planeacionId: envio.planeaciones.id,
                    titulo: envio.planeaciones.titulo,
                    materia: envio.planeaciones.materia,
                    grado: envio.planeaciones.grado,
                    profesorId: envio.profesor_id,
                    profesorNombre: profile?.full_name || 'Desconocido',
                    fechaAprobacion: envio.fecha_revision,
                    raw: envio
                }
            })

            setPlaneaciones(processedData)

            // Extraer grados únicos para el filtro
            const uniqueGrados = Array.from(new Set(processedData.map((p: any) => p.grado).filter(Boolean))) as string[]
            setGrados(uniqueGrados.sort())

        } catch (error) {
            console.error('Error cargando historial:', error)
            toast({
                title: "Error",
                description: "No se pudo cargar el historial de planeaciones",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const filterData = () => {
        let filtered = [...planeaciones]

        // Filtro por texto (título o materia)
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase()
            filtered = filtered.filter(p =>
                p.titulo?.toLowerCase().includes(lowerTerm) ||
                p.materia?.toLowerCase().includes(lowerTerm)
            )
        }

        // Filtro por profesor
        if (selectedProfesor && selectedProfesor !== "all") {
            filtered = filtered.filter(p => p.profesorId === selectedProfesor)
        }

        // Filtro por grado
        if (selectedGrado && selectedGrado !== "all") {
            filtered = filtered.filter(p => p.grado === selectedGrado)
        }

        setFilteredPlaneaciones(filtered)
    }

    if (viewPlaneacionId) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => setViewPlaneacionId(null)} className="mb-2">
                    ← Volver al historial
                </Button>
                <Card>
                    <CardContent className="p-0">
                        {/* Reutilizamos el componente de vista pero solo lectura */}
                        <ViewPlaneacion planeacionId={viewPlaneacionId} onBack={() => setViewPlaneacionId(null)} />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Buscador */}
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por título o materia..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filtros */}
                <div className="flex gap-2">
                    <Select value={selectedProfesor} onValueChange={setSelectedProfesor}>
                        <SelectTrigger className="w-[200px]">
                            <User className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Profesor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los profesores</SelectItem>
                            {profesores.map(prof => (
                                <SelectItem key={prof.id} value={prof.id}>{prof.nombre}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedGrado} onValueChange={setSelectedGrado}>
                        <SelectTrigger className="w-[150px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Grado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los grados</SelectItem>
                            {grados.map(grado => (
                                <SelectItem key={grado} value={grado}>{grado}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Cargando historial...</div>
            ) : filteredPlaneaciones.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No hay planeaciones aprobandas
                        </h3>
                        <p className="text-gray-500">
                            {planeaciones.length === 0
                                ? "Aún no se ha aprobado ninguna planeación."
                                : "No hay resultados coinciden con los filtros."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredPlaneaciones.map((item) => (
                        <Card key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-base">{item.titulo}</h4>
                                        <Badge variant="secondary" className="text-xs">
                                            {item.grado}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {item.profesorNombre}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Aprobada: {new Date(item.fechaAprobacion).toLocaleDateString()}
                                        </span>
                                        {item.materia && (
                                            <span className="flex items-center gap-1">
                                                <FileText className="h-3 w-3" />
                                                {item.materia}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <Button variant="outline" size="sm" onClick={() => setViewPlaneacionId(item.planeacionId)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver Detalle
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
