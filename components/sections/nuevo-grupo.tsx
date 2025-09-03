'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRoles } from '@/hooks/use-roles'
import { createGrupo, type CreateGrupoData } from '@/lib/grupos'
import { getAllPlanteles, type Plantel } from '@/lib/planteles'
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
  const { plantel, isAdmin, isDirector, isProfesor } = useRoles()
  const { success, error } = useNotification()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [planteles, setPlanteles] = useState<Plantel[]>([])
  const [selectedPlantel, setSelectedPlantel] = useState<string>('')
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

  // Cargar planteles disponibles
  const loadPlanteles = async () => {
    try {
      if (isAdmin) {
        // Admins pueden seleccionar cualquier plantel (obligatorio)
        const data: Plantel[] = await getAllPlanteles()
        setPlanteles(data)
        if (data.length > 0 && !selectedPlantel) {
          setSelectedPlantel(data[0].id)
        }
      } else if (isProfesor && !plantel) {
        // Profesores sin plantel pueden seleccionar cualquier plantel (opcional)
        const data: Plantel[] = await getAllPlanteles()
        setPlanteles(data)
        // No seleccionar automáticamente para profesores sin plantel
      } else if ((isDirector || isProfesor) && plantel) {
        // Directores y profesores con plantel asignado solo pueden usar su plantel
        setPlanteles([plantel])
        setSelectedPlantel(plantel.id)
      }
    } catch (err) {
      error("No se pudieron cargar los planteles", {
        title: "Error"
      })
    }
  }

  // Optimizado: solo cargar planteles una vez cuando el rol esté definido
  useEffect(() => {
    if (!loading && (isAdmin || isDirector || isProfesor)) {
      loadPlanteles()
    }
  }, [isAdmin, isDirector, isProfesor, loading])

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

    setLoading(true)
    setErrorMsg(null)

    try {
      // Solo validar plantel para administradores y directores
      if ((isAdmin || isDirector) && !selectedPlantel) {
        error("Por favor selecciona un plantel", {
          title: "Error"
        })
        return
      }
      
      // Para profesores sin plantel, usar null como plantel_id
      const plantelId = selectedPlantel || (isProfesor && !plantel ? null : selectedPlantel)
      
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

      {!isAdmin && !isDirector && !isProfesor && !plantel && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-600 mb-4">
              <h3 className="text-lg font-semibold mb-2">Sin Permisos</h3>
              <p className="text-muted-foreground">
                No tienes permisos para crear grupos. Contacta al administrador.
              </p>
            </div>
            <Button variant="outline" onClick={onBack}>
              Volver
            </Button>
          </CardContent>
        </Card>
      )}

      {(isAdmin || isDirector || isProfesor) && (
        <Card>
          <CardHeader>
            <CardTitle>Información del Grupo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {(isAdmin || (isProfesor && !plantel)) && planteles.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="plantel">
                    Plantel {isAdmin ? '*' : '(Opcional)'}
                  </Label>
                  <Select value={selectedPlantel} onValueChange={setSelectedPlantel}>
                    <SelectTrigger>
                      <SelectValue placeholder={isAdmin ? "Selecciona un plantel" : "Selecciona un plantel (opcional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {planteles.map((plantel) => (
                        <SelectItem key={plantel.id} value={plantel.id}>
                          {plantel.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
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