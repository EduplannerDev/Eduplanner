import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { PromedioGeneralData } from "@/lib/dashboard-evaluaciones"

interface PromedioGeneralWidgetProps {
    data: PromedioGeneralData
}

export function PromedioGeneralWidget({ data }: PromedioGeneralWidgetProps) {
    const getTrendIcon = () => {
        if (data.tendencia === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />
        if (data.tendencia === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />
        return <Minus className="h-4 w-4 text-gray-400" />
    }

    const getPromedioColor = (promedio: number) => {
        if (promedio >= 8) return 'text-green-600'
        if (promedio >= 7) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getRiesgoSeverity = () => {
        const porcentaje = (data.estudiantesEnRiesgo / data.totalEstudiantes) * 100
        if (porcentaje > 30) return 'destructive'
        if (porcentaje > 15) return 'secondary'
        return 'default'
    }

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    ⭐ Promedio General
                    {getTrendIcon()}
                </CardTitle>
                <CardDescription>Calificaciones del plantel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-1">
                    <div className={`text-4xl font-bold ${getPromedioColor(data.promedio)}`}>
                        {data.promedio.toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Promedio de {data.totalEstudiantes} estudiantes
                    </p>
                </div>

                {data.estudiantesEnRiesgo > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-md">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <div className="flex-1">
                            <p className="text-xs font-medium text-red-900 dark:text-red-200">
                                {data.estudiantesEnRiesgo} estudiantes en riesgo
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300">
                                Promedio {'<'} 6.0
                            </p>
                        </div>
                    </div>
                )}

                {data.grupoMejor && data.grupoPeor && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Mejor grupo</p>
                            <p className="font-semibold text-green-600">{data.grupoMejor.nombre}</p>
                            <p className="text-xs text-muted-foreground">{data.grupoMejor.promedio.toFixed(1)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Requiere apoyo</p>
                            <p className="font-semibold text-orange-600">{data.grupoPeor.nombre}</p>
                            <p className="text-xs text-muted-foreground">{data.grupoPeor.promedio.toFixed(1)}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
