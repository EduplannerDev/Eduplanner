import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
    try {
        // Crear cliente de Supabase con service role (bypass RLS para operaciones administrativas)
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const body = await request.json();
        const { planeacion_id, user_id } = body;

        if (!planeacion_id || !user_id) {
            return NextResponse.json(
                { error: 'planeacion_id y user_id son requeridos' },
                { status: 400 }
            );
        }

        // Obtener perfil del usuario para verificar plantel_id
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, plantel_id, role')
            .eq('id', user_id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { error: 'No se pudo obtener el perfil del usuario' },
                { status: 500 }
            );
        }

        if (!profile.plantel_id) {
            return NextResponse.json(
                { error: 'Solo los profesores con plantel asignado pueden enviar planeaciones a dirección' },
                { status: 403 }
            );
        }

        // Verificar que la planeación pertenece al usuario
        const { data: planeacion, error: planeacionError } = await supabase
            .from('planeaciones')
            .select('id, user_id, titulo, contenido')
            .eq('id', planeacion_id)
            .eq('user_id', user_id)
            .single();

        if (planeacionError || !planeacion) {
            return NextResponse.json(
                { error: 'Planeación no encontrada o no tienes permiso para enviarla' },
                { status: 404 }
            );
        }

        // Verificar si ya fue enviada
        const { data: existingEnvio } = await supabase
            .from('planeaciones_enviadas')
            .select('id')
            .eq('planeacion_id', planeacion_id)
            .single();

        if (existingEnvio) {
            return NextResponse.json(
                { error: 'Esta planeación ya fue enviada a dirección' },
                { status: 409 }
            );
        }

        // Crear el envío
        const { data: envio, error: envioError } = await supabase
            .from('planeaciones_enviadas')
            .insert({
                planeacion_id,
                plantel_id: profile.plantel_id,
                profesor_id: user_id,
                estado: 'pendiente'
            })
            .select()
            .single();

        if (envioError) {
            console.error('Error al enviar planeación:', envioError);
            return NextResponse.json(
                { error: 'Error al enviar la planeación a dirección' },
                { status: 500 }
            );
        }

        // Crear versión inicial (versión 1)
        const { error: versionError } = await supabase
            .from('planeacion_versiones')
            .insert({
                planeacion_id,
                version_number: 1,
                titulo: planeacion.titulo,
                contenido: planeacion.contenido,
                created_by: user_id,
                motivo: 'envio_inicial'
            });

        if (versionError) {
            console.error('Error al guardar versión inicial:', versionError);
            // No fallamos el request principal, pero logueamos el error
        }

        return NextResponse.json({
            success: true,
            message: 'Planeación enviada a dirección correctamente',
            data: envio
        });

    } catch (error) {
        console.error('Error en /api/planeaciones/enviar:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
