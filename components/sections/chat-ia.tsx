"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { convertMarkdownToHtml } from "@/components/ui/rich-text-editor"

// Función específica para convertir contenido del chat
function convertChatMarkdownToHtml(content: string): string {
  if (!content) return ''

  let html = content

  // Convertir encabezados
  html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mb-2">$1</h3>')
  html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
  html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')

  // Convertir texto en negrita
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')

  // Convertir texto en cursiva
  html = html.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em class="italic">$1</em>')

  // Convertir listas no ordenadas
  html = html.replace(/^\s*[-*+]\s+(.*)$/gm, '<li class="ml-4 mb-1">• $1</li>')
  html = html.replace(/((<li[^>]*>[\s\S]*?<\/li>\s*)+)/g, '<ul class="mb-3">$1</ul>')

  // Convertir listas ordenadas
  html = html.replace(/^\s*(\d+)\.\s+(.*)$/gm, '<li class="ml-4 mb-1">$1. $2</li>')

  // Convertir saltos de línea dobles en párrafos
  const paragraphs = html.split(/\n\s*\n/)
  html = paragraphs.map(paragraph => {
    const trimmed = paragraph.trim()
    if (!trimmed) return ''

    // No envolver en <p> si ya tiene tags de bloque
    if (trimmed.match(/^<(h[1-6]|ul|ol|li|div)/)) {
      return trimmed
    }

    // Convertir saltos de línea simples en <br>
    const withBreaks = trimmed.replace(/\n/g, '<br>')
    return `<div class="mb-3 leading-relaxed">${withBreaks}</div>`
  }).filter(p => p).join('')

  return html
}
import { ArrowLeft, Send, Bot, User, Loader2, Sparkles, AlertCircle, Save, CheckCircle, ThumbsUp, ThumbsDown, Crown, AlertTriangle } from "lucide-react"
import { useChat } from "ai/react"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useUserData } from "@/hooks/use-user-data"
import { usePlaneaciones } from "@/hooks/use-planeaciones"
import { useProfile } from "@/hooks/use-profile"
import { isUserPro } from "@/lib/subscription-utils"
import { extractPlaneacionInfo, getCleanContentForSaving } from "@/lib/planeaciones"
import { WelcomeMessage } from "@/components/ui/welcome-message"
import Swal from 'sweetalert2'
import { useToast } from "@/hooks/use-toast"

interface ChatIAProps {
  onBack: () => void
  onSaveSuccess: () => void
  initialMessage?: string
}

