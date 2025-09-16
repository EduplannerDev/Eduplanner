"use client"

import { BetaFeatureWrapper, BetaAccessDenied, useBetaAccess } from '@/components/ui/beta-feature-wrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, MessageSquare, Zap, Lock, BarChart3, Settings, Code, FileText } from 'lucide-react'

export function BetaFeaturesDemo() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Funcionalidades Beta</h2>
        <p className="text-muted-foreground">
          Explora las nuevas funcionalidades disponibles para beta testers
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 max-w-2xl">
        {/* Módulo de Proyectos */}
        <BetaFeatureWrapper
          featureKey="proyectos"
          fallback={
            <BetaAccessDenied 
              featureName="Módulo de Proyectos"
              className="h-80"
            />
          }
          showBadge={true}
          badgePosition="top-right"
        >
          <Card className="h-80">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>Módulo de Proyectos</CardTitle>
              </div>
              <CardDescription>
                Sistema completo de gestión de proyectos educativos con seguimiento, tareas y colaboración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Gestión de Tareas</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Crear y asignar tareas del proyecto
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Seguimiento</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Monitorear avances y colaboración
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Colaboración</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Trabajo en equipo entre profesores y estudiantes
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Plantillas</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Plantillas de proyectos por materia
                  </p>
                </div>
              </div>
              
              <div className="pt-4">
                <Button className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Crear Nuevo Proyecto
                </Button>
              </div>
            </CardContent>
          </Card>
        </BetaFeatureWrapper>
      </div>
    </div>
  )
}

