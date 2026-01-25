"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Loader2, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Plantel } from "@/lib/planteles"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { generateReporteInstitucionalPDF } from "@/lib/pdf-generator"

interface ReportesTabProps {
    plantel: Plantel | null
}

export function ReportesTab({ plantel }: ReportesTabProps) {
    const [loading, setLoading] = useState(false)
    const [mes, setMes] = useState<string>(new Date().getMonth().toString())
    const [anio, setAnio] = useState<string>(new Date().getFullYear().toString())
    const { toast } = useToast()

    const handleGenerateReport = async () => {
        if (!plantel) return

        setLoading(true)
        try {
            // 1. Obtener datos del reporte
            const response = await fetch('/api/reports/institutional-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plantelId: plantel.id,
                    mes: parseInt(mes),
                    anio: parseInt(anio)
                })
            })

            if (!response.ok) {
                throw new Error('Error al obtener datos del reporte')
            }

            const data = await response.json()

            // 2. Generar PDF en el cliente
            await generateReporteInstitucionalPDF(data, plantel)

            toast({
                title: "Reporte generado",
                description: "El PDF se ha descargado correctamente.",
            })
        } catch (error) {
            console.error('Error generating report:', error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo generar el reporte. Intente nuevamente.",
            })
        } finally {
            setLoading(false)
        }
    }

    const meses = [
        { value: "0", label: "Enero" },
        { value: "1", label: "Febrero" },
        { value: "2", label: "Marzo" },
        { value: "3", label: "Abril" },
        { value: "4", label: "Mayo" },
        { value: "5", label: "Junio" },
        { value: "6", label: "Julio" },
        { value: "7", label: "Agosto" },
        { value: "8", label: "Septiembre" },
        { value: "9", label: "Octubre" },
        { value: "10", label: "Noviembre" },
        { value: "11", label: "Diciembre" },
    ]

    const anios = [
        { value: "2024", label: "2024" },
        { value: "2025", label: "2025" },
        { value: "2026", label: "2026" },
    ]

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Reportes de Cumplimiento Institucional
                    </CardTitle>
                    <CardDescription>
                        Genera un "chequeo de salud" mensual de tu plantel. Incluye métricas de asistencia, productividad docente e incidencias.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end bg-muted/30 p-6 rounded-lg border">
                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium">Mes del Reporte</label>
                            <Select value={mes} onValueChange={setMes}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona mes" />
                                </SelectTrigger>
                                <SelectContent>
                                    {meses.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 w-full md:w-32">
                            <label className="text-sm font-medium">Año</label>
                            <Select value={anio} onValueChange={setAnio}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Año" />
                                </SelectTrigger>
                                <SelectContent>
                                    {anios.map((a) => (
                                        <SelectItem key={a.value} value={a.value}>
                                            {a.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={handleGenerateReport} disabled={loading} className="w-full md:w-auto">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar PDF
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                        <div className="border rounded-md p-4">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                ¿Qué incluye este reporte?
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                                <li>Resumen ejecutivo con semáforo de salud escolar.</li>
                                <li>Gráficas de asistencia promedio por grupo.</li>
                                <li>Estatus de planeaciones entregadas vs esperadas.</li>
                                <li>Desglose de incidencias por tipo y resolución.</li>
                            </ul>
                        </div>
                        <div className="border rounded-md p-4 bg-yellow-50 border-yellow-100">
                            <h4 className="font-semibold mb-2 text-yellow-800">Nota Importante</h4>
                            <p className="text-sm text-yellow-700">
                                Para obtener mejores resultados, asegúrese de haber subido el <strong>Logo Institucional</strong> en la pestaña de Configuración antes de generar el reporte.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
