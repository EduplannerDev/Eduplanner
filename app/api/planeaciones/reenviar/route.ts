
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
    try {
        // Crear cliente de Supabase con service role para bypass RLS si es necesario
        // aunque idealmente el usuario debería tener permiso de actualizar su propio envío
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const body = await request.json();
        const { planeacion_id, user_id } = body;

        if (!planeacion_id || !user_id) {
            return NextResponse.json(
                { error: 'planeacion_id y user_id son requeridos' },
                { status: 400 }
            );
        }

        // Verificar que el envío existe y pertenece al usuario (opcional si confiamos en el cliente, pero mejor verificar)

        // Actualizar el estado a 'pendiente'
        const { data, error } = await supabase
            .from('planeaciones_enviadas')
            .update({
                estado: 'pendiente',
                fecha_envio: new Date().toISOString(), // Actualizamos fecha de envío
                accion_revision: null, // Limpiamos la acción anterior
                // Opcional: mantener comentarios anteriores o no. Generalmente se mantienen para historial.
                planeacion_modificada: false // Reseteamos flag de modificada ya que se está enviando de nuevo
            })
            .eq('planeacion_id', planeacion_id)
            .eq('profesor_id', user_id) // Seguridad extra
            .select()
            .single();

        if (error) {
            console.error('Error al re-enviar planeación:', error);
            return NextResponse.json(
                { error: 'Error al re-enviar la planeación' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Planeación re-enviada correctamente',
            data
        });

    } catch (error) {
        console.error('Error en el servidor:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
