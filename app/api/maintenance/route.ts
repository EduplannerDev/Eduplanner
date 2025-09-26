import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Crear cliente de Supabase con service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Función para verificar si el usuario es administrador
async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, activo')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error verificando rol de usuario:', error);
      return false;
    }

    return profile?.role === 'administrador' && profile?.activo === true;
  } catch (error) {
    console.error('Error en verificación de administrador:', error);
    return false;
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'maintenance_mode')
      .single()

    if (error) {
      console.error('Error obteniendo configuración:', error)
      return NextResponse.json(
        { error: 'Error obteniendo configuración del sistema' },
        { status: 500 }
      )
    }

    const maintenanceMode = data?.config_value === 'true'
    return NextResponse.json({ maintenanceMode })
  } catch (error) {
    console.error('Error en GET /api/maintenance:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Cambiar estado del modo mantenimiento (solo administradores)
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token de autenticación inválido' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea administrador
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden cambiar el modo de mantenimiento.' },
        { status: 403 }
      );
    }

    const { maintenanceMode } = await req.json()

    if (typeof maintenanceMode !== 'boolean') {
      return NextResponse.json(
        { error: 'maintenanceMode debe ser un valor booleano' },
        { status: 400 }
      )
    }

    // Actualizar directamente la tabla usando service role (bypassing RPC auth check)
     const { error } = await supabase
       .from('system_config')
       .update({ 
         config_value: maintenanceMode.toString(),
         updated_at: new Date().toISOString()
       })
       .eq('config_key', 'maintenance_mode')

    if (error) {
      console.error('Error actualizando configuración:', error)
      return NextResponse.json(
        { error: 'Error actualizando configuración del sistema' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      maintenanceMode,
      message: maintenanceMode ? 'Modo mantenimiento activado' : 'Modo mantenimiento desactivado'
    })
  } catch (error) {
    console.error('Error en POST /api/maintenance:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}