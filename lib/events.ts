import { supabase } from './supabase'

export interface Event {
  id?: string
  user_id?: string
  title: string
  description: string
  category: 'reunion' | 'entrega' | 'evento-escolar' | 'personal'
  event_date: string
  event_time?: string
  hashtags?: string[]
  linked_planeacion_id?: string
  linked_examen_id?: string
  planeacion_title?: string
  examen_title?: string
  created_at?: string
  updated_at?: string
}

export interface EventFormData {
  title: string
  category: string
  date: string
  time: string
  description: string
  linked_planeacion_id?: string
  linked_examen_id?: string
}

// Función para extraer hashtags del texto
export function extractHashtags(text: string): string[] {
  if (!text) return []
  
  const hashtagRegex = /#[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9_]+/g
  const matches = text.match(hashtagRegex)
  
  if (!matches) return []
  
  // Remover el símbolo # y convertir a minúsculas, eliminar duplicados
  return [...new Set(matches.map(tag => tag.substring(1).toLowerCase()))]
}

// Función para guardar un evento
export async function saveEvent(eventData: EventFormData): Promise<{ success: boolean; error?: string; event?: Event }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    // Extraer hashtags de la descripción
    const hashtags = extractHashtags(eventData.description)

    // Preparar datos del evento
    const event: Omit<Event, 'id' | 'created_at' | 'updated_at'> = {
      user_id: user.id,
      title: eventData.title,
      description: eventData.description,
      category: eventData.category as Event['category'],
      event_date: eventData.date,
      event_time: eventData.time || undefined,
      hashtags,
      linked_planeacion_id: eventData.linked_planeacion_id || undefined,
      linked_examen_id: eventData.linked_examen_id || undefined
    }

    const { data, error } = await supabase
      .from('events')
      .insert([event])
      .select()
      .single()

    if (error) {
      console.error('Error al guardar evento:', error)
      return { success: false, error: error.message }
    }

    return { success: true, event: data }
  } catch (error) {
    console.error('Error inesperado al guardar evento:', error)
    return { success: false, error: 'Error inesperado al guardar el evento' }
  }
}

