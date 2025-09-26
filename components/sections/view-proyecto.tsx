"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, BookOpen, Users, Calendar, Target, Lightbulb, Loader2, CheckSquare, FileText, FolderOpen, ClipboardList, ArrowRight, Plus, X, Bot, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useProyectos } from '@/hooks/use-proyectos'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { generateRubricaPDF, generateListaCotejoPDF } from "@/lib/pdf-generator"

interface ViewProyectoProps {
  proyectoId: string
  onBack: () => void
}

interface ProyectoFase {
  id: string
  fase_nombre: string
  momento_nombre: string
  contenido: string
  orden: number
}

interface InstrumentoEvaluacion {
  id: string
  proyecto_id: string
  user_id: string
  tipo: 'rubrica_analitica' | 'lista_cotejo' | 'escala_estimacion'
  titulo: string
  contenido: any
  estado: 'borrador' | 'activo' | 'archivado'
  created_at: string
  updated_at: string
}

interface ProyectoCompleto {
  id: string
  nombre: string
  problematica: string
  producto_final: string
  metodologia_nem: string
  estado: string
  created_at: string
  grupos: {
    nombre: string
    grado: string
    nivel: string
  }
  fases: ProyectoFase[]
}

// Componente para visualizar rúbricas analíticas
function RubricaViewer({ contenido }: { contenido: any }) {
  if (!contenido || !contenido.criterios) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No se pudo cargar el contenido de la rúbrica</p>
      </div>
    )
  }

  const niveles = ['Sobresaliente', 'Logrado', 'En Proceso', 'Requiere Apoyo']
  const colores = {
    'Sobresaliente': 'bg-green-50 border-green-200',
    'Logrado': 'bg-blue-50 border-blue-200', 
    'En Proceso': 'bg-yellow-50 border-yellow-200',
    'Requiere Apoyo': 'bg-red-50 border-red-200'
  }

  return (
    <div className="space-y-6">
      {/* Título de la rúbrica */}
      {contenido.titulo_rubrica && (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {contenido.titulo_rubrica}
          </h3>
        </div>
      )}

      {/* Tabla de rúbrica */}
      <div className="w-full overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-4 text-left font-semibold min-w-[250px] sticky left-0 bg-gray-50 z-10">
                Criterio de Evaluación
              </th>
              {niveles.map((nivel) => (
                <th key={nivel} className="border border-gray-300 p-4 text-center font-semibold min-w-[220px]">
                  {nivel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contenido.criterios.map((criterio: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-4 font-medium bg-gray-50 sticky left-0 z-10">
                  <div className="space-y-3">
                    <div className="font-semibold text-gray-900 text-sm leading-relaxed">
                      {criterio.criterio}
                    </div>
                    {criterio.pda_origen && (
                      <div className="text-xs text-gray-600 bg-purple-50 p-2 rounded border-l-2 border-purple-200">
                        <strong>PDA:</strong> {criterio.pda_origen}
                      </div>
                    )}
                  </div>
                </td>
                {niveles.map((nivel) => (
                  <td key={nivel} className={`border border-gray-300 p-4 text-sm leading-relaxed ${colores[nivel as keyof typeof colores]} align-top`}>
                    <div className="whitespace-pre-wrap">
                      {criterio.descriptores[nivel] || 'No definido'}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Información adicional */}
      <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-200">
        <p><strong>Nota:</strong> Esta rúbrica contiene {contenido.criterios.length} criterio{contenido.criterios.length !== 1 ? 's' : ''} de evaluación con 4 niveles de desempeño cada uno.</p>
      </div>
    </div>
  )
}

// Componente para visualizar listas de cotejo
function ListaCotejoViewer({ contenido }: { contenido: any }) {
  const [evaluaciones, setEvaluaciones] = useState<{[key: number]: {si: boolean, no: boolean, observaciones: string}}>({})

  // Verificar si el contenido es de la nueva estructura (con indicadores) o la antigua (con criterios)
  const indicadores = contenido?.indicadores || contenido?.criterios || []
  const titulo = contenido?.titulo_instrumento || contenido?.titulo || "Lista de Cotejo"

  if (!contenido || indicadores.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No se pudo cargar el contenido de la lista de cotejo</p>
      </div>
    )
  }

  const handleCheckboxChange = (index: number, tipo: 'si' | 'no') => {
    setEvaluaciones(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        si: tipo === 'si' ? !prev[index]?.si : false,
        no: tipo === 'no' ? !prev[index]?.no : false,
        observaciones: prev[index]?.observaciones || ''
      }
    }))
  }

  const handleObservacionChange = (index: number, observacion: string) => {
    setEvaluaciones(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        observaciones: observacion,
        si: prev[index]?.si || false,
        no: prev[index]?.no || false
      }
    }))
  }

  const exportarResultados = async (formato: 'excel' | 'pdf' = 'excel') => {
    const resultados = indicadores.map((indicador: any, index: number) => ({
      indicador: indicador.indicador || indicador.criterio,
      cumple: evaluaciones[index]?.si ? 'Sí' : evaluaciones[index]?.no ? 'No' : 'Sin evaluar',
      observaciones: evaluaciones[index]?.observaciones || ''
    }))
    
    try {
      if (formato === 'excel') {
        const { exportarListaCotejoExcel } = await import('@/lib/excel-generator')
        const resultado = exportarListaCotejoExcel(
          contenido.titulo_instrumento || 'Lista de Cotejo',
          resultados
        )
        
        toast.success(`Archivo Excel exportado: ${resultado.filename}`, {
          description: `${resultado.stats.cumplidos}/${resultado.stats.total} indicadores cumplidos (${resultado.stats.porcentajeCumplimiento}%)`
        })
      } else if (formato === 'pdf') {
        // Crear un objeto instrumento compatible con el generador de PDF
        const instrumentoParaPDF = {
          titulo: contenido.titulo_instrumento || 'Lista de Cotejo',
          contenido: {
            titulo_instrumento: contenido.titulo_instrumento || 'Lista de Cotejo',
            indicadores: indicadores.map((indicador: any, index: number) => ({
              ...indicador,
              evaluacion: evaluaciones[index]?.si ? 'Sí' : evaluaciones[index]?.no ? 'No' : 'Sin evaluar',
              observaciones_evaluacion: evaluaciones[index]?.observaciones || ''
            }))
          }
        }
        
        const { generateListaCotejoPDF } = await import('@/lib/pdf-generator')
        await generateListaCotejoPDF(instrumentoParaPDF)
        
        toast.success('PDF exportado exitosamente')
      }
    } catch (error) {
      console.error('Error exportando:', error)
      toast.error(`Error al exportar ${formato === 'excel' ? 'Excel' : 'PDF'}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {titulo}
        </h3>
        <p className="text-sm text-gray-600">
          Marque "Sí" o "No" para cada indicador y agregue observaciones si es necesario
        </p>
      </div>

      {/* Tabla interactiva */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-gray-700">
            <div className="col-span-6">Indicador de Logro</div>
            <div className="col-span-1 text-center">Sí</div>
            <div className="col-span-1 text-center">No</div>
            <div className="col-span-4">Observaciones</div>
          </div>
        </div>
        
        <div className="divide-y">
          {indicadores.map((indicador: any, index: number) => (
            <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="grid grid-cols-12 gap-4 items-start">
                {/* Indicador */}
                <div className="col-span-6">
                  <p className="text-sm font-medium text-gray-900 leading-relaxed">
                    {indicador.indicador || indicador.criterio}
                  </p>
                  {(indicador.criterio_origen || indicador.pda_origen) && (
                    <p className="text-xs text-gray-500 mt-1">
                      <strong>Origen:</strong> {indicador.criterio_origen || indicador.pda_origen}
                    </p>
                  )}
                </div>
                
                {/* Checkbox Sí */}
                <div className="col-span-1 flex justify-center">
                  <Checkbox
                    checked={evaluaciones[index]?.si || false}
                    onCheckedChange={() => handleCheckboxChange(index, 'si')}
                    className="w-5 h-5"
                  />
                </div>
                
                {/* Checkbox No */}
                <div className="col-span-1 flex justify-center">
                  <Checkbox
                    checked={evaluaciones[index]?.no || false}
                    onCheckedChange={() => handleCheckboxChange(index, 'no')}
                    className="w-5 h-5"
                  />
                </div>
                
                {/* Campo de observaciones */}
                <div className="col-span-4">
                  <Textarea
                    placeholder="Observaciones opcionales..."
                    value={evaluaciones[index]?.observaciones || ''}
                    onChange={(e) => handleObservacionChange(index, e.target.value)}
                    className="min-h-[60px] text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen */}
      <div className="flex items-center justify-center bg-blue-50 p-4 rounded-lg border-l-4 border-blue-200">
        <div className="text-sm text-gray-600 text-center">
          <p><strong>Total de indicadores:</strong> {indicadores.length}</p>
          <p><strong>Evaluados:</strong> {Object.values(evaluaciones).filter(e => e.si || e.no).length}</p>
        </div>
      </div>
    </div>
  )
}

export function ViewProyecto({ proyectoId, onBack }: ViewProyectoProps) {
  const router = useRouter()
  const { obtenerProyecto, obtenerFasesProyecto, loading, error } = useProyectos()
  const [proyecto, setProyecto] = useState<ProyectoCompleto | null>(null)
  const [fases, setFases] = useState<ProyectoFase[]>([])
  const [loadingFases, setLoadingFases] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [showInstrumentDialog, setShowInstrumentDialog] = useState(false)
  const [generatingRubrica, setGeneratingRubrica] = useState(false)
  const [instrumentos, setInstrumentos] = useState<InstrumentoEvaluacion[]>([])
  const [activeTab, setActiveTab] = useState('plano-didactico')
  
  // Estado para el modal de crear instrumento
  const [modalStep, setModalStep] = useState<'form' | 'criteria'>('form')
  const [instrumentForm, setInstrumentForm] = useState({
    titulo: '',
    tipo: '' as 'rubrica_analitica' | 'lista_cotejo' | '',
    descripcion: ''
  })
  const [formErrors, setFormErrors] = useState({
    titulo: '',
    tipo: ''
  })
  
  // Estado para PDAs y criterios personalizados
  const [pdasProyecto, setPdasProyecto] = useState<any[]>([])
  const [pdasSeleccionados, setPdasSeleccionados] = useState<string[]>([])
  const [criteriosPersonalizados, setCriteriosPersonalizados] = useState<string[]>([])
  const [nuevoCriterio, setNuevoCriterio] = useState('')
  const [loadingPdas, setLoadingPdas] = useState(false)
  
  // Estado para el modal de visualización de rúbricas
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [instrumentoSeleccionado, setInstrumentoSeleccionado] = useState<InstrumentoEvaluacion | null>(null)

  useEffect(() => {
    cargarProyecto()
    cargarInstrumentos()
  }, [proyectoId])

  const cargarProyecto = async () => {
    setInitialLoading(true)
    setHasError(false)
    
    try {
      const proyectoData = await obtenerProyecto(proyectoId)
      if (proyectoData) {
        setProyecto(proyectoData)
        
        // Cargar fases del proyecto
        setLoadingFases(true)
        const fasesData = await obtenerFasesProyecto(proyectoId)
        setFases(fasesData || [])
      } else {
        setHasError(true)
        toast.error('No se pudo cargar el proyecto')
      }
    } catch (error) {
      console.error('Error al cargar proyecto:', error)
      setHasError(true)
      toast.error('Error al cargar el proyecto')
    } finally {
      setInitialLoading(false)
      setLoadingFases(false)
    }
  }

  const cargarInstrumentos = async () => {
    try {
      const response = await fetch(`/api/instrumentos-evaluacion?proyecto_id=${proyectoId}`)
      if (response.ok) {
        const data = await response.json()
        setInstrumentos(data)
      }
    } catch (error) {
      console.error('Error al cargar instrumentos:', error)
    }
  }

  const cargarPdasProyecto = async () => {
    setLoadingPdas(true)
    try {
      const response = await fetch(`/api/proyectos/${proyectoId}/pdas`)
      if (response.ok) {
        const data = await response.json()
        setPdasProyecto(data)
      } else {
        toast.error('Error al cargar los PDAs del proyecto')
      }
    } catch (error) {
      console.error('Error al cargar PDAs:', error)
      toast.error('Error al cargar los PDAs del proyecto')
    } finally {
      setLoadingPdas(false)
    }
  }

  const verInstrumento = (instrumento: InstrumentoEvaluacion) => {
    setInstrumentoSeleccionado(instrumento)
    setShowViewDialog(true)
  }

  const descargarPDF = () => {
    if (!instrumentoSeleccionado) {
      toast.error('No hay instrumento seleccionado')
      return
    }

    console.log('Instrumento seleccionado para PDF:', instrumentoSeleccionado)
    console.log('Contenido del instrumento:', instrumentoSeleccionado.contenido)

    try {
      if (instrumentoSeleccionado.tipo === 'rubrica_analitica') {
        generateRubricaPDF(instrumentoSeleccionado)
        toast.success('PDF de rúbrica descargado exitosamente')
      } else if (instrumentoSeleccionado.tipo === 'lista_cotejo') {
        generateListaCotejoPDF(instrumentoSeleccionado)
        toast.success('PDF de lista de cotejo descargado exitosamente')
      } else {
        toast.error('Tipo de instrumento no soportado para descarga PDF')
      }
    } catch (error) {
      console.error('Error al generar PDF:', error)
      toast.error('Error al generar el PDF')
    }
  }

  const togglePdaSelection = (pdaId: string) => {
    setPdasSeleccionados(prev => 
      prev.includes(pdaId) 
        ? prev.filter(id => id !== pdaId)
        : [...prev, pdaId]
    )
  }

  const agregarCriterioPersonalizado = () => {
    if (nuevoCriterio.trim()) {
      setCriteriosPersonalizados(prev => [...prev, nuevoCriterio.trim()])
      setNuevoCriterio('')
    }
  }

  const eliminarCriterioPersonalizado = (index: number) => {
    setCriteriosPersonalizados(prev => prev.filter((_, i) => i !== index))
  }

  const resetearSeleccionCriterios = () => {
    setPdasSeleccionados([])
    setCriteriosPersonalizados([])
    setNuevoCriterio('')
  }

  const abrirModalCrearInstrumento = () => {
    setShowInstrumentDialog(true)
    resetInstrumentForm()
    resetearSeleccionCriterios()
    cargarPdasProyecto()
  }

  const editarInstrumento = (instrumento: InstrumentoEvaluacion) => {
    // TODO: Implementar edición del instrumento
    toast.info(`Editando: ${instrumento.titulo}`)
    console.log('Editar instrumento:', instrumento)
  }

  const confirmarEliminarInstrumento = async (instrumento: InstrumentoEvaluacion) => {
    try {
      const response = await fetch(`/api/instrumentos-evaluacion/${instrumento.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el instrumento')
      }

      toast.success(`Instrumento "${instrumento.titulo}" eliminado correctamente`)
      
      // Recargar la lista de instrumentos
      await cargarInstrumentos()
    } catch (error) {
      console.error('Error al eliminar instrumento:', error)
      toast.error('Error al eliminar el instrumento')
    }
  }

  // Funciones para el modal de crear instrumento
  const resetInstrumentForm = () => {
    setInstrumentForm({
      titulo: '',
      tipo: '',
      descripcion: ''
    })
    setFormErrors({
      titulo: '',
      tipo: ''
    })
    setModalStep('form')
  }

  const handleCloseModal = () => {
    setShowInstrumentDialog(false)
    resetInstrumentForm()
  }

  const validateForm = () => {
    const errors = {
      titulo: '',
      tipo: ''
    }

    if (!instrumentForm.titulo.trim()) {
      errors.titulo = 'El título es obligatorio'
    }

    if (!instrumentForm.tipo) {
      errors.tipo = 'Debe seleccionar un tipo de instrumento'
    }

    setFormErrors(errors)
    return !errors.titulo && !errors.tipo
  }

  const handleNextStep = () => {
    if (validateForm()) {
      setModalStep('criteria')
      if (pdasProyecto.length === 0) {
        cargarPdasProyecto()
      }
    }
  }

  const handleBackStep = () => {
    setModalStep('form')
  }

  const cargarFases = async () => {
    setLoadingFases(true)
    try {
      const fasesData = await obtenerFasesProyecto(proyectoId)
      setFases(fasesData)
      
      // Actualizar el proyecto con las fases cargadas
      if (proyecto) {
        setProyecto({
          ...proyecto,
          fases: fasesData
        })
      }
    } catch (error) {
      console.error('Error cargando fases:', error)
    } finally {
      setLoadingFases(false)
    }
  }

  // Mostrar loader inicial mientras se carga el proyecto
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  // Solo mostrar error si realmente hay un error después de cargar
  if (hasError || (!proyecto && !initialLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Proyecto no encontrado</h1>
          <p className="text-gray-600 mb-6">El proyecto solicitado no existe o no tienes permisos para verlo.</p>
          <Button onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Proyectos
          </Button>
        </div>
      </div>
    )
  }

  // Pantalla de espera "Magia de la IA" para generación de rúbrica
  if (generatingRubrica) {
    const tipoInstrumento = instrumentForm.tipo === 'rubrica_analitica' ? 'rúbrica analítica' : 'lista de cotejo';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ✨ Magia de la IA ✨
            </h1>
            <p className="text-lg text-gray-600">
              La IA está generando tu {tipoInstrumento} personalizada
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Generación con IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    🤖 Analizando tu proyecto...
                  </p>
                  <p className="text-sm text-gray-600">
                    Creando criterios de evaluación para: <strong>{proyecto?.nombre}</strong>
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Procesando:</strong> Fases y momentos del proyecto
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Metodología:</strong> {proyecto?.metodologia_nem}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Grupo:</strong> {proyecto?.grupos?.nombre} - {proyecto?.grupos?.grado}° {proyecto?.grupos?.nivel}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Proyectos
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{proyecto.nombre}</h1>
            <p className="text-lg text-gray-600 mt-2">{proyecto.grupos.nombre} - {proyecto.grupos.grado}° {proyecto.grupos.nivel}</p>
          </div>
        </div>

        {/* Pestañas del Proyecto */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plano-didactico" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Plano Didáctico
            </TabsTrigger>
            <TabsTrigger value="evaluacion" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Evaluación
            </TabsTrigger>
            <TabsTrigger value="recursos" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Recursos
            </TabsTrigger>
          </TabsList>

          {/* Pestaña: Plano Didáctico */}
          <TabsContent value="plano-didactico" className="mt-6">
            {/* Información del Proyecto */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    Problemática
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{proyecto.problematica}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                    Producto Final
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{proyecto.producto_final}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Lightbulb className="h-5 w-5 mr-2 text-purple-600" />
                    Metodología
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{proyecto.metodologia_nem}</p>
                </CardContent>
              </Card>
            </div>

            {/* Fases del Proyecto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-orange-600" />
                  Fases y Momentos del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingFases ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando fases del proyecto...</p>
                  </div>
                ) : fases.length > 0 ? (
                  <div className="space-y-6">
                    {fases.map((fase, index) => (
                      <div key={fase.id} className="border-l-4 border-blue-500 pl-6">
                        <div className="mb-2">
                          <h3 className="font-semibold text-lg text-blue-700">{fase.fase_nombre}</h3>
                          <h4 className="font-medium text-md text-gray-700">{fase.momento_nombre}</h4>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {fase.contenido}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No se encontraron fases para este proyecto.</p>
                    <p className="text-sm mt-2">Las fases se generan automáticamente cuando se crea el proyecto.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña: Evaluación */}
          <TabsContent value="evaluacion" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <ClipboardList className="h-5 w-5 mr-2 text-purple-600" />
                    Instrumentos de Evaluación
                  </span>
                  <Button 
                    onClick={abrirModalCrearInstrumento}
                    variant="default"
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Crear Instrumento
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {instrumentos.length > 0 ? (
                  <div className="space-y-4">
                    {instrumentos.map((instrumento) => (
                      <Card key={instrumento.id} className="border-l-4 border-purple-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{instrumento.titulo}</CardTitle>
                              <p className="text-sm text-gray-600 mt-1">
                                {instrumento.tipo === 'rubrica_analitica' ? 'Rúbrica Analítica' : 
                                 instrumento.tipo === 'lista_cotejo' ? 'Lista de Cotejo' : 
                                 'Escala de Estimación'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={instrumento.estado === 'activo' ? 'default' : 'secondary'}>
                                {instrumento.estado}
                              </Badge>
                              <div className="flex gap-1">
                                 <Button 
                                   variant="outline" 
                                   size="sm"
                                   onClick={() => verInstrumento(instrumento)}
                                 >
                                   Ver
                                 </Button>
                                 <Button 
                                   variant="outline" 
                                   size="sm"
                                   onClick={() => editarInstrumento(instrumento)}
                                 >
                                   Editar
                                 </Button>
                                 <AlertDialog>
                                   <AlertDialogTrigger asChild>
                                     <Button 
                                       variant="outline" 
                                       size="sm"
                                       className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                     >
                                       <Trash2 className="h-4 w-4 mr-1" />
                                       Eliminar
                                     </Button>
                                   </AlertDialogTrigger>
                                   <AlertDialogContent>
                                     <AlertDialogHeader>
                                       <AlertDialogTitle>¿Eliminar instrumento?</AlertDialogTitle>
                                       <AlertDialogDescription>
                                         ¿Estás seguro de que quieres eliminar "{instrumento.titulo}"? 
                                         Esta acción no se puede deshacer.
                                       </AlertDialogDescription>
                                     </AlertDialogHeader>
                                     <AlertDialogFooter>
                                       <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                       <AlertDialogAction
                                         onClick={() => confirmarEliminarInstrumento(instrumento)}
                                         className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                       >
                                         Eliminar
                                       </AlertDialogAction>
                                     </AlertDialogFooter>
                                   </AlertDialogContent>
                                 </AlertDialog>
                               </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">
                            Creado el {new Date(instrumento.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ClipboardList className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No hay instrumentos de evaluación</h3>
                    <p className="mb-4">Crea tu primer instrumento de evaluación para este proyecto.</p>
                    <Button 
                      onClick={abrirModalCrearInstrumento}
                      variant="default"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Crear Instrumento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña: Recursos */}
          <TabsContent value="recursos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FolderOpen className="h-5 w-5 mr-2 text-green-600" />
                  Recursos del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Recursos del Proyecto</h3>
                  <p className="mb-4">Esta funcionalidad estará disponible en el Módulo 4.</p>
                  <p className="text-sm">Aquí podrás gestionar materiales, archivos y recursos relacionados con el proyecto.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    
      {/* Modal de crear instrumento - Nueva estructura de 2 vistas */}
      <Dialog open={showInstrumentDialog} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-4xl">
          {modalStep === 'form' ? (
            // Primera vista: Formulario de información básica
            <>
              <DialogHeader>
                <DialogTitle>Crear Instrumento de Evaluación</DialogTitle>
                <DialogDescription>
                  Completa la información básica del instrumento que deseas crear.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Título del Instrumento */}
                <div className="space-y-2">
                  <Label htmlFor="titulo" className="text-sm font-medium">
                    Título del Instrumento <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="titulo"
                    placeholder="Ej: Rúbrica para Exposición Oral"
                    value={instrumentForm.titulo}
                    onChange={(e) => {
                      setInstrumentForm(prev => ({ ...prev, titulo: e.target.value }))
                      if (formErrors.titulo) {
                        setFormErrors(prev => ({ ...prev, titulo: '' }))
                      }
                    }}
                    className={formErrors.titulo ? "border-red-500" : ""}
                  />
                  {formErrors.titulo && (
                    <p className="text-sm text-red-500">{formErrors.titulo}</p>
                  )}
                </div>

                {/* Tipo de Instrumento */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Tipo de Instrumento <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      type="button"
                      variant={instrumentForm.tipo === 'rubrica_analitica' ? 'default' : 'outline'}
                      className={`h-auto p-4 justify-start ${
                        instrumentForm.tipo === 'rubrica_analitica' 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'hover:bg-purple-50'
                      }`}
                      onClick={() => {
                        setInstrumentForm(prev => ({ ...prev, tipo: 'rubrica_analitica' }))
                        if (formErrors.tipo) {
                          setFormErrors(prev => ({ ...prev, tipo: '' }))
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-medium">Rúbrica Analítica</div>
                          <div className="text-sm opacity-80">
                            Evaluación detallada con criterios y niveles de desempeño
                          </div>
                        </div>
                      </div>
                    </Button>
                    
                    <Button
                      type="button"
                      variant={instrumentForm.tipo === 'lista_cotejo' ? 'default' : 'outline'}
                      className={`h-auto p-4 justify-start ${
                        instrumentForm.tipo === 'lista_cotejo' 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'hover:bg-purple-50'
                      }`}
                      onClick={() => {
                        setInstrumentForm(prev => ({ ...prev, tipo: 'lista_cotejo' }))
                        if (formErrors.tipo) {
                          setFormErrors(prev => ({ ...prev, tipo: '' }))
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <CheckSquare className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-medium">Lista de Cotejo</div>
                          <div className="text-sm opacity-80">
                            Verificación de presencia o ausencia de elementos
                          </div>
                        </div>
                      </div>
                    </Button>
                  </div>
                  {formErrors.tipo && (
                    <p className="text-sm text-red-500">{formErrors.tipo}</p>
                  )}
                </div>

                {/* Descripción (Opcional) */}
                <div className="space-y-2">
                  <Label htmlFor="descripcion" className="text-sm font-medium">
                    Descripción (Opcional)
                  </Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Añade notas o comentarios adicionales sobre este instrumento..."
                    value={instrumentForm.descripcion}
                    onChange={(e) => setInstrumentForm(prev => ({ ...prev, descripcion: e.target.value }))}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button onClick={handleNextStep} className="bg-purple-600 hover:bg-purple-700">
                  Siguiente: Seleccionar Criterios
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          ) : (
            // Segunda vista: Selección de criterios
            <>
              <DialogHeader>
                <DialogTitle>Selecciona los Criterios a Evaluar</DialogTitle>
                <DialogDescription>
                  Elige los PDAs del proyecto y/o agrega criterios personalizados para generar tu {instrumentForm.tipo === 'rubrica_analitica' ? 'rúbrica analítica' : 'lista de cotejo'}.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Sección de PDAs del Proyecto */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Criterios del Proyecto (PDAs)</h3>
                  </div>
                  
                  {loadingPdas ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Cargando PDAs...</span>
                    </div>
                  ) : pdasProyecto.length > 0 ? (
                    <ScrollArea className="h-80 border rounded-lg p-4">
                      <div className="space-y-4">
                        {pdasProyecto.map((pda) => (
                          <div 
                            key={pda.id} 
                            className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => togglePdaSelection(pda.id)}
                          >
                            <Checkbox
                              id={`pda-${pda.id}`}
                              checked={pdasSeleccionados.includes(pda.id)}
                              onCheckedChange={() => togglePdaSelection(pda.id)}
                              className="mt-2 h-5 w-5 pointer-events-none"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-base font-medium text-gray-900 block leading-relaxed">
                                {pda.pda}
                              </div>
                              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{pda.contenido}</p>
                              <div className="flex gap-3 mt-3">
                                <Badge variant="secondary" className="text-sm px-3 py-1">
                                  {pda.campo_formativo}
                                </Badge>
                                <Badge variant="outline" className="text-sm px-3 py-1">
                                  {pda.grado} - {pda.materia}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-6 text-gray-500 border rounded-lg">
                      <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No se encontraron PDAs para este proyecto</p>
                    </div>
                  )}
                  
                  {pdasSeleccionados.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-700">
                        ✓ {pdasSeleccionados.length} PDA{pdasSeleccionados.length !== 1 ? 's' : ''} seleccionado{pdasSeleccionados.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>

                {/* Sección de Criterios Personalizados */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Criterios Personalizados</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Escribe un criterio personalizado..."
                        value={nuevoCriterio}
                        onChange={(e) => setNuevoCriterio(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            agregarCriterioPersonalizado()
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        onClick={agregarCriterioPersonalizado}
                        disabled={!nuevoCriterio.trim()}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Añadir Criterio
                      </Button>
                    </div>
                    
                    {criteriosPersonalizados.length > 0 && (
                      <div className="space-y-3">
                        {criteriosPersonalizados.map((criterio, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <span className="text-base text-gray-900 leading-relaxed">{criterio}</span>
                            <Button
                              onClick={() => eliminarCriterioPersonalizado(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumen de selección */}
                {(pdasSeleccionados.length > 0 || criteriosPersonalizados.length > 0) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckSquare className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Criterios seleccionados</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {pdasSeleccionados.length} PDA{pdasSeleccionados.length !== 1 ? 's' : ''} del proyecto
                      {pdasSeleccionados.length > 0 && criteriosPersonalizados.length > 0 ? ' y ' : ''}
                      {criteriosPersonalizados.length > 0 && `${criteriosPersonalizados.length} criterio${criteriosPersonalizados.length !== 1 ? 's' : ''} personalizado${criteriosPersonalizados.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleBackStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
                <Button 
                  onClick={async () => {
                    // Validar que se haya seleccionado al menos un criterio
                    if (pdasSeleccionados.length === 0 && criteriosPersonalizados.length === 0) {
                      toast.error("Debe seleccionar al menos un PDA o agregar un criterio personalizado");
                      return;
                    }

                    handleCloseModal();
                    setGeneratingRubrica(true);
                    
                    try {
                      
                      const response = await fetch('/api/generate-rubrica', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          proyecto_id: proyectoId,
                          titulo: instrumentForm.titulo,
                          tipo: instrumentForm.tipo,
                          descripcion: instrumentForm.descripcion,
                          pdas_seleccionados: pdasSeleccionados,
                          criterios_personalizados: criteriosPersonalizados
                        }),
                        cache: 'no-store'
                      });
                      
                      if (!response.ok) {
                        throw new Error(`Error: ${response.status}`);
                      }
                      
                      const data = await response.json();
                      
                      if (data.error) {
                        throw new Error(data.error);
                      }
                      
                      toast.success(`¡${instrumentForm.tipo === 'rubrica_analitica' ? 'Rúbrica' : 'Lista de cotejo'} generada con éxito!`, {
                        description: "Ya puedes utilizarla para evaluar el proyecto"
                      });
                      
                      // Recargar instrumentos y cambiar a la pestaña de evaluación
                      await cargarInstrumentos();
                      setActiveTab('evaluacion');
                      
                    } catch (error) {
                      console.error("Error al generar el instrumento:", error);
                      toast.error("Error al generar el instrumento", {
                        description: error instanceof Error ? error.message : "Ocurrió un error inesperado"
                      });
                    } finally {
                      setGeneratingRubrica(false);
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={generatingRubrica}
                >
                  {generatingRubrica ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Generar Borrador con IA 🤖
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Visualización de Rúbricas */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full flex flex-col">
          {instrumentoSeleccionado && (
            <>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {instrumentoSeleccionado.titulo}
                </DialogTitle>
                <DialogDescription>
                  {instrumentoSeleccionado.tipo === 'rubrica_analitica' ? 'Rúbrica Analítica' : 'Lista de Cotejo'} • 
                  Creado el {new Date(instrumentoSeleccionado.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="flex-1 mt-6">
                <div className="pr-4">
                  {instrumentoSeleccionado.tipo === 'rubrica_analitica' ? (
                    <RubricaViewer contenido={instrumentoSeleccionado.contenido} />
                  ) : (
                    <ListaCotejoViewer contenido={instrumentoSeleccionado.contenido} />
                  )}
                </div>
              </ScrollArea>
              
              <div className="flex justify-end gap-3 pt-4 border-t mt-6 flex-shrink-0">
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  Cerrar
                </Button>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={descargarPDF}
                >
                  Descargar PDF
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
