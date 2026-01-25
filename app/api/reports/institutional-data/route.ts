import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getReportePorRango } from '@/lib/reportes-institucionales'
import { startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

export async function POST(req: NextRequest) {
    try {
        const { plantelId, tipoReporte, periodo, anio } = await req.json()

        if (!plantelId || !tipoReporte || !anio) {
            return new Response('Faltan parámetros requeridos', { status: 400 })
        }

        let fechaInicio: Date
        let fechaFin: Date
        let tituloPeriodo = ''

        const year = parseInt(anio)

        if (tipoReporte === 'mensual') {
            const mes = parseInt(periodo) // 0-11
            fechaInicio = startOfMonth(new Date(year, mes))
            fechaFin = endOfMonth(new Date(year, mes))
            tituloPeriodo = fechaInicio.toLocaleDateString('es-MX', { month: 'long', locale: es })
            tituloPeriodo = tituloPeriodo.charAt(0).toUpperCase() + tituloPeriodo.slice(1)
        }
        else if (tipoReporte === 'trimestral') {
            // T1: Ago-Oct, T2: Nov-Ene, T3: Feb-Abr
            if (periodo === '1') {
                fechaInicio = new Date(year, 7, 1) // Ago
                fechaFin = endOfMonth(new Date(year, 9)) // Oct
                tituloPeriodo = '1º Trimestre (Ago-Oct)'
            } else if (periodo === '2') {
                fechaInicio = new Date(year, 10, 1) // Nov
                fechaFin = endOfMonth(new Date(year + 1, 0)) // Ene sig año
                tituloPeriodo = '2º Trimestre (Nov-Ene)'
            } else {
                fechaInicio = new Date(year + 1, 1, 1) // Feb
                fechaFin = endOfMonth(new Date(year + 1, 3)) // Abr
                tituloPeriodo = '3º Trimestre (Feb-Abr)'
            }
        }
        else if (tipoReporte === 'cuatrimestral') {
            // C1: Sep-Dic, C2: Ene-Abr, C3: May-Ago
            if (periodo === '1') {
                fechaInicio = new Date(year, 8, 1) // Sep
                fechaFin = endOfMonth(new Date(year, 11)) // Dic
                tituloPeriodo = '1º Cuatrimestre (Sep-Dic)'
            } else if (periodo === '2') {
                fechaInicio = new Date(year + 1, 0, 1) // Ene
                fechaFin = endOfMonth(new Date(year + 1, 3)) // Abr
                tituloPeriodo = '2º Cuatrimestre (Ene-Abr)'
            } else {
                fechaInicio = new Date(year + 1, 4, 1) // May
                fechaFin = endOfMonth(new Date(year + 1, 7)) // Ago
                tituloPeriodo = '3º Cuatrimestre (May-Ago)'
            }
        }
        else if (tipoReporte === 'semestral') {
            // S1: Ago-Ene, S2: Feb-Jul
            if (periodo === '1') {
                fechaInicio = new Date(year, 7, 1) // Ago
                fechaFin = endOfMonth(new Date(year + 1, 0)) // Ene
                tituloPeriodo = '1º Semestre (Ago-Ene)'
            } else {
                fechaInicio = new Date(year + 1, 1, 1) // Feb
                fechaFin = endOfMonth(new Date(year + 1, 6)) // Jul
                tituloPeriodo = '2º Semestre (Feb-Jul)'
            }
        }
        else if (tipoReporte === 'anual') {
            // Ciclo Ago-Jul
            fechaInicio = new Date(year, 7, 1)
            fechaFin = endOfMonth(new Date(year + 1, 6))
            tituloPeriodo = `Ciclo Escolar ${year}-${year + 1}`
        } else {
            return new Response('Tipo de reporte no válido', { status: 400 })
        }

        // Obtener datos agregados
        const data = await getReportePorRango(plantelId, fechaInicio, fechaFin, tituloPeriodo)

        return NextResponse.json(data)

    } catch (error) {
        console.error('Error fetching institutional report data:', error)
        return new Response(JSON.stringify({ error: 'Error obteniendo datos del reporte' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
