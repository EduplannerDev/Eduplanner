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
import { Send, Plus, FileText, Eye, Download, Pencil, Trash2, Calendar, MessageSquare, CheckCircle, AlertCircle, Loader2, Edit, Clock, Search, Filter, GraduationCap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePlaneaciones } from "@/hooks/use-planeaciones"
import { useContextoTrabajo } from "@/hooks/use-contexto-trabajo"
import { useDebounce } from "@/hooks/use-debounce"
import { useState, useEffect } from "react"
import { ViewPlaneacion } from "./view-planeacion"
import { EditPlaneacion } from "./edit-planeacion"
// import { generatePDF } from "@/lib/pdf-generator" // Importación dinámica para evitar errores SSR
import { generateDocx } from "@/lib/docx-generator"

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
  initialPlaneacionId?: string
}



export function MisPlaneaciones({ onCreateNew, initialPlaneacionId }: MisPlaneacionesProps) {
  const { planeaciones, loading, deletePlaneacion, currentPage, totalPages, setPage, refreshPlaneaciones, filters, setFilters } = usePlaneaciones()
  const { availableContexts } = useContextoTrabajo()
  const { profile } = useProfile() // Obtener el perfil del usuario
  const { toast } = useToast()

  // Local state for search input to allow immediate typing
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const debouncedSearch = useDebounce(searchTerm, 500)

  // Sync debounced search with filters
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ ...filters, search: debouncedSearch })
      setPage(1)
    }
  }, [debouncedSearch, filters.search, setFilters, setPage])

  const [selectedPlaneacion, setSelectedPlaneacion] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"list" | "view" | "edit">("list")
  const [deleting, setDeleting] = useState<string | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [selectedComments, setSelectedComments] = useState<{ titulo: string, comentarios: string, fechaRevision: string } | null>(null)

  const [showCommentsModal, setShowCommentsModal] = useState(false)

  // Helper to format grade name
  const formatGrado = (grado: number) => {
    if (grado < 0) return `${grado + 4}° Preescolar`
    if (grado <= 6) return `${grado}° Primaria`
    return `${grado - 6}° Secundaria`
  }

  // Efecto para manejar deep linking
  useEffect(() => {
    if (initialPlaneacionId) {
      setSelectedPlaneacion(initialPlaneacionId)
      setViewMode("view")
    }
  }, [initialPlaneacionId])


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

  const handleDownload = async (planeacion: any, format: "pdf" | "Word") => {
    if (format === "pdf") {
      setGeneratingPDF(planeacion.id)
      try {
        const { generatePlaneacionPDF } = await import("@/lib/pdf-generator")
        await generatePlaneacionPDF(planeacion)
      } catch (error) {
        console.error('Error generando PDF:', error)
        setError('Error al generar el PDF')
      }
    } else if (format === "Word") {
      generateDocx(planeacion)
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



  // Handlers for filters
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value })
    setPage(1) // Reset to first page on filter change
  }



  // Handlers for filters
  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
    setPage(1)
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Header and Create Button */}
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

      {/* Filters Section */}
      <div className="bg-white dark:bg-sidebar-primary/10 p-4 md:p-6 rounded-xl border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Filtros de Búsqueda</h3>
              <p className="text-xs text-muted-foreground">Refina tu búsqueda</p>
            </div>
          </div>

          {/* Search - Pushed to right on desktop or full width on mobile */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título..."
              className="pl-9 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"
              value={filters.search || ''}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Grado Filter */}
          {availableContexts.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground ml-1">Grado</label>
              <Select value={filters.grado || 'todos'} onValueChange={(val) => handleFilterChange('grado', val)}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-900/50">
                  <SelectValue placeholder="Grado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los grados</SelectItem>
                  {availableContexts.map((ctx) => (
                    <SelectItem key={ctx.id} value={formatGrado(ctx.grado)}>
                      {formatGrado(ctx.grado)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Metodología Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground ml-1">Metodología</label>
            <Select value={filters.metodologia || 'todos'} onValueChange={(val) => handleFilterChange('metodologia', val)}>
              <SelectTrigger className="bg-gray-50 dark:bg-gray-900/50">
                <SelectValue placeholder="Metodología" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="NEM">NEM (Nueva Escuela Mexicana)</SelectItem>
                <SelectItem value="CIME">CIME</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Order Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground ml-1">Orden</label>
            <Select value={filters.sortOrder || 'desc'} onValueChange={(val) => handleFilterChange('sortOrder', val)}>
              <SelectTrigger className="bg-gray-50 dark:bg-gray-900/50">
                <SelectValue placeholder="Orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Más recientes primero</SelectItem>
                <SelectItem value="asc">Más antiguas primero</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filters - Simple Inputs for now */}
          <div className={`space-y-1.5 ${availableContexts.length > 0 ? '' : 'lg:col-span-1'}`}>
            <label className="text-xs font-medium text-muted-foreground ml-1">Rango de Fechas</label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="bg-gray-50 dark:bg-gray-900/50 text-xs px-2 w-full"
              />
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="bg-gray-50 dark:bg-gray-900/50 text-xs px-2 w-full"
              />
            </div>
          </div>
        </div>
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
                    <CardDescription className="mt-3 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {/* Date */}
                        <span className="flex items-center gap-1.5 text-muted-foreground bg-gray-100 dark:bg-gray-800/50 px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(planeacion.created_at).toLocaleDateString("es-MX")}
                        </span>

                        {/* Grade - Initial visual emphasis */}
                        {planeacion.grado && (
                          <span className="flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-800/50">
                            <GraduationCap className="h-3.5 w-3.5" />
                            {cleanMarkdown(planeacion.grado)}
                          </span>
                        )}

                        {/* Duration */}
                        {planeacion.duracion && (
                          <span className="flex items-center gap-1.5 text-muted-foreground px-2 py-1">
                            <Clock className="h-3.5 w-3.5" />
                            {cleanMarkdown(planeacion.duracion)}
                          </span>
                        )}
                      </div>
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
                        <Button size="sm" variant="outline" disabled={generatingPDF === planeacion.id} className="w-full sm:w-auto">
                          {generatingPDF === planeacion.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          {generatingPDF === planeacion.id ? "Generando PDF..." : "Descargar"}
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
