"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Send, Plus, FileText, Eye, Download, Pencil, Trash2, Calendar, MessageSquare, CheckCircle, AlertCircle, Loader2, Edit, Clock } from "lucide-react"
import { usePlaneaciones } from "@/hooks/use-planeaciones"
import { useState } from "react"
import { ViewPlaneacion } from "./view-planeacion"
import { EditPlaneacion } from "./edit-planeacion"
// import { generatePDF } from "@/lib/pdf-generator" // Importación dinámica para evitar errores SSR
import { generateDocx } from "@/lib/docx-generator"
import { generatePptx } from "@/lib/pptx-generator"
import { useProfile } from "@/hooks/use-profile"
import { isUserPro } from "@/lib/subscription-utils"
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"


// Función para limpiar el texto de asteriscos y otros caracteres Markdown
function cleanMarkdown(text: string): string {
  if (!text) return ""
  return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/__/g, "").replace(/_/g, "")
}

interface MisPlaneacionesProps {
  onCreateNew?: () => void
}

export function MisPlaneaciones({ onCreateNew }: MisPlaneacionesProps) {
  const { planeaciones, loading, deletePlaneacion, currentPage, totalPages, setPage, refreshPlaneaciones } = usePlaneaciones()
  const { profile } = useProfile() // Obtener el perfil del usuario
  const { toast } = useToast()
  const [selectedPlaneacion, setSelectedPlaneacion] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"list" | "view" | "edit">("list")
  const [deleting, setDeleting] = useState<string | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null)
  const [generatingPPTX, setGeneratingPPTX] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [selectedComments, setSelectedComments] = useState<{ titulo: string, comentarios: string, fechaRevision: string } | null>(null)
  const [showCommentsModal, setShowCommentsModal] = useState(false)


  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "completada":
        return "bg-green-100 text-green-800"
      case "borrador":
        return "bg-gray-100 text-gray-800"
      case "archivada":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Función para obtener el texto y color del badge basado en origen, metodología y estado
  const getOrigenInfo = (planeacion: any) => {
    if (planeacion.origen === 'dosificacion') {
      return {
        text: 'Desde Dosificación',
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      }
    } else if (planeacion.metodologia === 'CIME') {
      return {
        text: 'CIME',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      }
    } else {
      // Para planeaciones NEM (metodologia NEM o null), mostrar "NEM"
      return {
        text: 'NEM',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      }
    }
  }

  const handleView = (planeacionId: string) => {
    setSelectedPlaneacion(planeacionId)
    setViewMode("view")
  }

  const handleEdit = (planeacionId: string) => {
    setSelectedPlaneacion(planeacionId)
    setViewMode("edit")
  }

  const handleDelete = async (planeacionId: string) => {
    setDeleting(planeacionId)
    try {
      const success = await deletePlaneacion(planeacionId)
      if (!success) {
        setError("Error al eliminar la planeación")
      }
    } catch (error) {
      console.error("Error al eliminar la planeación:", error)
      setError("Error al eliminar la planeación")
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = async (planeacion: any, format: "pdf" | "Word" | "PowerPoint") => {
    if (format === "pdf") {
      setGeneratingPDF(planeacion.id)
      try {
        const { generatePlaneacionPDF } = await import("@/lib/pdf-generator")
        await generatePlaneacionPDF(planeacion)
      } catch (error) {
        console.error('Error generando PDF:', error)
        setError('Error al generar el PDF')
      } finally {
        setGeneratingPDF(null)
      }
    } else if (format === "Word") {
      generateDocx(planeacion)
    } else if (format === "PowerPoint") {
      setGeneratingPPTX(planeacion.id)
      try {
        toast({
          title: "Generando presentación",
          description: "Por favor espera, esto puede tomar un momento...",
        })

        const result = await generatePptx(planeacion)

        if (result.success) {
          toast({
            title: "¡Presentación generada!",
            description: result.message || "La presentación PowerPoint se ha generado correctamente",
          })
        } else {
          throw new Error(result.message || 'Error al generar la presentación')
        }
      } catch (error) {
        console.error('Error generando PowerPoint:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : 'Error al generar la presentación PowerPoint',
          variant: "destructive"
        })
      } finally {
        setGeneratingPPTX(null)
      }
    }
  }



  const handleEnviarDireccion = async (planeacionId: string) => {
    setSending(planeacionId)
    try {
      const response = await fetch('/api/planeaciones/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planeacion_id: planeacionId,
          user_id: profile?.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar la planeación')
      }

      toast({
        title: "Planeación enviada",
        description: "Tu planeación ha sido enviada a dirección para revisión",
      })

      // Refrescar la lista para mostrar el nuevo estado
      refreshPlaneaciones()
    } catch (error) {
      console.error('Error enviando planeación:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al enviar la planeación a dirección',
        variant: "destructive"
      })
    } finally {
      setSending(null)
    }
  }

  const handleVerComentarios = (planeacion: any) => {
    setSelectedComments({
      titulo: planeacion.titulo,
      comentarios: planeacion.comentarios_director || 'Sin comentarios',
      fechaRevision: planeacion.fecha_revision || ''
    })
    setShowCommentsModal(true)
  }

  const handleReenviar = async (planeacionId: string) => {
    setSending(planeacionId)
    try {
      const response = await fetch('/api/planeaciones/reenviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planeacion_id: planeacionId,
          user_id: profile?.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al re-enviar la planeación')
      }

      toast({
        title: "Planeación re-enviada",
        description: "Tu planeación ha sido re-enviada a dirección para revisión",
      })

      refreshPlaneaciones()
    } catch (error) {
      console.error('Error re-enviando planeación:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al re-enviar la planeación',
        variant: "destructive"
      })
    } finally {
      setSending(null)
    }
  }

  const handleBack = () => {
    setSelectedPlaneacion(null)
    setViewMode("list")
    refreshPlaneaciones()
  }

  if (viewMode === "view" && selectedPlaneacion) {
    return (
      <ViewPlaneacion
        planeacionId={selectedPlaneacion}
        onBack={handleBack}
      />
    )
  }

  if (viewMode === "edit" && selectedPlaneacion) {
    return <EditPlaneacion planeacionId={selectedPlaneacion} onBack={handleBack} />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Mis Planeaciones</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Gestiona y edita tus planeaciones</p>
        </div>
        <Button onClick={onCreateNew} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Planeación
        </Button>
      </div>

      {planeaciones.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No tienes planeaciones aún</h3>
            <p className="text-gray-600 mb-4">Comienza creando tu primera planeación didáctica</p>
            <Button onClick={onCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primera Planeación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 w-full max-w-full overflow-hidden">
          {planeaciones.map((planeacion) => (
            <Card
              key={planeacion.id}
              className="hover:shadow-md transition-shadow cursor-pointer w-full max-w-full overflow-hidden"
              onClick={() => handleView(planeacion.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <CardTitle className="text-base sm:text-lg dark:text-gray-100 leading-tight overflow-hidden text-ellipsis whitespace-nowrap">
                      {cleanMarkdown(planeacion.titulo)}
                    </CardTitle>
                    <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 dark:text-gray-300 overflow-hidden">
                      <span className="flex items-center gap-1 text-sm flex-shrink-0">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        {new Date(planeacion.created_at).toLocaleDateString("es-MX")}
                      </span>
                      {planeacion.grado && (
                        <span className="dark:text-gray-300 text-sm flex-shrink-0">{cleanMarkdown(planeacion.grado)}</span>
                      )}
                      {planeacion.duracion && (
                        <span className="dark:text-gray-300 text-sm flex-shrink-0">{cleanMarkdown(planeacion.duracion)}</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 self-start sm:self-auto flex-shrink-0">
                    <Badge className={`${getOrigenInfo(planeacion).className}`}>
                      {getOrigenInfo(planeacion).text}
                    </Badge>
                    {/* Badges de estado de envío */}
                    {planeacion.envio_estado === 'pendiente' && (
                      <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Enviada a Dirección
                      </Badge>
                    )}
                    {planeacion.envio_estado === 'aprobada' && (
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Aprobada
                      </Badge>
                    )}
                    {planeacion.envio_estado === 'cambios_solicitados' && (
                      <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Cambios Solicitados
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    {planeacion.materia && (
                      <Badge variant="outline" className="dark:text-gray-100 dark:border-gray-700 w-fit">
                        {cleanMarkdown(planeacion.materia)}
                      </Badge>
                    )}
                    {planeacion.objetivo && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 w-full">
                        <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                          {cleanMarkdown(planeacion.objetivo)}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(planeacion.id)} className="w-full sm:w-auto">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    {/* Mostrar botón "Enviar a Dirección" solo si el usuario tiene plantel_id Y la planeación no ha sido enviada */}
                    {profile?.plantel_id && !planeacion.envio_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEnviarDireccion(planeacion.id)}
                        disabled={sending === planeacion.id}
                        className="w-full sm:w-auto"
                      >
                        {sending === planeacion.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Enviar a Dirección
                      </Button>
                    )}
                    {/* Botón "Ver Comentarios" - visible si tiene comentarios (aprobada o cambios_solicitados) y tiene plantel */}
                    {profile?.plantel_id && (planeacion.envio_estado === 'aprobada' || planeacion.envio_estado === 'cambios_solicitados') && planeacion.comentarios_director && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerComentarios(planeacion)}
                        className="w-full sm:w-auto"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ver Comentarios
                      </Button>
                    )}
                    {/* Botón "Re-enviar a Dirección" - solo visible si tiene cambios solicitados y tiene plantel */}
                    {profile?.plantel_id && planeacion.envio_estado === 'cambios_solicitados' && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleReenviar(planeacion.id)}
                        disabled={sending === planeacion.id}
                        className="w-full sm:w-auto"
                      >
                        {sending === planeacion.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Re-enviar a Dirección
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" disabled={generatingPDF === planeacion.id || generatingPPTX === planeacion.id} className="w-full sm:w-auto">
                          {(generatingPDF === planeacion.id || generatingPPTX === planeacion.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          {generatingPDF === planeacion.id ? "Generando PDF..." : generatingPPTX === planeacion.id ? "Generando PPTX..." : "Descargar"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => handleDownload(planeacion, "pdf")}
                          disabled={generatingPDF === planeacion.id}
                        >
                          {generatingPDF === planeacion.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generando PDF...
                            </>
                          ) : (
                            "Descargar como PDF"
                          )}
                        </DropdownMenuItem>
                        {profile && isUserPro(profile) && (
                          <DropdownMenuItem onClick={() => handleDownload(planeacion, "Word")}>
                            Descargar para Word
                          </DropdownMenuItem>
                        )}

                        {(!profile || !isUserPro(profile)) && (
                          <DropdownMenuItem disabled className="text-gray-500 dark:text-gray-400">
                            Word (Solo Pro)
                          </DropdownMenuItem>
                        )}

                        {profile && isUserPro(profile) && (
                          <DropdownMenuItem
                            onClick={() => handleDownload(planeacion, "PowerPoint")}
                            disabled={generatingPPTX === planeacion.id}
                          >
                            {generatingPPTX === planeacion.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generando PowerPoint...
                              </>
                            ) : (
                              "Descargar PowerPoint"
                            )}
                          </DropdownMenuItem>
                        )}

                        {(!profile || !isUserPro(profile)) && (
                          <DropdownMenuItem disabled className="text-gray-500 dark:text-gray-400">
                            PowerPoint (Solo Pro)
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                          disabled={deleting === planeacion.id}
                        >
                          {deleting === planeacion.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="dark:text-gray-100">¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription className="dark:text-gray-300">
                            Esta acción eliminará la planeación "{cleanMarkdown(planeacion.titulo)}". Una vez eliminada,
                            no se podrá recuperar. ¿Estás seguro de que quieres continuar?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(planeacion.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Sí, eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={() => setPage(currentPage - 1)}
                aria-disabled={currentPage === 1}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink href="#" isActive={i + 1 === currentPage} onClick={() => setPage(i + 1)}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={() => setPage(currentPage + 1)}
                aria-disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Modal para ver comentarios del director */}
      <Dialog open={showCommentsModal} onOpenChange={setShowCommentsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comentarios del Director</DialogTitle>
            <DialogDescription>
              {selectedComments?.titulo}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {selectedComments?.fechaRevision && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Revisada el {new Date(selectedComments.fechaRevision).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap text-sm">
                  {selectedComments?.comentarios}
                </p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

    </div>
  )
}
