"use client"

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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, MessageSquare, Search, User, Eye, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getHelpChatLogs, HelpChatLog } from "@/lib/admin-stats"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { convertMarkdownToHtml } from "@/components/ui/rich-text-editor"
import { toast } from "sonner"

export function AdminChatLogs() {
    const [logs, setLogs] = useState<HelpChatLog[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedLog, setSelectedLog] = useState<HelpChatLog | null>(null)
    const [logToDelete, setLogToDelete] = useState<HelpChatLog | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchLogs = async () => {
        try {
            const data = await getHelpChatLogs()
            setLogs(data)
        } catch (error) {
            console.error("Error fetching chat logs:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    const handleDelete = async () => {
        if (!logToDelete) return

        setIsDeleting(true)
        try {
            const response = await fetch(`/api/admin/chat-logs?id=${logToDelete.id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Error al eliminar')
            }

            // Remove from local state
            setLogs(prev => prev.filter(log => log.id !== logToDelete.id))
            toast.success('Registro eliminado correctamente')
        } catch (error) {
            console.error('Error deleting log:', error)
            toast.error('Error al eliminar el registro')
        } finally {
            setIsDeleting(false)
            setLogToDelete(null)
        }
    }

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
                        Haz clic en "Ver" para leer la conversación completa.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[600px] w-full pr-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead className="w-[40%]">Pregunta</TableHead>
                                    <TableHead>Contexto</TableHead>
                                    <TableHead className="text-center">Acciones</TableHead>
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
                                                <div className="text-sm line-clamp-2 text-slate-700">
                                                    {log.question}
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top pt-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {log.metadata?.context_docs && Array.isArray(log.metadata.context_docs) && log.metadata.context_docs.length > 0 ? (
                                                        <>
                                                            <Badge variant="outline" className="text-[10px] bg-white">
                                                                {log.metadata.context_docs.length} docs
                                                            </Badge>
                                                        </>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground italic">Sin contexto</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top pt-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedLog(log)}
                                                        className="gap-1"
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                        Ver
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setLogToDelete(log)}
                                                        className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
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

            {/* Modal para ver la conversación completa */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <MessageSquare className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <div>Conversación con Edu</div>
                                {selectedLog && (
                                    <div className="text-sm font-normal text-muted-foreground">
                                        {selectedLog.user_name} • {format(new Date(selectedLog.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                                    </div>
                                )}
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="overflow-y-auto max-h-[65vh] pr-4 mt-4">
                            <div className="space-y-4">
                                {/* Pregunta del usuario */}
                                <div className="flex gap-3">
                                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                        <User className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs text-muted-foreground mb-1 font-medium">
                                            {selectedLog.user_name}
                                        </div>
                                        <div className="bg-purple-600 text-white rounded-2xl rounded-tl-none px-4 py-3">
                                            {selectedLog.question}
                                        </div>
                                    </div>
                                </div>

                                {/* Respuesta de Edu */}
                                <div className="flex gap-3">
                                    <div className="h-9 w-9 rounded-full bg-white border border-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        <img
                                            src="/images/Edu.png"
                                            alt="Edu"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs text-muted-foreground mb-1 font-medium">
                                            Edu 🦉
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3">
                                            <div
                                                className="prose prose-sm max-w-none text-slate-800"
                                                dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(selectedLog.answer) }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Documentos de contexto usados */}
                                {selectedLog.metadata?.context_docs && Array.isArray(selectedLog.metadata.context_docs) && selectedLog.metadata.context_docs.length > 0 && (
                                    <div className="mt-6 pt-4 border-t">
                                        <div className="text-xs text-muted-foreground font-medium mb-2">
                                            📚 Documentos de contexto utilizados:
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedLog.metadata.context_docs.map((doc: string, idx: number) => (
                                                <Badge key={idx} variant="secondary" className="text-xs">
                                                    {doc}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Diálogo de confirmación para eliminar */}
            <AlertDialog open={!!logToDelete} onOpenChange={(open) => !open && setLogToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar esta conversación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente este registro de conversación con Edu.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                'Eliminar'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
