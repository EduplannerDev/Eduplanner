"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, BookOpen, Sparkles, ArrowLeft, Save, Send, Crown } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { isUserPro } from "@/lib/subscription-utils"
import { usePlaneaciones } from "@/hooks/use-planeaciones"
import { getCleanContentForSaving } from "@/lib/planeaciones"
import { useToast } from "@/hooks/use-toast"
import { useContextoTrabajo } from "@/hooks/use-contexto-trabajo"
import { getGradoTexto } from "@/lib/grado-utils"

interface PlaneacionTutoriasProps {
    onBack: () => void
    onSuccess: () => void
}

interface TutoriasFormData {
    grado: string
    dimension: string
    temaEspecifico: string
    objetivo: string
    duracion: string
}

const DIMENSIONES = [
    { value: "Socioemocional", label: "Socioemocional" },
    { value: "Académica", label: "Académica" },
    { value: "Vocacional", label: "Vocacional" },
    { value: "Convivencia Escolar", label: "Convivencia Escolar" },
    { value: "Estilos de Vida Saludable", label: "Estilos de Vida Saludable" },
]

export function PlaneacionTutorias({ onBack, onSuccess }: PlaneacionTutoriasProps) {
    const { user } = useAuth()
    const { profile, loading: profileLoading } = useProfile()
    const { createPlaneacion, creating, canCreateMore } = usePlaneaciones()
    const { toast } = useToast()
    const { contexto } = useContextoTrabajo()

    const [formData, setFormData] = useState<TutoriasFormData>({
        grado: "",
        dimension: "",
        temaEspecifico: "",
        objetivo: "",
        duracion: "50 minutos"
    })
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [generatedContent, setGeneratedContent] = useState<string>("")
    const [savedPlaneacionId, setSavedPlaneacionId] = useState<string | null>(null)

    const isPro = profile ? isUserPro(profile) : false

    useEffect(() => {
        if (contexto) {
            setFormData(prev => ({
                ...prev,
                grado: contexto.grado.toString()
            }))
        }
    }, [contexto])

    const showCopyWarning = () => {
        toast({
            title: "Acción no permitida",
            description: "No es posible seleccionar ni copiar texto. Debes guardar la planeación para poder descargarla en PDF.",
            variant: "destructive",
        })
    }

    // Prevent copy/paste
    useEffect(() => {
        if (!generatedContent) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                (e.ctrlKey && (e.key === 'c' || e.key === 'a' || e.key === 'v' || e.key === 'x')) ||
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                (e.ctrlKey && e.key === 'u')
            ) {
                e.preventDefault()
                e.stopPropagation()
                showCopyWarning()
                return false
            }
        }

        const handleContextMenu = (e: Event) => {
            e.preventDefault()
            showCopyWarning()
            return false
        }

        document.addEventListener('keydown', handleKeyDown)
        document.addEventListener('contextmenu', handleContextMenu)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.removeEventListener('contextmenu', handleContextMenu)
        }
    }, [generatedContent])

    const handleInputChange = (field: keyof TutoriasFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
        setError(null)
    }

    const validateForm = (): boolean => {
        if (!formData.grado) {
            setError("Por favor selecciona un grado")
            return false
        }
        if (!formData.dimension) {
            setError("Por favor selecciona una dimensión")
            return false
        }
        if (!formData.temaEspecifico.trim()) {
            setError("Por favor ingresa el tema específico")
            return false
        }
        return true
    }

    const [modificationInput, setModificationInput] = useState("")

    const handleGenerate = async () => {
        if (!validateForm()) return

        const canCreate = await canCreateMore();
        if (!canCreate) {
            setError('Has alcanzado el límite de planeaciones para tu plan. Actualiza a PRO para crear ilimitadas.')
            return
        }

        setIsGenerating(true)
        setError(null)
        setGeneratedContent("") // Clear previous content

        try {
            const gradoTexto = contexto ? getGradoTexto(contexto.grado) : `${formData.grado}° grado`

            const prompt = `Necesito una planeación de tutoría para ${gradoTexto}.
Dimensión: ${formData.dimension}
Tema: "${formData.temaEspecifico}"
${formData.objetivo ? `Objetivo: ${formData.objetivo}` : ''}
Duración: ${formData.duracion}

Por favor, estructura la planeación con:
1. Datos generales (Grado, Dimensión, Tema)
2. Propósito de la sesión
3. Secuencia Didáctica (Inicio, Desarrollo, Cierre)
4. Materiales y Recursos
5. Evaluación/Seguimiento`

            const response = await fetch('/api/generate-tutoria', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    maxTokens: 2000,
                    temperature: 0.7
                }),
            })

            if (!response.ok) {
                throw new Error(`Error al generar la planeación: ${response.statusText}`)
            }

            const data = await response.json()
            const content = data.content

            if (!content) {
                throw new Error('No se pudo generar la planeación - respuesta vacía')
            }

            const cleanContent = getCleanContentForSaving(content)
            setGeneratedContent(cleanContent)

        } catch (error) {
            console.error("Error generating tutoria:", error)
            setError(error instanceof Error ? error.message : "Error al generar la planeación")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleModify = async () => {
        if (!modificationInput.trim()) return

        setIsGenerating(true)
        setError(null)

        try {
            const prompt = `Por favor modifica la siguiente planeación de tutoría.
            
PLANEACIÓN ACTUAL:
${generatedContent}

INSTRUCCIONES DE MODIFICACIÓN:
${modificationInput}

Genera la planeación COMPLETA y actualizada.`

            const response = await fetch('/api/generate-tutoria', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    maxTokens: 2000,
                    temperature: 0.7
                }),
            })

            if (!response.ok) {
                throw new Error(`Error al modificar la planeación: ${response.statusText}`)
            }

            const data = await response.json()
            const content = data.content

            if (content) {
                setGeneratedContent(getCleanContentForSaving(content))
                setModificationInput("") // Clear input on success
            }

        } catch (error) {
            console.error("Error modifying tutoria:", error)
            setError("Error al aplicar los cambios. Intenta de nuevo.")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSave = async () => {
        if (!generatedContent) return

        // Final limit check before saving
        const canCreate = await canCreateMore();
        if (!canCreate) {
            setError('Has alcanzado el límite de planeaciones para tu plan en este momento.')
            return
        }

        try {
            const gradoTexto = contexto ? getGradoTexto(contexto.grado) : `${formData.grado}° grado`

            const newPlaneacion = await createPlaneacion({
                titulo: `Tutoría: ${formData.temaEspecifico}`,
                materia: "Tutoría",
                grado: gradoTexto,
                duracion: formData.duracion,
                objetivo: formData.objetivo || `Abordar la dimensión ${formData.dimension}`,
                contenido: generatedContent,
                estado: "completada",
                metodologia: 'Tutoría'
            })

            if (newPlaneacion) {
                setSavedPlaneacionId(newPlaneacion.id)
                toast({
                    title: "¡Planeación guardada!",
                    description: "Se ha guardado exitosamente en tus planeaciones.",
                    variant: "default",
                })
                setTimeout(() => {
                    onSuccess()
                }, 2000)
            } else {
                setError('Error al guardar en la base de datos.')
            }

        } catch (error) {
            setError('Error inesperado al guardar.')
        }
    }

    if (profileLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
        )
    }

    // Loading state
    if (profileLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={onBack}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Users className="h-8 w-8 text-blue-600" />
                            Planeación de Tutoría
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Cargando información del usuario...
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="text-gray-600 dark:text-gray-400">Cargando...</span>
                    </div>
                </div>
            </div>
        )
    }

    // PRO validation
    if (!isPro) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={onBack}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Users className="h-8 w-8 text-blue-600" />
                            Planeación de Tutoría
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Diseña sesiones de tutoría enfocadas en el desarrollo integral
                        </p>
                    </div>
                </div>

                <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-800/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                            <Crown className="h-5 w-5" />
                            Funcionalidad PRO
                        </CardTitle>
                        <CardDescription className="text-amber-700 dark:text-amber-400">
                            Esta funcionalidad está disponible solo para usuarios PRO
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-amber-800 dark:text-amber-300">
                                El asistente de Planeación de Tutorías te permite crear sesiones especializadas para
                                el desarrollo integral de tus estudiantes, abordando las cinco dimensiones fundamentales:
                                socioemocional, académica, vocacional, convivencia escolar y estilos de vida saludable.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => window.location.href = '#perfil'}
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    <Crown className="mr-2 h-4 w-4" />
                                    Ver Planes PRO
                                </Button>
                                <Button
                                    onClick={onBack}
                                    variant="outline"
                                    className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950"
                                >
                                    Volver
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    onClick={onBack}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Users className="h-8 w-8 text-blue-600" />
                        Planeación de Tutoría
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Diseña sesiones de tutoría enfocadas en el desarrollo integral
                    </p>
                </div>
            </div>

            {/* Form Section - Full Width */}
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Configuración de la Sesión
                        </CardTitle>
                        <CardDescription>
                            Define los detalles de la sesión de tutoría
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Grado Escolar</Label>
                            <div className="p-3 bg-muted rounded-md border text-sm">
                                {contexto ? getGradoTexto(contexto.grado) : "Cargando grado..."}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Dimensión de la Tutoría *</Label>
                            <Select
                                value={formData.dimension}
                                onValueChange={(val) => handleInputChange("dimension", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una dimensión" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DIMENSIONES.map((d) => (
                                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tema">Tema Específico *</Label>
                            <Input
                                id="tema"
                                placeholder="Ej: Manejo de emociones, Hábitos de estudio..."
                                value={formData.temaEspecifico}
                                onChange={(e) => handleInputChange("temaEspecifico", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="objetivo">Objetivo (Opcional)</Label>
                            <Textarea
                                id="objetivo"
                                placeholder="¿Qué esperas lograr con esta sesión?"
                                value={formData.objetivo}
                                onChange={(e) => handleInputChange("objetivo", e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duracion">Duración</Label>
                            <Input
                                id="duracion"
                                value={formData.duracion}
                                onChange={(e) => handleInputChange("duracion", e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || creating}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            size="lg"
                        >
                            {isGenerating || creating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generar Planeación
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Generated Content - Full Width Below Form */}
            {generatedContent && (
                <div className="space-y-6 mt-8">
                    <div className="max-w-4xl mx-auto">
                        <Card className="border-none shadow-none bg-transparent">
                            <CardContent className="p-0">
                                <div className="space-y-6">
                                    <div
                                        className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border select-none prose max-w-none dark:prose-invert"
                                        dangerouslySetInnerHTML={{ __html: generatedContent }}
                                        onContextMenu={(e) => {
                                            e.preventDefault()
                                            showCopyWarning()
                                        }}
                                    />

                                    {/* Botón para guardar planeación */}
                                    {!savedPlaneacionId ? (
                                        <>
                                            <div className="flex justify-center">
                                                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-950 dark:to-emerald-950 dark:border-green-900 w-full max-w-2xl">
                                                    <CardContent className="pt-6">
                                                        <div className="text-center">
                                                            <h3 className="font-medium select-none text-green-800 dark:text-green-100">¿Quieres guardar esta planeación?</h3>
                                                            <p className="text-sm mb-4 text-green-700 dark:text-green-300">
                                                                Podrás encontrarla después en "Mis Planeaciones"
                                                            </p>
                                                            <Button
                                                                onClick={handleSave}
                                                                disabled={creating || isGenerating}
                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                            >
                                                                {creating ? (
                                                                    <>
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        Guardando...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Save className="mr-2 h-4 w-4" />
                                                                        Guardar Planeación
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            <div className="flex justify-center mt-4">
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md text-center dark:bg-blue-950 dark:border-blue-900">
                                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                                        💬 ¿Quieres hacer algún cambio? Puedes pedirme que modifique cualquier parte de la planeación
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-center">
                                            <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900 w-full max-w-2xl">
                                                <CardContent className="pt-6">
                                                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-300">
                                                        <Sparkles className="h-5 w-5" />
                                                        <span className="font-medium">¡Planeación guardada exitosamente!</span>
                                                    </div>
                                                    <p className="text-center text-sm text-green-600 mt-1 dark:text-green-400">
                                                        Puedes encontrarla en la sección "Mis Planeaciones"
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Input Area at the bottom */}
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t dark:bg-gray-900/80 dark:border-gray-800 lg:pl-[280px] z-10">
                            <div className="max-w-4xl mx-auto flex gap-2">
                                <Input
                                    placeholder="Escribe aquí para solicitar cambios (ej. 'Hazla más corta')..."
                                    value={modificationInput}
                                    onChange={(e) => setModificationInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !isGenerating && !creating) {
                                            handleModify();
                                        }
                                    }}
                                    disabled={isGenerating || creating || !!savedPlaneacionId}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleModify}
                                    disabled={!modificationInput.trim() || isGenerating || creating || !!savedPlaneacionId}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        {/* Spacing for fixed footer */}
                        <div className="h-24" />
                    </div>
                </div>
            )}
        </div>
    )
}
