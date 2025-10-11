"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calculator, BookOpen, Sparkles, ArrowLeft } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { isUserPro } from "@/lib/subscription-utils"
import { usePlaneaciones } from "@/hooks/use-planeaciones"
import { getCleanContentForSaving } from "@/lib/planeaciones"

interface PlaneacionCimeProps {
  onBack: () => void
  onSuccess: () => void
}

interface CimeFormData {
  grado: string
  temaEspecifico: string
  material: "regletas" | "geoplano" | "ambos"
  conocimientosPrevios: string
}

const GRADOS = [
  { value: "1", label: "1º Primaria" },
  { value: "2", label: "2º Primaria" },
  { value: "3", label: "3º Primaria" },
  { value: "4", label: "4º Primaria" },
  { value: "5", label: "5º Primaria" },
  { value: "6", label: "6º Primaria" },
]

const MATERIALES = [
  {
    value: "regletas" as const,
    label: "Regletas",
    description: "Material Cuisenaire para trabajar conceptos numéricos",
    icon: "📏"
  },
  {
    value: "geoplano" as const,
    label: "Geoplano",
    description: "Tablero con clavijas para geometría y patrones",
    icon: "📐"
  },
  {
    value: "ambos" as const,
    label: "Ambos",
    description: "Regletas y Geoplano combinados",
    icon: "🧮"
  }
]

