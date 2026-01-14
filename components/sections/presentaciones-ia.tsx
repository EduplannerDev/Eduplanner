"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Presentation, Loader2, Download, Trash2, Calendar, Eye, Edit } from "lucide-react"
import { useProfile } from "@/hooks/use-profile"
import { isUserPro, canUserCreate } from "@/lib/subscription-utils"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useBetaTesterCheck } from "@/hooks/use-beta-features"
import { NuevaPresentacionWizard } from "@/components/sections/nueva-presentacion-wizard"
import { EditorPresentacion } from "@/components/sections/editor-presentacion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SlidePreview } from "@/components/ui/slide-preview"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { useContextoTrabajo } from "@/hooks/use-contexto-trabajo"
import { useDebounce } from "@/hooks/use-debounce"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Filter, GraduationCap, X } from "lucide-react"

interface PresentacionIA {
    id: string
    user_id: string
    titulo: string
    fuente_tipo: 'planeacion' | 'proyecto' | 'libre'
    fuente_id?: string
    diapositivas_json: any
    tema_visual: string
    created_at: string
    updated_at: string
    grado?: string // Propiedad inferida
    materia?: string // Propiedad inferida
}

interface PresentacionesIAProps {
    onNavigateToProfile?: () => void
}

interface PresentationFilters {
    search: string
    grado: string
    startDate: string | null
    endDate: string | null
    sortOrder: 'asc' | 'desc'
}

