"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Presentation, Loader2, Download, Trash2, Calendar, Eye, Edit } from "lucide-react"
import { useProfile } from "@/hooks/use-profile"
import { isUserPro } from "@/lib/subscription-utils"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useBetaTesterCheck } from "@/hooks/use-beta-features"
import { NuevaPresentacionWizard } from "@/components/sections/nueva-presentacion-wizard"
import { EditorPresentacion } from "@/components/sections/editor-presentacion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SlidePreview } from "@/components/ui/slide-preview"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PresentacionIA {
    id: string
    user_id: string
    titulo: string
    fuente_tipo: 'planeacion' | 'proyecto' | 'libre'
    fuente_id?: string
    diapositivas_json: any
    tema_visual: string
    created_at: string
    updated_at: string
}

interface PresentacionesIAProps {
    onNavigateToProfile?: () => void
}

export function PresentacionesIA({ onNavigateToProfile }: PresentacionesIAProps) {
    const { profile, loading: loadingProfile } = useProfile()
    const { toast } = useToast()
    const [presentaciones, setPresentaciones] = useState<PresentacionIA[]>([])
    const [loading, setLoading] = useState(true)
    const [showWizard, setShowWizard] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [presentationToDelete, setPresentationToDelete] = useState<string | null>(null)

    // Estado para vista rápida
    const [viewingPresentation, setViewingPresentation] = useState<PresentacionIA | null>(null)
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

    const { isBetaTester, loading: loadingBeta } = useBetaTesterCheck()

    useEffect(() => {
        if (profile?.id && !loadingProfile) {
            loadPresentaciones()
        }
    }, [profile?.id, loadingProfile])

    const loadPresentaciones = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('presentaciones_ia')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            setPresentaciones(data || [])
        } catch (error) {
            console.error('Error cargando presentaciones:', error)
            toast({
                title: "Error",
                description: "No se pudieron cargar las presentaciones",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            setDeletingId(id)
            const { error } = await supabase
                .from('presentaciones_ia')
                .delete()
                .eq('id', id)

            if (error) throw error

            setPresentaciones(prev => prev.filter(p => p.id !== id))
            toast({
                title: "Presentación eliminada",
                description: "La presentación se eliminó correctamente"
            })
        } catch (error) {
            console.error('Error eliminando presentación:', error)
            toast({
                title: "Error",
                description: "No se pudo eliminar la presentación",
                variant: "destructive"
            })
        } finally {
            setDeletingId(null)
        }
    }

    const handleDownload = async (presentacion: PresentacionIA) => {
        try {
            toast({
                title: "Generando presentación",
                description: "Por favor espera...",
            })

            const response = await fetch('/api/generate-pptx', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ presentationData: presentacion.diapositivas_json })
            })

            if (!response.ok) {
                throw new Error('Error al generar la presentación PowerPoint')
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${presentacion.titulo.replace(/[^a-zA-Z0-9]/g, '-')}.pptx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            toast({
                title: "¡Presentación generada!",
                description: "La presentación PowerPoint se ha descargado correctamente"
            })
        } catch (error) {
            console.error('Error generando PowerPoint:', error)
            toast({
                title: "Error",
                description: "Error al generar la presentación PowerPoint",
                variant: "destructive"
            })
        }
    }

    // Siempre mostrar loader primero si el wizard no está activo
    if (editingId) {
        return (
            <EditorPresentacion
                presentacionId={editingId}
                onBack={() => {
                    setEditingId(null)
                    loadPresentaciones()
                }}
            />
        )
    }

    if (showWizard) {
        return (
            <NuevaPresentacionWizard
                onClose={() => setShowWizard(false)}
                onComplete={() => {
                    setShowWizard(false)
                    loadPresentaciones()
                }}
            />
        )
    }

    // Mostrar loader mientras se verifica el perfil o estado beta
    if (loadingProfile || loadingBeta) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    // Restricción para usuarios NO PRO
    if (!profile || !isUserPro(profile)) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Presentaciones IA</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Crea presentaciones profesionales con inteligencia artificial</p>
                </div>

                <Card className="border-2 border-purple-200 dark:border-purple-800">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
                            <Presentation className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <CardTitle className="text-2xl">Funcionalidad PRO</CardTitle>
                        <CardDescription className="text-base">
                            El generador de presentaciones con IA está disponible exclusivamente para usuarios PRO
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2 max-w-md mx-auto">
                            <h4 className="font-semibold flex items-center gap-2 justify-center">
                                <span className="text-purple-600">✨</span>
                                ¿Qué incluye Presentaciones IA?
                            </h4>
                            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400 pt-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>Generación automática de diapositivas con IA</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>Múltiples temas visuales profesionales</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>Edición avanzada de contenido y diseño</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>Exportación a PowerPoint (.pptx) editable</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>Creación desde planeaciones o proyectos</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex justify-center pt-2">
                            <Button
                                onClick={() => onNavigateToProfile ? onNavigateToProfile() : window.open('/pricing', '_blank')}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                            >
                                Actualizar a PRO
                            </Button>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-center text-blue-800 dark:text-blue-200 max-w-2xl mx-auto">
                            Ahorra horas de diseño y contenido. Crea presentaciones impactantes en segundos con nuestra IA educativa.
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Mostrar loader mientras carga presentaciones (para usuarios PRO)
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Presentation className="h-8 w-8 text-purple-600" />
                        Presentaciones IA
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Crea presentaciones profesionales con inteligencia artificial
                    </p>
                </div>
                <Button onClick={() => setShowWizard(true)} size="lg" className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="mr-2 h-5 w-5" />
                    Nueva Presentación
                </Button>
            </div>

            {/* Lista de Presentaciones */}
            {presentaciones.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Presentation className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No tienes presentaciones aún
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Comienza creando tu primera presentación con IA
                        </p>
                        <Button onClick={() => setShowWizard(true)} className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Crear Primera Presentación
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {presentaciones.map((presentacion) => (
                        <Card key={presentacion.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg truncate">{presentacion.titulo}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-2">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(presentacion.created_at).toLocaleDateString('es-MX')}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="ml-2">
                                        {presentacion.fuente_tipo === 'planeacion' ? 'Planeación' :
                                            presentacion.fuente_tipo === 'proyecto' ? 'Proyecto' : 'Libre'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {presentacion.diapositivas_json?.diapositivas?.length || 0} diapositivas
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setViewingPresentation(presentacion)
                                            setCurrentSlideIndex(0)
                                        }}
                                        title="Vista Rápida"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setEditingId(presentacion.id)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleDownload(presentacion)}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Descargar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => setPresentationToDelete(presentacion.id)}
                                        disabled={deletingId === presentacion.id}
                                    >
                                        {deletingId === presentacion.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AlertDialog open={!!presentationToDelete} onOpenChange={() => setPresentationToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la presentación.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (presentationToDelete) {
                                    handleDelete(presentationToDelete)
                                    setPresentationToDelete(null)
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal de Vista Rápida */}
            <Dialog open={!!viewingPresentation} onOpenChange={() => setViewingPresentation(null)}>
                <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{viewingPresentation?.titulo}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 flex items-center justify-center relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden p-4">
                        {viewingPresentation && (
                            <>
                                <div className="w-full h-full flex items-center justify-center">
                                    <SlidePreview slide={viewingPresentation.diapositivas_json.diapositivas[currentSlideIndex]} />
                                </div>

                                <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 z-10">
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                                        disabled={currentSlideIndex === 0}
                                        className="shadow-lg"
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </Button>
                                    <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                                        {currentSlideIndex + 1} / {viewingPresentation.diapositivas_json.diapositivas.length}
                                    </span>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={() => setCurrentSlideIndex(prev => Math.min(viewingPresentation.diapositivas_json.diapositivas.length - 1, prev + 1))}
                                        disabled={currentSlideIndex === viewingPresentation.diapositivas_json.diapositivas.length - 1}
                                        className="shadow-lg"
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
