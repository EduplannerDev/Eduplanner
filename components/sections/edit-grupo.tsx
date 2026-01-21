'use client'

import { useState, useEffect } from 'react'
import { getGrupoById, updateGrupo, type Grupo, type UpdateGrupoData } from '@/lib/grupos'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useContextoTrabajo } from '@/hooks/use-contexto-trabajo'

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
          ciclo_escolar: grupoData.ciclo_escolar,
          grupo: grupoData.grupo
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

  // Try to match existing group data to a context
  useEffect(() => {
    if (!contextsLoading && availableContexts.length > 0 && formData.grado && formData.nivel) {
      // Try to find a context that matches the current group data
      // This is a best-effort match since we store strings in 'grupos' and integers in 'contexto_trabajo'
      const matchedContext = availableContexts.find(c => {
        const { nivel, grado } = getContextDetails(c.grado)
        // Check if strings match (e.g. "1°" matches "1°", "Primaria" matches "Primaria")
        // Note: formData.grado usually comes as "1°", "2°", etc.
        return nivel === formData.nivel && grado === formData.grado && c.ciclo_escolar === formData.ciclo_escolar
      })

      if (matchedContext) {
        setSelectedContextId(matchedContext.id)
      } else if (!selectedContextId) {
        // If no exact match found and no context selected yet, maybe select the first active one?
        // Or leave it empty to force user to choose if they want to change it.
        // But the prompt says "take automatically", so let's default to active if no match found 
        // BUT ONLY if we are setting it up initially. 
        // Actually, if we are editing, we probably want to keep what was there UNLESS the user changes the context status.
        // If we force valid context, we might change their data.
        // Let's settle on: if exact match found, select it. If not, user has to select to update context fields.
      }
    }
  }, [contextsLoading, availableContexts, formData.grado, formData.nivel, formData.ciclo_escolar])

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
                <Label htmlFor="grupo">Grupo *</Label>
                <Select
                  value={formData.grupo || ''}
                  onValueChange={(value) => handleInputChange('grupo', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D', 'E', 'F'].map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
                <div className="space-y-2">
                  <Label>Nivel Educativo</Label>
                  <Input value={formData.nivel || ''} disabled className="bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  <Label>Grado</Label>
                  <Input value={formData.grado || ''} disabled className="bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>

              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label>Ciclo Escolar</Label>
                <Input value={formData.ciclo_escolar || ''} disabled className="bg-gray-100 dark:bg-gray-800" />
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