export function PresentacionesIA({ onNavigateToProfile }: PresentacionesIAProps) {
    const { profile, loading: loadingProfile } = useProfile()
    const { toast } = useToast()
    const { availableContexts } = useContextoTrabajo()

    const [presentaciones, setPresentaciones] = useState<PresentacionIA[]>([])
    const [filteredPresentaciones, setFilteredPresentaciones] = useState<PresentacionIA[]>([])
    const [loading, setLoading] = useState(true)

    // Filters State
    const [filters, setFilters] = useState<PresentationFilters>({
        search: '',
        grado: 'todos',
        startDate: null,
        endDate: null,
        sortOrder: 'desc'
    })

    const debouncedSearch = useDebounce(filters.search, 500)

    const [showWizard, setShowWizard] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [presentationToDelete, setPresentationToDelete] = useState<string | null>(null)

    // Estado para vista rápida
    const [viewingPresentation, setViewingPresentation] = useState<PresentacionIA | null>(null)
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

    const { isBetaTester, loading: loadingBeta } = useBetaTesterCheck()

    const [usageStats, setUsageStats] = useState<{ count: number; limit: number } | null>(null)

    useEffect(() => {
        if (profile?.id) {
            checkLimits()
        }
    }, [profile?.id, presentaciones])

    const checkLimits = async () => {
        if (!profile?.id) return
        const { currentCount, limit } = await canUserCreate(profile.id, 'presentaciones')
        setUsageStats({ count: currentCount, limit })
    }

    useEffect(() => {
        if (profile?.id && !loadingProfile) {
            loadPresentaciones()
        }
    }, [profile?.id, loadingProfile])

    // Helper para formatear grado (Definido antes del uso en useEffect)
    const formatGrado = (grado: number | string) => {
        if (!grado) return ''

        const gStr = grado.toString()
        const gLower = gStr.toLowerCase()

        // Detección inteligente para textos como "2° de Secundaria"
        if (gLower.includes('secundaria')) {
            const num = parseInt(gStr.replace(/\D/g, ''))
            if (!isNaN(num)) return `${num}° Secundaria`
            return gStr
        }
        if (gLower.includes('preescolar')) {
            const num = parseInt(gStr.replace(/\D/g, ''))
            if (!isNaN(num)) return `${num}° Preescolar`
            return gStr
        }
        if (gLower.includes('primaria')) {
            const num = parseInt(gStr.replace(/\D/g, ''))
            if (!isNaN(num)) return `${num}° Primaria`
            return gStr
        }

        // Lógica numérica legacy (1-6 Primaria, <0 Preescolar, >6 Secundaria si viene como número puro)
        const g = typeof grado === 'string' ? parseInt(grado) : grado
        if (isNaN(g)) return grado.toString()

        if (g < 0) return `${g + 4}° Preescolar`
        if (g <= 6) return `${g}° Primaria`
        return `${g - 6}° Secundaria`
    }

    // Filter Logic
    useEffect(() => {
        let result = [...presentaciones]

        // 1. Search
        if (debouncedSearch) {
            const query = debouncedSearch.toLowerCase()
            result = result.filter(p => p.titulo.toLowerCase().includes(query))
        }

        // 2. Grado with Smart Matching
        if (filters.grado && filters.grado !== 'todos') {
            result = result.filter(p => {
                if (!p.grado) return false
                // Normalizamos ambos lados para asegurar coincidencia
                return formatGrado(p.grado) === filters.grado
            })
        }

        // 3. Dates
        if (filters.startDate) {
            const start = new Date(filters.startDate)
            start.setHours(0, 0, 0, 0)
            result = result.filter(p => new Date(p.created_at) >= start)
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate)
            end.setHours(23, 59, 59, 999)
            result = result.filter(p => new Date(p.created_at) <= end)
        }

        // 4. Sort
        result.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime()
            const dateB = new Date(b.created_at).getTime()
            return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA
        })

        setFilteredPresentaciones(result)

    }, [presentaciones, debouncedSearch, filters.grado, filters.startDate, filters.endDate, filters.sortOrder])


    const loadPresentaciones = async () => {
        try {
            setLoading(true)

            // 1. Fetch Presentaciones
            const { data: presData, error: presError } = await supabase
                .from('presentaciones_ia')
                .select('*')
                .order('created_at', { ascending: false })

            if (presError) throw presError

            if (!presData || presData.length === 0) {
                setPresentaciones([])
                return
            }

            // 2. Fetch Related Planeaciones (Grades)
            // Get IDs of source planeaciones
            const planeacionIds = presData
                .filter(p => p.fuente_tipo === 'planeacion' && p.fuente_id)
                .map(p => p.fuente_id)

            let planeacionesMap: Record<string, any> = {}

            if (planeacionIds.length > 0) {
                const { data: planData } = await supabase
                    .from('planeaciones')
                    .select('id, grado, materia')
                    .in('id', planeacionIds)

                if (planData) {
                    planData.forEach(p => {
                        planeacionesMap[p.id] = p
                    })
                }
            }

            // 3. Merge Data
            const mergedData: PresentacionIA[] = presData.map((p: any) => ({
                ...p,
                grado: p.fuente_tipo === 'planeacion' && p.fuente_id ? planeacionesMap[p.fuente_id]?.grado : undefined,
                materia: p.fuente_tipo === 'planeacion' && p.fuente_id ? planeacionesMap[p.fuente_id]?.materia : undefined
            }))

            setPresentaciones(mergedData)
        } catch (error) {
            console.error('Error cargando presentaciones:', error)
            toast({
                title: "Error",
                description: "No se pudieron cargar las presentaciones",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            setDeletingId(id)
            const { error } = await supabase
                .from('presentaciones_ia')
                .delete()
                .eq('id', id)

            if (error) throw error

            setPresentaciones(prev => prev.filter(p => p.id !== id))
            toast({
                title: "Presentación eliminada",
                description: "La presentación se eliminó correctamente"
            })
        } catch (error) {
            console.error('Error eliminando presentación:', error)
            toast({
                title: "Error",
                description: "No se pudo eliminar la presentación",
                variant: "destructive"
            })
        } finally {
            setDeletingId(null)
        }
    }

    const handleDownload = async (presentacion: PresentacionIA) => {
        try {
            toast({
                title: "Generando presentación",
                description: "Por favor espera...",
            })

            const response = await fetch('/api/generate-pptx', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ presentationData: presentacion.diapositivas_json })
            })

            if (!response.ok) {
                throw new Error('Error al generar la presentación PowerPoint')
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${presentacion.titulo.replace(/[^a-zA-Z0-9]/g, '-')}.pptx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            toast({
                title: "¡Presentación generada!",
                description: "La presentación PowerPoint se ha descargado correctamente"
            })
        } catch (error) {
            console.error('Error generando PowerPoint:', error)
            toast({
                title: "Error",
                description: "Error al generar la presentación PowerPoint",
                variant: "destructive"
            })
        }
    }

    // Siempre mostrar loader primero si el wizard no está activo
    if (editingId) {
        return (
            <EditorPresentacion
                presentacionId={editingId}
                onBack={() => {
                    setEditingId(null)
                    loadPresentaciones()
                }}
            />
        )
    }

    if (showWizard) {
        return (
            <NuevaPresentacionWizard
                onClose={() => setShowWizard(false)}
                onComplete={() => {
                    setShowWizard(false)
                    loadPresentaciones()
                }}
            />
        )
    }

    // Mostrar loader mientras se verifica el perfil o estado beta
    if (loadingProfile || loadingBeta) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }



    // Mostrar loader mientras carga presentaciones (para usuarios PRO)
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    const handleFilterChange = (key: keyof PresentationFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Presentation className="h-8 w-8 text-purple-600" />
                        Presentaciones IA
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Crea presentaciones profesionales con inteligencia artificial
                    </p>
                    {usageStats && usageStats.limit !== -1 && (
                        <div className={`mt-4 max-w-xs p-3 rounded-lg border ${usageStats.count >= usageStats.limit
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800'
                            : 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800'
                            }`}>
                            <div className="flex justify-between items-center mb-2">
                                <span className={`text-sm font-medium ${usageStats.count >= usageStats.limit
                                    ? 'text-red-900 dark:text-red-100'
                                    : 'text-purple-900 dark:text-purple-100'
                                    }`}>
                                    Uso del plan gratuito
                                </span>
                                <span className={`text-xs font-semibold ${usageStats.count >= usageStats.limit
                                    ? 'text-red-700 dark:text-red-300'
                                    : 'text-purple-700 dark:text-purple-300'
                                    }`}>
                                    {usageStats.count} / {usageStats.limit}
                                </span>
                            </div>
                            <Progress
                                value={(usageStats.count / usageStats.limit) * 100}
                                className={`h-2 ${usageStats.count >= usageStats.limit ? '[&>div]:bg-red-600' : ''}`}
                            />
                            {usageStats.count >= usageStats.limit && (
                                <div className="text-xs text-red-600 dark:text-red-400 mt-2 font-bold flex items-center justify-center gap-1 uppercase tracking-wide">
                                    <Badge variant="destructive" className="h-4 px-1 text-[10px]">!</Badge>
                                    Límite alcanzado
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <Button
                    onClick={() => {
                        if (usageStats && usageStats.limit !== -1 && usageStats.count >= usageStats.limit) {
                            toast({
                                title: "Límite alcanzado",
                                description: "Has alcanzado el límite de 3 presentaciones gratuitas. Actualiza a PRO para crear ilimitadas.",
                                variant: "destructive"
                            })
                            // Opcional: abrir modal de upgrade o redirigir
                            return
                        }
                        setShowWizard(true)
                    }}
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={usageStats ? (usageStats.limit !== -1 && usageStats.count >= usageStats.limit) : false}
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Nueva Presentación
                </Button>
            </div>

            {/* Filters Section */}
            <div className="bg-white dark:bg-sidebar-primary/10 p-4 md:p-6 rounded-xl border shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Filter className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Filtros de Búsqueda</h3>
                            <p className="text-xs text-muted-foreground">Refina tu búsqueda</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por título..."
                            className="pl-9 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    {/* Grado Filter */}
                    {availableContexts.length > 0 && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground ml-1">Grado</label>
                            <Select value={filters.grado} onValueChange={(val) => handleFilterChange('grado', val)}>
                                <SelectTrigger className="bg-gray-50 dark:bg-gray-900/50">
                                    <SelectValue placeholder="Grado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos los grados</SelectItem>
                                    {availableContexts.map((ctx) => (
                                        <SelectItem key={ctx.id} value={formatGrado(ctx.grado)}>
                                            {formatGrado(ctx.grado)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Order Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground ml-1">Orden</label>
                        <Select value={filters.sortOrder} onValueChange={(val) => handleFilterChange('sortOrder', val)}>
                            <SelectTrigger className="bg-gray-50 dark:bg-gray-900/50">
                                <SelectValue placeholder="Orden" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="desc">Más recientes primero</SelectItem>
                                <SelectItem value="asc">Más antiguas primero</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Filters */}
                    <div className={`space-y-1.5 ${availableContexts.length > 0 ? 'col-span-1 sm:col-span-2' : 'col-span-1 sm:col-span-2 lg:col-span-3'}`}>
                        <label className="text-xs font-medium text-muted-foreground ml-1">Rango de Fechas</label>
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                value={filters.startDate || ''}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="bg-gray-50 dark:bg-gray-900/50 text-xs px-2 w-full"
                            />
                            <Input
                                type="date"
                                value={filters.endDate || ''}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="bg-gray-50 dark:bg-gray-900/50 text-xs px-2 w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Banner para usuarios Free */}
            {usageStats && usageStats.limit !== -1 && (
                usageStats.count >= usageStats.limit ? (
                    <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
                        <CardContent className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-md">
                                    <Presentation className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-red-900 dark:text-red-100">
                                        ¡Se acabaron tus presentaciones gratuitas!
                                    </h3>
                                    <p className="text-sm text-red-700 dark:text-red-300 mt-1 max-w-xl">
                                        Has utilizado tus 3 presentaciones de prueba. Actualiza a Eduplanner PRO para crear presentaciones ilimitadas y desbloquear todo el poder de la IA.
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg whitespace-nowrap w-full sm:w-auto transform hover:scale-105 transition-all"
                                onClick={() => onNavigateToProfile ? onNavigateToProfile() : window.open('/pricing', '_blank')}
                            >
                                Actualizar a Ilimitado
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-100 dark:border-purple-800">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                    <Presentation className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-purple-900 dark:text-purple-100">
                                        Plan Gratuito
                                    </p>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">
                                        Tienes {usageStats.limit} presentaciones de prueba. Actualiza a PRO para acceso ilimitado.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="default"
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => onNavigateToProfile ? onNavigateToProfile() : window.open('/pricing', '_blank')}
                            >
                                Ver Planes
                            </Button>
                        </CardContent>
                    </Card>
                )
            )}

            {/* Lista de Presentaciones */}
            {filteredPresentaciones.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Presentation className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            {presentaciones.length === 0 ? "No tienes presentaciones aún" : "No se encontraron presentaciones"}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {presentaciones.length === 0 ? "Comienza creando tu primera presentación con IA" : "Intenta ajustar tus filtros"}
                        </p>
                        {presentaciones.length === 0 && (
                            <Button onClick={() => setShowWizard(true)} className="bg-purple-600 hover:bg-purple-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Crear Primera Presentación
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPresentaciones.map((presentacion) => (
                        <Card key={presentacion.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg truncate" title={presentacion.titulo}>{presentacion.titulo}</CardTitle>
                                        <CardDescription className="flex flex-col gap-1 mt-2">

                                            {/* Metadata Badges */}
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(presentacion.created_at).toLocaleDateString('es-MX')}
                                                </span>

                                                {presentacion.grado && (
                                                    <span className="flex items-center gap-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-800/50">
                                                        <GraduationCap className="h-3 w-3" />
                                                        {formatGrado(presentacion.grado)}
                                                    </span>
                                                )}
                                            </div>

                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="ml-2 flex-shrink-0">
                                        {presentacion.fuente_tipo === 'planeacion' ? 'Planeación' :
                                            presentacion.fuente_tipo === 'proyecto' ? 'Proyecto' : 'Libre'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {presentacion.diapositivas_json?.diapositivas?.length || 0} diapositivas
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setViewingPresentation(presentacion)
                                            setCurrentSlideIndex(0)
                                        }}
                                        title="Vista Rápida"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setEditingId(presentacion.id)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleDownload(presentacion)}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Descargar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => setPresentationToDelete(presentacion.id)}
                                        disabled={deletingId === presentacion.id}
                                    >
                                        {deletingId === presentacion.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AlertDialog open={!!presentationToDelete} onOpenChange={() => setPresentationToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la presentación.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (presentationToDelete) {
                                    handleDelete(presentationToDelete)
                                    setPresentationToDelete(null)
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal de Vista Rápida */}
            <Dialog open={!!viewingPresentation} onOpenChange={() => setViewingPresentation(null)}>
                <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{viewingPresentation?.titulo}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 flex items-center justify-center relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden p-4">
                        {viewingPresentation && (
                            <>
                                <div className="w-full h-full flex items-center justify-center">
                                    <SlidePreview slide={viewingPresentation.diapositivas_json.diapositivas[currentSlideIndex]} />
                                </div>

                                <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 z-10">
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                                        disabled={currentSlideIndex === 0}
                                        className="shadow-lg"
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </Button>
                                    <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                                        {currentSlideIndex + 1} / {viewingPresentation.diapositivas_json.diapositivas.length}
                                    </span>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={() => setCurrentSlideIndex(prev => Math.min(viewingPresentation.diapositivas_json.diapositivas.length - 1, prev + 1))}
                                        disabled={currentSlideIndex === viewingPresentation.diapositivas_json.diapositivas.length - 1}
                                        className="shadow-lg"
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
