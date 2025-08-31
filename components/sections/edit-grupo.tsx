'use client'

import { useState, useEffect } from 'react'
import { getGrupoById, updateGrupo, type Grupo, type UpdateGrupoData } from '@/lib/grupos'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditGrupoProps {
  grupoId: string
  onBack: () => void
  onSaveSuccess: () => void
}

const EditGrupo = ({ grupoId, onBack, onSaveSuccess }: EditGrupoProps) => {
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<UpdateGrupoData>({})

  const niveles = [
    'Preescolar',
    'Primaria',
    'Secundaria',
    'Preparatoria',
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
    
    if (currentMonth >= 7) {
      return `${currentYear}-${currentYear + 1}`
    } else {
      return `${currentYear - 1}-${currentYear}`
    }
  }

  const ciclosEscolares = [
    getCurrentSchoolYear(),
    `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    `${new Date().getFullYear() + 1}-${new Date().getFullYear() + 2}`
  ].filter((ciclo, index, array) => array.indexOf(ciclo) === index) // Eliminar duplicados

  useEffect(() => {
    const fetchGrupo = async () => {
      setLoading(true)
      setError(null)
      try {
        const grupoData = await getGrupoById(grupoId)
        if (!grupoData) {
          setError('Grupo no encontrado')
          return
        }
        setGrupo(grupoData)
        setFormData({
          nombre: grupoData.nombre,
          grado: grupoData.grado,
          nivel: grupoData.nivel,
          ciclo_escolar: grupoData.ciclo_escolar
        })
      } catch (err) {
        console.error('Error fetching grupo:', err)
        setError('Error al cargar el grupo')
      } finally {
        setLoading(false)
      }
    }

    fetchGrupo()
  }, [grupoId])

  const handleInputChange = (field: keyof UpdateGrupoData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre?.trim() || !formData.grado || !formData.nivel || !formData.ciclo_escolar) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await updateGrupo(grupoId, {
        ...formData,
        nombre: formData.nombre?.trim()
      })
      onSaveSuccess()
    } catch (err) {
      console.error('Error updating grupo:', err)
      setError('Error al actualizar el grupo. Por favor intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando grupo...</span>
      </div>
    )
  }

  if (error && !grupo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Editar Grupo</h1>
          <p className="text-gray-600 mt-2">Modifica la información del grupo</p>
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
                  value={formData.nombre || ''}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nivel">Nivel Educativo *</Label>
                <Select 
                  value={formData.nivel || ''} 
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
                  value={formData.grado || ''} 
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
                  value={formData.ciclo_escolar || ''} 
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


            </div>



            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
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

export default EditGrupo