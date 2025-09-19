'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Mail, 
  Send, 
  Users, 
  History, 
  Check, 
  X, 
  AlertCircle, 
  Plus, 
  Trash2,
  Clock,
  User,
  Calendar,
  Eye,
  Copy,
  ExternalLink
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface EmailLog {
  id: string
  sent_by: string
  recipients_count: number
  subject: string
  content: string
  full_content?: string
  recipients_list?: string[]
  sender_email?: string
  sent_at: string
  success: boolean
  error_message?: string
  resend_id?: string
  sender?: {
    name: string
    email: string
  }
}

export default function EnvioCorreos() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  
  // Estados para el formulario
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sendToAll, setSendToAll] = useState(false)
  const [recipients, setRecipients] = useState<string[]>([''])
  const [currentRecipient, setCurrentRecipient] = useState('')
  const [selectedSender, setSelectedSender] = useState('contacto@eduplanner.mx')

  // Estados para paginación del historial
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  
  // Estados para el modal de detalles
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null)
  const [showEmailDetails, setShowEmailDetails] = useState(false)

  // Cargar historial de envíos
  const loadEmailHistory = async (page = 1) => {
    setLoadingLogs(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Sesión expirada')
        return
      }

      const response = await fetch(`/api/send-email?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error response:', response.status, errorData)
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.success) {
        setEmailLogs(result.data || [])
        setCurrentPage(result.pagination?.page || 1)
        setTotalPages(result.pagination?.totalPages || 1)
        setTotalLogs(result.pagination?.total || 0)
      } else {
        throw new Error(result.error || 'Error desconocido cargando historial')
      }
    } catch (error) {
      console.error('Error cargando historial:', error)
      toast.error(`Error cargando historial: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoadingLogs(false)
    }
  }

  // Cargar historial al montar el componente
  useEffect(() => {
    loadEmailHistory()
  }, [])

  // Agregar destinatario
  const addRecipient = () => {
    if (currentRecipient.trim() && !recipients.includes(currentRecipient.trim())) {
      setRecipients([...recipients, currentRecipient.trim()])
      setCurrentRecipient('')
    }
  }

  // Remover destinatario
  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index))
  }

  // Validar email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Manejar clic en fila del historial
  const handleEmailClick = (email: EmailLog) => {
    setSelectedEmail(email)
    setShowEmailDetails(true)
  }

  // Enviar correo
  const handleSendEmail = async () => {
    // Validaciones
    if (!subject.trim()) {
      toast.error('El asunto es requerido')
      return
    }

    if (!content.trim()) {
      toast.error('El contenido es requerido')
      return
    }

    if (!sendToAll && recipients.filter(r => r.trim()).length === 0) {
      toast.error('Agrega al menos un destinatario')
      return
    }

    // Validar emails si no es envío masivo
    if (!sendToAll) {
      const validRecipients = recipients.filter(r => r.trim() && isValidEmail(r.trim()))
      if (validRecipients.length === 0) {
        toast.error('Agrega al menos un email válido')
        return
      }
    }

    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Sesión expirada')
        return
      }

      const requestBody = {
        subject: subject.trim(),
        content: content.trim(),
        sendToAllUsers: sendToAll,
        recipients: sendToAll ? [] : recipients.filter(r => r.trim() && isValidEmail(r.trim())),
        senderEmail: selectedSender
      }

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error enviando correo')
      }

      const result = await response.json()
      if (result.success) {
        toast.success(`Correo enviado exitosamente a ${result.recipientsCount} destinatario(s)`)
        
        // Limpiar formulario
        setSubject('')
        setContent('')
        setRecipients([''])
        setSendToAll(false)
        setSelectedSender('contacto@eduplanner.mx')
        
        // Recargar historial
        loadEmailHistory()
      }
    } catch (error) {
      console.error('Error enviando correo:', error)
      toast.error(error instanceof Error ? error.message : 'Error enviando correo')
    } finally {
      setIsLoading(false)
    }
  }

  // Manejo de Enter en el input de destinatarios
  const handleRecipientKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addRecipient()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Mail className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Envío de Correos</h1>
        <Badge variant="outline" className="ml-2">Solo Administradores</Badge>
      </div>

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Enviar Correo
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Enviar Correo Personalizado
              </CardTitle>
              <CardDescription>
                Envía correos personalizados desde EduPlanner con el logo institucional. Elige entre contacto, soporte o no-reply.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Remitente */}
              <div className="space-y-2">
                <Label htmlFor="sender">Remitente *</Label>
                <Select value={selectedSender} onValueChange={setSelectedSender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el remitente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contacto@eduplanner.mx">
                      <div className="flex flex-col">
                        <span className="font-medium">contacto@eduplanner.mx</span>
                        <span className="text-sm text-gray-500">Para comunicación general y consultas</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="soporte@eduplanner.mx">
                      <div className="flex flex-col">
                        <span className="font-medium">soporte@eduplanner.mx</span>
                        <span className="text-sm text-gray-500">Para asistencia técnica y soporte</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="no-reply@eduplanner.mx">
                      <div className="flex flex-col">
                        <span className="font-medium">no-reply@eduplanner.mx</span>
                        <span className="text-sm text-gray-500">Para notificaciones automáticas</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Asunto */}
              <div className="space-y-2">
                <Label htmlFor="subject">Asunto *</Label>
                <Input
                  id="subject"
                  placeholder="Escribe el asunto del correo..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={100}
                />
                <p className="text-sm text-gray-500">
                  {subject.length}/100 caracteres
                </p>
              </div>

              {/* Contenido */}
              <div className="space-y-2">
                <Label htmlFor="content">Contenido del Correo *</Label>
                <Textarea
                  id="content"
                  placeholder="Escribe el contenido del correo en HTML o texto plano..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={10000}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-sm text-gray-500">
                  {content.length}/10,000 caracteres
                </p>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Puedes usar HTML básico como &lt;p&gt;, &lt;br&gt;, &lt;strong&gt;, &lt;em&gt;, etc.
                    El correo incluirá automáticamente el logo de EduPlanner.
                  </AlertDescription>
                </Alert>
              </div>

              <Separator />

              {/* Opciones de destinatarios */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="send-to-all"
                    checked={sendToAll}
                    onCheckedChange={setSendToAll}
                  />
                  <Label htmlFor="send-to-all" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Enviar a todos los usuarios activos
                  </Label>
                </div>

                {!sendToAll && (
                  <div className="space-y-3">
                    <Label>Destinatarios</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="email@ejemplo.com"
                        value={currentRecipient}
                        onChange={(e) => setCurrentRecipient(e.target.value)}
                        onKeyPress={handleRecipientKeyPress}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addRecipient}
                        disabled={!currentRecipient.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {recipients.filter(r => r.trim()).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Destinatarios ({recipients.filter(r => r.trim()).length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {recipients.map((recipient, index) => {
                            if (!recipient.trim()) return null
                            const isValid = isValidEmail(recipient.trim())
                            return (
                              <Badge
                                key={index}
                                variant={isValid ? "default" : "destructive"}
                                className="flex items-center gap-1"
                              >
                                {recipient.trim()}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-transparent"
                                  onClick={() => removeRecipient(index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            )
                          })}
                        </div>
                        {recipients.some(r => r.trim() && !isValidEmail(r.trim())) && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Algunos emails tienen formato inválido (marcados en rojo)
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Botón de envío */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSendEmail}
                  disabled={isLoading || !subject.trim() || !content.trim()}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isLoading ? 'Enviando...' : 'Enviar Correo'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Envíos
              </CardTitle>
              <CardDescription>
                Registro de todos los correos enviados ({totalLogs} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : emailLogs.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay correos enviados aún</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {emailLogs.map((log) => (
                      <div
                        key={log.id}
                        className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleEmailClick(log)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-medium">{log.subject}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {log.sender?.name || 'Administrador'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {log.recipients_count} destinatarios
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(log.sent_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={log.success ? "default" : "destructive"}
                              className="flex items-center gap-1"
                            >
                              {log.success ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              {log.success ? 'Enviado' : 'Error'}
                            </Badge>
                            <Eye className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        
                        {log.content && (
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            <p className="text-gray-700 line-clamp-3">
                              {log.content}
                            </p>
                          </div>
                        )}
                        
                        {!log.success && log.error_message && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              {log.error_message}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadEmailHistory(currentPage - 1)}
                      disabled={currentPage === 1 || loadingLogs}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadEmailHistory(currentPage + 1)}
                      disabled={currentPage === totalPages || loadingLogs}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de detalles del correo */}
      <Dialog open={showEmailDetails} onOpenChange={setShowEmailDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Detalles del Correo
            </DialogTitle>
            <DialogDescription>
              Información completa del correo enviado
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmail && (
            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Asunto</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedEmail.subject}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Estado</Label>
                  <Badge
                    variant={selectedEmail.success ? "default" : "destructive"}
                    className="flex items-center gap-1 w-fit"
                  >
                    {selectedEmail.success ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    {selectedEmail.success ? 'Enviado exitosamente' : 'Error en el envío'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Remitente</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">
                    {selectedEmail.sender_email || 'contacto@eduplanner.mx'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Fecha de envío</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">
                    {format(new Date(selectedEmail.sent_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Destinatarios</Label>
                  <div className="text-sm bg-gray-50 p-3 rounded max-h-24 overflow-y-auto">
                    {selectedEmail.recipients_list && selectedEmail.recipients_list.length > 0 ? (
                      <div className="space-y-1">
                        {selectedEmail.recipients_list.map((email, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-xs">{email}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                navigator.clipboard.writeText(email)
                                toast.success('Email copiado')
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span>{selectedEmail.recipients_count} destinatario(s)</span>
                    )}
                  </div>
                </div>

                {selectedEmail.resend_id && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">ID de Resend</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm bg-gray-50 p-3 rounded flex-1 font-mono">
                        {selectedEmail.resend_id}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedEmail.resend_id!)
                          toast.success('ID copiado al portapapeles')
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>



              {/* Error message si existe */}
              {!selectedEmail.success && selectedEmail.error_message && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-red-600">Mensaje de error</Label>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {selectedEmail.error_message}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Contenido del correo */}
              {(selectedEmail.full_content || selectedEmail.content) && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Contenido del correo</Label>
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList>
                      <TabsTrigger value="preview">Vista previa</TabsTrigger>
                      <TabsTrigger value="html">Código HTML</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="preview" className="mt-4">
                      <div className="border rounded p-4 bg-white min-h-32 max-h-96 overflow-y-auto">
                        {selectedEmail.full_content || selectedEmail.content ? (
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: selectedEmail.full_content || selectedEmail.content 
                            }} 
                            className="prose prose-sm max-w-none"
                          />
                        ) : (
                          <p className="text-gray-500 italic">No hay contenido disponible</p>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="html" className="mt-4">
                      <div className="relative">
                        <ScrollArea className="h-96 w-full border rounded p-4 bg-gray-50">
                          <pre className="text-xs whitespace-pre-wrap font-mono">
                            {selectedEmail.full_content || selectedEmail.content || 'No hay contenido disponible'}
                          </pre>
                        </ScrollArea>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            const content = selectedEmail.full_content || selectedEmail.content
                            if (content) {
                              navigator.clipboard.writeText(content)
                              toast.success('HTML copiado al portapapeles')
                            }
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
