"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { HelpCircle, BookOpen, FileText, Presentation, MessageSquare, Users, Settings, CreditCard } from "lucide-react"

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  tags?: string[]
}

const faqData: FAQItem[] = [
  {
    id: "1",
    question: "¿Cómo puedo crear una nueva planeación?",
    answer: "Para crear una nueva planeación, ve a la sección 'Nueva Planeación' en el menú lateral. Completa los campos requeridos como materia, grado, tema y objetivos. El sistema te guiará paso a paso para crear una planeación completa y estructurada.",
    category: "Planeaciones",
    tags: ["crear", "nueva", "planeación"]
  },
  {
    id: "2",
    question: "¿Puedo editar una planeación después de crearla?",
    answer: "Sí, puedes editar cualquier planeación desde la sección 'Mis Planeaciones'. Simplemente selecciona la planeación que deseas modificar y haz clic en el botón de editar. Todos los cambios se guardarán automáticamente.",
    category: "Planeaciones",
    tags: ["editar", "modificar", "planeación"]
  },
  {
    id: "3",
    question: "¿Cómo genero una presentación PowerPoint?",
    answer: "Desde 'Mis Planeaciones', selecciona la planeación deseada y elige la opción 'Descargar PowerPoint'. La presentación generada es una base que debes revisar y personalizar según tus necesidades específicas antes de usarla en clase.",
    category: "Presentaciones",
    tags: ["powerpoint", "presentación", "descargar"]
  },
  {
    id: "4",
    question: "¿Las presentaciones están listas para usar directamente?",
    answer: "No, las presentaciones generadas son plantillas base que requieren revisión y personalización. Debes adaptarlas a tu contexto específico, agregar imágenes reales donde se indique, y ajustar el contenido según las necesidades de tus estudiantes.",
    category: "Presentaciones",
    tags: ["plantilla", "personalizar", "revisar"]
  },
  {
    id: "5",
    question: "¿Cómo genero exámenes?",
    answer: "Ve a la sección 'Generar Examen', selecciona la materia, grado y tema. Puedes especificar el tipo de preguntas (opción múltiple, verdadero/falso, abiertas) y el número de preguntas. El sistema creará un examen personalizado que puedes descargar en PDF o Word.",
    category: "Exámenes",
    tags: ["examen", "generar", "preguntas"]
  },
  {
    id: "6",
    question: "¿Puedo personalizar los tipos de preguntas en los exámenes?",
    answer: "Sí, puedes elegir entre diferentes tipos de preguntas: opción múltiple, verdadero/falso, preguntas abiertas, y completar espacios. También puedes especificar la dificultad y el número de preguntas para cada tipo.",
    category: "Exámenes",
    tags: ["personalizar", "tipos", "preguntas"]
  },
  {
    id: "7",
    question: "¿Cómo funciona el chat con IA?",
    answer: "El chat con IA te permite hacer preguntas sobre pedagogía, obtener ideas para actividades, resolver dudas sobre contenido educativo, y recibir sugerencias para mejorar tus clases. Simplemente escribe tu pregunta y la IA te proporcionará respuestas útiles y contextualizadas.",
    category: "Chat IA",
    tags: ["chat", "ia", "preguntas", "pedagogía"]
  },
  {
    id: "8",
    question: "¿Qué tipos de mensajes puedo generar?",
    answer: "Puedes generar diversos tipos de mensajes: comunicados para padres, recordatorios de tareas, invitaciones a eventos escolares, felicitaciones, y mensajes motivacionales. También puedes adaptarlos para WhatsApp con el formato adecuado.",
    category: "Mensajes",
    tags: ["mensajes", "padres", "comunicados", "whatsapp"]
  },
  {
    id: "9",
    question: "¿Cómo adapto mensajes para WhatsApp?",
    answer: "En la sección de mensajes, encontrarás la opción 'Adaptar para WhatsApp'. Esta función ajusta el formato, longitud y tono del mensaje para que sea más efectivo en esta plataforma, manteniendo un lenguaje cercano y directo.",
    category: "Mensajes",
    tags: ["whatsapp", "adaptar", "formato"]
  },
  {
    id: "10",
    question: "¿Qué incluye mi suscripción?",
    answer: "Tu suscripción incluye acceso ilimitado a todas las funciones: creación de planeaciones, generación de exámenes, presentaciones PowerPoint, mensajes personalizados, chat con IA, y todas las futuras actualizaciones. Revisa los detalles en tu perfil.",
    category: "Suscripción",
    tags: ["suscripción", "funciones", "acceso"]
  },
  {
    id: "11",
    question: "¿Puedo cancelar mi suscripción?",
    answer: "Sí, puedes cancelar tu suscripción en cualquier momento desde tu perfil. Al cancelar, mantendrás acceso hasta el final del período pagado. No se realizarán cargos adicionales después de la cancelación.",
    category: "Suscripción",
    tags: ["cancelar", "suscripción", "período"]
  },
  {
    id: "12",
    question: "¿Los documentos se guardan automáticamente?",
    answer: "Sí, todas las planeaciones, exámenes y mensajes se guardan automáticamente en tu cuenta. Puedes acceder a ellos en cualquier momento desde las secciones correspondientes y descargarlos cuando los necesites.",
    category: "General",
    tags: ["guardar", "automático", "documentos"]
  },
  {
    id: "13",
    question: "¿Puedo usar la plataforma en dispositivos móviles?",
    answer: "Sí, la plataforma está optimizada para funcionar en computadoras, tablets y teléfonos móviles. Puedes acceder desde cualquier navegador web moderno y todas las funciones estarán disponibles.",
    category: "General",
    tags: ["móvil", "dispositivos", "acceso"]
  },
  {
    id: "14",
    question: "¿Cómo actualizo mi información de perfil?",
    answer: "Ve a la sección 'Perfil' en el menú lateral. Allí puedes editar tu información personal, datos de la escuela, y actualizar tu foto de perfil. Los cambios se guardan automáticamente.",
    category: "Perfil",
    tags: ["perfil", "actualizar", "información"]
  },
  {
    id: "15",
    question: "¿Qué hago si encuentro un error o problema?",
    answer: "Si encuentras algún problema, puedes usar el botón de feedback que aparece en la esquina inferior derecha de la pantalla. Describe el problema y nuestro equipo te ayudará a resolverlo lo antes posible.",
    category: "Soporte",
    tags: ["error", "problema", "soporte", "feedback"]
  }
]

