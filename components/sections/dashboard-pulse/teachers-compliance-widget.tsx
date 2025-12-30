import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface TeachersComplianceWidgetProps {
    data: {
        total_enviadas: number
        total_profesores: number
        porcentaje: number
    }
}

export function TeachersComplianceWidget({ data }: TeachersComplianceWidgetProps) {
    const { total_enviadas, total_profesores, porcentaje } = data

    const isGood = porcentaje >= 80
    const isWarning = porcentaje >= 50 && porcentaje < 80

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cumplimiento de Planeaciones</CardTitle>
                {isGood ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {total_enviadas} <span className="text-sm text-muted-foreground font-normal">/ {total_profesores}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                    planeaciones enviadas esta semana
                </p>
                <div className="mt-3 space-y-1">
                    <Progress
                        value={porcentaje}
                        className={`h-2 ${isGood ? "bg-primary/20" : "bg-destructive/20"} [&>div]:${isGood ? "bg-green-500" : (isWarning ? "bg-yellow-500" : "bg-red-500")}`}
                    />
                    <p className="text-xs text-right text-muted-foreground">{porcentaje}%</p>
                </div>
            </CardContent>
        </Card>
    )
}
