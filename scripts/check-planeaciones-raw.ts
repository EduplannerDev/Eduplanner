import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Usar service key para bypass RLS

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPlaneacionesRaw() {
  console.log('🔍 Verificando planeaciones directamente en la base de datos...')
  
  // 1. Verificar todas las planeaciones (sin RLS)
  const { data: allPlaneaciones, error: errorAll } = await supabase
    .from('planeaciones')
    .select('*')
    .is('deleted_at', null)
  
  console.log('📋 Todas las planeaciones en la DB:', { 
    count: allPlaneaciones?.length || 0,
    planeaciones: allPlaneaciones,
    error: errorAll 
  })
  
  // 2. Verificar usuarios y sus planteles
  const { data: users, error: errorUsers } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, plantel_id, activo')
    .in('role', ['profesor', 'director'])
  
  console.log('👥 Usuarios (profesores y directores):', { 
    count: users?.length || 0,
    users,
    error: errorUsers 
  })
  
  // 3. Verificar planeacion_creations
  const { data: creations, error: errorCreations } = await supabase
    .from('planeacion_creations')
    .select('*')
  
  console.log('📝 Planeacion creations:', { 
    count: creations?.length || 0,
    creations,
    error: errorCreations 
  })
}

checkPlaneacionesRaw().catch(console.error)