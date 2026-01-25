import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, FileText, BookOpen, Users, ClipboardList, Lightbulb } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { ActividadProxima } from "@/lib/dashboard-evaluaciones"

interface ActividadesProximasWidgetProps {
    actividades: ActividadProxima[]
}

export function ActividadesProximasWidget({ actividades }: ActividadesProximasWidgetProps) {
    const getTipoIcon = (tipo: string) => {
        switch (tipo) {
            case 'examen':
                return <FileText className="h-3 w-3" />
            case 'tarea':
                return <ClipboardList className="h-3 w-3" />
            case 'proyecto':
                return <Lightbulb className="h-3 w-3" />
            case 'participacion':
                return <Users className="h-3 w-3" />
            default:
                return <BookOpen className="h-3 w-3" />
        }
    }

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'examen':
                return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
            case 'tarea':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
            case 'proyecto':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
            case 'participacion':
                return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        }
    }

    const getDiasRestantesColor = (dias: number) => {
        if (dias <= 1) return 'text-red-600 font-bold'
        if (dias <= 3) return 'text-orange-600 font-semibold'
        return 'text-green-600'
    }

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Actividades Próximas
                </CardTitle>
                <CardDescription>Próximos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
                {actividades.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay actividades próximas</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {actividades.map((act) => (
                            <div
                                key={act.id}
                                className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{act.nombre}</p>
                                        <p className="text-xs text-muted-foreground">{act.grupo}</p>
                                    </div>
                                    <Badge className={`${getTipoColor(act.tipo)} shrink-0`} variant="secondary">
                                        <span className="flex items-center gap-1">
                                            {getTipoIcon(act.tipo)}
                                            <span className="capitalize">{act.tipo}</span>
                                        </span>
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs mt-2">
                                    <span className="text-muted-foreground">
                                        {format(new Date(act.fechaEntrega), "PPP", { locale: es })}
                                    </span>
                                    <span className={getDiasRestantesColor(act.diasRestantes)}>
                                        {act.diasRestantes === 0
                                            ? 'Hoy'
                                            : act.diasRestantes === 1
                                                ? 'Mañana'
                                                : `En ${act.diasRestantes} días`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
