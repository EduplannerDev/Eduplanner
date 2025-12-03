"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BookOpen, Target, Users, Calendar, Download, Loader2, Pencil, Save, X, Trash2, Sparkles, Plus } from 'lucide-react'
import { usePlanAnalitico } from '@/hooks/use-plan-analitico'
import { Textarea } from '@/components/ui/textarea'
import { TagInput } from '@/components/ui/tag-input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ProyectoWizardStep2 } from '@/components/sections/proyecto-wizard-step2'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

interface VerPlanAnaliticoProps {
    planId: string
    onBack: () => void
}

export function VerPlanAnalitico({ planId, onBack }: VerPlanAnaliticoProps) {
    const { obtenerDetallePlanAnalitico, actualizarDiagnostico, eliminarProblematica, agregarProblematica, loading } = usePlanAnalitico()
    const { toast } = useToast()
    const [plan, setPlan] = useState<any>(null)
    const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false)
    const [editData, setEditData] = useState({
        input_comunitario: '',
        input_escolar: '',
        input_grupo: '',
        diagnostico_generado: ''
    })

    const [generatingAI, setGeneratingAI] = useState(false)

    // Estado para nueva problemática
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [newProbTitulo, setNewProbTitulo] = useState('')
    const [newProbDescripcion, setNewProbDescripcion] = useState('')
    const [newProbPdas, setNewProbPdas] = useState<string[]>([])
    const [debouncedTitulo, setDebouncedTitulo] = useState('')

    useEffect(() => {
        loadPlan()
    }, [planId])

    // Debounce del título para nueva problemática
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTitulo(newProbTitulo)
        }, 800)
        return () => clearTimeout(timer)
    }, [newProbTitulo])

    const loadPlan = async () => {
        const data = await obtenerDetallePlanAnalitico(planId)
        if (data) {
            setPlan(data)
            setEditData({
                input_comunitario: data.input_comunitario || '',
                input_escolar: data.input_escolar || '',
                input_grupo: data.input_grupo || '',
                diagnostico_generado: data.diagnostico_generado || ''
            })
        }
    }

    const handleRegenerateAI = async () => {
        if (!editData.input_comunitario || !editData.input_escolar || !editData.input_grupo) {
            toast({
                title: "Faltan datos",
                description: "Por favor completa los campos de contexto antes de regenerar.",
                variant: "destructive"
            })
            return
        }

        setGeneratingAI(true)
        try {
            const response = await fetch('/api/plan-analitico/generate-diagnostico', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comunitario: editData.input_comunitario,
                    escolar: editData.input_escolar,
                    grupo: editData.input_grupo,
                    grado: plan.grupos?.grado || ''
                })
            })

            if (!response.ok) throw new Error('Error en la generación de IA')

            const result = await response.json()
            setEditData(prev => ({ ...prev, diagnostico_generado: result.diagnostico }))
            toast({
                title: "Diagnóstico regenerado",
                description: "Se ha generado una nueva propuesta de diagnóstico.",
            })
        } catch (err) {
            console.error('Error regenerando diagnóstico:', err)
            toast({
                title: "Error",
                description: "Hubo un error al generar el diagnóstico.",
                variant: "destructive"
            })
        } finally {
            setGeneratingAI(false)
        }
    }

    const handleSaveDiagnosis = async () => {
        const success = await actualizarDiagnostico(planId, editData)
        if (success) {
            toast({
                title: "Diagnóstico actualizado",
                description: "Los cambios se han guardado correctamente.",
            })
            setIsEditingDiagnosis(false)
            loadPlan() // Recargar datos
        } else {
            toast({
                title: "Error",
                description: "No se pudo actualizar el diagnóstico.",
                variant: "destructive"
            })
        }
    }

    const handleDeleteProblematica = async (probId: string) => {
        const success = await eliminarProblematica(probId)
        if (success) {
            toast({
                title: "Problemática eliminada",
                description: "La problemática se ha eliminado correctamente.",
            })
            loadPlan() // Recargar datos
        } else {
            toast({
                title: "Error",
                description: "No se pudo eliminar la problemática.",
                variant: "destructive"
            })
        }
    }

    const handleSaveNewProblematica = async () => {
        if (!newProbTitulo || newProbPdas.length === 0) return

        const success = await agregarProblematica(planId, newProbTitulo, newProbDescripcion, newProbPdas)

        if (success) {
            toast({
                title: "Problemática agregada",
                description: "La nueva problemática se ha guardado correctamente.",
            })
            setIsAddModalOpen(false)
            setNewProbTitulo('')
            setNewProbDescripcion('')
            setNewProbPdas([])
            loadPlan()
        } else {
            toast({
                title: "Error",
                description: "No se pudo agregar la problemática.",
                variant: "destructive"
            })
        }
    }

    if (loading && !plan) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!plan) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">No se encontró el plan analítico.</p>
                <Button onClick={onBack} variant="outline" className="mt-4">
                    Volver
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Plan Analítico - {plan.grupos?.nombre}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {plan.grupos?.grado}° {plan.grupos?.nivel}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(plan.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
                {/* <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar PDF
                </Button> */}
            </div>

            {/* Diagnóstico */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        Diagnóstico Socioeducativo
                    </CardTitle>
                    {!isEditingDiagnosis ? (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingDiagnosis(true)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditingDiagnosis(false)}>
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button size="sm" onClick={handleSaveDiagnosis}>
                                <Save className="h-4 w-4 mr-2" />
                                Guardar
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {isEditingDiagnosis ? (
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Contexto Comunitario</Label>
                                    <TagInput
                                        placeholder="Agregar..."
                                        tags={editData.input_comunitario ? editData.input_comunitario.split(',').map(s => s.trim()).filter(Boolean) : []}
                                        setTags={(tags) => setEditData({ ...editData, input_comunitario: tags.join(', ') })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contexto Escolar</Label>
                                    <TagInput
                                        placeholder="Agregar..."
                                        tags={editData.input_escolar ? editData.input_escolar.split(',').map(s => s.trim()).filter(Boolean) : []}
                                        setTags={(tags) => setEditData({ ...editData, input_escolar: tags.join(', ') })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contexto Grupo</Label>
                                    <TagInput
                                        placeholder="Agregar..."
                                        tags={editData.input_grupo ? editData.input_grupo.split(',').map(s => s.trim()).filter(Boolean) : []}
                                        setTags={(tags) => setEditData({ ...editData, input_grupo: tags.join(', ') })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Redacción del Diagnóstico</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRegenerateAI}
                                        disabled={generatingAI}
                                        className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
                                    >
                                        {generatingAI ? (
                                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-3 w-3 mr-2" />
                                        )}
                                        {generatingAI ? "Generando..." : "Regenerar con IA"}
                                    </Button>
                                </div>
                                <Textarea
                                    key={editData.diagnostico_generado} // Force re-render for animation
                                    value={editData.diagnostico_generado}
                                    onChange={(e) => setEditData({ ...editData, diagnostico_generado: e.target.value })}
                                    className="min-h-[200px] animate-in fade-in duration-700 bg-purple-50/30"
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2 text-sm text-gray-500 uppercase">Comunitario</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {plan.input_comunitario?.split(',').map((tag: string, i: number) => (
                                            <Badge key={i} variant="secondary">{tag.trim()}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2 text-sm text-gray-500 uppercase">Escolar</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {plan.input_escolar?.split(',').map((tag: string, i: number) => (
                                            <Badge key={i} variant="secondary">{tag.trim()}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2 text-sm text-gray-500 uppercase">Grupo</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {plan.input_grupo?.split(',').map((tag: string, i: number) => (
                                            <Badge key={i} variant="secondary">{tag.trim()}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-100 dark:border-blue-800">
                                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                                    Redacción del Diagnóstico
                                </h3>
                                <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                                    {plan.diagnostico_generado}
                                </p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Contextualización y Problemáticas */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Contextualización y Problemáticas
                    </h2>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Problemática
                    </Button>
                </div>

                <Accordion type="single" collapsible className="w-full space-y-4">
                    {plan.problematicas?.map((prob: any, index: number) => (
                        <AccordionItem key={prob.id} value={prob.id} className="border rounded-lg bg-white dark:bg-gray-950 px-4">
                            <div className="flex items-center justify-between py-4">
                                <AccordionTrigger className="hover:no-underline py-0 flex-1">
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-bold text-lg">
                                            {index + 1}. {prob.titulo}
                                        </span>
                                        {prob.descripcion && (
                                            <span className="text-sm text-gray-500 font-normal mt-1 line-clamp-1">
                                                {prob.descripcion}
                                            </span>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Eliminar problemática?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción eliminará la problemática y su vinculación con los PDAs.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteProblematica(prob.id)
                                                }}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                Eliminar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                            <AccordionContent className="pt-2 pb-4 border-t">
                                {prob.descripcion && (
                                    <div className="mb-4 text-gray-600 dark:text-gray-400">
                                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">Descripción detallada:</p>
                                        {prob.descripcion}
                                    </div>
                                )}

                                <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase">
                                    Contenidos y PDAs Vinculados
                                </h4>
                                <div className="space-y-3">
                                    {prob.pdas?.map((pda: any) => (
                                        <div key={pda.id} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded border-l-4 border-blue-500">
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                                        {pda.contenido}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        PDA: {pda.pda}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="shrink-0">
                                                    {pda.campo_formativo}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>

            {/* Modal Agregar Problemática */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Nueva Problemática</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4 flex-1">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Título de la Problemática *</Label>
                                <Input
                                    placeholder="Ej. Baja comprensión lectora"
                                    value={newProbTitulo}
                                    onChange={(e) => setNewProbTitulo(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción (Opcional)</Label>
                                <Textarea
                                    placeholder="Detalles sobre esta problemática..."
                                    value={newProbDescripcion}
                                    onChange={(e) => setNewProbDescripcion(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <Label className="mb-4 block text-lg font-semibold">Seleccionar PDAs para esta problemática</Label>
                            <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px]">
                                {newProbTitulo ? (
                                    <ProyectoWizardStep2
                                        grupoId={plan?.grupo_id}
                                        problematica={debouncedTitulo}
                                        selectedPdas={newProbPdas}
                                        onPdasChange={setNewProbPdas}
                                        onNext={() => { }} // No needed here
                                        onPrevious={() => { }} // No needed here
                                        loading={false}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        <p>Escribe un título para buscar PDAs relacionados</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveNewProblematica} disabled={!newProbTitulo || newProbPdas.length === 0}>
                            Guardar Problemática
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