export function PlaneacionCime({ onBack, onSuccess }: PlaneacionCimeProps) {
  const { user } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const { createPlaneacion, creating, canCreateMore } = usePlaneaciones()
  const [formData, setFormData] = useState<CimeFormData>({
    grado: "",
    temaEspecifico: "",
    material: "regletas",
    conocimientosPrevios: ""
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedContent, setGeneratedContent] = useState<string>("")

  const isPro = profile ? isUserPro(profile) : false

  const handleInputChange = (field: keyof CimeFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const handleMaterialSelect = (material: "regletas" | "geoplano" | "ambos") => {
    setFormData(prev => ({
      ...prev,
      material
    }))
    setError(null)
  }

  const validateForm = (): boolean => {
    if (!formData.grado) {
      setError("Por favor selecciona un grado")
      return false
    }
    if (!formData.temaEspecifico.trim()) {
      setError("Por favor ingresa el tema específico")
      return false
    }
    if (!formData.material) {
      setError("Por favor selecciona un material")
      return false
    }
    return true
  }

  const handleGenerate = async () => {
    if (!validateForm()) return

    const canCreate = await canCreateMore();
    if (!canCreate) {
      setError('Has alcanzado el límite de planeaciones para tu plan. Actualiza a PRO para crear ilimitadas.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const prompt = `Necesito una planeación didáctica completa para ${formData.grado}° grado sobre el tema "${formData.temaEspecifico}" usando la metodología CIME.

Material principal: ${formData.material === 'regletas' ? 'Regletas Cuisenaire' : formData.material === 'geoplano' ? 'Geoplano' : 'Regletas Cuisenaire y Geoplano'}

${formData.conocimientosPrevios ? `Conocimientos previos: ${formData.conocimientosPrevios}` : ''}

Por favor, crea una planeación siguiendo las 3 etapas del método CIME: Concreta, Registro y Formal.`

      const response = await fetch('/api/generate-cime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          maxTokens: 2000,
          temperature: 0.7
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al generar la planeación con IA: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const generatedPlaneacion = data.content

      if (!generatedPlaneacion) {
        throw new Error('No se pudo generar la planeación - respuesta vacía')
      }

      // Usar la función estándar que funciona en las otras planeaciones
      const cleanContent = getCleanContentForSaving(generatedPlaneacion)

      const newPlaneacion = await createPlaneacion({
        titulo: `Planeación CIME - ${formData.temaEspecifico}`,
        materia: "Matemáticas",
        grado: `${formData.grado}° grado`,
        duracion: "50 minutos",
        objetivo: `Desarrollar comprensión del concepto ${formData.temaEspecifico} mediante metodología CIME`,
        contenido: cleanContent,
        estado: "completada",
        metodologia: 'CIME'
      })

      if (newPlaneacion) {
        setGeneratedContent(cleanContent)
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        setError('Error al guardar la planeación generada')
      }
      
    } catch (error) {
      console.error("Error generando planeación CIME:", error)
      setError(error instanceof Error ? error.message : "Error al generar la planeación. Inténtalo de nuevo.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Mostrar loader mientras se carga el perfil
  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Asistente de Planeación CIME para Matemáticas
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Cargando información del usuario...
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600 dark:text-gray-400">Cargando...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Asistente de Planeación CIME para Matemáticas
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Crea planeaciones especializadas para Matemáticas con material concreto
            </p>
          </div>
        </div>

        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Sparkles className="h-5 w-5" />
              Funcionalidad PRO
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-400">
              Esta funcionalidad está disponible solo para usuarios PRO
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-amber-800 dark:text-amber-300">
                El asistente de Planeación CIME te permite crear planeaciones especializadas para Matemáticas 
                utilizando material concreto como Regletas Cuisenaire y Geoplanos, siguiendo la metodología CIME.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => window.location.href = '#perfil'}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Actualizar Plan
                </Button>
                <Button 
                  variant="outline"
                  onClick={onBack}
                >
                  Volver
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calculator className="h-8 w-8 text-blue-600" />
            Asistente de Planeación CIME para Matemáticas
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Crea planeaciones especializadas para Matemáticas con material concreto
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulario Principal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Configuración de la Planeación
              </CardTitle>
              <CardDescription>
                Define los parámetros para generar tu planeación CIME personalizada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Grado */}
              <div className="space-y-2">
                <Label htmlFor="grado">Grado Escolar *</Label>
                <Select value={formData.grado} onValueChange={(value) => handleInputChange("grado", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el grado" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADOS.map((grado) => (
                      <SelectItem key={grado.value} value={grado.value}>
                        {grado.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tema Específico */}
              <div className="space-y-2">
                <Label htmlFor="temaEspecifico">Tema Específico *</Label>
                <Input
                  id="temaEspecifico"
                  placeholder="Ej: Sumas de dos cifras llevando, Fracciones equivalentes, Perímetro de figuras..."
                  value={formData.temaEspecifico}
                  onChange={(e) => handleInputChange("temaEspecifico", e.target.value)}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sé específico sobre el concepto matemático que quieres trabajar
                </p>
              </div>

              {/* Material Principal */}
              <div className="space-y-3">
                <Label>Material Principal *</Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {MATERIALES.map((material) => (
                    <button
                      key={material.value}
                      onClick={() => handleMaterialSelect(material.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                        formData.material === material.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{material.icon}</span>
                          <span className="font-medium">{material.label}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {material.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conocimientos Previos */}
              <div className="space-y-2">
                <Label htmlFor="conocimientosPrevios">Conocimientos Previos (Opcional)</Label>
                <Textarea
                  id="conocimientosPrevios"
                  placeholder="Describe los conocimientos que ya tienen los estudiantes sobre este tema..."
                  value={formData.conocimientosPrevios}
                  onChange={(e) => handleInputChange("conocimientosPrevios", e.target.value)}
                  rows={4}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Esta información ayuda a personalizar mejor la planeación según el nivel de tus estudiantes
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Botón de Generación */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || creating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {isGenerating || creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando Planeación CIME...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generar Planeación CIME con IA
                    </>
                  )}
                </Button>
            </CardContent>
          </Card>
        </div>

        {/* Panel Informativo */}
        <div className="space-y-6">
          {/* Información CIME */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/50">
            <CardHeader>
              <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                ¿Qué es CIME?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                CIME (Concreto, Imaginario, Mental, Esquemático) es una metodología 
                para enseñar matemáticas que utiliza material concreto para facilitar 
                la comprensión de conceptos abstractos.
              </p>
              <div className="space-y-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800/50 dark:text-blue-300">
                  📏 Regletas Cuisenaire
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800/50 dark:text-blue-300">
                  📐 Geoplanos
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800/50 dark:text-blue-300">
                  🧮 Material Concreto
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Beneficios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-800 dark:text-green-300">
                Beneficios de CIME
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Aprendizaje multisensorial
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Desarrollo del pensamiento lógico
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Comprensión profunda de conceptos
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Actividades prácticas y manipulativas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resultado de la Generación */}
        {generatedContent && (
          <div className="col-span-full">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  Planeación CIME Generada
                </CardTitle>
                <CardDescription>
                  Tu planeación didáctica está lista. Puedes revisarla y guardarla.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert text-gray-900 dark:text-gray-100 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: generatedContent }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
