"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Check, ChevronsUpDown, ArrowRight, AlertCircle, Loader2, Phone, Save, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

interface IncidenciaWizardProps {
    plantelId: string
    onCancel: () => void
    onComplete: () => void
}

interface Alumno {
    id: string
    nombre: string
    grado: string
    grupo: string
}

interface AnalisisResult {
    clasificacion: 'Riesgo Bajo' | 'Riesgo Medio' | 'Riesgo Alto' | 'Riesgo Inminente'
    tipo_incidencia?: string
    acciones_urgentes: string[]
    acta_borrador: string
    fundamento_legal: string
}

export function IncidenciaWizard({ plantelId, onCancel, onComplete }: IncidenciaWizardProps) {
    const { toast } = useToast()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState("Procesando...")
    const [alumnos, setAlumnos] = useState<Alumno[]>([])

    // Form Data
    const [selectedStudentId, setSelectedStudentId] = useState<string>("")
    const [narrativa, setNarrativa] = useState("")
    const [tipoIncidencia, setTipoIncidencia] = useState<string>("")

    // Analysis Result Data
    const [analisis, setAnalisis] = useState<AnalisisResult | null>(null)
    const [accionesCompletadas, setAccionesCompletadas] = useState<Record<string, boolean>>({})

    // UI States
    const [openCombobox, setOpenCombobox] = useState(false)

    // Cargar alumnos al inicio
    useEffect(() => {
        const fetchAlumnos = async () => {
            if (!plantelId) return

            // Consulta corregida: Alumnos vía Grupos del Plantel
            const { data, error } = await supabase
                .from('alumnos')
                .select(`
                    id, 
                    nombre_completo,
                    numero_lista,
                    grupo:grupos!inner(
                        nombre,
                        grado,
                        plantel_id
                    )
                `)
                .eq('grupos.plantel_id', plantelId)
                .order('nombre_completo')

            if (error) {
                console.error("Error fetching alumnos:", error)
                return
            }

            if (data) {
                // Mapear respuesta anidada a estructura plana
                const mappedAlumnos = data.map((a: any) => ({
                    id: a.id,
                    nombre: a.nombre_completo,
                    grado: a.grupo?.grado || '',
                    grupo: a.grupo?.nombre || ''
                }))
                setAlumnos(mappedAlumnos)
            }
        }
        fetchAlumnos()
    }, [plantelId, supabase])

    // Mensajes rotativos de carga
    useEffect(() => {
        if (!loading) return
        const messages = [
            "Consultando Marco de Convivencia...",
            "Analizando nivel de riesgo...",
            "Redactando acta preliminar...",
            "Verificando protocolos de seguridad..."
        ]
        let i = 0
        const interval = setInterval(() => {
            setLoadingMessage(messages[i % messages.length])
            i++
        }, 1500)
        return () => clearInterval(interval)
    }, [loading])

    // Validación del paso 1
    const isStep1Valid = () => {
        if (narrativa.length <= 20) return false
        if (!selectedStudentId) return false
        return true
    }

    const handleAnalyze = async () => {
        if (!isStep1Valid()) return

        setLoading(true)
        setStep(2) // Move to loading step

        try {
            // Obtener usuario actual
            const { data: { user } } = await supabase.auth.getUser()

            const response = await fetch('/api/incidencias/analizar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descripcion: narrativa,
                    plantel_id: plantelId,
                    alumno_id: selectedStudentId,
                    user_id: user?.id // Send user ID for director name
                })
            })

            if (!response.ok) throw new Error('Error en el análisis')

            const data: AnalisisResult = await response.json()
            setAnalisis(data)
            setStep(3) // Move to review step
        } catch (error) {
            console.error(error)
            toast({
                title: "Error en el análisis",
                description: "No se pudo conectar con la IA. Inténtelo de nuevo.",
                variant: "destructive"
            })
            setStep(1) // Return to input
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!analisis) return

        try {
            // Obtener usuario actual para el campo created_by
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) throw new Error("No hay sesión de usuario activa")

            // Validar tipo de incidencia (Frontend Safety Net)
            const validTypes = [
                'portacion_armas', 'consumo_sustancias', 'acoso_escolar',
                'violencia_fisica', 'accidente_escolar', 'disturbio_externo', 'otro'
            ]

            // Priorizar clasificación IA, luego selección manual, luego 'otro'
            let finalType = analisis.tipo_incidencia || tipoIncidencia || 'otro'

            // Si el valor no está en la lista permitida (ej: "seguridad"), forzar 'otro'
            if (!validTypes.includes(finalType)) {
                console.warn(`Tipo inválido "${finalType}" detectado en frontend. Cambiando a "otro".`)
                finalType = 'otro'
            }

            const { error } = await supabase.from('incidencias').insert({
                plantel_id: plantelId,
                created_by: user.id,
                alumno_id: selectedStudentId,
                descripcion_hechos: narrativa,
                tipo: finalType,
                nivel_riesgo: mapRiesgo(analisis.clasificacion),
                acta_hechos_content: analisis.acta_borrador,
                protocolo_check: {
                    acciones: analisis.acciones_urgentes,
                    completadas: accionesCompletadas
                },
                estado: 'generado'
            })

            if (error) throw error

            toast({
                title: "Incidencia Registrada",
                description: "El reporte ha sido guardado exitosamente.",
            })
            onComplete()

        } catch (error) {
            console.error('Error al guardar incidencia:', error)
            // Log more detailed error info if it's a Supabase error
            if (error && typeof error === 'object' && 'message' in error) {
                console.error('Error message:', (error as any).message)
                console.error('Error details:', (error as any).details)
                console.error('Error hint:', (error as any).hint)
            }
            toast({
                title: "Error al guardar",
                description: error instanceof Error ? error.message : "Hubo un problema al guardar la incidencia.",
                variant: "destructive"
            })
        }
    }

    const mapRiesgo = (clasificacion: string): 'bajo' | 'medio' | 'alto' | 'critico' => {
        if (clasificacion.includes('Bajo')) return 'bajo'
        if (clasificacion.includes('Medio')) return 'medio'
        if (clasificacion.includes('Inminente')) return 'critico'
        if (clasificacion.includes('Alto')) return 'alto'
        return 'bajo'
    }

    const isHighRisk = analisis?.clasificacion.includes('Alto') || analisis?.clasificacion.includes('Inminente')

    return (
        <Card className="max-w-3xl mx-auto border-2 border-primary/10 shadow-xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Reportar Nueva Incidencia</CardTitle>
                        <CardDescription>Paso {step} de 3: {step === 1 ? 'Contexto Inicial' : step === 2 ? 'Análisis IA' : 'Revisión y Acciones'}</CardDescription>
                    </div>
                    {/* Indicador de pasos simple */}
                    <div className="flex gap-1">
                        <div className={cn("h-2 w-8 rounded-full transition-all", step >= 1 ? "bg-primary" : "bg-muted")} />
                        <div className={cn("h-2 w-8 rounded-full transition-all", step >= 2 ? "bg-primary" : "bg-muted")} />
                        <div className={cn("h-2 w-8 rounded-full transition-all", step >= 3 ? "bg-primary" : "bg-muted")} />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 min-h-[400px]">
                {/* PASO 1: INPUT */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Selección de Alumno */}
                        <div className="space-y-2">
                            <Label>Alumno Involucrado <span className="text-destructive">*</span></Label>
                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCombobox}
                                        className="w-full justify-between"
                                    >
                                        {selectedStudentId
                                            ? alumnos.find((a) => a.id === selectedStudentId)?.nombre
                                            : "Buscar alumno por nombre..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Buscar alumno..." />
                                        <CommandList>
                                            <CommandEmpty>No se encontró el alumno.</CommandEmpty>
                                            <CommandGroup>
                                                {alumnos.map((alumno) => (
                                                    <CommandItem
                                                        key={alumno.id}
                                                        value={alumno.nombre}
                                                        onSelect={() => {
                                                            setSelectedStudentId(alumno.id)
                                                            setOpenCombobox(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedStudentId === alumno.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span>{alumno.nombre}</span>
                                                            <span className="text-xs text-muted-foreground">{alumno.grado}° {alumno.grupo}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Selector de Tipo (Opcional/Pre-filtro) */}
                        <div className="space-y-2">
                            <Label>Tipo de Incidente (Preliminar)</Label>
                            <Select value={tipoIncidencia} onValueChange={setTipoIncidencia}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una categoría..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="conducta">Conducta / Disciplina</SelectItem>
                                    <SelectItem value="salud">Salud / Accidente</SelectItem>
                                    <SelectItem value="seguridad">Seguridad / Objetos Prohibidos</SelectItem>
                                    <SelectItem value="acoso">Acoso Escolar / Bullying</SelectItem>
                                    <SelectItem value="otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Narrativa */}
                        <div className="space-y-2">
                            <Label>Narrativa de los Hechos <span className="text-destructive">*</span></Label>
                            <Textarea
                                placeholder="Describa objetivamente qué sucedió, dónde y cuándo. Ej: Durante el receso a las 10:30am, observé que el alumno..."
                                className="min-h-[150px] resize-none text-base"
                                value={narrativa}
                                onChange={(e) => setNarrativa(e.target.value)}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Mínimo 20 caracteres para procesar.</span>
                                <span className={cn(narrativa.length > 0 && narrativa.length < 20 ? "text-destructive" : "")}>
                                    {narrativa.length} caracteres
                                </span>
                            </div>
                        </div>

                        {narrativa.length > 0 && narrativa.length < 20 && (
                            <Alert variant="destructive" className="py-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle className="ml-2 text-sm font-medium">Descripción muy corta</AlertTitle>
                                <AlertDescription className="ml-2 text-xs">
                                    Por favor detalla un poco más lo sucedido para que la IA pueda ayudarte mejor.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}

                {/* PASO 2: LOADING */}
                {step === 2 && (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                        <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
                        <h3 className="text-xl font-semibold text-center mb-2">Analizando Incidencia</h3>
                        <p className="text-muted-foreground text-center animate-pulse">
                            {loadingMessage}
                        </p>
                    </div>
                )}

                {/* PASO 3: REVIEW */}
                {step === 3 && analisis && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                        {/* ALERTA DE RIESGO ALTO */}
                        {isHighRisk ? (
                            <Alert variant="destructive" className="border-2 border-red-500 bg-red-50 animate-pulse">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <AlertTitle className="text-lg font-bold text-red-700 ml-2">RIESGO DETECTADO: {analisis.clasificacion.toUpperCase()}</AlertTitle>
                                <AlertDescription className="ml-2 mt-2">
                                    <div className="flex items-center gap-4">
                                        <p className="font-medium text-red-800">
                                            Se requiere intervención inmediata de autoridades externas.
                                        </p>
                                        <Button variant="destructive" className="gap-2 shadow-lg animate-bounce">
                                            <Phone className="h-4 w-4" />
                                            Llamar al 911
                                        </Button>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert className="bg-blue-50 border-blue-200">
                                <AlertCircle className="h-5 w-5 text-blue-600" />
                                <AlertTitle className="font-semibold text-blue-800 ml-2">Nivel de Riesgo: {analisis.clasificacion}</AlertTitle>
                                <AlertDescription className="ml-2 text-blue-700">
                                    Se sugieren las siguientes acciones preventivas conforme al protocolo.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* COLUMNA IZQUIERDA: Checklist */}
                            <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-600" />
                                    Protocolo de Acción
                                </h4>
                                <Card>
                                    <CardContent className="pt-4 space-y-3">
                                        {analisis.acciones_urgentes.map((accion, idx) => (
                                            <div key={idx} className="flex items-start space-x-2">
                                                <Checkbox
                                                    id={`accion-${idx}`}
                                                    checked={accionesCompletadas[`accion-${idx}`] || false}
                                                    onCheckedChange={(checked) =>
                                                        setAccionesCompletadas(prev => ({ ...prev, [`accion-${idx}`]: checked === true }))
                                                    }
                                                />
                                                <label
                                                    htmlFor={`accion-${idx}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {accion}
                                                </label>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* COLUMNA DERECHA: Acta Borrador */}
                            <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <FileTextIcon className="h-4 w-4 text-orange-600" />
                                    Borrador del Acta de Hechos
                                </h4>
                                <Textarea
                                    className="min-h-[300px] font-mono text-sm leading-relaxed"
                                    value={analisis.acta_borrador}
                                    onChange={(e) => setAnalisis({ ...analisis, acta_borrador: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    * Este texto es generado por IA. Revisa y edita cualquier imprecisión antes de guardar.
                                </p>
                            </div>
                        </div>

                    </div>
                )}
            </CardContent>

            <CardFooter className="flex justify-between pt-6 border-t">
                {step === 1 && (
                    <>
                        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                        <Button onClick={handleAnalyze} disabled={!isStep1Valid()} className="gap-2">
                            Siguiente: Análisis IA <ArrowRight className="h-4 w-4" />
                        </Button>
                    </>
                )}
                {step === 2 && (
                    <Button variant="ghost" disabled className="w-full">
                        Procesando...
                    </Button>
                )}
                {step === 3 && (
                    <>
                        <Button variant="outline" onClick={() => setStep(1)}>Atrás (Editar)</Button>
                        <Button onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700">
                            <Save className="h-4 w-4" />
                            Confirmar y Guardar Incidencia
                        </Button>
                    </>
                )}
            </CardFooter>
        </Card>
    )
}

function FileTextIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
    )
}
