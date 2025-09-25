import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function debugDirectorPlantel() {
  console.log('🔍 Debugging Director Plantel ID vs Planeaciones...')
  
  // Get director user info
  const directorUserId = '7f942e6b-3810-468e-9617-3c24afa5ce2b'
  
  const { data: directorProfile, error: directorError } = await supabase
    .from('profiles')
    .select('id, email, role, plantel_id')
    .eq('id', directorUserId)
    .single()
  
  if (directorError) {
    console.error('❌ Error fetching director profile:', directorError)
    return
  }
  
  console.log('👤 Director Profile:', directorProfile)
  
  // Get all planeaciones
  const { data: planeaciones, error: planeacionesError } = await supabase
    .from('planeaciones')
    .select('id, titulo, materia, grado, user_id, created_at, deleted_at')
    .is('deleted_at', null)
  
  if (planeacionesError) {
    console.error('❌ Error fetching planeaciones:', planeacionesError)
    return
  }
  
  console.log(`\n📚 Found ${planeaciones?.length || 0} planeaciones:`)
  
  // Get profiles for each planeacion creator
  for (let i = 0; i < (planeaciones?.length || 0); i++) {
    const planeacion = planeaciones![i]
    
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('id, email, role, plantel_id')
      .eq('id', planeacion.user_id)
      .single()
    
    console.log(`${i + 1}. ${planeacion.titulo}`)
    console.log(`   - Materia: ${planeacion.materia}`)
    console.log(`   - Grado: ${planeacion.grado}`)
    console.log(`   - Created by: ${creatorProfile?.email || 'Unknown'}`)
    console.log(`   - Creator plantel_id: ${creatorProfile?.plantel_id || 'None'}`)
    console.log(`   - Creator role: ${creatorProfile?.role || 'Unknown'}`)
    console.log(`   - Matches director plantel? ${creatorProfile?.plantel_id === directorProfile.plantel_id ? '✅ YES' : '❌ NO'}`)
    console.log('')
  }
  
  // Check if director can see any planeaciones with current RLS
  console.log('🔐 Testing RLS with director context...')
  
  const { data: directorPlaneaciones, error: rlsError } = await supabase
    .rpc('set_claim', { uid: directorUserId, claim: 'role', value: 'director' })
    .then(() => supabase.auth.admin.getUserById(directorUserId))
    .then(() => supabase
      .from('planeaciones')
      .select('id, titulo, materia, grado, user_id')
      .is('deleted_at', null)
    )
  
  if (rlsError) {
    console.error('❌ RLS Test Error:', rlsError)
  } else {
    console.log(`🔐 Director can see ${directorPlaneaciones?.length || 0} planeaciones through RLS`)
  }
  
  // Check plantel_id distribution
  const plantelIds: string[] = []
  
  for (const planeacion of planeaciones || []) {
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('plantel_id')
      .eq('id', planeacion.user_id)
      .single()
    
    if (creatorProfile?.plantel_id) {
      plantelIds.push(creatorProfile.plantel_id)
    }
  }
  
  const uniquePlantels = [...new Set(plantelIds)]
  
  console.log('\n🏢 Plantel ID distribution:')
  uniquePlantels.forEach(plantelId => {
    const count = plantelIds.filter(id => id === plantelId).length
    console.log(`   - Plantel ${plantelId}: ${count} planeaciones ${plantelId === directorProfile.plantel_id ? '(DIRECTOR\'S PLANTEL)' : ''}`)
  })
}

debugDirectorPlantel().catch(console.error)