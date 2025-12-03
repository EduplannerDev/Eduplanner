"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PlanAnaliticoFormData } from '@/types/plan-analitico'

export function usePlanAnalitico() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const crearPlanAnalitico = async (data: PlanAnaliticoFormData): Promise<{ success: boolean; planId?: string; error?: string }> => {
        setLoading(true)
        setError(null)

        try {
            // Obtener el token de sesión
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError || !session?.access_token) {
                throw new Error('No se pudo obtener el token de sesión')
            }

            const response = await fetch('/api/plan-analitico/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(data)
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Error al crear el plan analítico')
            }

            return { success: true, planId: result.planId }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setLoading(false)
        }
    }

    const obtenerPlanesAnaliticos = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            if (sessionError || !session?.user) throw new Error('No hay sesión activa')

            const { data, error } = await supabase
                .from('planes_analiticos')
                .select(`
                    *,
                    grupos (
                        nombre,
                        grado,
                        nivel
                    )
                `)
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        } catch (err) {
            console.error('Error obteniendo planes:', err)
            setError('Error al cargar los planes analíticos')
            return []
        } finally {
            setLoading(false)
        }
    }

    const obtenerDetallePlanAnalitico = async (planId: string) => {
        setLoading(true)
        setError(null)
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            if (sessionError || !session?.user) throw new Error('No hay sesión activa')

            // 1. Obtener el plan base
            const { data: plan, error: planError } = await supabase
                .from('planes_analiticos')
                .select(`
                    *,
                    grupos (
                        nombre,
                        grado,
                        nivel
                    )
                `)
                .eq('id', planId)
                .single()

            if (planError) throw planError

            // 2. Obtener problemáticas
            const { data: problematicas, error: probError } = await supabase
                .from('plan_analitico_problematicas')
                .select('*')
                .eq('plan_id', planId)

            if (probError) throw probError

            // 3. Obtener contenidos (PDAs) para cada problemática
            const problematicasConContenidos = await Promise.all(problematicas.map(async (prob) => {
                const { data: contenidosRel, error: contError } = await supabase
                    .from('problematica_contenidos')
                    .select(`
                        contenido_id,
                        curriculo_sep (
                            *
                        )
                    `)
                    .eq('problematica_id', prob.id)

                if (contError) throw contError

                // Mapear para tener una estructura más limpia
                const pdas = contenidosRel.map((item: any) => item.curriculo_sep)

                return {
                    ...prob,
                    pdas
                }
            }))

            return {
                ...plan,
                problematicas: problematicasConContenidos
            }

        } catch (err) {
            console.error('Error obteniendo detalle del plan:', err)
            setError('Error al cargar el detalle del plan analítico')
            return null
        } finally {
            setLoading(false)
        }
    }

    const actualizarDiagnostico = async (planId: string, data: { input_comunitario: string, input_escolar: string, input_grupo: string, diagnostico_generado: string }) => {
        setLoading(true)
        setError(null)
        try {
            const { error } = await supabase
                .from('planes_analiticos')
                .update(data)
                .eq('id', planId)

            if (error) throw error
            return true
        } catch (err) {
            console.error('Error actualizando diagnóstico:', err)
            setError('Error al actualizar el diagnóstico')
            return false
        } finally {
            setLoading(false)
        }
    }

    const eliminarProblematica = async (problematicaId: string) => {
        setLoading(true)
        setError(null)
        try {
            // Primero eliminar relaciones en problematica_contenidos
            const { error: relError } = await supabase
                .from('problematica_contenidos')
                .delete()
                .eq('problematica_id', problematicaId)

            if (relError) throw relError

            // Luego eliminar la problemática
            const { error } = await supabase
                .from('plan_analitico_problematicas')
                .delete()
                .eq('id', problematicaId)

            if (error) throw error
            return true
        } catch (err) {
            console.error('Error eliminando problemática:', err)
            setError('Error al eliminar la problemática')
            return false
        } finally {
            setLoading(false)
        }
    }

    const agregarProblematica = async (planId: string, titulo: string, descripcion: string, pdas: string[]) => {
        setLoading(true)
        setError(null)
        try {
            // 1. Insertar la problemática
            const { data: probData, error: probError } = await supabase
                .from('plan_analitico_problematicas')
                .insert({
                    plan_id: planId,
                    titulo,
                    descripcion
                })
                .select()
                .single()

            if (probError) throw probError

            // 2. Insertar las relaciones con PDAs
            if (pdas.length > 0) {
                const relaciones = pdas.map(pdaId => ({
                    problematica_id: probData.id,
                    contenido_id: pdaId
                }))

                const { error: relError } = await supabase
                    .from('problematica_contenidos')
                    .insert(relaciones)

                if (relError) throw relError
            }

            return true
        } catch (err) {
            console.error('Error agregando problemática:', err)
            setError('Error al agregar la problemática')
            return false
        } finally {
            setLoading(false)
        }
    }

    const actualizarProblematica = async (problematicaId: string, titulo: string, descripcion: string) => {
        setLoading(true)
        setError(null)
        try {
            const { error } = await supabase
                .from('plan_analitico_problematicas')
                .update({ titulo, descripcion })
                .eq('id', problematicaId)

            if (error) throw error
            return true
        } catch (err) {
            console.error('Error actualizando problemática:', err)
            setError('Error al actualizar la problemática')
            return false
        } finally {
            setLoading(false)
        }
    }

    const eliminarPlanAnalitico = async (planId: string) => {
        setLoading(true)
        setError(null)
        try {
            // Eliminar el plan (las problemáticas y contenidos se eliminan en cascada por la FK)
            const { error } = await supabase
                .from('planes_analiticos')
                .delete()
                .eq('id', planId)

            if (error) throw error
            return true
        } catch (err) {
            console.error('Error eliminando plan:', err)
            setError('Error al eliminar el plan analítico')
            return false
        } finally {
            setLoading(false)
        }
    }

    return {
        crearPlanAnalitico,
        obtenerPlanesAnaliticos,
        obtenerDetallePlanAnalitico,
        actualizarDiagnostico,
        eliminarProblematica,
        agregarProblematica,
        actualizarProblematica,
        eliminarPlanAnalitico,
        loading,
        error
    }
}
