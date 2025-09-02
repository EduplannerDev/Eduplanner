import { createClient } from '@supabase/supabase-js'
import * as ical from 'ical'
import fs from 'fs'
import path from 'path'

// Función para crear el cliente de Supabase cuando sea necesario
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables de entorno de Supabase no encontradas');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey)
}

export interface SchoolEvent {
  title: string
  description?: string
  startDate: Date
  endDate?: Date
  category: 'evento-escolar' | 'reunion' | 'entrega' | 'personal'
  isAllDay: boolean
}

/**
 * Parsea un archivo ICS y extrae los eventos
 */
export function parseICSFile(filePath: string): SchoolEvent[] {
  try {
    const icsContent = fs.readFileSync(filePath, 'utf8')
    const parsedData = ical.parseICS(icsContent)
    const events: SchoolEvent[] = []

    for (const key in parsedData) {
      const event = parsedData[key]
      
      if (event.type === 'VEVENT' && event.start && event.summary) {
        // Extraer el texto del summary correctamente
        let summaryText = ''
        if (typeof event.summary === 'string') {
          summaryText = event.summary
        } else if (event.summary && typeof event.summary === 'object') {
          const summaryObj = event.summary as any
          if ('val' in summaryObj) {
            summaryText = String(summaryObj.val)
          } else if ('value' in summaryObj) {
            summaryText = String(summaryObj.value)
          } else {
            summaryText = String(event.summary)
          }
        } else {
          summaryText = String(event.summary)
        }
        
        // Determinar categoría basada en el título del evento
        let category: 'evento-escolar' | 'reunion' | 'entrega' | 'personal' = 'evento-escolar'
        const title = summaryText.toLowerCase()
        
        if (title.includes('consejo') || title.includes('reunión') || title.includes('junta')) {
          category = 'reunion'
        } else if (title.includes('entrega') || title.includes('evaluación') || title.includes('examen')) {
          category = 'entrega'
        }

        const schoolEvent: SchoolEvent = {
          title: summaryText,
          description: event.description ? String(event.description) : '',
          startDate: new Date(event.start),
          endDate: event.end ? new Date(event.end) : undefined,
          category,
          isAllDay: !event.start.getHours && !event.start.getMinutes // Si no tiene hora específica, es todo el día
        }

        events.push(schoolEvent)
      }
    }

    return events
  } catch (error) {
    console.error('Error parsing ICS file:', error)
    throw new Error(`Failed to parse ICS file: ${error}`)
  }
}

/**
 * Obtiene todos los usuarios activos del sistema
 */
export async function getAllActiveUsers(): Promise<string[]> {
  try {
    const supabase = getSupabaseClient()
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('activo', true)

    if (error) {
      console.error('Error fetching users:', error)
      throw error
    }

    return users?.map(user => user.id) || []
  } catch (error) {
    console.error('Error getting active users:', error)
    throw error
  }
}

/**
 * Inserta eventos del calendario escolar para un usuario específico
 */
export async function insertSchoolEventsForUser(userId: string, events: SchoolEvent[]): Promise<void> {
  try {
    const eventsToInsert = events.map(event => ({
      user_id: userId,
      title: event.title,
      description: event.description || '',
      category: event.category,
      event_date: event.startDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
      event_time: event.isAllDay ? null : event.startDate.toTimeString().split(' ')[0], // Formato HH:MM:SS
      hashtags: ['#calendario-escolar'], // Tag para identificar eventos del calendario escolar
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('events')
      .insert(eventsToInsert)

    if (error) {
      console.error(`Error inserting events for user ${userId}:`, error)
      throw error
    }

    console.log(`Successfully inserted ${eventsToInsert.length} events for user ${userId}`)
  } catch (error) {
    console.error(`Failed to insert events for user ${userId}:`, error)
    throw error
  }
}

/**
 * Elimina eventos del calendario escolar existentes para evitar duplicados
 */
export async function removeExistingSchoolEvents(): Promise<void> {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('events')
      .delete()
      .overlaps('hashtags', ['#calendario-escolar'])

    if (error) {
      console.error('Error removing existing school events:', error)
      throw error
    }

    console.log('Successfully removed existing school calendar events')
  } catch (error) {
    console.error('Failed to remove existing school events:', error)
    throw error
  }
}

/**
 * Función principal para importar el calendario escolar para todos los usuarios
 */
export async function importSchoolCalendarForAllUsers(icsFilePath: string): Promise<void> {
  try {
    console.log('Starting school calendar import process...')
    
    // 1. Parsear el archivo ICS
    console.log('Parsing ICS file...')
    const events = parseICSFile(icsFilePath)
    console.log(`Found ${events.length} events in ICS file`)

    // 2. Obtener todos los usuarios activos
    console.log('Fetching active users...')
    const userIds = await getAllActiveUsers()
    console.log(`Found ${userIds.length} active users`)

    // 3. Eliminar eventos del calendario escolar existentes
    console.log('Removing existing school calendar events...')
    await removeExistingSchoolEvents()

    // 4. Insertar eventos para cada usuario
    console.log('Inserting events for all users...')
    const insertPromises = userIds.map(userId => 
      insertSchoolEventsForUser(userId, events)
    )

    await Promise.all(insertPromises)

    console.log(`Successfully imported school calendar for ${userIds.length} users with ${events.length} events each`)
  } catch (error) {
    console.error('School calendar import failed:', error)
    throw error
  }
}

/**
 * Función para agregar eventos del calendario escolar a un nuevo usuario
 */
export async function addSchoolCalendarToNewUser(userId: string, icsFilePath: string): Promise<void> {
  try {
    console.log(`Adding school calendar to new user: ${userId}`)
    
    // Parsear el archivo ICS
    const events = parseICSFile(icsFilePath)
    
    // Insertar eventos para el nuevo usuario
    await insertSchoolEventsForUser(userId, events)
    
    console.log(`Successfully added school calendar to user ${userId}`)
  } catch (error) {
    console.error(`Failed to add school calendar to user ${userId}:`, error)
    throw error
  }
}