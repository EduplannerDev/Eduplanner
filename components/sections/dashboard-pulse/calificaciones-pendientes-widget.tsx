import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardCheck, AlertCircle, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { CalificacionesPendientesData } from "@/lib/dashboard-evaluaciones"

interface CalificacionesPendientesWidgetProps {
    data: CalificacionesPendientesData
}

export function CalificacionesPendientesWidget({ data }: CalificacionesPendientesWidgetProps) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    Calificaciones Pendientes
                </CardTitle>
                <CardDescription>Estado de evaluaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Actividades calificadas</span>
                        <span className="font-semibold">{data.porcentajeCalificado}%</span>
                    </div>
                    <Progress value={data.porcentajeCalificado} className="h-2" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-orange-600" />
                            <p className="text-xs text-orange-900 dark:text-orange-200 font-medium">Pendientes</p>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">{data.actividadesPendientes}</p>
                    </div>

                    {data.actividadesVencidas > 0 && (
                        <div className="space-y-1 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                            <div className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3 text-red-600" />
                                <p className="text-xs text-red-900 dark:text-red-200 font-medium">Vencidas</p>
                            </div>
                            <p className="text-2xl font-bold text-red-600">{data.actividadesVencidas}</p>
                        </div>
                    )}
                </div>

                {/* Top Groups with Delays */}
                {data.gruposConAtraso.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">Grupos con más atraso:</p>
                        <div className="space-y-1">
                            {data.gruposConAtraso.map((grupo, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                                    <span className="font-medium">{grupo.grupo}</span>
                                    <span className="text-orange-600 font-semibold">{grupo.pendientes} pendientes</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
