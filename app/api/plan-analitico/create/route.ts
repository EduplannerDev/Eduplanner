import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { PlanAnaliticoFormData } from '@/types/plan-analitico'

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export async function POST(request: NextRequest) {
    try {
        let user: any = null
        let supabase: SupabaseClient | null = null

        // Intentar autenticación con Bearer token primero
        const authHeader = request.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1]

            // Crear cliente con service role para verificar token
            const serviceSupabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            )

            const { data: { user: tokenUser }, error: tokenError } = await serviceSupabase.auth.getUser(token)

            if (!tokenError && tokenUser) {
                user = tokenUser
                supabase = serviceSupabase
            }
        }

        // Si no hay Bearer token o falló, intentar con cookies
        if (!user) {
            const cookieStore = await cookies()
            supabase = createClient(supabaseUrl, supabaseAnonKey, {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                },
            })

            const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()

            if (authError || !cookieUser) {
                return NextResponse.json(
                    { error: 'No autorizado' },
                    { status: 401 }
                )
            }

            user = cookieUser
        }

        // Si llegamos aquí, tenemos usuario y cliente supabase
        if (!supabase) {
            // Fallback por si acaso (no debería pasar si user existe)
            supabase = createClient(supabaseUrl, supabaseAnonKey)
        }

        const data: PlanAnaliticoFormData = await request.json()

        // 1. Crear el Plan Analítico
        const { data: plan, error: planError } = await supabase
            .from('planes_analiticos')
            .insert({
                user_id: user.id,
                grupo_id: data.grupo_id,
                ciclo_escolar: data.ciclo_escolar,
                input_comunitario: data.input_comunitario,
                input_escolar: data.input_escolar,
                input_grupo: data.input_grupo,
                diagnostico_generado: data.diagnostico_generado
            })
            .select()
            .single()

        if (planError) {
            return NextResponse.json({ error: `Error creando plan: ${planError.message}` }, { status: 500 })
        }

        // 2. Crear las Problemáticas
        if (data.problematicas.length > 0) {
            for (const prob of data.problematicas) {
                // Insertar problemática
                const { data: problematica, error: probError } = await supabase
                    .from('plan_analitico_problematicas')
                    .insert({
                        plan_id: plan.id,
                        titulo: prob.titulo,
                        descripcion: prob.descripcion
                    })
                    .select()
                    .single()

                if (probError) {
                    // Podríamos hacer rollback manual aquí, pero por simplicidad retornamos error
                    return NextResponse.json({ error: `Error creando problemática: ${probError.message}` }, { status: 500 })
                }

                // 3. Vincular PDAs a la problemática
                if (prob.pdas_seleccionados.length > 0) {
                    const pdaLinks = prob.pdas_seleccionados.map(pdaId => ({
                        problematica_id: problematica.id,
                        contenido_id: pdaId
                    }))

                    const { error: linksError } = await supabase
                        .from('problematica_contenidos')
                        .insert(pdaLinks)

                    if (linksError) {
                        return NextResponse.json({ error: `Error vinculando PDAs: ${linksError.message}` }, { status: 500 })
                    }
                }
            }
        }

        return NextResponse.json({ success: true, planId: plan.id })
    } catch (error) {
        console.error('Error creating plan analitico:', error)
        return NextResponse.json(
            { error: 'Error interno al crear el plan analítico' },
            { status: 500 }
        )
    }
}
