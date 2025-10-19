import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno desde .env
config({ path: path.join(process.cwd(), '.env') })

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Faltan variables de entorno')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu archivo .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  plantel_id: string | null
  plantel_nombre: string | null
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  is_active: boolean
}

interface UserActivityStats {
  totalUsers: number
  activeLastWeek: number
  inactiveLastWeek: number
  neverLoggedIn: number
  byRole: {
    [role: string]: {
      total: number
      activeLastWeek: number
      inactiveLastWeek: number
    }
  }
  byPlantel: {
    [plantel: string]: {
      total: number
      activeLastWeek: number
      inactiveLastWeek: number
    }
  }
}

async function analyzeUserActivity() {
  try {
    console.log('🔍 Analizando actividad de usuarios...')
    console.log('')

    // Primero obtener todos los perfiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        plantel_id,
        planteles(nombre),
        created_at
      `)

    if (profilesError) {
      console.error('❌ Error obteniendo perfiles:', profilesError)
      return
    }

    console.log(`📋 Encontrados ${profiles?.length || 0} perfiles en la tabla profiles`)

    // Obtener información de autenticación de auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error obteniendo usuarios de auth:', authError)
      return
    }

    console.log(`🔐 Encontrados ${authUsers?.users?.length || 0} usuarios en auth.users`)

    // Combinar datos de perfiles y auth
    const users: UserProfile[] = profiles?.map(profile => {
      const authUser = authUsers?.users?.find(user => user.id === profile.id)
      return {
        id: profile.id,
        email: authUser?.email || 'No disponible',
        full_name: profile.full_name || 'Sin nombre',
        role: profile.role || 'Sin rol',
        plantel_id: profile.plantel_id,
        plantel_nombre: profile.planteles?.nombre || 'Sin plantel',
        created_at: profile.created_at,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        email_confirmed_at: authUser?.email_confirmed_at || null,
        is_active: authUser?.email_confirmed_at ? true : false
      }
    }) || []

    // Calcular fechas
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Separar usuarios por actividad
    const activeLastWeek: UserProfile[] = []
    const inactiveLastWeek: UserProfile[] = []
    const neverLoggedIn: UserProfile[] = []

    users.forEach(user => {
      if (!user.last_sign_in_at) {
        neverLoggedIn.push(user)
      } else {
        const lastSignIn = new Date(user.last_sign_in_at)
        if (lastSignIn >= oneWeekAgo) {
          activeLastWeek.push(user)
        } else {
          inactiveLastWeek.push(user)
        }
      }
    })

    // Calcular estadísticas por rol
    const statsByRole: { [role: string]: { total: number; activeLastWeek: number; inactiveLastWeek: number } } = {}
    const statsByPlantel: { [plantel: string]: { total: number; activeLastWeek: number; inactiveLastWeek: number } } = {}

    users.forEach(user => {
      // Por rol
      if (!statsByRole[user.role]) {
        statsByRole[user.role] = { total: 0, activeLastWeek: 0, inactiveLastWeek: 0 }
      }
      statsByRole[user.role].total++

      if (activeLastWeek.includes(user)) {
        statsByRole[user.role].activeLastWeek++
      } else if (inactiveLastWeek.includes(user)) {
        statsByRole[user.role].inactiveLastWeek++
      }

      // Por plantel
      const plantelKey = user.plantel_nombre || 'Sin plantel'
      if (!statsByPlantel[plantelKey]) {
        statsByPlantel[plantelKey] = { total: 0, activeLastWeek: 0, inactiveLastWeek: 0 }
      }
      statsByPlantel[plantelKey].total++

      if (activeLastWeek.includes(user)) {
        statsByPlantel[plantelKey].activeLastWeek++
      } else if (inactiveLastWeek.includes(user)) {
        statsByPlantel[plantelKey].inactiveLastWeek++
      }
    })

    // Mostrar resultados
    console.log('📊 ESTADÍSTICAS GENERALES')
    console.log('=' .repeat(50))
    console.log(`👥 Total de usuarios: ${users.length}`)
    console.log(`✅ Activos en la última semana: ${activeLastWeek.length}`)
    console.log(`⏰ Inactivos (más de 1 semana): ${inactiveLastWeek.length}`)
    console.log(`🚫 Nunca se han conectado: ${neverLoggedIn.length}`)
    console.log('')

    // Estadísticas por rol
    console.log('📋 ESTADÍSTICAS POR ROL')
    console.log('=' .repeat(50))
    Object.entries(statsByRole).forEach(([role, stats]) => {
      console.log(`\n🔹 ${role.toUpperCase()}:`)
      console.log(`   Total: ${stats.total}`)
      console.log(`   Activos (última semana): ${stats.activeLastWeek}`)
      console.log(`   Inactivos: ${stats.inactiveLastWeek}`)
    })

    // Estadísticas por plantel
    console.log('\n🏫 ESTADÍSTICAS POR PLANTEL')
    console.log('=' .repeat(50))
    Object.entries(statsByPlantel).forEach(([plantel, stats]) => {
      console.log(`\n🔹 ${plantel}:`)
      console.log(`   Total: ${stats.total}`)
      console.log(`   Activos (última semana): ${stats.activeLastWeek}`)
      console.log(`   Inactivos: ${stats.inactiveLastWeek}`)
    })

    // Usuarios activos en la última semana
    console.log('\n✅ USUARIOS ACTIVOS EN LA ÚLTIMA SEMANA')
    console.log('=' .repeat(50))
    if (activeLastWeek.length === 0) {
      console.log('No hay usuarios activos en la última semana')
    } else {
      activeLastWeek.forEach((user, index) => {
        const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('es-MX') : 'N/A'
        console.log(`${index + 1}. ${user.full_name} (${user.email})`)
        console.log(`   Rol: ${user.role} | Plantel: ${user.plantel_nombre}`)
        console.log(`   Último acceso: ${lastSignIn}`)
        console.log('')
      })
    }

    // Usuarios inactivos
    console.log('\n⏰ USUARIOS INACTIVOS (MÁS DE 1 SEMANA)')
    console.log('=' .repeat(50))
    if (inactiveLastWeek.length === 0) {
      console.log('No hay usuarios inactivos')
    } else {
      inactiveLastWeek.forEach((user, index) => {
        const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('es-MX') : 'N/A'
        console.log(`${index + 1}. ${user.full_name} (${user.email})`)
        console.log(`   Rol: ${user.role} | Plantel: ${user.plantel_nombre}`)
        console.log(`   Último acceso: ${lastSignIn}`)
        console.log('')
      })
    }

    // Usuarios que nunca se han conectado
    console.log('\n🚫 USUARIOS QUE NUNCA SE HAN CONECTADO')
    console.log('=' .repeat(50))
    if (neverLoggedIn.length === 0) {
      console.log('Todos los usuarios se han conectado al menos una vez')
    } else {
      neverLoggedIn.forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name} (${user.email})`)
        console.log(`   Rol: ${user.role} | Plantel: ${user.plantel_nombre}`)
        console.log(`   Creado: ${new Date(user.created_at).toLocaleString('es-MX')}`)
        console.log('')
      })
    }

    // Resumen final
    console.log('\n📈 RESUMEN FINAL')
    console.log('=' .repeat(50))
    const activePercentage = ((activeLastWeek.length / users.length) * 100).toFixed(1)
    const inactivePercentage = ((inactiveLastWeek.length / users.length) * 100).toFixed(1)
    const neverLoggedPercentage = ((neverLoggedIn.length / users.length) * 100).toFixed(1)

    console.log(`📊 Distribución de actividad:`)
    console.log(`   ✅ Activos: ${activeLastWeek.length} usuarios (${activePercentage}%)`)
    console.log(`   ⏰ Inactivos: ${inactiveLastWeek.length} usuarios (${inactivePercentage}%)`)
    console.log(`   🚫 Sin conexión: ${neverLoggedIn.length} usuarios (${neverLoggedPercentage}%)`)

  } catch (error) {
    console.error('❌ Error en el análisis:', error)
  }
}

// Ejecutar el análisis
analyzeUserActivity()
