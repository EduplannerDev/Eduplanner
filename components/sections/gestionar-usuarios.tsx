"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import { Profile, UserRole, Plantel } from '@/lib/profile'
import { updateProfile, inviteUserByEmail } from '@/lib/profile'
import { getAllPlanteles, getPlantelUsers, assignUserToPlantel, removeUserFromPlantel, updateUserRoleInPlantel, getPlantelWithLimits, canAddUserToPlantel, assignUserToPlantelWithValidation, PlantelWithLimits } from '@/lib/planteles'
import { validateInvitation } from '@/lib/invitations'
import { useRoles } from '@/hooks/use-roles'
import { supabase } from '@/lib/supabase'
import { Users, UserPlus, Edit, Trash2, Shield } from 'lucide-react'

interface UserWithPlantel extends Profile {
  plantel?: Plantel
}

const roleLabels: Record<UserRole, string> = {
  administrador: 'Administrador',
  director: 'Director',
  profesor: 'Profesor'
}

const roleColors: Record<UserRole, 'default' | 'secondary' | 'destructive'> = {
  administrador: 'destructive',
  director: 'default',
  profesor: 'secondary'
}

export function GestionarUsuarios() {
  const { isAdmin, isDirector, plantel: userPlantel, loading: roleLoading } = useRoles()
  const [users, setUsers] = useState<UserWithPlantel[]>([])
  const [planteles, setPlanteles] = useState<Plantel[]>([])
  const [selectedPlantel, setSelectedPlantel] = useState<string>('')
  const [selectedPlantelInfo, setSelectedPlantelInfo] = useState<PlantelWithLimits | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithPlantel | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [newUserRole, setNewUserRole] = useState<UserRole>('profesor')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('profesor')
  const [inviting, setInviting] = useState(false)

  // Determinar qué planteles puede gestionar el usuario
  const canManageUsers = isAdmin || isDirector

  // Cargar planteles disponibles
  const loadPlanteles = async () => {
    try {
      if (isAdmin) {
        const data = await getAllPlanteles()
        setPlanteles(data)
        if (data.length > 0 && !selectedPlantel) {
          setSelectedPlantel(data[0].id)
        }
      } else if (isDirector && userPlantel) {
        setPlanteles([userPlantel])
        setSelectedPlantel(userPlantel.id)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los planteles",
        variant: "destructive"
      })
    }
  }

  // Cargar usuarios del plantel seleccionado
  const loadUsers = async () => {
    if (!selectedPlantel) return
    
    setLoading(true)
    try {
      // Cargar información del plantel con límites
      console.log('Cargando información del plantel:', selectedPlantel)
      const plantelInfo = await getPlantelWithLimits(selectedPlantel)
      console.log('Información del plantel cargada:', plantelInfo)
      setSelectedPlantelInfo(plantelInfo)
      
      // Obtener usuarios asignados al plantel
      const assignments = await getPlantelUsers(selectedPlantel)
      
      // También obtener usuarios con plantel_id principal
      const { data: profileUsers, error } = await supabase
        .from('profiles')
        .select(`
          *,
          plantel:planteles(*)
        `)
        .eq('plantel_id', selectedPlantel)
        .eq('activo', true)

      if (error) {
        console.error('Error loading users:', error)
        return
      }

      // Combinar usuarios de asignaciones y perfiles principales
      const allUsers: UserWithPlantel[] = []
      
      // Agregar usuarios de asignaciones
      assignments.forEach(assignment => {
        if (assignment.profiles) {
          allUsers.push({
            ...assignment.profiles,
            role: assignment.role, // Usar el rol de la asignación
            plantel: assignment.plantel
          })
        }
      })
      
      // Agregar usuarios con plantel principal (evitar duplicados)
      profileUsers?.forEach(user => {
        if (!allUsers.find(u => u.id === user.id)) {
          allUsers.push(user)
        }
      })

      setUsers(allUsers)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canManageUsers) {
      loadPlanteles()
    }
  }, [isAdmin, isDirector, userPlantel])

  useEffect(() => {
    if (selectedPlantel) {
      loadUsers()
    }
  }, [selectedPlantel])

  // Actualizar rol de usuario
  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    if (!selectedPlantel) return

    try {
      // Actualizar en el perfil principal
      const success = await updateProfile(userId, { role: newRole })
      
      if (success) {
        // También actualizar en asignaciones si existe
        await updateUserRoleInPlantel(userId, selectedPlantel, newRole)
        
        toast({
          title: "Éxito",
          description: "Rol actualizado correctamente"
        })
        loadUsers()
      } else {
        throw new Error('Error al actualizar')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar el rol del usuario",
        variant: "destructive"
      })
    }
  }

  // Invitar nuevo usuario por email
  const handleInviteUser = async () => {
    if (!selectedPlantel || !inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email válido",
        variant: "destructive"
      })
      return
    }

    setInviting(true)
    try {
      // Validar la invitación antes de proceder
      const validation = await validateInvitation(inviteEmail.trim(), selectedPlantel, inviteRole)
      
      if (!validation.valid) {
        toast({
          title: "Error de validación",
          description: validation.error || "No se puede enviar la invitación",
          variant: "destructive"
        })
        return
      }

      // Verificar límites antes de invitar
      const canAdd = await canAddUserToPlantel(selectedPlantel, inviteRole)
      
      if (!canAdd) {
        toast({
          title: "Límite alcanzado",
          description: `No se puede agregar más usuarios con el rol ${roleLabels[inviteRole]}. Se ha alcanzado el límite máximo para este plantel.`,
          variant: "destructive"
        })
        return
      }

      const result = await inviteUserByEmail(
        inviteEmail.trim(),
        selectedPlantel,
        inviteRole,
        'current-user-id' // TODO: obtener el ID del usuario actual
      )

      if (result.success) {
        toast({
          title: "Invitación enviada",
          description: `Se ha enviado una invitación a ${inviteEmail}. El usuario recibirá un email para aceptar la invitación.`
        })
        setInviteEmail('')
        setInviteRole('profesor')
        setIsInviteDialogOpen(false)
        loadUsers()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al enviar la invitación",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error in handleInviteUser:', error)
      toast({
        title: "Error",
        description: "Error al enviar la invitación",
        variant: "destructive"
      })
    } finally {
      setInviting(false)
    }
  }

  // Asignar plantel principal a usuario
  const handleAssignMainPlantel = async (userId: string) => {
    console.log('=== handleAssignMainPlantel START ===')
    console.log('userId:', userId)
    console.log('selectedPlantel:', selectedPlantel)
    console.log('newUserRole:', newUserRole)
    
    if (!selectedPlantel) {
      console.log('ERROR: No plantel selected')
      toast({
        title: "Error",
        description: "No hay plantel seleccionado",
        variant: "destructive"
      })
      return
    }

    try {
      console.log('Step 1: Checking if user can be added to plantel...')
      const canAdd = await canAddUserToPlantel(selectedPlantel, newUserRole)
      console.log('canAdd result:', canAdd)
      
      if (!canAdd) {
        console.log('ERROR: Cannot add user - limit reached')
        toast({
          title: "Límite alcanzado",
          description: `No se puede agregar más usuarios con el rol ${roleLabels[newUserRole]}. Se ha alcanzado el límite máximo para este plantel.`,
          variant: "destructive"
        })
        return
      }

      console.log('Step 2: Updating profile...')
      const success = await updateProfile(userId, { 
        plantel_id: selectedPlantel,
        role: newUserRole
      })
      console.log('updateProfile result:', success)
      
      if (success) {
        console.log('SUCCESS: User assigned successfully')
        toast({
          title: "Éxito",
          description: "Usuario asignado al plantel correctamente"
        })
        console.log('Step 3: Reloading users...')
        await loadUsers()
        console.log('Step 4: Closing dialog...')
        setIsDialogOpen(false)
        console.log('=== handleAssignMainPlantel END SUCCESS ===')
      } else {
        throw new Error('updateProfile returned false')
      }
    } catch (error) {
      console.error('ERROR in handleAssignMainPlantel:', error)
      toast({
        title: "Error",
        description: "Error al asignar el usuario al plantel",
        variant: "destructive"
      })
      console.log('=== handleAssignMainPlantel END ERROR ===')
    }
  }

  // Remover usuario del plantel
  const handleRemoveUser = async (userId: string) => {
    if (!selectedPlantel) return
    
    if (!confirm('¿Estás seguro de que quieres remover este usuario del plantel?')) {
      return
    }

    try {
      // Remover asignación específica
      await removeUserFromPlantel(userId, selectedPlantel)
      
      // Si es el plantel principal, también removerlo
      const user = users.find(u => u.id === userId)
      if (user?.plantel_id === selectedPlantel) {
        await updateProfile(userId, { plantel_id: null })
      }
      
      toast({
        title: "Éxito",
        description: "Usuario removido del plantel correctamente"
      })
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al remover el usuario del plantel",
        variant: "destructive"
      })
    }
  }

  // Buscar usuarios para asignar
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)

  const searchUsers = async (term: string) => {
    if (term.length < 3) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
        .eq('activo', true)
        .limit(10)

      if (error) throw error
      
      // Filtrar usuarios que ya están en el plantel
      const filtered = data?.filter(user => 
        !users.find(u => u.id === user.id)
      ) || []
      
      setSearchResults(filtered)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearching(false)
    }
  }

  // Filtrar usuarios mostrados
  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (roleLoading) {
    return <div className="flex justify-center p-8">Cargando...</div>
  }

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-muted-foreground">
            Solo los administradores y directores pueden gestionar usuarios.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestionar Usuarios</h2>
          <p className="text-muted-foreground">
            Administra los usuarios y sus roles en los planteles
          </p>
        </div>
        <div className="flex space-x-2">

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
             <DialogTrigger asChild>
               <Button disabled={!selectedPlantel} variant="outline">
                 <UserPlus className="h-4 w-4 mr-2" />
                 Asignar Usuario
               </Button>
             </DialogTrigger>
             <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Usuario al Plantel</DialogTitle>
              <DialogDescription>
                Busca y asigna un usuario al plantel seleccionado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar Usuario</Label>
                <Input
                  id="search"
                  placeholder="Buscar por nombre o email..."
                  onChange={(e) => searchUsers(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Rol a Asignar</Label>
                <Select value={newUserRole} onValueChange={(value: UserRole) => setNewUserRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isAdmin && (
                      <SelectItem value="administrador">Administrador</SelectItem>
                    )}
                    <SelectItem value="director">Director</SelectItem>
                    <SelectItem value="profesor">Profesor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {searching && (
                <div className="text-center py-4">Buscando...</div>
              )}
              
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label>Resultados de Búsqueda</Label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {searchResults.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback>
                              {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.full_name || 'Sin nombre'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            console.log('=== BUTTON CLICK EVENT ===')
                            console.log('Clicked for user:', user.id)
                            console.log('About to call handleAssignMainPlantel')
                            handleAssignMainPlantel(user.id)
                          }}
                          size="sm"
                          variant="default"
                        >
                          Asignar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedPlantel}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invitar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Envía una invitación por email para que un nuevo usuario se registre y sea asignado automáticamente al plantel
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email del Usuario</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invite-role">Rol a Asignar</Label>
                <Select value={inviteRole} onValueChange={(value: UserRole) => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isAdmin && (
                      <SelectItem value="administrador">Administrador</SelectItem>
                    )}
                    <SelectItem value="director">Director</SelectItem>
                    <SelectItem value="profesor">Profesor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsInviteDialogOpen(false)}
                  disabled={inviting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleInviteUser}
                  disabled={inviting || !inviteEmail.trim()}
                >
                  {inviting ? 'Enviando...' : 'Enviar Invitación'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selector de plantel */}
      {isAdmin && planteles.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Label htmlFor="plantel-select">Plantel:</Label>
              <Select value={selectedPlantel} onValueChange={setSelectedPlantel}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Selecciona un plantel" />
                </SelectTrigger>
                <SelectContent>
                  {planteles.map((plantel) => (
                    <SelectItem key={plantel.id} value={plantel.id}>
                      {plantel.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información de límites del plantel */}
      {selectedPlantelInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Límites del Plantel</span>
            </CardTitle>
            <CardDescription>
              Control de usuarios y suscripción para {selectedPlantelInfo.nombre}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Usuarios Totales */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Usuarios Totales</span>
                  <Badge variant={selectedPlantelInfo.usuarios_disponibles && selectedPlantelInfo.usuarios_disponibles > 0 ? 'default' : 'destructive'}>
                    {selectedPlantelInfo.usuarios_actuales || 0} / {selectedPlantelInfo.max_usuarios || 0}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (selectedPlantelInfo.usuarios_disponibles || 0) > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, ((selectedPlantelInfo.usuarios_actuales || 0) / (selectedPlantelInfo.max_usuarios || 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedPlantelInfo.usuarios_disponibles || 0} disponibles
                </p>
              </div>

              {/* Profesores */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Profesores</span>
                  <Badge variant={selectedPlantelInfo.profesores_disponibles && selectedPlantelInfo.profesores_disponibles > 0 ? 'default' : 'destructive'}>
                    {selectedPlantelInfo.profesores_actuales || 0} / {selectedPlantelInfo.max_profesores || 0}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (selectedPlantelInfo.profesores_disponibles || 0) > 0 ? 'bg-blue-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, ((selectedPlantelInfo.profesores_actuales || 0) / (selectedPlantelInfo.max_profesores || 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedPlantelInfo.profesores_disponibles || 0} disponibles
                </p>
              </div>

              {/* Directores */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Directores</span>
                  <Badge variant={selectedPlantelInfo.directores_disponibles && selectedPlantelInfo.directores_disponibles > 0 ? 'default' : 'destructive'}>
                    {selectedPlantelInfo.directores_actuales || 0} / {selectedPlantelInfo.max_directores || 0}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (selectedPlantelInfo.directores_disponibles || 0) > 0 ? 'bg-purple-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, ((selectedPlantelInfo.directores_actuales || 0) / (selectedPlantelInfo.max_directores || 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedPlantelInfo.directores_disponibles || 0} disponibles
                </p>
              </div>
            </div>

            {/* Información de suscripción */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Plan de Suscripción</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPlantelInfo.plan_suscripcion?.charAt(0).toUpperCase() + selectedPlantelInfo.plan_suscripcion?.slice(1) || 'No definido'}
                  </p>
                </div>
                <Badge variant={
                  selectedPlantelInfo.estado_suscripcion === 'activa' ? 'default' :
                  selectedPlantelInfo.estado_suscripcion === 'suspendida' ? 'destructive' : 'secondary'
                }>
                  {selectedPlantelInfo.estado_suscripcion?.charAt(0).toUpperCase() + selectedPlantelInfo.estado_suscripcion?.slice(1) || 'No definido'}
                </Badge>
              </div>
              {selectedPlantelInfo.fecha_vencimiento && (
                <p className="text-xs text-muted-foreground mt-1">
                  Vence: {new Date(selectedPlantelInfo.fecha_vencimiento).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtro de búsqueda */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      {/* Lista de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Plantel</CardTitle>
          <CardDescription>
            {selectedPlantel ? 
              `Usuarios asignados a ${planteles.find(p => p.id === selectedPlantel)?.nombre}` :
              'Selecciona un plantel para ver sus usuarios'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando usuarios...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay usuarios asignados a este plantel
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback>
                            {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.full_name || 'Sin nombre'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleColors[user.role]}>
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.activo ? 'default' : 'secondary'}>
                        {user.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Select
                          value={user.role}
                          onValueChange={(newRole: UserRole) => handleUpdateRole(user.id, newRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {isAdmin && (
                              <SelectItem value="administrador">Admin</SelectItem>
                            )}
                            <SelectItem value="director">Director</SelectItem>
                            <SelectItem value="profesor">Profesor</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}