export function ChatIA({ onBack, onSaveSuccess, initialMessage }: ChatIAProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [lastPlaneacionContent, setLastPlaneacionContent] = useState<string>("")
  const [showSaveButton, setShowSaveButton] = useState(false)
  const [savedPlaneacionId, setSavedPlaneacionId] = useState<string | null>(null)
  const { toast } = useToast()

  const showCopyWarning = () => {
    toast({
      title: "Acción no permitida",
      description: "No es posible seleccionar ni copiar texto. Debes guardar la planeación para poder descargarla en PDF.",
      variant: "destructive",
    })
  }

  // Estados para el sistema de feedback de calidad
  const [showQualityFeedback, setShowQualityFeedback] = useState(false)
  const [qualityRating, setQualityRating] = useState<'useful' | 'needs_improvement' | null>(null)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const { user } = useAuth()
  const { userData } = useUserData(user?.id)
  const { profile, loading: profileLoading } = useProfile()

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }
  const {
    createPlaneacion,
    creating,
    error: planeacionError,
    canCreateMore,
    getRemainingPlaneaciones,
    monthlyCount,
    loading: planeacionesLoading,
  } = usePlaneaciones()

  const isPro = profile ? isUserPro(profile) : false
  const hasReachedLimit = !planeacionesLoading && !profileLoading && !isPro && monthlyCount >= 3

  const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    onError: (error) => {
      console.error("Error en el chat:", error)
    },
    onFinish: (message) => {
      // Verificar si el mensaje contiene una planeación completa
      if (message.content.length > 200 && message.content.includes("Materia")) {
        setLastPlaneacionContent(message.content)
        setShowQualityFeedback(true)
        setShowSaveButton(true)
        setSavedPlaneacionId(null)
        // Resetear estados de feedback
        setQualityRating(null)
        setShowFollowUp(false)
        setFeedbackText('')
      }
    },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: `¡Hola! 👋 Soy tu asistente de IA para crear planeaciones didácticas. 

Estoy aquí para ayudarte a diseñar una clase individual perfecta para tus estudiantes de primaria. 

Puedes contarme:
• ¿Qué materia quieres enseñar?
• ¿Para qué grado es la clase?
• ¿Cuál es el tema específico?
• ¿Cuánto tiempo durará la clase?
• ¿Hay algún objetivo particular que quieras lograr?
• ¿Tienes alumnos con barreras para el aprendizaje? 
• ¿Necesitas hacer adecuaciones curriculares?

¡Empecemos a crear algo increíble juntos! ✨`,
      },
      ...(initialMessage ? [{
        id: "user-initial",
        role: "user" as const,
        content: initialMessage,
      }] : []),
    ],
  })

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      // Usar setTimeout para evitar conflictos con React
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }, [messages])

  // Función personalizada para manejar el envío con validación de límites
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Verificar límite antes de enviar
    if (hasReachedLimit) {
      Swal.fire({
        icon: 'warning',
        title: 'Límite mensual alcanzado',
        html: `
          <p>Has creado <strong>${monthlyCount}/3</strong> planeaciones este mes con tu plan gratuito.</p>
          <p class="mt-2">Actualiza a <strong>PRO</strong> para crear planeaciones ilimitadas.</p>
        `,
        confirmButtonText: 'Entendido',
        showCancelButton: true,
        cancelButtonText: 'Actualizar a PRO',
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#8b5cf6'
      })
      return
    }

    // Si no hay límite, proceder con el envío normal
    originalHandleSubmit(e)
  }

  const handleQuickSuggestion = (suggestion: string) => {
    const event = {
      target: { value: suggestion },
    } as React.ChangeEvent<HTMLInputElement>

    handleInputChange(event)

    setTimeout(() => {
      const form = document.querySelector("form") as HTMLFormElement
      if (form) {
        form.requestSubmit()
      }
    }, 100)
  }

  // Funciones para manejar el feedback de calidad
  const handleQualityRating = (rating: 'useful' | 'needs_improvement') => {
    setQualityRating(rating)
    setShowFollowUp(true)
  }

  const handleSubmitFeedback = async () => {
    if (!qualityRating) return

    setSubmittingFeedback(true)

    try {
      const feedbackData = {
        planeacion_content: lastPlaneacionContent,
        quality_rating: qualityRating,
        feedback_text: feedbackText,
        user_id: user?.id,
        created_at: new Date().toISOString()
      }

      const response = await fetch('/api/quality-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      })

      if (response.ok) {
        // Ocultar el feedback y mostrar mensaje de agradecimiento
        setShowQualityFeedback(false)
        Swal.fire({
          icon: 'success',
          title: '¡Gracias por tu feedback!',
          text: 'Tu opinión nos ayuda a mejorar la calidad de las planeaciones.',
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (error) {
      console.error('Error al enviar feedback:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo enviar tu feedback. Inténtalo de nuevo.',
      })
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const handleSkipFeedback = () => {
    setShowQualityFeedback(false)
  }

  const handleSavePlaneacion = async () => {
    if (!lastPlaneacionContent) return

    const canCreate = await canCreateMore();
    if (!canCreate) {
      Swal.fire({
        icon: 'warning',
        title: 'Límite alcanzado',
        text: 'Has alcanzado el límite de planeaciones para tu plan. Actualiza a PRO para crear ilimitadas.',
        confirmButtonText: 'Entendido'
      })
      return
    }

    // Limpiar el contenido antes de extraer la información
    const cleanContent = getCleanContentForSaving(lastPlaneacionContent)
    const planeacionInfo = extractPlaneacionInfo(lastPlaneacionContent)

    const newPlaneacion = await createPlaneacion({
      titulo: planeacionInfo.titulo,
      materia: planeacionInfo.materia,
      grado: planeacionInfo.grado,
      duracion: planeacionInfo.duracion,
      objetivo: planeacionInfo.objetivo,
      contenido: cleanContent, // Usar el contenido limpio
      estado: "completada",
    })

    if (newPlaneacion) {
      setSavedPlaneacionId(newPlaneacion.id)
      setShowSaveButton(false)
      // Navegar a mis planeaciones después de un breve delay para mostrar el mensaje de éxito
      setTimeout(() => {
        onSaveSuccess()
      }, 2000)
    }
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return

    // Detectar si el usuario quiere guardar
    const lowerInput = input.toLowerCase()
    const saveKeywords = ["guardar", "guarda", "sí", "si", "si, guardar"]
    const isSaveCommand = saveKeywords.some(keyword => lowerInput === keyword || lowerInput === keyword + "." || lowerInput === keyword + "!")

    // Solo activar el guardado si el botón de guardar está visible y el usuario confirma explícitamente
    if (showSaveButton && isSaveCommand) {
      handleSavePlaneacion();
      return;
    }

    // Si el botón de guardar está visible pero el usuario no confirma guardar, ocultarlo y enviar el mensaje al AI
    if (showSaveButton && lastPlaneacionContent && !isSaveCommand) {
      setShowSaveButton(false);
      setLastPlaneacionContent(""); // Limpiar el contenido para evitar guardados accidentales
    }

    handleSubmit(e)
  }

  const remainingPlaneaciones = getRemainingPlaneaciones()

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full  dark:text-gray-100">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 select-none">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <span className="notranslate">Crear Clase con IA</span>
          </h1>
          <p className="text-gray-600 mt-2 select-none">Diseña tu clase individual con la ayuda de inteligencia artificial</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 select-none">
            <span className="notranslate">Planeaciones restantes este mes:{" "}</span>
            <span className="font-medium notranslate">{remainingPlaneaciones === -1 ? "∞" : remainingPlaneaciones}</span>
          </p>
        </div>
      </div>

      {/* Welcome Message */}
      <WelcomeMessage />

      {/* Limit Warning */}
      {hasReachedLimit && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  Límite mensual de planeaciones alcanzado
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Has creado {monthlyCount} de 3 planeaciones permitidas este mes con tu plan gratuito.
                  No puedes generar nuevas planeaciones hasta el próximo mes.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <Crown className="w-4 h-4 mr-2" />
                    Actualizar a PRO
                  </Button>
                  <span className="text-xs text-orange-600 dark:text-orange-400">
                    Obtén planeaciones ilimitadas
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {(error || planeacionError) && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-300">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm text-red-600 mt-1 dark:text-red-400">{error?.message || planeacionError}</p>
          </CardContent>
        </Card>
      )}

      {/* Save Success */}
      {savedPlaneacionId && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">¡Planeación guardada exitosamente!</span>
            </div>
            <p className="text-sm text-green-600 mt-1 dark:text-green-400">Puedes encontrarla en la sección "Mis Planeaciones"</p>
          </CardContent>
        </Card>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Container */}
        <div className="lg:col-span-2">
          <Card className="min-h-[600px] flex flex-col dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Asistente de Planeación Educativa
              </CardTitle>
              <CardDescription className="select-none">
                Chatea conmigo para crear una planeación didáctica personalizada para tu clase
              </CardDescription>
            </CardHeader>

            {/* Messages Area */}
            <div className="flex-1 dark:bg-gray-800 dark:border-gray-700">
              <div className="dark:bg-gray-800 dark:border-gray-700">
                <div className="p-4 space-y-4 dark:bg-gray-800 dark:border-gray-700">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-purple-100 text-purple-600">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[85%] rounded-lg p-3 break-words dark:bg-gray-900  dark:border-gray-500  ${message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900 dark:text-gray-100 border border-gray-200"
                          }`}
                      >
                        {message.role === "assistant" ? (
                          <div
                            className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed select-none notranslate"
                            style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
                            dangerouslySetInnerHTML={{ __html: convertChatMarkdownToHtml(message.content) }}
                            onContextMenu={(e) => {
                              e.preventDefault()
                              showCopyWarning()
                            }}
                            onDragStart={(e) => e.preventDefault()}
                            onCopy={(e) => {
                              e.preventDefault()
                              showCopyWarning()
                            }}
                            onClick={showCopyWarning}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap text-sm leading-relaxed select-none dark:bg-gray-900 dark:border-gray-500 notranslate">{message.content}</div>
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
                        <AvatarFallback className="bg-purple-100 text-purple-600">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 text-gray-900 dark:text-gray-100 border border-gray-200 dark:bg-gray-700 dark:border-gray-600 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm notranslate">Pensando...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sistema de Feedback de Calidad */}
                  {showQualityFeedback && !savedPlaneacionId && (
                    <div className="flex justify-center mb-4">
                      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950 dark:to-indigo-950 dark:border-blue-900 max-w-2xl w-full">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <h3 className="font-medium text-lg mb-2 select-none">Calidad de la Planeación</h3>

                            {!showFollowUp ? (
                              <>
                                <p className="text-sm mb-6 text-gray-600 dark:text-gray-300">
                                  ¿Esta planeación generada por la IA te resulta útil?
                                </p>
                                <div className="flex gap-4 justify-center">
                                  <Button
                                    onClick={() => handleQualityRating('useful')}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-base"
                                    size="lg"
                                  >
                                    <ThumbsUp className="mr-2 h-5 w-5" />
                                    Sí, me es útil
                                  </Button>
                                  <Button
                                    onClick={() => handleQualityRating('needs_improvement')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-base"
                                    size="lg"
                                  >
                                    <ThumbsDown className="mr-2 h-5 w-5" />
                                    No, necesita mejorar
                                  </Button>
                                </div>
                                <Button
                                  variant="ghost"
                                  onClick={handleSkipFeedback}
                                  className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                                >
                                  Omitir evaluación
                                </Button>
                              </>
                            ) : (
                              <>
                                {qualityRating === 'useful' ? (
                                  <>
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                      <CheckCircle className="h-6 w-6 text-green-600" />
                                      <span className="text-green-600 font-medium">¡Genial! Nos alegra ser de ayuda.</span>
                                    </div>
                                    <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">
                                      (Opcional) Para seguir mejorando, ¿qué fue lo que más te gustó?
                                    </p>
                                    <Textarea
                                      value={feedbackText}
                                      onChange={(e) => setFeedbackText(e.target.value)}
                                      placeholder="Ej: Las actividades sugeridas, la redacción, los recursos, etc."
                                      className="mb-4"
                                      rows={3}
                                    />
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                      <AlertCircle className="h-6 w-6 text-red-600" />
                                      <span className="text-red-600 font-medium">Lamentamos no haber acertado esta vez.</span>
                                    </div>
                                    <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">
                                      Tu opinión es clave para mejorar. ¿Qué le faltó o qué cambiarías?
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-4 justify-center">
                                      {['Muy Genérica', 'Pocas Actividades', 'No se alinea al Tema', 'Error de Redacción'].map((option) => (
                                        <Button
                                          key={option}
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setFeedbackText(prev => prev ? `${prev}, ${option}` : option)}
                                          className="text-xs"
                                        >
                                          {option}
                                        </Button>
                                      ))}
                                    </div>
                                    <Textarea
                                      value={feedbackText}
                                      onChange={(e) => setFeedbackText(e.target.value)}
                                      placeholder="Ej: Necesita más actividades, no se alinea al tema, es muy genérica, etc."
                                      className="mb-4"
                                      rows={3}
                                    />
                                  </>
                                )}
                                <div className="flex gap-3 justify-center">
                                  <Button
                                    onClick={handleSubmitFeedback}
                                    disabled={submittingFeedback}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    {submittingFeedback ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enviando...
                                      </>
                                    ) : (
                                      qualityRating === 'useful' ? 'Enviar Opinión' : 'Enviar Crítica Constructiva'
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    onClick={handleSkipFeedback}
                                    disabled={submittingFeedback}
                                  >
                                    Omitir
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Botón para guardar planeación */}
                  {showSaveButton && !savedPlaneacionId && (
                    <div className="flex justify-center">
                      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-950 dark:to-emerald-950 dark:border-green-900">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <h3 className="font-medium select-none">¿Quieres guardar esta planeación?</h3>
                            <p className="text-sm mb-4 ">
                              Podrás encontrarla después en "Mis Planeaciones"
                            </p>
                            <Button
                              onClick={handleSavePlaneacion}
                              disabled={creating}

                            >
                              {creating ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Guardando...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Guardar Planeación
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Mensaje informativo para continuar interacción */}
                  {showSaveButton && !savedPlaneacionId && (
                    <div className="flex justify-center mt-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md text-center dark:bg-blue-950 dark:border-blue-900">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          💬 ¿Quieres hacer algún cambio? Puedes pedirme que modifique cualquier parte de la planeación
                        </p>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t p-4 flex-shrink-0">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder={hasReachedLimit ? "Límite de planeaciones alcanzado" : "Escribe tu mensaje aquí..."}
                  disabled={isLoading || hasReachedLimit}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim() || hasReachedLimit}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-lg select-none">Sugerencias Rápidas</CardTitle>
              <CardDescription className="select-none">Haz clic para empezar rápidamente</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="space-y-3">
                {[
                  "Crear una clase de matemáticas sobre fracciones para 4° grado",
                  "Diseñar una lección de ciencias sobre el sistema solar para 5° grado",
                  "Planificar una clase de español sobre comprensión lectora para 3° grado",
                  "Crear una actividad de historia sobre la Revolución Mexicana para 6° grado",
                  "Clase de educación física con juegos cooperativos para 2° grado",
                  "Taller de arte sobre colores primarios para 1° grado",
                  "Clase de geografía sobre los estados de México para 5° grado",
                  "Actividad de valores sobre la amistad para 3° grado",
                ].map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full text-left h-auto p-3 justify-start whitespace-normal dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                    onClick={() => handleQuickSuggestion(suggestion)}
                    disabled={isLoading || hasReachedLimit}
                  >
                    <div className="text-sm leading-relaxed notranslate">{suggestion}</div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
