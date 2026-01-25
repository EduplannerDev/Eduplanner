
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
let envPath = path.resolve(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
    console.log('.env.local not found, checking .env...');
    envPath = path.resolve(__dirname, '../.env');
}

if (fs.existsSync(envPath)) {
    console.log(`Loading ${path.basename(envPath)}...`);
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    console.warn('No .env file found!');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugReportData() {
    console.log('--- Debugging Report Data ---');

    // 1. Get a plantel by name (from screenshot)
    // @ts-ignore
    const { data: planteles } = await supabase
        .from('planteles')
        .select('id, nombre')
        .ilike('nombre', '%Benito Juárez%')
        .limit(1);

    // @ts-ignore
    if (!planteles || planteles.length === 0) {
        console.log('No planteles found.');
        return;
    }
    // @ts-ignore
    const plantelId = planteles[0].id;
    // @ts-ignore
    console.log(`Checking Plantel: ${planteles[0].nombre} (${plantelId})`);

    // 2. Check Grupos
    const { data: grupos, error: errorGrupos } = await supabase
        .from('grupos')
        .select('*')
        // Try querying with the assumed column
        .eq('plantel_id', plantelId); // This might fail if column doesn't exist

    if (errorGrupos) {
        console.error('Error fetching grupos:', errorGrupos.message);
        // Fallback: Check if we can get groups via user_plantel_assignments?
        // But the code relies on 'plantel_id' column in 'grupos'.
    } else {
        console.log(`Grupos found: ${grupos.length}`);
        if (grupos.length === 0) {
            console.log('!!! NO GRUPOS FOUND for this plantel_id !!!');
            console.log('Query used: .eq("plantel_id", "' + plantelId + '")');
        } else {
            console.log('Sample Grupo:', grupos[0]);
            // @ts-ignore
            const gruposIds = grupos.map(g => g.id);

            // 3. Check Asistencia
            const { count: asistenciaCount } = await supabase
                .from('asistencia')
                .select('*', { count: 'exact', head: true })
                .in('grupo_id', gruposIds);
            console.log(`Total Asistencia records for these groups: ${asistenciaCount}`);

            // Check dates
            const { data: asistenciaSample } = await supabase
                .from('asistencia')
                .select('fecha')
                .in('grupo_id', gruposIds)
                .order('fecha', { ascending: false })
                .limit(5);

            if (asistenciaSample && asistenciaSample.length > 0) {
                console.log('Sample Asistencia Dates:', asistenciaSample.map(a => a.fecha));
            }
        }
    }

    // 4.1 Fetch Professors (from Assignments AND Profiles)
    console.log('Fetching professors from user_plantel_assignments...');
    const { data: asignaciones } = await supabase
        .from('user_plantel_assignments')
        .select('user_id, role')
        .eq('plantel_id', plantelId)
        .eq('role', 'profesor')
        .eq('activo', true);

    console.log('Fetching professors from profiles...');
    // @ts-ignore
    const { data: perfiles } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('plantel_id', plantelId)
    // Removed role filter to see if ANYONE is linked

    console.log('!!! CRITICAL CHECK !!!');
    console.log(`Profiles linked to plantel: ${perfiles ? perfiles.length : 0}`);
    if (perfiles && perfiles.length > 0) console.log('First profile role:', perfiles[0].role);

    // @ts-ignore
    const assignedIds = asignaciones ? asignaciones.map(a => a.user_id) : [];
    // @ts-ignore
    const profileIds = perfiles ? perfiles.map(p => p.id) : [];

    // Merge and unique
    // @ts-ignore
    const allProfesorIds = [...new Set([...assignedIds, ...profileIds])];

    console.log(`Profesores assigned (Assignments): ${assignedIds.length}`);
    console.log(`Profesores assigned (Profiles): ${profileIds.length}`);
    console.log(`Total Unique Professors: ${allProfesorIds.length}`);

    if (allProfesorIds.length > 0) {

        // 4.2 Fetch Groups via Professors
        const { data: gruposProfs } = await supabase
            .from('grupos')
            .select('*')
            .in('user_id', allProfesorIds);

        console.log(`Grupos found via Professors: ${gruposProfs ? gruposProfs.length : 0}`);

        if (gruposProfs && gruposProfs.length > 0) {
            // @ts-ignore
            const gruposIds = gruposProfs.map(g => g.id);

            // 4.3 Check Asistencia
            const { count: asistenciaCount } = await supabase
                .from('asistencia')
                .select('*', { count: 'exact', head: true })
                .in('grupo_id', gruposIds);
            console.log(`[NEW LOGIC] Total Asistencia: ${asistenciaCount}`);
        } else {
            console.log('[NEW LOGIC] No groups found for these professors.');
        }

        // 4.4 Check Planeaciones
        const { count: planeacionesCount, error: planError } = await supabase
            .from('planeaciones')
            .select('*', { count: 'exact', head: true })
            .in('user_id', allProfesorIds);

        if (planError) console.error('Error fetching planeaciones:', planError);
        console.log(`[NEW LOGIC] Total Planeaciones: ${planeacionesCount}`);
    } else {
        console.log('[NEW LOGIC] No active professors found in EITHER table.');
    }
}

debugReportData().catch(console.error);
