"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Plus, Edit, Trash2, Users, BookOpen, User, Briefcase, Hash, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotification } from "@/hooks/use-notification"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import { saveEvent, getUserEvents, getEventsWithLinks, extractHashtags, eventsToFullCalendarFormat, updateEvent, deleteEvent, Event, EventFormData, getAvailablePlaneaciones, getAvailableExamenes, AvailablePlaneacion, AvailableExamen } from '@/lib/events'
import { supabase } from '@/lib/supabase'

interface AgendaProps {
  onSectionChange?: (section: string) => void
}

export function Agenda({ onSectionChange }: AgendaProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [eventData, setEventData] = useState<EventFormData>({
    title: '',
    category: '',
    date: '',
    time: '',
    description: '',
    linked_planeacion_id: '',
    linked_examen_id: ''
  })
  const [displayDate, setDisplayDate] = useState('')
  const [availablePlaneaciones, setAvailablePlaneaciones] = useState<AvailablePlaneacion[]>([])
  const [availableExamenes, setAvailableExamenes] = useState<AvailableExamen[]>([])
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [planeacionSearch, setPlaneacionSearch] = useState('')
  const [examenSearch, setExamenSearch] = useState('')
  const [showPlaneacionSuggestions, setShowPlaneacionSuggestions] = useState(false)
  const [showExamenSuggestions, setShowExamenSuggestions] = useState(false)
  const [generatingSchoolEvents, setGeneratingSchoolEvents] = useState(false)
  const [hasSchoolEvents, setHasSchoolEvents] = useState(false)
  const { success, error } = useNotification()

  // Funciones para manejar formato de fecha mexicano
  const formatDateToMexican = (isoDate: string): string => {
    if (!isoDate) return ''
    const [year, month, day] = isoDate.split('-')
    return `${day}/${month}/${year}`
  }

  const formatDateToISO = (mexicanDate: string): string => {
    if (!mexicanDate) return ''
    const [day, month, year] = mexicanDate.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const categories = [
    { id: 'reunion', name: 'Reunión', color: 'bg-blue-500', icon: Users },
    { id: 'entrega', name: 'Entrega', color: 'bg-red-500', icon: Briefcase },
    { id: 'evento-escolar', name: 'Evento Escolar', color: 'bg-green-500', icon: BookOpen },
    { id: 'personal', name: 'Personal', color: 'bg-purple-500', icon: User }
  ]

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setEventData(prev => ({ ...prev, category: categoryId }))
  }

  // Cargar eventos al montar el componente
  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const result = await getUserEvents()
      if (result.success && result.events) {
        setEvents(result.events)
        
        // Verificar si ya existen eventos del calendario escolar basándose en títulos
        const schoolEvents = result.events.filter(event => 
          event.title.includes('Consejo Técnico Escolar') ||
          event.title.includes('Suspensión de Labores') ||
          event.title.includes('Suspensión de labores') ||
          event.title.includes('Inicio del Ciclo Escolar') ||
          event.title.includes('Fin del Ciclo Escolar') ||
          event.title.includes('Vacaciones') ||
          event.title.includes('Evaluación')
        )
        setHasSchoolEvents(schoolEvents.length > 0)
      } else {
        console.error('❌ Error al cargar eventos:', result.error)
      }
    } catch (error) {
      console.error('💥 Error al cargar eventos:', error)
    } finally {
      setLoading(false)

    }
  }

  // Función para cargar planeaciones y exámenes disponibles
  const loadAvailableLinks = async () => {
    setLoadingLinks(true)
    try {
      const [planeacionesResult, examenesResult] = await Promise.all([
        getAvailablePlaneaciones(),
        getAvailableExamenes()
      ])

      if (planeacionesResult.success && planeacionesResult.planeaciones) {
        setAvailablePlaneaciones(planeacionesResult.planeaciones)
      }

      if (examenesResult.success && examenesResult.examenes) {
        setAvailableExamenes(examenesResult.examenes)
      }
    } catch (error) {
      console.error('Error al cargar enlaces disponibles:', error)
    } finally {
      setLoadingLinks(false)
    }
  }

  // Función para manejar cambios en los enlaces
  const handleLinkChange = (type: 'planeacion' | 'examen', value: string) => {
    if (type === 'planeacion') {
      setEventData(prev => ({ 
        ...prev, 
        linked_planeacion_id: value,
        linked_examen_id: value ? '' : prev.linked_examen_id // Limpiar examen si se selecciona planeación
      }))
    } else {
      setEventData(prev => ({ 
        ...prev, 
        linked_examen_id: value,
        linked_planeacion_id: value ? '' : prev.linked_planeacion_id // Limpiar planeación si se selecciona examen
      }))
    }
  }

  // Función para manejar la búsqueda de planeaciones
  const handlePlaneacionSearch = (searchValue: string) => {
    setPlaneacionSearch(searchValue)
    setShowPlaneacionSuggestions(searchValue.length > 0)
    
    // Si se borra el texto, limpiar la selección
    if (searchValue === '') {
      setEventData(prev => ({ ...prev, linked_planeacion_id: '' }))
    }
  }

  // Función para seleccionar una planeación
  const selectPlaneacion = (planeacion: AvailablePlaneacion) => {
    setPlaneacionSearch(`${planeacion.titulo} - ${planeacion.materia} (${planeacion.grado} ${planeacion.grupo})`)
    setEventData(prev => ({ 
      ...prev, 
      linked_planeacion_id: planeacion.id,
      linked_examen_id: '' // Limpiar examen
    }))
    setShowPlaneacionSuggestions(false)
    setExamenSearch('') // Limpiar búsqueda de examen
  }

  // Función para manejar la búsqueda de exámenes
  const handleExamenSearch = (searchValue: string) => {
    setExamenSearch(searchValue)
    setShowExamenSuggestions(searchValue.length > 0)
    
    // Si se borra el texto, limpiar la selección
    if (searchValue === '') {
      setEventData(prev => ({ ...prev, linked_examen_id: '' }))
    }
  }

  // Función para seleccionar un examen
  const selectExamen = (examen: AvailableExamen) => {
    setExamenSearch(`${examen.titulo} - ${examen.materia} (${examen.grado} ${examen.grupo})`)
    setEventData(prev => ({ 
      ...prev, 
      linked_examen_id: examen.id,
      linked_planeacion_id: '' // Limpiar planeación
    }))
    setShowExamenSuggestions(false)
    setPlaneacionSearch('') // Limpiar búsqueda de planeación
  }

  // Filtrar planeaciones basado en la búsqueda
  const filteredPlaneaciones = availablePlaneaciones.filter(planeacion =>
    planeacion.titulo.toLowerCase().includes(planeacionSearch.toLowerCase()) ||
    planeacion.materia.toLowerCase().includes(planeacionSearch.toLowerCase())
  )

  // Filtrar exámenes basado en la búsqueda
  const filteredExamenes = availableExamenes.filter(examen =>
    examen.titulo.toLowerCase().includes(examenSearch.toLowerCase()) ||
    examen.materia.toLowerCase().includes(examenSearch.toLowerCase())
  )

  const handleSaveEvent = async () => {
    if (!eventData.title || !eventData.category || !eventData.date) {
      error("Por favor completa todos los campos obligatorios")
      return
    }

    setSaving(true)
    try {
      let result: { success: boolean; event?: Event; error?: string }
      
      if (isEditing && editingEvent) {
        // Actualizar evento existente
        result = await updateEvent(editingEvent.id!, eventData)
        
        if (result.success && result.event) {
          // Actualizar el evento en la lista
          setEvents(prev => prev.map(event => 
            event.id === editingEvent.id ? result.event! : event
          ))
          
          success("El evento se ha actualizado correctamente")
        }
      } else {
        // Crear nuevo evento
        result = await saveEvent(eventData)
        
        if (result.success && result.event) {
          // Agregar el nuevo evento a la lista
          setEvents(prev => [...prev, result.event!])
          
          success("El evento se ha guardado correctamente en tu agenda")
        }
      }
      
      if (result.success) {
        // Cerrar modal y resetear formulario
        setIsModalOpen(false)
        resetForm()
      } else {
        error(result.error || "No se pudo guardar el evento")
      }
    } catch (error) {
      console.error('Error al guardar evento:', error)
      error("Ocurrió un error inesperado al guardar el evento")
    } finally {
      setSaving(false)
    }
  }

  // Función para resetear el formulario
  const resetForm = () => {
    // Usar la fecha seleccionada o la fecha de hoy como predeterminada
    const today = new Date()
    const todayStr = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0')
    
    const defaultDate = selectedDate || todayStr
    
    setEventData({ title: '', category: '', date: defaultDate, time: '', description: '', linked_planeacion_id: '', linked_examen_id: '' })
    setDisplayDate(formatDateToMexican(defaultDate))
    setSelectedCategory('')
    setEditingEvent(null)
    setIsEditing(false)
    setPlaneacionSearch('')
    setExamenSearch('')
    setShowPlaneacionSuggestions(false)
    setShowExamenSuggestions(false)
  }

  // Función para generar eventos SEP
  const handleGenerateSchoolEvents = async () => {
    setGeneratingSchoolEvents(true)
    try {
      // Obtener el token de sesión de Supabase
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        toast({
          title: "Error de autenticación",
          description: "No se pudo obtener el token de sesión. Por favor, inicia sesión nuevamente.",
          variant: "destructive"
        })
        return
      }
      
      const response = await fetch('/api/generate-school-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()

      if (result.success) {
        // Recargar eventos para mostrar los nuevos
        await loadEvents()
        
        // Marcar que ya se tienen eventos del calendario escolar
        setHasSchoolEvents(true)
        
        success(`Se han agregado ${result.eventsCount} eventos del calendario escolar SEP 2025-2026`)
      } else {
        error(result.error || "No se pudieron generar los eventos SEP")
      }
    } catch (error) {
      console.error('Error al generar eventos SEP:', error)
      error("Ocurrió un error al generar los eventos SEP")
    } finally {
      setGeneratingSchoolEvents(false)
    }
  }

  // Función para abrir modal de edición
  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setIsEditing(true)
    setEventData({
      title: event.title,
      category: event.category,
      date: event.event_date,
      time: event.event_time || '',
      description: event.description || '',
      linked_planeacion_id: event.linked_planeacion_id || '',
      linked_examen_id: event.linked_examen_id || ''
    })
    setDisplayDate(formatDateToMexican(event.event_date))
    setSelectedCategory(event.category)
    
    // Limpiar primero los campos de búsqueda
    setPlaneacionSearch('')
    setExamenSearch('')
    setShowPlaneacionSuggestions(false)
    setShowExamenSuggestions(false)
    
    // Cargar textos de búsqueda si hay enlaces
    if (event.linked_planeacion_id) {
      const planeacion = availablePlaneaciones.find(p => p.id === event.linked_planeacion_id)
      if (planeacion) {
        setPlaneacionSearch(`${planeacion.titulo} - ${planeacion.materia} (${planeacion.grado} ${planeacion.grupo})`)
      }
    }
    if (event.linked_examen_id) {
      const examen = availableExamenes.find(e => e.id === event.linked_examen_id)
      if (examen) {
        setExamenSearch(`${examen.titulo} - ${examen.materia} (${examen.grado} ${examen.grupo})`)
      }
    }
    
    loadAvailableLinks()
    setIsModalOpen(true)
  }

  // Función para eliminar evento
  const handleDeleteEvent = async (eventId: string) => {
    try {
      const result = await deleteEvent(eventId)
      
      if (result.success) {
        // Remover el evento de la lista
        setEvents(prev => prev.filter(event => event.id !== eventId))
        
        success("El evento se ha eliminado correctamente")
      } else {
        error(result.error || "Error al eliminar el evento")
      }
    } catch (error) {
      console.error('Error al eliminar evento:', error)
      error("Ocurrió un error inesperado al eliminar el evento")
    }
  }

  // Extraer hashtags de la descripción para mostrarlos en tiempo real
  const currentHashtags = extractHashtags(eventData.description)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Agenda</h1>
        <p className="text-muted-foreground">
          Organiza y gestiona tus actividades, eventos y recordatorios
        </p>
      </div>

      {/* Modal de Nuevo Evento */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open)
        if (!open) {
          resetForm()
        }
      }}>
        <DialogTrigger asChild>
          <Button className="hidden">
            Hidden Trigger
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Evento' : 'Crear Nuevo Evento'}</DialogTitle>
              <DialogDescription>
                {isEditing ? 'Modifica la información del evento.' : 'Completa la información del evento que deseas agregar a tu agenda.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Título del Evento */}
              <div className="space-y-2">
                <Label htmlFor="title">Título del Evento</Label>
                <Input
                  id="title"
                  placeholder="Ingresa el título del evento"
                  value={eventData.title}
                  onChange={(e) => setEventData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Categoría */}
              <div className="space-y-3">
                <Label>Categoría</Label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((category) => {
                    const IconComponent = category.icon
                    return (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        className={`h-12 justify-start gap-3 ${
                          selectedCategory === category.id 
                            ? `${category.color} text-white hover:${category.color}/90` 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleCategorySelect(category.id)}
                      >
                        <div className={`w-3 h-3 rounded-full ${
                          selectedCategory === category.id ? 'bg-white' : category.color
                        }`} />
                        <IconComponent className="h-4 w-4" />
                        {category.name}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha (DD/MM/AAAA)</Label>
                  <Input
                    id="date"
                    type="text"
                    placeholder="DD/MM/AAAA"
                    value={displayDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '') // Solo números
                      
                      // Formatear automáticamente con barras
                      if (value.length >= 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2)
                      }
                      if (value.length >= 5) {
                        value = value.substring(0, 5) + '/' + value.substring(5, 9)
                      }
                      
                      setDisplayDate(value)
                      
                      // Si tiene formato completo, validar y convertir a ISO
                      if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                        const [day, month, year] = value.split('/')
                        const dayNum = parseInt(day)
                        const monthNum = parseInt(month)
                        const yearNum = parseInt(year)
                        
                        // Validación básica de fecha
                        if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900) {
                          const isoDate = formatDateToISO(value)
                          setEventData(prev => ({ ...prev, date: isoDate }))
                        } else {
                          setEventData(prev => ({ ...prev, date: '' }))
                        }
                      } else {
                        // Si está incompleto, limpiar la fecha ISO
                        setEventData(prev => ({ ...prev, date: '' }))
                      }
                    }}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    type="time"
                    value={eventData.time}
                    onChange={(e) => setEventData(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>

              {/* Enlaces a Planeaciones y Exámenes */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Enlaces Opcionales</Label>
                <div className="grid grid-cols-1 gap-4">
                  {/* Buscador de Planeación */}
                  <div className="space-y-2 relative">
                    <Label htmlFor="planeacion">Enlazar Planeación</Label>
                    
                    {/* Mostrar planeación enlazada como badge */}
                    {eventData.linked_planeacion_id && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <div 
                          className="flex-1 text-sm cursor-pointer hover:bg-blue-100 rounded p-1 transition-colors"
                          onClick={() => {
                            if (onSectionChange) {
                              onSectionChange('mis-planeaciones')
                            }
                          }}
                          title="Ir a Mis Planeaciones"
                        >
                          <div className="font-medium text-blue-900">
                            {availablePlaneaciones.find(p => p.id === eventData.linked_planeacion_id)?.titulo || 'Planeación enlazada'}
                          </div>
                          <div className="text-blue-700 text-xs">
                            {availablePlaneaciones.find(p => p.id === eventData.linked_planeacion_id)?.materia} - {availablePlaneaciones.find(p => p.id === eventData.linked_planeacion_id)?.grado} {availablePlaneaciones.find(p => p.id === eventData.linked_planeacion_id)?.grupo}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEventData(prev => ({ ...prev, linked_planeacion_id: '' }))
                            setPlaneacionSearch('')
                          }}
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Input de búsqueda solo si no hay planeación enlazada */}
                    {!eventData.linked_planeacion_id && (
                      <>
                        <Input
                          id="planeacion"
                          placeholder="Buscar planeación por título o materia..."
                          value={planeacionSearch}
                          onChange={(e) => handlePlaneacionSearch(e.target.value)}
                          disabled={loadingLinks || !!eventData.linked_examen_id}
                          onFocus={() => setShowPlaneacionSuggestions(planeacionSearch.length > 0)}
                          onBlur={() => setTimeout(() => setShowPlaneacionSuggestions(false), 200)}
                        />
                        {showPlaneacionSuggestions && filteredPlaneaciones.length > 0 && (
                          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {filteredPlaneaciones.slice(0, 5).map((planeacion) => (
                              <div
                                key={planeacion.id}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                onClick={() => selectPlaneacion(planeacion)}
                              >
                                <div className="font-medium">{planeacion.titulo}</div>
                                <div className="text-gray-600">{planeacion.materia} - {planeacion.grado} {planeacion.grupo}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    
                    {!!eventData.linked_examen_id && (
                      <p className="text-xs text-muted-foreground">No se puede enlazar una planeación si ya hay un examen enlazado</p>
                    )}
                  </div>

                  {/* Buscador de Examen */}
                  <div className="space-y-2 relative">
                    <Label htmlFor="examen">Enlazar Examen</Label>
                    
                    {/* Mostrar examen enlazado como badge */}
                    {eventData.linked_examen_id && (
                      <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-md">
                        <Users className="h-4 w-4 text-purple-600" />
                        <div 
                          className="flex-1 text-sm cursor-pointer hover:bg-purple-100 rounded p-1 transition-colors"
                          onClick={() => {
                            if (onSectionChange) {
                              onSectionChange('examenes')
                            }
                          }}
                          title="Ir a Mis Exámenes"
                        >
                          <div className="font-medium text-purple-900">
                            {availableExamenes.find(e => e.id === eventData.linked_examen_id)?.titulo || 'Examen enlazado'}
                          </div>
                          <div className="text-purple-700 text-xs">
                            {availableExamenes.find(e => e.id === eventData.linked_examen_id)?.materia} - {availableExamenes.find(e => e.id === eventData.linked_examen_id)?.grado} {availableExamenes.find(e => e.id === eventData.linked_examen_id)?.grupo}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEventData(prev => ({ ...prev, linked_examen_id: '' }))
                            setExamenSearch('')
                          }}
                          className="h-6 w-6 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Input de búsqueda solo si no hay examen enlazado */}
                    {!eventData.linked_examen_id && (
                      <>
                        <Input
                          id="examen"
                          placeholder="Buscar examen por título o materia..."
                          value={examenSearch}
                          onChange={(e) => handleExamenSearch(e.target.value)}
                          disabled={loadingLinks || !!eventData.linked_planeacion_id}
                          onFocus={() => setShowExamenSuggestions(examenSearch.length > 0)}
                          onBlur={() => setTimeout(() => setShowExamenSuggestions(false), 200)}
                        />
                        {showExamenSuggestions && filteredExamenes.length > 0 && (
                          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {filteredExamenes.slice(0, 5).map((examen) => (
                              <div
                                key={examen.id}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                onClick={() => selectExamen(examen)}
                              >
                                <div className="font-medium">{examen.titulo}</div>
                                <div className="text-gray-600">{examen.materia} - {examen.grado} {examen.grupo}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    
                    {!!eventData.linked_planeacion_id && (
                      <p className="text-xs text-muted-foreground">No se puede enlazar un examen si ya hay una planeación enlazada</p>
                    )}
                  </div>
                </div>
                {loadingLinks && (
                  <p className="text-sm text-muted-foreground">Cargando opciones de enlace...</p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción / Notas</Label>
                <Textarea
                  id="description"
                  placeholder="Describe los detalles del evento. Puedes usar hashtags como #Urgente #Calificaciones"
                  className="min-h-[100px]"
                  value={eventData.description}
                  onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
                />
                {currentHashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Hash className="h-3 w-3" />
                      Hashtags detectados:
                    </div>
                    {currentHashtags.map((hashtag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{hashtag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsModalOpen(false)
                  resetForm()
                }}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveEvent}
                  disabled={!eventData.title || !eventData.category || !eventData.date || saving}
                >
                  {saving ? (isEditing ? 'Actualizando...' : 'Guardando...') : (isEditing ? 'Actualizar Evento' : 'Guardar Evento')}
                </Button>
              </div>
            </div>
          </DialogContent>
      </Dialog>

      {/* Vista principal con FullCalendar */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Calendario principal */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Calendario
                  </CardTitle>
                  <CardDescription>
                    Gestiona tus eventos y actividades
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {loading ? (
                    <Skeleton className="h-10 w-40" />
                  ) : (
                    !hasSchoolEvents && (
                      <Button 
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={handleGenerateSchoolEvents}
                        disabled={generatingSchoolEvents}
                      >
                        <BookOpen className="h-4 w-4" />
                        {generatingSchoolEvents ? 'Generando...' : 'Generar Eventos SEP'}
                      </Button>
                    )
                  )}
                  <Button 
                    className="flex items-center gap-2"
                    onClick={() => {
                      resetForm()
                      loadAvailableLinks()
                      setIsModalOpen(true)
                    }}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4" />
                    Nuevo Evento
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="fullcalendar-container border rounded-lg p-4">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  buttonText={{
                    today: 'Hoy',
                    month: 'Mes',
                    week: 'Semana',
                    day: 'Día',
                    list: 'Lista'
                  }}
                  height="auto"
                  locale={esLocale}
                  timeZone="local"
                  displayEventTime={true}
                  displayEventEnd={false}
                  firstDay={1}
                  weekends={true}
                  editable={true}
                  selectable={true}
                  selectMirror={true}
                  dayMaxEvents={true}
                  events={eventsToFullCalendarFormat(events)}
                  eventDisplay="block"
                  eventTextColor="white"
                  eventContent={(eventInfo) => {
                    const event = eventInfo.event
                    const linkedPlaneacion = event.extendedProps.linked_planeacion_id
                    const linkedExamen = event.extendedProps.linked_examen_id
                    
                    return (
                      <div className="p-1">
                        <div className="font-medium text-xs truncate">{event.title}</div>
                        {event.start && (
                          <div className="text-xs opacity-75">
                            {event.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        {linkedPlaneacion && (
                          <div className="text-xs opacity-90 flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            <span className="truncate">Planeación</span>
                          </div>
                        )}
                        {linkedExamen && (
                          <div className="text-xs opacity-90 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span className="truncate">Examen</span>
                          </div>
                        )}
                      </div>
                    )
                  }}
                  // Configuraciones adicionales para vistas de tiempo
                  slotMinTime="06:00:00"
                  slotMaxTime="22:00:00"
                  slotDuration="01:00:00"
                  allDaySlot={true}
                  allDayText="Todo el día"
                  dateClick={(dateInfo) => {
                    // Al hacer clic en un día, actualizar la fecha seleccionada
                    const clickedDate = dateInfo.dateStr
                    const today = new Date()
                    const todayStr = today.getFullYear() + '-' + 
                      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(today.getDate()).padStart(2, '0')
                    
                    // Si se hace clic en el día actual, resetear a null para mostrar "Hoy"
                    if (clickedDate === todayStr) {
                      setSelectedDate(null)
                    } else {
                      setSelectedDate(clickedDate)
                    }
                  }}
                  eventClick={(clickInfo) => {
                    // Abrir modal de edición del evento clickeado
                    const eventId = clickInfo.event.id
                    const foundEvent = events.find(e => e.id === eventId)
                    
                    if (foundEvent) {
                      handleEditEvent(foundEvent)
                    }
                  }}
                  eventMouseEnter={(mouseEnterInfo) => {
                    // Crear tooltip al hacer hover
                    const event = mouseEnterInfo.event
                    const hashtags = event.extendedProps.hashtags || []
                    const originalTime = event.extendedProps.originalTime as string | undefined
                    const description = event.extendedProps.description || 'Sin descripción'
                    const planeacionTitle = event.extendedProps.planeacion_title
                    const examenTitle = event.extendedProps.examen_title
                    
                    // Crear elemento tooltip
                    const tooltip = document.createElement('div')
                    tooltip.id = 'event-tooltip'
                    tooltip.className = 'absolute z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-xs text-sm'
                    tooltip.style.pointerEvents = 'none'
                    
                    tooltip.innerHTML = `
                      <div class="font-semibold mb-1">${event.title}</div>
                      <div class="text-gray-300 mb-1">${description}</div>
                      ${originalTime ? `<div class="text-blue-300 text-xs mb-1">🕒 ${originalTime}</div>` : ''}
                      ${planeacionTitle ? `<div class="text-yellow-300 text-xs mb-1">📚 Planeación: ${planeacionTitle}</div>` : ''}
                      ${examenTitle ? `<div class="text-purple-300 text-xs mb-1">📝 Examen: ${examenTitle}</div>` : ''}
                      ${hashtags.length > 0 ? `<div class="text-green-300 text-xs">${hashtags.map((h: string) => '#' + h).join(' ')}</div>` : ''}
                    `
                    
                    document.body.appendChild(tooltip)
                    
                    // Posicionar tooltip
                    const updateTooltipPosition = (e: MouseEvent) => {
                      tooltip.style.left = (e.clientX + 10) + 'px'
                      tooltip.style.top = (e.clientY - 10) + 'px'
                    }
                    
                    // Posición inicial
                    const rect = mouseEnterInfo.el.getBoundingClientRect()
                    tooltip.style.left = (rect.right + 10) + 'px'
                    tooltip.style.top = rect.top + 'px'
                    
                    // Seguir el mouse
                    document.addEventListener('mousemove', updateTooltipPosition)
                    
                    // Guardar referencia para limpieza
                    mouseEnterInfo.el.setAttribute('data-tooltip-id', 'event-tooltip')
                  }}
                  eventMouseLeave={(mouseLeaveInfo) => {
                    // Remover tooltip al salir del hover
                    const tooltip = document.getElementById('event-tooltip')
                    if (tooltip) {
                      tooltip.remove()
                    }
                    
                    // Remover event listener
                    document.removeEventListener('mousemove', () => {})
                  }}
                />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral con información */}
        <div className="space-y-4">
          {/* Card de hoy */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-4 w-4" />
                  {selectedDate ? 'Día Seleccionado' : 'Hoy'}
                </CardTitle>

              </div>
              <CardDescription>
                {selectedDate 
                  ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: 'numeric',
                      month: 'long'
                    })
                  : new Date().toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: 'numeric',
                      month: 'long'
                    })
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {(() => {
                  const today = new Date()
                  // Usar la fecha local en lugar de UTC para evitar problemas de zona horaria
                  const todayStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0')
                  
                  // Usar la fecha seleccionada o la fecha de hoy
                  const targetDate = selectedDate || todayStr
                  
                  const dayEvents = events.filter(event => {
      return event.event_date === targetDate
    })
                  
                  if (dayEvents.length === 0) {
                    return (
                      <div className="text-sm text-muted-foreground">
                        {selectedDate ? 'No hay eventos programados para este día' : 'No hay eventos programados para hoy'}
                      </div>
                    )
                  }
                  
                  return dayEvents.map(event => {
                    const category = categories.find(cat => cat.id === event.category)
                    const IconComponent = category?.icon || Calendar
                    
                    return (
                      <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className={`w-3 h-3 rounded-full mt-1 ${category?.color || 'bg-gray-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{event.title}</p>
                          {event.event_time && (
                            <p className="text-xs text-muted-foreground">
                              {event.event_time}
                            </p>
                          )}
                          {event.hashtags && event.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {event.hashtags.slice(0, 3).map((hashtag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs px-1 py-0">
                                  #{hashtag}
                                </Badge>
                              ))}
                              {event.hashtags.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{event.hashtags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteEvent(event.id!)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
                })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de próximos eventos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-4 w-4" />
                Próximos Eventos
              </CardTitle>
              <CardDescription>
                Próximos 7 días
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {(() => {
                  const today = new Date()
                  // Usar la fecha local en lugar de UTC para evitar problemas de zona horaria
                  const todayStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0')
                  const nextWeek = new Date(today)
                  nextWeek.setDate(today.getDate() + 7)
                  const nextWeekStr = nextWeek.getFullYear() + '-' + 
                    String(nextWeek.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(nextWeek.getDate()).padStart(2, '0')
                  
                  const upcomingEvents = events.filter(event => {
                    const isAfterToday = event.event_date > todayStr
                    const isBeforeNextWeek = event.event_date <= nextWeekStr
                    return isAfterToday && isBeforeNextWeek
                  }).sort((a, b) => a.event_date.localeCompare(b.event_date)).slice(0, 5) // Mostrar máximo 5 eventos ordenados por fecha
                  
                  if (upcomingEvents.length === 0) {
                    return (
                      <div className="text-sm text-muted-foreground">
                        No hay eventos próximos
                      </div>
                    )
                  }
                  
                  return upcomingEvents.map(event => {
                    const category = categories.find(cat => cat.id === event.category)
                    const eventDate = new Date(event.event_date + 'T00:00:00')
                    const daysDiff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    
                    return (
                      <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className={`w-3 h-3 rounded-full mt-1 ${category?.color || 'bg-gray-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {daysDiff === 1 ? 'Mañana' : `En ${daysDiff} días`}
                            {event.event_time && ` • ${event.event_time}`}
                          </p>
                          {event.hashtags && event.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {event.hashtags.slice(0, 2).map((hashtag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs px-1 py-0">
                                  #{hashtag}
                                </Badge>
                              ))}
                              {event.hashtags.length > 2 && (
                                <span className="text-xs text-muted-foreground">+{event.hashtags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                  })()} 
                </div>
              )}
            </CardContent>
          </Card>


        </div>
      </div>


    </div>
  )
}