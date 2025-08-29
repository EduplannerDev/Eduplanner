"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Copy, Plus, Loader2, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { getMessagesByUser, deleteMessage as deleteMessageLib, type Message } from "@/lib/messages"
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


interface MisMensajesProps {
  onCreateNew: () => void
}

export function MisMensajes({ onCreateNew }: MisMensajesProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const messagesPerPage = 9
  const { user } = useAuth()

  // Calcular mensajes para la página actual
  const indexOfLastMessage = currentPage * messagesPerPage
  const indexOfFirstMessage = indexOfLastMessage - messagesPerPage
  const currentMessages = messages.slice(indexOfFirstMessage, indexOfLastMessage)
  const totalPages = Math.ceil(messages.length / messagesPerPage)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }
      
      try {
        const data = await getMessagesByUser(user.id)
        setMessages(data)
      } catch (error) {
        toast.error("Error al cargar los mensajes")
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [user?.id])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Mensaje copiado al portapapeles")
    } catch (err) {
      toast.error("Error al copiar el mensaje")
      console.error("Error al copiar:", err)
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!user?.id) return
    
    setIsDeleting(messageId)
    try {
      const success = await deleteMessageLib(messageId)
      
      if (!success) throw new Error("Error al eliminar el mensaje")

      setMessages(messages.filter(msg => msg.id !== messageId))
      toast.success("Mensaje eliminado exitosamente")
      
      // Ajustar página si es necesario
      const newTotalPages = Math.ceil((messages.length - 1) / messagesPerPage)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      }
    } catch (error) {
      toast.error("Error al eliminar el mensaje")
      console.error(error)
    } finally {
      setIsDeleting(null)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "conducta":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "academico":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "felicitaciones":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "citatorios":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            Mis Mensajes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Mensajes guardados para comunicación con padres de familia
          </p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Mensaje
        </Button>
      </div>

        <Card className="text-center py-12">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <MessageSquare className="h-12 w-12 text-gray-400" />
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  No hay mensajes guardados
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Comienza creando un nuevo mensaje
                </p>
              </div>
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Mensaje
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {currentMessages.map((message) => (
                  <Card key={message.id} className="flex flex-col">
                    <CardHeader className="flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <Badge className={getCategoryColor(message.category)}>
                          {message.category.charAt(0).toUpperCase() + message.category.slice(1)}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(message.content)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isDeleting === message.id}
                              >
                                {isDeleting === message.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                )}
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
                                  onClick={() => deleteMessage(message.id!)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <CardTitle className="text-lg mt-2">{message.title}</CardTitle>
                      <CardDescription>
                        {new Date(message.created_at!).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ScrollArea className="h-[200px]">
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Información de paginación */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                Mostrando {indexOfFirstMessage + 1} - {Math.min(indexOfLastMessage, messages.length)} de {messages.length} mensajes
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
