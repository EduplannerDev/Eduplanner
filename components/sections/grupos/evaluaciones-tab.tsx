'use client'

import { useState, useEffect } from 'react'
import { Plus, Save, Trash2, Edit, FileText, BookOpen, AlertCircle, Loader2, Paperclip, Image as ImageIcon, Video, Trash, ExternalLink, X, Upload } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter
} from "@/components/ui/sheet"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
    getActividadesGrupo,
    getCalificacionesGrupo,
    createActividad,
    updateActividad,
    deleteActividad,
    saveCalificacion,
    getEvidenciasActividad,
    createEvidencia,
    deleteEvidencia,
    type ActividadEvaluable,
    type Calificacion,
    type CreateActividadData,
    type Evidencia
} from '@/lib/evaluaciones'
import { supabase } from '@/lib/supabase' // Need supabase for upload
import { getExamenesByOwner } from '@/lib/examenes'
import { getPlaneaciones } from '@/lib/planeaciones'
import { getAlumnosByGrupo } from '@/lib/alumnos' // Import this
import { useAuth } from '@/hooks/use-auth'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Alumno {
    id: string
    nombre: string
    apellido_paterno?: string
    apellido_materno?: string
    nombre_completo?: string
    numero_lista?: number
}

interface EvaluacionesTabProps {
    grupoId: string
    // alumnos removed from props to fetch internally
}

