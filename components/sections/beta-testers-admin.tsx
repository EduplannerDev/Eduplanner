"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Search, User, Settings, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'

interface User {
  id: string
  full_name: string
  email: string
  is_beta_tester: boolean
  role: string
  plantel?: { nombre: string }
  beta_features: Array<{
    feature_key: string
    feature_name: string
    is_enabled: boolean
    expires_at?: string
  }>
}

interface BetaFeature {
  id: string
  feature_key: string
  feature_name: string
  description: string
  is_active: boolean
}

export function BetaTestersAdmin() {
  const [users, setUsers] = useState<User[]>([])
  const [availableFeatures, setAvailableFeatures] = useState<BetaFeature[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [expirationDate, setExpirationDate] = useState('')
  const { toast } = useToast()

  // Cargar datos
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Obtener todos los usuarios con su estado de beta tester
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          is_beta_tester,
          role,
          plantel:planteles(nombre)
        `)
        .eq('activo', true)
        .order('full_name')

      if (usersError) {
        throw new Error(`Error al obtener usuarios: ${usersError.message}`)
      }

      // Obtener funcionalidades beta disponibles
      const { data: features, error: featuresError } = await supabase
        .from('beta_features')
        .select('*')
        .eq('is_active', true)
        .order('feature_name')

      if (featuresError) {
        throw new Error(`Error al obtener features: ${featuresError.message}`)
      }

      // Obtener asignaciones de features por usuario
      const { data: userFeatures, error: userFeaturesError } = await supabase
        .from('user_beta_features')
        .select(`
          user_id,
          feature_id,
          is_enabled,
          expires_at,
          beta_features(feature_key, feature_name)
        `)
        .eq('is_enabled', true)

      if (userFeaturesError) {
        throw new Error(`Error al obtener asignaciones: ${userFeaturesError.message}`)
      }

      // Organizar las asignaciones por usuario
      const userFeaturesMap = new Map()
      userFeatures?.forEach(assignment => {
        if (!userFeaturesMap.has(assignment.user_id)) {
          userFeaturesMap.set(assignment.user_id, [])
        }
        userFeaturesMap.get(assignment.user_id).push({
          feature_key: assignment.beta_features.feature_key,
          feature_name: assignment.beta_features.feature_name,
          is_enabled: assignment.is_enabled,
          expires_at: assignment.expires_at
        })
      })

      // Combinar datos
      const result = users?.map(user => ({
        ...user,
        beta_features: userFeaturesMap.get(user.id) || []
      }))

      setUsers(result || [])
      setAvailableFeatures(features || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      toast({
        title: "Error",
        description: `No se pudieron cargar los datos: ${errorMessage}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleBetaTester = async (userId: string, isBetaTester: boolean) => {
    try {
      // Actualizar estado de beta tester
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_beta_tester: isBetaTester })
        .eq('id', userId)

      if (updateError) {
        throw new Error(`Error al actualizar beta tester: ${updateError.message}`)
      }

      // Si se está desactivando como beta tester, eliminar todas las asignaciones
      if (!isBetaTester) {
        const { error: deleteError } = await supabase
          .from('user_beta_features')
          .delete()
          .eq('user_id', userId)

        if (deleteError) {
          console.warn('Error al eliminar asignaciones:', deleteError.message)
        }
      }

      // Actualizar estado local
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, is_beta_tester: isBetaTester, beta_features: [] }
          : user
      ))

      toast({
        title: "Éxito",
        description: isBetaTester 
          ? "Usuario agregado como beta tester" 
          : "Usuario removido como beta tester"
      })
    } catch (error) {
      console.error('Error updating beta tester:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del beta tester",
        variant: "destructive"
      })
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setSelectedFeatures(user.beta_features.map(f => f.feature_key))
    setExpirationDate('')
    setIsDialogOpen(true)
  }

  const handleSaveUserFeatures = async () => {
    if (!selectedUser) return

    try {
      // Primero eliminar asignaciones existentes
      const { error: deleteError } = await supabase
        .from('user_beta_features')
        .delete()
        .eq('user_id', selectedUser.id)

      if (deleteError) {
        console.warn('Error al eliminar asignaciones existentes:', deleteError.message)
      }

      // Agregar nuevas asignaciones
      if (selectedFeatures.length > 0) {
        const assignments = selectedFeatures.map((featureKey) => {
          const feature = availableFeatures.find(f => f.feature_key === featureKey)
          return {
            user_id: selectedUser.id,
            feature_id: feature?.id,
            is_enabled: true,
            expires_at: expirationDate || null
          }
        }).filter(f => f.feature_id)

        const { error: insertError } = await supabase
          .from('user_beta_features')
          .insert(assignments)

        if (insertError) {
          throw new Error(`Error al asignar features: ${insertError.message}`)
        }
      }

      // Actualizar estado local
      const updatedFeatures = selectedFeatures.map(featureKey => {
        const feature = availableFeatures.find(f => f.feature_key === featureKey)
        return {
          feature_key: feature?.feature_key || '',
          feature_name: feature?.feature_name || '',
          is_enabled: true,
          expires_at: expirationDate || null
        }
      })

      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { ...user, beta_features: updatedFeatures }
          : user
      ))

      setIsDialogOpen(false)
      toast({
        title: "Éxito",
        description: "Features beta actualizadas correctamente"
      })
    } catch (error) {
      console.error('Error updating features:', error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar las features",
        variant: "destructive"
      })
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.plantel?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const betaTesterCount = users.filter(u => u.is_beta_tester).length
  const totalUsers = users.length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Beta Testers</h2>
            <p className="text-muted-foreground">
              Gestiona usuarios con acceso a funcionalidades beta
            </p>
          </div>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Beta Testers</h2>
          <p className="text-muted-foreground">
            Gestiona usuarios con acceso a funcionalidades beta
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            {betaTesterCount} / {totalUsers} usuarios
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beta Testers</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{betaTesterCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Features Disponibles</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableFeatures.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar usuarios por nombre, email o plantel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{user.full_name || 'Sin nombre'}</h3>
                    <Badge variant={user.is_beta_tester ? "default" : "secondary"}>
                      {user.is_beta_tester ? "Beta Tester" : "Usuario Regular"}
                    </Badge>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.plantel && (
                    <p className="text-sm text-muted-foreground">{user.plantel.nombre}</p>
                  )}
                  {user.is_beta_tester && user.beta_features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {user.beta_features.map((feature) => (
                        <Badge key={feature.feature_key} variant="outline" className="text-xs">
                          {feature.feature_name}
                          {feature.expires_at && (
                            <Clock className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={user.is_beta_tester}
                    onCheckedChange={(checked) => handleToggleBetaTester(user.id, checked)}
                  />
                  {user.is_beta_tester && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar Features Beta</DialogTitle>
            <DialogDescription>
              Selecciona las funcionalidades beta para {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Features Disponibles</Label>
              <div className="space-y-2 mt-2">
                {availableFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature.feature_key}
                      checked={selectedFeatures.includes(feature.feature_key)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFeatures(prev => [...prev, feature.feature_key])
                        } else {
                          setSelectedFeatures(prev => prev.filter(f => f !== feature.feature_key))
                        }
                      }}
                    />
                    <Label htmlFor={feature.feature_key} className="flex-1">
                      <div className="font-medium">{feature.feature_name}</div>
                      <div className="text-sm text-muted-foreground">{feature.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="expiration">Fecha de Expiración (Opcional)</Label>
              <Input
                id="expiration"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Deja vacío para acceso permanente
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUserFeatures}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
