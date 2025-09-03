import { supabase } from './supabase'

export interface Grupo {
  id: string
  plantel_id: string | null
  user_id: string
  nombre: string
  grado: string
  grupo: string
  nivel: string
  ciclo_escolar: string
  activo: boolean
  created_at: string
  updated_at: string
  numero_alumnos?: number
}

export interface CreateGrupoData {
  nombre: string
  grado: string
  grupo: string
  nivel: string
  ciclo_escolar: string
}

export interface UpdateGrupoData {
  nombre?: string
  grado?: string
  grupo?: string
  nivel?: string
  ciclo_escolar?: string
}

// Obtener todos los grupos del usuario según su rol y permisos
export async function getGruposByOwner(userId: string): Promise<Grupo[]> {
  // La consulta ahora depende de las políticas RLS que determinan
  // qué grupos puede ver el usuario según su rol y plantel
  const { data, error } = await supabase
    .from('grupos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching grupos:', error)
    throw new Error('Error al obtener los grupos')
  }

  return data || []
}

// Obtener un grupo específico
export async function getGrupoById(id: string): Promise<Grupo | null> {
  const { data, error } = await supabase
    .from('grupos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No encontrado
    }
    console.error('Error fetching grupo:', error)
    throw new Error('Error al obtener el grupo')
  }

  return data
}

// Crear un nuevo grupo
export async function createGrupo(userId: string, plantelId: string | null, grupoData: CreateGrupoData): Promise<Grupo> {
  const { data, error } = await supabase
    .from('grupos')
    .insert({
      user_id: userId,
      plantel_id: plantelId,
      ...grupoData
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating grupo:', error)
    throw new Error('Error al crear el grupo')
  }

  return data
}

// Actualizar un grupo
export async function updateGrupo(id: string, grupoData: UpdateGrupoData): Promise<Grupo> {
  const { data, error } = await supabase
    .from('grupos')
    .update(grupoData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating grupo:', error)
    throw new Error('Error al actualizar el grupo')
  }

  return data
}

// Eliminar un grupo
export async function deleteGrupo(id: string): Promise<void> {
  const { error } = await supabase
    .from('grupos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting grupo:', error)
    throw new Error('Error al eliminar el grupo')
  }
}

// Obtener grupos por plantel
export async function getGruposByPlantel(plantelId: string): Promise<Grupo[]> {
  const { data, error } = await supabase
    .from('grupos')
    .select(`
      *,
      profiles!grupos_user_id_fkey(
        full_name,
        email
      )
    `)
    .eq('plantel_id', plantelId)
    .eq('activo', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching grupos by plantel:', error)
    throw new Error('Error al obtener los grupos del plantel')
  }

  return data || []
}

// Obtener grupos del usuario en un plantel específico
export async function getGruposByUserAndPlantel(userId: string, plantelId: string): Promise<Grupo[]> {
  const { data, error } = await supabase
    .from('grupos')
    .select('*')
    .eq('user_id', userId)
    .eq('plantel_id', plantelId)
    .eq('activo', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching grupos by user and plantel:', error)
    throw new Error('Error al obtener los grupos')
  }

  return data || []
}

// Desactivar un grupo (soft delete)
export async function deactivateGrupo(id: string): Promise<void> {
  const { error } = await supabase
    .from('grupos')
    .update({ activo: false })
    .eq('id', id)

  if (error) {
    console.error('Error deactivating grupo:', error)
    throw new Error('Error al desactivar el grupo')
  }
}

// Obtener estadísticas de grupos
export async function getGruposStats(userId: string, plantelId?: string) {
  let query = supabase
    .from('grupos')
    .select('nivel')
    .eq('user_id', userId)
    .eq('activo', true)

  if (plantelId) {
    query = query.eq('plantel_id', plantelId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching grupos stats:', error)
    throw new Error('Error al obtener estadísticas de grupos')
  }

  const stats = {
    total: data.length,
    porNivel: data.reduce((acc, grupo) => {
      acc[grupo.nivel] = (acc[grupo.nivel] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  return stats
}

// Obtener estadísticas de grupos por plantel (para directores/administradores)
export async function getGruposStatsByPlantel(plantelId: string) {
  const { data, error } = await supabase
    .from('grupos')
    .select('nivel')
    .eq('plantel_id', plantelId)
    .eq('activo', true)

  if (error) {
    console.error('Error fetching grupos stats by plantel:', error)
    throw new Error('Error al obtener estadísticas de grupos del plantel')
  }

  const stats = {
    total: data.length,
    porNivel: data.reduce((acc, grupo) => {
      acc[grupo.nivel] = (acc[grupo.nivel] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  return stats
}