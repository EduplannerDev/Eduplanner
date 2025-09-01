"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Lock, Plus, Save, Edit, Calendar, Clock, History, RotateCcw, CalendarDays } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { 
  checkDiaryPasswordExists, 
  createDiaryPassword, 
  verifyDiaryPassword,
  getDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  getDiaryEntryVersions,
  restoreDiaryEntryVersion
} from "@/lib/diario-profesional"

interface DiaryEntry {
  id: string
  title: string
  content: string
  date: string
  time: string
  tags: string[]
  mood?: string
  isPrivate: boolean
  isRestoredVersion?: boolean
  restoredVersionNumber?: number
}

interface DiaryEntryVersion {
  id: string
  entry_id: string
  user_id: string
  version_number: number
  title: string
  content: string
  date: string
  time: string
  tags: string[]
  mood?: string
  is_private: boolean
  created_at: string
  version_created_at: string
}

interface DiarioProfesionalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate?: string | null
}

export function DiarioProfesional({ isOpen, onClose, selectedDate }: DiarioProfesionalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasPassword, setHasPassword] = useState<boolean | null>(null) // null = loading
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [isCreatingEntry, setIsCreatingEntry] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null)
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    tags: "",
    mood: ""
  })
  const [authError, setAuthError] = useState("")
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  const [entryVersions, setEntryVersions] = useState<DiaryEntryVersion[]>([])
  const [selectedEntryForHistory, setSelectedEntryForHistory] = useState<DiaryEntry | null>(null)
  const { toast } = useToast()

  // Función helper para obtener fecha local en formato YYYY-MM-DD sin conversión UTC
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Verificar si el usuario tiene contraseña configurada y establecer fecha inicial
  useEffect(() => {
    if (isOpen) {
      checkPasswordExists()
      // Establecer la fecha inicial: selectedDate si existe, sino fecha actual
      const initialDate = selectedDate ? new Date(selectedDate) : new Date()
      setCurrentDate(initialDate)
      console.log('=== DIALOG OPENED ===')
      console.log('selectedDate prop:', selectedDate)
      console.log('Setting currentDate to:', getLocalDateString(initialDate))
    }
  }, [isOpen])

  // Sincronizar currentDate con selectedDate cuando cambie la prop (solo si el diálogo está abierto)
  useEffect(() => {
    if (isOpen && selectedDate) {
      const newDate = new Date(selectedDate)
      setCurrentDate(newDate)
      console.log('=== SELECTEDDATE CHANGED ===')
      console.log('New selectedDate:', selectedDate)
      console.log('Setting currentDate to:', getLocalDateString(newDate))
    }
  }, [selectedDate, isOpen])

  // Cargar entradas cuando el usuario se autentique o cambie la fecha seleccionada
  useEffect(() => {
    if (isAuthenticated) {
      loadEntries()
    }
  }, [isAuthenticated, currentDate])

  const checkPasswordExists = async () => {
    try {
      const exists = await checkDiaryPasswordExists()
      setHasPassword(exists)
      if (!exists) {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Error checking password:', error)
      setHasPassword(false)
    }
  }

  const handleCreatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setAuthError("Las contraseñas no coinciden")
      return
    }
    
    if (newPassword.length < 6) {
      setAuthError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    try {
      await createDiaryPassword(newPassword)
      setHasPassword(true)
      setIsAuthenticated(true)
      setAuthError("")
      setNewPassword("")
      setConfirmPassword("")
      toast({
        title: "Contraseña creada",
        description: "Tu bitácora está ahora protegida"
      })
    } catch (error) {
      console.error('Error creating password:', error)
      setAuthError("Error al crear la contraseña")
    }
  }

  const handleAuthenticate = async () => {
    if (!password) {
      setAuthError("Ingresa tu contraseña")
      return
    }

    try {
      const isValid = await verifyDiaryPassword(password)
      if (isValid) {
        setIsAuthenticated(true)
        setAuthError("")
        setPassword("")
        await loadEntries()
      } else {
        setAuthError("Contraseña incorrecta")
      }
    } catch (error) {
      console.error('Error verifying password:', error)
      setAuthError("Error al verificar la contraseña")
    }
  }

  const loadEntries = async () => {
    try {
      console.log('=== LOADING ENTRIES ===')
      console.log('currentDate:', currentDate)
      console.log('selectedDate prop:', selectedDate)
      
      // Limpiar entradas antes de cargar nuevas
      setEntries([])
      
      const diaryEntries = await getDiaryEntries()
      console.log('Raw entries from DB:', diaryEntries.length)
      
      // Convertir el formato de la base de datos al formato del componente
      let formattedEntries = diaryEntries.map(entry => {
        return {
          id: entry.id,
          title: entry.title,
          content: entry.content,
          date: entry.date,
          time: entry.time,
          tags: entry.tags || [],
          mood: entry.mood,
          isPrivate: entry.is_private,
          isRestoredVersion: false,
          restoredVersionNumber: undefined
        }
      })
      
      // Filtrar por fecha actual seleccionada
      const currentDateString = getLocalDateString(currentDate) // Formato YYYY-MM-DD
      console.log('Filtering by currentDate:', currentDateString)
      console.log('Entries before filter:', formattedEntries.map(e => ({ title: e.title, date: e.date })))
      formattedEntries = formattedEntries.filter(entry => entry.date === currentDateString)
      console.log('Entries after filter:', formattedEntries.map(e => ({ title: e.title, date: e.date })))
      console.log('=== END LOADING ENTRIES ===')
      
      setEntries(formattedEntries)
    } catch (error) {
      console.error('Error loading entries:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las entradas de la bitácora",
        variant: "destructive"
      })
    }
  }

  const handleSaveEntry = async () => {
    if (!newEntry.title || !newEntry.content) {
      toast({
        title: "Error",
        description: "El título y contenido son obligatorios",
        variant: "destructive"
      })
      return
    }

    try {
      const tags = newEntry.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      const now = new Date()
      
      // Usar currentDate para la fecha de la entrada
      const entryDate = getLocalDateString(currentDate)
      
      await createDiaryEntry({
        title: newEntry.title,
        content: newEntry.content,
        date: entryDate, // YYYY-MM-DD format
        time: now.toTimeString().split(' ')[0], // HH:MM:SS format
        tags,
        mood: newEntry.mood || undefined,
        is_private: true // La bitácora siempre es privada
      })
      
      // Recargar las entradas después de guardar
      await loadEntries()
      
      setNewEntry({ title: "", content: "", tags: "", mood: "" })
      setIsCreatingEntry(false)
      toast({
        title: "Entrada guardada",
        description: "Tu reflexión ha sido guardada de forma segura"
      })
    } catch (error) {
      console.error('Error saving entry:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar la entrada",
        variant: "destructive"
      })
    }
  }

  const handleEditEntry = async (entry: DiaryEntry) => {
    setEditingEntry(entry)
    setNewEntry({
      title: entry.title,
      content: entry.content,
      tags: entry.tags.join(', '),
      mood: entry.mood || ""
    })
    setIsCreatingEntry(true)
    
    // Cargar historial de versiones automáticamente
    try {
      setSelectedEntryForHistory(entry)
      const versions = await getDiaryEntryVersions(entry.id)
      setEntryVersions(versions)
    } catch (error) {
      console.error('Error loading version history:', error)
    }
  }

  const handleUpdateEntry = async () => {
    if (!editingEntry || !newEntry.title || !newEntry.content) {
      toast({
        title: "Error",
        description: "El título y contenido son obligatorios",
        variant: "destructive"
      })
      return
    }

    try {
      const tags = newEntry.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      
      await updateDiaryEntry(editingEntry.id, {
        title: newEntry.title,
        content: newEntry.content,
        tags,
        mood: newEntry.mood || undefined,
        updated_at: new Date().toISOString()
      })
      
      // Recargar las entradas después de actualizar
      await loadEntries()
      
      setNewEntry({ title: "", content: "", tags: "", mood: "" })
      setEditingEntry(null)
      setIsCreatingEntry(false)
      toast({
        title: "Entrada actualizada",
        description: "Tu reflexión ha sido actualizada exitosamente"
      })
    } catch (error) {
      console.error('Error updating entry:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la entrada",
        variant: "destructive"
      })
    }
  }



  const handleRestoreVersion = async (versionNumber: number) => {
    if (!selectedEntryForHistory) return

    try {
      await restoreDiaryEntryVersion(selectedEntryForHistory.id, versionNumber)
      
      // Recargar las entradas después de restaurar
      await loadEntries()
      
      // Marcar la entrada como versión restaurada en el estado local
      setEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === selectedEntryForHistory.id 
            ? { ...entry, isRestoredVersion: true, restoredVersionNumber: versionNumber }
            : entry
        )
      )
      
      // Si estamos editando esta entrada, también actualizar el estado de edición
      if (editingEntry && editingEntry.id === selectedEntryForHistory.id) {
        setEditingEntry(prev => prev ? {
          ...prev,
          isRestoredVersion: true,
          restoredVersionNumber: versionNumber
        } : null)
      }
      
      // Limpiar estados del historial
      setSelectedEntryForHistory(null)
      setEntryVersions([])
      
      toast({
        title: "Versión restaurada",
        description: `Se ha restaurado la versión ${versionNumber} de la entrada`
      })
    } catch (error) {
      console.error('Error restoring version:', error)
      toast({
        title: "Error",
        description: "No se pudo restaurar la versión",
        variant: "destructive"
      })
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date)
      setIsDatePickerOpen(false)
    }
  }

  const resetState = () => {
    setIsAuthenticated(false)
    setPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setAuthError("")
    setIsCreatingEntry(false)
    setEditingEntry(null)
    setNewEntry({ title: "", content: "", tags: "", mood: "" })
    setIsDatePickerOpen(false)

    setEntryVersions([])
    setSelectedEntryForHistory(null)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            📝 Bitácora (Privado)
          </DialogTitle>
          <DialogDescription>
            Un espacio seguro para tus reflexiones y pensamientos profesionales
          </DialogDescription>
        </DialogHeader>

        {hasPassword === null ? (
          // Estado de carga
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Verificando autenticación...</p>
            </div>
          </div>
        ) : !hasPassword ? (
          // Crear contraseña por primera vez
          <div className="space-y-4">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Para proteger tu privacidad, necesitas crear una contraseña para acceder a tu bitácora.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                />
              </div>
              
              {authError && (
                <Alert variant="destructive">
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}
              
              <Button onClick={handleCreatePassword} className="w-full">
                Crear contraseña y acceder
              </Button>
            </div>
          </div>
        ) : !isAuthenticated ? (
          // Autenticación
          <div className="space-y-4">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Ingresa tu contraseña para acceder a tu bitácora.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  onKeyPress={(e) => e.key === 'Enter' && handleAuthenticate()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {authError && (
              <Alert variant="destructive">
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            
            <Button onClick={handleAuthenticate} className="w-full">
              Acceder a la bitácora
            </Button>
          </div>
        ) : (
          // Vista principal del diario
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-auto justify-start text-left font-normal">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {currentDate.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={currentDate}
                      onSelect={(date) => {
                        if (date) {
                          setCurrentDate(date)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={() => setIsCreatingEntry(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva entrada
              </Button>
            </div>

            {isCreatingEntry && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>{editingEntry ? 'Editar entrada' : 'Nueva entrada'}</CardTitle>
                    {editingEntry?.isRestoredVersion && (
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Versión {editingEntry.restoredVersionNumber} restaurada
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={newEntry.title}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título de tu reflexión"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Contenido</Label>
                    <Textarea
                      id="content"
                      value={newEntry.content}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Escribe tus pensamientos, reflexiones o experiencias..."
                      rows={6}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
                      <Input
                        id="tags"
                        value={newEntry.tags}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="trabajo, reflexión, aprendizaje"
                      />
                    </div>
                    
                    <div>
                      <Label>Estado de ánimo</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                           { emoji: "🙂", label: "Optimista" },
                           { emoji: "💡", label: "Inspirado/a" },
                           { emoji: "🤔", label: "Reflexivo/a" },
                           { emoji: "💪", label: "Motivado/a" },
                           { emoji: "😐", label: "Normal / Estable" },
                           { emoji: "🤯", label: "Abrumado/a" },
                           { emoji: "🤔", label: "Preocupado/a" },
                           { emoji: "😩", label: "Cansado/a" }
                         ].map((mood) => (
                          <Button
                            key={mood.label}
                            type="button"
                            variant={newEntry.mood === mood.label ? "default" : "outline"}
                            className="justify-start text-sm h-auto py-2 px-3"
                            onClick={() => setNewEntry(prev => ({ ...prev, mood: mood.label }))}
                          >
                            <span className="mr-2">{mood.emoji}</span>
                            {mood.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={editingEntry ? handleUpdateEntry : handleSaveEntry}>
                      <Save className="h-4 w-4 mr-2" />
                      {editingEntry ? 'Actualizar entrada' : 'Guardar entrada'}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsCreatingEntry(false)
                      setEditingEntry(null)
                      setNewEntry({ title: "", content: "", tags: "", mood: "" })
                      setEntryVersions([])
                      setSelectedEntryForHistory(null)
                    }}>
                      Cancelar
                    </Button>
                  </div>
                  
                  {/* Historial de versiones cuando se está editando */}
                  {editingEntry && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Historial de versiones
                      </h4>
                      
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {entryVersions.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No hay versiones anteriores para esta entrada.</p>
                            <p className="text-sm">Las versiones se crean automáticamente cuando editas una entrada.</p>
                          </div>
                        ) : (
                          entryVersions.map((version) => (
                            <Card key={version.id} className="border-l-4 border-l-blue-500">
                              <CardHeader>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                      Versión {version.version_number}
                                      {version.version_number === 1 && (
                                        <Badge variant="outline">Versión original</Badge>
                                      )}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(version.version_created_at).toLocaleDateString('es-ES')}
                                      <Clock className="h-3 w-3 ml-2" />
                                      {new Date(version.version_created_at).toLocaleTimeString('es-ES', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                      {version.mood && (
                                        <Badge variant="outline" className="ml-2">
                                          {version.mood}
                                        </Badge>
                                      )}
                                    </CardDescription>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRestoreVersion(version.version_number)}
                                    className="flex items-center gap-1"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    Restaurar
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="font-medium text-sm mb-1">Título:</h4>
                                    <p className="text-sm bg-muted p-2 rounded">{version.title}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm mb-1">Contenido:</h4>
                                    <p className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">{version.content}</p>
                                  </div>
                                  {version.tags.length > 0 && (
                                    <div>
                                      <h4 className="font-medium text-sm mb-1">Etiquetas:</h4>
                                      <div className="flex flex-wrap gap-1">
                                        {version.tags.map((tag, idx) => (
                                          <Badge key={idx} variant="secondary" className="text-xs">
                                            #{tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Lista de entradas existentes */}
            {!isCreatingEntry && entries.length > 0 && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {entries.map((entry) => (
                    <Card key={entry.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleEditEntry(entry)}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">{entry.title}</CardTitle>
                              {entry.isRestoredVersion && (
                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Versión {entry.restoredVersionNumber} restaurada
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {entry.time}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {entry.content}
                        </p>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {entry.mood && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {entry.mood}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Mensaje cuando no hay entradas */}
            {!isCreatingEntry && entries.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    No hay entradas para esta fecha. ¡Crea tu primera entrada!
                  </p>
                </CardContent>
              </Card>
            )}

          </div>
        )}
      </DialogContent>
    </Dialog>


    </>
  )
}