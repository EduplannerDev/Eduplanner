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

type TipoReporte = 'mensual' | 'trimestral' | 'cuatrimestral' | 'semestral' | 'anual'

export function ReportesTab({ plantel }: ReportesTabProps) {
    const [loading, setLoading] = useState(false)
    const [tipoReporte, setTipoReporte] = useState<TipoReporte>('mensual')
    const [periodo, setPeriodo] = useState<string>(new Date().getMonth().toString())
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
                    tipoReporte,
                    periodo,
                    anio: parseInt(anio)
                })
            })

            if (!response.ok) {
                const errorData = await response.text()
                throw new Error(errorData || 'Error al obtener datos del reporte')
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

    const tiposReporte = [
        { value: 'mensual', label: 'Mensual' },
        { value: 'trimestral', label: 'Trimestral' },
        { value: 'cuatrimestral', label: 'Cuatrimestral' },
        { value: 'semestral', label: 'Semestral' },
        { value: 'anual', label: 'Anual' },
    ]

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

    const trimestres = [
        { value: "1", label: "1º Trimestre (Ago-Oct)" },
        { value: "2", label: "2º Trimestre (Nov-Ene)" },
        { value: "3", label: "3º Trimestre (Feb-Abr)" },
    ]

    const cuatrimestres = [
        { value: "1", label: "1º Cuatrimestre (Sep-Dic)" },
        { value: "2", label: "2º Cuatrimestre (Ene-Abr)" },
        { value: "3", label: "3º Cuatrimestre (May-Ago)" },
    ]

    const semestres = [
        { value: "1", label: "1º Semestre (Ago-Ene)" },
        { value: "2", label: "2º Semestre (Feb-Jul)" },
    ]

    const anios = [
        { value: "2024", label: "2024" },
        { value: "2025", label: "2025" },
        { value: "2026", label: "2026" },
        { value: "2027", label: "2027" },
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
                        Genera un informe detallado con indicadores de salud escolar.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end bg-muted/30 p-6 rounded-lg border">

                        {/* Tipo de Reporte */}
                        <div className="space-y-2 w-full md:w-48">
                            <label className="text-sm font-medium">Tipo</label>
                            <Select
                                value={tipoReporte}
                                onValueChange={(v: TipoReporte) => {
                                    setTipoReporte(v)
                                    // Resetear periodo por defecto al cambiar tipo
                                    if (v === 'mensual') setPeriodo(new Date().getMonth().toString())
                                    else setPeriodo('1')
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tiposReporte.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Selector de Periodo (Dinámico) */}
                        {tipoReporte !== 'anual' && (
                            <div className="space-y-2 flex-1">
                                <label className="text-sm font-medium">Periodo</label>
                                <Select value={periodo} onValueChange={setPeriodo}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona periodo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tipoReporte === 'mensual' && meses.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                        ))}
                                        {tipoReporte === 'trimestral' && trimestres.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                        {tipoReporte === 'cuatrimestral' && cuatrimestres.map((c) => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                        {tipoReporte === 'semestral' && semestres.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Selector de Año */}
                        <div className="space-y-2 w-full md:w-32">
                            <label className="text-sm font-medium">Año / Ciclo</label>
                            <Select value={anio} onValueChange={setAnio}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Año" />
                                </SelectTrigger>
                                <SelectContent>
                                    {anios.map((a) => (
                                        <SelectItem key={a.value} value={a.value}>
                                            {tipoReporte === 'anual' || tipoReporte === 'semestral' || tipoReporte === 'trimestral' ? `${a.label}-${parseInt(a.label) + 1}` : a.label}
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
                                Contenido del Reporte
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                                <li>Semáforo de salud escolar y KPIs clave.</li>
                                <li>Comparativas de asistencia por grupo.</li>
                                <li>Productividad docente y entrega de planeaciones.</li>
                                <li>Incidencias acumuladas en el periodo seleccionado.</li>
                            </ul>
                        </div>
                        <div className="border rounded-md p-4 bg-blue-50 border-blue-100">
                            <h4 className="font-semibold mb-2 text-blue-800">Nota sobre Periodos</h4>
                            <p className="text-sm text-blue-700">
                                Los reportes Trimestrales y Semestrales se basan en el ciclo escolar estándar que inicia en Agosto. El reporte Anual cubre el ciclo completo (Ago-Jul).
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
