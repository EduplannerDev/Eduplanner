"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RichTextEditor, convertLegacyToHtml } from "@/components/ui/rich-text-editor"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { usePlaneaciones } from "@/hooks/use-planeaciones"
import { useState, useEffect } from "react"
import type { Planeacion } from "@/lib/planeaciones"

interface EditPlaneacionProps {
  planeacionId: string
  onBack: () => void
}

export function EditPlaneacion({ planeacionId, onBack }: EditPlaneacionProps) {
  const { getPlaneacion, updatePlaneacion } = usePlaneaciones()
  const [planeacion, setPlaneacion] = useState<Planeacion | null>(null)
  const [contenido, setContenido] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadPlaneacion()
  }, [planeacionId])

  const loadPlaneacion = async () => {
    setLoading(true)
    const data = await getPlaneacion(planeacionId)
    if (data) {
      setPlaneacion(data)
      // Convertir contenido legacy a HTML si es necesario
      setContenido(convertLegacyToHtml(data.contenido))
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!planeacion) return

    setSaving(true)
    setMessage("")

    const success = await updatePlaneacion(planeacionId, {
      contenido: contenido,
    })

    if (success) {
      setMessage("Planeación actualizada correctamente")
      setTimeout(() => {
        setMessage("")
        onBack()
      }, 1500)
    } else {
      setMessage("Error al actualizar la planeación")
    }

    setSaving(false)
  }

  const handleCancel = () => {
    if (planeacion) {
      setContenido(planeacion.contenido)
    }
    onBack()
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{planeacion.titulo}</h1>
            <p className="text-gray-600 mt-1">Editar planeación</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div
          className={`text-center p-3 rounded-lg ${
            message.includes("Error")
              ? "bg-red-50 text-red-600 border border-red-200"
              : "bg-green-50 text-green-600 border border-green-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Información de solo lectura */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Planeación</CardTitle>
          <CardDescription>Esta información no se puede editar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-600">Materia</label>
              <p>{planeacion.materia || "No especificada"}</p>
            </div>
            <div>
              <label className="font-medium text-gray-600">Grado</label>
              <p>{planeacion.grado || "No especificado"}</p>
            </div>
            <div>
              <label className="font-medium text-gray-600">Duración</label>
              <p>{planeacion.duracion || "No especificada"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor de contenido */}
      <Card>
        <CardHeader>
          <CardTitle>Contenido de la Planeación</CardTitle>
          <CardDescription>Edita el contenido de tu planeación didáctica</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={contenido}
            onChange={setContenido}
            placeholder="Escribe el contenido de tu planeación aquí..."
            className="min-h-[500px]"
            disabled={saving}
          />
          <p className="text-xs text-gray-500 mt-2">
            Usa la barra de herramientas para dar formato a tu planeación. Puedes usar negritas, cursivas, listas, encabezados y más.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
