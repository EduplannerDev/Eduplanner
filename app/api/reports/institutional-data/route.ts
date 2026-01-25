import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getReporteMensual } from '@/lib/reportes-institucionales'

export async function POST(req: NextRequest) {
    try {
        const { plantelId, mes, anio } = await req.json()

        if (!plantelId || mes === undefined || !anio) {
            return new Response('Faltan parámetros requeridos', { status: 400 })
        }

        const fecha = new Date(anio, mes, 15) // Mitad de mes para asegurar

        // Obtener datos agregados
        const data = await getReporteMensual(plantelId, fecha)

        return NextResponse.json(data)

    } catch (error) {
        console.error('Error fetching institutional report data:', error)
        return new Response(JSON.stringify({ error: 'Error obteniendo datos del reporte' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
