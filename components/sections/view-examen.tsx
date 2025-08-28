"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, BookOpen, Loader2, FileText as FileTextIcon } from "lucide-react"
import { getExamenById, type Examen } from "@/lib/examenes"
import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"

interface ViewExamenProps {
  examenId: string
  onBack: () => void
}

export function ViewExamen({ examenId, onBack }: ViewExamenProps) {
  const [examen, setExamen] = useState<Examen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExamen = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getExamenById(examenId);
        if (data) {
          setExamen(data);
        } else {
          setError("No se pudo encontrar el examen.");
        }
      } catch (err) {
        console.error("Error fetching examen:", err);
        setError("Ocurrió un error al cargar el examen.");
      } finally {
        setLoading(false);
      }
    };
    loadExamen();
  }, [examenId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">{error}</h3>
        <Button onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la lista
        </Button>
      </div>
    );
  }

  if (!examen) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Examen no encontrado</h3>
        <Button onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la lista
        </Button>
      </div>
    );
  }

  // 🛠️ Solución: preparar contenido con saltos de línea para Markdown
  let formattedContent = '';
  
  if (typeof examen.content === 'string') {
    formattedContent = examen.content
      .replace(/\\n/g, '\n') // Escapes dobles
      .replace(/([^\n])\n(?=[^\n])/g, '$1\n\n'); // Asegura párrafos dobles
  } else if (typeof examen.content === 'object' && examen.content !== null) {
    // Manejar el nuevo formato JSON
    if (examen.content.examen_contenido && examen.content.hoja_de_respuestas) {
      formattedContent = examen.content.examen_contenido + '\n\n---\n\n' + examen.content.hoja_de_respuestas;
    } else {
      formattedContent = JSON.stringify(examen.content, null, 2);
    }
  } else {
    formattedContent = 'Contenido no disponible';
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{examen.title || 'Examen sin título'}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Detalles del examen</p>
        </div>
      </div>

      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Materia</label>
            <p className="text-md text-gray-800 dark:text-gray-200">{examen.subject || "No especificada"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Creación</label>
            <p className="text-md text-gray-800 dark:text-gray-200 flex items-center gap-1">
              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              {new Date(examen.created_at).toLocaleDateString("es-MX", { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Última Actualización</label>
            <p className="text-md text-gray-800 dark:text-gray-200 flex items-center gap-1">
              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              {new Date(examen.updated_at).toLocaleDateString("es-MX", { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contenido Principal del Examen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileTextIcon className="h-5 w-5" />
            Contenido del Examen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
            <div className="prose dark:prose-invert max-w-none text-sm">
              <ReactMarkdown>{formattedContent}</ReactMarkdown>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-start">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la lista
        </Button>
      </div>
    </div>
  );
}

export default ViewExamen;
