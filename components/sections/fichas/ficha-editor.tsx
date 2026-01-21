"use client"

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Sparkles, Printer, Loader2, FileText, Wand2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateFichaContent } from "@/lib/actions/generate-ficha-ai"
import { saveFicha, getFichaByAlumno } from "@/lib/fichas"
import { generateFichaPDF } from "@/lib/pdf-generator"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { getUserUsageStats } from "@/lib/subscription-utils"

interface FichaEditorProps {
    alumno: any
    grupoId: string
    onBack: () => void
    onNavigateToSubscription?: () => void
}

export function FichaEditor({ alumno, grupoId, onBack, onNavigateToSubscription }: FichaEditorProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)

    // Estado Suscripción
    const [isPro, setIsPro] = useState(false)
    const [usageCount, setUsageCount] = useState(0)
    const [limit, setLimit] = useState(5) // Default 5

    // Estado del formulario
    const [estadoPromocion, setEstadoPromocion] = useState<"promovido" | "condicionado" | "no_promovido">("promovido")
    const [logros, setLogros] = useState("")
    const [dificultades, setDificultades] = useState("")
    const [recomendaciones, setRecomendaciones] = useState("")

    // Estado para Inputs de la IA (Magic Writer)
    const [magicLogros, setMagicLogros] = useState("")
    const [magicDificultades, setMagicDificultades] = useState("")
    const [magicRecomendaciones, setMagicRecomendaciones] = useState("")
    const [isMagicMode, setIsMagicMode] = useState(true)

    // Cargar suscripción y uso
    useEffect(() => {
        if (!user) return
        const loadSubscription = async () => {
            try {
                const stats = await getUserUsageStats(user.id)
                const fichaStats = stats.fichas_ai

                setUsageCount(fichaStats.count)
                setLimit(fichaStats.limit)
                setIsPro(fichaStats.limit === -1)

            } catch (error) {
                console.error("Error loading subscription:", error)
            }
        }
        loadSubscription()
    }, [user])

    // Cargar datos existentes
    useEffect(() => {
        const loadFicha = async () => {
            // Si ya venía en el prop alumno (desde la lista), usarlos
            if (alumno.ficha) {
                setEstadoPromocion(alumno.ficha.estado_promocion || "promovido")
                // Cargar contenido completo si existe
                const fichaCompleta = await getFichaByAlumno(alumno.id, "2024-2025")
                if (fichaCompleta) {
                    setLogros(fichaCompleta.logros || "")
                    setDificultades(fichaCompleta.dificultades || "")
                    setRecomendaciones(fichaCompleta.recomendaciones || "")
                    setIsMagicMode(false) // Si ya hay contenido, mostrar editor directo
                }
            }
        }
        loadFicha()
    }, [alumno])

    const handleGenerateAI = async () => {
        if (!magicLogros && !magicDificultades && !magicRecomendaciones) {
            toast({
                title: "Campos vacíos",
                description: "Ingresa al menos una observación para generar el contenido.",
                variant: "destructive"
            })
            return
        }

        setGenerating(true)
        try {
            const result = await generateFichaContent({
                nombre: alumno.nombre_completo,
                grado: "Primaria",
                observacionesLogros: magicLogros,
                observacionesDificultades: magicDificultades,
                observacionesRecomendaciones: magicRecomendaciones
            })

            if (result.success && result.data) {
                setLogros(result.data.logros)
                setDificultades(result.data.dificultades)
                setRecomendaciones(result.data.recomendaciones)
                setIsMagicMode(false)
                setUsageCount(prev => prev + 1)

                // Registrar uso en Supabase (Client Side)
                if (user) {
                    const { error: insertError } = await supabase.from('ficha_ai_generations').insert({
                        user_id: user.id
                    })

                    if (insertError) {
                        console.error("Error registrando uso de IA:", insertError)
                    }
                }

                toast({
                    title: "Contenido Generado",
                    description: "Revisa y ajusta el texto generado."
                })
            } else {
                throw new Error(result.error || "No se pudo generar el contenido")
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Hubo un problema al generar con IA.",
                variant: "destructive"
            })
        } finally {
            setGenerating(false)
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            await saveFicha({
                alumno_id: alumno.id,
                grupo_id: grupoId,
                ciclo_escolar: "2024-2025",
                estado_promocion: estadoPromocion,
                logros,
                dificultades,
                recomendaciones
            })
            toast({ title: "Guardado", description: "La ficha se ha actualizado correctamente." })
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "No se pudo guardar la ficha.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = async () => {
        try {
            toast({ title: "Generando PDF...", description: "Por favor espera un momento." })
            await generateFichaPDF({
                alumno_nombre: alumno.nombre_completo,
                estado_promocion: estadoPromocion,
                logros,
                dificultades,
                recomendaciones,
                isPro
            })
            toast({ title: "PDF Generado", description: "La descarga comenzará en breve." })
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "No se pudo generar el PDF.", variant: "destructive" })
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">{alumno.nombre_completo}</h2>
                    <p className="text-muted-foreground">Editando Ficha Descriptiva</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" onClick={handlePrint} disabled={!alumno.ficha}>
                        <Printer className="h-4 w-4 mr-2" />
                        Descargar PDF
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Guardar Ficha
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Estado de Promoción</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup value={estadoPromocion} onValueChange={(v: any) => setEstadoPromocion(v)}>
                                <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted">
                                    <RadioGroupItem value="promovido" id="r1" />
                                    <Label htmlFor="r1" className="cursor-pointer font-medium text-green-600">Promovido</Label>
                                </div>
                                <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted">
                                    <RadioGroupItem value="condicionado" id="r2" />
                                    <Label htmlFor="r2" className="cursor-pointer font-medium text-amber-600">Promovido con condiciones</Label>
                                </div>
                                <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted">
                                    <RadioGroupItem value="no_promovido" id="r3" />
                                    <Label htmlFor="r3" className="cursor-pointer font-medium text-red-600">No promovido</Label>
                                </div>
                            </RadioGroup>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50/50 border-blue-100">
                        <CardHeader>
                            <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Asistente IA
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-blue-700">
                            Usa el "Generador Mágico" para convertir tus notas rápidas en textos pedagógicos formales y profesionales.
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <Tabs value={isMagicMode ? "magic" : "manual"} onValueChange={(v) => setIsMagicMode(v === "magic")}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="magic">
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generador Mágico (IA)
                            </TabsTrigger>
                            <TabsTrigger value="manual">
                                <FileText className="h-4 w-4 mr-2" />
                                Edición Manual
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="magic" className="space-y-4 py-4">
                            <div className="space-y-4">
                                {(!isPro) && (
                                    <div className={`p-3 rounded-md border text-sm flex justify-between items-center ${usageCount >= limit ? 'bg-red-50 border-red-200 text-red-800' : 'bg-purple-50 border-purple-200 text-purple-800'}`}>
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4" />
                                            <span>
                                                {usageCount >= limit
                                                    ? "Has agotado tus generaciones de IA gratuitas."
                                                    : `Tienes ${limit - usageCount} generaciones de IA restantes.`
                                                }
                                            </span>
                                        </div>
                                        {usageCount >= limit ? (
                                            <Button variant="link" size="sm" className="text-red-900 underline" onClick={() => onNavigateToSubscription ? onNavigateToSubscription() : window.open('/pricing', '_blank')}>
                                                Mejorar a Pro
                                            </Button>
                                        ) : (
                                            <span className="font-bold">{usageCount} / {limit}</span>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Notas sobre Logros (Puntos clave)</Label>
                                    <Textarea
                                        placeholder="Ej: Sabe leer bien, participa mucho, le gustan las mates..."
                                        value={magicLogros}
                                        onChange={(e) => setMagicLogros(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Notas sobre Dificultades</Label>
                                    <Textarea
                                        placeholder="Ej: Se distrae fácil, platica mucho, le cuesta restar..."
                                        value={magicDificultades}
                                        onChange={(e) => setMagicDificultades(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Notas para Recomendaciones</Label>
                                    <Textarea
                                        placeholder="Ej: Que lea en casa, practicar tablas, sentarlo adelante..."
                                        value={magicRecomendaciones}
                                        onChange={(e) => setMagicRecomendaciones(e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <Button
                                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                                    onClick={handleGenerateAI}
                                    disabled={generating || (!isPro && usageCount >= limit && limit !== -1)}
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Redactando con IA...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="mr-2 h-4 w-4" />
                                            {(!isPro && usageCount >= limit && limit !== -1) ? "Límite Alcanzado (Mejorar a Pro)" : "Generar Redacción Formal"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="manual" className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Logros</Label>
                                <CardDescription className="mb-2">Fortalezas académicas y socioemocionales.</CardDescription>
                                <Textarea
                                    className="min-h-[120px] font-medium"
                                    value={logros}
                                    onChange={(e) => setLogros(e.target.value)}
                                />
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Dificultades</Label>
                                <CardDescription className="mb-2">Áreas de oportunidad y barreras de aprendizaje.</CardDescription>
                                <Textarea
                                    className="min-h-[120px] font-medium"
                                    value={dificultades}
                                    onChange={(e) => setDificultades(e.target.value)}
                                />
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Recomendaciones</Label>
                                <CardDescription className="mb-2">Sugerencias para la intervención docente y familiar.</CardDescription>
                                <Textarea
                                    className="min-h-[120px] font-medium"
                                    value={recomendaciones}
                                    onChange={(e) => setRecomendaciones(e.target.value)}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
