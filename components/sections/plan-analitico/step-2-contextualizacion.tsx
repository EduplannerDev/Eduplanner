"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { AlertCircle, Plus, Trash2, ArrowRight, ArrowLeft, Target, BookOpen } from 'lucide-react'
import { PlanAnaliticoFormData, Problematica } from '@/types/plan-analitico'
import { Badge } from '@/components/ui/badge'
import { ProyectoWizardStep2 } from '@/components/sections/proyecto-wizard-step2'

interface Step2ContextualizacionProps {
    data: PlanAnaliticoFormData
    onDataChange: (data: Partial<PlanAnaliticoFormData>) => void
    onNext: () => void
    onPrevious: () => void
    loading: boolean
}

export function Step2Contextualizacion({ data, onDataChange, onNext, onPrevious, loading }: Step2ContextualizacionProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Estado temporal para el modal
    const [tempTitulo, setTempTitulo] = useState('')
    const [tempDescripcion, setTempDescripcion] = useState('')
    const [tempPdas, setTempPdas] = useState<string[]>([])
    const [debouncedTitulo, setDebouncedTitulo] = useState('')

    // Debounce del título para evitar llamadas excesivas a la API
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTitulo(tempTitulo)
        }, 800)

        return () => clearTimeout(timer)
    }, [tempTitulo])

    const resetModal = () => {
        setTempTitulo('')
        setTempDescripcion('')
        setTempPdas([])
        setEditingId(null)
    }

    const handleOpenModal = (problematica?: Problematica) => {
        if (problematica) {
            setEditingId(problematica.id)
            setTempTitulo(problematica.titulo)
            setTempDescripcion(problematica.descripcion)
            setTempPdas(problematica.pdas_seleccionados)
        } else {
            resetModal()
        }
        setIsModalOpen(true)
    }

    const handleSaveProblematica = () => {
        if (!tempTitulo || tempPdas.length === 0) return

        const newProblematica: Problematica = {
            id: editingId || crypto.randomUUID(),
            titulo: tempTitulo,
            descripcion: tempDescripcion,
            pdas_seleccionados: tempPdas
        }

        let updatedProblematicas = [...data.problematicas]

        if (editingId) {
            updatedProblematicas = updatedProblematicas.map(p => p.id === editingId ? newProblematica : p)
        } else {
            updatedProblematicas.push(newProblematica)
        }

        onDataChange({ problematicas: updatedProblematicas })
        setIsModalOpen(false)
        resetModal()
    }

    const handleDeleteProblematica = (id: string) => {
        const updated = data.problematicas.filter(p => p.id !== id)
        onDataChange({ problematicas: updated })
    }

    // Reutilizamos el componente de selección de PDAs pero "mockeamos" la navegación
    // ya que ProyectoWizardStep2 espera onNext/onPrevious
    const handlePdaSelectorNext = () => { }
    const handlePdaSelectorPrev = () => { }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Contextualización
                </h2>
                <p className="text-sm text-gray-500">
                    Identifica las problemáticas de tu grupo y vincúlalas con los PDAs del currículo.
                </p>
            </div>

            {/* Lista de Problemáticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.problematicas.map((prob) => (
                    <Card key={prob.id} className="relative group hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-bold leading-tight">{prob.titulo}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{prob.descripcion}</p>
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                    {prob.pdas_seleccionados.length} PDAs vinculados
                                </Badge>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(prob)}>
                                        Editar
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteProblematica(prob.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Botón Agregar */}
                <Button
                    variant="outline"
                    className="h-auto min-h-[150px] border-dashed border-2 flex flex-col gap-2 hover:border-blue-500 hover:bg-blue-50"
                    onClick={() => handleOpenModal()}
                >
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Plus className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="font-medium text-blue-700">Agregar Problemática</span>
                </Button>
            </div>

            {/* Modal de Edición/Creación */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Problemática' : 'Nueva Problemática'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4 flex-1">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Título de la Problemática *</Label>
                                <Input
                                    placeholder="Ej. Baja comprensión lectora"
                                    value={tempTitulo}
                                    onChange={(e) => setTempTitulo(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción (Opcional)</Label>
                                <Textarea
                                    placeholder="Detalles sobre esta problemática..."
                                    value={tempDescripcion}
                                    onChange={(e) => setTempDescripcion(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <Label className="mb-4 block text-lg font-semibold">Seleccionar PDAs para esta problemática</Label>
                            {/* Reutilizamos el componente existente */}
                            <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px]">
                                {tempTitulo ? (
                                    <ProyectoWizardStep2
                                        grupoId={data.grupo_id}
                                        problematica={debouncedTitulo} // Usamos el título debounced para la IA
                                        selectedPdas={tempPdas}
                                        onPdasChange={setTempPdas}
                                        onNext={handlePdaSelectorNext}
                                        onPrevious={handlePdaSelectorPrev}
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
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveProblematica} disabled={!tempTitulo || tempPdas.length === 0}>
                            Guardar Problemática
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Navegación */}
            <div className="flex justify-between pt-6 border-t">
                <Button variant="outline" onClick={onPrevious}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Anterior
                </Button>
                <Button onClick={onNext} disabled={data.problematicas.length === 0 || loading}>
                    Siguiente Paso
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
