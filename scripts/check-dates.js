
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load .env
let envPath = path.resolve(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) process.env[k] = envConfig[k];
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDates() {
    console.log('=== CHECKING DATA DATES ===');

    const plantelResult = await supabase.from('planteles').select('id, nombre').ilike('nombre', '%Benito Juárez%').limit(1);
    const plantelId = plantelResult.data[0].id;
    console.log(`Plantel: ${plantelResult.data[0].nombre}`);

    // Get grupos
    const gruposResult = await supabase.from('grupos').select('id').eq('plantel_id', plantelId);
    const gruposIds = gruposResult.data.map(g => g.id);
    console.log(`Found ${gruposIds.length} grupos`);

    // Check Asistencia dates
    const asistenciaResult = await supabase.from('asistencia').select('fecha').in('grupo_id', gruposIds).order('fecha', { ascending: false }).limit(10);
    console.log('\nAsistencia Dates (most recent):');
    asistenciaResult.data.forEach(a => console.log(`  - ${a.fecha}`));

    // Check Planeaciones dates  
    const perfilesResult = await supabase.from('profiles').select('id').eq('plantel_id', plantelId).eq('role', 'profesor');
    const profIds = perfilesResult.data.map(p => p.id);

    const planeacionesResult = await supabase.from('planeaciones').select('created_at').in('user_id', profIds).order('created_at', { ascending: false }).limit(10);
    console.log('\nPlaneaciones Dates (most recent):');
    planeacionesResult.data.forEach(p => console.log(`  - ${p.created_at}`));

    console.log('\n=== EXPECTED RANGE (Ciclo 2025-2026) ===');
    console.log('Start: 2025-08-01');
    console.log('End:   2026-07-31');
}

checkDates().catch(console.error);
