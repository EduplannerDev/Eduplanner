import { useEffect, useState } from "react"
import { useRoles } from "@/hooks/use-roles"
import {
    getWeeklyPlanningCompliance,
    getDailySecuritySummary,
    getDailyAttendanceAverage,
    getHighRiskStudents,
    TeachersComplianceData,
    SecuritySummaryData,
    HighRiskStudentData
} from "@/lib/dashboard-pulse"
import {
    getPromedioGeneralPlantel,
    getCalificacionesPendientes,
    getActividadesProximas,
    PromedioGeneralData,
    CalificacionesPendientesData,
    ActividadProxima
} from "@/lib/dashboard-evaluaciones"
import { TeachersComplianceWidget } from "./teachers-compliance-widget"
import { DailyAttendanceWidget } from "./daily-attendance-widget"
import { SecurityTrafficLightWidget } from "./security-traffic-light-widget"
import { ImmediateAttentionList } from "./immediate-attention-list"
import { PromedioGeneralWidget } from "./promedio-general-widget"
import { CalificacionesPendientesWidget } from "./calificaciones-pendientes-widget"
import { ActividadesProximasWidget } from "./actividades-proximas-widget"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardPulse() {
    const { plantel, loading: rolesLoading } = useRoles()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [complianceData, setComplianceData] = useState<TeachersComplianceData | null>(null)
    const [securityData, setSecurityData] = useState<SecuritySummaryData[]>([])
    const [attendanceData, setAttendanceData] = useState<number>(0)
    const [riskStudents, setRiskStudents] = useState<HighRiskStudentData[]>([])

    // New evaluation widgets data
    const [promedioData, setPromedioData] = useState<PromedioGeneralData | null>(null)
    const [pendientesData, setPendientesData] = useState<CalificacionesPendientesData | null>(null)
    const [proximasData, setProximasData] = useState<ActividadProxima[]>([])

    useEffect(() => {
        if (!rolesLoading && plantel?.id) {
            fetchData(plantel.id)
        }
    }, [plantel?.id, rolesLoading])

    const fetchData = async (plantelId: string) => {
        try {
            setLoading(true)
            setError(null)

            // Execute queries in parallel
            const [compliance, security, attendance, risks, promedio, pendientes, proximas] = await Promise.all([
                getWeeklyPlanningCompliance(plantelId),
                getDailySecuritySummary(plantelId),
                getDailyAttendanceAverage(plantelId),
                getHighRiskStudents(plantelId),
                getPromedioGeneralPlantel(plantelId),
                getCalificacionesPendientes(plantelId),
                getActividadesProximas(plantelId)
            ])

            setComplianceData(compliance)
            setSecurityData(security)
            setAttendanceData(attendance)
            setRiskStudents(risks)
            setPromedioData(promedio)
            setPendientesData(pendientes)
            setProximasData(proximas)

        } catch (err) {
            console.error("Failed to load pulse data", err)
            setError("Error al cargar los datos del pulso en tiempo real.")
        } finally {
            setLoading(false)
        }
    }

    if (loading || rolesLoading) {
        return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-[140px] rounded-xl" />
            <Skeleton className="h-[140px] rounded-xl" />
            <Skeleton className="h-[140px] rounded-xl" />
            <Skeleton className="h-[300px] col-span-full rounded-xl" />
        </div>
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* First Row: Main KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {complianceData && <TeachersComplianceWidget data={complianceData} />}
                <DailyAttendanceWidget average={attendanceData} />
                <SecurityTrafficLightWidget data={securityData} />
            </div>

            {/* Second Row: Evaluation Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {promedioData && <PromedioGeneralWidget data={promedioData} />}
                {pendientesData && <CalificacionesPendientesWidget data={pendientesData} />}
                <ActividadesProximasWidget actividades={proximasData} />
            </div>

            {/* Third Row: Lists and Details */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-4">
                    <ImmediateAttentionList students={riskStudents} />
                </div>
                <div className="xl:col-span-1">
                    {/* Placeholder for future widget */}
                </div>
            </div>
        </div>
    )
}
