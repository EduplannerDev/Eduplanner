"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, BookOpen, Users, Calendar, Target, Lightbulb, Loader2, CheckSquare, FileText, FolderOpen, ClipboardList, ArrowRight, Plus, X, Bot, Trash2, Search, Unlink } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useProyectos } from '@/hooks/use-proyectos'
import { useErrorLogger } from '@/hooks/use-error-logger'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { generateRubricaPDF, generateListaCotejoPDF } from "@/lib/pdf-generator"
import { ProyectoRecursos } from "./proyecto-recursos"
import { usePlaneaciones } from "@/hooks/use-planeaciones"
import { useProfile } from "@/hooks/use-profile"
import { isUserPro } from "@/lib/subscription-utils"
import { supabase } from '@/lib/supabase'
import { createProyectoMomentoPlaneacionLink, deleteProyectoMomentoPlaneacionLink } from "@/lib/planeaciones"
import { convertMarkdownToHtml } from '@/components/ui/rich-text-editor'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
    'Sobresaliente': 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    'Logrado': 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', 
    'En Proceso': 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    'Requiere Apoyo': 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }

  return (
    <div className="space-y-6">
      {/* Título de la rúbrica */}
      {contenido.titulo_rubrica && (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {contenido.titulo_rubrica}
          </h3>
        </div>
      )}

      {/* Tabla de rúbrica */}
      <div className="w-full overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="border border-gray-300 dark:border-gray-600 p-4 text-left font-semibold min-w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 dark:text-gray-100">
                Criterio de Evaluación
              </th>
              {niveles.map((nivel) => (
                <th key={nivel} className="border border-gray-300 dark:border-gray-600 p-4 text-center font-semibold min-w-[220px] dark:text-gray-100">
                  {nivel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contenido.criterios.map((criterio: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="border border-gray-300 dark:border-gray-600 p-4 font-medium bg-gray-50 dark:bg-gray-800 sticky left-0 z-10">
                  <div className="space-y-3">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-relaxed">
                      {criterio.criterio}
                    </div>
                    {criterio.pda_origen && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/20 p-2 rounded border-l-2 border-purple-200 dark:border-purple-800">
                        <strong>PDA:</strong> {criterio.pda_origen}
                      </div>
                    )}
                  </div>
                </td>
                {niveles.map((nivel) => (
                  <td key={nivel} className={`border border-gray-300 dark:border-gray-600 p-4 text-sm leading-relaxed ${colores[nivel as keyof typeof colores]} align-top dark:text-gray-100`}>
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
      <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-200 dark:border-blue-800">
        <p><strong>Nota:</strong> Esta rúbrica contiene {contenido.criterios?.length || 0} criterio{(contenido.criterios?.length || 0) !== 1 ? 's' : ''} de evaluación con 4 niveles de desempeño cada uno.</p>
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

  if (!contenido || !indicadores || indicadores.length === 0) {
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
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {titulo}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Marque "Sí" o "No" para cada indicador y agregue observaciones si es necesario
        </p>
      </div>

      {/* Tabla interactiva */}
      <div className="border dark:border-gray-600 rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b dark:border-gray-600">
          <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-gray-700 dark:text-gray-300">
            <div className="col-span-6">Indicador de Logro</div>
            <div className="col-span-1 text-center">Sí</div>
            <div className="col-span-1 text-center">No</div>
            <div className="col-span-4">Observaciones</div>
          </div>
        </div>
        
        <div className="divide-y dark:divide-gray-600">
          {indicadores.map((indicador: any, index: number) => (
            <div key={index} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="grid grid-cols-12 gap-4 items-start">
                {/* Indicador */}
                <div className="col-span-6">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                    {indicador.indicador || indicador.criterio}
                  </p>
                  {(indicador.criterio_origen || indicador.pda_origen) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
      <div className="flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-200 dark:border-blue-800">
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
          <p><strong>Total de indicadores:</strong> {indicadores?.length || 0}</p>
          <p><strong>Evaluados:</strong> {Object.values(evaluaciones).filter(e => e.si || e.no).length}</p>
        </div>
      </div>
    </div>
  )
}

export function ViewProyecto({ proyectoId, onBack }: ViewProyectoProps) {
  const router = useRouter()
  const { obtenerProyecto, obtenerFasesProyecto, loading, error } = useProyectos()
  const { logComponentError } = useErrorLogger({ 
    componentName: 'ViewProyecto',
    module: 'proyectos'
  })
  const [proyecto, setProyecto] = useState<ProyectoCompleto | null>(null)
  const [fases, setFases] = useState<ProyectoFase[]>([])
  const [loadingFases, setLoadingFases] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [loadingEnlaces, setLoadingEnlaces] = useState(false)
  const [enlacesLoaded, setEnlacesLoaded] = useState(false)
  const [showInstrumentDialog, setShowInstrumentDialog] = useState(false)
  const [generatingRubrica, setGeneratingRubrica] = useState(false)
  const [instrumentos, setInstrumentos] = useState<InstrumentoEvaluacion[]>([])
  const [activeTab, setActiveTab] = useState('plano-didactico')
  const [generatingPDF, setGeneratingPDF] = useState(false)
  
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
  
  // Estado para el modal de visualización de rúbricas
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [instrumentoSeleccionado, setInstrumentoSeleccionado] = useState<InstrumentoEvaluacion | null>(null)

  // Estados para el modal de enlazar planeación
  const [showLinkPlaneacionModal, setShowLinkPlaneacionModal] = useState(false)
  const [selectedMomentoId, setSelectedMomentoId] = useState<string | null>(null)
  const [selectedMomentoName, setSelectedMomentoName] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estados para el modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [planeacionToLink, setPlaneacionToLink] = useState<any>(null)
  
  // Estado para almacenar las planeaciones enlazadas a cada momento
  const [linkedPlaneaciones, setLinkedPlaneaciones] = useState<{[momentoId: string]: any}>({})
  const [showViewModal, setShowViewModal] = useState(false)
  const [planeacionToView, setPlaneacionToView] = useState<any>(null)
  const [showUnlinkModal, setShowUnlinkModal] = useState(false)
  const [momentoToUnlink, setMomentoToUnlink] = useState<string | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [momentoToGenerate, setMomentoToGenerate] = useState<ProyectoFase | null>(null)
  const [showCimeForm, setShowCimeForm] = useState(false)
  const [showGeneratingView, setShowGeneratingView] = useState(false)
  const [showNemForm, setShowNemForm] = useState(false)
  const [showNemGeneratingView, setShowNemGeneratingView] = useState(false)
  
  // Estados para el formulario CIME
  const [grado, setGrado] = useState('')
  const [temaEspecifico, setTemaEspecifico] = useState('')
  const [materialPrincipal, setMaterialPrincipal] = useState('')
  const [conocimientosPrevios, setConocimientosPrevios] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Estados para el formulario NEM
  const [nemGrado, setNemGrado] = useState('')
  const [nemTema, setNemTema] = useState('')
  const [nemObjetivo, setNemObjetivo] = useState('')
  const [nemActividades, setNemActividades] = useState('')
  const [nemEvaluacion, setNemEvaluacion] = useState('')
  const [isNemGenerating, setIsNemGenerating] = useState(false)
  
  
  // Hook para obtener las planeaciones del profesor
  const { planeaciones: planeacionesProfesor, loading: loadingPlaneaciones, createPlaneacion } = usePlaneaciones()
  
  // Hook para obtener el perfil del usuario
  const { profile } = useProfile()

  useEffect(() => {
    cargarProyecto()
    cargarInstrumentos()
  }, [proyectoId])

  // Cargar planeaciones enlazadas cuando se cargan las fases
  useEffect(() => {
    if (fases && fases.length > 0 && !enlacesLoaded && !loadingEnlaces) {
      cargarPlaneacionesEnlazadas()
    }
  }, [fases, enlacesLoaded])

  const cargarProyecto = async () => {
    setInitialLoading(true)
    setHasError(false)
    setEnlacesLoaded(false) // Reset enlaces cuando se carga un nuevo proyecto
    
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
      logComponentError(error as Error, 'cargarProyecto', {
        proyectoId,
        errorType: 'data_loading'
      })
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

  const descargarPDF = async () => {
    if (!instrumentoSeleccionado) {
      toast.error('No hay instrumento seleccionado')
      return
    }


    setGeneratingPDF(true)
    try {
      if (instrumentoSeleccionado.tipo === 'rubrica_analitica') {
        await generateRubricaPDF(instrumentoSeleccionado)
        toast.success('PDF de rúbrica descargado exitosamente')
      } else if (instrumentoSeleccionado.tipo === 'lista_cotejo') {
        await generateListaCotejoPDF(instrumentoSeleccionado)
        toast.success('PDF de lista de cotejo descargado exitosamente')
      } else {
        toast.error('Tipo de instrumento no soportado para descarga PDF')
      }
    } catch (error) {
      console.error('Error al generar PDF:', error)
      toast.error('Error al generar el PDF')
    } finally {
      setGeneratingPDF(false)
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
      if (pdasProyecto && pdasProyecto.length === 0) {
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

  // Función para cargar las planeaciones enlazadas a cada momento
  const cargarPlaneacionesEnlazadas = async () => {
    setLoadingEnlaces(true)
    const enlaces: {[momentoId: string]: any} = {}
    
    try {
      // Obtener todos los IDs de las fases
      const faseIds = fases.map(fase => fase.id)
      
      if (faseIds.length === 0) {
        setLinkedPlaneaciones(enlaces)
        setEnlacesLoaded(true)
        return
      }

      // Hacer una sola consulta para obtener todos los enlaces
      const { data: enlacesData, error } = await supabase
        .from('proyecto_momento_planeacion')
        .select(`
          proyecto_fase_id,
          planeacion_id,
          planeaciones (
            id,
            titulo,
            materia,
            grado,
            duracion,
            objetivo,
            metodologia,
            contenido,
            created_at
          )
        `)
        .in('proyecto_fase_id', faseIds)

      if (error) {
        console.error('Error cargando enlaces de planeaciones:', error)
        setLinkedPlaneaciones(enlaces)
        setEnlacesLoaded(true)
        return
      }

      // Procesar los resultados
      if (enlacesData) {
        enlacesData.forEach(enlace => {
          if (enlace.planeaciones) {
            enlaces[enlace.proyecto_fase_id] = enlace.planeaciones
          }
        })
      }
      
      setLinkedPlaneaciones(enlaces)
      setEnlacesLoaded(true)
    } catch (error) {
      console.error('Error inesperado cargando enlaces:', error)
      setLinkedPlaneaciones(enlaces)
      setEnlacesLoaded(true)
    } finally {
      setLoadingEnlaces(false)
    }
  }

  // Función para enlazar planeación existente a un momento
  const handleEnlazarPlaneacion = (momentoId: string) => {
    const momento = fases.find(f => f.id === momentoId)
    if (momento) {
      setSelectedMomentoId(momentoId)
      setSelectedMomentoName(momento.momento_nombre)
      setShowLinkPlaneacionModal(true)
    }
  }

  // Función para generar nueva planeación para un momento
  const handleGenerarPlaneacion = (momento: ProyectoFase) => {
    // Verificar si ya hay una planeación enlazada
    if (linkedPlaneaciones[momento.id]) {
      toast.warning('Este momento ya tiene una planeación enlazada. Desenlázala primero para generar una nueva.')
      return
    }
    
    setMomentoToGenerate(momento)
    setShowGenerateModal(true)
  }

  // Función para ver la planeación enlazada
  const handleVerPlaneacion = (momentoId: string) => {
    const planeacionEnlazada = linkedPlaneaciones[momentoId]
    if (planeacionEnlazada) {
      setPlaneacionToView(planeacionEnlazada)
      setShowViewModal(true)
    }
  }

  // Función para manejar la selección de planeación
  const handleSelectPlaneacion = (planeacionId: string) => {
    const planeacionSeleccionada = planeacionesProfesor.find(p => p.id === planeacionId)
    
    if (!planeacionSeleccionada) return

    // Guardar la planeación seleccionada y mostrar modal de confirmación
    setPlaneacionToLink(planeacionSeleccionada)
    setShowConfirmModal(true)
  }

  // Función para confirmar el enlazado de la planeación
  const handleConfirmLink = async () => {
    if (!planeacionToLink || !selectedMomentoId) return

    try {
      const success = await createProyectoMomentoPlaneacionLink(
        selectedMomentoId,
        planeacionToLink.id
      )

      if (success) {
        toast.success(`Planeación "${planeacionToLink.titulo}" enlazada al momento: ${selectedMomentoName}`)
        
        // Actualizar el estado de enlaces
        setLinkedPlaneaciones(prev => ({
          ...prev,
          [selectedMomentoId]: planeacionToLink
        }))
        
        // Cerrar ambos modales y limpiar estados
        setShowConfirmModal(false)
        setShowLinkPlaneacionModal(false)
        setSelectedMomentoId(null)
        setSelectedMomentoName(null)
        setSearchTerm('')
        setPlaneacionToLink(null)
      } else {
        toast.error('Error al enlazar la planeación. Inténtalo de nuevo.')
      }
    } catch (error) {
      console.error('Error enlazando planeación:', error)
      toast.error('Error al enlazar la planeación. Inténtalo de nuevo.')
    }
  }

  // Función para cancelar el enlazado
  const handleCancelLink = () => {
    setShowConfirmModal(false)
    setPlaneacionToLink(null)
  }

  // Función para cerrar el modal de enlazar planeación
  const handleCloseLinkModal = () => {
    setShowLinkPlaneacionModal(false)
    setSelectedMomentoId(null)
    setSelectedMomentoName(null)
    setSearchTerm('') // Limpiar búsqueda al cerrar
  }

  // Función para cerrar el modal de visualización
  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setPlaneacionToView(null)
  }

  // Función para iniciar el desenlazado
  const handleUnlinkPlaneacion = (momentoId: string) => {
    setMomentoToUnlink(momentoId)
    setShowUnlinkModal(true)
    setShowViewModal(false) // Cerrar el modal de visualización
  }

  // Función para confirmar el desenlazado
  const handleConfirmUnlink = async () => {
    if (!momentoToUnlink) return

    try {
      const success = await deleteProyectoMomentoPlaneacionLink(
        momentoToUnlink,
        planeacionToView?.id
      )

      if (success) {
        toast.success('Planeación desenlazada correctamente')
        
        // Actualizar el estado de enlaces
        setLinkedPlaneaciones(prev => {
          const newState = { ...prev }
          delete newState[momentoToUnlink]
          return newState
        })
        
        // Cerrar modales y limpiar estados
        setShowUnlinkModal(false)
        setMomentoToUnlink(null)
        setPlaneacionToView(null)
      } else {
        toast.error('Error al desenlazar la planeación. Inténtalo de nuevo.')
      }
    } catch (error) {
      console.error('Error desenlazando planeación:', error)
      toast.error('Error al desenlazar la planeación. Inténtalo de nuevo.')
    }
  }

  // Función para cancelar el desenlazado
  const handleCancelUnlink = () => {
    setShowUnlinkModal(false)
    setMomentoToUnlink(null)
    setShowViewModal(true) // Volver al modal de visualización
  }

  // Función para cerrar el modal de generación
  const handleCloseGenerateModal = () => {
    setShowGenerateModal(false)
    setMomentoToGenerate(null)
  }

  // Función para generar planeación NEM
  const handleGenerateNEM = () => {
    if (momentoToGenerate && proyecto) {
      // Pre-llenar datos del proyecto y momento
      setNemGrado(proyecto.grupos?.grado || '')
      setNemTema(momentoToGenerate.momento_nombre)
      
      setShowNemForm(true)
      setShowGenerateModal(false)
    }
  }

  // Función para generar planeación CIME
  const handleGenerateCIME = () => {
    if (momentoToGenerate && proyecto) {
      
      // Pre-llenar datos del proyecto y momento
      setGrado(proyecto.grupos?.grado || '')
      setTemaEspecifico(momentoToGenerate.momento_nombre)
      
      setShowCimeForm(true)
      setShowGenerateModal(false)
    }
  }

  // Función para cerrar el formulario CIME
  const handleCloseCimeForm = () => {
    setShowCimeForm(false)
    setShowGeneratingView(false)
    setMomentoToGenerate(null)
    // Limpiar formulario
    setGrado('')
    setTemaEspecifico('')
    setMaterialPrincipal('')
    setConocimientosPrevios('')
  }

  // Función para cerrar el formulario NEM
  const handleCloseNemForm = () => {
    setShowNemForm(false)
    setShowNemGeneratingView(false)
    setMomentoToGenerate(null)
    // Limpiar formulario NEM
    setNemGrado('')
    setNemTema('')
    setNemObjetivo('')
    setNemActividades('')
    setNemEvaluacion('')
  }

  // Función para generar la planeación CIME
  const handleGenerateCimePlaneacion = async () => {
    if (!grado || !temaEspecifico || !materialPrincipal || !momentoToGenerate) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    setIsGenerating(true)
    setShowGeneratingView(true)

    try {

      // Construir el prompt para CIME
      const prompt = `ROL: Actúa como un pedagogo experto y certificado en la metodología CIME para la enseñanza de las matemáticas. Tu conocimiento se basa en el constructivismo y el uso de materiales concretos.

CONTEXTO: Estoy creando una planeación de matemáticas para ${grado} sobre el tema de "${temaEspecifico}". El material principal a utilizar será ${materialPrincipal}.

${conocimientosPrevios ? `CONOCIMIENTOS PREVIOS: ${conocimientosPrevios}` : ''}

TAREA: Genera una planeación didáctica completa siguiendo estrictamente la secuencia de 3 etapas del método CIME: Etapa Concreta, Etapa de Registro y Etapa Formal. Para cada etapa, describe una secuencia de actividades detallada y clara que un profesor pueda seguir en el aula.

ESTRUCTURA DE SALIDA OBLIGATORIA: La planeación debe tener el siguiente formato:

Materia: Matemáticas (Método CIME)
Grado: ${grado}
Tema: ${temaEspecifico}
Propósito de la Clase: [Genera un propósito claro basado en el tema]

1. ETAPA CONCRETA: (Describe aquí, paso a paso, una actividad práctica y manipulativa. Si se eligieron Regletas, explica cómo usarlas para explorar el concepto. Si fue el Geoplano, describe la actividad correspondiente. Sé muy específico en las instrucciones para el profesor y las preguntas que puede hacer a los alumnos.)

2. ETAPA DE REGISTRO: (Describe aquí una actividad donde los alumnos dibujen, coloreen o escriban en su cuaderno para representar lo que descubrieron en la etapa concreta. Por ejemplo, "dibujar las construcciones de regletas que hicieron".)

3. ETAPA FORMAL: (Describe aquí cómo el profesor debe introducir el lenguaje matemático abstracto (números, símbolos, algoritmos). Explica cómo conectar estos símbolos con la experiencia concreta y de registro que los alumnos ya vivieron.)

Materiales Necesarios: [Lista los materiales mencionados, incluyendo Regletas/Geoplano]
Evaluación Sugerida: [Sugiere una forma simple de evaluar la comprensión al final de la clase]`

      // Llamar a la API para generar la planeación
      const response = await fetch('/api/generate-cime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error(`Error al generar la planeación: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.content) {
        throw new Error('No se pudo generar el contenido')
      }

      // Convertir markdown a HTML
      const htmlContent = convertMarkdownToHtml(data.content)

      // Crear la planeación
      const nuevaPlaneacion = await createPlaneacion({
        titulo: `Planeación CIME - ${temaEspecifico}`,
        materia: 'Matemáticas',
        grado: grado,
        duracion: '50 minutos',
        objetivo: `Desarrollar comprensión del concepto ${temaEspecifico} mediante metodología CIME`,
        contenido: htmlContent,
        metodologia: 'CIME'
      })

      if (nuevaPlaneacion) {
        toast.success('Planeación CIME generada correctamente')
        
        // Enlazar automáticamente la planeación al momento
        const success = await createProyectoMomentoPlaneacionLink(
          momentoToGenerate.id,
          nuevaPlaneacion.id
        )

        if (success) {
          toast.success('Planeación enlazada automáticamente al momento')
          
          // Actualizar el estado de enlaces
          setLinkedPlaneaciones(prev => ({
            ...prev,
            [momentoToGenerate.id]: nuevaPlaneacion
          }))
        } else {
          toast.warning('Planeación creada pero no se pudo enlazar automáticamente')
        }

        // Cerrar formulario
        handleCloseCimeForm()
      } else {
        throw new Error('No se pudo crear la planeación')
      }
    } catch (error) {
      toast.error(`Error al generar la planeación: ${error.message}`)
      // En caso de error, volver al formulario
      setShowGeneratingView(false)
    } finally {
      setIsGenerating(false)
    }
  }

  // Función para generar la planeación NEM
  const handleGenerateNemPlaneacion = async () => {
    if (!nemGrado || !nemTema || !nemObjetivo || !momentoToGenerate) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    setIsNemGenerating(true)
    setShowNemGeneratingView(true)

    try {

      // Construir información de PDAs para el prompt
      const pdasInfo = pdasProyecto && pdasProyecto.length > 0 
        ? `\nPDAs DEL PROYECTO (Programas de Desarrollo de Aprendizaje):
${pdasProyecto.map((pda, index) => 
  `${index + 1}. [${pda.campo_formativo}] ${pda.contenido}
     PDA: ${pda.pda}`
).join('\n')}`
        : ''

    // Crear el mensaje simple como lo haría el usuario en chat-ia
    const mensajeUsuario = `Planeación de matemáticas para ${nemGrado}° grado sobre ${nemTema}${nemObjetivo ? ` con el objetivo: ${nemObjetivo}` : ''}${nemActividades ? `. Actividades sugeridas: ${nemActividades}` : ''}${nemEvaluacion ? `. Evaluación sugerida: ${nemEvaluacion}` : ''}.`

      // Usar endpoint específico para NEM (como las planeaciones normales pero sin stream)
      const response = await fetch('/api/generate-nem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: [
            { role: 'user', content: mensajeUsuario }
          ]
        }),
      })

      if (!response.ok) {
        throw new Error(`Error al generar la planeación: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.content) {
        throw new Error('No se pudo generar el contenido')
      }

      // Convertir markdown a HTML
      const htmlContent = convertMarkdownToHtml(data.content)

      // Crear la planeación
      const nuevaPlaneacion = await createPlaneacion({
        titulo: `Planeación NEM - ${nemTema}`,
        materia: 'Matemáticas',
        grado: nemGrado,
        duracion: '50 minutos',
        objetivo: nemObjetivo,
        contenido: htmlContent,
        metodologia: 'NEM'
      })

      if (nuevaPlaneacion) {
        toast.success('Planeación NEM generada correctamente')
        
        // Enlazar automáticamente la planeación al momento
        try {
          const success = await createProyectoMomentoPlaneacionLink(
            momentoToGenerate.id,
            nuevaPlaneacion.id
          )

          if (success) {
            toast.success('Planeación enlazada automáticamente al momento')
            
            // Actualizar el estado de enlaces
            setLinkedPlaneaciones(prev => ({
              ...prev,
              [momentoToGenerate.id]: nuevaPlaneacion
            }))
          } else {
            toast.warning('Planeación creada pero no se pudo enlazar automáticamente')
          }
        } catch (linkError) {
          toast.warning('Planeación creada pero no se pudo enlazar automáticamente')
        }

        // Cerrar formulario
        handleCloseNemForm()
      } else {
        throw new Error('No se pudo crear la planeación')
      }
    } catch (error) {
      toast.error(`Error al generar la planeación: ${error.message}`)
      // En caso de error, volver al formulario
      setShowNemGeneratingView(false)
    } finally {
      setIsNemGenerating(false)
    }
  }


  // Función para filtrar planeaciones basada en el término de búsqueda
  const filteredPlaneaciones = planeacionesProfesor.filter(planeacion => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      planeacion.titulo.toLowerCase().includes(searchLower) ||
      planeacion.materia?.toLowerCase().includes(searchLower) ||
      planeacion.grado?.toLowerCase().includes(searchLower) ||
      planeacion.objetivo?.toLowerCase().includes(searchLower) ||
      planeacion.metodologia?.toLowerCase().includes(searchLower)
    )
  })

  // Mostrar loader inicial mientras se carga el proyecto
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  // Solo mostrar error si realmente hay un error después de cargar
  if (hasError || (!proyecto && !initialLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Proyecto no encontrado</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">El proyecto solicitado no existe o no tienes permisos para verlo.</p>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              ✨ Magia de la IA ✨
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              La IA está generando tu {tipoInstrumento} personalizada
            </p>
          </div>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Generación con IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    🤖 Analizando tu proyecto...
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Creando criterios de evaluación para: <strong className="text-gray-900 dark:text-gray-100">{proyecto?.nombre}</strong>
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Procesando:</strong> Fases y momentos del proyecto
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Metodología:</strong> {proyecto?.metodologia_nem}
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
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
    <div className="space-y-6 max-w-6xl mx-auto p-6">
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{proyecto.nombre}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">{proyecto.grupos.nombre} - {proyecto.grupos.grado}° {proyecto.grupos.nivel}</p>
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
              <Card className="dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Target className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Problemática
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{proyecto.problematica}</p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <BookOpen className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                    Producto Final
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{proyecto.producto_final}</p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Lightbulb className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                    Metodología
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{proyecto.metodologia_nem}</p>
                </CardContent>
              </Card>
            </div>

            {/* Fases del Proyecto */}
            <Card className="dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
                  Fases y Momentos del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingFases ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Cargando fases del proyecto...</p>
                  </div>
                ) : fases && fases.length > 0 ? (
                  <div className="space-y-6">
                    {fases.map((fase, index) => (
                      <div key={fase.id} className="border-l-4 border-blue-500 dark:border-blue-400 pl-6">
                        <div className="mb-2">
                          <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-400">{fase.fase_nombre}</h3>
                          <h4 className="font-medium text-md text-gray-700 dark:text-gray-300">{fase.momento_nombre}</h4>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                            {fase.contenido}
                          </p>
                          
                          {/* Botones para enlazar/ver y generar planeaciones */}
                          <div className="mt-4 flex gap-2">
                            {loadingEnlaces ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                                disabled
                              >
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando...
                              </Button>
                            ) : linkedPlaneaciones[fase.id] ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                                onClick={() => handleVerPlaneacion(fase.id)}
                              >
                                <BookOpen className="h-4 w-4" />
                                Ver Planeación
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                                onClick={() => handleEnlazarPlaneacion(fase.id)}
                              >
                                <BookOpen className="h-4 w-4" />
                                Enlazar Planeación
                              </Button>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2"
                                    onClick={() => handleGenerarPlaneacion(fase)}
                                    disabled={loadingEnlaces || !!linkedPlaneaciones[fase.id]}
                                  >
                                    <Bot className="h-4 w-4" />
                                    Generar Planeación
                                  </Button>
                                </TooltipTrigger>
                                {linkedPlaneaciones[fase.id] && (
                                  <TooltipContent>
                                    <p>Este momento ya tiene una planeación enlazada.</p>
                                    <p>Desenlázala primero para generar una nueva.</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p>No se encontraron fases para este proyecto.</p>
                    <p className="text-sm mt-2">Las fases se generan automáticamente cuando se crea el proyecto.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña: Evaluación */}
          <TabsContent value="evaluacion" className="mt-6">
            <Card className="dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <ClipboardList className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
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
                {instrumentos && instrumentos.length > 0 ? (
                  <div className="space-y-4">
                    {instrumentos.map((instrumento) => (
                      <Card key={instrumento.id} className="border-l-4 border-purple-500 dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200 dark:border-gray-700 dark:hover:border-gray-600">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{instrumento.titulo}</CardTitle>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {instrumento.tipo === 'rubrica_analitica' ? 'Rúbrica Analítica' : 
                                 instrumento.tipo === 'lista_cotejo' ? 'Lista de Cotejo' : 
                                 'Escala de Estimación'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-2">
                                 <Button 
                                   variant="outline" 
                                   size="sm"
                                   onClick={() => verInstrumento(instrumento)}
                                   className="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 dark:hover:bg-purple-900/20 dark:hover:text-purple-300 dark:hover:border-purple-600"
                                 >
                                   Ver
                                 </Button>
                                 <AlertDialog>
                                   <AlertDialogTrigger asChild>
                                     <Button 
                                       variant="outline" 
                                       size="sm"
                                       className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 dark:border-red-800"
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
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
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
            <ProyectoRecursos proyectoId={proyectoId} />
          </TabsContent>
        </Tabs>
    
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
                          : 'hover:bg-purple-50 dark:hover:bg-purple-900/20 dark:hover:border-purple-400'
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
                          : 'hover:bg-purple-50 dark:hover:bg-purple-900/20 dark:hover:border-purple-400'
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
                      <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando PDAs...</span>
                    </div>
                  ) : pdasProyecto && pdasProyecto.length > 0 ? (
                    <ScrollArea className="h-80 border rounded-lg p-4">
                      <div className="space-y-4">
                        {pdasProyecto.map((pda) => (
                          <div 
                            key={pda.id} 
                            className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                            onClick={() => togglePdaSelection(pda.id)}
                          >
                            <Checkbox
                              id={`pda-${pda.id}`}
                              checked={pdasSeleccionados.includes(pda.id)}
                              onCheckedChange={() => togglePdaSelection(pda.id)}
                              className="mt-2 h-5 w-5 pointer-events-none"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-base font-medium text-gray-900 dark:text-gray-100 block leading-relaxed">
                                {pda.pda}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{pda.contenido}</p>
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
                  
                  {pdasSeleccionados && pdasSeleccionados.length > 0 && (
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
                    
                    {criteriosPersonalizados && criteriosPersonalizados.length > 0 && (
                      <div className="space-y-3">
                        {criteriosPersonalizados.map((criterio, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                            <span className="text-base text-gray-900 dark:text-gray-100 leading-relaxed">{criterio}</span>
                            <Button
                              onClick={() => eliminarCriterioPersonalizado(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 dark:hover:text-red-300"
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
                {(pdasSeleccionados && pdasSeleccionados.length > 0 || criteriosPersonalizados && criteriosPersonalizados.length > 0) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckSquare className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Criterios seleccionados</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {pdasSeleccionados && pdasSeleccionados.length} PDA{pdasSeleccionados && pdasSeleccionados.length !== 1 ? 's' : ''} del proyecto
                      {pdasSeleccionados && pdasSeleccionados.length > 0 && criteriosPersonalizados && criteriosPersonalizados.length > 0 ? ' y ' : ''}
                      {criteriosPersonalizados && criteriosPersonalizados.length > 0 && `${criteriosPersonalizados.length} criterio${criteriosPersonalizados.length !== 1 ? 's' : ''} personalizado${criteriosPersonalizados.length !== 1 ? 's' : ''}`}
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
                    if ((!pdasSeleccionados || pdasSeleccionados.length === 0) && (!criteriosPersonalizados || criteriosPersonalizados.length === 0)) {
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
                  disabled={generatingPDF}
                >
                  {generatingPDF ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando PDF...
                    </>
                  ) : (
                    "Descargar PDF"
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para Enlazar Planeación */}
      <Dialog open={showLinkPlaneacionModal} onOpenChange={handleCloseLinkModal}>
        <DialogContent className="max-w-4xl w-full max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Enlazar Planeación al Momento
            </DialogTitle>
            <DialogDescription>
              Selecciona una planeación para enlazar al momento: <strong>{selectedMomentoName}</strong>
            </DialogDescription>
          </DialogHeader>

          {/* Campo de búsqueda */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar planeación por título, materia, grado, objetivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredPlaneaciones && filteredPlaneaciones.length} de {planeacionesProfesor && planeacionesProfesor.length} planeaciones encontradas
              </p>
            )}
          </div>
          
          <ScrollArea className="h-[400px] pr-4">
            {loadingPlaneaciones ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Cargando planeaciones...</span>
              </div>
            ) : !planeacionesProfesor || planeacionesProfesor.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tienes planeaciones creadas</p>
                <p className="text-sm">Crea una planeación primero para poder enlazarla</p>
              </div>
            ) : !filteredPlaneaciones || filteredPlaneaciones.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron planeaciones</p>
                <p className="text-sm">Intenta con otros términos de búsqueda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPlaneaciones.map((planeacion) => (
                  <Card 
                    key={planeacion.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelectPlaneacion(planeacion.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {planeacion.titulo}
                          </h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(planeacion.created_at).toLocaleDateString("es-MX")}
                            </span>
                            {planeacion.grado && <span>{planeacion.grado}</span>}
                            {planeacion.duracion && <span>{planeacion.duracion}</span>}
                          </div>
                          {planeacion.objetivo && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                              {planeacion.objetivo}
                            </p>
                          )}
                        </div>
                        <Badge className="ml-4">
                          {planeacion.metodologia === 'CIME' ? 'CIME' : 
                           planeacion.origen === 'dosificacion' ? 'Dosificación' : 'NEM'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCloseLinkModal}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación para Enlazar Planeación */}
      <Dialog open={showConfirmModal} onOpenChange={handleCancelLink}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Confirmar Enlazado
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              ¿Estás seguro de que quieres enlazar la planeación{" "}
              <strong className="text-blue-600 dark:text-blue-400">
                "{planeacionToLink?.titulo}"
              </strong>{" "}
              al momento{" "}
              <strong className="text-orange-600 dark:text-orange-400">
                "{selectedMomentoName}"
              </strong>?
            </p>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Esta acción vinculará la planeación seleccionada con el momento del proyecto.
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancelLink}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmLink} className="bg-blue-600 hover:bg-blue-700">
              Confirmar Enlazado
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Visualizar Planeación */}
      <Dialog open={showViewModal} onOpenChange={handleCloseViewModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {planeacionToView?.titulo}
            </DialogTitle>
            <DialogDescription>
              Planeación enlazada al momento del proyecto
            </DialogDescription>
          </DialogHeader>
          
          {planeacionToView && (
            <div className="space-y-4">
              {/* Información básica de la planeación */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Materia</Label>
                  <p className="text-sm font-medium">{planeacionToView.materia}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Grado</Label>
                  <p className="text-sm font-medium">{planeacionToView.grado}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Duración</Label>
                  <p className="text-sm font-medium">{planeacionToView.duracion}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Metodología</Label>
                  <Badge 
                    className={
                      planeacionToView.metodologia === 'CIME' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }
                  >
                    {planeacionToView.metodologia || 'NEM'}
                  </Badge>
                </div>
              </div>

              {/* Objetivo */}
              {planeacionToView.objetivo && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Objetivo</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {planeacionToView.objetivo}
                  </p>
                </div>
              )}

              {/* Contenido de la planeación */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contenido de la Planeación</Label>
                <ScrollArea className="h-96 w-full border rounded-md p-4 mt-2">
                  {planeacionToView.contenido ? (
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ 
                        __html: convertMarkdownToHtml(planeacionToView.contenido) 
                      }}
                    />
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay contenido disponible para esta planeación</p>
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Fecha de creación */}
              <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
                Creada el: {planeacionToView.created_at ? new Date(planeacionToView.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Fecha no disponible'}
              </div>
            </div>
          )}
          
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => handleUnlinkPlaneacion(
                fases.find(f => linkedPlaneaciones[f.id]?.id === planeacionToView?.id)?.id || ''
              )}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <Unlink className="h-4 w-4" />
              Desenlazar
            </Button>
            <Button variant="outline" onClick={handleCloseViewModal}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación para Desenlazar */}
      <AlertDialog open={showUnlinkModal} onOpenChange={setShowUnlinkModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Unlink className="h-5 w-5 text-red-500" />
              Confirmar Desenlazado
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres desenlazar la planeación{" "}
              <strong className="text-blue-600 dark:text-blue-400">
                "{planeacionToView?.titulo}"
              </strong>{" "}
              del momento del proyecto?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>⚠️ Advertencia:</strong> Esta acción eliminará permanentemente el enlace entre la planeación y el momento del proyecto. Podrás volver a enlazarla más tarde si es necesario.
            </p>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelUnlink}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmUnlink}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              Desenlazar Planeación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para Seleccionar Tipo de Planeación */}
      <Dialog open={showGenerateModal} onOpenChange={handleCloseGenerateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Generar Nueva Planeación
            </DialogTitle>
            <DialogDescription>
              Selecciona el tipo de planeación que deseas generar para el momento{" "}
              <strong className="text-orange-600 dark:text-orange-400">
                "{momentoToGenerate?.momento_nombre}"
              </strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Información del momento */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Información del Momento:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Momento:</strong> {momentoToGenerate?.momento_nombre}
              </p>
              {momentoToGenerate?.contenido && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <strong>Contenido:</strong> {momentoToGenerate.contenido.substring(0, 100)}
                  {momentoToGenerate.contenido && momentoToGenerate.contenido.length > 100 && '...'}
                </p>
              )}
            </div>

            {/* Opciones de tipo de planeación */}
            <div className="grid gap-3">
              <Button 
                onClick={handleGenerateNEM}
                className="flex items-center justify-between p-4 h-auto bg-green-50 hover:bg-green-100 border border-green-200 text-green-800 hover:text-green-900"
                variant="outline"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Planeación NEM</div>
                    <div className="text-xs text-green-600">Metodología tradicional</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button 
                onClick={handleGenerateCIME}
                className="flex items-center justify-between p-4 h-auto bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 hover:text-blue-900"
                variant="outline"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Planeación CIME</div>
                    <div className="text-xs text-blue-600">Metodología constructivista</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCloseGenerateModal}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal del Formulario CIME */}
      <Dialog open={showCimeForm} onOpenChange={showGeneratingView ? undefined : handleCloseCimeForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              {showGeneratingView ? 'Generando Planeación CIME' : 'Asistente de Planeación CIME para Matemáticas'}
            </DialogTitle>
            <DialogDescription>
              {showGeneratingView 
                ? 'Por favor espera mientras generamos tu planeación...'
                : `Generando planeación para el momento: "${momentoToGenerate?.momento_nombre}"`
              }
            </DialogDescription>
          </DialogHeader>
          
          {showGeneratingView ? (
            /* Vista de Generación en Progreso */
            <div className="space-y-6">
              {/* Información de la planeación que se está generando */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Generando tu Planeación CIME
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 mb-4">
                    Nuestra IA está creando una planeación personalizada siguiendo la metodología CIME
                  </p>
                </div>
                
                {/* Detalles de la planeación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Tema:</span>
                    <p className="text-gray-600 dark:text-gray-400">{temaEspecifico}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Grado:</span>
                    <p className="text-gray-600 dark:text-gray-400">{grado}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Material:</span>
                    <p className="text-gray-600 dark:text-gray-400">{materialPrincipal}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Momento:</span>
                    <p className="text-gray-600 dark:text-gray-400">{momentoToGenerate?.momento_nombre}</p>
                  </div>
                </div>
              </div>

              {/* Pasos del proceso */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Proceso de Generación:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <CheckSquare className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">Analizando los datos del formulario</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">Generando contenido con IA</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">Formateando y guardando</span>
                  </div>
                </div>
              </div>

              {/* Advertencia */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-yellow-600 text-xs font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>No cierres esta ventana</strong> mientras se genera la planeación. 
                      El proceso continuará en segundo plano, pero podrías perder la confirmación del resultado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Formulario Normal */
            <div className="space-y-6">
              {/* Información del proyecto y momento */}
              {momentoToGenerate && proyecto && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Contexto del Proyecto y Momento:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Proyecto:</span>
                      <p className="text-gray-600 dark:text-gray-400">{proyecto.nombre}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Grado:</span>
                      <p className="text-gray-600 dark:text-gray-400">{proyecto.grupos?.grado || 'No especificado'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Momento:</span>
                      <p className="text-gray-600 dark:text-gray-400">{momentoToGenerate.momento_nombre}</p>
                    </div>
                    {proyecto.grupos?.nivel && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Nivel:</span>
                        <p className="text-gray-600 dark:text-gray-400">{proyecto.grupos.nivel}</p>
                      </div>
                    )}
                  </div>
                  {momentoToGenerate.contenido && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Descripción del Momento:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{momentoToGenerate.contenido}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Formulario CIME */}
              <div className="grid gap-4">
                {/* Grado */}
                <div className="space-y-2">
                  <Label htmlFor="grado">Grado *</Label>
                  <div className="relative">
                    <Input
                      id="grado"
                      value={grado}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Del proyecto</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    El grado se obtiene automáticamente del proyecto
                  </p>
                </div>

                {/* Tema Específico */}
                <div className="space-y-2">
                  <Label htmlFor="tema">Tema Específico *</Label>
                  <Input
                    id="tema"
                    placeholder="Ej: Sumas de dos cifras llevando, Fracciones equivalentes"
                    value={temaEspecifico}
                    onChange={(e) => setTemaEspecifico(e.target.value)}
                  />
                </div>

                {/* Material Principal */}
                <div className="space-y-2">
                  <Label htmlFor="material">Material Principal *</Label>
                  <Select value={materialPrincipal} onValueChange={setMaterialPrincipal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el material" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Regletas">Regletas</SelectItem>
                      <SelectItem value="Geoplano">Geoplano</SelectItem>
                      <SelectItem value="Ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conocimientos Previos */}
                <div className="space-y-2">
                  <Label htmlFor="conocimientos">Conocimientos Previos (Opcional)</Label>
                  <Textarea
                    id="conocimientos"
                    placeholder="Describe los conocimientos previos que los alumnos deben tener..."
                    value={conocimientosPrevios}
                    onChange={(e) => setConocimientosPrevios(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Restricción PRO */}
              {profile && !isUserPro(profile) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <Target className="h-5 w-5" />
                    <span className="font-medium">Funcionalidad PRO</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    La generación de planeaciones CIME está disponible solo para usuarios PRO.
                    <br />
                    <a href="/dashboard?section=subscription" className="underline hover:no-underline">
                      Actualiza tu plan aquí
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
          
          {!showGeneratingView && (
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseCimeForm}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGenerateCimePlaneacion}
                disabled={!grado || !temaEspecifico || !materialPrincipal || (profile && !isUserPro(profile))}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Bot className="h-4 w-4 mr-2" />
                Generar Planeación CIME con IA
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal del Formulario NEM */}
      <Dialog open={showNemForm} onOpenChange={showNemGeneratingView ? undefined : handleCloseNemForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              {showNemGeneratingView ? 'Generando Planeación NEM' : 'Asistente de Planeación NEM para Matemáticas'}
            </DialogTitle>
            <DialogDescription>
              {showNemGeneratingView 
                ? 'Por favor espera mientras generamos tu planeación...'
                : `Generando planeación para el momento: "${momentoToGenerate?.momento_nombre}"`
              }
            </DialogDescription>
          </DialogHeader>
          
          {showNemGeneratingView ? (
            /* Vista de Generación en Progreso */
            <div className="space-y-6">
              {/* Información de la planeación que se está generando */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                    Generando tu Planeación NEM
                  </h3>
                  <p className="text-green-700 dark:text-green-300 mb-4">
                    Nuestra IA está creando una planeación personalizada siguiendo la metodología NEM tradicional
                  </p>
                </div>
                
                {/* Detalles de la planeación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Tema:</span>
                    <p className="text-gray-600 dark:text-gray-400">{nemTema}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Grado:</span>
                    <p className="text-gray-600 dark:text-gray-400">{nemGrado}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Objetivo:</span>
                    <p className="text-gray-600 dark:text-gray-400">{nemObjetivo}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Momento:</span>
                    <p className="text-gray-600 dark:text-gray-400">{momentoToGenerate?.momento_nombre}</p>
                  </div>
                </div>
              </div>

              {/* Pasos del proceso */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Proceso de Generación:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <CheckSquare className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">Analizando los datos del formulario</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">Generando contenido con IA</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">Formateando y guardando</span>
                  </div>
                </div>
              </div>

              {/* Advertencia */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-yellow-600 text-xs font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>No cierres esta ventana</strong> mientras se genera la planeación. 
                      El proceso continuará en segundo plano, pero podrías perder la confirmación del resultado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Formulario Normal */
            <div className="space-y-6">
              {/* Información del proyecto y momento */}
              {momentoToGenerate && proyecto && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Contexto del Proyecto y Momento:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Proyecto:</span>
                      <p className="text-gray-600 dark:text-gray-400">{proyecto.nombre}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Grado:</span>
                      <p className="text-gray-600 dark:text-gray-400">{proyecto.grupos?.grado || 'No especificado'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Momento:</span>
                      <p className="text-gray-600 dark:text-gray-400">{momentoToGenerate.momento_nombre}</p>
                    </div>
                    {proyecto.grupos?.nivel && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Nivel:</span>
                        <p className="text-gray-600 dark:text-gray-400">{proyecto.grupos.nivel}</p>
                      </div>
                    )}
                  </div>
                  {momentoToGenerate.contenido && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Descripción del Momento:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{momentoToGenerate.contenido}</p>
                    </div>
                  )}
                </div>
              )}


              {/* Formulario NEM */}
              <div className="grid gap-4">
                {/* Grado */}
                <div className="space-y-2">
                  <Label htmlFor="nem-grado">Grado *</Label>
                  <div className="relative">
                    <Input
                      id="nem-grado"
                      value={nemGrado}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Del proyecto</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    El grado se obtiene automáticamente del proyecto
                  </p>
                </div>

                {/* Tema */}
                <div className="space-y-2">
                  <Label htmlFor="nem-tema">Tema *</Label>
                  <Input
                    id="nem-tema"
                    placeholder="Ej: Sumas de dos cifras, Fracciones equivalentes"
                    value={nemTema}
                    onChange={(e) => setNemTema(e.target.value)}
                  />
                </div>

                {/* Objetivo */}
                <div className="space-y-2">
                  <Label htmlFor="nem-objetivo">Objetivo de la Clase *</Label>
                  <Textarea
                    id="nem-objetivo"
                    placeholder="Describe el objetivo que quieres lograr con esta clase..."
                    value={nemObjetivo}
                    onChange={(e) => setNemObjetivo(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Actividades Sugeridas */}
                <div className="space-y-2">
                  <Label htmlFor="nem-actividades">Actividades Sugeridas (Opcional)</Label>
                  <Textarea
                    id="nem-actividades"
                    placeholder="Describe alguna actividad específica que quieres incluir..."
                    value={nemActividades}
                    onChange={(e) => setNemActividades(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Evaluación Sugerida */}
                <div className="space-y-2">
                  <Label htmlFor="nem-evaluacion">Evaluación Sugerida (Opcional)</Label>
                  <Textarea
                    id="nem-evaluacion"
                    placeholder="Describe cómo quieres evaluar el aprendizaje..."
                    value={nemEvaluacion}
                    onChange={(e) => setNemEvaluacion(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
          
          {!showNemGeneratingView && (
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseNemForm}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGenerateNemPlaneacion}
                disabled={!nemGrado || !nemTema || !nemObjetivo}
                className="bg-green-600 hover:bg-green-700"
              >
                <Bot className="h-4 w-4 mr-2" />
                Generar Planeación NEM con IA
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
