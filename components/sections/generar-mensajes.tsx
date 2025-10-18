"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, Bot, User, Loader2, MessageSquare, AlertCircle, Save, CheckCircle, Copy, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useUserData } from "@/hooks/use-user-data"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useChat } from "ai/react"
import { toast } from "sonner"

interface GenerarMensajesProps {
  onBack: () => void
  onNavigateToMessages: () => void
}

export function GenerarMensajes({ onBack, onNavigateToMessages }: GenerarMensajesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [selectedTone, setSelectedTone] = useState("Formal y Profesional")
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/generate-messages",
    body: {
      tone: selectedTone
    },
    onFinish: (message) => {
      if (message.content.includes("**")) {
        const titleMatch = message.content.match(/\*\*(.*?)\*\*/);
        const title = titleMatch ? titleMatch[1] : "Mensaje Personalizado";
        const category = title.toLowerCase().includes("conducta") ? "conducta" :
                        title.toLowerCase().includes("rendimiento") ? "academico" :
                        title.toLowerCase().includes("felicit") ? "felicitaciones" :
                        title.toLowerCase().includes("citar") ? "citatorios" : "otros";
        
        setMessageToSave({
          title,
          content: message.content,
          category
        });
      }
    },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: `¡Hola! 👋 Soy tu asistente para generar mensajes educativos.

Estoy aquí para ayudarte a crear mensajes profesionales y efectivos para comunicarte con padres de familia sobre diversos temas relacionados con sus hijos.

Puedes pedirme ayuda para crear mensajes sobre:
• Conducta y comportamiento en clase
• Rendimiento académico
• Participación en actividades
• Tareas y responsabilidades
• Felicitaciones y reconocimientos
• Citatorios para reuniones
• Comunicados generales

¿Sobre qué tema te gustaría crear un mensaje hoy? ✨`,
      },
    ],
  })

  const [generatedMessage, setGeneratedMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [messageToSave, setMessageToSave] = useState<{
    title: string;
    content: string;
    category: string;
  } | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState("")
  const [messageToEdit, setMessageToEdit] = useState<{
    content: string;
    category: string;
  } | null>(null)
  const [whatsappMessage, setWhatsappMessage] = useState<string>("") 
  const [isAdaptingForWhatsapp, setIsAdaptingForWhatsapp] = useState(false)

  const { user } = useAuth()
  const { userData } = useUserData(user?.id)

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      // Usar setTimeout para evitar conflictos con React
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }, [messages])

  // Nota: Regeneración automática removida para evitar peticiones excesivas
  // Los usuarios ahora deben regenerar manualmente cuando cambien el tono

  const handleQuickSuggestion = (suggestion: string) => {
    const event = {
      target: { value: suggestion },
    } as React.ChangeEvent<HTMLTextAreaElement>

    handleInputChange(event)

    setTimeout(() => {
      const form = document.querySelector("form") as HTMLFormElement
      if (form) {
        form.requestSubmit()
      }
    }, 100)
  }


  const handleSaveMessage = async (messageData?: {
    title: string;
    content: string;
    category: string;
  }) => {
    const dataToSave = messageData || messageToSave;
    if (!dataToSave || !user?.id) return;
    
    setIsSaving(true);
    try {
      const response = await fetch("/api/save-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          ...dataToSave,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar el mensaje");
      }

      toast.success("Mensaje guardado exitosamente");
      setMessageToSave(null);
      setIsDialogOpen(false);
      onNavigateToMessages();
    } catch (error) {
      toast.error("Error al guardar el mensaje");
      console.error("Error al guardar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Mensaje copiado al portapapeles")
  }

  const adaptForWhatsapp = async (originalMessage: string) => {
    setIsAdaptingForWhatsapp(true)
    try {
      const response = await fetch("/api/adapt-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalMessage,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al adaptar el mensaje para WhatsApp")
      }

      const data = await response.json()
      setWhatsappMessage(data.adaptedMessage)
      toast.success("Mensaje adaptado para WhatsApp")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al adaptar el mensaje para WhatsApp")
    } finally {
      setIsAdaptingForWhatsapp(false)
    }
  }

  const quickSuggestions = [
    "Necesito un mensaje para hablar con los padres sobre la conducta disruptiva de un estudiante",
    "Quiero felicitar a los padres por el excelente rendimiento de su hijo",
    "Crear un mensaje para citar a los padres por bajo rendimiento académico",
    "Mensaje para informar sobre la falta de participación en clase",
    "Comunicar sobre tareas no entregadas de manera frecuente",
    "Felicitar por la mejora en el comportamiento del estudiante",
    "Invitar a los padres a una reunión para hablar sobre el progreso",
    "Mensaje sobre la necesidad de apoyo adicional en casa"
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full dark:text-gray-100">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 select-none">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            Generar Mensajes con IA
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 select-none">
            Crea mensajes profesionales para comunicarte con padres de familia
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Chat Container */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                Asistente de Mensajes Educativos
              </CardTitle>
              <CardDescription className="select-none">
                Describe la situación y te ayudo a crear el mensaje perfecto
              </CardDescription>
            </CardHeader>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
              <ScrollArea className="h-full dark:bg-gray-800 dark:border-gray-700">
                <div className="p-4 space-y-4 dark:bg-gray-800 dark:border-gray-700">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[85%] rounded-lg p-3 break-words dark:bg-gray-900 dark:border-gray-500 ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900 dark:text-gray-100 border border-gray-200"
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm leading-relaxed select-none dark:bg-gray-900 dark:border-gray-500">
                          {message.content}
                        </div>
                        {message.role === "assistant" && message.id !== "welcome" && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(message.content)}
                                className="text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar mensaje
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const titleMatch = message.content.match(/\*\*(.*?)\*\*/);
                                  const title = titleMatch ? titleMatch[1] : "Mensaje Personalizado";
                                  const category = title.toLowerCase().includes("conducta") ? "conducta" :
                                                  title.toLowerCase().includes("rendimiento") ? "academico" :
                                                  title.toLowerCase().includes("felicit") ? "felicitaciones" :
                                                  title.toLowerCase().includes("citar") ? "citatorios" : "otros";
                                  
                                  setEditingTitle(title);
                                  setMessageToEdit({
                                    content: message.content,
                                    category
                                  });
                                  setIsDialogOpen(true);
                                }}
                                disabled={isSaving}
                                className="text-xs"
                              >
                                {isSaving ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Guardando...
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-3 w-3 mr-1" />
                                    Guardar mensaje
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => adaptForWhatsapp(message.content)}
                                disabled={isAdaptingForWhatsapp}
                                className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                              >
                                {isAdaptingForWhatsapp ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Adaptando...
                                  </>
                                ) : (
                                  <>
                                    📲
                                    <span className="ml-1">Adaptar para WhatsApp</span>
                                  </>
                                )}
                              </Button>
                            </div>
                            {whatsappMessage && (
                              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium text-green-700 dark:text-green-300">📲 Versión para WhatsApp:</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(whatsappMessage)}
                                    className="text-xs h-6 px-2 text-green-600 hover:text-green-700"
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copiar
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setWhatsappMessage("")}
                                    className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                                  {(() => {
                                    try {
                                      const parsed = JSON.parse(whatsappMessage)
                                      return parsed.resumen_whatsapp || whatsappMessage
                                    } catch {
                                      return whatsappMessage
                                    }
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {message.role === "user" && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={userData?.avatar_url || user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">{user?.email ? getInitials(user.email) : "U"}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 text-gray-900 dark:text-gray-100 border border-gray-200 dark:bg-gray-700 dark:border-gray-600 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Generando mensaje...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Input Area */}
            <div className="border-t p-4 flex-shrink-0">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Selector de Tono */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tono del Mensaje:</label>
                  <div className="flex gap-2 flex-wrap">
                    {["Formal y Profesional", "Cercano y Amistoso", "Breve y Directo"].map((tone) => {
                      const getSelectedStyles = () => {
                        switch (tone) {
                          case "Formal y Profesional":
                            return "bg-green-600 text-white border-green-600";
                          case "Cercano y Amistoso":
                            return "bg-orange-600 text-white border-orange-600";
                          case "Breve y Directo":
                            return "bg-purple-600 text-white border-purple-600";
                          default:
                            return "bg-blue-600 text-white border-blue-600";
                        }
                      };
                      
                      return (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => setSelectedTone(tone)}
                          className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                            selectedTone === tone
                              ? getSelectedStyles()
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                          }`}
                        >
                          {tone}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Describe la situación para la que necesitas crear un mensaje..."
                  disabled={isLoading}
                  className="min-h-[80px] resize-none"
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 select-none">
                    💡 Tip: Sé específico sobre la situación y el tono que deseas
                  </p>
                  <Button type="submit" disabled={isLoading || !input.trim()}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {isLoading ? "Generando..." : "Generar"}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-lg select-none">Sugerencias Rápidas</CardTitle>
              <CardDescription className="select-none">
                Haz clic para usar una plantilla
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-3 pr-2">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Tipos de mensaje:</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Conducta</Badge>
                      <Badge variant="secondary">Académico</Badge>
                      <Badge variant="secondary">Felicitaciones</Badge>
                      <Badge variant="secondary">Citatorios</Badge>
                    </div>
                  </div>
                  
                  {quickSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full text-left h-auto p-3 justify-start whitespace-normal dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                      onClick={() => handleQuickSuggestion(suggestion)}
                      disabled={isLoading}
                    >
                      <div className="text-sm leading-relaxed">{suggestion}</div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Diálogo para editar título */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar Mensaje</DialogTitle>
            <DialogDescription>
              Ingresa un título descriptivo para identificar fácilmente este mensaje
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Título del mensaje
              </label>
              <Input
                id="title"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder="Ej: Felicitación por excelente rendimiento"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (messageToEdit) {
                  handleSaveMessage({
                    title: editingTitle,
                    content: messageToEdit.content,
                    category: messageToEdit.category
                  });
                  setIsDialogOpen(false);
                }
              }}
              disabled={!editingTitle.trim() || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
