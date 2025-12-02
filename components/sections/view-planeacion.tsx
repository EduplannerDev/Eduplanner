"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, Target, BookOpen, Loader2 } from "lucide-react"
import { usePlaneaciones } from "@/hooks/use-planeaciones"
import { useState, useEffect } from "react"
import type { Planeacion } from "@/lib/planeaciones"
import { useToast } from "@/hooks/use-toast"

interface ViewPlaneacionProps {
  planeacionId: string
  onBack: () => void
}

// Función para limpiar el texto de asteriscos y otros caracteres Markdown
function cleanMarkdown(text: string): string {
  if (!text) return ""
  return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/__/g, "").replace(/_/g, "")
}

export function ViewPlaneacion({ planeacionId, onBack }: ViewPlaneacionProps) {
  const { getPlaneacion } = usePlaneaciones()
  const { toast } = useToast()
  const [planeacion, setPlaneacion] = useState<Planeacion | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlaneacion()
  }, [planeacionId])

  const showCopyWarning = () => {
    toast({
      title: "Acción no permitida",
      description: "No es posible seleccionar ni copiar texto. Debes guardar la planeación para poder descargarla en PDF.",
      variant: "destructive",
    })
  }

  // Proteger contra atajos de teclado para copiar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloquear Ctrl+C, Ctrl+A, Ctrl+V, Ctrl+X, F12
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'a' || e.key === 'v' || e.key === 'x')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') || // DevTools
        (e.ctrlKey && e.shiftKey && e.key === 'J') || // Console
        (e.ctrlKey && e.key === 'u') // View Source
      ) {
        e.preventDefault()
        e.stopPropagation()
        showCopyWarning()
        return false
      }
    }

    const handleContextMenu = (e: Event) => {
      e.preventDefault()
      showCopyWarning()
      return false
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  const loadPlaneacion = async () => {
    setLoading(true)
    const data = await getPlaneacion(planeacionId)
    setPlaneacion(data)
    setLoading(false)
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!planeacion) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Planeación no encontrada</h3>
        <Button onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div
      className="space-y-6 max-w-4xl mx-auto select-none w-full overflow-hidden px-2 sm:px-0"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        showCopyWarning()
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Botón Volver - Solo visible en desktop */}
        <Button variant="default" size="sm" onClick={onBack} className="hidden sm:flex w-fit bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 break-words leading-tight">
            {cleanMarkdown(planeacion.titulo)}
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Vista de planeación</p>
        </div>
      </div>

      {/* Botón flotante Volver - Solo visible en móviles */}
      <Button
        variant="default"
        size="icon"
        onClick={onBack}
        className="fixed bottom-20 left-4 z-50 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-full w-12 h-12 sm:hidden"
        aria-label="Volver"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Materia</label>
              <p className="text-lg">{planeacion.materia ? cleanMarkdown(planeacion.materia) : "No especificada"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Grado</label>
              <p className="text-lg">{planeacion.grado ? cleanMarkdown(planeacion.grado) : "No especificado"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Duración</label>
              <p className="text-lg flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {planeacion.duracion ? cleanMarkdown(planeacion.duracion) : "No especificada"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Estado</label>
              <div className="mt-1">
                <Badge className={getEstadoColor(planeacion.estado)}>
                  {planeacion.estado.charAt(0).toUpperCase() + planeacion.estado.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Objetivo */}
      {planeacion.objetivo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objetivo de Aprendizaje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className="text-gray-900 dark:text-gray-100 leading-relaxed select-none"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              onClick={showCopyWarning}
            >
              {planeacion.objetivo ? cleanMarkdown(planeacion.objetivo) : ""}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contenido Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Contenido de la Planeación</CardTitle>
          <CardDescription>Desarrollo completo de la clase</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 select-none"
            style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onCopy={(e) => {
              e.preventDefault()
              showCopyWarning()
            }}
            onCut={(e) => {
              e.preventDefault()
              showCopyWarning()
            }}
            onClick={showCopyWarning}
          >
            <div
              className="prose prose-sm max-w-none dark:prose-invert text-gray-900 dark:text-gray-100 leading-relaxed select-none"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
              dangerouslySetInnerHTML={{ __html: planeacion.contenido || "" }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
        </CardContent>
      </Card>

      {/* Metadatos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Información de Creación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-600">Fecha de creación</label>
              <p>{new Date(planeacion.created_at).toLocaleString("es-MX")}</p>
            </div>
            <div>
              <label className="font-medium text-gray-600">Última modificación</label>
              <p>{new Date(planeacion.updated_at).toLocaleString("es-MX")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
