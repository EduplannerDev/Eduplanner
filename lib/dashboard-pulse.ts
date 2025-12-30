import { supabase } from "@/lib/supabase"

export interface TeachersComplianceData {
  total_enviadas: number
  total_profesores: number
  porcentaje: number
}

export interface SecuritySummaryData {
  nivel_riesgo: string
  cantidad: number
}

export interface HighRiskStudentData {
  alumno_id: string
  nombre_completo: string
  grupo: string
  motivo: string
  nivel_riesgo: string
}

export interface RecentTeacherActivityData {
  profesor_id: string
  nombre_completo: string
  ultima_actividad: string
}

export async function getWeeklyPlanningCompliance(plantelId: string): Promise<TeachersComplianceData> {
  const { data, error } = await supabase
    .rpc('get_cumplimiento_planeaciones_semanal', { p_plantel_id: plantelId })
    .single()

  if (error) {
    console.error('Error fetching planning compliance:', JSON.stringify(error, null, 2))
    return { total_enviadas: 0, total_profesores: 0, porcentaje: 0 }
  }

  return data as TeachersComplianceData
}

export async function getDailySecuritySummary(plantelId: string): Promise<SecuritySummaryData[]> {
  const { data, error } = await supabase
    .rpc('get_resumen_seguridad_diario', { p_plantel_id: plantelId })

  if (error) {
    console.error('Error fetching security summary:', JSON.stringify(error, null, 2))
    return []
  }

  return data as SecuritySummaryData[]
}

export async function getDailyAttendanceAverage(plantelId: string): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_asistencia_diaria_plantel', { p_plantel_id: plantelId })

  if (error) {
    console.error('Error fetching attendance average:', JSON.stringify(error, null, 2))
    return 0
  }

  return Number(data)
}

export async function getHighRiskStudents(plantelId: string, limit = 5): Promise<HighRiskStudentData[]> {
  const { data, error } = await supabase
    .rpc('get_alertas_riesgo_siat', { p_plantel_id: plantelId, p_limit: limit })

  if (error) {
    console.error('Error fetching high risk students:', JSON.stringify(error, null, 2))
    return []
  }

  return data as HighRiskStudentData[]
}

export async function getRecentTeacherActivity(plantelId: string, limit = 5): Promise<RecentTeacherActivityData[]> {
  const { data, error } = await supabase
    .rpc('get_profesores_activos_recientes', { p_plantel_id: plantelId, p_limit: limit })

  if (error) {
    console.error('Error fetching recent teacher activity:', JSON.stringify(error, null, 2))
    return []
  }

  return data as RecentTeacherActivityData[]
}
