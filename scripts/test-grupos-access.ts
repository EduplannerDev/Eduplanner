// Script para probar el acceso a grupos después de la corrección RLS
// Este script ayuda a verificar si los usuarios ven solo sus propios grupos

import { supabase } from '../lib/supabase'
import { getGruposByOwner } from '../lib/grupos'

async function testGruposAccess() {
  console.log('🔍 Probando acceso a grupos después de la corrección RLS...\n')
  
  try {
    // Obtener el usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Error de autenticación:', authError)
      console.log('💡 Asegúrate de estar autenticado en la aplicación')
      return
    }
    
    console.log('👤 Usuario actual:', user.email)
    
    // Obtener información del perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, plantel_id, full_name')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Error obteniendo perfil:', profileError)
      return
    }
    
    console.log(`👨‍🏫 Rol: ${profile.role}`)
    console.log(`🏫 Plantel ID: ${profile.plantel_id}`)
    console.log(`📝 Nombre: ${profile.full_name}\n`)
    
    // 1. Probar consulta directa sin filtros (RLS debería aplicar automáticamente)
    console.log('📋 Test 1: Consulta directa sin filtros (RLS activo):')
    const { data: gruposSinFiltro, error: errorSinFiltro } = await supabase
      .from('grupos')
      .select('id, nombre, user_id, plantel_id, activo')
      .order('created_at', { ascending: false })
    
    if (errorSinFiltro) {
      console.error('❌ Error sin filtro:', errorSinFiltro)
    } else {
      console.log(`📊 Grupos encontrados: ${gruposSinFiltro?.length || 0}`)
      if (gruposSinFiltro && gruposSinFiltro.length > 0) {
        gruposSinFiltro.forEach(grupo => {
          const esMio = grupo.user_id === user.id
          const emoji = esMio ? '✅' : '❌'
          console.log(`  ${emoji} ${grupo.nombre} (Owner: ${esMio ? 'YO' : grupo.user_id})`)
        })
        
        // Verificar si hay grupos que no son del usuario
        const gruposAjenos = gruposSinFiltro.filter(g => g.user_id !== user.id)
        if (gruposAjenos.length > 0) {
          console.log(`\n⚠️  PROBLEMA: Se encontraron ${gruposAjenos.length} grupos que NO son del usuario`)
          console.log('   Esto indica que RLS no está funcionando correctamente')
        } else {
          console.log('\n✅ CORRECTO: Solo se muestran grupos del usuario')
        }
      }
    }
    
    // 2. Probar usando la función getGruposByOwner
    console.log('\n📋 Test 2: Usando función getGruposByOwner():')
    try {
      const gruposFunction = await getGruposByOwner(user.id)
      console.log(`📊 Grupos encontrados: ${gruposFunction.length}`)
      gruposFunction.forEach(grupo => {
        const esMio = grupo.user_id === user.id
        const emoji = esMio ? '✅' : '❌'
        console.log(`  ${emoji} ${grupo.nombre} (Owner: ${esMio ? 'YO' : grupo.user_id})`)
      })
      
      // Verificar consistencia
      const gruposAjenos = gruposFunction.filter(g => g.user_id !== user.id)
      if (gruposAjenos.length > 0) {
        console.log(`\n⚠️  PROBLEMA: getGruposByOwner devolvió ${gruposAjenos.length} grupos ajenos`)
      } else {
        console.log('\n✅ CORRECTO: getGruposByOwner solo devuelve grupos del usuario')
      }
    } catch (error) {
      console.error('❌ Error en getGruposByOwner:', error)
    }
    
    // Obtener información del perfil del usuario
    console.log('\n👤 Información del perfil:')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, plantel_id')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Error obteniendo perfil:', profileError)
    } else {
      console.log(`  - Rol: ${profile?.role}`)
      console.log(`  - Plantel ID: ${profile?.plantel_id}`)
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar el test
testGruposAccess()