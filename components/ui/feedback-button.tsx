'use client';

import React, { useState } from 'react';
import { Button } from './button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from './alert-dialog';
import { Textarea } from './textarea';
import { Input } from './input';
import { useAuth } from '@/hooks/use-auth';

interface FeedbackButtonProps {
  // Puedes añadir props si es necesario, por ejemplo, para configurar el destino de la retroalimentación
}

export function FeedbackButton({}: FeedbackButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackImage, setFeedbackImage] = useState<File | null>(null);
  const [feedbackType, setFeedbackType] = useState<string>('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('feedbackText', feedbackText);
    formData.append('feedbackType', feedbackType);
    if (user?.email) {
      formData.append('userEmail', user.email);
    }
    if (feedbackImage) {
      formData.append('feedbackImage', feedbackImage);
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setIsOpen(false);
        setShowSuccessAlert(true);
        setFeedbackText('');
        setFeedbackImage(null);
        setFeedbackType('');
      } else {
        console.error('Failed to send feedback:', response.statusText);
        alert('Error al enviar feedback. Hubo un problema al enviar tu mensaje. Por favor, inténtalo de nuevo.');
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      alert('Error al enviar feedback. Hubo un problema al enviar tu mensaje. Por favor, inténtalo de nuevo.');
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFeedbackImage(event.target.files[0]);
    }
  };

  // Solo mostrar el botón si el usuario está autenticado
  if (!user) {
    return null;
  }

  return (
    <>
      <Button
        className="fixed bottom-4 right-4 rounded-full p-3 sm:p-4 shadow-lg z-50 text-xs sm:text-sm max-w-[calc(100vw-2rem)] sm:max-w-none"
        onClick={() => setIsOpen(true)}
      >
        <span className="hidden sm:inline">💬 Envíanos tu feedback</span>
        <span className="sm:hidden">💬</span>
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¡Comparte tu feedback!</AlertDialogTitle>
            <AlertDialogDescription>
              Tu opinión es muy valiosa para nosotros. Ya sea una sugerencia, reporte de error o comentario, nos ayuda a mejorar la herramienta que necesitas. ¡Te leemos!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              <p className="text-sm font-medium">¿Sobre qué es tu retroalimentación?</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={feedbackType === 'bug' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeedbackType('bug')}
                  className="justify-start"
                >
                  🐞 Reportar un Error
                </Button>
                <Button
                  variant={feedbackType === 'feature' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeedbackType('feature')}
                  className="justify-start"
                >
                  💡 Sugerir una Función
                </Button>
                <Button
                  variant={feedbackType === 'question' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeedbackType('question')}
                  className="justify-start"
                >
                  ❓ Hacer una Pregunta
                </Button>
                <Button
                  variant={feedbackType === 'love' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeedbackType('love')}
                  className="justify-start"
                >
                  ❤️ Me Encanta
                </Button>
                <Button
                  variant={feedbackType === 'other' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeedbackType('other')}
                  className="justify-start col-span-2"
                >
                  ✍️ Otro
                </Button>
              </div>
            </div>
            <Textarea
              placeholder="¿Qué podemos hacer mejor para ti?"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={5}
            />
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </>
              ) : (
                'Enviar'
              )}
            </Button>
          </AlertDialogFooter>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Aunque no podemos responder a cada sugerencia individualmente, ten por seguro que leemos y valoramos todas.
          </p>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Alert Dialog */}
      <AlertDialog open={showSuccessAlert} onOpenChange={setShowSuccessAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-green-600">¡Gracias por tu ayuda! 🎉</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Hemos recibido tu mensaje. Revisamos cada una de las sugerencias para construir el futuro de Eduplanner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center">
            <Button onClick={() => setShowSuccessAlert(false)} className="bg-green-600 hover:bg-green-700">
              ¡Perfecto!
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}