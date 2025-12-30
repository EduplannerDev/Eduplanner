import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, ShieldCheck, Shield } from "lucide-react"
import { SecuritySummaryData } from "@/lib/dashboard-pulse"

interface SecurityTrafficLightWidgetProps {
    data: SecuritySummaryData[]
}

export function SecurityTrafficLightWidget({ data }: SecurityTrafficLightWidgetProps) {
    const critical = data.find(d => d.nivel_riesgo === 'Crítico')?.cantidad || 0
    const high = data.find(d => d.nivel_riesgo === 'Alto')?.cantidad || 0
    const medium = data.find(d => d.nivel_riesgo === 'Medio')?.cantidad || 0
    const low = data.find(d => d.nivel_riesgo === 'Bajo')?.cantidad || 0

    const totalIncidents = critical + high + medium + low

    // Status determination
    let status: 'safe' | 'warning' | 'critical' = 'safe'
    if (critical > 0 || high > 0) status = 'critical'
    else if (medium > 0) status = 'warning'

    return (
        <Card className={status === 'critical' ? 'border-red-500/50 bg-red-500/5' : (status === 'warning' ? 'border-yellow-500/50 bg-yellow-500/5' : '')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado de Seguridad</CardTitle>
                {status === 'safe' && <ShieldCheck className="h-4 w-4 text-green-500" />}
                {status === 'warning' && <Shield className="h-4 w-4 text-yellow-500" />}
                {status === 'critical' && <ShieldAlert className="h-4 w-4 text-red-500" />}
            </CardHeader>
            <CardContent>
                <div className="flex items-end gap-2">
                    <div className={`text-2xl font-bold ${status === 'critical' ? 'text-red-600' : ''}`}>{totalIncidents}</div>
                    <div className="mb-1 text-sm text-muted-foreground">incidencias hoy</div>
                </div>

                <div className="mt-3 flex gap-2">
                    {critical > 0 && (
                        <div className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">
                            {critical} Críticas
                        </div>
                    )}
                    {high > 0 && (
                        <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold border border-orange-200">
                            {high} Altas
                        </div>
                    )}
                    {medium > 0 && (
                        <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold border border-yellow-200">
                            {medium} Medias
                        </div>
                    )}
                    {totalIncidents === 0 && (
                        <span className="text-xs text-muted-foreground italic">Sin actividad reciente</span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
