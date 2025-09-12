"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { FileText, Calendar, Edit, Trash2, Eye, Download, Plus, Loader2 } from "lucide-react"
import { usePlaneaciones } from "@/hooks/use-planeaciones"
import { useState } from "react"
import { ViewPlaneacion } from "./view-planeacion"
import { EditPlaneacion } from "./edit-planeacion"
// import { generatePDF } from "@/lib/pdf-generator" // Importación dinámica para evitar errores SSR
import { generateDocx } from "@/lib/docx-generator"
import { useProfile } from "@/hooks/use-profile"
import { isUserPro } from "@/lib/subscription-utils"
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination"


// Función para limpiar el texto de asteriscos y otros caracteres Markdown
function cleanMarkdown(text: string): string {
  if (!text) return ""
  return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/__/g, "").replace(/_/g, "")
}

interface MisPlaneacionesProps {
  onCreateNew?: () => void
}

export function MisPlaneaciones({ onCreateNew }: MisPlaneacionesProps) {
  const { planeaciones, loading, deletePlaneacion, currentPage, totalPages, setPage } = usePlaneaciones()
  const { profile } = useProfile() // Obtener el perfil del usuario
  const [selectedPlaneacion, setSelectedPlaneacion] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"list" | "view" | "edit">("list")
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)


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

  // Función para obtener el texto y color del badge basado en origen y estado
  const getOrigenInfo = (planeacion: any) => {
    if (planeacion.origen === 'dosificacion') {
      return {
        text: 'Desde Dosificación',
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      }
    } else {
      // Para planeaciones manuales, mostrar el estado tradicional
      return {
        text: planeacion.estado.charAt(0).toUpperCase() + planeacion.estado.slice(1),
        className: getEstadoColor(planeacion.estado)
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
      try {
        const { generatePDF } = await import("@/lib/pdf-generator")
        generatePDF(planeacion)
      } catch (error) {
        console.error('Error generando PDF:', error)
        setError('Error al generar el PDF')
      }
    } else if (format === "Word") {
      generateDocx(planeacion)
    }
  }



  const handleBack = () => {
    setSelectedPlaneacion(null)
    setViewMode("list")
  }

  if (viewMode === "view" && selectedPlaneacion) {
    return (
      <ViewPlaneacion
        planeacionId={selectedPlaneacion}
        onBack={handleBack}
        onEdit={() => handleEdit(selectedPlaneacion)}
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
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Mis Planeaciones</h1>
          <p className="text-gray-600 mt-2">Gestiona y edita tus planeaciones</p>
        </div>
        <Button onClick={onCreateNew}>
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
        <div className="grid gap-4">
          {planeaciones.map((planeacion) => (
            <Card 
              key={planeacion.id} 
              className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => handleView(planeacion.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg dark:text-gray-100">{cleanMarkdown(planeacion.titulo)}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2 dark:text-gray-300">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(planeacion.created_at).toLocaleDateString("es-MX")}
                      </span>
                      {planeacion.grado && <span className="dark:text-gray-300">{cleanMarkdown(planeacion.grado)}</span>}
                      {planeacion.duracion && <span className="dark:text-gray-300">{cleanMarkdown(planeacion.duracion)}</span>}
                    </CardDescription>
                  </div>
                  <Badge className={getOrigenInfo(planeacion).className}>
                    {getOrigenInfo(planeacion).text}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {planeacion.materia && <Badge variant="outline" className="dark:text-gray-100 dark:border-gray-700">{cleanMarkdown(planeacion.materia)}</Badge>}
                    {planeacion.objetivo && (
                      <span className="text-sm text-gray-600 truncate max-w-md dark:text-gray-300">
                        {cleanMarkdown(planeacion.objetivo).substring(0, 100)}
                        {planeacion.objetivo.length > 100 ? "..." : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(planeacion.id)}>
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                          Descargar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleDownload(planeacion, "pdf")}>
                          Descargar como PDF
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
                          className="text-red-600 hover:text-red-700"
                          disabled={deleting === planeacion.id}
                        >
                          {deleting === planeacion.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
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


    </div>
  )
}
