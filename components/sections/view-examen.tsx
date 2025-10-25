"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, BookOpen, Loader2, FileText as FileTextIcon, CheckSquare } from "lucide-react"
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
        return false
      }
    }

    const handleContextMenu = (e: Event) => {
      e.preventDefault()
      return false
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

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

  // 🛠️ Preparar contenido separando examen y hoja de respuestas
  let examenContent = '';
  let hojaRespuestas = '';
  let hasStructuredContent = false;
  
  if (typeof examen.content === 'string') {
    // Intentar separar por el separador ---
    if (examen.content.includes('---')) {
      const parts = examen.content.split('---');
      examenContent = parts[0]?.trim() || '';
      hojaRespuestas = parts[1]?.trim() || '';
      hasStructuredContent = true;
    } else {
      // Si no hay separador, buscar patrones comunes más amplios
      const responsePatterns = [
        /(?=Clave de Respuestas)/i,
        /(?=Hoja de Respuestas)/i,
        /(?=Respuestas)/i,
        /(?=RESPUESTAS)/i,
        /(?=Sección \d+: Opción Múltiple)/i,
        /(?=Sección \d+: Verdadero o Falso)/i,
        /(?=Sección \d+: Problemas)/i,
        /(?=Sección \d+:)/i
      ];
      
      let found = false;
      for (const pattern of responsePatterns) {
        const sections = examen.content.split(pattern);
        if (sections.length > 1) {
          examenContent = sections[0].trim();
          hojaRespuestas = sections.slice(1).join('').trim();
          hasStructuredContent = true;
          found = true;
          break;
        }
      }
      
      if (!found) {
        examenContent = examen.content.replace(/\\n/g, '\n').replace(/([^\n])\n(?=[^\n])/g, '$1\n\n');
      }
    }
  } else if (typeof examen.content === 'object' && examen.content !== null) {
    // Manejar el nuevo formato JSON estructurado
    if (examen.content.examen_contenido && examen.content.hoja_de_respuestas) {
      examenContent = examen.content.examen_contenido;
      hojaRespuestas = examen.content.hoja_de_respuestas;
      hasStructuredContent = true;
    } else {
      examenContent = JSON.stringify(examen.content, null, 2);
    }
  } else {
    examenContent = 'Contenido no disponible';
  }

  return (
    <div 
      className="space-y-6 max-w-4xl mx-auto p-2 sm:p-4 md:p-6 select-none w-full overflow-hidden"
      style={{ 
        userSelect: 'none', 
        WebkitUserSelect: 'none', 
        MozUserSelect: 'none', 
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        {/* Botón Volver - Solo visible en desktop */}
        <Button variant="default" size="icon" onClick={onBack} aria-label="Volver" className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 break-words leading-tight">{examen.title || 'Examen sin título'}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Detalles del examen</p>
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
          <CardTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent 
          className="space-y-3 select-none"
          style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        >
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Materia</label>
            <p 
              className="text-md text-gray-800 dark:text-gray-200 select-none"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
              onContextMenu={(e) => e.preventDefault()}
            >
              {examen.subject || "No especificada"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Creación</label>
            <p 
              className="text-md text-gray-800 dark:text-gray-200 flex items-center gap-1 select-none"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              {new Date(examen.created_at).toLocaleDateString("es-MX", { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Última Actualización</label>
            <p 
              className="text-md text-gray-800 dark:text-gray-200 flex items-center gap-1 select-none"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              {new Date(examen.updated_at).toLocaleDateString("es-MX", { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contenido del Examen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileTextIcon className="h-5 w-5" />
            Contenido del Examen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-lg border dark:border-gray-700 select-none w-full overflow-hidden"
            style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
          >
            <div 
              className="prose dark:prose-invert max-w-none text-sm select-none w-full overflow-hidden break-words exam-content-mobile"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', wordWrap: 'break-word', overflowWrap: 'break-word' }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              <ReactMarkdown>{examenContent}</ReactMarkdown>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hoja de Respuestas - Solo mostrar si existe */}
      {hasStructuredContent && hojaRespuestas && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CheckSquare className="h-5 w-5" />
              Hoja de Respuestas
            </CardTitle>
          </CardHeader>
          <CardContent>
          <div 
            className="bg-emerald-50 dark:bg-emerald-900/20 p-3 sm:p-4 md:p-6 rounded-lg border border-emerald-200 dark:border-emerald-800 select-none w-full overflow-hidden"
            style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
          >
            <div 
              className="prose dark:prose-invert max-w-none text-sm select-none w-full overflow-hidden break-words exam-content-mobile"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', wordWrap: 'break-word', overflowWrap: 'break-word' }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              <ReactMarkdown>{hojaRespuestas}</ReactMarkdown>
            </div>
          </div>
          </CardContent>
        </Card>
      )}

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
