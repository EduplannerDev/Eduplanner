import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { Button } from "@/components/ui/button"
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
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';


interface VisualizarExamenProps {
  examenContent: string;
  onBack: () => void;
  onSave: (content: string, title: string, subject: string) => void;
  onSaveSuccess?: () => void;
}

const VisualizarExamen: React.FC<VisualizarExamenProps> = ({ examenContent, onBack, onSave, onSaveSuccess }) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState('');

  const processExamContent = (content: string) => {
    // Intentar parsear como JSON primero
    try {
      const examData = JSON.parse(content);
      if (examData.examen_contenido && examData.hoja_de_respuestas) {
        return {
          examContent: examData.examen_contenido,
          answerSheet: examData.hoja_de_respuestas,
          isStructured: true
        };
      }
    } catch (error) {
      // Si no es JSON válido, buscar JSON dentro del texto
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const examData = JSON.parse(jsonMatch[0]);
          if (examData.examen_contenido && examData.hoja_de_respuestas) {
            return {
              examContent: examData.examen_contenido,
              answerSheet: examData.hoja_de_respuestas,
              isStructured: true
            };
          }
        } catch (innerError) {
          // Continuar con el procesamiento normal
        }
      }
    }
    
    // Procesamiento normal para texto
    const processedContent = content
      .replace(/\\n/g, '\n')
      .replace(/([^\n])\n(?=[^\n])/g, '$1\n\n');
    
    return {
      examContent: processedContent,
      answerSheet: null,
      isStructured: false
    };
  };

  const { examContent, answerSheet, isStructured } = processExamContent(examenContent);

  const handleSaveClick = () => {
    setShowSaveModal(true);
  };

  const handleConfirmSave = () => {
    onSave(examenContent, examTitle, examSubject);
    setShowSaveModal(false);
    setExamTitle('');
    setExamSubject('');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Examen Generado</h1>
      <div className="flex space-x-2 mb-4">
        <Button onClick={onBack} variant="outline">Volver a Generar Examen</Button>
        <Button onClick={handleSaveClick}>Guardar Examen</Button>
        {onSaveSuccess && (
          <Button onClick={onSaveSuccess}>Ver Exámenes Guardados</Button>
        )}
      </div>
      {isStructured ? (
        <div className="space-y-6">
          {/* Contenido del Examen */}
          <div className="border p-4 rounded-lg shadow-sm prose max-w-none">
            <h2 className="text-xl font-semibold mb-3 text-primary">📝 Examen</h2>
            <ReactMarkdown>{examContent}</ReactMarkdown>
          </div>
          
          {/* Hoja de Respuestas */}
          {answerSheet && (
            <div className="border p-4 rounded-lg shadow-sm prose max-w-none bg-muted/50">
              <h2 className="text-xl font-semibold mb-3 text-primary">✅ Hoja de Respuestas</h2>
              <ReactMarkdown>{answerSheet}</ReactMarkdown>
            </div>
          )}
        </div>
      ) : (
        <div className="border p-4 rounded-lg shadow-sm prose max-w-none">
          <ReactMarkdown>{examContent}</ReactMarkdown>
        </div>
      )}

      <AlertDialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Guardar Examen</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor, introduce un título y una descripción para el examen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="examTitle"
              placeholder="Título del examen"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="col-span-3"
            />
            <Input
              id="examSubject"
              placeholder="Descripción del examen (Materia, Grado, etc.)"
              value={examSubject}
              onChange={(e) => setExamSubject(e.target.value)}
              className="col-span-3"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setShowSaveModal(false)}>Cancelar</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleConfirmSave} disabled={!examTitle || !examSubject}>Guardar</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VisualizarExamen;
