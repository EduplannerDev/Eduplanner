import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, Bot, User, Loader2, MessageSquare, AlertCircle, Save, CheckCircle, Copy, X, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useUserData } from "@/hooks/use-user-data"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useChat } from "ai/react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase"

interface GenerarMensajesPadresProps {
  onBack: () => void
  onNavigateToMessages: () => void
  preselectedStudent?: {
    id: string
    nombre: string
    grupo: string
    grado: string
    nivel: string
    nombre_padre: string
    correo_padre: string
    telefono_padre: string
    nombre_madre: string
    correo_madre: string
    telefono_madre: string
  }
}

interface Alumno {
  id: string
  nombre_completo: string
  numero_lista: number
  grupo: string
  grado: string
  nivel: string
  ciclo_escolar: string
  nombre_padre?: string
  correo_padre?: string
  telefono_padre?: string
  nombre_madre?: string
  correo_madre?: string
  telefono_madre?: string
  notas_generales?: string
}

export function GenerarMensajesPadres({ onBack, onNavigateToMessages, preselectedStudent }: GenerarMensajesPadresProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [selectedTone, setSelectedTone] = useState("Formal y Profesional")
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [students, setStudents] = useState<Alumno[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  
  const { user } = useAuth()
  const { userData } = useUserData(user?.id)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/generate-parent-messages",
    body: {
      tone: selectedTone,
      studentId: selectedStudent,
      studentInfo: selectedStudent ? students.find(s => s.id === selectedStudent) : null,
      teacherInfo: userData || null
    },
    onFinish: (message) => {
      if (message.content.includes("**")) {
        const titleMatch = message.content.match(/\*\*(.*?)\*\*/);
        const title = titleMatch ? titleMatch[1] : "Mensaje para Padres";
        const category = title.toLowerCase().includes("conducta") ? "conducta" :
                        title.toLowerCase().includes("rendimiento") ? "academico" :
                        title.toLowerCase().includes("felicit") ? "felicitaciones" :
                        title.toLowerCase().includes("citar") ? "citatorios" : "padres";
        
        setMessageToSave({
          title,
          content: message.content,
          category,
          student_id: selectedStudent
        });
      }
    },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: `¡Hola! 👋 Soy tu asistente para generar mensajes personalizados para padres de familia.

Estoy aquí para ayudarte a crear mensajes profesionales y efectivos utilizando la información específica de tus estudiantes y sus padres.

**Para comenzar:**
1. Selecciona un estudiante de la lista
2. Describe la situación o motivo del mensaje
3. Elige el tono apropiado

Puedo crear mensajes sobre:
• Rendimiento académico específico del estudiante
• Comportamiento y conducta en clase
• Participación y actitudes
• Tareas y responsabilidades
• Felicitaciones personalizadas
• Citatorios para reuniones
• Comunicados con información del estudiante

¿Qué tipo de mensaje necesitas crear hoy? ✨`,
      },
    ],
  })

  const [generatedMessage, setGeneratedMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [messageToSave, setMessageToSave] = useState<{
    title: string;
    content: string;
    category: string;
    student_id?: string;
  } | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState("")
  const [messageToEdit, setMessageToEdit] = useState<{
    content: string;
    category: string;
    student_id?: string;
  } | null>(null)
  const [whatsappMessage, setWhatsappMessage] = useState<string>("") 
  const [isAdaptingForWhatsapp, setIsAdaptingForWhatsapp] = useState(false)

  const supabase = createClient()

  // Cargar estudiantes
  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.id) return
      
      try {
        // Primero obtener los grupos del usuario usando la función que funciona
        const { getGruposByOwner } = await import('@/lib/grupos')
        const userGroups = await getGruposByOwner(user.id)
        
        if (!userGroups || userGroups.length === 0) {
          setStudents([])
          return
        }
        
        const groupIds = userGroups.map(g => g.id)
        
        // Luego obtener los alumnos de esos grupos
        const { data, error } = await supabase
          .from('alumnos')
          .select(`
            id,
            nombre_completo,
            numero_lista,
            grupo_id,
            nombre_padre,
            correo_padre,
            telefono_padre,
            nombre_madre,
            correo_madre,
            telefono_madre,
            notas_generales,
            grupos!grupo_id (
              grado,
              grupo,
              nivel,
              ciclo_escolar
            )
          `)
          .in('grupo_id', groupIds)
          .order('nombre_completo')
        
        if (error) throw error
        
        // Transformar los datos para incluir la información del grupo
        const transformedData = (data || []).map(alumno => {
          const grupoInfo = Array.isArray(alumno.grupos) ? alumno.grupos[0] : alumno.grupos
          return {
            ...alumno,
            grado: grupoInfo?.grado || '',
            grupo: grupoInfo?.grupo || '',
            nivel: grupoInfo?.nivel || '',
            ciclo_escolar: grupoInfo?.ciclo_escolar || ''
          }
        })
        
        setStudents(transformedData)
      } catch (error) {
        console.error('Error fetching students:', error)
        toast.error('Error al cargar los estudiantes')
      } finally {
        setLoadingStudents(false)
      }
    }

    fetchStudents()
  }, [user?.id, supabase])

  // Configurar estudiante preseleccionado
  useEffect(() => {
    if (preselectedStudent) {
      // Crear un alumno temporal con la estructura esperada
      const tempStudent: Alumno = {
        id: preselectedStudent.id,
        nombre_completo: preselectedStudent.nombre,
        numero_lista: 1,
        grupo: preselectedStudent.grupo,
        grado: preselectedStudent.grado,
        nivel: preselectedStudent.nivel,
        ciclo_escolar: '2024-2025',
        nombre_padre: preselectedStudent.nombre_padre,
        correo_padre: preselectedStudent.correo_padre,
        telefono_padre: preselectedStudent.telefono_padre,
        nombre_madre: preselectedStudent.nombre_madre,
        correo_madre: preselectedStudent.correo_madre,
        telefono_madre: preselectedStudent.telefono_madre
      }
      
      // Agregar el estudiante a la lista si no existe
      setStudents(prev => {
        const exists = prev.find(s => s.id === preselectedStudent.id)
        if (!exists) {
          return [tempStudent, ...prev]
        }
        return prev
      })
      
      // Seleccionar automáticamente el estudiante
      setSelectedStudent(preselectedStudent.id)
    }
  }, [preselectedStudent])

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Regenerar mensaje automáticamente cuando cambie el tono o estudiante
  useEffect(() => {
    const userMessages = messages.filter(msg => msg.role === 'user')
    if (userMessages.length > 0 && !isLoading && selectedStudent && !isSaving) {
      const lastUserMessage = userMessages[userMessages.length - 1]
      if (lastUserMessage && lastUserMessage.content.trim()) {
        // Solo regenerar si no hay un mensaje del asistente después del último mensaje del usuario
        const lastMessage = messages[messages.length - 1]
        if (lastMessage && lastMessage.role === 'user') {
          const event = {
            target: { value: lastUserMessage.content },
          } as React.ChangeEvent<HTMLTextAreaElement>
          
          handleInputChange(event)
          
          setTimeout(() => {
            const form = document.querySelector("form") as HTMLFormElement
            if (form) {
              form.requestSubmit()
            }
          }, 100)
        }
      }
    }
  }, [selectedTone, selectedStudent])

  const handleQuickSuggestion = (suggestion: string) => {
    if (!selectedStudent) {
      toast.error('Por favor selecciona un estudiante primero')
      return
    }

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
    student_id?: string;
  }) => {
    const dataToSave = messageData || messageToSave;
    if (!dataToSave || !user?.id) return;
    
    setIsSaving(true);
    try {
      const response = await fetch("/api/save-parent-message", {
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

      toast.success("Mensaje para padres guardado exitosamente");
      setMessageToSave(null);
      setIsDialogOpen(false);
      // No navegamos a onNavigateToMessages() porque estos mensajes no aparecen en "Mis Mensajes"
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

  const selectedStudentData = students.find(s => s.id === selectedStudent)

  const quickSuggestions = [
    "Necesito informar sobre el excelente rendimiento académico del estudiante",
    "Quiero comunicar una mejora notable en el comportamiento",
    "Crear un mensaje sobre la falta de participación en clase",
    "Mensaje para citar a los padres por bajo rendimiento",
    "Comunicar sobre tareas no entregadas frecuentemente",
    "Felicitar por el progreso y dedicación mostrada",
    "Invitar a una reunión para hablar sobre el desarrollo del estudiante",
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
            <Users className="h-8 w-8 text-blue-600" />
            Mensajes para Padres con IA
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 select-none">
            Crea mensajes personalizados usando la información específica de tus estudiantes
          </p>
        </div>
      </div>

      {/* Student Selection */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Seleccionar Estudiante
          </CardTitle>
          <CardDescription>
            Elige el estudiante para el cual quieres generar el mensaje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={!!preselectedStudent}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingStudents ? "Cargando estudiantes..." : "Selecciona un estudiante"} />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{student.nombre_completo}</span>
                      <Badge variant="outline" className="text-xs">
                        {student.grupo} - #{student.numero_lista}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {preselectedStudent && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  📌 <strong>Estudiante preseleccionado:</strong> Este mensaje se generará específicamente para {preselectedStudent.nombre}
                </p>
              </div>
            )}
            
            {selectedStudentData && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Información del Estudiante:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Nombre:</span> {selectedStudentData.nombre_completo}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Grupo:</span> {selectedStudentData.grupo}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Grado:</span> {selectedStudentData.grado}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Nivel:</span> {selectedStudentData.nivel}
                  </div>
                  {selectedStudentData.nombre_padre && (
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">Padre:</span> {selectedStudentData.nombre_padre}
                    </div>
                  )}
                  {selectedStudentData.nombre_madre && (
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">Madre:</span> {selectedStudentData.nombre_madre}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-400px)]">
        {/* Chat Container */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                Asistente de Mensajes para Padres
              </CardTitle>
              <CardDescription className="select-none">
                {selectedStudent ? 
                  `Generando mensajes personalizados para ${selectedStudentData?.nombre_completo}` :
                  "Selecciona un estudiante para comenzar"
                }
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
                                  const title = titleMatch ? titleMatch[1] : "Mensaje para Padres";
                                  const category = title.toLowerCase().includes("conducta") ? "conducta" :
                                                  title.toLowerCase().includes("rendimiento") ? "academico" :
                                                  title.toLowerCase().includes("felicit") ? "felicitaciones" :
                                                  title.toLowerCase().includes("citar") ? "citatorios" : "padres";
                                  
                                  setEditingTitle(title);
                                  setMessageToEdit({
                                    content: message.content,
                                    category,
                                    student_id: selectedStudent
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
                          <span className="text-sm">Generando mensaje personalizado...</span>
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
                  placeholder={selectedStudent ? 
                    "Describe la situación específica del estudiante para generar un mensaje personalizado..." :
                    "Primero selecciona un estudiante para continuar..."
                  }
                  disabled={isLoading || !selectedStudent}
                  className="min-h-[80px] resize-none"
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 select-none">
                    💡 Tip: Menciona detalles específicos para un mensaje más personalizado
                  </p>
                  <Button type="submit" disabled={isLoading || !input.trim() || !selectedStudent}>
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
              <CardTitle className="text-lg select-none">Sugerencias para Padres</CardTitle>
              <CardDescription className="select-none">
                Plantillas específicas para comunicación con padres
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-3 pr-2">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Tipos de mensaje:</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Académico</Badge>
                      <Badge variant="secondary">Conducta</Badge>
                      <Badge variant="secondary">Felicitaciones</Badge>
                      <Badge variant="secondary">Citatorios</Badge>
                      <Badge variant="secondary">Padres</Badge>
                    </div>
                  </div>
                  
                  {quickSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full text-left h-auto p-3 justify-start whitespace-normal dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                      onClick={() => handleQuickSuggestion(suggestion)}
                      disabled={isLoading || !selectedStudent}
                    >
                      <div className="text-sm leading-relaxed">{suggestion}</div>
                    </Button>
                  ))}
                  
                  {!selectedStudent && (
                    <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Selecciona un estudiante para usar las sugerencias</p>
                    </div>
                  )}
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
            <DialogTitle>Guardar Mensaje para Padres</DialogTitle>
            <DialogDescription>
              Ingresa un título descriptivo para identificar fácilmente este mensaje
              {selectedStudentData && (
                <span className="block mt-1 text-blue-600 dark:text-blue-400">
                  Estudiante: {selectedStudentData.nombre_completo}
                </span>
              )}
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
                placeholder="Ej: Felicitación por excelente rendimiento - Juan Pérez"
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
                    category: messageToEdit.category,
                    student_id: messageToEdit.student_id
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

export default GenerarMensajesPadres