"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, User, Search, RefreshCw, Wand2, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRoles } from "@/hooks/use-roles"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase"
import { getGruposByOwner } from "@/lib/grupos"
import { getAlumnosByGrupo } from "@/lib/alumnos"
import { getFichasByGrupo } from "@/lib/fichas"
import { FichaEditor } from "./fichas/ficha-editor"

interface FichasDescriptivasProps {
    onNavigateToSubscription?: () => void
}

export function FichasDescriptivas({ onNavigateToSubscription }: FichasDescriptivasProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [grupos, setGrupos] = useState<any[]>([])
    const [selectedGrupo, setSelectedGrupo] = useState<string>("")
    const [alumnos, setAlumnos] = useState<any[]>([])
    const [selectedAlumno, setSelectedAlumno] = useState<any>(null)
    const [view, setView] = useState<"list" | "editor">("list")

    // Cargar grupos iniciales
    useEffect(() => {
        let isMounted = true;
        const loadGrupos = async () => {
            if (!user?.id) return
            try {
                const data = await getGruposByOwner(user.id)

                if (isMounted && data && data.length > 0) {
                    setGrupos(data)
                    // Solo seleccionar el primero si no hay uno seleccionado previamente
                    // Esto evita loops si loadGrupos se llama de nuevo
                    setSelectedGrupo(prev => prev || data[0].id)
                }
            } catch (error) {
                console.error("Error cargando grupos:", error)
            } finally {
                if (isMounted) setLoading(false)
            }
        }
        loadGrupos()
        return () => { isMounted = false }
    }, [user?.id])

    // Cargar alumnos y estado de fichas cuando cambia el grupo
    useEffect(() => {
        let isMounted = true;
        const loadAlumnosData = async () => {
            if (!selectedGrupo) return
            setLoading(true)

            try {
                const [alumnosData, fichasData] = await Promise.all([
                    getAlumnosByGrupo(selectedGrupo),
                    getFichasByGrupo(selectedGrupo)
                ])

                if (isMounted && alumnosData) {
                    const mergedData = alumnosData.map(alumno => {
                        const ficha = Array.isArray(fichasData) ? fichasData.find((f: any) => f.alumno_id === alumno.id) : null
                        return {
                            ...alumno,
                            ficha: ficha || null
                        }
                    })
                    setAlumnos(mergedData)
                }
            } catch (e) {
                console.error("Error cargando datos:", e)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        if (selectedGrupo) {
            loadAlumnosData()
        }

        return () => { isMounted = false }
    }, [selectedGrupo])

    const handleEditFicha = (alumno: any) => {
        setSelectedAlumno(alumno)
        setView("editor")
    }

    const handleBackToList = () => {
        setSelectedAlumno(null)
        setView("list")
        // Recargar datos para actualizar estados
        // (Podría optimizarse actualizando solo el alumno modificado)
    }

    if (view === "editor" && selectedAlumno) {
        return (
            <FichaEditor
                alumno={selectedAlumno}
                grupoId={selectedGrupo}
                onBack={handleBackToList}
                onNavigateToSubscription={onNavigateToSubscription}
            />
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Fichas Descriptivas</h2>
                    <p className="text-muted-foreground">
                        Genera evaluaciones cualitativas con asistencia de IA.
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Selector de Grupo */}
                    <Select value={selectedGrupo} onValueChange={setSelectedGrupo}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar grupo" />
                        </SelectTrigger>
                        <SelectContent>
                            {grupos.map((grupo) => (
                                <SelectItem key={grupo.id} value={grupo.id}>
                                    {grupo.grado}° {grupo.grupo} ({grupo.turno})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Alumnos del Grupo</CardTitle>
                    <CardDescription>
                        Selecciona un alumno para crear o editar su ficha descriptiva.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : alumnos.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No hay alumnos registrados en este grupo.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {alumnos.map((alumno) => (
                                <Card
                                    key={alumno.id}
                                    className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm ${alumno.ficha ? 'bg-green-50/50 dark:bg-green-950/10' : ''}`}
                                    onClick={() => handleEditFicha(alumno)}
                                >
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                                {alumno.foto_url ? (
                                                    <img src={alumno.foto_url} alt={alumno.nombre_completo} className="h-full w-full object-cover" />
                                                ) : (
                                                    <User className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm line-clamp-1">{alumno.nombre_completo}</p>
                                                <p className="text-xs text-muted-foreground">#{alumno.numero_lista}</p>
                                            </div>
                                        </div>

                                        {alumno.ficha ? (
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                <FileText className="h-3 w-3 mr-1" /> Lista
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground">
                                                <Plus className="h-3 w-3 mr-1" /> Crear
                                            </Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
