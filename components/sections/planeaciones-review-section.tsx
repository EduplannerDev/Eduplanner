"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileCheck, Eye, CheckCircle, Clock, User, Calendar, Loader2 } from "lucide-react"
import { useRoles } from "@/hooks/use-roles"
import { useProfile } from "@/hooks/use-profile"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface PlaneacionEnviada {
    id: string
    planeacion_id: string
    profesor_id: string
    fecha_envio: string
    estado: "pendiente" | "revisada"
    planeaciones: {
        id: string
        titulo: string
        materia: string
        grado: string
        contenido: string
        created_at: string
    }
    profiles: {
        full_name: string
        email: string
    }
}

interface PlaneacionesReviewSectionProps {
    plantelId: string
}

export function PlaneacionesReviewSection({ plantelId }: PlaneacionesReviewSectionProps) {
    // const { plantel } = useRoles() -> Ya no lo necesitamos aquí porque viene por props
    const { profile } = useProfile()
    const { toast } = useToast()
    const [planeaciones, setPlaneaciones] = useState<PlaneacionEnviada[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPlaneacion, setSelectedPlaneacion] = useState<PlaneacionEnviada | null>(null)
    const [showViewModal, setShowViewModal] = useState(false)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [comentarios, setComentarios] = useState("")
    const [reviewing, setReviewing] = useState(false)

    console.log('🔍 PlaneacionesReviewSection: Renderizando', { plantelId, loading })

    useEffect(() => {
        if (plantelId) {
            loadPlaneaciones()
        }
    }, [plantelId])

    const loadPlaneaciones = async () => {
        try {
            if (!plantelId) return
            setLoading(true)

            // Obtener usuarios del plantel para filtrar (opcional si planeaciones_enviadas ya tiene plantel_id)
            // Pero como la tabla 'planeaciones_enviadas' no tiene 'plantel_id' explícitamente en el esquema original...
            // ESPERA: La migración original CREO planeaciones_enviadas.
            // Voy a asumir que filtramos por los profesores del plantel.

            // 1. Obtener perfiles de usuarios del mismo plantel
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, email') // Modified to select full_name and email
                .eq('plantel_id', plantelId)

            if (profilesError) throw profilesError

            const teacherIds = profiles.map(p => p.id)

            if (teacherIds.length === 0) {
                setPlaneaciones([])
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from("planeaciones_enviadas")
                .select(`
          id,
          planeacion_id,
          profesor_id,
          fecha_envio,
          estado,
          comentarios_director, 
          planeaciones (
            id,
            titulo,
            materia,
            grado,
            contenido,
            created_at
          )
        `)
                .in("profesor_id", teacherIds) // Filtrar por profesores del plantel
                .eq("estado", "pendiente")
                .order("fecha_envio", { ascending: false })

            if (error) {
                console.error("Error loading planeaciones:", error)
                toast({
                    title: "Error",
                    description: "No se pudieron cargar las planeaciones pendientes",
                    variant: "destructive"
                })
                return
            }

            // Crear un mapa de profiles para fácil acceso usando los datos obtenidos inicialmente
            const profilesMap = new Map(
                (profiles || []).map(p => [p.id, p])
            )

            // Combinar los datos
            const combinedData = data.map(planeacion => ({
                ...planeacion,
                profiles: profilesMap.get(planeacion.profesor_id) || {
                    full_name: "Desconocido",
                    email: ""
                }
            }))

            setPlaneaciones(combinedData as unknown as PlaneacionEnviada[])
        } catch (error) {
            console.error("Error:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleView = (planeacion: PlaneacionEnviada) => {
        setSelectedPlaneacion(planeacion)
        setShowViewModal(true)
    }

    const handleReview = (planeacion: PlaneacionEnviada) => {
        setSelectedPlaneacion(planeacion)
        setComentarios("")
        setShowReviewModal(true)
    }

    const handleConfirmReview = async (accion: 'aprobar' | 'solicitar_cambios') => {
        if (!selectedPlaneacion || !profile) return

        // Validar que haya comentarios si se solicitan cambios
        if (accion === 'solicitar_cambios' && comentarios.trim().length === 0) {
            toast({
                title: "Comentarios requeridos",
                description: "Debes agregar comentarios explicando qué cambios se necesitan",
                variant: "destructive"
            })
            return
        }

        setReviewing(true)
        try {
            const response = await fetch('/api/planeaciones/revisar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    envio_id: selectedPlaneacion.id,
                    comentarios: comentarios.trim(),
                    user_id: profile.id,
                    accion
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al procesar la revisión')
            }

            const mensaje = accion === 'aprobar'
                ? 'Planeación aprobada correctamente'
                : 'Se solicitaron cambios. El profesor recibirá tus comentarios.';

            toast({
                title: accion === 'aprobar' ? "Planeación aprobada" : "Cambios solicitados",
                description: mensaje,
            })

            // Recargar lista
            loadPlaneaciones()
            setShowReviewModal(false)
            setSelectedPlaneacion(null)
            setComentarios("")
        } catch (error) {
            console.error('Error reviewing planeacion:', error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : 'Error al revisar la planeación',
                variant: "destructive"
            })
        } finally {
            setReviewing(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando planeaciones...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-primary" />
                        <CardTitle>Planeaciones Pendientes de Revisión</CardTitle>
                        {planeaciones.length > 0 && (
                            <Badge variant="destructive" className="ml-auto">
                                {planeaciones.length}
                            </Badge>
                        )}
                    </div>
                    <CardDescription>
                        Planeaciones enviadas por profesores de tu plantel
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {planeaciones.length === 0 ? (
                        <div className="text-center py-8">
                            <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No hay planeaciones pendientes</h3>
                            <p className="text-muted-foreground text-sm">
                                Cuando los profesores envíen planeaciones para revisión, aparecerán aquí
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {planeaciones.map((planeacion) => (
                                <Card key={planeacion.id} className="hover:border-primary/50 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm mb-2 truncate">
                                                    {planeacion.planeaciones.titulo}
                                                </h4>
                                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        <span>{planeacion.profiles.full_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{format(new Date(planeacion.fecha_envio), "dd/MM/yyyy", { locale: es })}</span>
                                                    </div>
                                                    {planeacion.planeaciones.materia && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {planeacion.planeaciones.materia}
                                                        </Badge>
                                                    )}
                                                    {planeacion.planeaciones.grado && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {planeacion.planeaciones.grado}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleView(planeacion)}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Ver
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleReview(planeacion)}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Revisar
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal Ver Planeación */}
            <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>{selectedPlaneacion?.planeaciones.titulo}</DialogTitle>
                        <DialogDescription>
                            Enviada por {selectedPlaneacion?.profiles.full_name} el{" "}
                            {selectedPlaneacion && format(new Date(selectedPlaneacion.fecha_envio), "dd/MM/yyyy", { locale: es })}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                        <div
                            className="prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: selectedPlaneacion?.planeaciones.contenido || "" }}
                        />
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Modal Marcar como Revisada */}
            <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revisar Planeación</DialogTitle>
                        <DialogDescription>
                            {selectedPlaneacion?.planeaciones.titulo}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="comentarios">
                                Comentarios {' '}
                                <span className="text-xs text-muted-foreground">
                                    (obligatorio si solicitas cambios)
                                </span>
                            </Label>
                            <Textarea
                                id="comentarios"
                                placeholder="Agrega comentarios o sugerencias para el profesor..."
                                value={comentarios}
                                onChange={(e) => setComentarios(e.target.value)}
                                rows={4}
                                className="mt-2"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowReviewModal(false)}
                            disabled={reviewing}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="outline"
                            className="border-orange-500 text-orange-600 hover:bg-orange-50"
                            onClick={() => handleConfirmReview('solicitar_cambios')}
                            disabled={reviewing}
                        >
                            {reviewing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    📝 Solicitar Cambios
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => handleConfirmReview('aprobar')}
                            disabled={reviewing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {reviewing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Aprobar
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
