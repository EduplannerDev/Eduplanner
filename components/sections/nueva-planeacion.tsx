"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Plus, BookOpen, Clock, Calendar, Crown, AlertTriangle, ArrowLeft, Check, Loader2, ChevronLeft, ChevronRight, Calculator } from "lucide-react"
import { usePlaneaciones } from "@/hooks/use-planeaciones"
import { useProfile } from "@/hooks/use-profile"
import { isUserPro } from "@/lib/subscription-utils"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { getGradoTexto } from "@/lib/grado-utils"

interface NuevaPlaneacionProps {
  onCreateClass: () => void
  onNavigateToChatWithMessage: (message: string) => void
  onNavigateToChatDosificacion: (data: {
    contenidos: any[]
    contexto: any
    mesActual: string
    message: string
  }) => void
  onNavigateToCime: () => void
}

interface ContextoTrabajo {
  id: string
  grado: number
  ciclo_escolar: string
  fecha_inicio: string
  notas?: string
}

interface ContenidoDosificado {
  contenido_id: string
  grado: number
  campo_formativo: string
  contenido: string
  pda: string
  ejes_articuladores: string
  mes: string
}

export function NuevaPlaneacion({ onCreateClass, onNavigateToChatWithMessage, onNavigateToChatDosificacion, onNavigateToCime }: NuevaPlaneacionProps) {
  const { monthlyCount, getRemainingPlaneaciones, canCreateMore, loading: planeacionesLoading } = usePlaneaciones()
  const { profile, loading: profileLoading } = useProfile()
  const { user } = useAuth()
  const isPro = profile ? isUserPro(profile) : false
  const remainingPlaneaciones = getRemainingPlaneaciones()

  // Función para convertir abreviaciones de meses a nombres completos
  const getMesCompleto = (mesAbreviado: string) => {
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
    return meses[mesAbreviado] || mesAbreviado
  }
  const hasReachedLimit = !planeacionesLoading && !profileLoading && !isPro && monthlyCount >= 3
  const [vistaActual, setVistaActual] = useState<"principal" | "dosificacion">("principal")

  // Estados para la funcionalidad de dosificación
  const [contexto, setContexto] = useState<ContextoTrabajo | null>(null)
  const [contenidosMesActual, setContenidosMesActual] = useState<ContenidoDosificado[]>([])
  const [contenidosSeleccionados, setContenidosSeleccionados] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [mesActual, setMesActual] = useState<string>("")
  const [campoFormativoFiltro, setCampoFormativoFiltro] = useState<string>("Todos")
  const [paginaActual, setPaginaActual] = useState(1)
  const [tamañoPagina] = useState(10)

  // Función para obtener el mes actual
  const obtenerMesActual = () => {
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
    const mesActual = new Date().getMonth()
    return meses[mesActual]
  }

  // Función para obtener campos formativos únicos
  const obtenerCamposFormativos = () => {
    const campos = new Set(contenidosMesActual.map(c => c.campo_formativo))
    return Array.from(campos).sort()
  }

  // Función para filtrar contenidos por campo formativo
  const obtenerContenidosFiltrados = () => {
    if (campoFormativoFiltro === "Todos") {
      return contenidosMesActual
    }
    return contenidosMesActual.filter(c => c.campo_formativo === campoFormativoFiltro)
  }

  // Función para obtener contenidos paginados
  const obtenerContenidosPaginados = () => {
    const contenidosFiltrados = obtenerContenidosFiltrados()
    const inicio = (paginaActual - 1) * tamañoPagina
    const fin = inicio + tamañoPagina
    return contenidosFiltrados.slice(inicio, fin)
  }

  // Función para obtener el total de páginas
  const obtenerTotalPaginas = () => {
    const contenidosFiltrados = obtenerContenidosFiltrados()
    return Math.ceil(contenidosFiltrados.length / tamañoPagina)
  }

  // Función para cambiar de página
  const cambiarPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina)
  }

  // Resetear página cuando cambie el filtro
  const handleCambiarFiltro = (nuevoFiltro: string) => {
    setCampoFormativoFiltro(nuevoFiltro)
    setPaginaActual(1) // Resetear a la primera página
  }

  // Cargar contexto de trabajo
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
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar contenidos del mes actual sin planeaciones
  const cargarContenidosMesActual = async () => {
    if (!user?.id || !contexto?.id) return

    try {
      setLoading(true)
      const mes = obtenerMesActual()
      setMesActual(mes)

      // Usar la función que excluye contenidos con planeaciones
      const { data, error } = await supabase
        .rpc('get_contenidos_mes_actual_sin_planeacion', {
          profesor_id_param: user.id,
          contexto_id_param: contexto.id,
          mes_actual_param: mes
        })

      if (error) {
        console.error('Error cargando contenidos del mes actual:', error)
        // Fallback a consulta directa si la función no existe aún
        await cargarContenidosMesActualFallback(mes)
        return
      }

      setContenidosMesActual(data || [])
    } catch (error) {
      console.error('Error:', error)
      // Fallback a consulta directa si hay error
      const mes = obtenerMesActual()
      await cargarContenidosMesActualFallback(mes)
    } finally {
      setLoading(false)
    }
  }

  // Función fallback para cargar contenidos (sin filtro de planeaciones)
  const cargarContenidosMesActualFallback = async (mes: string) => {
    if (!user?.id || !contexto?.id) return

    try {
      const { data, error } = await supabase
        .from('dosificacion_meses')
        .select(`
          contenido_id,
          mes,
          curriculo_sep!inner(
            id,
            grado,
            campo_formativo,
            contenido,
            pda,
            ejes_articuladores
          )
        `)
        .eq('profesor_id', user.id)
        .eq('contexto_id', contexto.id)
        .eq('mes', mes)
        .eq('seleccionado', true)

      if (error) {
        console.error('Error en fallback:', error)
        return
      }

      const contenidos = data?.map(item => ({
        contenido_id: item.contenido_id,
        grado: item.curriculo_sep.grado,
        campo_formativo: item.curriculo_sep.campo_formativo,
        contenido: item.curriculo_sep.contenido,
        pda: item.curriculo_sep.pda,
        ejes_articuladores: item.curriculo_sep.ejes_articuladores,
        mes: item.mes
      })) || []

      setContenidosMesActual(contenidos)
    } catch (error) {
      console.error('Error en fallback:', error)
    }
  }

  // Función para manejar el clic en planeación desde dosificación
  const handlePlaneacionDesdeDosificacion = async () => {
    setVistaActual("dosificacion")
    await cargarContextoTrabajo()
  }

  // Función para volver a la vista principal
  const volverVistaPrincipal = () => {
    setVistaActual("principal")
    setContenidosSeleccionados(new Set())
  }

  // Cargar contenidos cuando cambie el contexto
  useEffect(() => {
    if (contexto) {
      cargarContenidosMesActual()
    }
  }, [contexto])

  // Manejar selección de contenidos
  const handleSeleccionarContenido = (contenidoId: string) => {
    setContenidosSeleccionados(prev => {
      const nuevo = new Set(prev)
      if (nuevo.has(contenidoId)) {
        nuevo.delete(contenidoId)
      } else {
        nuevo.add(contenidoId)
      }
      return nuevo
    })
  }

  // Generar planeación con contenidos seleccionados
  const generarPlaneacion = async () => {
    if (contenidosSeleccionados.size === 0) {
      alert('Por favor selecciona al menos un contenido para generar la planeación')
      return
    }

    // Obtener los contenidos seleccionados
    const contenidosSeleccionadosData = contenidosMesActual.filter(contenido =>
      contenidosSeleccionados.has(contenido.contenido_id)
    )

    // Crear el mensaje prellenado con la información de los contenidos
    const mensajePrellenado = crearMensajePrellenado(contenidosSeleccionadosData)

    // Navegar al chat específico de dosificación con todos los datos
    onNavigateToChatDosificacion({
      contenidos: contenidosSeleccionadosData,
      contexto: contexto,
      mesActual: mesActual,
      message: mensajePrellenado
    })
  }

  // Función para crear el mensaje prellenado basado en los contenidos seleccionados
  const crearMensajePrellenado = (contenidos: ContenidoDosificado[]) => {
    if (contenidos.length === 0) return ""

    const primerContenido = contenidos[0]
    const camposFormativos = [...new Set(contenidos.map(c => c.campo_formativo))]

    let mensaje = `Necesito una planeación didáctica para ${contexto ? getGradoTexto(contexto.grado) : 'el grado especificado'}. `

    if (camposFormativos.length === 1) {
      mensaje += `La materia es ${camposFormativos[0]}. `
    } else {
      mensaje += `Las materias son: ${camposFormativos.join(', ')}. `
    }

    mensaje += `Los contenidos específicos que debo desarrollar son:\n\n`

    contenidos.forEach((contenido, index) => {
      mensaje += `${index + 1}. **${contenido.contenido}**\n`
      mensaje += `   - PDA: ${contenido.pda}\n`
      if (contenido.ejes_articuladores) {
        mensaje += `   - Ejes articuladores: ${contenido.ejes_articuladores}\n`
      }
      mensaje += `\n`
    })

    mensaje += `Por favor, crea una planeación didáctica completa que integre estos contenidos de manera coherente y siguiendo los lineamientos del Nuevo Marco Curricular Mexicano. La duración estimada es de 50 minutos.`

    return mensaje
  }

  const planTypes = [
    {
      id: "individual",
      title: "Planeación Individual",
      description: "Diseña una planeación específica con objetivos y actividades",
      icon: Clock,
      color: "text-green-600",
      enabled: !hasReachedLimit,
      comingSoon: false,
      requiresPro: false,
    },
    {
      id: "dosificacion",
      title: "Planeación desde Dosificación",
      description: "Crea planeaciones basadas en tu dosificación curricular mensual",
      icon: Calendar,
      color: "text-orange-600",
      enabled: isPro,
      comingSoon: false,
      requiresPro: true,
    },
    {
      id: "cime",
      title: "Planeación CIME",
      description: "Asistente especializado para Matemáticas con material concreto",
      icon: Calculator,
      color: "text-blue-600",
      enabled: isPro,
      comingSoon: false,
      requiresPro: true,
    },
  ]


  // Vista de Planeación desde Dosificación
  if (vistaActual === "dosificacion") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={volverVistaPrincipal}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Planeación desde Dosificación
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Selecciona los contenidos del mes actual para generar tu planeación
            </p>
            {contexto && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  {getGradoTexto(contexto.grado)} - {contexto.ciclo_escolar}
                </Badge>
                {mesActual && (
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    Mes: {getMesCompleto(mesActual)}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filtros por campo formativo */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Filtrar por Campo Formativo
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={campoFormativoFiltro === "Todos" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCambiarFiltro("Todos")}
                        className={campoFormativoFiltro === "Todos" ? "bg-orange-600 hover:bg-orange-700" : ""}
                      >
                        Todos
                      </Button>
                      {obtenerCamposFormativos().map((campo) => (
                        <Button
                          key={campo}
                          variant={campoFormativoFiltro === campo ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleCambiarFiltro(campo)}
                          className={campoFormativoFiltro === campo ? "bg-orange-600 hover:bg-orange-700" : ""}
                        >
                          {campo}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Botón para generar planeación */}
                  {contenidosSeleccionados.size > 0 && (
                    <div className="flex justify-end">
                      <Button
                        onClick={generarPlaneacion}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Generar Planeación ({contenidosSeleccionados.size} seleccionados)
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lista de contenidos */}
            {contenidosMesActual.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No hay contenidos dosificados
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No se encontraron contenidos dosificados para el mes de {mesActual}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Ve al módulo de dosificación para asignar contenidos a este mes
                  </p>
                </CardContent>
              </Card>
            ) : obtenerContenidosFiltrados().length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No hay contenidos en este campo formativo
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No se encontraron contenidos para el campo formativo "{campoFormativoFiltro}"
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Prueba seleccionando otro campo formativo o "Todos"
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {obtenerContenidosPaginados().map((contenido) => {
                    const isSelected = contenidosSeleccionados.has(contenido.contenido_id)

                    return (
                      <Card
                        key={contenido.contenido_id}
                        className={`cursor-pointer transition-all duration-200 ${isSelected
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                            : 'hover:border-orange-300 hover:shadow-md'
                          }`}
                        onClick={() => handleSeleccionarContenido(contenido.contenido_id)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mt-1 ${isSelected
                                ? 'bg-orange-500 border-orange-500'
                                : 'border-gray-300'
                              }`}>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {contenido.campo_formativo}
                                </Badge>
                              </div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                {contenido.contenido}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <strong>PDA:</strong> {contenido.pda}
                              </p>
                              {contenido.ejes_articuladores && (
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  <strong>Ejes articuladores:</strong> {contenido.ejes_articuladores}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Información de paginación y controles */}
                {obtenerTotalPaginas() > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Mostrando {((paginaActual - 1) * tamañoPagina) + 1} - {Math.min(paginaActual * tamañoPagina, obtenerContenidosFiltrados().length)} de {obtenerContenidosFiltrados().length} contenidos
                    </div>

                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => cambiarPagina(paginaActual - 1)}
                            className={paginaActual === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>

                        {Array.from({ length: obtenerTotalPaginas() }, (_, i) => i + 1).map((pagina) => (
                          <PaginationItem key={pagina}>
                            <PaginationLink
                              onClick={() => cambiarPagina(pagina)}
                              isActive={pagina === paginaActual}
                              className="cursor-pointer"
                            >
                              {pagina}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => cambiarPagina(paginaActual + 1)}
                            className={paginaActual === obtenerTotalPaginas() ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Mostrar loader mientras se cargan los datos
  if (planeacionesLoading || profileLoading) {
    return (
      <TooltipProvider>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Nueva Planeación</h1>
            <p className="text-gray-600 mt-2">Crea una nueva planeación didáctica para tus clases de primaria</p>
          </div>

          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-gray-600 dark:text-gray-400">Cargando...</span>
            </div>
          </div>
        </div>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Nueva Planeación</h1>
          <p className="text-gray-600 mt-2">Crea una nueva planeación didáctica para tus clases de primaria</p>

          {hasReachedLimit && (
            <Card className="mt-4 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                      Límite mensual de planeaciones alcanzado
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Has creado {monthlyCount} de 3 planeaciones permitidas este mes con tu plan gratuito.
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                        <Crown className="w-4 h-4 mr-2" />
                        Actualizar a PRO
                      </Button>
                      <span className="text-xs text-orange-600 dark:text-orange-400">
                        Obtén planeaciones ilimitadas
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {planTypes.map((planType) => {
            const IconComponent = planType.icon

            if (planType.enabled) {
              // Tarjeta habilitada
              const handleClick = planType.id === "dosificacion"
                ? handlePlaneacionDesdeDosificacion
                : planType.id === "cime"
                  ? onNavigateToCime
                  : onCreateClass

              return (
                <Card
                  key={planType.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-200"
                  onClick={handleClick}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <IconComponent className={`h-5 w-5 ${planType.color}`} />
                      <CardTitle className="text-lg">{planType.title}</CardTitle>
                    </div>
                    <CardDescription>{planType.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={handleClick}>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear {planType.title}
                    </Button>
                  </CardContent>
                </Card>
              )
            } else {
              // Tarjeta deshabilitada con tooltip
              const isLimitReached = planType.id === "individual" && hasReachedLimit
              const requiresPro = planType.requiresPro && !isPro

              return (
                <Tooltip key={planType.id}>
                  <TooltipTrigger asChild>
                    <Card className="opacity-60 cursor-not-allowed border-dashed border-2 border-gray-300">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`h-5 w-5 text-gray-400`} />
                          <CardTitle className="text-lg text-gray-500">{planType.title}</CardTitle>
                          {isLimitReached && (
                            <Badge variant="destructive" className="ml-auto">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Límite alcanzado
                            </Badge>
                          )}
                          {requiresPro && (
                            <Badge variant="secondary" className="ml-auto bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700">
                              <Crown className="w-3 h-3 mr-1" />
                              PRO
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-gray-400">{planType.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full" variant="outline" disabled>
                          <Plus className="mr-2 h-4 w-4" />
                          Crear {planType.title}
                        </Button>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isLimitReached ? (
                      <div className="space-y-2">
                        <p className="font-medium flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          Límite mensual alcanzado
                        </p>
                        <p className="text-sm">Has creado {monthlyCount}/3 planeaciones este mes</p>
                        <p className="text-sm flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Actualiza a PRO para crear ilimitadas
                        </p>
                      </div>
                    ) : requiresPro ? (
                      <div className="space-y-2">
                        <p className="font-medium flex items-center gap-1">
                          <Crown className="w-4 h-4 text-purple-600" />
                          Función exclusiva PRO
                        </p>
                        <p className="text-sm">Esta función está disponible solo para usuarios PRO</p>
                        <p className="text-sm text-purple-600 font-medium">
                          Actualiza tu plan para acceder a todas las funciones
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">🚀 Próximamente</p>
                        <p className="text-sm">Esta función estará disponible pronto</p>
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              )
            }
          })}
        </div>



      </div>
    </TooltipProvider>
  )
}
