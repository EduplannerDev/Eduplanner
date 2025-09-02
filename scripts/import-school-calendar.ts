#!/usr/bin/env tsx

import { config } from 'dotenv'
import { importSchoolCalendarForAllUsers } from '../lib/calendar-import'
import path from 'path'

// Cargar variables de entorno desde .env.local
config({ path: path.join(process.cwd(), '.env.local') })

async function main() {
  try {
    // Ruta al archivo ICS
    const icsFilePath = path.join(process.cwd(), 'i5NON5jRg3-2025-2026_Basica.ics')
    
    console.log('='.repeat(60))
    console.log('IMPORTACIÓN DE CALENDARIO ESCOLAR 2025-2026')
    console.log('='.repeat(60))
    console.log(`Archivo ICS: ${icsFilePath}`)
    console.log('')
    
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL no está configurada')
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada')
    }
    
    // Ejecutar la importación
    await importSchoolCalendarForAllUsers(icsFilePath)
    
    console.log('')
    console.log('='.repeat(60))
    console.log('✅ IMPORTACIÓN COMPLETADA EXITOSAMENTE')
    console.log('='.repeat(60))
    console.log('')
    console.log('El calendario escolar 2025-2026 ha sido cargado para todos los usuarios.')
    console.log('Los eventos incluyen:')
    console.log('- Consejos Técnicos Escolares')
    console.log('- Eventos escolares importantes')
    console.log('- Fechas administrativas')
    console.log('')
    console.log('Todos los eventos están marcados con el hashtag #calendario-escolar')
    console.log('para facilitar su identificación y gestión.')
    
  } catch (error) {
    console.error('')
    console.error('='.repeat(60))
    console.error('❌ ERROR EN LA IMPORTACIÓN')
    console.error('='.repeat(60))
    console.error('Error:', error)
    console.error('')
    
    if (error instanceof Error) {
      if (error.message.includes('SUPABASE')) {
        console.error('💡 Asegúrate de que las variables de entorno de Supabase estén configuradas:')
        console.error('   - NEXT_PUBLIC_SUPABASE_URL')
        console.error('   - SUPABASE_SERVICE_ROLE_KEY')
      } else if (error.message.includes('ICS')) {
        console.error('💡 Verifica que el archivo ICS esté en la raíz del proyecto:')
        console.error('   - i5NON5jRg3-2025-2026_Basica.ics')
      }
    }
    
    process.exit(1)
  }
}

// Ejecutar el script
main()