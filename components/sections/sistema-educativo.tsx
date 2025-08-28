"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminDashboard } from './admin-dashboard'
import { GestionarGrupos } from './gestionar-grupos'
import { useRoles } from '@/hooks/use-roles'
import { Building2, Users, BookOpen, Settings, BarChart3, Shield } from 'lucide-react'

export function SistemaEducativo() {
  const { isAdmin, isDirector, isProfesor, plantel, role, loading } = useRoles()
  const [activeTab, setActiveTab] = useState('dashboard')

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando sistema educativo...</p>
        </div>
      </div>
    )
  }

  const roleLabels = {
    administrador: 'Administrador',
    director: 'Director',
    profesor: 'Profesor'
  }

  const roleColors = {
    administrador: 'destructive' as const,
    director: 'default' as const,
    profesor: 'secondary' as const
  }

  // Determinar qué tabs mostrar según el rol
  const availableTabs = []
  
  if (isAdmin || isDirector) {
    availableTabs.push({
      value: 'dashboard',
      label: 'Panel de Control',
      icon: BarChart3,
      description: 'Resumen y administración general'
    })
  }
  
  if (isAdmin || isDirector || isProfesor) {
    availableTabs.push({
      value: 'grupos',
      label: 'Grupos',
      icon: BookOpen,
      description: 'Gestión de grupos y clases'
    })
  }

  if (availableTabs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Pendiente</h3>
          <p className="text-muted-foreground">
            Tu cuenta está siendo configurada. Contacta al administrador para obtener acceso al sistema.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header del sistema */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Sistema Educativo</h1>
          <p className="text-muted-foreground mt-1">
            Plataforma integral de gestión educativa
          </p>
        </div>
        <div className="text-right">
          <Badge variant={roleColors[role]} className="mb-2">
            {roleLabels[role]}
          </Badge>
          {plantel && (
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {plantel.nombre}
              </div>
              {plantel.direccion && (
                <div className="text-xs mt-1">
                  {plantel.direccion}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Información contextual según el rol */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {role === 'administrador' && <Settings className="h-5 w-5 text-primary" />}
              {role === 'director' && <Building2 className="h-5 w-5 text-primary" />}
              {role === 'profesor' && <BookOpen className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                Bienvenido, {roleLabels[role]}
              </h3>
              <p className="text-sm text-muted-foreground">
                {role === 'administrador' && 'Tienes acceso completo para gestionar planteles, usuarios y configuraciones del sistema.'}
                {role === 'director' && `Puedes gestionar usuarios y grupos de ${plantel?.nombre || 'tu plantel'}.`}
                {role === 'profesor' && `Puedes crear y gestionar tus grupos en ${plantel?.nombre || 'tu plantel'}.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navegación por tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${availableTabs.length === 1 ? 'grid-cols-1' : availableTabs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {availableTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Contenido de las tabs */}
        {availableTabs.some(tab => tab.value === 'dashboard') && (
          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>
        )}

        {availableTabs.some(tab => tab.value === 'grupos') && (
          <TabsContent value="grupos">
            <GestionarGrupos />
          </TabsContent>
        )}
      </Tabs>

      {/* Footer informativo */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Sistema Educativo v1.0</span>
              {plantel && (
                <span>•</span>
              )}
              {plantel && (
                <span>{plantel.nombre}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {roleLabels[role]}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}