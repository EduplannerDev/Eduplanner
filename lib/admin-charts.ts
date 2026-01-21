
import { createClient } from '@/lib/supabase'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameWeek, isSameMonth, subDays } from 'date-fns'
import { es } from 'date-fns/locale'

export type Period = 'week' | 'month' | 'year'

export interface ChartDataPoint {
    date: string
    fullDate: string
    value: number
    [key: string]: any
}

export interface ChartFilter {
    period: Period
    grade?: number
}

// Helper para generar rango de fechas
const getDateRange = (period: Period) => {
    const now = new Date()
    if (period === 'week') {
        return { start: subDays(now, 7), end: now }
    } else if (period === 'month') {
        return { start: subMonths(now, 1), end: now }
    } else {
        return { start: subMonths(now, 12), end: now } // year default
    }
}

// Mapa de grados
export const GRADES_MAP: Record<number, string> = {
    [-2]: '2° Preescolar',
    [-1]: '3° Preescolar',
    1: '1° Primaria',
    2: '2° Primaria',
    3: '3° Primaria',
    4: '4° Primaria',
    5: '5° Primaria',
    6: '6° Primaria',
    7: '1° Secundaria',
    8: '2° Secundaria',
    9: '3° Secundaria'
}

export async function getHistoricalData(
    table: string,
    period: Period,
    dateField: string = 'created_at',
    filters: Record<string, any> = {}
): Promise<ChartDataPoint[]> {
    const supabase = createClient()
    const { start, end } = getDateRange(period)

    let query = supabase
        .from(table)
        .select(dateField)
        .gte(dateField, start.toISOString())
        .lte(dateField, end.toISOString())

    // Aplicar filtros adicionales
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            query = query.eq(key, value)
        }
    })

    // Obtener datos crudos
    const { data, error } = await query

    if (error) {
        console.error(`Error fetching historical data for ${table}:`, error)
        return []
    }

    // Generar intervalos
    let intervals: Date[]
    if (period === 'week') {
        intervals = eachDayOfInterval({ start, end })
    } else if (period === 'month') {
        intervals = eachDayOfInterval({ start, end }) // Mostrar días del mes también
    } else {
        intervals = eachMonthOfInterval({ start, end })
    }

    // Agrupar datos
    return intervals.map(date => {
        const count = data.filter(item => {
            const itemDate = new Date(item[dateField])
            if (period === 'year') {
                return isSameMonth(itemDate, date)
            } else {
                return isSameDay(itemDate, date)
            }
        }).length

        let dateFormat = 'dd MMM'
        if (period === 'year') dateFormat = 'MMM yy'

        return {
            date: format(date, dateFormat, { locale: es }),
            fullDate: date.toISOString(),
            value: count
        }
    })
}

export async function getUsersContextCheck(period: Period, grade?: number): Promise<ChartDataPoint[]> {
    const supabase = createClient()
    const { start, end } = getDateRange(period)

    // Si hay filtro de grado, consultamos directo la tabla de contexto
    if (grade !== undefined) {
        return getHistoricalData('contexto_trabajo', period, 'created_at', { grado: grade })
    }

    // Si no es por grado, devolvemos el registro de usuarios general (profiles)
    return getHistoricalData('profiles', period)
}
