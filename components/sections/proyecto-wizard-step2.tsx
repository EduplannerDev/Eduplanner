"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Plus, 
  X, 
  BookOpen, 
  CheckCircle2, 
  Circle,
  Filter,
  GraduationCap,
  Target,
  Bot,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

interface CurriculoItem {
  id: string
  contenido: string
  campo_formativo: string
  grado: number
  pda: string
  ejes_articuladores?: string
  similarity?: number
  relevanceScore?: number
  displayText?: string
}

interface AISuggestion {
  id: string
  contenido: string
  campo_formativo: string
  grado: number
  pda: string
  ejes_articuladores?: string
  similarity: number
  relevanceScore: number
  displayText: string
}

interface ProyectoWizardStep2Props {
  grupoId: string
  problematica: string
  selectedPdas: string[]
  onPdasChange: (pdas: string[]) => void
  onNext: () => void
  onPrevious: () => void
  loading?: boolean
}

export function ProyectoWizardStep2({ 
  grupoId, 
  problematica,
  selectedPdas, 
  onPdasChange, 
  onNext, 
  onPrevious, 
  loading = false 
}: ProyectoWizardStep2Props) {
  const { user } = useAuth()
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showManualSearch, setShowManualSearch] = useState(false)
  const [curriculoItems, setCurriculoItems] = useState<CurriculoItem[]>([])
  const [filteredItems, setFilteredItems] = useState<CurriculoItem[]>([])
  const [loadingCurriculo, setLoadingCurriculo] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMateria, setSelectedMateria] = useState<string>('')
  const [materias, setMaterias] = useState<string[]>([])
  const [grupoInfo, setGrupoInfo] = useState<{ nombre: string; grado: number; nivel: string } | null>(null)
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null)

  // Cargar información del grupo
  useEffect(() => {
    async function loadGrupoInfo() {
      if (!grupoId) return

      try {
        const { data: grupo, error } = await supabase
          .from('grupos')
          .select('nombre, grado, nivel')
          .eq('id', grupoId)
          .single()

        if (error) {
          console.error('Error cargando información del grupo:', error)
          return
        }

        setGrupoInfo(grupo)
      } catch (error) {
        console.error('Error cargando información del grupo:', error)
      }
    }

    loadGrupoInfo()
  }, [grupoId])

  // Obtener sugerencias de IA basadas en la problemática
  useEffect(() => {
    async function getAISuggestions() {
      if (!problematica || !grupoInfo?.grado) return

      setLoadingSuggestions(true)
      setSuggestionsError(null)

      try {
        const response = await fetch('/api/proyectos/suggest-pdas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            problematica,
            grado: grupoInfo.grado,
            limit: 8
          })
        })

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setAiSuggestions(data.suggestions || [])
        
      } catch (error) {
        console.error('Error obteniendo sugerencias de IA:', error)
        setSuggestionsError(error instanceof Error ? error.message : 'Error desconocido')
        setAiSuggestions([])
      } finally {
        setLoadingSuggestions(false)
      }
    }

    getAISuggestions()
  }, [problematica, grupoInfo?.grado])

  // Cargar currículo SEP (solo cuando se necesite búsqueda manual)
  useEffect(() => {
    async function loadCurriculo() {
      if (!grupoInfo?.grado || !showManualSearch) return

      try {
        setLoadingCurriculo(true)
        const { data: curriculo, error } = await supabase
          .from('curriculo_sep')
          .select('id, contenido, campo_formativo, grado, pda, ejes_articuladores')
          .eq('grado', grupoInfo.grado)
          .order('campo_formativo', { ascending: true })
          .order('contenido', { ascending: true })

        if (error) {
          console.error('Error cargando currículo:', error)
          return
        }

        setCurriculoItems(curriculo || [])
        
        // Extraer campos formativos únicos
        const camposUnicos = [...new Set((curriculo || []).map(item => item.campo_formativo))].sort()
        setMaterias(camposUnicos)
      } catch (error) {
        console.error('Error cargando currículo:', error)
      } finally {
        setLoadingCurriculo(false)
      }
    }

    loadCurriculo()
  }, [grupoInfo?.grado, showManualSearch])

  // Filtrar elementos del currículo
  useEffect(() => {
    let filtered = curriculoItems

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.contenido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.campo_formativo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pda.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por campo formativo
    if (selectedMateria) {
      filtered = filtered.filter(item => item.campo_formativo === selectedMateria)
    }

    setFilteredItems(filtered)
  }, [curriculoItems, searchTerm, selectedMateria])

  // Manejar selección/deselección de PDA
  const togglePdaSelection = (pdaId: string) => {
    if (selectedPdas.includes(pdaId)) {
      onPdasChange(selectedPdas.filter(id => id !== pdaId))
    } else {
      onPdasChange([...selectedPdas, pdaId])
    }
  }

  // Obtener elementos seleccionados (combinar sugerencias de IA y currículo manual)
  const selectedItems = [
    ...aiSuggestions.filter(item => selectedPdas.includes(item.id)),
    ...curriculoItems.filter(item => selectedPdas.includes(item.id) && !aiSuggestions.some(ai => ai.id === item.id))
  ]

  // Verificar si el formulario está completo
  const isFormComplete = selectedPdas.length > 0

  // Efecto para pasar automáticamente al siguiente paso cuando se seleccionen PDAs
  useEffect(() => {
    if (selectedPdas.length > 0) {
      // Pequeño delay para que el usuario vea la selección antes de avanzar
      const timer = setTimeout(() => {
        onNext()
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [selectedPdas, onNext])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Bot className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Conecta el Currículo</h1>
        </div>
        <p className="text-lg text-gray-600">
          La IA ha analizado tu problemática y sugiere los PDAs más relevantes
        </p>
        {grupoInfo && (
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
            <GraduationCap className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700 font-medium">
              {grupoInfo.nombre} - {grupoInfo.grado}° {grupoInfo.nivel}
            </span>
          </div>
        )}
      </div>

      {/* Contenido principal - Dos paneles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
        
        {/* Panel Izquierdo - Sugerencias de IA o Búsqueda Manual */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              {showManualSearch ? (
                <>
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span>Currículo Completo - {grupoInfo?.grado}° Grado</span>
                </>
              ) : (
                <>
                  <Bot className="h-5 w-5 text-purple-600" />
                  <span>Sugerencias de la IA</span>
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                </>
              )}
            </CardTitle>
            <CardDescription>
              {showManualSearch 
                ? "Explora todo el currículo y selecciona contenidos adicionales"
                : "PDAs más relevantes para tu problemática"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col space-y-4">
            {!showManualSearch ? (
              /* Sugerencias de IA */
              <>
                {loadingSuggestions ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                      <span className="text-sm text-gray-600">Analizando tu problemática...</span>
                    </div>
                  </div>
                ) : suggestionsError ? (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      Error obteniendo sugerencias: {suggestionsError}
                    </AlertDescription>
                  </Alert>
                ) : aiSuggestions.length > 0 ? (
                  <ScrollArea className="flex-1">
                    <div className="space-y-3 max-w-full">
                      {aiSuggestions.map((suggestion, index) => {
                        const isSelected = selectedPdas.includes(suggestion.id)
                        return (
                          <div
                            key={suggestion.id}
                            className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md w-full max-w-full ${
                              isSelected 
                                ? 'border-purple-500 bg-purple-50' 
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                            onClick={() => togglePdaSelection(suggestion.id)}
                          >
                            <div className="flex items-start space-x-3 w-full">
                              <div className="flex-shrink-0 mt-1">
                                {isSelected ? (
                                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                                ) : (
                                  <Circle className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                                <div className="flex items-start justify-between mb-2 gap-2">
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    <Badge variant="outline" className="text-xs bg-white">
                                      {suggestion.campo_formativo}
                                    </Badge>
                                    {suggestion.ejes_articuladores && (
                                      <Badge variant="secondary" className="text-xs">
                                        {suggestion.ejes_articuladores.split(',')[0]}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1 flex-shrink-0">
                                    <Sparkles className="h-3 w-3 text-yellow-500" />
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                      {suggestion.relevanceScore}% relevante
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {suggestion.contenido}
                                </p>
                                <p className="text-lg font-bold text-gray-900 leading-relaxed">
                                  PDA: {suggestion.pda}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No se encontraron sugerencias</p>
                    <p className="text-sm">Intenta con una problemática más específica</p>
                  </div>
                )}

                {/* Botón para búsqueda manual */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowManualSearch(true)}
                    className="w-full flex items-center space-x-2"
                  >
                    <Search className="h-4 w-4" />
                    <span>Buscar manualmente en el Plan Anual</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              /* Búsqueda Manual */
              <>
                {/* Filtros */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar contenidos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                      value={selectedMateria}
                      onChange={(e) => setSelectedMateria(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos los campos formativos</option>
                      {materias.map(campo => (
                        <option key={campo} value={campo}>{campo}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lista de contenidos */}
                <ScrollArea className="flex-1">
                  {loadingCurriculo ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-w-full">
                      {filteredItems.map((item) => {
                        const isSelected = selectedPdas.includes(item.id)
                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md w-full max-w-full ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => togglePdaSelection(item.id)}
                          >
                            <div className="flex items-start space-x-3 w-full">
                              <div className="flex-shrink-0 mt-1">
                                {isSelected ? (
                                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <Circle className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                                <div className="flex items-center space-x-2 mb-1 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {item.campo_formativo}
                                  </Badge>
                                  {item.ejes_articuladores && (
                                    <Badge variant="secondary" className="text-xs">
                                      {item.ejes_articuladores.split(',')[0]}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {item.contenido}
                                </p>
                                <p className="text-lg font-bold text-gray-900 leading-relaxed">
                                  PDA: {item.pda}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      
                      {filteredItems.length === 0 && !loadingCurriculo && (
                        <div className="text-center py-8 text-gray-500">
                          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No se encontraron contenidos</p>
                          <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* Botón para volver a sugerencias */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowManualSearch(false)}
                    className="w-full flex items-center space-x-2"
                  >
                    <Bot className="h-4 w-4" />
                    <span>Volver a las sugerencias de IA</span>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Panel Derecho - PDAs Seleccionados */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <span>PDAs Seleccionados</span>
              <Badge variant="secondary" className="ml-auto">
                {selectedPdas.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Contenidos que abordará tu proyecto
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1">
              {selectedItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No hay PDAs seleccionados</p>
                  <p className="text-sm">Selecciona contenidos del panel izquierdo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map((item, index) => (
                    <div key={item.id} className="group">
                      <div className="p-3 rounded-lg border border-green-200 bg-green-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline" className="text-xs bg-white">
                                {item.campo_formativo}
                              </Badge>
                              <span className="text-xs text-gray-500">#{index + 1}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {item.contenido}
                            </p>
                            <p className="text-lg font-bold text-gray-900 leading-relaxed">
                              PDA: {item.pda}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePdaSelection(item.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            {selectedItems.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Total de PDAs seleccionados:</span>
                  <span className="font-medium">{selectedItems.length}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumen y navegación */}
      {selectedItems.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">
                  {selectedItems.length} PDA{selectedItems.length !== 1 ? 's' : ''} seleccionado{selectedItems.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-sm text-green-700">
                Campos: {[...new Set(selectedItems.map(item => item.campo_formativo))].join(', ')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navegación */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <span>Anterior</span>
        </Button>

        <Button
          onClick={onNext}
          disabled={!isFormComplete || loading}
          className="flex items-center space-x-2"
        >
          <span>Generar Plan Didáctico</span>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
