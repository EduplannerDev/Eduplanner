import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testRLSPolicies() {
  console.log('🔍 Probando políticas RLS específicamente...')
  
  // IDs que sabemos que existen
  const directorId = '7f942e6b-3810-468e-9617-3c24afa5ce2b'
  const profesorId = '155d8f13-a6a9-460c-a554-96790d472ee9'
  const plantelId = 'bea9155e-47cb-4e65-8d18-abe3829b2cd4'
  
  // 1. Probar como director
  console.log('\n👨‍💼 Probando como DIRECTOR...')
  const supabaseDirector = createClient(supabaseUrl, supabaseAnonKey)
  
  // Simular autenticación del director
  const { data: authData, error: authError } = await supabaseDirector.auth.signInWithPassword({
    email: 'hazzel90@gmail.com',
    password: 'test123' // Asumiendo que esta es la contraseña
  })
  
  if (authError) {
    console.log('❌ Error de autenticación del director:', authError.message)
    return
  }
  
  console.log('✅ Director autenticado:', authData.user?.email)
  
  // Probar acceso a planeaciones como director
  const { data: planeacionesDirector, error: errorDirector } = await supabaseDirector
    .from('planeaciones')
    .select('id, titulo, user_id, created_at')
    .is('deleted_at', null)
    .limit(10)
  
  console.log('📋 Planeaciones visibles para director:', {
    count: planeacionesDirector?.length || 0,
    planeaciones: planeacionesDirector,
    error: errorDirector
  })
  
  // Probar acceso a profiles como director
  const { data: profilesDirector, error: errorProfilesDirector } = await supabaseDirector
    .from('profiles')
    .select('id, email, role, plantel_id')
    .eq('plantel_id', plantelId)
  
  console.log('👥 Profiles visibles para director:', {
    count: profilesDirector?.length || 0,
    profiles: profilesDirector,
    error: errorProfilesDirector
  })
  
  // 2. Probar como profesor
  console.log('\n👨‍🏫 Probando como PROFESOR...')
  const supabaseProfesor = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data: authDataProf, error: authErrorProf } = await supabaseProfesor.auth.signInWithPassword({
    email: 'chazzelgrojas@gmail.com',
    password: 'test123' // Asumiendo que esta es la contraseña
  })
  
  if (authErrorProf) {
    console.log('❌ Error de autenticación del profesor:', authErrorProf.message)
    return
  }
  
  console.log('✅ Profesor autenticado:', authDataProf.user?.email)
  
  // Probar acceso a planeaciones como profesor
  const { data: planeacionesProfesor, error: errorProfesor } = await supabaseProfesor
    .from('planeaciones')
    .select('id, titulo, user_id, created_at')
    .is('deleted_at', null)
    .limit(10)
  
  console.log('📋 Planeaciones visibles para profesor:', {
    count: planeacionesProfesor?.length || 0,
    planeaciones: planeacionesProfesor,
    error: errorProfesor
  })
}

testRLSPolicies().catch(console.error)