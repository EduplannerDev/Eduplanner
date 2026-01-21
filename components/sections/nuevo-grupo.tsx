'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRoles } from '@/hooks/use-roles'
import { createGrupo, type CreateGrupoData } from '@/lib/grupos'
import { canUserCreateGroup } from '@/lib/subscription-utils'
import { useNotification } from '@/hooks/use-notification'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useContextoTrabajo } from '@/hooks/use-contexto-trabajo'

interface NuevoGrupoProps {
  onBack: () => void
  onSaveSuccess: () => void
}

const NuevoGrupo = ({ onBack, onSaveSuccess }: NuevoGrupoProps) => {
  const { user } = useAuth()
  const { plantel } = useRoles()
  const { success, error } = useNotification()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [limitCheck, setLimitCheck] = useState<{
    canCreate: boolean;
    currentCount: number;
    limit: number;
    message?: string;
    loading: boolean;
  }>({
    canCreate: true,
    currentCount: 0,
    limit: -1,
    loading: true
  })
  const [formData, setFormData] = useState<CreateGrupoData>({
    nombre: '',
    grado: '',
    grupo: '',
    nivel: '',
    ciclo_escolar: ''
  })

  const { availableContexts, loading: contextsLoading } = useContextoTrabajo()

  const [selectedContextId, setSelectedContextId] = useState<string>('')

  // Helper function to derive data from context grade (integer)
  const getContextDetails = (gradoInt: number) => {
    let nivel = ''
    let gradoStr = ''

    if (gradoInt < 0) {
      nivel = 'Preescolar'
      gradoStr = `${gradoInt + 4}°`
    } else if (gradoInt <= 6) {
      nivel = 'Primaria'
      gradoStr = `${gradoInt}°`
    } else {
      nivel = 'Secundaria'
      gradoStr = `${gradoInt - 6}°`
    }
    return { nivel, grado: gradoStr }
  }

  // Effect to handle context selection
  useEffect(() => {
    if (!contextsLoading && availableContexts.length > 0) {
      // If none selected, or if the user only has one, default to the first one (or the active one)
      // Usually we want to force the user to pick if multiple, but here we can default to the first/active one.
      // Let's check if we have one selected.
      if (!selectedContextId) {
        // Find active one or first
        const active = availableContexts.find(c => c.selected) || availableContexts[0]
        if (active) {
          handleContextChange(active.id)
        }
      }
    }
  }, [availableContexts, contextsLoading])

  const handleContextChange = (contextId: string) => {
    setSelectedContextId(contextId)
    const context = availableContexts.find(c => c.id === contextId)
    if (context) {
      const { nivel, grado } = getContextDetails(context.grado)
      setFormData(prev => ({
        ...prev,
        nivel,
        grado,
        ciclo_escolar: context.ciclo_escolar
      }))
    }
  }

  const grupos = ['A', 'B', 'C', 'D', 'E', 'F']

  // Verificar límites de grupos al cargar el componente
  useEffect(() => {
    const checkGroupLimits = async () => {
      if (!user?.id) return

      try {
        const result = await canUserCreateGroup(user.id)
        setLimitCheck({
          ...result,
          loading: false
        })
      } catch (error) {
        console.error('Error verificando límites:', error)
        setLimitCheck({
          canCreate: false,
          currentCount: 0,
          limit: 0,
          message: 'Error al verificar límites',
          loading: false
        })
      }
    }

    checkGroupLimits()
  }, [user?.id])

  const handleInputChange = (field: keyof CreateGrupoData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      setErrorMsg('Usuario no autenticado')
      return
    }

    if (!formData.nombre.trim() || !formData.grado || !formData.grupo || !formData.nivel || !formData.ciclo_escolar) {
      setErrorMsg('Por favor completa todos los campos obligatorios')
      return
    }

    // Verificar límites antes de crear
    if (!limitCheck.canCreate) {
      setErrorMsg(limitCheck.message || 'No puedes crear más grupos')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      // Usar el plantel del usuario actual
      const plantelId = plantel?.id || null

      await createGrupo(user.id, plantelId, {
        ...formData,
        nombre: formData.nombre.trim()
      })
      onSaveSuccess()
    } catch (err) {
      console.error('Error creating grupo:', err)
      setErrorMsg('Error al crear el grupo. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Nuevo Grupo</h1>
          <p className="text-gray-600 mt-2">Crea un nuevo grupo de estudiantes</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {errorMsg}
        </div>
      )}

      {/* Mostrar estado de carga de límites */}
      {limitCheck.loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verificando límites de grupos...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mostrar mensaje de límite alcanzado */}
      {!limitCheck.loading && !limitCheck.canCreate && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-orange-600 mb-4">
              <h3 className="text-lg font-semibold mb-2">🎉 ¡Felicitaciones! Has creado tu grupo</h3>
              <p className="text-muted-foreground mb-4">
                Has alcanzado el límite de grupos en el plan gratuito.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-700">
                  Tienes <strong>{limitCheck.currentCount}</strong> de <strong>{limitCheck.limit}</strong> grupos permitidos en el plan gratuito.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-blue-600 font-medium">
                  💫 Desbloquea tu potencial educativo con PRO: crea grupos ilimitados y organiza mejor tus clases
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={onBack}>
                    Volver
                  </Button>
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    Actualizar a PRO
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario - solo mostrar si puede crear grupos */}
      {!limitCheck.loading && limitCheck.canCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Información del Grupo</CardTitle>
            {/* Mostrar progreso de grupos para usuarios free */}
            {limitCheck.limit > 0 && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">Grupos utilizados</span>
                  <span className="text-sm text-blue-600">
                    {limitCheck.currentCount} / {limitCheck.limit}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (limitCheck.currentCount / limitCheck.limit) * 100)}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  💡 Plan gratuito - Actualiza a PRO para grupos ilimitados y mejor organización
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Grupo *</Label>
                  <Input
                    id="nombre"
                    type="text"
                    placeholder="ej. Matemáticas 5°A"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label>Contexto Educativo *</Label>
                  {availableContexts.length === 0 ? (
                    <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-200 text-sm">
                      No tienes contextos educativos configurados. Por favor configura tu grado escolar y ciclo desde tu perfil o el dashboard.
                    </div>
                  ) : (
                    <Select
                      value={selectedContextId}
                      onValueChange={handleContextChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el contexto" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableContexts.map((ctx) => {
                          const info = getContextDetails(ctx.grado)
                          return (
                            <SelectItem key={ctx.id} value={ctx.id}>
                              {info.nivel} {info.grado} - {ctx.ciclo_escolar}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Campos de solo lectura para información del contexto */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nivel Educativo</Label>
                    <Input value={formData.nivel} disabled className="bg-gray-100" />
                  </div>
                  <div className="space-y-2">
                    <Label>Grado</Label>
                    <Input value={formData.grado} disabled className="bg-gray-100" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grupo">Grupo *</Label>
                  <Select
                    value={formData.grupo}
                    onValueChange={(value) => handleInputChange('grupo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={<span className="notranslate">Selecciona el grupo</span>} />
                    </SelectTrigger>
                    <SelectContent>
                      {grupos.map((grupo) => (
                        <SelectItem key={grupo} value={grupo}>
                          {grupo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ciclo_escolar">Ciclo Escolar</Label>
                  <Input
                    id="ciclo_escolar"
                    value={formData.ciclo_escolar}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>



              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onBack}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Crear Grupo
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default NuevoGrupo