// Función para obtener eventos del usuario
export async function getUserEvents(): Promise<{ success: boolean; events?: Event[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        planeaciones:linked_planeacion_id(titulo),
        examenes:linked_examen_id(title)
      `)
      .eq('user_id', user.id)
      .order('event_date', { ascending: true })

    console.log('📋 Respuesta de Supabase:', { data, error })
    console.log('📊 Número de eventos encontrados:', data?.length || 0)

    if (error) {
      console.error('❌ Error al obtener eventos:', error)
      return { success: false, error: error.message }
    }

    // Procesar los datos para incluir los títulos
    const processedEvents = data?.map(event => ({
      ...event,
      planeacion_title: event.planeaciones?.titulo || null,
      examen_title: event.examenes?.title || null,
      // Remover las propiedades anidadas
      planeaciones: undefined,
      examenes: undefined
    })) || []

    console.log('✅ Eventos procesados exitosamente:', processedEvents)
    return { success: true, events: processedEvents }
  } catch (error) {
    console.error('💥 Error inesperado al obtener eventos:', error)
    return { success: false, error: 'Error inesperado al obtener eventos' }
  }
}

// Función para obtener eventos por rango de fechas
export async function getEventsByDateRange(startDate: string, endDate: string): Promise<{ success: boolean; events?: Event[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true })

    if (error) {
      console.error('Error al obtener eventos por rango:', error)
      return { success: false, error: error.message }
    }

    return { success: true, events: data || [] }
  } catch (error) {
    console.error('Error inesperado al obtener eventos por rango:', error)
    return { success: false, error: 'Error inesperado al obtener eventos' }
  }
}

// Función para buscar eventos por hashtags
export async function searchEventsByHashtags(hashtags: string[]): Promise<{ success: boolean; events?: Event[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    // Convertir hashtags a minúsculas
    const searchHashtags = hashtags.map(tag => tag.toLowerCase())

    const { data, error } = await supabase
      .rpc('search_events_by_hashtags', {
        user_uuid: user.id,
        search_hashtags: searchHashtags
      })

    if (error) {
      console.error('Error al buscar eventos por hashtags:', error)
      return { success: false, error: error.message }
    }

    return { success: true, events: data || [] }
  } catch (error) {
    console.error('Error inesperado al buscar eventos por hashtags:', error)
    return { success: false, error: 'Error inesperado al buscar eventos' }
  }
}

// Función para obtener todos los hashtags del usuario
export async function getUserHashtags(): Promise<{ success: boolean; hashtags?: Array<{ hashtag: string; count: number }>; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    const { data, error } = await supabase
      .rpc('get_user_hashtags', {
        user_uuid: user.id
      })

    if (error) {
      console.error('Error al obtener hashtags del usuario:', error)
      return { success: false, error: error.message }
    }

    return { success: true, hashtags: data || [] }
  } catch (error) {
    console.error('Error inesperado al obtener hashtags:', error)
    return { success: false, error: 'Error inesperado al obtener hashtags' }
  }
}

// Función para actualizar un evento
export async function updateEvent(eventId: string, eventData: Partial<EventFormData>): Promise<{ success: boolean; error?: string; event?: Event }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    // Preparar datos de actualización
    const updateData: Partial<Event> = {}
    
    if (eventData.title !== undefined) updateData.title = eventData.title
    if (eventData.category !== undefined) updateData.category = eventData.category as Event['category']
    if (eventData.date !== undefined) updateData.event_date = eventData.date
    if (eventData.time !== undefined) updateData.event_time = eventData.time || undefined
    if (eventData.description !== undefined) {
      updateData.description = eventData.description
      updateData.hashtags = extractHashtags(eventData.description)
    }
    if (eventData.linked_planeacion_id !== undefined) updateData.linked_planeacion_id = eventData.linked_planeacion_id || undefined
    if (eventData.linked_examen_id !== undefined) updateData.linked_examen_id = eventData.linked_examen_id || undefined

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar evento:', error)
      return { success: false, error: error.message }
    }

    return { success: true, event: data }
  } catch (error) {
    console.error('Error inesperado al actualizar evento:', error)
    return { success: false, error: 'Error inesperado al actualizar el evento' }
  }
}

// Función para eliminar un evento
export async function deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error al eliminar evento:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error inesperado al eliminar evento:', error)
    return { success: false, error: 'Error inesperado al eliminar el evento' }
  }
}

// Función para convertir eventos a formato FullCalendar
export function eventsToFullCalendarFormat(events: Event[]) {
  return events.map(event => {
    const categoryColors = getCategoryColors(event.category)
    
    // Si el evento tiene hora específica, crear un evento con tiempo
    if (event.event_time) {
      return {
        id: event.id,
        title: event.title,
        start: `${event.event_date}T${event.event_time}`, // Combinar fecha y hora
        allDay: false, // No es evento de día completo
        extendedProps: {
          description: event.description,
          category: event.category,
          hashtags: event.hashtags || [],
          originalTime: event.event_time,
          linked_planeacion_id: event.linked_planeacion_id,
          linked_examen_id: event.linked_examen_id,
          planeacion_title: event.planeacion_title,
          examen_title: event.examen_title
        },
        backgroundColor: categoryColors.background,
        borderColor: categoryColors.border,
        textColor: 'white',
        display: 'block'
      }
    } else {
      // Si no tiene hora, mantener como evento de día completo
      return {
        id: event.id,
        title: event.title,
        start: event.event_date,
        allDay: true,
        extendedProps: {
          description: event.description,
          category: event.category,
          hashtags: event.hashtags || [],
          originalTime: event.event_time,
          linked_planeacion_id: event.linked_planeacion_id,
          linked_examen_id: event.linked_examen_id,
          planeacion_title: event.planeacion_title,
          examen_title: event.examen_title
        },
        backgroundColor: categoryColors.background,
        borderColor: categoryColors.border,
        textColor: 'white',
        display: 'block'
      }
    }
  })
}

// Interfaces para planeaciones y exámenes disponibles
export interface AvailablePlaneacion {
  id: string
  titulo: string
  materia: string
  grado: string
  grupo: string
  fecha_inicio: string
  fecha_fin: string
}

export interface AvailableExamen {
  id: string
  titulo: string
  materia: string
  grado: string
  grupo: string
  fecha_examen: string
  duracion_minutos: number
}

// Función para obtener planeaciones disponibles para enlazar
export async function getAvailablePlaneaciones(): Promise<{ success: boolean; planeaciones?: AvailablePlaneacion[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    const { data, error } = await supabase
      .rpc('get_available_planeaciones_for_events', {
        user_uuid: user.id
      })

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error al obtener planeaciones:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        full_error: error
      })
      return { success: false, error: error.message || 'Error desconocido al obtener planeaciones' }
    }

    return { success: true, planeaciones: data || [] }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error inesperado al obtener planeaciones:', error)
    return { success: false, error: 'Error inesperado al obtener planeaciones' }
  }
}

// Función para obtener exámenes disponibles para enlazar
export async function getAvailableExamenes(): Promise<{ success: boolean; examenes?: AvailableExamen[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    const { data, error } = await supabase
      .rpc('get_available_examenes_for_events', {
        user_uuid: user.id
      })

    if (error) {
      console.error('Error al obtener exámenes:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        full_error: error
      })
      return { success: false, error: error.message || 'Error desconocido al obtener exámenes' }
    }

    return { success: true, examenes: data || [] }
  } catch (error) {
    console.error('Error inesperado al obtener exámenes:', error)
    return { success: false, error: 'Error inesperado al obtener exámenes' }
  }
}

// Función para obtener eventos con información de enlaces
export async function getEventsWithLinks(): Promise<{ success: boolean; events?: Event[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    const { data, error } = await supabase
      .rpc('get_events_with_links', {
        user_uuid: user.id
      })

    if (error) {
      console.error('Error al obtener eventos con enlaces:', error)
      return { success: false, error: error.message }
    }

    return { success: true, events: data || [] }
  } catch (error) {
    console.error('Error inesperado al obtener eventos con enlaces:', error)
    return { success: false, error: 'Error inesperado al obtener eventos' }
  }
}

// Función auxiliar para obtener colores por categoría
function getCategoryColors(category: Event['category']): { background: string; border: string } {
  const colors = {
    'reunion': {
      background: '#2563eb',    // blue-600 - más vibrante
      border: '#1d4ed8'         // blue-700 - borde más oscuro
    },
    'entrega': {
      background: '#dc2626',    // red-600 - más vibrante
      border: '#b91c1c'         // red-700 - borde más oscuro
    },
    'evento-escolar': {
      background: '#16a34a',    // green-600 - más vibrante
      border: '#15803d'         // green-700 - borde más oscuro
    },
    'personal': {
      background: '#9333ea',    // purple-600 - más vibrante
      border: '#7c3aed'         // purple-700 - borde más oscuro
    }
  }
  return colors[category] || {
    background: '#6b7280',    // gray-500 como fallback
    border: '#4b5563'         // gray-600 como fallback
  }
}

// Función auxiliar para obtener colores por categoría (mantener compatibilidad)
function getCategoryColor(category: Event['category']): string {
  return getCategoryColors(category).background
}