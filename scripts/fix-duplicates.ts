
import { createClient } from '@supabase/supabase-js'

// Hardcoded credentials to bypass .env issues in script execution
const supabaseUrl = 'https://vxcvhmjvaxitxrvnggcm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4Y3ZobWp2YXhpdHhydm5nZ2NtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDExMDg5MiwiZXhwIjoyMDY5Njg2ODkyfQ.-4Rh_aJtr0bit4n8p4cfiflA4E4I-nncr5nxXf5bgQk'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixDuplicates() {
    const actividadId = 'ec457d6f-04f4-457c-84ed-09f4e1977b3b'
    const alumnoId = 'b7f2fc60-ee06-46b5-bc06-1516597cb451'

    console.log(`Checking duplicates for Activity ${actividadId} and Student ${alumnoId}`)

    const { data, error } = await supabase
        .from('calificaciones')
        .select('*')
        .eq('actividad_id', actividadId)
        .eq('alumno_id', alumnoId)
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('Error fetching:', error)
        return
    }

    console.log(`Found ${data.length} records.`)

    if (data.length <= 1) {
        console.log('No duplicates found (or only 1 record).')
        return
    }

    // Keep the first one (most recent due to order), delete the rest
    const toKeep = data[0]
    const toDelete = data.slice(1)

    console.log(`Keeping record: ${toKeep.id} (Grade: ${toKeep.calificacion})`)

    const idsToDelete = toDelete.map(r => r.id)
    console.log(`Deleting ${idsToDelete.length} records...`)

    const { error: deleteError } = await supabase
        .from('calificaciones')
        .delete()
        .in('id', idsToDelete)

    if (deleteError) {
        console.error('Error deleting:', deleteError)
    } else {
        console.log('Successfully deleted duplicates.')
    }
}

fixDuplicates()
