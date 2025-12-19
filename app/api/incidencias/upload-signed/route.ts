import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const incidentId = formData.get('incidentId') as string
        const plantelId = formData.get('plantelId') as string

        if (!file || !incidentId || !plantelId) {
            return new Response('Faltan parámetros requeridos', { status: 400 })
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            return new Response('Solo se permiten archivos PDF', { status: 400 })
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return new Response('El archivo no debe superar 10MB', { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Generate unique filename
        const timestamp = Date.now()
        const fileName = `${plantelId}/${incidentId}_${timestamp}.pdf`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('incidencias-firmadas')
            .upload(fileName, file, {
                contentType: 'application/pdf',
                upsert: false
            })

        if (uploadError) {
            console.error('Error uploading file:', uploadError)
            return new Response(JSON.stringify({ error: uploadError.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('incidencias-firmadas')
            .getPublicUrl(fileName)

        // Update incident record
        const { error: updateError } = await supabase
            .from('incidencias')
            .update({
                acta_firmada_url: urlData.publicUrl,
                estado: 'firmado'
            })
            .eq('id', incidentId)

        if (updateError) {
            console.error('Error updating incident:', updateError)
            // Try to delete uploaded file if DB update fails
            await supabase.storage.from('incidencias-firmadas').remove([fileName])
            return new Response(JSON.stringify({ error: updateError.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        return Response.json({
            success: true,
            url: urlData.publicUrl,
            message: 'Acta firmada subida exitosamente'
        })

    } catch (error) {
        console.error('Error in upload-signed API:', error)
        return new Response(JSON.stringify({ error: 'Error procesando solicitud' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
