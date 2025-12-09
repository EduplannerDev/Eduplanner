"use client"

import { useState } from "react"
// import { useChat } from "ai/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, ArrowRight, Loader2, Sparkles, FileText, FolderKanban } from "lucide-react"
import { usePlaneaciones } from "@/hooks/use-planeaciones"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { LoadingOverlay } from "@/components/ui/loading-overlay"

interface NuevaPresentacionWizardProps {
    onClose: () => void
    onComplete: () => void
}

type FuenteTipo = 'planeacion' | 'proyecto' | 'libre'

export function NuevaPresentacionWizard({ onClose, onComplete }: NuevaPresentacionWizardProps) {
    const { planeaciones } = usePlaneaciones()
    const { toast } = useToast()
    const [step, setStep] = useState(1)
    const [generating, setGenerating] = useState(false)

    // Estados del wizard
    const [fuenteTipo, setFuenteTipo] = useState<FuenteTipo>('planeacion')
    const [planeacionSeleccionada, setPlaneacionSeleccionada] = useState<string>('')

    // Estado para isLoading (ya que quitamos useChat)
    const [isLoading, setIsLoading] = useState(false)

    const handleNext = () => {
        if (step === 1) {
            if (fuenteTipo === 'planeacion' && !planeacionSeleccionada) {
                toast({
                    title: "Selecciona una planeación",
                    description: "Debes seleccionar una planeación para continuar",
                    variant: "destructive"
                })
                return
            }
            setStep(2)
        }
    }

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1)
        } else {
            onClose()
        }
    }

    const handleGenerar = async () => {
        if (!planeacionSeleccionada) return

        const planeacion = planeaciones.find(p => p.id === planeacionSeleccionada)
        if (!planeacion) return

        setIsLoading(true)
        setGenerating(true)

        try {
            // Construir el prompt para la IA (ahora lo mandamos structureado como 'planeacion')
            const response = await fetch("/api/generate-presentation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    planeacion: {
                        titulo: planeacion.titulo,
                        materia: planeacion.materia,
                        grado: planeacion.grado,
                        duracion: planeacion.duracion,
                        objetivo: planeacion.objetivo,
                        contenido: JSON.stringify(planeacion.contenido)
                    }
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()

            if (!data.content) {
                throw new Error('La respuesta de la IA llegó vacía')
            }

            // Procesar la respuesta (similar al onFinish anterior)
            let presentationData
            let cleanContent = data.content.trim()

            // Limpiar markdown code blocks
            cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '')

            const firstBrace = cleanContent.indexOf('{')
            const lastBrace = cleanContent.lastIndexOf('}')

            if (firstBrace === -1 || lastBrace === -1) {
                throw new Error('No se encontró JSON en la respuesta de la IA')
            }

            const jsonStr = cleanContent.substring(firstBrace, lastBrace + 1)
            presentationData = JSON.parse(jsonStr)

            // Validar estructura
            if (!presentationData.titulo || !presentationData.diapositivas || !Array.isArray(presentationData.diapositivas)) {
                throw new Error('La IA no generó una presentación completa')
            }

            // Obtener el user_id actual
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                throw new Error('Usuario no autenticado')
            }

            // Guardar presentación en la base de datos
            const { data: savedPresentation, error: saveError } = await supabase
                .from('presentaciones_ia')
                .insert({
                    user_id: user.id,
                    titulo: presentationData.titulo || planeacion.titulo,
                    fuente_tipo: 'planeacion',
                    fuente_id: planeacion.id,
                    diapositivas_json: presentationData,
                    tema_visual: presentationData.tema_color || '#8B5CF6'
                })
                .select()
                .single()

            if (saveError) {
                throw new Error('Error al guardar la presentación: ' + saveError.message)
            }

            toast({
                title: "¡Presentación creada!",
                description: `Se generó una presentación con ${presentationData.diapositivas.length} diapositivas`,
            })

            onComplete()

        } catch (error) {
            console.error("Error generando presentación:", error)
            toast({
                title: "Error al generar presentación",
                description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
            setGenerating(false)
        }
    }

    return (
        <div className="space-y-6 relative min-h-[400px]">
            {(isLoading || generating) && <LoadingOverlay />}

            {/* Header del Wizard */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nueva Presentación</h2>
                    <p className="text-gray-500 dark:text-gray-400">Paso {step} de 2</p>
                </div>
                <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-purple-600 transition-all duration-500 ease-out"
                        style={{ width: `${(step / 2) * 100}%` }}
                    />
                </div>
            </div>
            {/* Step 1: Seleccionar Fuente */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Selecciona el origen</CardTitle>
                        <CardDescription>
                            Elige desde dónde quieres crear la presentación
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Tipo de Fuente */}
                        <div className="space-y-4">
                            <Label>Tipo de contenido</Label>
                            <RadioGroup value={fuenteTipo} onValueChange={(value) => setFuenteTipo(value as FuenteTipo)}>
                                <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <RadioGroupItem value="planeacion" id="planeacion" />
                                    <Label htmlFor="planeacion" className="flex-1 cursor-pointer flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-purple-600" />
                                        <div>
                                            <div className="font-medium">Desde Planeación</div>
                                            <div className="text-sm text-gray-500">Usa una planeación existente</div>
                                        </div>
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-50">
                                    <RadioGroupItem value="proyecto" id="proyecto" disabled />
                                    <Label htmlFor="proyecto" className="flex-1 flex items-center gap-2">
                                        <FolderKanban className="h-5 w-5 text-purple-600" />
                                        <div>
                                            <div className="font-medium">Desde Proyecto</div>
                                            <div className="text-sm text-gray-500">Próximamente</div>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Selector de Planeación */}
                        {fuenteTipo === 'planeacion' && (
                            <div className="space-y-2">
                                <Label htmlFor="planeacion-select">Selecciona una planeación</Label>
                                <Select value={planeacionSeleccionada} onValueChange={setPlaneacionSeleccionada}>
                                    <SelectTrigger id="planeacion-select">
                                        <SelectValue placeholder="Selecciona una planeación..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {planeaciones.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-gray-500">
                                                No tienes planeaciones disponibles
                                            </div>
                                        ) : (
                                            planeaciones.map((planeacion) => (
                                                <SelectItem key={planeacion.id} value={planeacion.id}>
                                                    {planeacion.titulo}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Confirmar y Generar */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                            Generar Presentación
                        </CardTitle>
                        <CardDescription>
                            La IA creará una presentación profesional basada en tu selección
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg space-y-2">
                            <h4 className="font-medium text-purple-900 dark:text-purple-100">
                                ¿Qué se generará?
                            </h4>
                            <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">•</span>
                                    Diapositiva de portada con título y contexto
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">•</span>
                                    Diapositivas de contenido con puntos clave
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">•</span>
                                    Actividades interactivas sugeridas
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">•</span>
                                    Diapositiva de cierre con resumen
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">•</span>
                                    Sugerencias de imágenes para cada slide
                                </li>
                            </ul>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Nota:</strong> La presentación se guardará en tu biblioteca y podrás descargarla en formato PowerPoint (.pptx)
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Botones de Navegación */}
            <div className="flex justify-between gap-4">
                <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {step > 1 ? 'Atrás' : 'Cancelar'}
                </Button>

                {step < 2 ? (
                    <Button onClick={handleNext} className="bg-purple-600 hover:bg-purple-700">
                        Siguiente
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleGenerar}
                        disabled={isLoading || generating}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        {isLoading || generating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generar Presentación
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    )
}
