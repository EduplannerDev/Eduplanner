import { supabase } from './supabase'

export interface DiaryEntry {
  id: string
  user_id: string
  title: string
  content: string
  date: string
  time: string
  tags: string[]
  mood?: string
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface DiaryPassword {
  id: string
  user_id: string
  password_hash: string
  created_at: string
  updated_at: string
}

export interface DiaryEntryVersion {
  id: string
  entry_id: string
  user_id: string
  version_number: number
  title: string
  content: string
  date: string
  time: string
  tags: string[]
  mood?: string
  is_private: boolean
  created_at: string
  version_created_at: string
}

// Función para verificar si el usuario tiene una contraseña configurada
export async function checkDiaryPasswordExists(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('diary_passwords')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return !!data
  } catch (error) {
    console.error('Error checking diary password:', error)
    return false
  }
}

// Función para crear una nueva contraseña del diario
export async function createDiaryPassword(password: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    // En un entorno real, deberías hashear la contraseña
    // Por ahora, la guardamos como texto plano (NO RECOMENDADO EN PRODUCCIÓN)
    const passwordHash = btoa(password) // Base64 encoding básico

    const { error } = await supabase
      .from('diary_passwords')
      .insert({
        user_id: user.id,
        password_hash: passwordHash
      })

    if (error) throw error
  } catch (error) {
    console.error('Error creating diary password:', error)
    throw error
  }
}

// Función para verificar la contraseña del diario
export async function verifyDiaryPassword(password: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('diary_passwords')
      .select('password_hash')
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    // Verificar la contraseña (decodificar base64)
    const storedPassword = atob(data.password_hash)
    return storedPassword === password
  } catch (error) {
    console.error('Error verifying diary password:', error)
    return false
  }
}

// Función para obtener todas las entradas del diario del usuario
export async function getDiaryEntries(): Promise<DiaryEntry[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error getting diary entries:', error)
    throw error
  }
}

// Función para crear una nueva entrada del diario
export async function createDiaryEntry(entry: Omit<DiaryEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<DiaryEntry> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('diary_entries')
      .insert({
        user_id: user.id,
        title: entry.title,
        content: entry.content,
        date: entry.date,
        time: entry.time,
        tags: entry.tags,
        mood: entry.mood,
        is_private: entry.is_private
      })
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error creating diary entry:', error)
    throw error
  }
}

// Función para actualizar una entrada del diario
export async function updateDiaryEntry(id: string, updates: Partial<Omit<DiaryEntry, 'id' | 'user_id' | 'created_at'>>): Promise<DiaryEntry> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('diary_entries')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error updating diary entry:', error)
    throw error
  }
}

// Función para eliminar una entrada del diario
export async function deleteDiaryEntry(id: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { error } = await supabase
      .from('diary_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting diary entry:', error)
    throw error
  }
}

// Función para buscar entradas por texto
export async function searchDiaryEntries(query: string): Promise<DiaryEntry[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error searching diary entries:', error)
    throw error
  }
}

// Función para obtener entradas por etiqueta
export async function getDiaryEntriesByTag(tag: string): Promise<DiaryEntry[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .contains('tags', [tag])
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error getting diary entries by tag:', error)
    throw error
  }
}

// Función para obtener estadísticas del diario
export async function getDiaryStats(): Promise<{
  totalEntries: number
  entriesThisMonth: number
  mostUsedTags: string[]
  averageEntriesPerWeek: number
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data: entries, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)

    if (error) throw error

    const totalEntries = entries?.length || 0
    
    // Entradas de este mes
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const entriesThisMonth = entries?.filter(entry => {
      const entryDate = new Date(entry.created_at)
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear
    }).length || 0

    // Etiquetas más usadas
    const allTags = entries?.flatMap(entry => entry.tags || []) || []
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const mostUsedTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag)

    // Promedio de entradas por semana (últimas 4 semanas)
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
    
    const recentEntries = entries?.filter(entry => 
      new Date(entry.created_at) >= fourWeeksAgo
    ).length || 0
    
    const averageEntriesPerWeek = recentEntries / 4

    return {
      totalEntries,
      entriesThisMonth,
      mostUsedTags,
      averageEntriesPerWeek
    }
  } catch (error) {
    console.error('Error getting diary stats:', error)
    return {
      totalEntries: 0,
      entriesThisMonth: 0,
      mostUsedTags: [],
      averageEntriesPerWeek: 0
    }
  }
}

// Función para obtener el historial de versiones de una entrada
export async function getDiaryEntryVersions(entryId: string): Promise<DiaryEntryVersion[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('diary_entry_versions')
      .select('*')
      .eq('entry_id', entryId)
      .eq('user_id', user.id)
      .order('version_number', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error getting diary entry versions:', error)
    throw error
  }
}

// Función para obtener una versión específica de una entrada
export async function getDiaryEntryVersion(entryId: string, versionNumber: number): Promise<DiaryEntryVersion | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('diary_entry_versions')
      .select('*')
      .eq('entry_id', entryId)
      .eq('version_number', versionNumber)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data || null
  } catch (error) {
    console.error('Error getting diary entry version:', error)
    throw error
  }
}

// Función para restaurar una versión anterior de una entrada
export async function restoreDiaryEntryVersion(entryId: string, versionNumber: number): Promise<DiaryEntry> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    // Obtener la versión a restaurar
    const version = await getDiaryEntryVersion(entryId, versionNumber)
    if (!version) {
      throw new Error('Versión no encontrada')
    }

    // Actualizar la entrada actual con los datos de la versión
    const { data, error } = await supabase
      .from('diary_entries')
      .update({
        title: version.title,
        content: version.content,
        date: version.date,
        time: version.time,
        tags: version.tags,
        mood: version.mood,
        is_private: version.is_private,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error restoring diary entry version:', error)
    throw error
  }
}