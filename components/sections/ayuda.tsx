"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  HelpCircle, 
  BookOpen, 
  FileText, 
  Presentation, 
  MessageSquare, 
  Users, 
  Settings, 
  CreditCard,
  Play,
  ExternalLink,
  Mail,
  MessageCircle,
  Bot,
  BarChart3,
  GraduationCap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ContactForm } from "@/components/contact-form"
import { useWelcomeModal } from "@/hooks/use-welcome-modal"

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  tags?: string[]
}

interface VideoItem {
  id: string
  title: string
  description: string
  youtubeId: string
  duration: string
  category: string
}

const faqData: FAQItem[] = [
  {
    id: "1",
    question: "¿Cómo puedo crear una nueva planeación?",
    answer: "Para crear una planeación, ve a 'Planeaciones' → 'Crear Nueva'. Tienes dos opciones: Planeación Individual (usando chat con IA) o Planeación desde Dosificación (basada en contenidos curriculares). La IA te guiará paso a paso para crear una planeación completa siguiendo el Nuevo Marco Curricular Mexicano.",
    category: "Planeaciones",
    tags: ["crear", "ia", "planeación", "chat"]
  },
  {
    id: "2",
    question: "¿Puedo editar mis planeaciones después de crearlas?",
    answer: "Sí, desde 'Mis Planeaciones' puedes ver, editar, eliminar y descargar todas tus planeaciones. También puedes generar presentaciones PowerPoint y PDFs directamente desde cada planeación. Los cambios se guardan automáticamente.",
    category: "Planeaciones",
    tags: ["editar", "descargar", "pdf", "powerpoint"]
  },
  {
    id: "3",
    question: "¿Cómo genero exámenes con IA?",
    answer: "Ve a 'Generar Examen' y selecciona las planeaciones en las que quieres basar el examen. Puedes agregar instrucciones específicas sobre tipos de preguntas o dificultad. La IA generará automáticamente preguntas variadas (opción múltiple, verdadero/falso, respuesta corta) con su respectiva hoja de respuestas.",
    category: "Exámenes",
    tags: ["examen", "ia", "planeaciones", "preguntas"]
  },
  {
    id: "4",
    question: "¿Cómo funcionan los proyectos educativos?",
    answer: "Los proyectos permiten crear proyectos educativos completos con IA en 3 fases: Definir el proyecto, seleccionar PDAs curriculares, y generar contenido. Incluye instrumentos de evaluación como rúbricas analíticas, listas de cotejo y escalas de estimación. Los usuarios PRO tienen acceso ilimitado, mientras que los usuarios gratuitos tienen límites específicos.",
    category: "Proyectos",
    tags: ["proyectos", "ia", "evaluación", "pro"]
  },
  {
    id: "5",
    question: "¿Qué es la dosificación curricular?",
    answer: "La dosificación te permite organizar contenidos curriculares por trimestres de forma inteligente. Puedes distribuir los 4 campos formativos del NMCM por meses del año escolar y realizar seguimiento del progreso académico con estadísticas detalladas y acciones sugeridas automáticas.",
    category: "Dosificación",
    tags: ["dosificación", "curricular", "seguimiento", "campos formativos"]
  },
  {
    id: "6",
    question: "¿Cómo genero presentaciones PowerPoint?",
    answer: "Desde 'Mis Planeaciones', selecciona una planeación y elige 'Descargar PowerPoint'. La IA generará una presentación completa con diapositivas estructuradas, incluyendo portada, contenido, actividades y cierre. Las presentaciones requieren revisión y personalización antes de usar en clase.",
    category: "Presentaciones",
    tags: ["powerpoint", "presentación", "ia", "diapositivas"]
  },
  {
    id: "7",
    question: "¿Cómo funciona el chat con IA?",
    answer: "El chat con IA te permite hacer consultas pedagógicas, obtener ideas para actividades, resolver dudas sobre contenido educativo, y recibir sugerencias personalizadas. Puedes acceder desde el botón flotante o desde secciones específicas como planeaciones y dosificación.",
    category: "Chat IA",
    tags: ["chat", "ia", "pedagogía", "consultas"]
  },
  {
    id: "8",
    question: "¿Qué tipos de mensajes puedo generar para padres?",
    answer: "Puedes generar comunicados, recordatorios de tareas, invitaciones a eventos escolares, felicitaciones y mensajes motivacionales. Los mensajes se adaptan automáticamente para WhatsApp con el formato adecuado. También puedes gestionar el historial de mensajes enviados.",
    category: "Mensajes",
    tags: ["mensajes", "padres", "whatsapp", "comunicados"]
  },
  {
    id: "9",
    question: "¿Cómo gestiono mis grupos y alumnos?",
    answer: "Desde 'Mis Grupos' puedes crear y organizar grupos por grado y ciclo escolar. Incluye gestión completa de alumnos con información de contacto de padres, expedientes individuales, seguimiento académico y conductual, y sistema de asistencia diaria con estadísticas.",
    category: "Gestión",
    tags: ["grupos", "alumnos", "asistencia", "expedientes"]
  },
  {
    id: "10",
    question: "¿Qué instrumentos de evaluación están disponibles?",
    answer: "El sistema incluye rúbricas analíticas, listas de cotejo y escalas de estimación generadas automáticamente por IA. Estos instrumentos se pueden crear desde los proyectos educativos y están diseñados para evaluar diferentes aspectos del aprendizaje de los estudiantes.",
    category: "Evaluación",
    tags: ["rúbricas", "listas de cotejo", "escalas", "evaluación"]
  },
  {
    id: "11",
    question: "¿Cómo actualizo mi información de perfil?",
    answer: "Ve a la sección 'Perfil' en el menú lateral. Allí puedes editar tu información personal, datos de la escuela, grado que impartes, y actualizar tu foto de perfil. Esta información se usa para personalizar las sugerencias de la IA.",
    category: "Perfil",
    tags: ["perfil", "información", "personalizar", "configuración"]
  },
  {
    id: "12",
    question: "¿Qué hago si encuentro un error o problema?",
    answer: "Puedes usar el botón de feedback que aparece en la esquina inferior derecha de la pantalla, o contactarnos directamente en soporte@eduplanner.mx. También puedes reportar problemas desde la sección de contacto en este centro de ayuda.",
    category: "Soporte",
    tags: ["error", "problema", "feedback", "contacto"]
  }
]

