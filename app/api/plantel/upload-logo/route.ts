import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const plantelId = formData.get('plantelId') as string

        if (!file || !plantelId) {
            return new Response('Faltan parámetros requeridos', { status: 400 })
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return new Response('Solo se permiten archivos de imagen', { status: 400 })
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return new Response('El archivo no debe superar 5MB', { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${plantelId}/logo_${Date.now()}.${fileExt}`

        // Upload to Supabase Storage
        // Usaremos el bucket 'plantel-assets' que ya existe por migración
        const { error: uploadError } = await supabase.storage
            .from('plantel-assets')
            .upload(fileName, file, {
                contentType: file.type,
                upsert: true
            })

        if (uploadError) {
            console.error('Error uploading file:', uploadError)
            return new Response(JSON.stringify({ error: 'Error al subir la imagen: ' + uploadError.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('plantel-assets')
            .getPublicUrl(fileName)

        // Update plantel record
        const { error: updateError } = await supabase
            .from('planteles')
            .update({
                logo_url: urlData.publicUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', plantelId)

        if (updateError) {
            console.error('Error updating plantel:', updateError)
            return new Response(JSON.stringify({ error: updateError.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            message: 'Logo actualizado exitosamente'
        })

    } catch (error) {
        console.error('Error in upload-logo API:', error)
        return new Response(JSON.stringify({ error: 'Error procesando solicitud' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
