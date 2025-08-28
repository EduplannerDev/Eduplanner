"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, UserPlus, Settings, BarChart3, Shield } from "lucide-react"
import { useRoles } from "@/hooks/use-roles"
import { useToast } from "@/hooks/use-toast"
import { PlantelEstadisticas } from "./plantel-estadisticas"

interface AdministracionPlantelProps {
  isOpen: boolean
  onClose: () => void
}

export function AdministracionPlantel({ isOpen, onClose }: AdministracionPlantelProps) {
  const { isDirector, plantel, loading } = useRoles()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("profesores")

  // Verificar permisos
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!isDirector) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para acceder a este módulo. Solo los directores pueden gestionar su plantel.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!plantel) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            No tienes un plantel asignado. Contacta al administrador del sistema.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administración de Plantel</h1>
          <p className="text-muted-foreground">
            Gestiona los profesores y recursos de {plantel.nombre}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Director: {plantel.nombre}
        </Badge>
      </div>

      {/* Información del Plantel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Información del Plantel
          </CardTitle>
          <CardDescription>
            Detalles y configuración de tu plantel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-lg">{plantel.nombre}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <Badge variant={plantel.activo ? "default" : "secondary"}>
                {plantel.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            {plantel.direccion && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                <p>{plantel.direccion}</p>
              </div>
            )}
            {plantel.telefono && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                <p>{plantel.telefono}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Gestión */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profesores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Profesores
          </TabsTrigger>
          <TabsTrigger value="invitaciones" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invitaciones
          </TabsTrigger>
          <TabsTrigger value="estadisticas" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profesores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Profesores</CardTitle>
              <CardDescription>
                Administra los profesores asignados a tu plantel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Módulo en Desarrollo</h3>
                <p className="text-muted-foreground mb-4">
                  La gestión de profesores estará disponible próximamente.
                </p>
                <Button disabled>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invitar Profesor
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invitaciones Pendientes</CardTitle>
              <CardDescription>
                Gestiona las invitaciones enviadas a nuevos profesores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Módulo en Desarrollo</h3>
                <p className="text-muted-foreground">
                  El sistema de invitaciones estará disponible próximamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estadisticas" className="space-y-4">
          <PlantelEstadisticas />
        </TabsContent>
      </Tabs>
    </div>
  )
}