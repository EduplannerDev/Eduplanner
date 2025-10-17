"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BarChart3, Calendar, BookOpen, Target, Loader2, Settings, CheckCircle, ArrowLeft, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { getGradoTexto } from "@/lib/grado-utils"

interface DosificacionProps {
  onCreateNew?: () => void
  onNavigateToChatDosificacion?: (data: {
    contenidos: any[]
    contexto: any
    mesActual: string
    message: string
  }) => void
}

interface ContextoTrabajo {
  id: string
  grado: number
  ciclo_escolar: string
  fecha_inicio: string
  notas?: string
}


export function Dosificacion({ onCreateNew, onNavigateToChatDosificacion }: DosificacionProps) {
  const [loading, setLoading] = useState(false)
  const [contexto, setContexto] = useState<ContextoTrabajo | null>(null)
  const [configurando, setConfigurando] = useState(false)
  const [gradoSeleccionado, setGradoSeleccionado] = useState<string>("")
  const [cicloSeleccionado, setCicloSeleccionado] = useState<string>("")
  const [vistaActual, setVistaActual] = useState<"principal" | "campos-formativos" | "contenidos-campo" | "seguimiento">("principal")
  const [curriculoData, setCurriculoData] = useState<any[]>([])
  const [camposFormativos, setCamposFormativos] = useState<string[]>([])
  const [campoSeleccionado, setCampoSeleccionado] = useState<string>("")  
  const [contenidosSeleccionados, setContenidosSeleccionados] = useState<Set<string>>(new Set())
  const [dosificacionMeses, setDosificacionMeses] = useState<{[contenidoId: string]: {[mes: string]: boolean}}>({})
  
  // Estados para el dashboard de seguimiento
  const [estadisticasSeguimiento, setEstadisticasSeguimiento] = useState({
    totalPDAs: 0,
    completados: 0,
    enProgreso: 0,
    pendientes: 0,
    porcentajeCompletado: 0
  })
  const [estadisticasPorCampo, setEstadisticasPorCampo] = useState<Array<{
    campo: string
    total: number
    completados: number
    enProgreso: number
    pendientes: number
    porcentaje: number
  }>>([])
  const [estadisticasPorTrimestre, setEstadisticasPorTrimestre] = useState<Array<{
    trimestre: number
    nombre: string
    meses: string[]
    asignados: number
    completados: number
    porcentaje: number
    esActual: boolean
  }>>([])
  const [accionesSugeridas, setAccionesSugeridas] = useState<Array<{
    id: string
    pda: string
    campo_formativo: string
    mes: string
    mes_completo: string
  }>>([])
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(false)
  
  const { user } = useAuth()

  // Cargar contexto de trabajo al montar el componente
  useEffect(() => {
    if (user?.id) {
      cargarContextoTrabajo()
    }
  }, [user?.id])

  // Cargar dosificación de meses cuando cambie el contexto o el campo seleccionado
  useEffect(() => {
    if (contexto && user?.id && campoSeleccionado && curriculoData.length > 0) {
      cargarDosificacionMeses()
    }
  }, [contexto, user?.id, campoSeleccionado, curriculoData])

  const cargarContextoTrabajo = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .rpc('get_contexto_trabajo_activo', { profesor_id_param: user.id })

      if (error) {
        console.error('Error cargando contexto de trabajo:', error)
        return
      }

      if (data && data.length > 0) {
        setContexto(data[0])
      } else {
        // No tiene contexto configurado, mostrar configuración inicial
        setConfigurando(true)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const guardarConfiguracion = async () => {
    if (!user?.id || !gradoSeleccionado || !cicloSeleccionado) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .rpc('set_contexto_trabajo', {
          profesor_id_param: user.id,
          grado_param: parseInt(gradoSeleccionado),
          ciclo_escolar_param: cicloSeleccionado
        })

      if (error) {
        console.error('Error guardando configuración:', error)
        return
      }

      // Recargar contexto
      await cargarContextoTrabajo()
      setConfigurando(false)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generar opciones de ciclos escolares (últimos 3 años)
  const generarCiclosEscolares = () => {
    const ciclos = []
    const añoActual = new Date().getFullYear()
    
    for (let i = 0; i < 3; i++) {
      const añoInicio = añoActual - i
      const añoFin = añoInicio + 1
      ciclos.push(`${añoInicio}-${añoFin}`)
    }
    
    return ciclos
  }

  // Cargar campos formativos únicos por grado
  const cargarCamposFormativos = async (grado: number) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('curriculo_sep')
        .select('campo_formativo')
        .eq('grado', grado)
        .order('campo_formativo')

      if (error) {
        console.error('Error cargando campos formativos:', error)
        return
      }

      // Extraer campos formativos únicos
      const camposUnicos = [...new Set(data?.map(item => item.campo_formativo) || [])]
      setCamposFormativos(camposUnicos)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar contenidos de un campo formativo específico
  const cargarContenidosPorCampo = async (grado: number, campoFormativo: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .rpc('get_curriculo_by_grado_campo', { 
          grado_param: grado,
          campo_formativo_param: campoFormativo
        })

      if (error) {
        console.error('Error cargando contenidos:', error)
        return
      }

      setCurriculoData(data || [])
      
      // Cargar dosificación de meses para los contenidos cargados
      // Pasamos los datos directamente para evitar problemas de estado asíncrono
      await cargarDosificacionMesesConDatos(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Manejar clic en distribución temporal
  const handleDistribucionTemporal = () => {
    if (contexto) {
      cargarCamposFormativos(contexto.grado)
      setVistaActual("campos-formativos")
    }
  }

  // Manejar clic en seguimiento
  const handleIrSeguimiento = () => {
    setVistaActual("seguimiento")
    cargarEstadisticasSeguimiento()
  }

  // Cargar estadísticas para el dashboard de seguimiento
  const cargarEstadisticasSeguimiento = async () => {
    if (!user?.id || !contexto?.id) return

    try {
      setCargandoEstadisticas(true)

      // Obtener todos los contenidos dosificados para el contexto actual
      const { data: contenidosDosificados, error: errorDosificados } = await supabase
        .from('dosificacion_meses')
        .select(`
          contenido_id,
          mes,
          curriculo_sep!inner(
            id,
            pda,
            grado,
            campo_formativo
          )
        `)
        .eq('profesor_id', user.id)
        .eq('contexto_id', contexto.id)
        .eq('seleccionado', true)

      if (errorDosificados) {
        console.error('Error cargando contenidos dosificados:', errorDosificados)
        return
      }

      // Obtener planeaciones que tienen contenidos relacionados
      const { data: planeaciones, error: errorPlaneaciones } = await supabase
        .from('planeaciones')
        .select(`
          id,
          contenidos_relacionados,
          estado,
          origen
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null)

      if (errorPlaneaciones) {
        console.error('Error cargando planeaciones:', errorPlaneaciones)
        return
      }

      // Calcular estadísticas
      const totalPDAs = contenidosDosificados?.length || 0
      let completados = 0
      let enProgreso = 0
      let pendientes = 0

      // Crear un mapa de contenidos con planeación
      const contenidosConPlaneacion = new Set()
      
      planeaciones?.forEach(planeacion => {
        if (planeacion.contenidos_relacionados && Array.isArray(planeacion.contenidos_relacionados)) {
          planeacion.contenidos_relacionados.forEach(contenidoId => {
            contenidosConPlaneacion.add(contenidoId)
          })
        }
      })

      // Clasificar cada contenido dosificado
      contenidosDosificados?.forEach(contenido => {
        if (contenidosConPlaneacion.has(contenido.contenido_id)) {
          // Tiene planeación = Completado
          completados++
        } else {
          // No tiene planeación pero tiene mes asignado = En Progreso
          enProgreso++
        }
      })

      // Los pendientes son los contenidos del currículo que NO están dosificados
      // Necesitamos obtener el total de contenidos del grado para calcular pendientes
      const { data: totalContenidosGrado, error: errorTotal } = await supabase
        .from('curriculo_sep')
        .select('id')
        .eq('grado', contexto.grado)

      if (errorTotal) {
        console.error('Error cargando total de contenidos:', errorTotal)
        pendientes = 0
      } else {
        const totalContenidos = totalContenidosGrado?.length || 0
        pendientes = totalContenidos - totalPDAs
      }

      const porcentajeCompletado = totalPDAs > 0 ? Math.round((completados / totalPDAs) * 100) : 0

      setEstadisticasSeguimiento({
        totalPDAs,
        completados,
        enProgreso,
        pendientes,
        porcentajeCompletado
      })

      // Calcular estadísticas por campo formativo
      const estadisticasPorCampoMap = new Map<string, {
        total: number
        completados: number
        enProgreso: number
        pendientes: number
      }>()

      // Inicializar contadores por campo
      contenidosDosificados?.forEach(contenido => {
        const campo = contenido.curriculo_sep?.campo_formativo || 'Sin campo'
        if (!estadisticasPorCampoMap.has(campo)) {
          estadisticasPorCampoMap.set(campo, { total: 0, completados: 0, enProgreso: 0, pendientes: 0 })
        }
        const stats = estadisticasPorCampoMap.get(campo)!
        stats.total++
        
        if (contenidosConPlaneacion.has(contenido.contenido_id)) {
          stats.completados++
        } else {
          stats.enProgreso++
        }
      })

      // Convertir a array y calcular porcentajes
      const estadisticasPorCampoArray = Array.from(estadisticasPorCampoMap.entries()).map(([campo, stats]) => ({
        campo,
        total: stats.total,
        completados: stats.completados,
        enProgreso: stats.enProgreso,
        pendientes: 0, // Los pendientes se calculan a nivel general, no por campo
        porcentaje: stats.total > 0 ? Math.round((stats.completados / stats.total) * 100) : 0
      })).sort((a, b) => b.porcentaje - a.porcentaje) // Ordenar por porcentaje descendente

      setEstadisticasPorCampo(estadisticasPorCampoArray)

      // Calcular estadísticas por trimestre
      const trimestres = [
        { trimestre: 1, nombre: "Trimestre 1", meses: ["AGO", "SEP", "OCT"] },
        { trimestre: 2, nombre: "Trimestre 2", meses: ["NOV", "DIC", "ENE"] },
        { trimestre: 3, nombre: "Trimestre 3", meses: ["FEB", "MAR", "ABR"] }
      ]

      // Obtener el mes actual para determinar el trimestre actual
      const mesActual = new Date().toLocaleString('es-ES', { month: 'short' }).toUpperCase()
      const trimestreActual = trimestres.find(t => t.meses.includes(mesActual))?.trimestre || 1

      const estadisticasPorTrimestreArray = trimestres.map(trimestre => {
        // Contar contenidos asignados en este trimestre
        const asignados = contenidosDosificados?.filter(contenido => 
          trimestre.meses.includes(contenido.mes)
        ).length || 0

        // Contar contenidos completados en este trimestre
        const completados = contenidosDosificados?.filter(contenido => 
          trimestre.meses.includes(contenido.mes) && 
          contenidosConPlaneacion.has(contenido.contenido_id)
        ).length || 0

        const porcentaje = asignados > 0 ? Math.round((completados / asignados) * 100) : 0

        return {
          trimestre: trimestre.trimestre,
          nombre: trimestre.nombre,
          meses: trimestre.meses,
          asignados,
          completados,
          porcentaje,
          esActual: trimestre.trimestre === trimestreActual
        }
      })

      setEstadisticasPorTrimestre(estadisticasPorTrimestreArray)

      // Calcular acciones sugeridas (PDAs pendientes del trimestre actual)
      const trimestreActualData = estadisticasPorTrimestreArray.find(t => t.esActual)
      if (trimestreActualData) {
        // Obtener PDAs del trimestre actual que no tienen planeación
        const pdasPendientesTrimestre = contenidosDosificados?.filter(contenido => 
          trimestreActualData.meses.includes(contenido.mes) && 
          !contenidosConPlaneacion.has(contenido.contenido_id)
        ).slice(0, 5) || [] // Limitar a 5 PDAs

        const accionesSugeridasArray = pdasPendientesTrimestre.map(contenido => ({
          id: contenido.contenido_id,
          pda: contenido.curriculo_sep?.pda || 'PDA sin título',
          campo_formativo: contenido.curriculo_sep?.campo_formativo || 'Sin campo',
          mes: contenido.mes,
          mes_completo: getMesCompleto(contenido.mes)
        }))

        setAccionesSugeridas(accionesSugeridasArray)
      } else {
        setAccionesSugeridas([])
      }

    } catch (error) {
      console.error('Error cargando estadísticas de seguimiento:', error)
    } finally {
      setCargandoEstadisticas(false)
    }
  }

  // Función auxiliar para convertir abreviación de mes a nombre completo
  const getMesCompleto = (mesAbrev: string): string => {
    const meses: { [key: string]: string } = {
      'ENE': 'Enero',
      'FEB': 'Febrero', 
      'MAR': 'Marzo',
      'ABR': 'Abril',
      'MAY': 'Mayo',
      'JUN': 'Junio',
      'JUL': 'Julio',
      'AGO': 'Agosto',
      'SEP': 'Septiembre',
      'OCT': 'Octubre',
      'NOV': 'Noviembre',
      'DIC': 'Diciembre'
    }
    return meses[mesAbrev] || mesAbrev
  }

  // Función para crear planeación desde acciones sugeridas
  const handleCrearPlaneacionDesdeAccion = async (contenidoId: string, pda: string, campoFormativo: string, mes: string) => {
    if (!user?.id || !contexto?.id || !onNavigateToChatDosificacion) return

    try {
      // Crear mensaje prellenado para la planeación
      const mensajePrellenado = `Necesito generar una planeación para el siguiente contenido:

**PDA:** ${pda}
**Campo Formativo:** ${campoFormativo}
**Mes:** ${getMesCompleto(mes)}
**Grado:** ${contexto.grado}°
**Ciclo Escolar:** ${contexto.ciclo_escolar}

Por favor, genera una planeación completa y detallada para este contenido, incluyendo objetivos, actividades, recursos y evaluación.`

      // Crear el objeto de contenido para el flujo de dosificación
      const contenidoSeleccionado = {
        id: contenidoId,
        pda: pda,
        campo_formativo: campoFormativo,
        mes: mes
      }

      // Navegar al módulo de Planeación desde Dosificación
      onNavigateToChatDosificacion({
        contenidos: [contenidoSeleccionado],
        contexto: contexto,
        mesActual: mes,
        message: mensajePrellenado
      })
    } catch (error) {
      console.error('Error al crear planeación desde acción sugerida:', error)
    }
  }

  // Componente para barra de progreso - más compacto
  const BarraProgreso = ({ porcentaje, label, completados, total }: { 
    porcentaje: number, 
    label: string, 
    completados: number, 
    total: number 
  }) => {
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
            {label}
          </span>
          <span className="text-xs font-bold text-gray-900 dark:text-gray-100 ml-2">
            {porcentaje}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{completados}/{total}</span>
        </div>
      </div>
    )
  }

  // Componente para el gráfico circular de progreso
  const GraficoCircularProgreso = ({ porcentaje, size = 200 }: { porcentaje: number, size?: number }) => {
    const radio = (size - 20) / 2
    const circunferencia = 2 * Math.PI * radio
    const strokeDasharray = circunferencia
    const strokeDashoffset = circunferencia - (porcentaje / 100) * circunferencia

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Círculo de fondo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radio}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Círculo de progreso */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radio}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-green-500 transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Texto en el centro */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {porcentaje}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Completado
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Manejar selección de campo formativo
  const handleSeleccionarCampo = (campo: string) => {
    if (contexto) {
      setCampoSeleccionado(campo)
      cargarContenidosPorCampo(contexto.grado, campo)
      setVistaActual("contenidos-campo")
    }
  }

  // Volver a la vista principal
  const volverVistaPrincipal = () => {
    setVistaActual("principal")
  }

  // Volver a campos formativos
  const volverACamposFormativos = () => {
    setVistaActual("campos-formativos")
  }

  // Meses del año escolar
  const mesesEscolares = ['SEP', 'OCT', 'NOV', 'DIC', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL']

  // Cargar dosificación de meses desde la base de datos
  const cargarDosificacionMeses = async () => {
    try {
      if (!user?.id || !contexto?.id || !campoSeleccionado) {
        return
      }

      
      // Primero obtener los IDs de contenidos del campo actual
      const contenidosIds = curriculoData.map(item => item.id)
      
      if (contenidosIds.length === 0) {
        setDosificacionMeses({})
        return
      }

      const { data, error } = await supabase
        .from('dosificacion_meses')
        .select('contenido_id, mes, seleccionado')
        .eq('profesor_id', user.id)
        .eq('contexto_id', contexto.id)
        .in('contenido_id', contenidosIds)

      if (error) {
        console.error('Error cargando dosificación:', error)
        return
      }

      const dosificacion: {[contenidoId: string]: {[mes: string]: boolean}} = {}
      data?.forEach(item => {
        const contenidoIdStr = item.contenido_id.toString()
        if (!dosificacion[contenidoIdStr]) {
          dosificacion[contenidoIdStr] = {}
        }
        dosificacion[contenidoIdStr][item.mes] = item.seleccionado
      })
      
      setDosificacionMeses(dosificacion)
    } catch (error) {
      console.error('Error en cargarDosificacionMeses:', error)
    }
  }

  // Cargar dosificación de meses con datos específicos
  const cargarDosificacionMesesConDatos = async (contenidos: any[]) => {
    try {
      if (!user?.id || !contexto?.id || !campoSeleccionado) {
        return
      }

      
      // Obtener los IDs de contenidos de los datos pasados
      const contenidosIds = contenidos.map(item => item.id)
      
      if (contenidosIds.length === 0) {
        setDosificacionMeses({})
        return
      }

      const { data, error } = await supabase
        .from('dosificacion_meses')
        .select('contenido_id, mes, seleccionado')
        .eq('profesor_id', user.id)
        .eq('contexto_id', contexto.id)
        .in('contenido_id', contenidosIds)

      if (error) {
        console.error('Error cargando dosificación:', error)
        return
      }

      const dosificacion: {[contenidoId: string]: {[mes: string]: boolean}} = {}
      data?.forEach(item => {
        const contenidoIdStr = item.contenido_id.toString()
        if (!dosificacion[contenidoIdStr]) {
          dosificacion[contenidoIdStr] = {}
        }
        dosificacion[contenidoIdStr][item.mes] = item.seleccionado
      })
      
      setDosificacionMeses(dosificacion)
    } catch (error) {
      console.error('Error en cargarDosificacionMesesConDatos:', error)
    }
  }

  // Manejar selección de mes para un contenido (solo un mes por contenido)
  const handleSeleccionMes = async (contenidoId: string, mes: string, seleccionado: boolean) => {
    if (!user?.id || !contexto?.id) return

    try {
      if (seleccionado) {
        // Primero eliminar todas las selecciones existentes para este contenido
        const { error: deleteError } = await supabase
          .from('dosificacion_meses')
          .delete()
          .eq('profesor_id', user.id)
          .eq('contexto_id', contexto.id)
          .eq('contenido_id', contenidoId) // Ya es UUID, no necesita parseInt

        // Solo mostrar error si realmente hay un error (no un objeto vacío)
        if (deleteError && Object.keys(deleteError).length > 0) {
          console.error('Error eliminando selecciones previas:', deleteError)
          return
        }

        // Luego agregar la nueva selección
        const { error } = await supabase
          .from('dosificacion_meses')
          .insert({
            profesor_id: user.id,
            contexto_id: contexto.id,
            contenido_id: contenidoId, // Ya es UUID, no necesita parseInt
            mes: mes,
            seleccionado: true,
            fecha_actualizacion: new Date().toISOString()
          })

        if (error) {
          console.error('Error guardando selección de mes:', error)
          return
        }

        // Actualizar estado local - limpiar todos los meses y seleccionar solo el nuevo
        setDosificacionMeses(prev => ({
          ...prev,
          [contenidoId]: {
            ...Object.fromEntries(mesesEscolares.map(m => [m, false])),
            [mes]: true
          }
        }))
      } else {
        // Remover selección de mes
        const { error } = await supabase
          .from('dosificacion_meses')
          .delete()
          .eq('profesor_id', user.id)
          .eq('contexto_id', contexto.id)
          .eq('contenido_id', contenidoId) // Ya es UUID, no necesita parseInt
          .eq('mes', mes)

        if (error) {
          console.error('Error removiendo selección de mes:', error)
          return
        }

        // Actualizar estado local
        setDosificacionMeses(prev => ({
          ...prev,
          [contenidoId]: {
            ...prev[contenidoId],
            [mes]: false
          }
        }))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Vista de campos formativos
  if (vistaActual === "campos-formativos") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={volverVistaPrincipal}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Campos Formativos - {contexto?.grado}° Grado
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Selecciona un campo formativo para ver sus contenidos
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {camposFormativos.length === 0 ? (
              <Card className="text-center py-12 col-span-full">
                <CardContent>
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No hay campos formativos
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No se encontraron campos formativos para {contexto?.grado}° grado
                  </p>
                </CardContent>
              </Card>
            ) : (
              camposFormativos.map((campo, index) => {
                const colors = [
                  { bg: 'from-blue-500 to-blue-600', border: 'border-blue-200 dark:border-blue-800', hover: 'hover:border-blue-400', text: 'group-hover:text-blue-600 dark:group-hover:text-blue-400' },
                  { bg: 'from-purple-500 to-purple-600', border: 'border-purple-200 dark:border-purple-800', hover: 'hover:border-purple-400', text: 'group-hover:text-purple-600 dark:group-hover:text-purple-400' },
                  { bg: 'from-green-500 to-green-600', border: 'border-green-200 dark:border-green-800', hover: 'hover:border-green-400', text: 'group-hover:text-green-600 dark:group-hover:text-green-400' },
                  { bg: 'from-orange-500 to-orange-600', border: 'border-orange-200 dark:border-orange-800', hover: 'hover:border-orange-400', text: 'group-hover:text-orange-600 dark:group-hover:text-orange-400' }
                ]
                const colorScheme = colors[index % colors.length]
                
                return (
                  <Card 
                    key={campo} 
                    className={`group bg-white dark:bg-gray-800 border-2 ${colorScheme.border} ${colorScheme.hover} hover:shadow-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-2 hover:scale-105`}
                    onClick={() => handleSeleccionarCampo(campo)}
                  >
                    <CardHeader className="text-center pb-4">
                      <div className={`bg-gradient-to-br ${colorScheme.bg} rounded-full p-4 w-20 h-20 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <BookOpen className="h-12 w-12 text-white mx-auto" />
                      </div>
                      <CardTitle className={`text-xl font-bold text-gray-800 dark:text-gray-100 ${colorScheme.text} transition-colors duration-300 leading-tight`}>
                        {campo}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center px-6 pb-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                        Explora los contenidos curriculares de este campo formativo
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                        <div className="w-2 h-2 bg-current rounded-full opacity-60"></div>
                        <span>Haz clic para continuar</span>
                        <div className="w-2 h-2 bg-current rounded-full opacity-60"></div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}
      </div>
    )
  }

  // Vista de contenidos de un campo específico
  if (vistaActual === "contenidos-campo") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={volverACamposFormativos}>
            ← Volver a Campos
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {campoSeleccionado} - {contexto?.grado}° Grado
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Contenidos curriculares del campo formativo seleccionado
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {curriculoData.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No hay contenidos
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No se encontraron contenidos para {campoSeleccionado}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Tabla de dosificación */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                    <thead>
                      <tr className="bg-orange-400 dark:bg-orange-600 text-white">
                        <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-medium">CONTENIDO</th>
                        <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-medium">PROCESO DE DESARROLLO Y APRENDIZAJE</th>
                        {mesesEscolares.map(mes => (
                          <th key={mes} className="border border-gray-300 dark:border-gray-600 p-2 text-center font-medium min-w-[60px]">
                            {mes}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {curriculoData.map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"}>
                          <td className="border border-gray-300 dark:border-gray-600 p-3 font-medium text-gray-900 dark:text-gray-100">
                            {item.contenido}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 p-3 text-sm text-gray-700 dark:text-gray-300">
                            {item.pda}
                          </td>
                          {mesesEscolares.map(mes => (
                            <td key={mes} className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                              <Checkbox
                                id={`${item.id}-${mes}`}
                                checked={(() => {
                                  const contenidoId = item.id.toString()
                                  const isChecked = dosificacionMeses[contenidoId]?.[mes] || false
                                  return isChecked
                                })()}
                                onCheckedChange={(checked) => handleSeleccionMes(item.id.toString(), mes, checked as boolean)}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 dark:data-[state=checked]:bg-blue-500 dark:data-[state=checked]:border-blue-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))} 
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Mostrar configuración inicial si no tiene contexto
  if (configurando) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">¡Bienvenido al Dosificador!</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Para empezar, dinos con qué grado trabajarás este año
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración Inicial
            </CardTitle>
            <CardDescription>
              Selecciona el grado y ciclo escolar con el que trabajarás
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Grado Escolar</label>
              <Select value={gradoSeleccionado} onValueChange={setGradoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el grado" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((grado) => (
                    <SelectItem key={grado} value={grado.toString()}>
                      {grado}° Grado
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ciclo Escolar</label>
              <Select value={cicloSeleccionado} onValueChange={setCicloSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el ciclo escolar" />
                </SelectTrigger>
                <SelectContent>
                  {generarCiclosEscolares().map((ciclo) => (
                    <SelectItem key={ciclo} value={ciclo}>
                      {ciclo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={guardarConfiguracion} 
              disabled={loading || !gradoSeleccionado || !cicloSeleccionado}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Configurar y Continuar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Vista de seguimiento
  if (vistaActual === "seguimiento") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setVistaActual("principal")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Seguimiento</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitorea el avance y cumplimiento de objetivos
            </p>
          </div>
        </div>

        {/* Dashboard compacto - widgets en cuadrícula 2x2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Widget 1: Resumen General del Ciclo Escolar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Resumen General del Ciclo Escolar
              </CardTitle>
              <CardDescription>
                Estado general de tu plan anual de dosificación curricular
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cargandoEstadisticas ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Gráfico circular de progreso principal - más pequeño */}
                  <div className="flex justify-center">
                    <GraficoCircularProgreso 
                      porcentaje={estadisticasSeguimiento.porcentajeCompletado} 
                      size={160}
                    />
                  </div>

                  {/* Tarjetas de estadísticas clave - más compactas */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* PDAs Completados */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 cursor-help">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-medium text-green-600 dark:text-green-400">
                                    Completados
                                  </p>
                                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    {estadisticasSeguimiento.completados}
                                  </p>
                                </div>
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </div>
                            </CardContent>
                          </Card>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">
                            <span className="font-semibold text-green-600">Completados:</span> Contenidos con planeación generada
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* PDAs en Progreso */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 cursor-help">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                    En Progreso
                                  </p>
                                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {estadisticasSeguimiento.enProgreso}
                                  </p>
                                </div>
                                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                            </CardContent>
                          </Card>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">
                            <span className="font-semibold text-blue-600">En Progreso:</span> Contenidos con mes asignado pero sin planeación
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* PDAs Pendientes */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 cursor-help">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                    Pendientes
                                  </p>
                                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                                    {estadisticasSeguimiento.pendientes}
                                  </p>
                                </div>
                                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                              </div>
                            </CardContent>
                          </Card>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">
                            <span className="font-semibold text-orange-600">Pendientes:</span> Contenidos sin mes asignado en la dosificación
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Información adicional - más compacta */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {estadisticasSeguimiento.totalPDAs} dosificados de {estadisticasSeguimiento.totalPDAs + estadisticasSeguimiento.pendientes} total • {contexto?.grado}° Grado
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Widget 2: Progreso por Campo Formativo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Progreso por Campo Formativo
              </CardTitle>
              <CardDescription>
                Radiografía del avance en cada área curricular
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cargandoEstadisticas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : estadisticasPorCampo.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No hay campos formativos dosificados
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Ve al módulo de dosificación para asignar contenidos por campo formativo
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {estadisticasPorCampo.map((campo, index) => (
                    <div key={campo.campo}>
                      <BarraProgreso
                        porcentaje={campo.porcentaje}
                        label={campo.campo}
                        completados={campo.completados}
                        total={campo.total}
                      />
                      
                      {/* Separador entre campos (excepto el último) */}
                      {index < estadisticasPorCampo.length - 1 && (
                        <div className="border-b border-gray-200 dark:border-gray-700 mt-3"></div>
                      )}
                    </div>
                  ))}
                  
                  {/* Resumen general - más compacto */}
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Promedio
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {estadisticasPorCampo.length > 0 
                          ? Math.round(estadisticasPorCampo.reduce((acc, campo) => acc + campo.porcentaje, 0) / estadisticasPorCampo.length)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Segunda fila de widgets */}
        <div className="grid gap-6 lg:grid-cols-2 mt-6">
          {/* Widget 3: Carga de Trabajo por Trimestre */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Carga de Trabajo por Trimestre
              </CardTitle>
              <CardDescription>
                Distribución y progreso del año escolar por periodos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cargandoEstadisticas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {estadisticasPorTrimestre.map((trimestre) => (
                    <div 
                      key={trimestre.trimestre}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        trimestre.esActual 
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' 
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`font-semibold text-sm ${
                          trimestre.esActual 
                            ? 'text-indigo-700 dark:text-indigo-300' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {trimestre.nombre}
                        </h3>
                        {trimestre.esActual && (
                          <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                            Actual
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">PDAs asignados:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {trimestre.asignados}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Completados:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {trimestre.completados}
                            {trimestre.asignados === trimestre.completados && trimestre.asignados > 0 && (
                              <CheckCircle className="inline ml-1 h-3 w-3 text-green-600" />
                            )}
                          </span>
                        </div>
                        
                        {trimestre.asignados > 0 && (
                          <div className="pt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600 dark:text-gray-400">Progreso:</span>
                              <span className={`font-medium ${
                                trimestre.porcentaje === 100 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : trimestre.esActual 
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {trimestre.porcentaje}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                                  trimestre.porcentaje === 100 
                                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                                    : trimestre.esActual 
                                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                                      : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                }`}
                                style={{ width: `${trimestre.porcentaje}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Widget 4: Acciones Sugeridas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                Acciones Sugeridas
              </CardTitle>
              <CardDescription>
                Próximos PDAs a cubrir en este trimestre
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cargandoEstadisticas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : accionesSugeridas.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    ¡Excelente trabajo!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No hay PDAs pendientes en el trimestre actual
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accionesSugeridas.map((accion, index) => (
                    <div key={accion.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {accion.pda}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {accion.campo_formativo}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {accion.mes_completo}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCrearPlaneacionDesdeAccion(
                            accion.id, 
                            accion.pda, 
                            accion.campo_formativo, 
                            accion.mes
                          )}
                          className="flex-shrink-0"
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          Crear Planeación
                        </Button>
                      </div>
                      
                      {/* Separador entre acciones (excepto la última) */}
                      {index < accionesSugeridas.length - 1 && (
                        <div className="border-b border-gray-200 dark:border-gray-700 mt-3"></div>
                      )}
                    </div>
                  ))}
                  
                  {/* Información adicional */}
                  <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-orange-600" />
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        <span className="font-medium">Tip:</span> Haz clic en "Crear Planeación" para generar automáticamente una planeación para cada PDA pendiente.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Mostrar loading mientras carga el contexto
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dosificación</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona la dosificación curricular y distribución de contenidos
          </p>
          {contexto && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                {getGradoTexto(contexto.grado)} - {contexto.ciclo_escolar}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Estado inicial - módulo vacío */}
      <div className="relative overflow-hidden">
        <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-0 shadow-xl">
          <CardContent className="text-center py-16 px-8">
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
              Gestiona tu dosificación curricular de manera inteligente. Organiza contenidos, 
              distribuye por periodos y realiza seguimiento del progreso académico.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <Card 
                className="group bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 hover:shadow-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1"
                onClick={handleDistribucionTemporal}
              >
                <CardHeader className="pb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="h-10 w-10 text-white mx-auto" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Distribución Temporal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Organiza contenidos por trimestres de forma inteligente
                  </p>
                  <div className="mt-4">
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300">
                      Disponible
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="group bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="h-10 w-10 text-white mx-auto" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Contenidos Curriculares
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Define temas, subtemas y actividades por periodo
                  </p>
                  <div className="mt-4">
                    <Badge variant="outline" className="text-purple-600 border-purple-300 dark:text-purple-400 dark:border-purple-600">
                      Próximamente
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="group bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-green-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                onClick={handleIrSeguimiento}
              >
                <CardHeader className="pb-4">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-10 w-10 text-white mx-auto" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    Seguimiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Monitorea el avance y cumplimiento de objetivos
                  </p>
                  <div className="mt-4">
                    <Badge variant="outline" className="text-green-600 border-green-300 dark:text-green-400 dark:border-green-600">
                      Disponible
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
