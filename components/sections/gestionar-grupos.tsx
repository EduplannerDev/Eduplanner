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
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Grupo, CreateGrupoData, UpdateGrupoData, createGrupo, getGruposByUserAndPlantel, getGruposByPlantel, updateGrupo, deactivateGrupo, getGruposStatsByPlantel } from '@/lib/grupos'
import { getAllPlanteles, Plantel } from '@/lib/planteles'
import { useRoles } from '@/hooks/use-roles'
import { useAuth } from '@/hooks/use-auth'
import { Users, Plus, Edit, Trash2, BookOpen, BarChart3 } from 'lucide-react'

interface GrupoWithProfesor extends Grupo {
  profiles?: {
    full_name: string
    email: string
  }
}

const nivelesEducativos = [
  'Preescolar',
  'Primaria',
  'Secundaria',
  'Preparatoria',
  'Universidad'
]

const grados = {
  'Preescolar': ['1°', '2°', '3°'],
  'Primaria': ['1°', '2°', '3°', '4°', '5°', '6°'],
  'Secundaria': ['1°', '2°', '3°'],
  'Preparatoria': ['1°', '2°', '3°'],
  'Universidad': ['1°', '2°', '3°', '4°', '5°']
}

export function GestionarGrupos() {
  const { user } = useAuth()
  const { isAdmin, isDirector, isProfesor, plantel: userPlantel, loading: roleLoading } = useRoles()
  const [grupos, setGrupos] = useState<GrupoWithProfesor[]>([])
  const [planteles, setPlanteles] = useState<Plantel[]>([])
  const [selectedPlantel, setSelectedPlantel] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<any>(null)

  // Formulario para crear/editar grupo
  const [formData, setFormData] = useState<CreateGrupoData>({
    nombre: '',
    grado: '',
    nivel: '',
    ciclo_escolar: '',
    descripcion: '',
    numero_alumnos: 0
  })

  const canManageGroups = isAdmin || isDirector || isProfesor
  const canViewAllGroups = isAdmin || isDirector

  // Cargar planteles disponibles
  const loadPlanteles = async () => {
    try {
      if (isAdmin) {
        const data = await getAllPlanteles()
        setPlanteles(data)
        if (data.length > 0 && !selectedPlantel) {
          setSelectedPlantel(data[0].id)
        }
      } else if ((isDirector || isProfesor) && userPlantel) {
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

  // Cargar grupos
  const loadGrupos = async () => {
    if (!selectedPlantel || !user) return
    
    setLoading(true)
    try {
      let data: GrupoWithProfesor[] = []
      
      if (canViewAllGroups) {
        // Directores y administradores ven todos los grupos del plantel
        data = await getGruposByPlantel(selectedPlantel) as GrupoWithProfesor[]
      } else {
        // Profesores solo ven sus grupos
        data = await getGruposByUserAndPlantel(user.id, selectedPlantel) as GrupoWithProfesor[]
      }
      
      setGrupos(data)
      
      // Cargar estadísticas si es director o admin
      if (canViewAllGroups) {
        const statsData = await getGruposStatsByPlantel(selectedPlantel)
        setStats(statsData)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los grupos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canManageGroups) {
      loadPlanteles()
    }
  }, [isAdmin, isDirector, isProfesor, userPlantel])

  useEffect(() => {
    if (selectedPlantel) {
      loadGrupos()
    }
  }, [selectedPlantel, user])

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedPlantel) return

    try {
      if (editingGrupo) {
        await updateGrupo(editingGrupo.id, formData)
        toast({
          title: "Éxito",
          description: "Grupo actualizado correctamente"
        })
      } else {
        await createGrupo(user.id, selectedPlantel, formData)
        toast({
          title: "Éxito",
          description: "Grupo creado correctamente"
        })
      }
      
      setIsDialogOpen(false)
      setEditingGrupo(null)
      resetForm()
      loadGrupos()
    } catch (error) {
      toast({
        title: "Error",
        description: editingGrupo ? "Error al actualizar el grupo" : "Error al crear el grupo",
        variant: "destructive"
      })
    }
  }

  // Desactivar grupo
  const handleDeactivate = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres desactivar este grupo?')) {
      return
    }

    try {
      await deactivateGrupo(id)
      toast({
        title: "Éxito",
        description: "Grupo desactivado correctamente"
      })
      loadGrupos()
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al desactivar el grupo",
        variant: "destructive"
      })
    }
  }

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      grado: '',
      nivel: '',
      ciclo_escolar: '',
      descripcion: '',
      numero_alumnos: 0
    })
  }

  // Abrir diálogo para editar
  const openEditDialog = (grupo: Grupo) => {
    setEditingGrupo(grupo)
    setFormData({
      nombre: grupo.nombre,
      grado: grupo.grado,
      nivel: grupo.nivel,
      ciclo_escolar: grupo.ciclo_escolar,
      descripcion: grupo.descripcion || '',
      numero_alumnos: grupo.numero_alumnos
    })
    setIsDialogOpen(true)
  }

  // Abrir diálogo para crear
  const openCreateDialog = () => {
    setEditingGrupo(null)
    resetForm()
    setIsDialogOpen(true)
  }

  // Filtrar grupos
  const filteredGrupos = grupos.filter(grupo => 
    grupo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grupo.nivel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grupo.grado.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (roleLoading) {
    return <div className="flex justify-center p-8">Cargando...</div>
  }

  if (!canManageGroups) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-muted-foreground">
            No tienes permisos para gestionar grupos.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestionar Grupos</h2>
          <p className="text-muted-foreground">
            {canViewAllGroups ? 'Administra todos los grupos del plantel' : 'Administra tus grupos'}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} disabled={!selectedPlantel}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGrupo ? 'Editar Grupo' : 'Crear Nuevo Grupo'}
              </DialogTitle>
              <DialogDescription>
                {editingGrupo ? 'Modifica los datos del grupo' : 'Completa la información del nuevo grupo'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Grupo</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="ej. Grupo A, Matemáticas Avanzadas"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nivel">Nivel Educativo</Label>
                  <Select
                    value={formData.nivel}
                    onValueChange={(value) => setFormData({ ...formData, nivel: value, grado: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
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
                  <Label htmlFor="grado">Grado</Label>
                  <Select
                    value={formData.grado}
                    onValueChange={(value) => setFormData({ ...formData, grado: value })}
                    disabled={!formData.nivel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.nivel && grados[formData.nivel as keyof typeof grados]?.map((grado) => (
                        <SelectItem key={grado} value={grado}>
                          {grado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ciclo">Ciclo Escolar</Label>
                <Input
                  id="ciclo"
                  value={formData.ciclo_escolar}
                  onChange={(e) => setFormData({ ...formData, ciclo_escolar: e.target.value })}
                  placeholder="ej. 2024-2025"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alumnos">Número de Alumnos</Label>
                <Input
                  id="alumnos"
                  type="number"
                  min="0"
                  value={formData.numero_alumnos}
                  onChange={(e) => setFormData({ ...formData, numero_alumnos: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción adicional del grupo"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingGrupo ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
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

      {/* Estadísticas */}
      {canViewAllGroups && stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Grupos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alumnos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAlumnos}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Grupo</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total > 0 ? Math.round(stats.totalAlumnos / stats.total) : 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtro de búsqueda */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Buscar grupos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      {/* Lista de grupos */}
      <Card>
        <CardHeader>
          <CardTitle>Grupos</CardTitle>
          <CardDescription>
            {selectedPlantel ? 
              `Grupos de ${planteles.find(p => p.id === selectedPlantel)?.nombre}` :
              'Selecciona un plantel para ver sus grupos'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando grupos...</div>
          ) : filteredGrupos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No se encontraron grupos que coincidan con la búsqueda' : 'No hay grupos creados'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Grado</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Alumnos</TableHead>
                  {canViewAllGroups && <TableHead>Profesor</TableHead>}
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrupos.map((grupo) => (
                  <TableRow key={grupo.id}>
                    <TableCell className="font-medium">{grupo.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{grupo.nivel}</Badge>
                    </TableCell>
                    <TableCell>{grupo.grado}</TableCell>
                    <TableCell>{grupo.ciclo_escolar}</TableCell>
                    <TableCell>{grupo.numero_alumnos}</TableCell>
                    {canViewAllGroups && (
                      <TableCell>
                        {grupo.profiles?.full_name || 'Sin asignar'}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(grupo)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeactivate(grupo.id)}
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