const videoData: VideoItem[] = [
  {
    id: "1",
    title: "Presentación EduPlanner - Introducción Completa",
    description: "Conoce todas las funcionalidades de EduPlanner y cómo aprovechar al máximo la plataforma para crear planeaciones didácticas con IA.",
    youtubeId: "xVEUfzxSX68",
    duration: "15:30",
    category: "Introducción"
  },
  {
    id: "2",
    title: "Cómo Generar Planeaciones Didácticas",
    description: "Aprende paso a paso cómo crear planeaciones didácticas completas y estructuradas usando las herramientas de IA de EduPlanner.",
    youtubeId: "JUKyEbafHik",
    duration: "12:45",
    category: "Planeaciones"
  },
  {
    id: "3",
    title: "Generando Exámenes con Inteligencia Artificial",
    description: "Descubre cómo crear exámenes personalizados y efectivos utilizando la funcionalidad de generación de exámenes con IA.",
    youtubeId: "i7jHj2JwUj0",
    duration: "14:15",
    category: "Exámenes"
  }
]

const categories = [
  { name: "Planeaciones", icon: BookOpen, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { name: "Presentaciones", icon: Presentation, color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { name: "Exámenes", icon: FileText, color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { name: "Proyectos", icon: Bot, color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  { name: "Dosificación", icon: BarChart3, color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300" },
  { name: "Chat IA", icon: MessageSquare, color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  { name: "Mensajes", icon: Users, color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" },
  { name: "Gestión", icon: Users, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { name: "Evaluación", icon: GraduationCap, color: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300" },
  { name: "Perfil", icon: Settings, color: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300" },
  { name: "Soporte", icon: HelpCircle, color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  { name: "Introducción", icon: Play, color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300" }
]

export function Ayuda() {
  const { resetWelcomeModal } = useWelcomeModal()

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName)
    return category ? category.icon : HelpCircle
  }

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName)
    return category ? category.color : "bg-gray-100 text-gray-800"
  }

  const groupedFAQs = faqData.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = []
    }
    acc[faq.category].push(faq)
    return acc
  }, {} as Record<string, FAQItem[]>)

  const groupedVideos = videoData.reduce((acc, video) => {
    if (!acc[video.category]) {
      acc[video.category] = []
    }
    acc[video.category].push(video)
    return acc
  }, {} as Record<string, VideoItem[]>)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Centro de Ayuda</h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Encuentra respuestas a tus preguntas, tutoriales en video y recursos para aprovechar al máximo EduPlanner.
        </p>
      </div>

      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faq">Preguntas Frecuentes</TabsTrigger>
          <TabsTrigger value="videos">Videos Tutoriales</TabsTrigger>
          <TabsTrigger value="contacto">Contacto</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-6">
          <div className="grid gap-6">
            {Object.entries(groupedFAQs).map(([category, faqs]) => {
              const IconComponent = getCategoryIcon(category)
              const colorClass = getCategoryColor(category)

              return (
                <Card key={category} className="overflow-hidden">
                  <CardHeader className={`${colorClass} border-b`}>
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5" />
                      <div>
                        <CardTitle className="text-lg">{category}</CardTitle>
                        <CardDescription>
                          {faqs.length} pregunta{faqs.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {faqs.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id}>
                          <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex items-start gap-3 w-full">
                              <HelpCircle className="h-4 w-4 mt-1 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">{faq.question}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pl-7 space-y-3">
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {faq.answer}
                              </p>
                              {faq.tags && faq.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {faq.tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-8">
          <div className="max-w-6xl mx-auto">
            {Object.entries(groupedVideos).map(([category, videos]) => {
              const IconComponent = getCategoryIcon(category)
              const colorClass = getCategoryColor(category)

              return (
                <div key={category} className="space-y-6 mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{category}</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {videos.length} video{videos.length !== 1 ? 's' : ''} tutorial
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid gap-8">
                    {videos.map((video) => (
                      <Card key={video.id} className="overflow-hidden shadow-lg">
                        <div className="grid gap-6 lg:grid-cols-3">
                          {/* Video embebido - ocupa 2/3 del espacio */}
                          <div className="lg:col-span-2">
                            <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                              <iframe
                                src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
                                title={video.title}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </div>
                          
                          {/* Información del video - ocupa 1/3 del espacio */}
                          <div className="lg:col-span-1 p-6">
                            <div className="space-y-4">
                              <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                  {video.title}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  <span>Duración: {video.duration}</span>
                                  <span>•</span>
                                  <span>YouTube</span>
                                </div>
                              </div>
                              
                              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {video.description}
                              </p>
                              
                              <div className="space-y-3">
                                <Button
                                  onClick={() => window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, '_blank')}
                                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Ver en YouTube
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => {
                                    // Copiar enlace al portapapeles
                                    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${video.youtubeId}`)
                                    alert('Enlace copiado al portapapeles')
                                  }}
                                >
                                  Copiar Enlace
                                </Button>
                                
                                {/* Botón especial para el video de introducción */}
                                {video.id === "1" && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                    onClick={async () => {
                                      const success = await resetWelcomeModal()
                                      if (success) {
                                        alert('El modal de bienvenida se mostrará la próxima vez que inicies sesión')
                                      } else {
                                        alert('No se pudo resetear el modal. Verifica que tengas permisos de administrador.')
                                      }
                                    }}
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Ver Modal de Bienvenida
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="contacto" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Formulario de contacto */}
            <div className="lg:col-span-2">
              <ContactForm />
            </div>

            {/* Información de contacto */}
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Información de Contacto
                  </CardTitle>
                  <CardDescription>
                    Datos de contacto y tiempos de respuesta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Email de soporte:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded border">soporte@eduplanner.mx</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Tiempo de respuesta:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Menos de 24 horas</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Horario de atención:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Lunes a Viernes, 9:00 - 18:00</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      ¿Prefieres usar tu cliente de email?
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => window.open('mailto:soporte@eduplanner.mx', '_blank')}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Abrir Cliente de Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  ¿No encontraste lo que buscabas?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Nuestro equipo está aquí para ayudarte. Usa el formulario de arriba para contactarnos directamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
