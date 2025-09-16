"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
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

interface ChatIADosificacionProps {
  onBack: () => void
  onSaveSuccess: () => void
  initialMessage: string
  contenidosSeleccionados: any[]
  contexto: any
  mesActual: string
}

export function ChatIADosificacion({ onBack, onSaveSuccess, initialMessage, contenidosSeleccionados, contexto, mesActual }: ChatIADosificacionProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [lastPlaneacionContent, setLastPlaneacionContent] = useState<string>("") 
  const [showSaveButton, setShowSaveButton] = useState(false)
  const [savedPlaneacionId, setSavedPlaneacionId] = useState<string | null>(null)
  const [autoSendTriggered, setAutoSendTriggered] = useState(false)
  
  // Estados para el sistema de feedback de calidad
  const [showQualityFeedback, setShowQualityFeedback] = useState(false)
  const [qualityRating, setQualityRating] = useState<'useful' | 'needs_improvement' | null>(null)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const { user } = useAuth()
  const { userData } = useUserData(user?.id)
  const { profile } = useProfile()

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  // Función para convertir abreviaciones de meses a nombres completos
  const getMesCompleto = (mesAbreviado: string) => {
    const meses: { [key: string]: string } = {
      'ENE': 'Enero',
      'FEB': 'Febrero', 
      'MAR': 'Marzo',
      'ABR': 'Abril',
      'MAY': 'Mayo',
      'JUN': 'Junio',
      'JUL': 'Julio',
      'AGO': 'Agosto',
      'SEP': 'Septiembre',
      'OCT': 'Octubre',
      'NOV': 'Noviembre',
      'DIC': 'Diciembre'
    }
    return meses[mesAbreviado] || mesAbreviado
  }
  const {
    createPlaneacion,
    creating,
    error: planeacionError,
    canCreateMore,
    getRemainingPlaneaciones,
    monthlyCount,
  } = usePlaneaciones()
  
  const isPro = profile ? isUserPro(profile) : false
  const hasReachedLimit = !isPro && monthlyCount >= 5

  const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading, error, append } = useChat({
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
        content: `¡Hola! 👋 Soy tu asistente de IA para crear planeaciones didácticas desde dosificación. 

He recibido la información de los contenidos que seleccionaste para el mes de ${getMesCompleto(mesActual)} y estoy generando automáticamente tu planeación didáctica.

**Contenidos seleccionados:**
${contenidosSeleccionados.map((c, i) => `${i + 1}. ${c.contenido}`).join('\n')}

¡Generando tu planeación personalizada! ✨`,
      },
    ],
  })

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Enviar automáticamente el mensaje inicial
  useEffect(() => {
    if (initialMessage && !autoSendTriggered && messages.length === 1) {
      setAutoSendTriggered(true)
      // Esperar un momento para que el usuario vea el mensaje de bienvenida
      setTimeout(() => {
        append({
          id: "auto-generated",
          role: "user",
          content: initialMessage,
        })
      }, 1500)
    }
  }, [initialMessage, autoSendTriggered, messages.length, append])

  // Función personalizada para manejar el envío con validación de límites
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Verificar límite antes de enviar
    if (hasReachedLimit) {
      Swal.fire({
        icon: 'warning',
        title: 'Límite mensual alcanzado',
        html: `
          <p>Has creado <strong>${monthlyCount}/5</strong> planeaciones este mes con tu plan gratuito.</p>
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

    // Verificar si el usuario quiere guardar la planeación
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

    originalHandleSubmit(e)
  }

  // Función para guardar la planeación
  const handleSavePlaneacion = async () => {
    if (!lastPlaneacionContent || !user?.id) return

    try {
      const planeacionInfo = extractPlaneacionInfo(lastPlaneacionContent)
      const cleanContent = getCleanContentForSaving(lastPlaneacionContent)
      
      const planeacionData = {
        titulo: planeacionInfo.titulo || `Planeación desde Dosificación - ${getMesCompleto(mesActual)}`,
        materia: planeacionInfo.materia || contenidosSeleccionados[0]?.campo_formativo || null,
        grado: planeacionInfo.grado || contexto?.grado?.toString() || null,
        duracion: planeacionInfo.duracion || '50 minutos',
        objetivo: planeacionInfo.objetivo || 'Desarrollar los contenidos curriculares dosificados para el mes actual',
        contenido: cleanContent,
        estado: 'completada' as const,
        // Marcar que viene desde dosificación
        origen: 'dosificacion' as const,
        contenidos_relacionados: contenidosSeleccionados.map(c => c.contenido_id)
      }

      const newPlaneacion = await createPlaneacion(planeacionData)
      
      if (newPlaneacion) {
        setSavedPlaneacionId(newPlaneacion.id)
        setShowSaveButton(false)
        
        // Crear las relaciones con los contenidos seleccionados
        if (newPlaneacion.id) {
          const relaciones = contenidosSeleccionados.map(contenido => ({
            planeacion_id: newPlaneacion.id,
            contenido_id: contenido.contenido_id
          }))

          // Aquí deberías llamar a una función para crear las relaciones
          // await createPlaneacionContenidos(relaciones)
        }
        
        Swal.fire({
          title: '¡Planeación guardada!',
          text: 'Tu planeación ha sido guardada exitosamente.',
          icon: 'success',
          confirmButtonText: 'Ver mis planeaciones',
          confirmButtonColor: '#10b981',
        }).then(() => {
          onSaveSuccess()
        })
      }
    } catch (error) {
      console.error('Error guardando planeación:', error)
      Swal.fire({
        title: 'Error',
        text: 'No se pudo guardar la planeación. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Entendido',
      })
    }
  }

  // Función para manejar la calificación de calidad
  const handleQualityRating = (rating: 'useful' | 'needs_improvement') => {
    setQualityRating(rating)
    setShowFollowUp(true)
  }

  // Función para omitir el feedback
  const handleSkipFeedback = () => {
    setShowQualityFeedback(false)
    setQualityRating(null)
    setShowFollowUp(false)
    setFeedbackText('')
  }

  const handleSubmitFeedback = async () => {
    if (!qualityRating) return

    setSubmittingFeedback(true)
    try {
      // Aquí enviarías el feedback a tu API

      
      setShowQualityFeedback(false)
      setShowFollowUp(false)
      setFeedbackText('')
    } catch (error) {
      console.error('Error enviando feedback:', error)
    } finally {
      setSubmittingFeedback(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Dosificación
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Crear Clase con IA
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Diseña tu clase desde dosificación con la ayuda de inteligencia artificial
          </p>
        </div>
      </div>

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
                  Has creado {monthlyCount} de 5 planeaciones permitidas este mes con tu plan gratuito.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat principal */}
        <div className="lg:col-span-2">
          <Card className="min-h-[600px] flex flex-col">
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
                        <div className="whitespace-pre-wrap text-sm leading-relaxed select-none dark:bg-gray-900 dark:border-gray-500">{message.content}</div>
                      </div>

                      {message.role === "user" && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {userData?.email ? getInitials(userData.email) : <User className="h-4 w-4" />}
                          </AvatarFallback>
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
                          <span className="text-sm">Pensando...</span>
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
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                    )}
                                    Enviar Feedback
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setShowFollowUp(false)}
                                  >
                                    Cancelar
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
                      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-950 dark:to-emerald-950 dark:border-green-900 max-w-2xl w-full">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <h3 className="font-medium select-none">¿Quieres guardar esta planeación?</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              Podrás encontrarla después en <strong>'Mis Planeaciones'</strong>
                            </p>
                            <Button
                              onClick={handleSavePlaneacion}
                              disabled={creating}
                              className="mt-4 bg-black hover:bg-gray-800 text-white px-8 py-3 text-base"
                              size="lg"
                            >
                              {creating ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              ) : (
                                <Save className="mr-2 h-5 w-5" />
                              )}
                              Guardar Planeación
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
                  placeholder="Escribe tu mensaje aquí..."
                  disabled={isLoading || hasReachedLimit}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || hasReachedLimit}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              <div className="flex items-center gap-2 mt-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span>💡</span>
                  <span>Tip:</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Cuando termine tu planeación, pregúntale si quieres guardarla
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Sugerencias rápidas */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-lg select-none">Info</CardTitle>
              <CardDescription className="select-none">Información de la planeación</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Grado:</span>
                  <p className="text-sm">{contexto?.grado}° Grado</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Mes:</span>
                  <p className="text-sm">{getMesCompleto(mesActual)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Contenidos:</span>
                  <p className="text-sm">{contenidosSeleccionados.length} seleccionados</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Origen:</span>
                  <p className="text-sm text-orange-600 font-medium">Desde Dosificación</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}