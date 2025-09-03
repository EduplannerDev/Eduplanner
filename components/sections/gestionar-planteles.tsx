"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Plantel } from '@/lib/profile'
import { getAllPlanteles, createPlantel, updatePlantel, deactivatePlantel, getPlantelWithLimits, PlantelWithLimits } from '@/lib/planteles'
import { useAdminCheck } from '@/hooks/use-roles'
import { Plus, Trash2, Building2, Users, Shield, Eye } from 'lucide-react'

interface PlantelFormData {
  nombre: string
  direccion: string
  telefono: string
  email: string
  codigo_plantel: string
  nivel_educativo: string
  ciudad: string
  estado: string
  codigo_postal: string
  max_usuarios: number
  max_profesores: number
  max_directores: number
}

const nivelesEducativos = [
  'Preescolar',
  'Primaria',
  'Secundaria',
  'Preparatoria'
]

interface GestionarPlantelesProps {
  onViewPlantel?: (plantelId: string) => void
}

export function GestionarPlanteles({ onViewPlantel }: GestionarPlantelesProps) {
  const { isAdmin, loading: roleLoading } = useAdminCheck()
  const [planteles, setPlanteles] = useState<Plantel[]>([])  
  const [plantelesWithLimits, setPlantelesWithLimits] = useState<PlantelWithLimits[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<PlantelFormData>({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    codigo_plantel: '',
    nivel_educativo: '',
    ciudad: '',
    estado: '',
    codigo_postal: '',
    max_usuarios: 50,
    max_profesores: 10,
    max_directores: 3
  })

  // Cargar planteles
  const loadPlanteles = async () => {
    setLoading(true)
    try {
      const data = await getAllPlanteles()
      setPlanteles(data)
      
      // Cargar información de límites para cada plantel
      const plantelesWithLimitsData = await Promise.all(
        data.map(async (plantel) => {
          try {
            return await getPlantelWithLimits(plantel.id)
          } catch (error) {
            console.error(`Error loading limits for plantel ${plantel.id}:`, error)
            return {
              ...plantel,
              usuarios_actuales: 0,
              max_usuarios: 0,
              usuarios_disponibles: 0,
              profesores_actuales: 0,
              max_profesores: 0,
              profesores_disponibles: 0,
              directores_actuales: 0,
              max_directores: 0,
              directores_disponibles: 0,
              plan_suscripcion: null,
              estado_suscripcion: null,
              fecha_vencimiento: null
            }
          }
        })
      )
      setPlantelesWithLimits(plantelesWithLimitsData.filter((plantel): plantel is PlantelWithLimits => plantel !== null))
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los planteles",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Optimizado: solo cargar planteles una vez cuando el usuario es admin
  useEffect(() => {
    if (isAdmin && !loading) {
      loadPlanteles()
    }
  }, [isAdmin, loading])

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre || !formData.nivel_educativo) {
      toast({
        title: "Error",
        description: "El nombre y nivel educativo son obligatorios",
        variant: "destructive"
      })
      return
    }

    try {
      // Crear nuevo plantel
      const newPlantel = await createPlantel({
        ...formData,
        activo: true
      })
      if (newPlantel) {
        toast({
          title: "Éxito",
          description: "Plantel creado correctamente"
        })
        loadPlanteles()
        resetForm()
      } else {
        throw new Error('Error al crear')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear el plantel",
        variant: "destructive"
      })
    }
  }

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
      codigo_plantel: '',
      nivel_educativo: '',
      ciudad: '',
      estado: '',
      codigo_postal: '',
      max_usuarios: 50,
      max_profesores: 10,
      max_directores: 3
    })
    setIsDialogOpen(false)
  }



  // Desactivar plantel
  const handleDeactivate = async (plantelId: string) => {
    if (!confirm('¿Estás seguro de que quieres desactivar este plantel?')) {
      return
    }

    try {
      const success = await deactivatePlantel(plantelId)
      if (success) {
        toast({
          title: "Éxito",
          description: "Plantel desactivado correctamente"
        })
        loadPlanteles()
      } else {
        throw new Error('Error al desactivar')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al desactivar el plantel",
        variant: "destructive"
      })
    }
  }

  if (roleLoading) {
    return <div className="flex justify-center p-8">Cargando...</div>
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-muted-foreground">
            Solo los administradores pueden gestionar planteles.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestionar Planteles</h2>
          <p className="text-muted-foreground">
            Administra los planteles educativos del sistema
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Plantel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Crear Nuevo Plantel
              </DialogTitle>
              <DialogDescription>
                Completa la información para crear un nuevo plantel
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre del plantel"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo_plantel">Código del Plantel</Label>
                  <Input
                    id="codigo_plantel"
                    value={formData.codigo_plantel}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigo_plantel: e.target.value }))}
                    placeholder="Código único"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nivel_educativo">Nivel Educativo *</Label>
                <Select 
                  value={formData.nivel_educativo} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, nivel_educativo: value }))}
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
                <Label htmlFor="direccion">Dirección</Label>
                <Textarea
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Dirección completa del plantel"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                    placeholder="Ciudad"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                    placeholder="Estado"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo_postal">Código Postal</Label>
                  <Input
                    id="codigo_postal"
                    value={formData.codigo_postal}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigo_postal: e.target.value }))}
                    placeholder="CP"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="Teléfono de contacto"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email de contacto"
                  />
                </div>
              </div>

              {/* Sección de Límites de Usuarios */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-base font-medium">Límites de Usuarios</Label>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_usuarios">Máximo Usuarios</Label>
                    <Input
                      id="max_usuarios"
                      type="number"
                      min="1"
                      value={formData.max_usuarios}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_usuarios: parseInt(e.target.value) || 0 }))}
                      placeholder="50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_profesores">Máximo Profesores</Label>
                    <Input
                      id="max_profesores"
                      type="number"
                      min="1"
                      value={formData.max_profesores}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_profesores: parseInt(e.target.value) || 0 }))}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_directores">Máximo Directores</Label>
                    <Input
                      id="max_directores"
                      type="number"
                      min="1"
                      value={formData.max_directores}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_directores: parseInt(e.target.value) || 0 }))}
                      placeholder="3"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Establece los límites máximos de usuarios que pueden ser asignados a este plantel.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Crear Plantel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumen general de límites */}
      {plantelesWithLimits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Resumen General del Sistema</span>
            </CardTitle>
            <CardDescription>
              Vista general de usuarios y límites en todos los planteles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{plantelesWithLimits.length}</div>
                <div className="text-sm text-muted-foreground">Planteles Activos</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {plantelesWithLimits.reduce((sum, p) => sum + (p.usuarios_actuales || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Usuarios</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {plantelesWithLimits.reduce((sum, p) => sum + (p.profesores_actuales || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Profesores</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {plantelesWithLimits.reduce((sum, p) => sum + (p.directores_actuales || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Directores</div>
              </div>
            </div>
            
            {/* Planteles con límites alcanzados */}
            {plantelesWithLimits.some(p => (p.usuarios_disponibles || 0) <= 0) && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">⚠️ Planteles con límites alcanzados:</h4>
                <div className="space-y-1">
                  {plantelesWithLimits
                    .filter(p => (p.usuarios_disponibles || 0) <= 0)
                    .map(p => (
                      <div key={p.id} className="text-sm text-red-700 dark:text-red-300">
                        • {p.nombre} - {p.usuarios_actuales}/{p.max_usuarios} usuarios
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Planteles Registrados</CardTitle>
          <CardDescription>
            Lista de todos los planteles en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando planteles...</div>
          ) : planteles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay planteles registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plantel</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Profesores</TableHead>
                  <TableHead>Directores</TableHead>
                  <TableHead>Suscripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plantelesWithLimits.map((plantel) => (
                  <TableRow key={plantel.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{plantel.nombre}</div>
                        <div className="text-sm text-muted-foreground">
                          {plantel.nivel_educativo} • {plantel.ciudad || 'Sin ciudad'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">
                            {plantel.usuarios_actuales || 0} / {plantel.max_usuarios || 0}
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                (plantel.usuarios_disponibles || 0) > 0 ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ 
                                width: `${Math.min(100, ((plantel.usuarios_actuales || 0) / (plantel.max_usuarios || 1)) * 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {plantel.profesores_actuales || 0} / {plantel.max_profesores || 0}
                        </div>
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              (plantel.profesores_disponibles || 0) > 0 ? 'bg-blue-500' : 'bg-red-500'
                            }`}
                            style={{ 
                              width: `${Math.min(100, ((plantel.profesores_actuales || 0) / (plantel.max_profesores || 1)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {plantel.directores_actuales || 0} / {plantel.max_directores || 0}
                        </div>
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              (plantel.directores_disponibles || 0) > 0 ? 'bg-purple-500' : 'bg-red-500'
                            }`}
                            style={{ 
                              width: `${Math.min(100, ((plantel.directores_actuales || 0) / (plantel.max_directores || 1)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <Badge variant={
                          plantel.estado_suscripcion === 'activa' ? 'default' :
                          plantel.estado_suscripcion === 'suspendida' ? 'destructive' : 'secondary'
                        }>
{plantel.plan_suscripcion ? plantel.plan_suscripcion.charAt(0).toUpperCase() + plantel.plan_suscripcion.slice(1) : 'No definido'}
                        </Badge>
                        {plantel.fecha_vencimiento && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Vence: {new Date(plantel.fecha_vencimiento).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plantel.activo ? 'default' : 'secondary'}>
                        {plantel.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {onViewPlantel && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => onViewPlantel(plantel.id)}
                            title="Ver detalles del plantel"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}

                        {plantel.activo && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeactivate(plantel.id)}
                            title="Desactivar plantel"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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