import { createClient } from '@/lib/supabase'

export interface FichaDescriptiva {
    id?: string
    user_id: string
    alumno_id: string
    grupo_id: string
    ciclo_escolar: string
    estado_promocion: 'promovido' | 'condicionado' | 'no_promovido'
    logros: string
    dificultades: string
    recomendaciones: string
    created_at?: string
    updated_at?: string
}

export async function getFichasByGrupo(grupoId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('fichas_descriptivas')
        .select(`
      *,
      alumnos (
        id,
        nombre_completo,
        numero_lista,
        foto_url
      )
    `)
        .eq('grupo_id', grupoId)

    if (error) {
        console.error('Error fetching fichas:', error)
        return []
    }

    return data
}

export async function getFichaByAlumno(alumnoId: string, cicloEscolar: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('fichas_descriptivas')
        .select('*')
        .eq('alumno_id', alumnoId)
        .eq('ciclo_escolar', cicloEscolar)
        .single()

    if (error && error.code !== 'PGRST116') { // Ignorar error si no existe
        console.error('Error fetching ficha:', error)
    }

    return data
}

export async function saveFicha(ficha: Partial<FichaDescriptiva>) {
    const supabase = createClient()

    // Validar autenticación y obtener user_id real
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('Usuario no autenticado')
    }

    // Verificar si ya existe para actualizar o insertar
    const { data: existing } = await supabase
        .from('fichas_descriptivas')
        .select('id')
        .eq('alumno_id', ficha.alumno_id)
        .eq('ciclo_escolar', ficha.ciclo_escolar)
        .single()

    let result
    if (existing) {
        // Update
        result = await supabase
            .from('fichas_descriptivas')
            .update({
                estado_promocion: ficha.estado_promocion,
                logros: ficha.logros,
                dificultades: ficha.dificultades,
                recomendaciones: ficha.recomendaciones,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select() // Importante: select() devuelve las filas afectadas

        // Verificar si la actualización fue exitosa
        if (!result.error && (!result.data || result.data.length === 0)) {
            // Si no hay error pero no se actualizó nada, probablemente es RLS o el registro desapareció
            throw new Error("No se pudo actualizar la ficha. Verifique permisos o que el registro exista.")
        }
    } else {
        // Insert - Asegurar user_id correcto
        result = await supabase
            .from('fichas_descriptivas')
            .insert({
                ...ficha,
                user_id: user.id // Sobrescribir/Asignar ID del usuario autenticado
            })
            .select()
    }

    if (result.error) {
        console.error('Error saving ficha:', result.error)
        throw new Error(`Error al guardar: ${result.error.message}`)
    }

    return result.data[0]
}
