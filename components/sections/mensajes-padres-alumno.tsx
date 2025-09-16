"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, MessageSquare, Calendar, User, Copy, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
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

interface MensajesPadresAlumnoProps {
  onBack: () => void
  studentId: string
  studentName: string
}

interface ParentMessage {
  id: string
  title: string
  content: string
  message_type: string
  created_at: string
  alumno_id: string
}

export function MensajesPadresAlumno({ onBack, studentId, studentName }: MensajesPadresAlumnoProps) {
  const [messages, setMessages] = useState<ParentMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user?.id && studentId) {
      fetchMessages()
    }
  }, [user?.id, studentId])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      
      // Obtener la sesión de autenticación
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Sesión expirada')
        return
      }

      const response = await fetch(`/api/parent-messages?user_id=${user?.id}&student_id=${studentId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Error al cargar los mensajes')
      }
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar los mensajes para padres')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Mensaje copiado al portapapeles")
  }

  const deleteMessage = async (messageId: string) => {
    try {
      setDeletingId(messageId)
      const response = await fetch(`/api/delete-message`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId, userId: user?.id }),
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el mensaje')
      }

      setMessages(messages.filter(msg => msg.id !== messageId))
      toast.success('Mensaje eliminado exitosamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar el mensaje')
    } finally {
      setDeletingId(null)
    }
  }

  const getCategoryColor = (messageType: string) => {
    switch (messageType.toLowerCase()) {
      case 'academico':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'conducta':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'felicitaciones':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'citatorios':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Mensajes para Padres</h1>
          <p className="text-muted-foreground">Estudiante: {studentName}</p>
        </div>
      </div>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mensajes Generados
          </CardTitle>
          <CardDescription>
            Historial de mensajes generados para los padres de {studentName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay mensajes</h3>
              <p className="text-muted-foreground">
                Aún no se han generado mensajes para los padres de este estudiante.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {messages.map((message) => (
                  <Card key={message.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{message.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(message.created_at), "PPP 'a las' p", { locale: es })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(message.message_type)}>
                  {message.message_type}
                </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(message.content)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={deletingId === message.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar mensaje?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El mensaje será eliminado permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMessage(message.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}