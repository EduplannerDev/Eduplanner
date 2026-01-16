import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, MessageSquare, Search, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getHelpChatLogs, HelpChatLog } from "@/lib/admin-stats"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function AdminChatLogs() {
    const [logs, setLogs] = useState<HelpChatLog[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        async function fetchLogs() {
            try {
                const data = await getHelpChatLogs()
                setLogs(data)
            } catch (error) {
                console.error("Error fetching chat logs:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchLogs()
    }, [])

    const filteredLogs = logs.filter(log =>
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.question.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Interacciones con Edu</h2>
                    <p className="text-muted-foreground">
                        Monitorea las preguntas y respuestas del asistente virtual.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por usuario o pregunta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 w-[300px]"
                        />
                    </div>
                    <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {logs.length} interacciones total
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Conversaciones</CardTitle>
                    <CardDescription>
                        Registro detallado de todas las consultas realizadas al chatbot.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[600px] w-full pr-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead className="w-[30%]">Pregunta</TableHead>
                                    <TableHead className="w-[30%]">Respuesta</TableHead>
                                    <TableHead>Contexto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No se encontraron registros
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-muted/50">
                                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground align-top pt-4">
                                                {format(new Date(log.created_at), "d MMM, yy", { locale: es })}
                                                <br />
                                                {format(new Date(log.created_at), "HH:mm", { locale: es })}
                                            </TableCell>
                                            <TableCell className="align-top pt-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <User className="h-4 w-4 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">{log.user_name}</div>
                                                        <div className="text-xs text-muted-foreground">{log.user_email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top pt-4">
                                                <div className="bg-blue-50 text-blue-900 p-2 rounded-lg text-sm border border-blue-100">
                                                    {log.question}
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top pt-4">
                                                <div className="text-sm text-slate-600 line-clamp-4 hover:line-clamp-none transition-all cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                    {log.answer}
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top pt-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {log.metadata?.context_docs && Array.isArray(log.metadata.context_docs) && log.metadata.context_docs.length > 0 ? (
                                                        log.metadata.context_docs.slice(0, 2).map((doc: string, idx: number) => (
                                                            <Badge key={idx} variant="outline" className="text-[10px] bg-white max-w-[150px] truncate">
                                                                {doc}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground italic">Sin contexto</span>
                                                    )}
                                                    {log.metadata?.context_docs?.length > 2 && (
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            +{log.metadata.context_docs.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}
