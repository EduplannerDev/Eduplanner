import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Falta encabezado de autorización' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')

        // Crear cliente usando el token del usuario directamente en el header global
        // Este patrón coincide con lo visto en log-communication.ts (refactor previo)
        // y evita problemas con cookies en rutas de API
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        })

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
        }

        const { alumnoId, mensajeEnviado, tipoIncidencia } = await request.json()

        if (!alumnoId || !mensajeEnviado) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
        }

        // Insertar en 'seguimiento_diario'
        const { error: insertError } = await supabase
            .from('seguimiento_diario')
            .insert({
                alumno_id: alumnoId,
                user_id: user.id,
                fecha: new Date().toISOString(),
                tipo: 'contacto_familia',
                nota: `[COMUNICACIÓN DIRECCIÓN] Se contactó a la familia por WhatsApp respecto a: ${tipoIncidencia}. Mensaje: "${mensajeEnviado}"`
            })

        if (insertError) {
            console.error('Error logging communication:', insertError)
            return NextResponse.json({ error: 'Error al registrar en bitácora' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Unexpected error in log-communication API:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
