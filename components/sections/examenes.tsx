import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getExamenesByOwner, getSharedExamenes, type Examen } from '@/lib/examenes';
// import { generateExamPDF } from '@/lib/pdf-generator'; // Importación dinámica para evitar errores SSR
import { Loader2, FileText as FileTextIcon, Calendar, Plus, Edit, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProfile } from "@/hooks/use-profile";
import { isUserPro } from "@/lib/subscription-utils";
import GenerarExamen from './generar-examen';
import ViewExamen from './view-examen';
import EditExamen from './edit-examen';

const Examenes = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerarExamen, setShowGenerarExamen] = useState(false);

  const [selectedExamenId, setSelectedExamenId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "view" | "edit">("list");

  const fetchExamenes = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ownedExamenes = await getExamenesByOwner(user.id);
      const sharedExamenesList = await getSharedExamenes(user.id);
      const combinedExamenes = [...ownedExamenes, ...sharedExamenesList];
      const uniqueExamenes = Array.from(new Map(combinedExamenes.map(examen => [examen.id, examen])).values());
      uniqueExamenes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setExamenes(uniqueExamenes);
    } catch (err) {
      console.error("Error fetching examenes:", err);
      setError("No se pudieron cargar los exámenes.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (viewMode === "list" && !showGenerarExamen) {
      fetchExamenes();
    }
  }, [viewMode, showGenerarExamen, fetchExamenes]);

  const handleViewExamen = (examenId: string) => {
    setSelectedExamenId(examenId);
    setViewMode("view");
  };

  const handleEditExamen = (examenId: string) => {
    setSelectedExamenId(examenId);
    setViewMode("edit");
  };

  const handleBackToList = () => {
    setSelectedExamenId(null);
    setViewMode("list");
  };
  
  const handleGenerarExamenSuccess = () => {
    setShowGenerarExamen(false);
    setViewMode("list");
  };

  const handleEditExamenSuccess = () => {
    setViewMode("list");
  };

  const handleDownloadPDF = (examen: Examen, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      // Importación dinámica para evitar errores SSR
      import('@/lib/pdf-generator').then(({ generateExamPDF }) => {
        generateExamPDF(examen);
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta de nuevo.');
    }
  };

  const handleDownloadAnswerSheet = (examen: Examen, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      // Verificar si el examen tiene hoja de respuestas
      let hasAnswerSheet = false;
      if (typeof examen.content === 'object' && examen.content !== null) {
        hasAnswerSheet = !!(examen.content.hoja_de_respuestas);
      }
      
      if (!hasAnswerSheet) {
        alert('Este examen no tiene hoja de respuestas disponible.');
        return;
      }
      
      // Generar solo la hoja de respuestas
      import('@/lib/pdf-generator').then(({ generateAnswerSheetPDF }) => {
        generateAnswerSheetPDF(examen, examen.content.hoja_de_respuestas);
      });
    } catch (error) {
      console.error('Error generando hoja de respuestas:', error);
      alert('Error al generar la hoja de respuestas. Por favor, intenta de nuevo.');
    }
  };

  const hasAnswerSheet = (examen: Examen): boolean => {
    
    if (typeof examen.content === 'object' && examen.content !== null) {
      return !!(examen.content.hoja_de_respuestas);
    }
    return false;
  };

  if (loading && viewMode === "list" && !showGenerarExamen) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error && viewMode === "list" && !showGenerarExamen) {
    return (
      <div className="text-red-500 text-center p-4">
        <p>{error}</p>
        <Button onClick={fetchExamenes} className="mt-2">Reintentar</Button>
      </div>
    );
  }

  if (showGenerarExamen) {
    return (
      <GenerarExamen
        onBack={() => {
          setShowGenerarExamen(false);
          setViewMode("list");
        }}
        onSaveSuccess={handleGenerarExamenSuccess}
      />
    );
  }

  if (viewMode === "view" && selectedExamenId) {
    return (
      <ViewExamen
        examenId={selectedExamenId}
        onBack={handleBackToList}
      />
    );
  }

  if (viewMode === "edit" && selectedExamenId) {
    return (
      <EditExamen
        examenId={selectedExamenId}
        onBack={handleBackToList}
        onSaveSuccess={handleEditExamenSuccess}
      />
    );
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Mis Exámenes</h1>
          <p className="text-gray-600 mt-2">Gestiona y edita tus exámenes</p>
        </div>
        <Button onClick={() => setShowGenerarExamen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Examen
        </Button>
      </div>

      {examenes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No tienes exámenes aún</h3>
            <p className="text-gray-600 mb-4">Comienza creando tu primer examen</p>
            <Button onClick={() => setShowGenerarExamen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Examen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {examenes.map((examen) => (
            <Card 
              key={examen.id} 
              className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => handleViewExamen(examen.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg dark:text-gray-100">{examen.title || 'Examen sin título'}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2 dark:text-gray-300">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(examen.created_at).toLocaleDateString("es-MX")}
                      </span>
                      {examen.subject && <span className="dark:text-gray-300">{examen.subject}</span>}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {examen.subject && <Badge variant="outline" className="dark:text-gray-100 dark:border-gray-700">{examen.subject}</Badge>}
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Examen generado
                    </span>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => handleEditExamen(examen.id)}>
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
                        <DropdownMenuItem onClick={(e) => handleDownloadPDF(examen, e)}>
                          Descargar como PDF
                        </DropdownMenuItem>
                        {hasAnswerSheet(examen) && profile && isUserPro(profile) && (
                          <DropdownMenuItem onClick={(e) => handleDownloadAnswerSheet(examen, e)}>
                            Descargar Hoja de Respuestas
                          </DropdownMenuItem>
                        )}
                        {hasAnswerSheet(examen) && (!profile || !isUserPro(profile)) && (
                          <DropdownMenuItem disabled className="text-gray-500 dark:text-gray-400">
                            Hoja de Respuestas (Solo Pro)
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Examenes;