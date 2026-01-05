'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Wand2, Send, Phone, MessageSquare, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { HighRiskStudentData } from "@/lib/dashboard-pulse"
import { supabase } from "@/lib/supabase" // Client-side client

interface ContactFamilyDialogProps {
    student: HighRiskStudentData
    children: React.ReactNode
}

export function ContactFamilyDialog({ student, children }: ContactFamilyDialogProps) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<1 | 2>(1)
    const [loading, setLoading] = useState(false)
    const [generatedMessage, setGeneratedMessage] = useState("")

    const parentName = "Padre de Familia"

    const handleGenerateMessage = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/generate-parent-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombreAlumno: student.nombre_completo,
                    nombrePadre: parentName,
                    tipoIncidencia: student.motivo,
                    nivelRiesgo: student.nivel_riesgo,
                    detalleIncidencia: student.motivo
                })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                setGeneratedMessage(data.message)
                setStep(2)
            } else {
                toast.error(data.error || "Error al generar el mensaje")
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setLoading(false)
        }
    }

    const handleSendWhatsApp = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) {
                toast.error("No hay sesión activa para identificar al usuario")
                return
            }

            const response = await fetch('/api/log-communication', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    alumnoId: student.alumno_id,
                    mensajeEnviado: generatedMessage,
                    tipoIncidencia: student.motivo
                })
            })

            if (!response.ok) {
                throw new Error("Falló el registro")
            }

            const encodedText = encodeURIComponent(generatedMessage)
            const whatsappUrl = `https://wa.me/?text=${encodedText}`

            window.open(whatsappUrl, '_blank')
            toast.success("Comunicación registrada y WhatsApp abierto")
            setOpen(false)
            setStep(1)
        } catch (error) {
            toast.error("Error al registrar la comunicación")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Contactar Familia</DialogTitle>
                    <DialogDescription>
                        Asistente de comunicación para {student.nombre_completo}
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="grid gap-4 py-4">
                        <div className="bg-muted p-4 rounded-md text-sm">
                            <p className="font-medium text-foreground">Situación a reportar:</p>
                            <p className="text-muted-foreground mt-1">{student.motivo}</p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                    Riesgo {student.nivel_riesgo}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Acción Recomendada</Label>
                            <p className="text-sm text-muted-foreground">
                                Generar un mensaje formal vía IA para notificar al padre/madre y solicitar una llamada o cita.
                            </p>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="message">Mensaje Generado (Editable)</Label>
                            <Textarea
                                id="message"
                                value={generatedMessage}
                                onChange={(e) => setGeneratedMessage(e.target.value)}
                                className="h-[200px] resize-none"
                            />
                            <p className="text-xs text-muted-foreground">Puede editar este mensaje antes de enviarlo.</p>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {step === 1 ? (
                        <Button onClick={handleGenerateMessage} disabled={loading} className="w-full sm:w-auto">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generando Borrador...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    Generar Mensaje con IA
                                </>
                            )}
                        </Button>
                    ) : (
                        <div className="flex gap-2 w-full justify-end">
                            <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
                            <Button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Abrir WhatsApp y Registrar
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
