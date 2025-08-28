'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getPlaneaciones } from '@/lib/planeaciones';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import VisualizarExamen from './visualizar-examen';
import { Button } from "@/components/ui/button";
import { createExamen } from '@/lib/examenes';
import { useRouter } from 'next/navigation';

interface GenerarExamenProps {
  onBack: () => void;
  onSaveSuccess?: () => void;
}

const removeAsterisks = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.replace(/\*/g, '');
};

export const GenerarExamen: React.FC<GenerarExamenProps> = ({ onBack, onSaveSuccess }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [planeaciones, setPlaneaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaneaciones, setSelectedPlaneaciones] = useState<string[]>([]);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [examenGenerado, setExamenGenerado] = useState<string | null>(null);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);


  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 9;

  useEffect(() => {
    const fetchPlaneaciones = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedPlaneaciones = await getPlaneaciones(user.id, currentPage, perPage);
        setPlaneaciones(fetchedPlaneaciones.data);
      } catch (err) {
        console.error("Error fetching planeaciones:", err);
        setError("No se pudieron cargar las planeaciones.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlaneaciones();
  }, [user, currentPage]);

  const handleSelectPlaneacion = (id: string) => {
    setSelectedPlaneaciones((prevSelected) =>
      prevSelected.includes(id) ? prevSelected.filter((pId) => pId !== id) : [...prevSelected, id]
    );
  };

  const handleGenerarExamenClick = () => {
    setShowInstructionsModal(true);
  };

  const handleConfirmGenerarExamen = async () => {
    if (selectedPlaneaciones.length === 0) return;

    setIsGeneratingExam(true); // 🔄 loader ON

    const planeacionesToSend = planeaciones.filter(p => selectedPlaneaciones.includes(p.id));

    try {
      const response = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Genera un examen basado en las siguientes planeaciones didácticas:\n\n${planeacionesToSend.map(p => p.contenido).join('\n\n')}\n\nInstrucciones adicionales: ${additionalInstructions}`,
            },
          ],
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let rawText = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        rawText += decoder.decode(value);
      }

      let cleanedText = rawText
        .replace(/^f:{.*}\n/, '')
        .replace(/\ne:{.*}\nd:{.*}$/, '');

      const matches = [...cleanedText.matchAll(/^0:"(.*)"$/gm)];
      const merged = matches.map((m) => m[1]).join('');

      let finalText = '';
      try {
        finalText = JSON.parse(`"${merged}"`);
        
        // Intentar parsear como JSON para el nuevo formato
        try {
          const examData = JSON.parse(finalText);
          if (examData.examen_contenido && examData.hoja_de_respuestas) {
            // Nuevo formato JSON: mantener el JSON completo para procesamiento posterior
            finalText = finalText; // Mantener el JSON original
          }
        } catch (jsonError) {
          // Si no es JSON válido, intentar extraer JSON del texto
          const jsonMatch = finalText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const examData = JSON.parse(jsonMatch[0]);
              if (examData.examen_contenido && examData.hoja_de_respuestas) {
                finalText = jsonMatch[0]; // Usar solo el JSON extraído
              }
            } catch (innerError) {
              console.log("Usando formato de texto anterior");
            }
          }
        }
      } catch (e) {
        console.error("Error al decodificar el texto:", e);
        finalText = merged;
      }

      setExamenGenerado(finalText);
    } catch (error) {
      console.error("Error al generar el examen:", error);
    } finally {
      setIsGeneratingExam(false); // 🔄 loader OFF
      setShowInstructionsModal(false);
      setAdditionalInstructions('');
    }
  };

  const handleSaveExamen = async (examenContent: string, title: string, subject: string) => {
    if (!onSaveSuccess) return;
    if (!user?.id) {
      console.error("User not authenticated.");
      return;
    }

    try {
      // Intentar parsear el contenido como JSON para el nuevo formato
      let contentToSave: any = examenContent;
      try {
        const examData = JSON.parse(examenContent);
        if (examData.examen_contenido && examData.hoja_de_respuestas) {
          // Es el nuevo formato JSON, guardarlo como objeto
          contentToSave = examData;
        }
      } catch (jsonError) {
        // Si no es JSON válido, guardar como string (formato anterior)
        contentToSave = examenContent;
      }
      const newExamen = await createExamen({
        owner_id: user.id,
        content: contentToSave,
        title: title,
        subject: subject,
        is_public: false,
        shared_with: null,
      });

      if (newExamen) {
        alert("Examen guardado exitosamente!");
        onSaveSuccess();
      } else {
        throw new Error("Error al guardar el examen en la base de datos.");
      }
    } catch (error) {
      console.error("Error al guardar el examen:", error);
      alert("Error al guardar el examen.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        <p>{error}</p>
      </div>
    );
  }

  if (examenGenerado) {
    return (
      <VisualizarExamen
        examenContent={examenGenerado}
        onBack={() => setExamenGenerado(null)}
        onSave={(content, title, subject) => handleSaveExamen(content, title, subject)}
        onSaveSuccess={onSaveSuccess}
      />
    );
  }

  return (
    
    <div className="p-4">

         <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md mb-6 shadow">
      <div className="flex items-center space-x-2">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="font-semibold">Funcionalidad en fase de pruebas</p>
          <p className="text-sm">
            La generación automática de exámenes aún está en desarrollo. Los resultados pueden no ser los esperados.
            Te recomendamos revisar cuidadosamente el contenido generado antes de utilizarlo.
          </p>
        </div>
      </div>
    </div>
    
      <h1 className="text-2xl font-bold mb-2">Selecciona Planeaciones para Generar Examen</h1>
      <p className="text-sm text-gray-600 mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300">
        💡 Al seleccionar varias planeaciones, se generará un examen que integre los temas de todas ellas, ideal para evaluaciones bimestrales o finales.
      </p>
      <Button onClick={onBack} className="mb-4">Volver a Mis Exámenes</Button>

      {planeaciones.length === 0 ? (
        <p>No tienes planeaciones para seleccionar.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {planeaciones.map((planeacion) => (
              <div
                key={planeacion.id}
                className={`border p-4 rounded-lg shadow-sm cursor-pointer ${selectedPlaneaciones.includes(planeacion.id) ? 'border-blue-500 ring-2 ring-blue-500' : ''}`}
                onClick={() => handleSelectPlaneacion(planeacion.id)}
              >
                <h2 className="text-xl font-semibold">{removeAsterisks(planeacion.titulo) || 'Planeación sin título'}</h2>
                <p className="text-sm text-gray-600">Materia: {removeAsterisks(planeacion.materia) || 'N/A'}</p>
                <p className="text-sm text-gray-600">Creado: {new Date(planeacion.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          {/* Controles de paginación */}
          <div className="flex justify-center mt-6 space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="self-center px-2 text-sm text-gray-600">Página {currentPage}</span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={planeaciones.length < perPage}
            >
              Siguiente
            </Button>
          </div>
        </>
      )}

      <Button
        className="mt-4"
        disabled={selectedPlaneaciones.length === 0}
        onClick={handleGenerarExamenClick}
      >
        Generar Examen con {selectedPlaneaciones.length} Planeación(es)
      </Button>

      <AlertDialog open={showInstructionsModal} onOpenChange={setShowInstructionsModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Instrucciones Adicionales para el Examen</AlertDialogTitle>
            <AlertDialogDescription>
              Puedes añadir cualquier instrucción o requisito adicional para la generación del examen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Escribe tus instrucciones adicionales aquí..."
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            rows={5}
          />
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowInstructionsModal(false)}>Cancelar</Button>
            <Button onClick={handleConfirmGenerarExamen} disabled={isGeneratingExam}>
              {isGeneratingExam ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                "Generar Examen"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GenerarExamen;
