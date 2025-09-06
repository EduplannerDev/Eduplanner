"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Plus, BookOpen, Clock, Users, Crown, AlertTriangle } from "lucide-react"
import { usePlaneaciones } from "@/hooks/use-planeaciones"
import { useProfile } from "@/hooks/use-profile"
import { isUserPro } from "@/lib/subscription-utils"

interface NuevaPlaneacionProps {
  onCreateClass: () => void
}

export function NuevaPlaneacion({ onCreateClass }: NuevaPlaneacionProps) {
  const { monthlyCount, getRemainingPlaneaciones, canCreateMore } = usePlaneaciones()
  const { profile } = useProfile()
  const isPro = profile ? isUserPro(profile) : false
  const remainingPlaneaciones = getRemainingPlaneaciones()
  const hasReachedLimit = !isPro && monthlyCount >= 5
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
      enabled: !hasReachedLimit,
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


  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Nueva Planeación</h1>
          <p className="text-gray-600 mt-2">Crea una nueva planeación didáctica para tus clases de primaria</p>
          
          {hasReachedLimit && (
            <Card className="mt-4 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
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
              const isLimitReached = planType.id === "individual" && hasReachedLimit
              
              return (
                <Tooltip key={planType.id}>
                  <TooltipTrigger asChild>
                    <Card className="opacity-60 cursor-not-allowed border-dashed border-2 border-gray-300">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`h-5 w-5 text-gray-400`} />
                          <CardTitle className="text-lg text-gray-500">{planType.title}</CardTitle>
                          {isLimitReached && (
                            <Badge variant="destructive" className="ml-auto">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Límite alcanzado
                            </Badge>
                          )}
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
                    {isLimitReached ? (
                      <div className="space-y-2">
                        <p className="font-medium flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          Límite mensual alcanzado
                        </p>
                        <p className="text-sm">Has creado {monthlyCount}/5 planeaciones este mes</p>
                        <p className="text-sm flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Actualiza a PRO para crear ilimitadas
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">🚀 Próximamente</p>
                        <p className="text-sm">Esta función estará disponible pronto</p>
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              )
            }
          })}
        </div>


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
