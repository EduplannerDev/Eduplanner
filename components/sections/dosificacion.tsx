"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Calendar, BookOpen, Target, Loader2, Settings, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"

interface DosificacionProps {
  onCreateNew?: () => void
}

interface ContextoTrabajo {
  id: string
  grado: number
  ciclo_escolar: string
  fecha_inicio: string
  notas?: string
}

export function Dosificacion({ onCreateNew }: DosificacionProps) {
  const [loading, setLoading] = useState(false)
  const [contexto, setContexto] = useState<ContextoTrabajo | null>(null)
  const [configurando, setConfigurando] = useState(false)
  const [gradoSeleccionado, setGradoSeleccionado] = useState<string>("")
  const [cicloSeleccionado, setCicloSeleccionado] = useState<string>("")
  const [vistaActual, setVistaActual] = useState<"principal" | "campos-formativos" | "contenidos-campo">("principal")
  const [curriculoData, setCurriculoData] = useState<any[]>([])
  const [camposFormativos, setCamposFormativos] = useState<string[]>([])
  const [campoSeleccionado, setCampoSeleccionado] = useState<string>("")
  const { user } = useAuth()

  // Cargar contexto de trabajo al montar el componente
  useEffect(() => {
    if (user?.id) {
      cargarContextoTrabajo()
    }
  }, [user?.id])

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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              camposFormativos.map((campo) => (
                <Card 
                  key={campo} 
                  className="hover:shadow-md transition-shadow cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  onClick={() => handleSeleccionarCampo(campo)}
                >
                  <CardHeader className="text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <CardTitle className="text-lg dark:text-gray-100">
                      {campo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Haz clic para ver los contenidos de este campo formativo
                    </p>
                  </CardContent>
                </Card>
              ))
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
              curriculoData.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg dark:text-gray-100">
                          {item.campo_formativo}
                        </CardTitle>
                        <CardDescription className="mt-2 dark:text-gray-300">
                          {item.contenido}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="dark:text-gray-100 dark:border-gray-700">
                        {item.grado}° Grado
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Proceso de Desarrollo de Aprendizaje (PDA):
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.pda}
                        </p>
                      </div>
                      {item.ejes_articuladores && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Ejes Articuladores:
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.ejes_articuladores}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
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
                {contexto.grado}° Grado - {contexto.ciclo_escolar}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Estado inicial - módulo vacío */}
      <Card className="text-center py-12">
        <CardContent>
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Módulo de Dosificación
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Este módulo está en desarrollo. Aquí podrás gestionar la dosificación curricular,
            distribuir contenidos por periodo y realizar seguimiento del progreso académico.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
            <Card 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer transition-all duration-200"
              onClick={handleDistribucionTemporal}
            >
              <CardHeader className="pb-3">
                <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Distribución Temporal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Organiza contenidos por trimestres
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
              <CardHeader className="pb-3">
                <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contenidos Curriculares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Define temas, subtemas y actividades por periodo
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
              <CardHeader className="pb-3">
                <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Seguimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Monitorea el avance y cumplimiento de objetivos
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8">
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              Próximamente disponible
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sección de funcionalidades futuras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Características Planificadas
            </CardTitle>
            <CardDescription>
              Funcionalidades que estarán disponibles en este módulo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Creación de dosificaciones por materia y grado
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Distribución automática de contenidos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Vinculación con planeaciones didácticas
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Reportes de avance curricular
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Exportación en múltiples formatos
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Beneficios del Módulo
            </CardTitle>
            <CardDescription>
              Ventajas de usar la dosificación curricular
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Mejor organización del año escolar
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Cumplimiento de programas oficiales
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Seguimiento del progreso académico
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Planificación anticipada de recursos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Evaluación continua del avance
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
