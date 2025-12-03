"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Trash2, ArrowLeft, Save, Lightbulb } from 'lucide-react'
import { PlanAnaliticoFormData, NuevoPDA } from '@/types/plan-analitico'
import { Badge } from '@/components/ui/badge'

interface Step3CodisenoProps {
    data: PlanAnaliticoFormData
    onDataChange: (data: Partial<PlanAnaliticoFormData>) => void
    onPrevious: () => void
    onComplete: () => void
    loading: boolean
}

const CAMPOS_FORMATIVOS = [
    'Lenguajes',
    'Saberes y Pensamiento Científico',
    'Ética, Naturaleza y Sociedades',
    'De lo Humano y lo Comunitario'
]

export function Step3Codiseno({ data, onDataChange, onPrevious, onComplete, loading }: Step3CodisenoProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Estado temporal para el modal
    const [tempCampo, setTempCampo] = useState('')
    const [tempContenido, setTempContenido] = useState('')
    const [tempPDA, setTempPDA] = useState('')

    const resetModal = () => {
        setTempCampo('')
        setTempContenido('')
        setTempPDA('')
    }

    const handleSaveNuevoPDA = () => {
        if (!tempCampo || !tempContenido || !tempPDA) return

        const nuevo: NuevoPDA = {
            id: crypto.randomUUID(),
            campo_formativo: tempCampo,
            contenido: tempContenido,
            pda: tempPDA
        }

        onDataChange({ nuevos_pdas: [...data.nuevos_pdas, nuevo] })
        setIsModalOpen(false)
        resetModal()
    }

    const handleDeleteNuevoPDA = (id: string) => {
        const updated = data.nuevos_pdas.filter(p => p.id !== id)
        onDataChange({ nuevos_pdas: updated })
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    Codiseño (Contenidos Locales)
                </h2>
                <p className="text-sm text-gray-500">
                    Agrega contenidos o PDAs que no están en el programa sintético pero son necesarios para tu comunidad.
                </p>
            </div>

            {/* Lista de Nuevos PDAs */}
            <div className="space-y-4">
                {data.nuevos_pdas.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50">
                        <p className="text-gray-500 mb-4">No has agregado contenidos de codiseño.</p>
                        <Button onClick={() => setIsModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar Nuevo Contenido
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {data.nuevos_pdas.map((item) => (
                            <Card key={item.id}>
                                <CardContent className="p-4 flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <Badge variant="outline">{item.campo_formativo}</Badge>
                                        <h4 className="font-semibold text-lg">{item.contenido}</h4>
                                        <p className="text-gray-600">{item.pda}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                        onClick={() => handleDeleteNuevoPDA(item.id)}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}

                        <div className="flex justify-center pt-2">
                            <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar Otro Contenido
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Creación */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nuevo Contenido (Codiseño)</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Campo Formativo *</Label>
                            <Select value={tempCampo} onValueChange={setTempCampo}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un campo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CAMPOS_FORMATIVOS.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Contenido *</Label>
                            <Input
                                placeholder="Ej. Historia local del municipio..."
                                value={tempContenido}
                                onChange={(e) => setTempContenido(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>PDA (Proceso de Desarrollo de Aprendizaje) *</Label>
                            <Textarea
                                placeholder="Ej. Investiga y relata sucesos históricos de su comunidad..."
                                value={tempPDA}
                                onChange={(e) => setTempPDA(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveNuevoPDA} disabled={!tempCampo || !tempContenido || !tempPDA}>
                            Agregar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Navegación */}
            <div className="flex justify-between pt-6 border-t">
                <Button variant="outline" onClick={onPrevious} disabled={loading}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Anterior
                </Button>
                <Button onClick={onComplete} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                    {loading ? (
                        <>Guardando...</>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Finalizar Plan Analítico
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
