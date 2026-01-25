"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  FileText,
  FolderOpen,
  BookOpen,
  Activity,
  TrendingUp,
  UserCheck,
  Clock,
  Star,
  Award,
  Target,
  History,
  AlertTriangle,
  TrendingDown,
  Settings
} from "lucide-react"
import { useRoles } from "@/hooks/use-roles"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PlaneacionesReviewSection } from "./planeaciones-review-section"
import { PlaneacionesHistorySection } from "./planeaciones-history-section"
import { IncidenciasSection } from "./incidencias-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardPulse } from "./dashboard-pulse/dashboard-pulse"


import { SemaforoDesercion } from "./director-dashboard/semaforo-desercion"
import { ConfiguracionTab } from "./director-dashboard/configuracion-tab"
import { ReportesTab } from "./director-dashboard/reportes-tab"

interface DirectorDashboardProps {
  onSectionChange?: (section: string) => void
  initialTab?: string
}

export function DirectorDashboard({ onSectionChange, initialTab = "pulso" }: DirectorDashboardProps) {
  const { plantel, loading: rolesLoading } = useRoles()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [autoCreateIncidencia, setAutoCreateIncidencia] = useState(false)

  // Sincronizar tab activo cuando cambia la prop initialTab (navegación externa)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  if (rolesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard del director...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Dashboard del Director</h1>
          <p className="text-muted-foreground mt-1">
            Pulso de la plataforma • {plantel?.nombre}
          </p>
        </div>
        <div className="text-right">
          <Badge variant="secondary" className="mb-2">
            <Target className="h-3 w-3 mr-1" />
            Director
          </Badge>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      {/* Main Tabs Structure */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-[900px]">
          <TabsTrigger value="pulso" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Pulso
          </TabsTrigger>
          <TabsTrigger value="planeaciones" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Planeaciones
          </TabsTrigger>
          <TabsTrigger value="incidencias" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Incidencias
          </TabsTrigger>
          <TabsTrigger value="riesgo" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Riesgo
          </TabsTrigger>
          <TabsTrigger value="reportes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reportes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pulso" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Resumen en Tiempo Real</h2>
              <p className="text-muted-foreground">
                Vista general del estado del plantel hoy.
              </p>
            </div>
            <Button
              variant="destructive"
              className="shadow-md hover:shadow-lg transition-all transform hover:scale-105 font-bold"
              onClick={() => {
                setAutoCreateIncidencia(true)
                setActiveTab("incidencias")
              }}
            >
              🚨 Reportar Incidente
            </Button>
          </div>

          <DashboardPulse />
        </TabsContent>

        {/* --- TAB: PLANEACIONES --- */}
        <TabsContent value="planeaciones">
          <Tabs defaultValue="pendientes" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="pendientes" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Por Validar
                </TabsTrigger>
                <TabsTrigger value="historial" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Historial (Validadas)
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="pendientes" className="mt-0">
              {/* Sección para validar planeaciones pendientes */}
              <PlaneacionesReviewSection plantelId={plantel?.id || ''} />
            </TabsContent>

            <TabsContent value="historial" className="mt-0">
              {/* Sección para ver historial de planeaciones ya validadas */}
              <PlaneacionesHistorySection plantelId={plantel?.id || ''} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* --- TAB: INCIDENCIAS --- */}
        <TabsContent value="incidencias">
          <IncidenciasSection
            plantelId={plantel?.id || ''}
            autoStart={autoCreateIncidencia}
            onAutoStartResult={() => setAutoCreateIncidencia(false)}
          />
        </TabsContent>

        {/* --- TAB: RIESGO --- */}
        <TabsContent value="riesgo">
          <SemaforoDesercion plantelId={plantel?.id || ''} />
        </TabsContent>

        {/* --- TAB: CONFIGURACIÓN --- */}

        {/* --- TAB: REPORTES --- */}
        <TabsContent value="reportes">
          <ReportesTab plantel={plantel} />
        </TabsContent>
      </Tabs>
    </div>
  )
}