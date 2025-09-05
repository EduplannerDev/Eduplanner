"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Smartphone, Laptop, Calendar, BookOpen, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { saveMobileNotificationEmail } from "@/lib/mobile-notifications"

interface MobileLandingProps {
  onContinueToDesktop: () => void
}

export function MobileLanding({ onContinueToDesktop }: MobileLandingProps) {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const result = await saveMobileNotificationEmail({
        email: email,
        source: 'mobile_landing',
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          referrer: document.referrer || 'direct'
        }
      })
      
      if (result.success) {
        setIsSubscribed(true)
        
        if (result.data?.isDuplicate) {
          toast({
            title: "¡Ya estás registrado!",
            description: "Te notificaremos cuando las apps estén listas",
          })
        } else {
          toast({
            title: "¡Gracias!",
            description: "Te notificaremos cuando las apps estén listas",
          })
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Hubo un problema al registrar tu email. Inténtalo de nuevo.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error submitting email:', error)
      toast({
        title: "Error",
        description: "Hubo un problema al registrar tu email. Inténtalo de nuevo.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardContent className="p-8">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/images/Logo.png" 
                alt="EduPlanner" 
                className="h-16 w-auto"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              ¡Bienvenido a tu Asistente Educativo!
            </h1>
                         <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed text-justify">
               Parece que nos visitas desde tu móvil. La experiencia completa de EduPlanner, 
               con todas las herramientas de creación de planeaciones, exámenes y expedientes, 
               está optimizada para que la disfrutes en computadoras de escritorio y laptops.
             </p>
          </div>

          {/* Próximamente */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Próximamente: La Experiencia Móvil que Mereces
              </h2>
            </div>
                         <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 text-justify">
               ¡Pero no te preocupes! Estamos trabajando en nuestras aplicaciones nativas 
               para iOS y Android para darte acceso a tus funciones 
               más importantes sobre la marcha, como la Agenda y el Diario Profesional.
             </p>
            
            {/* Funciones que vendrán */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Calendar className="h-4 w-4 text-green-600" />
                <span>Agenda móvil</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <BookOpen className="h-4 w-4 text-green-600" />
                <span>Diario Profesional</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Notificaciones inteligentes</span>
              </div>
            </div>
          </div>

          {/* Formulario de email */}
          {!isSubscribed ? (
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                ¿Quieres ser el primero/a en saber cuándo estén listas?
              </h3>
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="tu-correo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                    disabled={isSubmitting}
                  />
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-4"
                  >
                    {isSubmitting ? "..." : "Notifícame"}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">¡Te notificaremos cuando estén listas!</span>
              </div>
            </div>
          )}

          {/* Botón para continuar */}
          <div className="text-center">
            <button
              onClick={onContinueToDesktop}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
            >
              Continuar al sitio de escritorio de todas formas (la experiencia puede no ser óptima)
            </button>
          </div>

          {/* Iconos decorativos */}
          <div className="flex justify-center gap-4 mt-8 opacity-30">
            <Laptop className="h-6 w-6 text-gray-400" />
            <Smartphone className="h-6 w-6 text-gray-400" />
            <Mail className="h-6 w-6 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
