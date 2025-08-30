"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RichTextEditor, convertLegacyToHtml } from "@/components/ui/rich-text-editor"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { getExamenById, updateExamen, type Examen } from "@/lib/examenes"
import { useState, useEffect, useCallback } from "react"

interface EditExamenProps {
  examenId: string
  onBack: () => void
  onSaveSuccess?: () => void // Opcional, para refrescar la lista o realizar otra acción
}

export function EditExamen({ examenId, onBack, onSaveSuccess }: EditExamenProps) {
  const [examen, setExamen] = useState<Examen | null>(null)
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [examContent, setExamContent] = useState("")
  const [answerSheet, setAnswerSheet] = useState("")
  const [isStructuredFormat, setIsStructuredFormat] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const loadExamen = useCallback(async () => {
    setLoading(true)
    setMessage("")
    try {
      const data = await getExamenById(examenId)
      if (data) {
        setExamen(data)
        setTitle(data.title || "")
        setSubject(data.subject || "")
        // Detectar si el contenido es formato estructurado (JSON con examen_contenido y hoja_de_respuestas)
        if (typeof data.content === 'object' && data.content.examen_contenido && data.content.hoja_de_respuestas) {
          setIsStructuredFormat(true)
          setExamContent(convertLegacyToHtml(data.content.examen_contenido || ""))
          setAnswerSheet(convertLegacyToHtml(data.content.hoja_de_respuestas || ""))
          setContent("") // No usar el campo content para formato estructurado
        } else {
          setIsStructuredFormat(false)
          const contentStr = typeof data.content === 'string' ? data.content : JSON.stringify(data.content, null, 2) || ""
          setContent(convertLegacyToHtml(contentStr))
          setExamContent("")
          setAnswerSheet("")
        }
        setIsPublic(data.is_public || false)
      } else {
        setMessage("Error: Examen no encontrado.")
      }
    } catch (error) {
      console.error("Error loading examen:", error)
      setMessage("Error al cargar el examen.")
    } finally {
      setLoading(false)
    }
  }, [examenId])

  useEffect(() => {
    loadExamen()
  }, [loadExamen])

  const handleSave = async () => {
    if (!examen) return

    setSaving(true)
    setMessage("")

    let parsedContent: any;
    
    if (isStructuredFormat) {
      // Para formato estructurado, crear el objeto JSON
      parsedContent = {
        examen_contenido: examContent,
        hoja_de_respuestas: answerSheet
      };
    } else {
      // Para formato legacy, intentar parsear o usar como string
      parsedContent = content;
      try {
        parsedContent = JSON.parse(content);
      } catch (e) {
        // Si no es un JSON válido, se asume que es texto plano o Markdown
        parsedContent = content;
      }
    }

    const success = await updateExamen(examenId, {
      title: title,
      subject: subject,
      content: parsedContent,
      is_public: isPublic,
    })

    if (success) {
      setMessage("Examen actualizado correctamente")
      if (onSaveSuccess) {
        onSaveSuccess()
      }
      setTimeout(() => {
        setMessage("")
        onBack() // Volver después de guardar y mostrar mensaje
      }, 1500)
    } else {
      setMessage("Error al actualizar el examen")
    }

    setSaving(false)
  }

  const handleCancel = () => {
    // No se resetean los campos al cancelar, simplemente se vuelve
    onBack()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!examen && !loading) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-red-600 mb-2">{message || "Examen no encontrado"}</h3>
        <Button onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    )
  }
  
  if (!examen) return null; // Seguridad adicional

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Editar: {examen.title || 'Examen sin título'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Modifica los detalles de tu examen.</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
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
          className={`text-center p-3 rounded-lg text-sm ${ 
            message.includes("Error")
              ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"
              : "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Formulario de Edición */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Examen</CardTitle>
            <CardDescription>Actualiza el título, materia y visibilidad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="examen-title">Título del Examen</Label>
              <Input 
                id="examen-title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Ej: Examen Final de Matemáticas"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="examen-subject">Materia</Label>
              <Input 
                id="examen-subject" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="Ej: Matemáticas"
                disabled={saving}
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch 
                id="examen-isPublic" 
                checked={isPublic} 
                onCheckedChange={setIsPublic} 
                disabled={saving}
              />
              <Label htmlFor="examen-isPublic" className="cursor-pointer">
                Hacer este examen público
              </Label>
            </div>
          </CardContent>
        </Card>

        {isStructuredFormat ? (
          // Formato estructurado: mostrar campos separados
          <>
            <Card>
              <CardHeader>
                <CardTitle>Contenido del Examen</CardTitle>
                <CardDescription>Edita las preguntas y contenido principal del examen.</CardDescription>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  content={examContent}
                  onChange={setExamContent}
                  placeholder="Escribe las preguntas del examen aquí..."
                  className="min-h-[300px]"
                  disabled={saving}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Hoja de Respuestas</CardTitle>
                <CardDescription>Edita las respuestas correctas y explicaciones.</CardDescription>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  content={answerSheet}
                  onChange={setAnswerSheet}
                  placeholder="Escribe las respuestas correctas aquí..."
                  className="min-h-[300px]"
                  disabled={saving}
                />
              </CardContent>
            </Card>
          </>
        ) : (
          // Formato legacy: mostrar campo único
          <Card>
            <CardHeader>
              <CardTitle>Contenido del Examen</CardTitle>
              <CardDescription>Edita el contenido principal de tu examen. Puedes usar texto plano o Markdown.</CardDescription>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Escribe el contenido de tu examen aquí..."
                className="min-h-[400px] sm:min-h-[500px]"
                disabled={saving}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                El contenido se guardará tal cual lo ingreses. Si usas Markdown, asegúrate de que sea compatible con cómo se mostrará.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default EditExamen;
