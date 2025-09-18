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

  const niveles = [
    'Preescolar',
    'Primaria',
    'Secundaria',
    'Preparatoria'
  ]

  const grados = {
    'Preescolar': ['1°', '2°', '3°'],
    'Primaria': ['1°', '2°', '3°', '4°', '5°', '6°'],
    'Secundaria': ['1°', '2°', '3°'],
    'Preparatoria': ['1°', '2°', '3°']
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

  const getCurrentSchoolYear = () => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    
    if (currentMonth >= 7) {
      return `${currentYear}-${currentYear + 1}`
    } else {
      return `${currentYear - 1}-${currentYear}`
    }
  }

  const handleInputChange = (field: keyof CreateGrupoData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    if (field === 'nombre' && !formData.ciclo_escolar) {
      setFormData(prev => ({
        ...prev,
        ciclo_escolar: getCurrentSchoolYear()
      }))
    }
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
              <h3 className="text-lg font-semibold mb-2">Límite de Grupos Alcanzado</h3>
              <p className="text-muted-foreground mb-4">
                {limitCheck.message}
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-700">
                  Tienes <strong>{limitCheck.currentCount}</strong> de <strong>{limitCheck.limit}</strong> grupos permitidos en el plan gratuito.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Actualiza a <strong>Plan PRO</strong> para crear grupos ilimitados
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
                Plan gratuito - Actualiza a PRO para grupos ilimitados
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

                <div className="space-y-2">
                  <Label htmlFor="nivel">Nivel Educativo *</Label>
                  <Select 
                    value={formData.nivel} 
                    onValueChange={(value) => {
                      handleInputChange('nivel', value)
                      handleInputChange('grado', '')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      {niveles.map((nivel) => (
                        <SelectItem key={nivel} value={nivel}>
                          {nivel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grado">Grado *</Label>
                  <Select 
                    value={formData.grado} 
                    onValueChange={(value) => handleInputChange('grado', value)}
                    disabled={!formData.nivel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el grado" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.nivel && grados[formData.nivel as keyof typeof grados]?.map((grado) => (
                        <SelectItem key={grado} value={grado}>
                          {grado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grupo">Grupo *</Label>
                  <Select 
                    value={formData.grupo} 
                    onValueChange={(value) => handleInputChange('grupo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el grupo" />
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
                  <Label htmlFor="ciclo_escolar">Ciclo Escolar *</Label>
                  <Input
                    id="ciclo_escolar"
                    type="text"
                    placeholder="ej. 2024-2025"
                    value={formData.ciclo_escolar}
                    onChange={(e) => handleInputChange('ciclo_escolar', e.target.value)}
                    required
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