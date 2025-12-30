import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, TrendingDown } from "lucide-react"

interface DailyAttendanceWidgetProps {
    average: number
}

export function DailyAttendanceWidget({ average }: DailyAttendanceWidgetProps) {
    // Mock logic for tendency (can be improved if we fetch yesterday's data)
    const isHigh = average >= 90

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Asistencia Diaria</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{average}%</div>
                <p className="text-xs text-muted-foreground">
                    asistencia promedio hoy
                </p>
                <div className="mt-2 flex items-center text-xs">
                    {/* Placeholder for trend */}
                    {isHigh ? (
                        <span className="text-green-500 flex items-center font-medium">
                            <TrendingUp className="h-3 w-3 mr-1" /> General
                        </span>
                    ) : (
                        <span className="text-yellow-500 flex items-center font-medium">
                            <TrendingDown className="h-3 w-3 mr-1" /> Revisar ausentismo
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
