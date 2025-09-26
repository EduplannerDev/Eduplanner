import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

async function diagnoseInstrumentosTable() {
  console.log('🔍 Iniciando diagnóstico de la tabla instrumentos_evaluacion...\n')

  // Verificar variables de entorno
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variables de entorno faltantes:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return
  }

  // Crear cliente de Supabase con credenciales de servicio
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. Verificar si la tabla existe y es accesible
    console.log('1️⃣ Verificando acceso a la tabla...')
    const { data: tableTest, error: tableError } = await supabase
      .from('instrumentos_evaluacion')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('❌ Error accediendo a la tabla:', tableError)
      return
    }
    console.log('✅ Tabla accesible')

    // 2. Obtener información del esquema de la tabla
    console.log('\n2️⃣ Obteniendo información del esquema...')
    const { data: schemaInfo, error: schemaError } = await supabase
      .rpc('get_table_schema', { table_name: 'instrumentos_evaluacion' })
      .catch(async () => {
        // Si la función RPC no existe, usar una consulta directa
        const { data, error } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', 'instrumentos_evaluacion')
          .eq('table_schema', 'public')
        
        return { data, error }
      })

    if (schemaError) {
      console.log('⚠️ No se pudo obtener información del esquema:', schemaError.message)
    } else if (schemaInfo) {
      console.log('📋 Columnas encontradas:')
      schemaInfo.forEach((col: any) => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
    }

    // 3. Verificar específicamente la columna profesor_id
    console.log('\n3️⃣ Verificando columna profesor_id específicamente...')
    
    // Intentar una consulta que incluya profesor_id
    const { data: profesorIdTest, error: profesorIdError } = await supabase
      .from('instrumentos_evaluacion')
      .select('id, profesor_id')
      .limit(1)

    if (profesorIdError) {
      console.error('❌ Error al consultar profesor_id:', profesorIdError)
      console.error('   Código de error:', profesorIdError.code)
      console.error('   Mensaje:', profesorIdError.message)
    } else {
      console.log('✅ Columna profesor_id accesible')
    }

    // 4. Intentar inserción de prueba
    console.log('\n4️⃣ Probando inserción de prueba...')
    
    // Primero obtener un proyecto existente
    const { data: proyectos, error: proyectosError } = await supabase
      .from('proyectos')
      .select('id, profesor_id')
      .limit(1)

    if (proyectosError || !proyectos || proyectos.length === 0) {
      console.log('⚠️ No se encontraron proyectos para la prueba')
      return
    }

    const proyecto = proyectos[0]
    console.log(`   Usando proyecto: ${proyecto.id}`)
    console.log(`   Profesor ID: ${proyecto.profesor_id}`)

    // Intentar inserción con profesor_id
    const testData = {
      proyecto_id: proyecto.id,
      profesor_id: proyecto.profesor_id,
      tipo: 'rubrica_analitica' as const,
      titulo: 'Test de Diagnóstico',
      contenido: { test: true },
      estado: 'borrador'
    }

    console.log('   Datos de prueba:', testData)

    const { data: insertResult, error: insertError } = await supabase
      .from('instrumentos_evaluacion')
      .insert(testData)
      .select()

    if (insertError) {
      console.error('❌ Error en inserción de prueba:', insertError)
      console.error('   Código:', insertError.code)
      console.error('   Mensaje:', insertError.message)
      console.error('   Detalles:', insertError.details)
      console.error('   Hint:', insertError.hint)
    } else {
      console.log('✅ Inserción de prueba exitosa')
      console.log('   ID generado:', insertResult[0]?.id)
      
      // Limpiar el registro de prueba
      if (insertResult[0]?.id) {
        await supabase
          .from('instrumentos_evaluacion')
          .delete()
          .eq('id', insertResult[0].id)
        console.log('🧹 Registro de prueba eliminado')
      }
    }

    // 5. Verificar políticas RLS
    console.log('\n5️⃣ Verificando políticas RLS...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, permissive, roles, cmd, qual')
      .eq('tablename', 'instrumentos_evaluacion')
      .catch(() => ({ data: null, error: { message: 'No se pudo acceder a pg_policies' } }))

    if (policiesError) {
      console.log('⚠️ No se pudieron obtener las políticas RLS:', policiesError.message)
    } else if (policies) {
      console.log('🔒 Políticas RLS encontradas:')
      policies.forEach((policy: any) => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`)
      })
    }

  } catch (error) {
    console.error('💥 Error general en el diagnóstico:', error)
  }

  console.log('\n🏁 Diagnóstico completado')
}

// Ejecutar el diagnóstico
diagnoseInstrumentosTable().catch(console.error)