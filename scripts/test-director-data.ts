#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

// Cargar variables de entorno desde .env
config({ path: path.join(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDirectorData() {
  console.log('🔍 Verificando datos del director...');
  
  // 1. Verificar el usuario chazzelgrojas@gmail.com
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, plantel_id, activo')
    .eq('email', 'chazzelgrojas@gmail.com')
    .single();
    
  console.log('👤 Usuario chazzelgrojas@gmail.com:', { user, error: userError });
  
  if (!user) {
    console.log('❌ Usuario no encontrado');
    return;
  }
  
  // 2. Verificar planeaciones del usuario
  const { data: planeaciones, error: planeacionesError } = await supabase
    .from('planeaciones')
    .select('id, user_id, titulo, materia, grado, created_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
    
  console.log('📝 Planeaciones del usuario:', { planeaciones, error: planeacionesError });
  
  // 3. Verificar directores del mismo plantel
  if (user.plantel_id) {
    const { data: directores, error: directoresError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, plantel_id')
      .eq('plantel_id', user.plantel_id)
      .eq('role', 'director');
      
    console.log('👨‍💼 Directores del plantel:', { directores, error: directoresError });
    
    // 4. Verificar si un director puede ver las planeaciones del plantel
    if (directores && directores.length > 0) {
      const director = directores[0];
      console.log('🔍 Probando acceso del director:', director.email);
      
      // Obtener todos los profesores del plantel
      const { data: profesoresPlantel, error: profesoresError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('plantel_id', director.plantel_id)
        .eq('role', 'profesor');
        
      console.log('👨‍🏫 Profesores del plantel:', profesoresPlantel);
      
      if (profesoresPlantel && profesoresPlantel.length > 0) {
        const profesorIds = profesoresPlantel.map(p => p.id);
        
        // Consultar planeaciones de todos los profesores del plantel
        const { data: planeacionesPlantel, error: planeacionesPlantelError } = await supabase
          .from('planeaciones')
          .select('id, user_id, titulo, materia, grado, created_at')
          .in('user_id', profesorIds)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });
          
        console.log('📋 Planeaciones del plantel visibles para el director:', { 
          count: planeacionesPlantel?.length || 0,
          planeaciones: planeacionesPlantel?.slice(0, 5), // Mostrar solo las primeras 5
          error: planeacionesPlantelError 
        });
      }
    }
  }
  
  // 5. Verificar planeaciones del mes actual
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const { data: planeacionesMes, error: planeacionesMesError } = await supabase
    .from('planeaciones')
    .select('id, user_id, titulo, materia, grado, created_at')
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString())
    .is('deleted_at', null);
    
  console.log('📅 Planeaciones del mes actual:', { 
    startOfMonth: startOfMonth.toISOString(),
    planeacionesMes, 
    error: planeacionesMesError 
  });
}

testDirectorData().catch(console.error);