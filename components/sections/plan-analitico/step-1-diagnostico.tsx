"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Sparkles, ArrowRight, Users, BookOpen } from 'lucide-react'
import { PlanAnaliticoFormData } from '@/types/plan-analitico'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { TagInput } from '@/components/ui/tag-input'

interface Step1DiagnosticoProps {
    data: PlanAnaliticoFormData
    onDataChange: (data: Partial<PlanAnaliticoFormData>) => void
    onNext: () => void
    loading: boolean
    setLoading: (loading: boolean) => void
}

interface GrupoOption {
    id: string
    nombre: string
    grado: string
    nivel: string
}

export function Step1Diagnostico({ data, onDataChange, onNext, loading, setLoading }: Step1DiagnosticoProps) {
    const { user } = useAuth()
    const [grupos, setGrupos] = useState<GrupoOption[]>([])
    const [loadingGrupos, setLoadingGrupos] = useState(true)
    const [generatingAI, setGeneratingAI] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Cargar grupos
    useEffect(() => {
        async function loadGrupos() {
            if (!user?.id) return
            try {
                const { data: gruposData, error } = await supabase
                    .from('grupos')
                    .select('id, nombre, grado, nivel')
                    .eq('user_id', user.id)
                    .eq('activo', true)
                    .order('grado', { ascending: true })

                if (error) throw error
                setGrupos(gruposData || [])
            } catch (err) {
                console.error('Error cargando grupos:', err)
                setError('Error al cargar tus grupos. Intenta recargar la página.')
            } finally {
                setLoadingGrupos(false)
            }
        }
        loadGrupos()
    }, [user?.id])

    // Generar diagnóstico con IA
    const handleGenerateAI = async () => {
        if (!data.input_comunitario || !data.input_escolar || !data.input_grupo) {
            setError('Por favor completa los 3 campos de contexto antes de generar el diagnóstico.')
            return
        }

        setGeneratingAI(true)
        setError(null)

        try {
            const response = await fetch('/api/plan-analitico/generate-diagnostico', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comunitario: data.input_comunitario,
                    escolar: data.input_escolar,
                    grupo: data.input_grupo,
                    grado: grupos.find(g => g.id === data.grupo_id)?.grado || ''
                })
            })

            if (!response.ok) throw new Error('Error en la generación de IA')

            const result = await response.json()
            onDataChange({ diagnostico_generado: result.diagnostico })
        } catch (err) {
            console.error('Error generando diagnóstico:', err)
            setError('Hubo un error al generar el diagnóstico. Por favor intenta de nuevo.')
        } finally {
            setGeneratingAI(false)
        }
    }

    const isFormComplete = data.grupo_id && data.input_comunitario && data.input_escolar && data.input_grupo

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Lectura de la Realidad
                </h2>
                <p className="text-sm text-gray-500">
                    Describe el entorno de tu escuela y grupo para generar un diagnóstico preciso.
                </p>
            </div>

            <Card>
                <CardContent className="p-6 space-y-6">
                    {/* Selección de Grupo */}
                    <div className="space-y-2">
                        <Label>Grupo *</Label>
                        <Select
                            value={data.grupo_id}
                            onValueChange={(val) => onDataChange({ grupo_id: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={loadingGrupos ? "Cargando..." : "Selecciona un grupo"} />
                            </SelectTrigger>
                            <SelectContent>
                                {grupos.map((g) => (
                                    <SelectItem key={g.id} value={g.id}>
                                        {g.nombre} - {g.grado}° {g.nivel}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Inputs de Contexto */}
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Contexto Comunitario</Label>
                            <TagInput
                                placeholder="Ej. Zona urbana, tradiciones fuertes..."
                                tags={data.input_comunitario ? data.input_comunitario.split(',').map(s => s.trim()).filter(Boolean) : []}
                                setTags={(tags) => onDataChange({ input_comunitario: tags.join(', ') })}
                                className="min-h-[150px] items-start content-start"
                            />
                            <p className="text-xs text-gray-500">¿Cómo es la comunidad donde viven tus alumnos?</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Contexto Escolar</Label>
                            <TagInput
                                placeholder="Ej. Biblioteca amplia, falta de internet..."
                                tags={data.input_escolar ? data.input_escolar.split(',').map(s => s.trim()).filter(Boolean) : []}
                                setTags={(tags) => onDataChange({ input_escolar: tags.join(', ') })}
                                className="min-h-[150px] items-start content-start"
                            />
                            <p className="text-xs text-gray-500">¿Con qué recursos cuenta la escuela?</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Contexto del Grupo</Label>
                            <TagInput
                                placeholder="Ej. Estilos visuales, rezago en lectura..."
                                tags={data.input_grupo ? data.input_grupo.split(',').map(s => s.trim()).filter(Boolean) : []}
                                setTags={(tags) => onDataChange({ input_grupo: tags.join(', ') })}
                                className="min-h-[150px] items-start content-start"
                            />
                            <p className="text-xs text-gray-500">¿Cuáles son las características de tus alumnos?</p>
                        </div>
                    </div>

                    {/* Botón Mágico IA */}
                    <div className="flex justify-center pt-4">
                        <Button
                            onClick={handleGenerateAI}
                            disabled={generatingAI || !isFormComplete}
                            variant="secondary"
                            className="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 w-full md:w-auto"
                        >
                            {generatingAI ? (
                                <>Generando Diagnóstico...</>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generar Diagnóstico con IA
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Resultado del Diagnóstico */}
                    <div className="space-y-2">
                        <Label className="text-lg font-semibold text-purple-700 dark:text-purple-400 flex items-center justify-between">
                            <span>Diagnóstico Socioeducativo</span>
                            {!data.diagnostico_generado && (
                                <span className="text-xs font-normal text-gray-500">
                                    Genera con IA o escribe manualmente
                                </span>
                            )}
                        </Label>
                        <Textarea
                            placeholder="El diagnóstico aparecerá aquí después de generarlo con IA, o puedes escribirlo tú mismo..."
                            value={data.diagnostico_generado || ''}
                            onChange={(e) => onDataChange({ diagnostico_generado: e.target.value })}
                            className="min-h-[200px] font-medium leading-relaxed bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800"
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Navegación */}
            <div className="flex justify-end">
                <Button onClick={onNext} disabled={!isFormComplete || loading || !data.diagnostico_generado}>
                    Siguiente Paso
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
