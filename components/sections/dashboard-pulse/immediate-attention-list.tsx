import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlertCircle, ChevronRight, MessageCircle } from "lucide-react"
import { HighRiskStudentData } from "@/lib/dashboard-pulse"
import { Button } from "@/components/ui/button"
import { ContactFamilyDialog } from "./contact-family-dialog"

interface ImmediateAttentionListProps {
    students: HighRiskStudentData[]
}

export function ImmediateAttentionList({ students }: ImmediateAttentionListProps) {
    if (students.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Atención Inmediata</CardTitle>
                    <CardDescription>Estudiantes en riesgo alto o crítico</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                        <div className="rounded-full bg-green-100 p-3 mb-2">
                            <AlertCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="text-sm">No hay alertas críticas en este momento.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-full xl:col-span-1">
            <CardHeader>
                <CardTitle className="text-lg">Atención Inmediata</CardTitle>
                <CardDescription>Estudiantes que requieren intervención</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {students.map((student) => (
                        <div key={student.alumno_id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-red-100 text-red-700 font-bold">
                                    {student.nombre_completo.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium leading-none truncate">{student.nombre_completo}</p>
                                    <Badge className={`${student.nivel_riesgo.toLowerCase().includes('cr') ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                            student.nivel_riesgo.toLowerCase() === 'alto' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
                                                student.nivel_riesgo.toLowerCase() === 'medio' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                                                    'bg-green-100 text-green-800 hover:bg-green-200'
                                        }`}>
                                        {student.nivel_riesgo}
                                    </Badge>
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground/80 mr-2">{student.grupo}</span>
                                    <span>•</span>
                                    <span className="ml-2 truncate">{student.motivo}</span>
                                </div>
                            </div>
                            <ContactFamilyDialog student={student}>
                                <Button size="sm" variant="outline" className="h-8 gap-2">
                                    <MessageCircle className="h-4 w-4" />
                                    <span className="text-xs font-medium">Contactar</span>
                                </Button>
                            </ContactFamilyDialog>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
