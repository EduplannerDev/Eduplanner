
import { supabase } from '../lib/supabase'

async function checkDuplicates() {
    const actividadId = 'ec457d6f-04f4-457c-84ed-09f4e1977b3b'
    const alumnoId = 'b7f2fc60-ee06-46b5-bc06-1516597cb451'

    console.log(`Checking duplicates for Activity ${actividadId} and Student ${alumnoId}`)

    const { data, error } = await supabase
        .from('calificaciones')
        .select('*')
        .eq('actividad_id', actividadId)
        .eq('alumno_id', alumnoId)

    if (error) {
        console.error('Error fetching:', error)
        return
    }

    console.log(`Found ${data.length} records:`)
    console.log(JSON.stringify(data, null, 2))
}

checkDuplicates()