export function EvaluacionesTab({ grupoId }: EvaluacionesTabProps) {
    const { user } = useAuth()
    const { toast } = useToast()

    // State
    const [alumnos, setAlumnos] = useState<Alumno[]>([])
    const [actividades, setActividades] = useState<ActividadEvaluable[]>([])
    const [calificaciones, setCalificaciones] = useState<Calificacion[]>([])
    const [loading, setLoading] = useState(true)
    const [examenes, setExamenes] = useState<any[]>([])
    const [planeaciones, setPlaneaciones] = useState<any[]>([])

    // Filter State
    const [filterPeriod, setFilterPeriod] = useState<string>('all')

    // State
    const [selectedActividad, setSelectedActividad] = useState<ActividadEvaluable | null>(null)
    const [evidencias, setEvidencias] = useState<any[]>([])
    const [uploading, setUploading] = useState(false)
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'actividad' | 'evidencia', id: string } | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isExamDialogOpen, setIsExamDialogOpen] = useState(false)
    const [isPlanningDialogOpen, setIsPlanningDialogOpen] = useState(false)

    const [newActividad, setNewActividad] = useState<CreateActividadData>({
        grupo_id: grupoId,
        nombre: '',
        tipo: 'tarea',
        ponderacion: 10
    })

    // Filter activities
    const filteredActividades = actividades.filter(act => {
        if (filterPeriod === 'all') return true

        const dateToCheck = new Date(act.created_at)
        const now = new Date()

        if (filterPeriod === 'this_week') {
            const startOfWeek = new Date(now)
            startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday
            startOfWeek.setHours(0, 0, 0, 0)

            const endOfWeek = new Date(startOfWeek)
            endOfWeek.setDate(startOfWeek.getDate() + 6)
            endOfWeek.setHours(23, 59, 59, 999)

            return dateToCheck >= startOfWeek && dateToCheck <= endOfWeek
        }

        if (filterPeriod === 'this_month') {
            return dateToCheck.getMonth() === now.getMonth() &&
                dateToCheck.getFullYear() === now.getFullYear()
        }

        if (filterPeriod === 'last_month') {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            return dateToCheck.getMonth() === lastMonth.getMonth() &&
                dateToCheck.getFullYear() === lastMonth.getFullYear()
        }

        return true
    })

    // Normalize students name
    const sortedAlumnos = [...alumnos].sort((a, b) => (a.numero_lista || 999) - (b.numero_lista || 999))

    useEffect(() => {
        loadData()
        loadResources()
    }, [grupoId])

    useEffect(() => {
        if (selectedActividad) {
            loadEvidencias(selectedActividad.id)
        } else {
            setEvidencias([])
        }
    }, [selectedActividad])

    const loadEvidencias = async (actividadId: string) => {
        const data = await getEvidenciasActividad(actividadId)
        setEvidencias(data)
    }

    const handleUploadEvidencia = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !selectedActividad || !user) return

        setUploading(true)
        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${selectedActividad.id}/${Date.now()}.${fileExt}`

        try {
            // Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('evidencias_actividades')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('evidencias_actividades')
                .getPublicUrl(fileName)

            // Determine type
            let tipo = 'documento'
            if (file.type.startsWith('image/')) tipo = 'imagen'
            if (file.type.startsWith('video/')) tipo = 'video'
            if (file.type.startsWith('audio/')) tipo = 'audio'

            // Save reference to DB
            const newEvidencia = await createEvidencia(
                selectedActividad.id,
                user.id,
                publicUrl,
                tipo,
                file.name
            )

            if (newEvidencia) {
                setEvidencias([newEvidencia, ...evidencias])
                toast({ title: "Éxito", description: "Evidencia subida correctamente" })
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast({ title: "Error", description: "No se pudo subir el archivo", variant: "destructive" })
        } finally {
            setUploading(false)
        }
    }

    const loadData = async () => {
        setLoading(true)
        try {
            // Parallel fetch including students
            const [acts, cals, stud] = await Promise.all([
                getActividadesGrupo(grupoId),
                getCalificacionesGrupo(grupoId),
                getAlumnosByGrupo(grupoId)
            ])
            setActividades(acts)
            setCalificaciones(cals)
            setAlumnos(stud.map((s: any) => ({
                id: s.id,
                nombre: s.nombre_completo, // Use nombre_completo as nombre for fallback
                apellido_paterno: '',
                apellido_materno: '',
                nombre_completo: s.nombre_completo,
                numero_lista: s.numero_lista
            })))
        } catch (error) {
            console.error('Error loading data:', error)
            toast({
                title: "Error",
                description: "No se pudieron cargar las evaluaciones",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const loadResources = async () => {
        if (!user) return
        try {
            const [exams, plans] = await Promise.all([
                getExamenesByOwner(user.id),
                getPlaneaciones(user.id, 1, 50).then(res => res.data)
            ])
            setExamenes(exams)
            setPlaneaciones(plans)
        } catch (error) {
            console.error('Error loading resources:', error)
        }
    }

    const handleCreateActividad = async () => {
        if (!newActividad.nombre) {
            toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" })
            return
        }

        try {
            const created = await createActividad(newActividad)
            if (created) {
                setActividades([...actividades, created])
                setIsDialogOpen(false)
                setIsExamDialogOpen(false)
                setIsPlanningDialogOpen(false)
                setNewActividad({ grupo_id: grupoId, nombre: '', tipo: 'tarea', ponderacion: 10 })
                toast({ title: "Éxito", description: "Actividad creada correctamente" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Error al crear actividad", variant: "destructive" })
        }
    }

    const handleCalificacionChange = async (actividadId: string, alumnoId: string, valor: string) => {
        const numValor = valor === '' ? null : parseFloat(valor)

        if (numValor !== null && (numValor < 0 || numValor > 10)) {
            return
        }

        const newCalificaciones = [...calificaciones]
        const index = newCalificaciones.findIndex(c => c.actividad_id === actividadId && c.alumno_id === alumnoId)

        if (index >= 0) {
            newCalificaciones[index] = { ...newCalificaciones[index], calificacion: numValor, updated_at: new Date().toISOString() }
        } else {
            newCalificaciones.push({
                id: 'temp-' + Date.now(),
                actividad_id: actividadId,
                alumno_id: alumnoId,
                calificacion: numValor,
                retroalimentacion: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        }
        setCalificaciones(newCalificaciones)

        setCalificaciones(newCalificaciones)

        const saved = await saveCalificacion(actividadId, alumnoId, numValor)
        if (!saved) {
            toast({ title: "Error", description: "No se pudo guardar la calificación", variant: "destructive" })
            // Revert logic could be complex without previous state, but at least we warn the user.
            // Ideally we should reload data from server to be safe.
            loadData()
        }
    }

    const getCalificacionValue = (actividadId: string, alumnoId: string) => {
        const cal = calificaciones.find(c => c.actividad_id === actividadId && c.alumno_id === alumnoId)
        if (cal && cal.calificacion !== null) {
            return cal.calificacion.toString()
        }
        return ''
    }

    const handleDeleteActividad = (id: string) => {
        setDeleteConfirmation({ type: 'actividad', id })
    }

    const confirmDelete = async () => {
        if (!deleteConfirmation) return

        if (deleteConfirmation.type === 'actividad') {
            try {
                const success = await deleteActividad(deleteConfirmation.id)
                if (success) {
                    setActividades(actividades.filter(a => a.id !== deleteConfirmation.id))
                    toast({ title: "Eliminado", description: "Actividad eliminada" })
                }
            } catch (error) {
                toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" })
            }
        } else if (deleteConfirmation.type === 'evidencia') {
            const success = await deleteEvidencia(deleteConfirmation.id)
            if (success) {
                setEvidencias(evidencias.filter(e => e.id !== deleteConfirmation.id))
                toast({ title: "Eliminado", description: "Evidencia eliminada" })
            }
        }
        setDeleteConfirmation(null)
    }

    const handleDeleteEvidencia = (id: string) => {
        setDeleteConfirmation({ type: 'evidencia', id })
    }

    const calculateAverage = (alumnoId: string) => {
        const alumnoGrades = calificaciones.filter(c => c.alumno_id === alumnoId && c.calificacion !== null)
        if (alumnoGrades.length === 0) return '-'

        const sum = alumnoGrades.reduce((acc, curr) => acc + (curr.calificacion || 0), 0)
        return (sum / alumnoGrades.length).toFixed(1)
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold">Actividades y Evaluación</h2>
                    <p className="text-gray-600">Portafolio de evidencias y calificaciones del grupo</p>
                </div>
                <div className="flex gap-2 items-center">
                    {/* Filter */}
                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por fecha" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las fechas</SelectItem>
                            <SelectItem value="this_week">Esta Semana</SelectItem>
                            <SelectItem value="this_month">Este Mes</SelectItem>
                            <SelectItem value="last_month">Mes Pasado</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="h-6 w-px bg-gray-200 mx-1"></div>

                    {/* Create Manual */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Actividad
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nueva Actividad Manual</DialogTitle>
                                <DialogDescription>Crea una columna para calificar tareas, proyectos o participaciones.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nombre</Label>
                                    <Input
                                        value={newActividad.nombre}
                                        onChange={e => setNewActividad({ ...newActividad, nombre: e.target.value })}
                                        placeholder="Ej. Tarea 1: Mapa Mental"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tipo</Label>
                                        <Select
                                            value={newActividad.tipo}
                                            onValueChange={v => setNewActividad({ ...newActividad, tipo: v })}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="tarea">Tarea</SelectItem>
                                                <SelectItem value="examen">Examen</SelectItem>
                                                <SelectItem value="proyecto">Proyecto</SelectItem>
                                                <SelectItem value="participacion">Participación</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ponderación (%)</Label>
                                        <Input
                                            type="number"
                                            value={newActividad.ponderacion}
                                            onChange={e => setNewActividad({ ...newActividad, ponderacion: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateActividad}>Crear Actividad</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Link Exam */}
                    <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                                <FileText className="h-4 w-4 mr-2" />
                                Asignar Examen
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Vincular Examen</DialogTitle>
                                <DialogDescription>Selecciona un examen de tu biblioteca para calificarlo aquí.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Seleccionar Examen</Label>
                                    <Select
                                        onValueChange={(val) => {
                                            const exam = examenes.find(e => e.id === val)
                                            if (exam) {
                                                setNewActividad({
                                                    ...newActividad,
                                                    nombre: exam.title || 'Examen sin título',
                                                    tipo: 'examen',
                                                    examen_id: exam.id
                                                })
                                            }
                                        }}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Selecciona un examen" /></SelectTrigger>
                                        <SelectContent>
                                            {examenes.map(exam => (
                                                <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {newActividad.examen_id && (
                                    <div className="p-3 bg-blue-50 rounded text-sm text-blue-800">
                                        Se creará la actividad: <strong>{newActividad.nombre}</strong>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateActividad}>Asignar Examen</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Link Planning */}
                    <Dialog open={isPlanningDialogOpen} onOpenChange={setIsPlanningDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Asignar Planeación
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Vincular Planeación</DialogTitle>
                                <DialogDescription>Evalúa una actividad basada en tus planeaciones didácticas.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Seleccionar Planeación</Label>
                                    <Select
                                        onValueChange={(val) => {
                                            const plan = planeaciones.find(p => p.id === val)
                                            if (plan) {
                                                setNewActividad({
                                                    ...newActividad,
                                                    nombre: plan.tema || 'Planeación sin tema',
                                                    tipo: 'proyecto',
                                                    planeacion_id: plan.id
                                                })
                                            }
                                        }}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Selecciona una planeación" /></SelectTrigger>
                                        <SelectContent>
                                            {planeaciones.map(plan => (
                                                <SelectItem key={plan.id} value={plan.id}>
                                                    {plan.tema ? plan.tema : `Planeación del ${format(new Date(plan.created_at), 'dd/MM/yyyy')}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {newActividad.planeacion_id && (
                                    <div className="p-3 bg-purple-50 rounded text-sm text-purple-800">
                                        Se creará la actividad: <strong>{newActividad.nombre}</strong>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateActividad} className="bg-purple-600 hover:bg-purple-700">Asignar Planeación</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Gradebook Table */}
            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : actividades.length === 0 ? (
                        <div className="text-center p-12 text-gray-500">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No hay actividades creadas.</p>
                            <p className="text-sm">Crea una nueva actividad para comenzar a calificar.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                                <tr>
                                    <th className="p-4 text-left font-medium w-64 min-w-[200px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r">Alumno</th>
                                    {filteredActividades.map(act => (
                                        <th key={act.id} className="p-3 text-center min-w-[120px] bg-gray-50 dark:bg-gray-800 border-r group relative">
                                            <div
                                                className="flex flex-col items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors"
                                                onClick={() => setSelectedActividad(act)}
                                            >
                                                <span className="font-medium text-xs uppercase tracking-wider text-gray-500">{act.tipo}</span>
                                                <span className="font-semibold line-clamp-2 sm:line-clamp-1 text-blue-600 dark:text-blue-400" title={act.nombre}>{act.nombre}</span>
                                            </div>
                                            {/* Actions Hover */}
                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteActividad(act.id); }}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </th>
                                    ))}
                                    <th className="p-4 text-center font-bold min-w-[100px] bg-gray-100 dark:bg-gray-900">Promedio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {sortedAlumnos.map((alumno) => (
                                    <tr key={alumno.id} className="hover:bg-gray-50/50">
                                        <td className="p-3 border-r sticky left-0 bg-white dark:bg-gray-950 font-medium z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                                    {alumno.numero_lista || '#'}
                                                </div>
                                                <span className="truncate">{alumno.nombre_completo || alumno.nombre}</span>
                                            </div>
                                        </td>
                                        {filteredActividades.map(act => (
                                            <td key={act.id} className="p-2 border-r text-center">
                                                <input
                                                    className="w-16 h-8 text-center border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-900"
                                                    // type="number"
                                                    placeholder="-"
                                                    value={getCalificacionValue(act.id, alumno.id)}
                                                    onChange={(e) => handleCalificacionChange(act.id, alumno.id, e.target.value)}
                                                />
                                            </td>
                                        ))}
                                        <td className="p-3 text-center font-bold bg-gray-50/30">
                                            {calculateAverage(alumno.id)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
            {/* Activity Detail Sheet */}
            <Sheet open={!!selectedActividad} onOpenChange={(open) => !open && setSelectedActividad(null)}>
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{selectedActividad?.nombre}</SheetTitle>
                        <SheetDescription>
                            {selectedActividad?.tipo.toUpperCase()} • {format(new Date(selectedActividad?.created_at || new Date()), 'dd/MM/yyyy')}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 py-6">
                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <span className="text-sm text-gray-500">Ponderación</span>
                                <p className="text-2xl font-bold">{selectedActividad?.ponderacion}%</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <span className="text-sm text-gray-500">Promedio Grupo</span>
                                <p className="text-2xl font-bold text-blue-600">
                                    {selectedActividad && calificaciones.length > 0 ? (
                                        (calificaciones
                                            .filter(c => c.actividad_id === selectedActividad.id && c.calificacion !== null)
                                            .reduce((acc, curr) => acc + (curr.calificacion || 0), 0) /
                                            (calificaciones.filter(c => c.actividad_id === selectedActividad.id && c.calificacion !== null).length || 1))
                                            .toFixed(1)
                                    ) : '-'}
                                </p>
                            </div>
                        </div>

                        {/* Evidence Section */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" />
                                    Evidencias
                                </h3>
                                <div className="relative">
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleUploadEvidencia}
                                        disabled={uploading}
                                        accept="image/*,video/*,application/pdf"
                                    />
                                    <Button size="sm" variant="outline" disabled={uploading}>
                                        {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                        Subir Evidencia
                                    </Button>
                                </div>
                            </div>

                            {evidencias.length === 0 ? (
                                <div className="text-center p-8 border-2 border-dashed rounded-lg text-gray-400">
                                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No hay evidencias subidas.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {evidencias.map(ev => (
                                        <div key={ev.id} className="relative group border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                                            {ev.tipo === 'imagen' ? (
                                                <div className="aspect-video relative bg-black">
                                                    <img src={ev.url} alt="Evidencia" className="object-cover w-full h-full" />
                                                </div>
                                            ) : (
                                                <div className="aspect-video flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                                                    {ev.tipo === 'video' ? <Video className="h-8 w-8 text-gray-400" /> : <FileText className="h-8 w-8 text-gray-400" />}
                                                </div>
                                            )}

                                            <div className="p-2 text-xs truncate border-t flex justify-between items-center bg-white dark:bg-gray-800">
                                                <span className="truncate flex-1" title={ev.nombre_archivo || 'Archivo'}>{ev.nombre_archivo || 'Archivo'}</span>
                                            </div>

                                            {/* Overlay Actions */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => window.open(ev.url, '_blank')}>
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDeleteEvidencia(ev.id)}>
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {selectedActividad?.descripcion && (
                            <div>
                                <h3 className="font-semibold mb-2">Descripción</h3>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-600 dark:text-gray-300">
                                    {selectedActividad.descripcion}
                                </div>
                            </div>
                        )}

                        {/* Vinculaciones */}
                        {(selectedActividad?.examen_id || selectedActividad?.planeacion_id) && (
                            <div>
                                <h3 className="font-semibold mb-2">Vinculaciones</h3>
                                <div className="flex gap-2">
                                    {selectedActividad.examen_id && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Examen Vinculado</span>}
                                    {selectedActividad.planeacion_id && <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Planeación Vinculada</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    <SheetFooter>
                        {/* <Button variant="outline" onClick={() => setSelectedActividad(null)}>Cerrar</Button> */}
                    </SheetFooter>
                </SheetContent>
            </Sheet>



            <AlertDialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteConfirmation?.type === 'actividad'
                                ? "Se eliminará la actividad y todas las calificaciones asociadas. Esta acción no se puede deshacer."
                                : "Se eliminará el archivo de evidencia permanentemente."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
