"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Plus, Calendar, BookOpen, Target, Loader2 } from "lucide-react"
import { useState } from "react"

interface DosificacionProps {
  onCreateNew?: () => void
}

export function Dosificacion({ onCreateNew }: DosificacionProps) {
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dosificación</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona la dosificación curricular y distribución de contenidos
          </p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Dosificación
        </Button>
      </div>

      {/* Estado inicial - módulo vacío */}
      <Card className="text-center py-12">
        <CardContent>
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Módulo de Dosificación
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Este módulo está en desarrollo. Aquí podrás gestionar la dosificación curricular,
            distribuir contenidos por periodo y realizar seguimiento del progreso académico.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
              <CardHeader className="pb-3">
                <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Distribución Temporal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Organiza contenidos por bimestres, trimestres o semestres
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
              <CardHeader className="pb-3">
                <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contenidos Curriculares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Define temas, subtemas y actividades por periodo
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
              <CardHeader className="pb-3">
                <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Seguimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Monitorea el avance y cumplimiento de objetivos
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8">
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              Próximamente disponible
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sección de funcionalidades futuras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Características Planificadas
            </CardTitle>
            <CardDescription>
              Funcionalidades que estarán disponibles en este módulo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Creación de dosificaciones por materia y grado
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Distribución automática de contenidos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Vinculación con planeaciones didácticas
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Reportes de avance curricular
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Exportación en múltiples formatos
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Beneficios del Módulo
            </CardTitle>
            <CardDescription>
              Ventajas de usar la dosificación curricular
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Mejor organización del año escolar
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Cumplimiento de programas oficiales
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Seguimiento del progreso académico
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Planificación anticipada de recursos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Evaluación continua del avance
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
