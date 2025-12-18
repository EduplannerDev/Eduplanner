"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, Clock, User, ArrowLeft, ArrowLeftRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import * as Diff from "diff"

interface PlanningVersionHistoryProps {
    planeacionId: string
    currentTitle: string
}

interface Version {
    id: string
    version_number: number
    titulo: string
    contenido: string
    created_at: string
    motivo: string
    created_by: string
}

export function PlanningVersionHistory({ planeacionId, currentTitle }: PlanningVersionHistoryProps) {
    const [open, setOpen] = useState(false)
    const [versions, setVersions] = useState<Version[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)

    useEffect(() => {
        if (open && planeacionId) {
            loadVersions()
        }
    }, [open, planeacionId])

    const loadVersions = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('planeacion_versiones')
                .select('*')
                .eq('planeacion_id', planeacionId)
                .order('version_number', { ascending: false })

            if (error) throw error

            setVersions(data || [])
            // Seleccionar la última versión por defecto si hay datos
            if (data && data.length > 0 && !selectedVersion) {
                // No seleccionamos automáticamente para que el usuario elija, pero podríamos
            }
        } catch (error) {
            console.error('Error loading versions:', error)
        } finally {
            setLoading(false)
        }
    }

    const getMotivoLabel = (motivo: string) => {
        switch (motivo) {
            case 'envio_inicial': return 'Envío Inicial'
            case 'correccion': return 'Corrección'
            case 'edicion_manual': return 'Edición'
            default: return motivo
        }
    }

    // Función simple para limpiar HTML y comparar texto (MVP)
    const stripHtml = (html: string) => {
        const tmp = document.createElement("DIV")
        tmp.innerHTML = html
        return tmp.textContent || tmp.innerText || ""
    }

    const renderContent = useMemo(() => {
        if (!selectedVersion) return null

        // Encontrar versión anterior (la que tenga version_number inmediatamente menor o index+1)
        const currentIndex = versions.findIndex(v => v.id === selectedVersion.id)
        const previousVersion = versions[currentIndex + 1]

        // Si no hay versión anterior, mostrar el contenido original formateado
        if (!previousVersion) {
            return <div dangerouslySetInnerHTML={{ __html: selectedVersion.contenido || "" }} />
        }

        // Si hay versión anterior, mostrar el Diff
        const text1 = stripHtml(previousVersion.contenido || "")
        const text2 = stripHtml(selectedVersion.contenido || "")

        const diff = Diff.diffWords(text1, text2)

        return (
            <div className="whitespace-pre-wrap leading-relaxed bg-white dark:bg-slate-950 p-4 rounded-md shadow-sm border">
                {diff.map((part, index) => {
                    const color = part.added ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 font-medium' :
                        part.removed ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 line-through decoration-red-500/50' : ''
                    return (
                        <span key={index} className={`${color} px-0.5 rounded`}>
                            {part.value}
                        </span>
                    )
                })}
            </div>
        )
    }, [selectedVersion, versions])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <History className="h-4 w-4 mr-2" />
                    Historial de Cambios
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Historial de Versiones</DialogTitle>
                    <DialogDescription>
                        {currentTitle}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex gap-4 min-h-0 pt-4">
                    {/* Lista de Versiones (Sidebar) */}
                    <div className="w-1/3 border-r pr-4 flex flex-col gap-2 overflow-y-auto">
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Versiones Guardadas</h4>
                        {loading ? (
                            <div className="text-sm text-center py-4">Cargando...</div>
                        ) : versions.length === 0 ? (
                            <div className="text-sm text-center py-4 text-muted-foreground">
                                No hay historial disponible.
                            </div>
                        ) : (
                            versions.map((version) => (
                                <button
                                    key={version.id}
                                    onClick={() => setSelectedVersion(version)}
                                    className={`text-left p-3 rounded-lg border transition-all text-sm hover:bg-muted ${selectedVersion?.id === version.id
                                        ? 'bg-primary/10 border-primary ring-1 ring-primary'
                                        : 'bg-card'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold">Versión {version.version_number}</span>
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                            {getMotivoLabel(version.motivo)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(version.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Visor de Contenido (Main) */}
                    <div className="flex-1 flex flex-col min-h-0 bg-muted/20 rounded-lg border">
                        {selectedVersion ? (
                            <>
                                <div className="p-3 border-b bg-muted/40 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-medium text-sm">Contenido de la Versión {selectedVersion.version_number}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(selectedVersion.created_at), "PPP p", { locale: es })}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedVersion(null)}>
                                        Cerrar vista
                                    </Button>
                                </div>
                                <ScrollArea className="flex-1 p-4">
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <h2 className="text-xl font-bold mb-4">{selectedVersion.titulo}</h2>
                                        {renderContent}
                                    </div>
                                </ScrollArea>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                                <History className="h-12 w-12 mb-4 opacity-20" />
                                <p>Selecciona una versión de la lista para ver su contenido.</p>
                                <p className="text-xs mt-2">Puedes comparar los cambios realizados en cada entrega.</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
