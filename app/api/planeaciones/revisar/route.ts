import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
    try {
        // Crear cliente de Supabase con service role
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const body = await request.json();
        const { envio_id, comentarios, user_id, accion } = body;

        // Validar parámetros requeridos
        if (!envio_id || !user_id || !accion) {
            return NextResponse.json(
                { error: 'envio_id, user_id y accion son requeridos' },
                { status: 400 }
            );
        }

        // Validar que accion sea válida
        if (!['aprobar', 'solicitar_cambios'].includes(accion)) {
            return NextResponse.json(
                { error: 'accion debe ser "aprobar" o "solicitar_cambios"' },
                { status: 400 }
            );
        }

        // Validar que comentarios sean requeridos cuando se solicitan cambios
        if (accion === 'solicitar_cambios' && (!comentarios || comentarios.trim().length === 0)) {
            return NextResponse.json(
                { error: 'Los comentarios son obligatorios cuando se solicitan cambios' },
                { status: 400 }
            );
        }

        // Obtener perfil del usuario para verificar que es director
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

        if (profile.role !== 'director') {
            return NextResponse.json(
                { error: 'Solo los directores pueden revisar planeaciones' },
                { status: 403 }
            );
        }

        // Verificar que el envío existe y pertenece al plantel del director
        const { data: envio, error: envioError } = await supabase
            .from('planeaciones_enviadas')
            .select('*')
            .eq('id', envio_id)
            .eq('plantel_id', profile.plantel_id)
            .single();

        if (envioError || !envio) {
            return NextResponse.json(
                { error: 'Envío no encontrado o no pertenece a tu plantel' },
                { status: 404 }
            );
        }

        // Actualizar el envío según la acción
        const nuevoEstado = accion === 'aprobar' ? 'aprobada' : 'cambios_solicitados';

        const { data: updatedEnvio, error: updateError } = await supabase
            .from('planeaciones_enviadas')
            .update({
                estado: nuevoEstado,
                accion_revision: accion,
                comentarios_director: comentarios || null,
                director_revisor_id: user_id,
                fecha_revision: new Date().toISOString(),
                planeacion_modificada: false,
            })
            .eq('id', envio_id)
            .select()
            .single();

        if (updateError) {
            console.error('Error al actualizar envío:', updateError)
            return NextResponse.json(
                { error: 'Error al procesar la revisión' },
                { status: 500 }
            );
        }

        const mensaje = accion === 'aprobar'
            ? 'Planeación aprobada correctamente'
            : 'Se solicitaron cambios en la planeación';

        return NextResponse.json({
            success: true,
            message: mensaje,
            data: updatedEnvio
        });

    } catch (error) {
        console.error('Error en /api/planeaciones/revisar:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
