'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { createGrupo, type CreateGrupoData } from '@/lib/grupos'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NuevoGrupoProps {
  onBack: () => void
  onSaveSuccess: () => void
}

const NuevoGrupo = ({ onBack, onSaveSuccess }: NuevoGrupoProps) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateGrupoData>({
    nombre: '',
    grado: '',
    nivel: '',
    ciclo_escolar: '',
    descripcion: '',
    numero_alumnos: 0
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

  const getCurrentSchoolYear = () => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    
    // Si estamos en agosto o después, el ciclo escolar actual es currentYear-currentYear+1
    // Si estamos antes de agosto, el ciclo escolar actual es currentYear-1-currentYear
    if (currentMonth >= 7) { // Agosto = 7 (0-indexed)
      return `${currentYear}-${currentYear + 1}`
    } else {
      return `${currentYear - 1}-${currentYear}`
    }
  }

  const ciclosEscolares = [
    getCurrentSchoolYear(),
    `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    `${new Date().getFullYear() + 1}-${new Date().getFullYear() + 2}`
  ]

  const handleInputChange = (field: keyof CreateGrupoData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      setError('Usuario no autenticado')
      return
    }

    if (!formData.nombre.trim() || !formData.grado || !formData.nivel || !formData.ciclo_escolar) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await createGrupo(user.id, {
        ...formData,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || undefined
      })
      onSaveSuccess()
    } catch (err) {
      console.error('Error creating grupo:', err)
      setError('Error al crear el grupo. Por favor intenta de nuevo.')
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información del Grupo</CardTitle>
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
                    handleInputChange('grado', '') // Reset grado when nivel changes
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
                <Label htmlFor="ciclo_escolar">Ciclo Escolar *</Label>
                <Select 
                  value={formData.ciclo_escolar} 
                  onValueChange={(value) => handleInputChange('ciclo_escolar', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el ciclo escolar" />
                  </SelectTrigger>
                  <SelectContent>
                    {ciclosEscolares.map((ciclo) => (
                      <SelectItem key={ciclo} value={ciclo}>
                        {ciclo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_alumnos">Número de Alumnos</Label>
                <Input
                  id="numero_alumnos"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numero_alumnos}
                  onChange={(e) => handleInputChange('numero_alumnos', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (Opcional)</Label>
              <Textarea
                id="descripcion"
                placeholder="Descripción adicional del grupo..."
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
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
                    Guardar Grupo
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default NuevoGrupo