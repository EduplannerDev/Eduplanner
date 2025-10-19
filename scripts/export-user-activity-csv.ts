import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

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

function escapeCSVField(field: string | null): string {
  if (field === null || field === undefined) return ''
  const str = String(field)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function generateCSV(users: UserProfile[], filename: string, title: string) {
  const headers = [
    'ID',
    'Nombre Completo',
    'Email',
    'Rol',
    'Plantel',
    'Fecha de Creación',
    'Último Acceso',
    'Email Confirmado',
    'Estado'
  ]

  const csvContent = [
    headers.join(','),
    ...users.map(user => [
      escapeCSVField(user.id),
      escapeCSVField(user.full_name),
      escapeCSVField(user.email),
      escapeCSVField(user.role),
      escapeCSVField(user.plantel_nombre),
      escapeCSVField(new Date(user.created_at).toLocaleDateString('es-MX')),
      escapeCSVField(user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('es-MX') : 'Nunca'),
      escapeCSVField(user.email_confirmed_at ? 'Sí' : 'No'),
      escapeCSVField(user.is_active ? 'Activo' : 'Inactivo')
    ].join(','))
  ].join('\n')

  const outputPath = path.join(__dirname, '..', 'exports', filename)
  
  // Crear directorio exports si no existe
  const exportsDir = path.dirname(outputPath)
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, csvContent, 'utf-8')
  console.log(`✅ ${title} exportado a: ${outputPath}`)
  console.log(`   📊 Total de registros: ${users.length}`)
}

async function exportUserActivityToCSV() {
  try {
    console.log('🔍 Exportando actividad de usuarios a CSV...')
    console.log('')

    // Obtener todos los perfiles
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

    // Obtener información de autenticación de auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error obteniendo usuarios de auth:', authError)
      return
    }

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
    const inactiveUsers: UserProfile[] = []

    users.forEach(user => {
      if (!user.last_sign_in_at) {
        // Usuarios que nunca se han conectado
        inactiveUsers.push(user)
      } else {
        const lastSignIn = new Date(user.last_sign_in_at)
        if (lastSignIn >= oneWeekAgo) {
          // Usuarios activos en la última semana
          activeLastWeek.push(user)
        } else {
          // Usuarios inactivos (más de 1 semana)
          inactiveUsers.push(user)
        }
      }
    })

    // Generar archivos CSV
    console.log('📁 Generando archivos CSV...')
    console.log('')

    // CSV de usuarios activos
    generateCSV(
      activeLastWeek, 
      'usuarios_activos.csv', 
      'Usuarios Activos (Última Semana)'
    )

    // CSV de usuarios inactivos
    generateCSV(
      inactiveUsers, 
      'usuarios_inactivos.csv', 
      'Usuarios Inactivos y Sin Conexión'
    )

    // Resumen final
    console.log('')
    console.log('📊 RESUMEN DE EXPORTACIÓN')
    console.log('=' .repeat(50))
    console.log(`✅ Usuarios activos exportados: ${activeLastWeek.length}`)
    console.log(`⏰ Usuarios inactivos exportados: ${inactiveUsers.length}`)
    console.log(`📁 Archivos guardados en: ./exports/`)
    console.log('')
    console.log('📋 Archivos generados:')
    console.log('   • usuarios_activos.csv')
    console.log('   • usuarios_inactivos.csv')

  } catch (error) {
    console.error('❌ Error en la exportación:', error)
  }
}

// Ejecutar la exportación
exportUserActivityToCSV()
