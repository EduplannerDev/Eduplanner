import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  // Rutas que siempre deben estar disponibles (admin, API de toggle, etc.)
  const allowedPaths = [
    '/admin',
    '/api/maintenance',
    '/maintenance',
    '/_next',
    '/favicon.ico',
    '/images',
    '/login',
    '/auth'
  ]
  
  // Verificar si la ruta actual está en las rutas permitidas
  const isAllowedPath = allowedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  
  // Si es una ruta permitida, continuar sin verificar mantenimiento
  if (isAllowedPath) {
    return NextResponse.next()
  }
  
  try {
    // Crear cliente de Supabase para consultar la configuración
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Consultar el estado del modo mantenimiento
    const { data, error } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'maintenance_mode')
      .single()
    
    if (error) {
      console.error('Error consultando modo mantenimiento:', error)
      // En caso de error, permitir acceso normal
      return NextResponse.next()
    }
    
    const maintenanceMode = data?.config_value === 'true'
    
    // Si está en modo mantenimiento, redirigir a la página de mantenimiento
    if (maintenanceMode) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
    
  } catch (error) {
    console.error('Error en middleware de mantenimiento:', error)
    // En caso de error, permitir acceso normal
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}