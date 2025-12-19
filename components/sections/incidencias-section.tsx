"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { IncidenciaWizard } from "./incidencia-wizard"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, FileWarning, Plus, Search, Printer, Pencil, Save, X, Upload, CheckCircle, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

interface IncidenciasSectionProps {
    plantelId: string
    autoStart?: boolean
    onAutoStartResult?: () => void
}

interface Incidencia {
    id: string
    created_at: string
    tipo: string
    nivel_riesgo: string
    estado: string
    descripcion_hechos?: string
    acta_hechos_content?: string
    acta_firmada_url?: string
    protocolo_check?: any
    alumno: {
        nombre_completo: string
        grupo: {
            grado: string
            nombre: string
        }
    }
}

export function IncidenciasSection({ plantelId, autoStart = false, onAutoStartResult }: IncidenciasSectionProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [incidencias, setIncidencias] = useState<Incidencia[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedIncident, setSelectedIncident] = useState<Incidencia | null>(null)
    const [isEditingActa, setIsEditingActa] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const { toast } = useToast()

    // Efecto para auto-iniciar si viene desde el botón de pánico
    useEffect(() => {
        if (autoStart && !isCreating) {
            setIsCreating(true)
            if (onAutoStartResult) onAutoStartResult()
        }
    }, [autoStart, isCreating, onAutoStartResult])

    useEffect(() => {
        if (plantelId && !isCreating) {
            fetchIncidencias()
        }
    }, [plantelId, isCreating])

    const handleSaveActa = async () => {
        if (!selectedIncident) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('incidencias')
                .update({ acta_hechos_content: selectedIncident.acta_hechos_content })
                .eq('id', selectedIncident.id)

            if (error) throw error

            toast({
                title: "Acta actualizada",
                description: "Los cambios en el texto del acta se han guardado correctamente.",
            })
            setIsEditingActa(false)
            fetchIncidencias() // Refrezcar lista por si acaso
        } catch (error) {
            console.error('Error saving acta:', error)
            toast({
                variant: "destructive",
                title: "Error al guardar",
                description: "No se pudieron guardar los cambios en el acta.",
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchIncidencias = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('incidencias')
                .select(`
                    id, created_at, tipo, nivel_riesgo, estado, 
                    descripcion_hechos, acta_hechos_content, acta_firmada_url, protocolo_check,
                    alumno:alumnos!inner(nombre_completo, grupo:grupos(grado, nombre))
                `)
                .eq('plantel_id', plantelId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setIncidencias(data as any)
        } catch (error) {
            console.error('Error fetching incidencias:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredIncidencias = incidencias.filter(inc =>
        inc.alumno.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.tipo.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handlePrint = async () => {
        if (!selectedIncident) return

        // Generate suggested filename
        const folio = selectedIncident.id.slice(0, 8).toUpperCase()
        const alumnoName = selectedIncident.alumno.nombre_completo.replace(/\s+/g, '_')
        const fecha = format(new Date(selectedIncident.created_at), 'yyyy-MM-dd')
        const suggestedFilename = `Acta_${folio}_${alumnoName}_${fecha}`

        const windowPrint = window.open('', '', 'width=900,height=650')
        if (windowPrint) {
            windowPrint.document.write(`
                <html>
                <head>
                    <title>${suggestedFilename}</title>
                    <style>
                        body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; color: #000; }
                        h1 { text-align: center; margin-bottom: 20px; font-size: 18px; text-transform: uppercase; }
                        .meta { margin-bottom: 30px; font-size: 0.9em; border-bottom: 1px solid #000; padding-bottom: 10px; }
                        .content { white-space: pre-wrap; text-align: justify; margin-bottom: 50px; }
                        .signatures { margin-top: 100px; display: flex; justify-content: space-between; page-break-inside: avoid; }
                        .sig-block { border-top: 1px solid #000; padding-top: 10px; width: 40%; text-align: center; font-size: 0.9em; }
                    </style>
                </head>
                <body>
                    <h1>Acta Circunstanciada de Hechos</h1>
                    <div class="meta">
                        <strong>Folio:</strong> ${selectedIncident.id.slice(0, 8).toUpperCase()}<br/>
                        <strong>Fecha del Reporte:</strong> ${format(new Date(selectedIncident.created_at), "PPP p", { locale: es })}<br/>
                        <strong>Asunto:</strong> ${selectedIncident.tipo.replace(/_/g, ' ').toUpperCase()}<br/>
                        <strong>Alumno:</strong> ${selectedIncident.alumno.nombre_completo}
                    </div>
                    <div class="content">
                        ${selectedIncident.acta_hechos_content || selectedIncident.descripcion_hechos}
                    </div>
                    <div class="signatures">
                         <div class="sig-block">
                            Firma del Director(a)<br/>
                            Responsable del Plantel
                         </div>
                         <div class="sig-block">
                            Firma del Padre, Madre o Tutor<br/>
                            Enterado del Hecho
                         </div>
                    </div>
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
                </html>
            `)
            windowPrint.document.close()

            // Update status to 'abierta' after printing (only if currently 'generado')
            if (selectedIncident.estado === 'generado') {
                try {
                    const { error } = await supabase
                        .from('incidencias')
                        .update({ estado: 'abierta' })
                        .eq('id', selectedIncident.id)

                    if (error) {
                        console.error('Supabase error details:', {
                            message: error.message,
                            details: error.details,
                            hint: error.hint,
                            code: error.code
                        })
                        throw error
                    }

                    toast({
                        title: "Estado actualizado",
                        description: "La incidencia ahora está en estado ABIERTA",
                    })
                    fetchIncidencias() // Refresh to show new status
                } catch (error) {
                    console.error('Error updating status:', error)
                    toast({
                        variant: "destructive",
                        title: "Error al actualizar estado",
                        description: error instanceof Error ? error.message : "No se pudo cambiar el estado",
                    })
                }
            }
        }
    }

    const handleUploadPDF = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file || !selectedIncident) return

        // Validate file type
        if (file.type !== 'application/pdf') {
            toast({
                variant: "destructive",
                title: "Archivo inválido",
                description: "Solo se permiten archivos PDF",
            })
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast({
                variant: "destructive",
                title: "Archivo muy grande",
                description: "El archivo no debe superar 10MB",
            })
            return
        }

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('incidentId', selectedIncident.id)
            formData.append('plantelId', plantelId)

            const response = await fetch('/api/incidencias/upload-signed', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Error al subir archivo')
            }

            const data = await response.json()

            toast({
                title: "✅ Acta firmada subida",
                description: "El documento se ha guardado correctamente",
            })

            // Update local state
            setSelectedIncident(prev => prev ? ({
                ...prev,
                estado: 'firmado',
                acta_firmada_url: data.url
            }) : null)

            fetchIncidencias() // Refresh list
        } catch (error) {
            console.error('Error uploading PDF:', error)
            toast({
                variant: "destructive",
                title: "Error al subir",
                description: error instanceof Error ? error.message : "No se pudo subir el archivo",
            })
        } finally {
            setIsUploading(false)
            // Reset file input
            event.target.value = ''
        }
    }

    const handleCloseCase = async () => {
        if (!selectedIncident) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('incidencias')
                .update({ estado: 'cerrado' })
                .eq('id', selectedIncident.id)

            if (error) throw error

            toast({
                title: "Caso cerrado",
                description: "La incidencia ha sido marcada como cerrada",
            })

            setSelectedIncident(prev => prev ? ({ ...prev, estado: 'cerrado' }) : null)
            fetchIncidencias()
        } catch (error) {
            console.error('Error closing case:', error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo cerrar el caso",
            })
        } finally {
            setLoading(false)
        }
    }

    if (isCreating) {
        return (
            <div className="py-6">
                <IncidenciaWizard
                    plantelId={plantelId}
                    onCancel={() => setIsCreating(false)}
                    onComplete={() => {
                        setIsCreating(false)
                        fetchIncidencias()
                    }}
                />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Reportes de Incidencias</h2>
                    <p className="text-muted-foreground">
                        Gestión y seguimiento de protocolos de seguridad escolar
                    </p>
                </div>
                <Button onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Reporte
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por alumno o tipo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <Dialog open={!!selectedIncident} onOpenChange={(open) => !open && setSelectedIncident(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileWarning className="h-5 w-5 text-yellow-600" />
                            Expediente de Incidencia
                            <Badge variant="outline" className="capitalize">{selectedIncident?.tipo.replace(/_/g, ' ')}</Badge>
                        </DialogTitle>
                        <DialogDescription>
                            Folio: {selectedIncident?.id.slice(0, 8).toUpperCase()} • {selectedIncident && format(new Date(selectedIncident.created_at), "PPP p", { locale: es })}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-6 p-1">
                        {/* Columna Izquierda: Detalles */}
                        <div className="space-y-6 md:col-span-1 border-r pr-4 overflow-y-auto">
                            <div className="space-y-1">
                                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Alumno</h4>
                                <p className="font-medium text-lg">{selectedIncident?.alumno.nombre_completo}</p>
                                <p className="text-sm text-muted-foreground">{selectedIncident?.alumno.grupo?.grado}° {selectedIncident?.alumno.grupo?.nombre}</p>
                            </div>

                            <div className="space-y-1">
                                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Clasificación</h4>
                                <div className="flex flex-col gap-2 items-start mt-1">
                                    <Badge className={selectedIncident?.nivel_riesgo === 'alto' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}>
                                        Riesgo {selectedIncident?.nivel_riesgo?.toUpperCase()}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className={
                                            selectedIncident?.estado === 'generado' ? 'border-blue-500 text-blue-700 bg-blue-50' :
                                                selectedIncident?.estado === 'abierta' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                                                    selectedIncident?.estado === 'firmado' ? 'border-green-500 text-green-700 bg-green-50' :
                                                        selectedIncident?.estado === 'cerrado' ? 'border-gray-500 text-gray-700 bg-gray-50' : ''
                                        }
                                    >
                                        {selectedIncident?.estado?.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>

                            {selectedIncident?.protocolo_check && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Acciones Urgentes</h4>
                                    <ul className="text-sm space-y-1 list-disc pl-4 text-muted-foreground">
                                        {selectedIncident.protocolo_check.acciones?.map((accion: string, i: number) => (
                                            <li key={i}>{accion}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Columna Derecha: Acta Editable */}
                        <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Printer className="h-4 w-4" />
                                    Acta de Hechos
                                </h3>
                                <div className="flex gap-2">
                                    {isEditingActa ? (
                                        <>
                                            <Button size="sm" variant="ghost" onClick={() => setIsEditingActa(false)}>
                                                <X className="h-4 w-4 mr-2" />
                                                Cancelar
                                            </Button>
                                            <Button size="sm" onClick={handleSaveActa} disabled={loading}>
                                                <Save className="h-4 w-4 mr-2" />
                                                Guardar Cambios
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button size="sm" variant="outline" onClick={() => setIsEditingActa(true)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Editar
                                            </Button>
                                            <Button size="sm" onClick={handlePrint}>
                                                Imprimir Oficial
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <ScrollArea className="flex-1 border rounded-md bg-muted/30 p-0 h-[400px]" id="acta-print-area">
                                {isEditingActa ? (
                                    <Textarea
                                        className="min-h-[400px] w-full border-0 focus-visible:ring-0 p-4 font-serif text-sm leading-relaxed resize-none bg-white"
                                        value={selectedIncident?.acta_hechos_content || ""}
                                        onChange={(e) => setSelectedIncident(prev => prev ? ({ ...prev, acta_hechos_content: e.target.value }) : null)}
                                    />
                                ) : (
                                    <div className="whitespace-pre-wrap text-sm font-serif leading-relaxed text-foreground/90 p-6">
                                        {selectedIncident?.acta_hechos_content || selectedIncident?.descripcion_hechos || "Contenido no disponible."}
                                    </div>
                                )}
                            </ScrollArea>
                            {isEditingActa && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    💡 Edita el texto para corregir nombres o detalles antes de imprimir. Recuerda guardar.
                                </p>
                            )}

                            {/* Upload PDF Section - Show when estado is 'abierta' */}
                            {selectedIncident?.estado === 'abierta' && !isEditingActa && (
                                <div className="mt-4 p-4 border border-dashed border-yellow-300 bg-yellow-50 rounded-md">
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <Upload className="h-4 w-4" />
                                        Subir Acta Firmada
                                    </h4>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Una vez firmada el acta física, escanéala y súbela aquí como PDF.
                                    </p>
                                    <label htmlFor="pdf-upload" className="cursor-pointer">
                                        <Button size="sm" asChild disabled={isUploading}>
                                            <span>
                                                {isUploading ? (
                                                    <><Save className="h-4 w-4 mr-2 animate-spin" /> Subiendo...</>
                                                ) : (
                                                    <><Upload className="h-4 w-4 mr-2" /> Seleccionar PDF</>
                                                )}
                                            </span>
                                        </Button>
                                    </label>
                                    <input
                                        id="pdf-upload"
                                        type="file"
                                        accept="application/pdf"
                                        className="hidden"
                                        onChange={handleUploadPDF}
                                        disabled={isUploading}
                                    />
                                </div>
                            )}

                            {/* Show signed PDF download - When estado is 'firmado' or 'cerrado' */}
                            {(selectedIncident?.estado === 'firmado' || selectedIncident?.estado === 'cerrado') && selectedIncident?.acta_firmada_url && !isEditingActa && (
                                <div className="mt-4 p-4 border border-green-300 bg-green-50 rounded-md">
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        Acta Firmada Disponible
                                    </h4>
                                    <Button size="sm" variant="outline" asChild>
                                        <a href={selectedIncident.acta_firmada_url} download target="_blank" rel="noopener noreferrer">
                                            <Download className="h-4 w-4 mr-2" />
                                            Descargar PDF Firmado
                                        </a>
                                    </Button>
                                </div>
                            )}

                            {/* Close Case Button - Show when estado is 'firmado' */}
                            {selectedIncident?.estado === 'firmado' && !isEditingActa && (
                                <div className="mt-4">
                                    <Button
                                        onClick={handleCloseCase}
                                        disabled={loading}
                                        className="w-full"
                                        variant="default"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Cerrar Caso
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2 text-center">
                                        Al cerrar el caso, se marcará como concluido y archivado
                                    </p>
                                </div>
                            )}

                            {/* Closed Case Indicator */}
                            {selectedIncident?.estado === 'cerrado' && !isEditingActa && (
                                <div className="mt-4 p-4 border border-gray-300 bg-gray-50 rounded-md text-center">
                                    <CheckCircle className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                                    <p className="font-semibold text-sm text-gray-700">Caso Cerrado</p>
                                    <p className="text-xs text-muted-foreground">
                                        Este caso ha sido concluido y archivado
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {loading ? (
                <div className="text-center py-10 text-muted-foreground">Cargando reportes...</div>
            ) : filteredIncidencias.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No hay incidencias registradas</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredIncidencias.map((incidencia) => (
                        <Card
                            key={incidencia.id}
                            className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50 group"
                            onClick={() => setSelectedIncident(incidencia)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant={incidencia.estado === 'abierta' || incidencia.estado === 'generado' ? 'default' : 'secondary'}>
                                        {incidencia.estado.toUpperCase()}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                        {format(new Date(incidencia.created_at), "d MMM", { locale: es })}
                                    </span>
                                </div>
                                <CardTitle className="text-base mt-2 capitalize">{incidencia.tipo.replace(/_/g, ' ')}</CardTitle>
                                <CardDescription>
                                    <span className="font-medium text-foreground">{incidencia.alumno.nombre_completo}</span>
                                    <br />
                                    <span>
                                        {incidencia.alumno.grupo?.grado}° {incidencia.alumno.grupo?.nombre}
                                    </span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <AlertCircle className={`h-4 w-4 ${incidencia.nivel_riesgo === 'alto' ? 'text-red-500' : 'text-yellow-500'}`} />
                                    <span className="capitalize font-medium">Riesgo {incidencia.nivel_riesgo}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
