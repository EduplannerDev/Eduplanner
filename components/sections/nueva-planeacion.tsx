"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, BookOpen, Clock, Users } from "lucide-react"

interface NuevaPlaneacionProps {
  onCreateClass: () => void
}

export function NuevaPlaneacion({ onCreateClass }: NuevaPlaneacionProps) {
  const planTypes = [
    {
      id: "semanal",
      title: "Planeación Semanal",
      description: "Planifica una semana completa de actividades educativas",
      icon: BookOpen,
      color: "text-blue-600",
      enabled: false,
      comingSoon: true,
    },
    {
      id: "individual",
      title: "Planeación Individual",
      description: "Diseña una planeación específica con objetivos y actividades",
      icon: Clock,
      color: "text-green-600",
      enabled: true,
      comingSoon: false,
    },
    {
      id: "proyecto",
      title: "Proyecto Grupal",
      description: "Organiza un proyecto colaborativo para tus paralelas",
      icon: Users,
      color: "text-purple-600",
      enabled: false,
      comingSoon: true,
    },
  ]

  const materias = [
    { name: "Matemáticas", enabled: false },
    { name: "Español", enabled: false },
    { name: "Ciencias", enabled: false },
    { name: "Historia", enabled: false },
  ]

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Nueva Planeación</h1>
          <p className="text-gray-600 mt-2">Crea una nueva planeación didáctica para tus clases de primaria</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {planTypes.map((planType) => {
            const IconComponent = planType.icon

            if (planType.enabled) {
              // Tarjeta habilitada (solo Clase Individual)
              return (
                <Card
                  key={planType.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-200"
                  onClick={onCreateClass}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <IconComponent className={`h-5 w-5 ${planType.color}`} />
                      <CardTitle className="text-lg">{planType.title}</CardTitle>
                    </div>
                    <CardDescription>{planType.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={onCreateClass}>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear {planType.title}
                    </Button>
                  </CardContent>
                </Card>
              )
            } else {
              // Tarjeta deshabilitada con tooltip
              return (
                <Tooltip key={planType.id}>
                  <TooltipTrigger asChild>
                    <Card className="opacity-60 cursor-not-allowed border-dashed border-2 border-gray-300">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`h-5 w-5 text-gray-400`} />
                          <CardTitle className="text-lg text-gray-500">{planType.title}</CardTitle>
                        </div>
                        <CardDescription className="text-gray-400">{planType.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full" variant="outline" disabled>
                          <Plus className="mr-2 h-4 w-4" />
                          Crear {planType.title}
                        </Button>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">🚀 Próximamente</p>
                    <p className="text-sm">Esta función estará disponible pronto</p>
                  </TooltipContent>
                </Tooltip>
              )
            }
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Plantillas Rápidas</CardTitle>
            <CardDescription>Comienza con plantillas prediseñadas para diferentes materias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {materias.map((materia) => (
                <Tooltip key={materia.name}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className={`h-20 flex-col ${materia.enabled
                          ? "hover:bg-gray-50"
                          : "opacity-60 cursor-not-allowed border-dashed text-gray-400"
                        }`}
                      disabled={!materia.enabled}
                    >
                      <BookOpen className={`h-6 w-6 mb-2 ${materia.enabled ? "" : "text-gray-400"}`} />
                      {materia.name}
                    </Button>
                  </TooltipTrigger>
                  {!materia.enabled && (
                    <TooltipContent>
                      <p className="font-medium">🚀 Próximamente</p>
                      <p className="text-sm">Plantillas de {materia.name} en desarrollo</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sección adicional para mostrar el progreso del MVP */}
        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              🚧 Estamos construyendo EduPlanner paso a paso para brindarte la mejor experiencia
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Estás utilizando una versión alfa, por lo que algunas funciones pueden cambiar o no estar disponibles temporalmente.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">✅ Autenticación y Perfil</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Completado</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">✅ Crear Planeaciones con IA</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Completado</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">✅ Crear Mensajes con IA</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Completado</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">✅ Crear Examenes con IA</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Completado</span>
              </div>
                <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">✅ Bitactora personal y segura</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Completado</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">⏳ Planeación Semanal</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Próximamente</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">⏳ Proyectos Grupales</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Próximamente</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