const categories = [
  { name: "Planeaciones", icon: BookOpen, color: "bg-blue-100 text-blue-800" },
  { name: "Presentaciones", icon: Presentation, color: "bg-green-100 text-green-800" },
  { name: "Exámenes", icon: FileText, color: "bg-purple-100 text-purple-800" },
  { name: "Chat IA", icon: MessageSquare, color: "bg-orange-100 text-orange-800" },
  { name: "Mensajes", icon: Users, color: "bg-pink-100 text-pink-800" },
  { name: "Suscripción", icon: CreditCard, color: "bg-yellow-100 text-yellow-800" },
  { name: "Perfil", icon: Settings, color: "bg-gray-100 text-gray-800" },
  { name: "General", icon: HelpCircle, color: "bg-indigo-100 text-indigo-800" },
  { name: "Soporte", icon: HelpCircle, color: "bg-red-100 text-red-800" }
]

export function FAQ() {
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

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Preguntas Frecuentes</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Encuentra respuestas a las preguntas más comunes sobre EduPlanner. 
          Si no encuentras lo que buscas, no dudes en contactarnos.
        </p>
      </div>

      <div className="grid gap-6">
        {Object.entries(groupedFAQs).map(([category, faqs]) => {
          const IconComponent = getCategoryIcon(category)
          const colorClass = getCategoryColor(category)
          
          return (
            <Card key={category} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{category}</CardTitle>
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
                          <HelpCircle className="h-4 w-4 mt-1 text-gray-400 flex-shrink-0" />
                          <span className="font-medium">{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-7 space-y-3">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                          {faq.tags && faq.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {faq.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
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

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              ¿No encontraste lo que buscabas?
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Usa el botón de feedback en la esquina inferior derecha para enviarnos 
              tu pregunta o sugerencia. Nuestro equipo te ayudará lo antes posible.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}