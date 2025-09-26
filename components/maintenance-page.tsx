"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wrench, Clock, Mail, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export default function MaintenancePage() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 30,
    seconds: 0
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Logo y título */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Wrench className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Estamos en Mantenimiento
          </h1>
          <p className="text-xl text-gray-600 max-w-md mx-auto">
            Estamos mejorando EduPlanner para ofrecerte una mejor experiencia
          </p>
        </div>

        {/* Card principal */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 space-y-6">
            {/* Estado */}
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 px-4 py-2">
                <Clock className="w-4 h-4 mr-2" />
                Mantenimiento Programado
              </Badge>
            </div>

            {/* Tiempo estimado */}
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Tiempo estimado de finalización
              </h3>
              <div className="flex justify-center space-x-4">
                <div className="bg-gray-100 rounded-lg p-4 min-w-[80px]">
                  <div className="text-2xl font-bold text-gray-900">{timeLeft.hours.toString().padStart(2, '0')}</div>
                  <div className="text-sm text-gray-600">Horas</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 min-w-[80px]">
                  <div className="text-2xl font-bold text-gray-900">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                  <div className="text-sm text-gray-600">Minutos</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 min-w-[80px]">
                  <div className="text-2xl font-bold text-gray-900">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                  <div className="text-sm text-gray-600">Segundos</div>
                </div>
              </div>
            </div>

            {/* Información */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">¿Qué estamos mejorando?</h4>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• Optimización del sistema de generación de planeaciones</li>
                  <li>• Mejoras en la velocidad de respuesta</li>
                  <li>• Nuevas funcionalidades para profesores</li>
                  <li>• Actualizaciones de seguridad</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">¿Necesitas ayuda urgente?</h4>
                <p className="text-green-800 text-sm mb-3">
                  Si tienes alguna emergencia o consulta urgente, puedes contactarnos:
                </p>
                <div className="flex items-center space-x-2 text-green-800">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">soporte@eduplanner.mx</span>
                </div>
              </div>
            </div>

            {/* Botón de actualizar */}
            <div className="text-center pt-4">
              <Button 
                onClick={handleRefresh}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Verificar Estado
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Gracias por tu paciencia. Volveremos pronto con mejoras increíbles.</p>
          <p className="mt-2">© 2024 EduPlanner - Plataforma educativa para profesores</p>
        </div>
      </div>
    </div>
  )
}