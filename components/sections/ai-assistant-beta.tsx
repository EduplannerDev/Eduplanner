"use client"

import { BetaFeatureWrapper, BetaAccessDenied, useBetaAccess } from '@/components/ui/beta-feature-wrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, MessageSquare, Zap, Lock } from 'lucide-react'

export function ProyectosBeta() {
  return (
    <BetaFeatureWrapper
      featureKey="proyectos"
      fallback={
        <BetaAccessDenied 
          featureName="Módulo de Proyectos"
          className="h-64"
        />
      }
      showBadge={true}
      badgePosition="top-right"
    >
      <Card className="h-64">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Módulo de Proyectos</CardTitle>
          </div>
          <CardDescription>
            Sistema completo de gestión de proyectos educativos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Gestión de Tareas</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Crear y asignar tareas del proyecto
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Seguimiento</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Monitorear avances y colaboración
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
  )
}

// Ejemplo de uso con hook directo
export function ProyectosAnalyticsBeta() {
  const { hasAccess, isBetaTester, renderIfAccess } = useBetaAccess('proyectos')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Estadísticas de Proyectos</span>
          {hasAccess && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Sparkles className="h-3 w-3" />
              <span>Beta</span>
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Dashboard con métricas de proyectos y seguimiento de avances
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderIfAccess(
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">12</div>
                <div className="text-sm text-muted-foreground">Proyectos Activos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">85%</div>
                <div className="text-sm text-muted-foreground">Completados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">24</div>
                <div className="text-sm text-muted-foreground">Tareas Pendientes</div>
              </div>
            </div>
            <Button className="w-full">
              Ver Dashboard de Proyectos
            </Button>
          </div>,
          <div className="text-center py-8">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Esta funcionalidad está disponible solo para beta testers
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
