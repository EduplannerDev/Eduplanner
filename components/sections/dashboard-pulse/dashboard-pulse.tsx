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
import { TeachersComplianceWidget } from "./teachers-compliance-widget"
import { DailyAttendanceWidget } from "./daily-attendance-widget"
import { SecurityTrafficLightWidget } from "./security-traffic-light-widget"
import { ImmediateAttentionList } from "./immediate-attention-list"
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
            const [compliance, security, attendance, risks] = await Promise.all([
                getWeeklyPlanningCompliance(plantelId),
                getDailySecuritySummary(plantelId),
                getDailyAttendanceAverage(plantelId),
                getHighRiskStudents(plantelId)
            ])

            setComplianceData(compliance)
            setSecurityData(security)
            setAttendanceData(attendance)
            setRiskStudents(risks)

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {complianceData && <TeachersComplianceWidget data={complianceData} />}
                <DailyAttendanceWidget average={attendanceData} />
                <SecurityTrafficLightWidget data={securityData} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-4">
                    {/* Future widget: Recent Activity Graph or similar */}
                    {/* For now we can render the existing 'ImmediateAttentionList' spanning full or part */}
                    <ImmediateAttentionList students={riskStudents} />
                </div>
                <div className="xl:col-span-1">
                    {/* Placeholder for small widget or announcements */}
                </div>
            </div>
        </div>
    )
}
