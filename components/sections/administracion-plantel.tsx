"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, UserPlus, Settings, Shield, Edit, Save, X, RefreshCw, ChevronDown, Trash2, Mail, Image as ImageIcon, Upload, FileImage, ExternalLink } from "lucide-react"
import { useRoles } from "@/hooks/use-roles"
import { useNotification } from "@/hooks/use-notification"
import { supabase } from "@/lib/supabase"
import { getPlantelUsers, removeUserFromPlantel, canAddUserToPlantel, assignUserToPlantelWithValidation } from "@/lib/planteles"
import { inviteUserByEmail } from "@/lib/profile"
import { validateInvitation } from "@/lib/invitations"
import { PlantelUsersWidget } from "@/components/widgets/plantel-users-widget"

interface ProfesorPlantel {
  id: string
  user_id: string
  nombre: string
  email: string
  activo: boolean
  fecha_asignacion: string
}

interface AdministracionPlantelProps {
  isOpen: boolean
  onClose: () => void
}

export function AdministracionPlantel({ isOpen, onClose }: AdministracionPlantelProps) {
  const { isDirector, plantel, loading } = useRoles()
  const { success, error } = useNotification()
  const [activeTab, setActiveTab] = useState("profesores")
  const [isEditing, setIsEditing] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isPlantelInfoOpen, setIsPlantelInfoOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
    codigo_plantel: "",
    nivel_educativo: "",
    ciudad: "",
    estado: "",
    codigo_postal: ""
  })
  const [saving, setSaving] = useState(false)
  const [profesores, setProfesores] = useState<ProfesorPlantel[]>([])
  const [loadingProfesores, setLoadingProfesores] = useState(false)

  // Estados para assets
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null)
  const [assets, setAssets] = useState({
    logo_url: '',
    hoja_membretada_url: ''
  })

  // Estados para gestión de profesores
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [availableUsers, setAvailableUsers] = useState<any[]>([])

  // Controlar el estado de loading inicial
  useEffect(() => {
    if (!loading) {
      // Agregar un pequeño delay para mostrar el loader
      const timer = setTimeout(() => {
        setIsInitialLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [loading])

  // Función para cargar profesores
  const loadProfesores = async () => {
    if (!plantel) return

    setLoadingProfesores(true)
    try {
      const users = await getPlantelUsers(plantel.id)
      const profesoresData: ProfesorPlantel[] = users
        .filter(user => user.role === 'profesor')
        .map(user => {
          const profile = user.profiles
          return {
            id: user.id,
            user_id: user.user_id,
            nombre: profile?.full_name || profile?.email || 'Usuario sin nombre',
            email: profile?.email || 'Sin email',
            activo: user.activo,
            fecha_asignacion: user.assigned_at
          }
        })
      setProfesores(profesoresData)
    } catch (err) {

      error("No se pudieron cargar los profesores.", {
        title: "Error"
      })
    } finally {
      setLoadingProfesores(false)
    }
  }

  // Cargar profesores cuando se monta el componente
  useEffect(() => {
    if (plantel && activeTab === 'profesores') {
      loadProfesores()
    }
  }, [plantel, activeTab])

  // Inicializar formulario cuando se carga el plantel
  useEffect(() => {
    if (plantel) {
      setEditForm({
        nombre: plantel.nombre || "",
        direccion: plantel.direccion || "",
        telefono: plantel.telefono || "",
        email: plantel.email || "",
        codigo_plantel: plantel.codigo_plantel || "",
        nivel_educativo: plantel.nivel_educativo || "",
        ciudad: plantel.ciudad || "",
        estado: plantel.estado || "",
        codigo_postal: plantel.codigo_postal || ""
      })
      setAssets({
        logo_url: plantel.logo_url || '',
        hoja_membretada_url: plantel.hoja_membretada_url || ''
      })
    }
  }, [plantel])

  // Buscar usuarios disponibles cuando cambie el término de búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim() && isAssignDialogOpen) {
        loadAvailableUsers()
      }
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, isAssignDialogOpen])

  const validateForm = () => {
    const errors = []

    // Validar teléfono: solo 10 dígitos numéricos
    if (editForm.telefono && !/^\d{10}$/.test(editForm.telefono)) {
      errors.push("El teléfono debe contener exactamente 10 dígitos numéricos")
    }

    // Validar email: formato válido
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.push("El email debe tener un formato válido")
    }

    // Validar código postal: 5 dígitos
    if (editForm.codigo_postal && !/^\d{5}$/.test(editForm.codigo_postal)) {
      errors.push("El código postal debe contener exactamente 5 dígitos")
    }

    return errors
  }

  const handleSave = async () => {
    if (!plantel) return

    // Validar formulario
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      error(validationErrors.join(". "), {
        title: "Error de validación"
      })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('planteles')
        .update({
          nombre: editForm.nombre,
          direccion: editForm.direccion,
          telefono: editForm.telefono,
          email: editForm.email,
          codigo_plantel: editForm.codigo_plantel,
          nivel_educativo: editForm.nivel_educativo,
          ciudad: editForm.ciudad,
          estado: editForm.estado,
          codigo_postal: editForm.codigo_postal
        })
        .eq('id', plantel.id)

      if (error) throw error

      success("La información del plantel se ha guardado correctamente.", {
        title: "Plantel actualizado"
      })

      setIsEditing(false)
    } catch (err) {

      error("No se pudo actualizar la información del plantel.", {
        title: "Error"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (plantel) {
      setEditForm({
        nombre: plantel.nombre || "",
        direccion: plantel.direccion || "",
        telefono: plantel.telefono || "",
        email: plantel.email || "",
        codigo_plantel: plantel.codigo_plantel || "",
        nivel_educativo: plantel.nivel_educativo || "",
        ciudad: plantel.ciudad || "",
        estado: plantel.estado || "",
        codigo_postal: plantel.codigo_postal || ""
      })
    }
    setIsEditing(false)
  }

  // Funciones para gestión de profesores
  const handleInviteProfesor = async () => {
    if (!plantel || !inviteEmail.trim()) {
      error("Por favor ingresa un email válido", { title: "Error" })
      return
    }

    setInviting(true)
    try {
      // Validar la invitación antes de proceder
      const validation = await validateInvitation(inviteEmail.trim(), plantel.id, 'profesor')

      if (!validation.valid) {
        error(validation.error || "No se puede enviar la invitación", { title: "Error de validación" })
        return
      }

      // Verificar límites antes de invitar
      const canAdd = await canAddUserToPlantel(plantel.id, 'profesor')

      if (!canAdd) {
        error("No se puede agregar más profesores. Se ha alcanzado el límite máximo para este plantel.", { title: "Límite alcanzado" })
        return
      }

      const result = await inviteUserByEmail(
        inviteEmail.trim(),
        plantel.id,
        'profesor',
        plantel.id // TODO: obtener el ID del usuario actual
      )

      if (result.success) {
        success(`Se ha enviado una invitación a ${inviteEmail}. El usuario recibirá un email para aceptar la invitación.`, { title: "Invitación enviada" })
        setInviteEmail('')
        setIsInviteDialogOpen(false)
        loadProfesores()
      } else {
        error(result.error || "Error al enviar la invitación", { title: "Error" })
      }
    } catch (err) {

      error("Error al enviar la invitación", { title: "Error" })
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveProfesor = async (userId: string) => {
    if (!plantel) {
      error("No hay plantel seleccionado", { title: "Error" })
      return
    }

    try {
      const result = await removeUserFromPlantel(userId, plantel.id)

      if (result) {
        success("Profesor removido del plantel correctamente", { title: "Éxito" })
        loadProfesores()
      } else {
        error("Error al remover el profesor del plantel", { title: "Error" })
      }
    } catch (err) {

      error("Error al remover el profesor del plantel", { title: "Error" })
    }
  }

  const loadAvailableUsers = async () => {
    if (!searchTerm.trim()) {
      setAvailableUsers([])
      return
    }

    try {


      // Primero, buscar todos los usuarios que coincidan (sin filtro de rol)
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(20)

      if (allProfilesError) {

      }

      // Buscar usuarios que puedan ser asignados como profesores
      // Incluimos 'profesor' y usuarios sin rol asignado (null)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .or('role.eq.profesor,role.is.null')
        .limit(10)

      if (profilesError) {

        throw profilesError
      }



      // Filtrar usuarios que no estén ya asignados al plantel
      const currentUserIds = profesores.map(p => p.user_id)


      const available = profiles?.filter(profile => !currentUserIds.includes(profile.id)) || []


      setAvailableUsers(available)

      // Si no se encontraron usuarios compatibles, mostrar mensaje informativo
      if (profiles && profiles.length === 0) {

      }
    } catch (err) {

      error("Error al buscar usuarios", { title: "Error" })
    }
  }

  const handleAssignProfesor = async (userId: string) => {
    if (!plantel) {
      error("No hay plantel seleccionado", { title: "Error" })
      return
    }

    try {
      const canAdd = await canAddUserToPlantel(plantel.id, 'profesor')

      if (!canAdd) {
        error("No se puede agregar más profesores. Se ha alcanzado el límite máximo para este plantel.", { title: "Límite alcanzado" })
        return
      }

      const result = await assignUserToPlantelWithValidation(userId, plantel.id, 'profesor')

      if (result.success) {
        success("Profesor asignado al plantel correctamente", { title: "Éxito" })
        loadProfesores()
        setIsAssignDialogOpen(false)
        setSearchTerm('')
        setAvailableUsers([])
      } else {
        error(result.error || "Error al asignar el profesor al plantel", { title: "Error" })
      }
    } catch (err) {

      error("Error al asignar el profesor al plantel", { title: "Error" })
    }
  }

  // Funciones para gestión de assets
  const handleUploadAsset = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hoja_membretada') => {
    const file = event.target.files?.[0]
    if (!file || !plantel) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      error("Solo se permiten imágenes (JPG, PNG) o PDF", { title: "Archivo inválido" })
      return
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      error("El archivo no debe superar 5MB", { title: "Archivo muy grande" })
      return
    }

    setUploadingAsset(type)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${plantel.id}/${type}-${Date.now()}.${fileExt}`

      // Subir archivo
      const { error: uploadError } = await supabase.storage
        .from('plantel-assets')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('plantel-assets')
        .getPublicUrl(fileName)

      // Actualizar base de datos
      const updateData = type === 'logo'
        ? { logo_url: publicUrl }
        : { hoja_membretada_url: publicUrl }

      const { error: dbError } = await supabase
        .from('planteles')
        .update(updateData)
        .eq('id', plantel.id)

      if (dbError) throw dbError

      // Actualizar estado local
      setAssets(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : 'hoja_membretada_url']: publicUrl
      }))

      success(`${type === 'logo' ? 'Logo' : 'Hoja membretada'} actualizado correctamente`, { title: "Éxito" })
    } catch (err) {
      console.error('Error uploading asset:', err)
      error("No se pudo subir el archivo", { title: "Error" })
    } finally {
      setUploadingAsset(null)
      // Limpiar input
      event.target.value = ''
    }
  }

  const handleDeleteAsset = async (type: 'logo' | 'hoja_membretada') => {
    if (!plantel) return

    try {
      const updateData = type === 'logo'
        ? { logo_url: null }
        : { hoja_membretada_url: null }

      const { error: dbError } = await supabase
        .from('planteles')
        .update(updateData)
        .eq('id', plantel.id)

      if (dbError) throw dbError

      setAssets(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : 'hoja_membretada_url']: ''
      }))

      success("Archivo eliminado correctamente", { title: "Éxito" })
    } catch (err) {
      error("Error al eliminar el archivo", { title: "Error" })
    }
  }

  // Verificar permisos y estado de carga
  if (loading || isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando información del plantel...</p>
        </div>
      </div>
    )
  }

  if (!loading && !isDirector) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para acceder a este módulo. Solo los directores pueden gestionar su plantel.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!loading && !plantel) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            No tienes un plantel asignado. Contacta al administrador del sistema.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Verificación adicional para TypeScript
  if (!plantel) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administración de Plantel</h1>
          <p className="text-muted-foreground">
            Gestiona los profesores y recursos de {plantel.nombre}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Director: {plantel.nombre}
        </Badge>
      </div>

      {/* Información del Plantel - Colapsable */}
      <Collapsible open={isPlantelInfoOpen} onOpenChange={setIsPlantelInfoOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Información del Plantel
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isPlantelInfoOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Información del Plantel
                  </CardTitle>
                  <CardDescription>
                    Detalles y configuración de tu plantel
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Guardando..." : "Guardar"}
                    </Button>
                    <Button onClick={handleCancel} variant="outline" disabled={saving}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                    <p className="text-lg">{plantel.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estado</p>
                    <Badge variant={plantel.activo ? "default" : "secondary"}>
                      {plantel.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  {plantel.codigo_plantel && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Código de Plantel</p>
                      <p>{plantel.codigo_plantel}</p>
                    </div>
                  )}
                  {plantel.nivel_educativo && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nivel Educativo</p>
                      <p>{plantel.nivel_educativo}</p>
                    </div>
                  )}
                  {plantel.email && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p>{plantel.email}</p>
                    </div>
                  )}
                  {plantel.telefono && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                      <p>{plantel.telefono}</p>
                    </div>
                  )}
                  {plantel.direccion && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                      <p>{plantel.direccion}</p>
                    </div>
                  )}
                  {(plantel.ciudad || plantel.estado || plantel.codigo_postal) && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Ubicación</p>
                      <p>
                        {[plantel.ciudad, plantel.estado, plantel.codigo_postal].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre del Plantel</Label>
                      <Input
                        id="nombre"
                        value={editForm.nombre}
                        onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                        placeholder="Nombre del plantel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codigo_plantel">Código de Plantel</Label>
                      <Input
                        id="codigo_plantel"
                        value={editForm.codigo_plantel}
                        onChange={(e) => setEditForm(prev => ({ ...prev, codigo_plantel: e.target.value }))}
                        placeholder="Código único del plantel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nivel_educativo">Nivel Educativo</Label>
                      <Input
                        id="nivel_educativo"
                        value={editForm.nivel_educativo}
                        onChange={(e) => setEditForm(prev => ({ ...prev, nivel_educativo: e.target.value }))}
                        placeholder="Ej: Primaria, Secundaria, Preparatoria"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Email de contacto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={editForm.telefono}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                          setEditForm(prev => ({ ...prev, telefono: value }))
                        }}
                        placeholder="Teléfono de contacto (10 dígitos)"
                        maxLength={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ciudad">Ciudad</Label>
                      <Input
                        id="ciudad"
                        value={editForm.ciudad}
                        onChange={(e) => setEditForm(prev => ({ ...prev, ciudad: e.target.value }))}
                        placeholder="Ciudad"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Input
                        id="estado"
                        value={editForm.estado}
                        onChange={(e) => setEditForm(prev => ({ ...prev, estado: e.target.value }))}
                        placeholder="Estado"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codigo_postal">Código Postal</Label>
                      <Input
                        id="codigo_postal"
                        value={editForm.codigo_postal}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 5)
                          setEditForm(prev => ({ ...prev, codigo_postal: value }))
                        }}
                        placeholder="Código postal (5 dígitos)"
                        maxLength={5}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Textarea
                      id="direccion"
                      value={editForm.direccion}
                      onChange={(e) => setEditForm(prev => ({ ...prev, direccion: e.target.value }))}
                      placeholder="Dirección completa del plantel"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Widget de Usuarios Asignados */}
      <PlantelUsersWidget plantelId={plantel.id} />

      {/* Tabs de Gestión */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profesores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Profesores
          </TabsTrigger>
          <TabsTrigger value="recursos" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Recursos Institucionales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profesores" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Gestión de Profesores</CardTitle>
                  <CardDescription>
                    Administra los profesores asignados a tu plantel
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Asignar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Asignar Profesor Existente</DialogTitle>
                        <DialogDescription>
                          Busca y asigna un profesor existente en el sistema al plantel.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="search-user">Buscar profesor</Label>
                          <Input
                            id="search-user"
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        {searchTerm.trim() && (
                          <div className="space-y-2">
                            <Label>Profesores disponibles</Label>
                            {availableUsers.length > 0 ? (
                              <div className="max-h-48 overflow-y-auto space-y-2">
                                {availableUsers.map((user) => (
                                  <div
                                    key={user.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                  >
                                    <div>
                                      <p className="font-medium">{user.full_name}</p>
                                      <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => handleAssignProfesor(user.id)}
                                    >
                                      Asignar
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No se encontraron usuarios con "{searchTerm}"</p>
                                <p className="text-sm">Verifica que el usuario tenga rol de profesor o sin rol asignado</p>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsAssignDialogOpen(false)
                              setSearchTerm('')
                              setAvailableUsers([])
                            }}
                          >
                            Cerrar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button onClick={loadProfesores} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingProfesores ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Cargando profesores...</p>
                </div>
              ) : profesores.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay profesores asignados</h3>
                  <p className="text-muted-foreground mb-4">
                    Aún no tienes profesores asignados a tu plantel.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {profesores.length} profesor{profesores.length !== 1 ? 'es' : ''} asignado{profesores.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profesor</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha de Asignación</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profesores.map((profesor) => (
                        <TableRow key={profesor.id}>
                          <TableCell className="font-medium">
                            {profesor.nombre}
                          </TableCell>
                          <TableCell>{profesor.email}</TableCell>
                          <TableCell>
                            <Badge variant={profesor.activo ? 'default' : 'secondary'}>
                              {profesor.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(profesor.fecha_asignacion).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Remover profesor?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Estás seguro de que deseas remover a {profesor.nombre} del plantel?
                                    Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveProfesor(profesor.user_id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recursos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo del Plantel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Logo Institucional
                </CardTitle>
                <CardDescription>
                  Sube el logo de tu institución. Se usará en los reportes y credenciales.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] bg-muted/20">
                  {assets.logo_url ? (
                    <div className="relative group w-full flex justify-center">
                      <img
                        src={assets.logo_url}
                        alt="Logo plantel"
                        className="max-h-[180px] object-contain"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar logo?</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que quieres eliminar el logo institucional? Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAsset('logo')}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <FileImage className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay logo cargado</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <div className="relative">
                    <input
                      type="file"
                      id="logo-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleUploadAsset(e, 'logo')}
                      disabled={!!uploadingAsset}
                    />
                    <Button variant="outline" asChild disabled={!!uploadingAsset}>
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        {uploadingAsset === 'logo' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Subir Logo
                          </>
                        )}
                      </label>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hoja Membretada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  Hoja Membretada
                </CardTitle>
                <CardDescription>
                  Imagen de fondo para los reportes PDF (A4). Debe incluir encabezado y pie de página.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] bg-muted/20">
                  {assets.hoja_membretada_url ? (
                    <div className="relative group w-full flex justify-center">
                      <img
                        src={assets.hoja_membretada_url}
                        alt="Hoja membretada"
                        className="max-h-[180px] object-contain border shadow-sm"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" asChild>
                            <a href={assets.hoja_membretada_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ver
                            </a>
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteAsset('hoja_membretada')}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <FileImage className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay hoja membretada</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <div className="relative">
                    <input
                      type="file"
                      id="hoja-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleUploadAsset(e, 'hoja_membretada')}
                      disabled={!!uploadingAsset}
                    />
                    <Button variant="outline" asChild disabled={!!uploadingAsset}>
                      <label htmlFor="hoja-upload" className="cursor-pointer">
                        {uploadingAsset === 'hoja_membretada' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Subir Hoja
                          </>
                        )}
                      </label>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


      </Tabs>
    </div>
  )
}