'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, Users, BookOpen, TrendingUp, FileText, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getAlumnosByGrupo, createAlumno, updateAlumno, deleteAlumno, type Alumno, type CreateAlumnoData, type UpdateAlumnoData } from '@/lib/alumnos';
import { getGrupoById, type Grupo } from '@/lib/grupos';
import { ExpedienteAlumno } from './expediente-alumno';

interface GestionarAlumnosProps {
  grupoId: string;
  onBack: () => void;
  onNavigateToMensajesPadres?: (studentData: any) => void;
  onNavigateToMensajesPadresAlumno?: (studentData: any) => void;
}

type ViewMode = 'list' | 'expediente';

interface ViewState {
  mode: ViewMode;
  selectedAlumnoId?: string;
}

export default function GestionarAlumnos({ grupoId, onBack, onNavigateToMensajesPadres, onNavigateToMensajesPadresAlumno }: GestionarAlumnosProps) {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAlumno, setEditingAlumno] = useState<Alumno | null>(null);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    numero_lista: '',
    notas_generales: '',
    // Información de los padres
    nombre_padre: '',
    correo_padre: '',
    telefono_padre: '',
    nombre_madre: '',
    correo_madre: '',
    telefono_madre: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [viewState, setViewState] = useState<ViewState>({ mode: 'list' });

  useEffect(() => {
    fetchData();
  }, [grupoId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [grupoData, alumnosData] = await Promise.all([
        getGrupoById(grupoId),
        getAlumnosByGrupo(grupoId)
      ]);
      
      setGrupo(grupoData);
      setAlumnos(alumnosData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del grupo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      nombre_completo: '',
      numero_lista: '',
      notas_generales: '',
      // Información de los padres
      nombre_padre: '',
      correo_padre: '',
      telefono_padre: '',
      nombre_madre: '',
      correo_madre: '',
      telefono_madre: ''
    });
  };

  const handleViewExpediente = (alumnoId: string) => {
    setViewState({ mode: 'expediente', selectedAlumnoId: alumnoId });
  };

  const handleBackToList = () => {
    setViewState({ mode: 'list' });
  };

  const handleAddAlumno = async () => {
    if (!formData.nombre_completo.trim()) {
      toast({
        title: "Error",
        description: "El nombre del alumno es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const alumnoData: CreateAlumnoData = {
        grupo_id: grupoId,
        nombre_completo: formData.nombre_completo.trim(),
        notas_generales: formData.notas_generales.trim() || undefined,
        // Información de los padres
        nombre_padre: formData.nombre_padre.trim() || undefined,
        correo_padre: formData.correo_padre.trim() || undefined,
        telefono_padre: formData.telefono_padre.trim() || undefined,
        nombre_madre: formData.nombre_madre.trim() || undefined,
        correo_madre: formData.correo_madre.trim() || undefined,
        telefono_madre: formData.telefono_madre.trim() || undefined
      };

      if (formData.numero_lista && !isNaN(parseInt(formData.numero_lista))) {
        alumnoData.numero_lista = parseInt(formData.numero_lista);
      }

      const newAlumno = await createAlumno(alumnoData);
      setAlumnos(prev => [...prev, newAlumno].sort((a, b) => {
        if (a.numero_lista && b.numero_lista) {
          return a.numero_lista - b.numero_lista;
        }
        return a.nombre_completo.localeCompare(b.nombre_completo);
      }));
      
      setIsAddDialogOpen(false);
      resetForm();
      
      toast({
        title: "Éxito",
        description: "Alumno agregado correctamente",
      });
    } catch (err) {
      console.error('Error adding alumno:', err);
      toast({
        title: "Error",
        description: "No se pudo agregar el alumno",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAlumno = async () => {
    if (!editingAlumno || !formData.nombre_completo.trim()) {
      toast({
        title: "Error",
        description: "El nombre del alumno es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const updateData: UpdateAlumnoData = {
        nombre_completo: formData.nombre_completo.trim(),
        notas_generales: formData.notas_generales.trim() || undefined,
        // Información de los padres
        nombre_padre: formData.nombre_padre.trim() || undefined,
        correo_padre: formData.correo_padre.trim() || undefined,
        telefono_padre: formData.telefono_padre.trim() || undefined,
        nombre_madre: formData.nombre_madre.trim() || undefined,
        correo_madre: formData.correo_madre.trim() || undefined,
        telefono_madre: formData.telefono_madre.trim() || undefined
      };

      if (formData.numero_lista && !isNaN(parseInt(formData.numero_lista))) {
        updateData.numero_lista = parseInt(formData.numero_lista);
      }

      const updatedAlumno = await updateAlumno(editingAlumno.id, updateData);
      setAlumnos(prev => prev.map(alumno => 
        alumno.id === editingAlumno.id ? updatedAlumno : alumno
      ).sort((a, b) => {
        if (a.numero_lista && b.numero_lista) {
          return a.numero_lista - b.numero_lista;
        }
        return a.nombre_completo.localeCompare(b.nombre_completo);
      }));
      
      setIsEditDialogOpen(false);
      setEditingAlumno(null);
      resetForm();
      
      toast({
        title: "Éxito",
        description: "Alumno actualizado correctamente",
      });
    } catch (err) {
      console.error('Error updating alumno:', err);
      toast({
        title: "Error",
        description: "No se pudo actualizar el alumno",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAlumno = async (alumno: Alumno) => {
    try {
      await deleteAlumno(alumno.id);
      setAlumnos(prev => prev.filter(a => a.id !== alumno.id));
      
      toast({
        title: "Éxito",
        description: "Alumno eliminado correctamente",
      });
    } catch (err) {
      console.error('Error deleting alumno:', err);
      toast({
        title: "Error",
        description: "No se pudo eliminar el alumno",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (alumno: Alumno) => {
    setEditingAlumno(alumno);
    setFormData({
      nombre_completo: alumno.nombre_completo,
      numero_lista: alumno.numero_lista?.toString() || '',
      notas_generales: alumno.notas_generales || '',
      // Información de los padres
      nombre_padre: alumno.nombre_padre || '',
      correo_padre: alumno.correo_padre || '',
      telefono_padre: alumno.telefono_padre || '',
      nombre_madre: alumno.nombre_madre || '',
      correo_madre: alumno.correo_madre || '',
      telefono_madre: alumno.telefono_madre || ''
    });
    setIsEditDialogOpen(true);
  };

  // Mostrar expediente individual si está seleccionado
  if (viewState.mode === 'expediente' && viewState.selectedAlumnoId) {
    return (
      <ExpedienteAlumno
        alumnoId={viewState.selectedAlumnoId}
        onBack={handleBackToList}
        onNavigateToMensajesPadres={onNavigateToMensajesPadres}
        onNavigateToMensajesPadresAlumno={onNavigateToMensajesPadresAlumno}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando alumnos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchData} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Alumnos de: {grupo?.nombre || 'Cargando...'}
            </h1>
            {grupo && (
              <p className="text-gray-600">
                {grupo.grado} • {grupo.nivel} • {grupo.ciclo_escolar}
              </p>
            )}
          </div>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Añadir Alumno</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Alumno</DialogTitle>
              <DialogDescription>
                Agrega un nuevo alumno al grupo {grupo?.nombre}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
              {/* Información Básica */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                    <Input
                      id="nombre_completo"
                      name="nombre_completo"
                      value={formData.nombre_completo}
                      onChange={handleInputChange}
                      placeholder="Ej: Ana Sofía Rojas"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="numero_lista">Número de Lista</Label>
                    <Input
                      id="numero_lista"
                      name="numero_lista"
                      type="number"
                      value={formData.numero_lista}
                      onChange={handleInputChange}
                      placeholder="Ej: 15"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              {/* Información de Contacto de Padres */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Información de Contacto
                </h4>
                
                {/* Padre */}
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Padre</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="nombre_padre" className="text-sm">Nombre Completo</Label>
                      <Input
                        id="nombre_padre"
                        name="nombre_padre"
                        value={formData.nombre_padre}
                        onChange={handleInputChange}
                        placeholder="Juan Carlos Rojas"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="correo_padre" className="text-sm">Correo Electrónico</Label>
                      <Input
                        id="correo_padre"
                        name="correo_padre"
                        type="email"
                        value={formData.correo_padre}
                        onChange={handleInputChange}
                        placeholder="juan.rojas@email.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefono_padre" className="text-sm">Teléfono</Label>
                      <Input
                        id="telefono_padre"
                        name="telefono_padre"
                        type="tel"
                        value={formData.telefono_padre}
                        onChange={handleInputChange}
                        placeholder="+52 55 1234 5678"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Madre */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Madre</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="nombre_madre" className="text-sm">Nombre Completo</Label>
                      <Input
                        id="nombre_madre"
                        name="nombre_madre"
                        value={formData.nombre_madre}
                        onChange={handleInputChange}
                        placeholder="María Elena García"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="correo_madre" className="text-sm">Correo Electrónico</Label>
                      <Input
                        id="correo_madre"
                        name="correo_madre"
                        type="email"
                        value={formData.correo_madre}
                        onChange={handleInputChange}
                        placeholder="maria.garcia@email.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefono_madre" className="text-sm">Teléfono</Label>
                      <Input
                        id="telefono_madre"
                        name="telefono_madre"
                        type="tel"
                        value={formData.telefono_madre}
                        onChange={handleInputChange}
                        placeholder="+52 55 8765 4321"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Notas Generales */}
              <div className="border-t border-gray-200 pt-6">
                <div>
                  <Label htmlFor="notas_generales" className="text-sm font-medium">Notas Generales</Label>
                  <Textarea
                    id="notas_generales"
                    name="notas_generales"
                    value={formData.notas_generales}
                    onChange={handleInputChange}
                    placeholder="Información adicional sobre el alumno..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddAlumno} disabled={submitting}>
                {submitting ? 'Guardando...' : 'Guardar Alumno'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total de Alumnos</p>
                <p className="text-2xl font-bold text-gray-900">{alumnos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Con Número de Lista</p>
                <p className="text-2xl font-bold text-gray-900">
                  {alumnos.filter(a => a.numero_lista).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Edit className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Con Notas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {alumnos.filter(a => a.notas_generales).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Alumnos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Alumnos</CardTitle>
          <CardDescription>
            Gestiona los alumnos de este grupo. Haz clic en un nombre para ver su expediente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alumnos.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay alumnos registrados
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza agregando el primer alumno a este grupo.
              </p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Añadir Primer Alumno</span>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Nº</TableHead>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alumnos.map((alumno) => (
                  <TableRow key={alumno.id}>
                    <TableCell className="font-medium">
                      {alumno.numero_lista ? (
                        <Badge variant="outline">{alumno.numero_lista}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleViewExpediente(alumno.id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left"
                      >
                        {alumno.nombre_completo}
                      </button>
                    </TableCell>
                    <TableCell>
                      {alumno.notas_generales ? (
                        <span className="text-sm text-gray-600">
                          {alumno.notas_generales.length > 50
                            ? `${alumno.notas_generales.substring(0, 50)}...`
                            : alumno.notas_generales}
                        </span>
                      ) : (
                        <span className="text-gray-400">Sin notas</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewExpediente(alumno.id)}
                          title="Ver expediente"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(alumno)}
                          title="Editar alumno"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" title="Eliminar alumno">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar alumno?</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que quieres eliminar a {alumno.nombre_completo}? 
                                Esta acción no se puede deshacer y se perderán todos los datos asociados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAlumno(alumno)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Alumno</DialogTitle>
            <DialogDescription>
              Modifica la información del alumno
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
            {/* Información Básica */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_nombre_completo">Nombre Completo *</Label>
                  <Input
                    id="edit_nombre_completo"
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleInputChange}
                    placeholder="Ej: Ana Sofía Rojas"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_numero_lista">Número de Lista</Label>
                  <Input
                    id="edit_numero_lista"
                    name="numero_lista"
                    type="number"
                    value={formData.numero_lista}
                    onChange={handleInputChange}
                    placeholder="Ej: 15"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            
            {/* Información de Contacto de Padres */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Información de Contacto
              </h4>
              
              {/* Padre */}
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Padre</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit_nombre_padre" className="text-sm">Nombre Completo</Label>
                    <Input
                      id="edit_nombre_padre"
                      name="nombre_padre"
                      value={formData.nombre_padre}
                      onChange={handleInputChange}
                      placeholder="Juan Carlos Rojas"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_correo_padre" className="text-sm">Correo Electrónico</Label>
                    <Input
                      id="edit_correo_padre"
                      name="correo_padre"
                      type="email"
                      value={formData.correo_padre}
                      onChange={handleInputChange}
                      placeholder="juan.rojas@email.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_telefono_padre" className="text-sm">Teléfono</Label>
                    <Input
                      id="edit_telefono_padre"
                      name="telefono_padre"
                      type="tel"
                      value={formData.telefono_padre}
                      onChange={handleInputChange}
                      placeholder="+52 55 1234 5678"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              {/* Madre */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Madre</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit_nombre_madre" className="text-sm">Nombre Completo</Label>
                    <Input
                      id="edit_nombre_madre"
                      name="nombre_madre"
                      value={formData.nombre_madre}
                      onChange={handleInputChange}
                      placeholder="María Elena García"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_correo_madre" className="text-sm">Correo Electrónico</Label>
                    <Input
                      id="edit_correo_madre"
                      name="correo_madre"
                      type="email"
                      value={formData.correo_madre}
                      onChange={handleInputChange}
                      placeholder="maria.garcia@email.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_telefono_madre" className="text-sm">Teléfono</Label>
                    <Input
                      id="edit_telefono_madre"
                      name="telefono_madre"
                      type="tel"
                      value={formData.telefono_madre}
                      onChange={handleInputChange}
                      placeholder="+52 55 8765 4321"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_notas_generales">Notas Generales (opcional)</Label>
              <Textarea
                id="edit_notas_generales"
                name="notas_generales"
                value={formData.notas_generales}
                onChange={handleInputChange}
                placeholder="Información adicional sobre el alumno..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingAlumno(null);
                resetForm();
              }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditAlumno} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}