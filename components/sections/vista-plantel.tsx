"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Plantel } from '@/lib/profile'
import { getPlantelWithLimits, PlantelWithLimits, updatePlantel, getPlantelUsers, getUserPlantelAssignments, assignUserToPlantel, canAddUserToPlantel } from '@/lib/planteles'
// Removed import for searchUsers - will be defined locally
import { inviteUserByEmail } from '@/lib/profile'
import { useAdminCheck } from '@/hooks/use-roles'
// Define types locally since @/types/auth module is not found
type Profile = {
  id: string
  email: string
  full_name?: string
  activo: boolean
}

type UserRole = 'profesor' | 'director' | 'administrador'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  GraduationCap, 
  Shield, 
  Settings, 
  UserPlus, 
  Edit, 
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard
} from 'lucide-react'

interface VistaPlantelProps {
  plantelId: string
  onBack: () => void
}

interface UsuarioPlantel {
  id: string
  user_id: string
  nombre: string
  email: string
  rol: 'profesor' | 'director' | 'administrador'
  activo: boolean
  fecha_asignacion: string
}

const nivelesEducativos = [
  'Preescolar',
  'Primaria',
  'Secundaria',
  'Preparatoria'
]

export function VistaPlantel({ plantelId, onBack }: VistaPlantelProps) {
  const { isAdmin } = useAdminCheck()
  const { toast } = useToast()
  const [plantel, setPlantel] = useState<PlantelWithLimits | null>(null)
  const [usuarios, setUsuarios] = useState<UsuarioPlantel[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditInfoDialogOpen, setIsEditInfoDialogOpen] = useState(false)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [selectedRole, setSelectedRole] = useState<UserRole>('profesor')
  const [isSearching, setIsSearching] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  
  // Estados para invitaciones
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('profesor')
  const [inviting, setInviting] = useState(false)
  const [editFormData, setEditFormData] = useState({
    max_usuarios: 0,
    max_profesores: 0,
    max_directores: 0,
    plan_suscripcion: '',
    estado_suscripcion: '',
    fecha_vencimiento: ''
  })
  const [editInfoFormData, setEditInfoFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    codigo_plantel: '',
    nivel_educativo: '',
    ciudad: '',
    estado: '',
    codigo_postal: ''
  })

  // Cargar datos del plantel
  const loadPlantelData = async () => {
    setLoading(true)
    try {
      const plantelData = await getPlantelWithLimits(plantelId)
      setPlantel(plantelData)
      
      // Cargar usuarios del plantel
      const usuariosData = await getPlantelUsers(plantelId)
      const usuariosFormateados: UsuarioPlantel[] = usuariosData.map((assignment: any) => ({
        id: assignment.id,
        user_id: assignment.user_id,
        nombre: assignment.profiles?.full_name || assignment.profiles?.email || 'Usuario sin nombre',
        email: assignment.profiles?.email || 'Sin email',
        rol: assignment.role,
        activo: assignment.activo,
        fecha_asignacion: assignment.assigned_at
      }))
      setUsuarios(usuariosFormateados)
      
      setEditFormData({
        max_usuarios: plantelData?.max_usuarios || 0,
        max_profesores: plantelData?.max_profesores || 0,
        max_directores: plantelData?.max_directores || 0,
        plan_suscripcion: plantelData?.plan_suscripcion || '',
        estado_suscripcion: plantelData?.estado_suscripcion || '',
        fecha_vencimiento: plantelData?.fecha_vencimiento || ''
      })
      
      setEditInfoFormData({
        nombre: plantelData?.nombre || '',
        direccion: plantelData?.direccion || '',
        telefono: plantelData?.telefono || '',
        email: plantelData?.email || '',
        codigo_plantel: plantelData?.codigo_plantel || '',
        nivel_educativo: plantelData?.nivel_educativo || '',
        ciudad: plantelData?.ciudad || '',
        estado: plantelData?.estado || '',
        codigo_postal: plantelData?.codigo_postal || ''
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la información del plantel",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlantelData()
  }, [plantelId])

  // Actualizar límites del plantel
  const handleUpdateLimits = async () => {
    try {
      const success = await updatePlantel(plantelId, editFormData)
      if (success) {
        toast({
          title: "Éxito",
          description: "Límites actualizados correctamente"
        })
        setIsEditDialogOpen(false)
        loadPlantelData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar los límites",
        variant: "destructive"
      })
    }
  }

  // Actualizar información básica del plantel
  const handleUpdateInfo = async () => {
    try {
      const success = await updatePlantel(plantelId, editInfoFormData)
      if (success) {
        toast({
          title: "Éxito",
          description: "Información actualizada correctamente"
        })
        setIsEditInfoDialogOpen(false)
        loadPlantelData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar la información",
        variant: "destructive"
      })
    }
  }

  // Buscar usuarios
  const searchUsers = async (term: string): Promise<Profile[]> => {
    if (term.length < 3) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
        .eq('activo', true)
        .limit(10)

      if (error) throw error
      
      // Filtrar usuarios que ya están en el plantel
      const plantelUsers = plantel ? await getPlantelUsers(plantel.id) : []
      const existingUserIds = plantelUsers.map(assignment => assignment.user_id)
      
      const filtered = data?.filter(user => 
        !existingUserIds.includes(user.id)
      ) || []
      
      return filtered
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  }

  const handleSearchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchUsers(searchTerm)
      setSearchResults(results)
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al buscar usuarios",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Asignar usuario al plantel
  const handleAssignUser = async (userId: string) => {
    if (!plantel) return

    // Verificar si se puede agregar el usuario
    const canAdd = await canAddUserToPlantel(plantelId, selectedRole)
    if (!canAdd) {
      toast({
        title: "Error",
        description: "No se puede agregar el usuario. Se ha alcanzado el límite máximo para este plantel.",
        variant: "destructive"
      })
      return
    }

    setIsAssigning(true)
    try {
      const assignment = await assignUserToPlantel(userId, plantelId, selectedRole)
      if (assignment) {
        toast({
          title: "Éxito",
          description: "Usuario asignado correctamente al plantel"
        })
        setIsAddUserDialogOpen(false)
        setSearchTerm('')
        setSearchResults([])
        loadPlantelData()
      } else {
        toast({
          title: "Error",
          description: "Error al asignar el usuario",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al asignar el usuario",
        variant: "destructive"
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const handleInviteUser = async () => {
    if (!plantel || !inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email válido",
        variant: "destructive"
      })
      return
    }

    setInviting(true)
    try {
      // Verificar límites antes de invitar
      const canAdd = await canAddUserToPlantel(plantel.id, inviteRole)
      
      if (!canAdd) {
        toast({
          title: "Límite alcanzado",
          description: `No se puede agregar más usuarios con el rol ${inviteRole}. Se ha alcanzado el límite máximo para este plantel.`,
          variant: "destructive"
        })
        return
      }

      const result = await inviteUserByEmail(
        inviteEmail.trim(),
        plantel.id,
        inviteRole,
        'current-user-id' // TODO: obtener el ID del usuario actual
      )

      if (result.success) {
        toast({
          title: "Invitación enviada",
          description: `Se ha enviado una invitación a ${inviteEmail}`
        })
        setInviteEmail('')
        setInviteRole('profesor')
        setIsInviteDialogOpen(false)
        loadPlantelData()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al enviar la invitación",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al enviar la invitación",
        variant: "destructive"
      })
    } finally {
      setInviting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando información del plantel...</p>
        </div>
      </div>
    )
  }

  if (!plantel) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No se pudo cargar la información del plantel</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    )
  }

  const getProgressColor = (current: number, max: number) => {
    const percentage = (current / max) * 100
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <Building2 className="h-6 w-6" />
              <span>{plantel.nombre}</span>
            </h1>
            <p className="text-muted-foreground">
              {plantel.nivel_educativo} • {plantel.ciudad}, {plantel.estado}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={plantel.activo ? 'default' : 'secondary'}>
            {plantel.activo ? 'Activo' : 'Inactivo'}
          </Badge>
          <Badge variant={
            plantel.estado_suscripcion === 'activa' ? 'default' :
            plantel.estado_suscripcion === 'suspendida' ? 'destructive' : 'secondary'
          }>
            {plantel.plan_suscripcion ? plantel.plan_suscripcion.charAt(0).toUpperCase() + plantel.plan_suscripcion.slice(1) : 'Sin plan'}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
          <TabsTrigger value="subscription">Suscripción</TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Información General</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{plantel.direccion}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{plantel.telefono || 'No especificado'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{plantel.email || 'No especificado'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Código: {plantel.codigo_plantel || 'No asignado'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Suscripción</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plan actual</p>
                  <p className="font-medium">{plantel.plan_suscripcion || 'Sin plan'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={
                    plantel.estado_suscripcion === 'activa' ? 'default' :
                    plantel.estado_suscripcion === 'suspendida' ? 'destructive' : 'secondary'
                  }>
                    {plantel.estado_suscripcion || 'No definido'}
                  </Badge>
                </div>
                {plantel.fecha_vencimiento && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de vencimiento</p>
                    <p className="font-medium">{new Date(plantel.fecha_vencimiento).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Estadísticas de usuarios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span>Usuarios Totales</span>
                  </div>
                  <span className="text-2xl font-bold">{plantel.usuarios_actuales || 0}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Utilizados</span>
                    <span>{plantel.usuarios_actuales || 0} / {plantel.max_usuarios || 0}</span>
                  </div>
                  <Progress 
                    value={((plantel.usuarios_actuales || 0) / (plantel.max_usuarios || 1)) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {plantel.usuarios_disponibles || 0} disponibles
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-5 w-5 text-green-500" />
                    <span>Profesores</span>
                  </div>
                  <span className="text-2xl font-bold">{plantel.profesores_actuales || 0}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Utilizados</span>
                    <span>{plantel.profesores_actuales || 0} / {plantel.max_profesores || 0}</span>
                  </div>
                  <Progress 
                    value={((plantel.profesores_actuales || 0) / (plantel.max_profesores || 1)) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {plantel.profesores_disponibles || 0} disponibles
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-purple-500" />
                    <span>Directores</span>
                  </div>
                  <span className="text-2xl font-bold">{plantel.directores_actuales || 0}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Utilizados</span>
                    <span>{plantel.directores_actuales || 0} / {plantel.max_directores || 0}</span>
                  </div>
                  <Progress 
                    value={((plantel.directores_actuales || 0) / (plantel.max_directores || 1)) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {plantel.directores_disponibles || 0} disponibles
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Usuarios */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Usuarios del Plantel</h3>
            <div className="flex space-x-2">
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Invitar Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invitar Usuario por Email</DialogTitle>
                    <DialogDescription>
                      Envía una invitación por email para que se una a este plantel
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="inviteEmail">Email del Usuario</Label>
                      <Input
                        id="inviteEmail"
                        type="email"
                        placeholder="usuario@ejemplo.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="inviteRole">Rol del Usuario</Label>
                      <Select value={inviteRole} onValueChange={(value: UserRole) => setInviteRole(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="profesor">Profesor</SelectItem>
                          <SelectItem value="director">Director</SelectItem>
                          <SelectItem value="administrador">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => {
                      setIsInviteDialogOpen(false)
                      setInviteEmail('')
                      setInviteRole('profesor')
                    }}>
                      Cancelar
                    </Button>
                    <Button onClick={handleInviteUser} disabled={inviting}>
                      {inviting ? 'Enviando...' : 'Enviar Invitación'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Agregar Usuario
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar Usuario al Plantel</DialogTitle>
                  <DialogDescription>
                    Busca y asigna un usuario existente a este plantel
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol del Usuario</Label>
                    <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="profesor">Profesor</SelectItem>
                        <SelectItem value="director">Director</SelectItem>
                        <SelectItem value="administrador">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="search">Buscar Usuario</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="search"
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                      />
                      <Button onClick={handleSearchUsers} disabled={isSearching}>
                        {isSearching ? 'Buscando...' : 'Buscar'}
                      </Button>
                    </div>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <Label>Resultados de Búsqueda</Label>
                      <div className="max-h-60 overflow-y-auto border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Usuario</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Acción</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {searchResults.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                  {user.full_name || 'Sin nombre'}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAssignUser(user.id)}
                                    disabled={isAssigning}
                                  >
                                    {isAssigning ? 'Asignando...' : 'Asignar'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {searchTerm && searchResults.length === 0 && !isSearching && (
                    <p className="text-center text-muted-foreground py-4">
                      No se encontraron usuarios con ese criterio de búsqueda
                    </p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsAddUserDialogOpen(false)
                    setSearchTerm('')
                    setSearchResults([])
                  }}>
                    Cancelar
                  </Button>
                </div>
              </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Asignación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay usuarios asignados a este plantel
                      </TableCell>
                    </TableRow>
                  ) : (
                    usuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.nombre}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={usuario.activo ? 'default' : 'secondary'}>
                            {usuario.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(usuario.fecha_asignacion).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configuración */}
        <TabsContent value="settings" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Usuarios del Plantel</h3>
          </div>
            <h3 className="text-lg font-semibold">Configuración del Plantel</h3>
            <div className="flex space-x-2">
              <Dialog open={isEditInfoDialogOpen} onOpenChange={setIsEditInfoDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Información
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Editar Información del Plantel</DialogTitle>
                    <DialogDescription>
                      Modifica la información básica del plantel
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_nombre">Nombre *</Label>
                        <Input
                          id="edit_nombre"
                          value={editInfoFormData.nombre}
                          onChange={(e) => setEditInfoFormData(prev => ({ ...prev, nombre: e.target.value }))}
                          placeholder="Nombre del plantel"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_codigo_plantel">Código del Plantel</Label>
                        <Input
                          id="edit_codigo_plantel"
                          value={editInfoFormData.codigo_plantel}
                          onChange={(e) => setEditInfoFormData(prev => ({ ...prev, codigo_plantel: e.target.value }))}
                          placeholder="Código único"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit_nivel_educativo">Nivel Educativo *</Label>
                      <Select 
                        value={editInfoFormData.nivel_educativo} 
                        onValueChange={(value) => setEditInfoFormData(prev => ({ ...prev, nivel_educativo: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el nivel educativo" />
                        </SelectTrigger>
                        <SelectContent>
                          {nivelesEducativos.map((nivel) => (
                            <SelectItem key={nivel} value={nivel}>
                              {nivel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit_direccion">Dirección</Label>
                      <Textarea
                        id="edit_direccion"
                        value={editInfoFormData.direccion}
                        onChange={(e) => setEditInfoFormData(prev => ({ ...prev, direccion: e.target.value }))}
                        placeholder="Dirección completa del plantel"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_ciudad">Ciudad</Label>
                        <Input
                          id="edit_ciudad"
                          value={editInfoFormData.ciudad}
                          onChange={(e) => setEditInfoFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                          placeholder="Ciudad"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_estado">Estado</Label>
                        <Input
                          id="edit_estado"
                          value={editInfoFormData.estado}
                          onChange={(e) => setEditInfoFormData(prev => ({ ...prev, estado: e.target.value }))}
                          placeholder="Estado"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_codigo_postal">Código Postal</Label>
                        <Input
                          id="edit_codigo_postal"
                          value={editInfoFormData.codigo_postal}
                          onChange={(e) => setEditInfoFormData(prev => ({ ...prev, codigo_postal: e.target.value }))}
                          placeholder="CP"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_telefono">Teléfono</Label>
                        <Input
                          id="edit_telefono"
                          value={editInfoFormData.telefono}
                          onChange={(e) => setEditInfoFormData(prev => ({ ...prev, telefono: e.target.value }))}
                          placeholder="Teléfono de contacto"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_email">Email</Label>
                        <Input
                          id="edit_email"
                          type="email"
                          value={editInfoFormData.email}
                          onChange={(e) => setEditInfoFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Email de contacto"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditInfoDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleUpdateInfo}>
                      Guardar Cambios
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Settings className="h-4 w-4 mr-2" />
                    Editar Límites
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                  <DialogTitle>Editar Límites de Usuarios</DialogTitle>
                  <DialogDescription>
                    Modifica los límites máximos de usuarios para este plantel
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max_usuarios">Máximo Usuarios</Label>
                      <Input
                        id="max_usuarios"
                        type="number"
                        min="1"
                        value={editFormData.max_usuarios}
                        onChange={(e) => setEditFormData(prev => ({ 
                          ...prev, 
                          max_usuarios: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_profesores">Máximo Profesores</Label>
                      <Input
                        id="max_profesores"
                        type="number"
                        min="1"
                        value={editFormData.max_profesores}
                        onChange={(e) => setEditFormData(prev => ({ 
                          ...prev, 
                          max_profesores: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_directores">Máximo Directores</Label>
                      <Input
                        id="max_directores"
                        type="number"
                        min="1"
                        value={editFormData.max_directores}
                        onChange={(e) => setEditFormData(prev => ({ 
                          ...prev, 
                          max_directores: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleUpdateLimits}>
                      Guardar Cambios
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Datos generales del plantel educativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nombre</Label>
                    <p className="text-base font-medium">{plantel.nombre}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Código del Plantel</Label>
                    <p className="text-base">{plantel.codigo_plantel || 'No asignado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nivel Educativo</Label>
                    <p className="text-base">{plantel.nivel_educativo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Dirección</Label>
                    <p className="text-base">{plantel.direccion || 'No especificada'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Ciudad</Label>
                    <p className="text-base">{plantel.ciudad || 'No especificada'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                    <p className="text-base">{plantel.estado || 'No especificado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Código Postal</Label>
                    <p className="text-base">{plantel.codigo_postal || 'No especificado'}</p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Teléfono</Label>
                      <p className="text-base">{plantel.telefono || 'No especificado'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-base">{plantel.email || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Límites Actuales</CardTitle>
              <CardDescription>
                Configuración de límites de usuarios para este plantel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Usuarios Totales</span>
                  </div>
                  <p className="text-2xl font-bold">{plantel.max_usuarios || 0}</p>
                  <p className="text-sm text-muted-foreground">Límite máximo</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <GraduationCap className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Profesores</span>
                  </div>
                  <p className="text-2xl font-bold">{plantel.max_profesores || 0}</p>
                  <p className="text-sm text-muted-foreground">Límite máximo</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Directores</span>
                  </div>
                  <p className="text-2xl font-bold">{plantel.max_directores || 0}</p>
                  <p className="text-sm text-muted-foreground">Límite máximo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Suscripción */}
        <TabsContent value="subscription" className="space-y-6">
          <h3 className="text-lg font-semibold">Información de Suscripción</h3>
          
          <Card>
            <CardHeader>
              <CardTitle>Estado de la Suscripción</CardTitle>
              <CardDescription>
                Detalles del plan y estado de suscripción del plantel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium">Plan de Suscripción</Label>
                  <p className="text-lg font-semibold mt-1">
                    {plantel.plan_suscripcion ? plantel.plan_suscripcion.charAt(0).toUpperCase() + plantel.plan_suscripcion.slice(1) : 'Sin plan asignado'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Estado</Label>
                  <div className="mt-1">
                    <Badge variant={
                      plantel.estado_suscripcion === 'activa' ? 'default' :
                      plantel.estado_suscripcion === 'suspendida' ? 'destructive' : 'secondary'
                    }>
                      {plantel.estado_suscripcion || 'No definido'}
                    </Badge>
                  </div>
                </div>
                {plantel.fecha_vencimiento && (
                  <div>
                    <Label className="text-sm font-medium">Fecha de Vencimiento</Label>
                    <p className="text-lg font-semibold mt-1">
                      {new Date(plantel.fecha_vencimiento).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              
              {plantel.estado_suscripcion === 'activa' && plantel.fecha_vencimiento && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ Suscripción activa hasta el {new Date(plantel.fecha_vencimiento).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {plantel.estado_suscripcion === 'suspendida' && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    ⚠️ Suscripción suspendida. Contacte al administrador para reactivar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default VistaPlantel