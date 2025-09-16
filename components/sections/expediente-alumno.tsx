'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, BookOpen, MessageSquare, User, FileText, Award, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getAlumnoById, getSeguimientoByAlumno, createSeguimiento, updateSeguimiento, deleteSeguimiento, type Alumno, type SeguimientoDiario, type CreateSeguimientoData } from '@/lib/alumnos';
import { getGrupoById, type Grupo } from '@/lib/grupos';


interface ExpedienteAlumnoProps {
  alumnoId: string;
  onBack: () => void;
  onNavigateToMensajesPadres?: (studentData: any) => void;
  onNavigateToMensajesPadresAlumno?: (studentData: any) => void;
}

export function ExpedienteAlumno({ alumnoId, onBack, onNavigateToMensajesPadres, onNavigateToMensajesPadresAlumno }: ExpedienteAlumnoProps) {
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [seguimientos, setSeguimientos] = useState<SeguimientoDiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('seguimiento');
  const [isAddSeguimientoOpen, setIsAddSeguimientoOpen] = useState(false);
  const [isEditSeguimientoOpen, setIsEditSeguimientoOpen] = useState(false);
  const [editingSeguimiento, setEditingSeguimiento] = useState<SeguimientoDiario | null>(null);
  const [seguimientoForm, setSeguimientoForm] = useState({
    nota: '',
    tipo: 'general' as 'general' | 'academico' | 'comportamiento' | 'logro',
    fecha: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    fetchData();
  }, [alumnoId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const alumnoData = await getAlumnoById(alumnoId);
      if (!alumnoData) {
        throw new Error('Alumno no encontrado');
      }
      
      const [grupoData, seguimientosData] = await Promise.all([
        getGrupoById(alumnoData.grupo_id),
        getSeguimientoByAlumno(alumnoId)
      ]);
      
      setAlumno(alumnoData);
      setGrupo(grupoData);
      setSeguimientos(seguimientosData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos del alumno');
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del alumno",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeguimientoInputChange = (field: string, value: string) => {
    setSeguimientoForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetSeguimientoForm = () => {
    setSeguimientoForm({
      nota: '',
      tipo: 'general',
      fecha: new Date().toISOString().split('T')[0]
    });
  };

  const handleAddSeguimiento = async () => {
    if (!seguimientoForm.nota.trim()) {
      toast({
        title: "Error",
        description: "La nota es requerida",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const seguimientoData: CreateSeguimientoData = {
        alumno_id: alumnoId,
        nota: seguimientoForm.nota.trim(),
        tipo: seguimientoForm.tipo,
        fecha: seguimientoForm.fecha
      };

      const newSeguimiento = await createSeguimiento(seguimientoData);
      setSeguimientos(prev => [newSeguimiento, ...prev]);
      
      setIsAddSeguimientoOpen(false);
      resetSeguimientoForm();
      
      toast({
        title: "Éxito",
        description: "Seguimiento agregado correctamente",
      });
    } catch (err) {
      console.error('Error adding seguimiento:', err);
      toast({
        title: "Error",
        description: "No se pudo agregar el seguimiento",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSeguimiento = async () => {
    if (!editingSeguimiento || !seguimientoForm.nota.trim()) {
      toast({
        title: "Error",
        description: "La nota es requerida",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const updatedSeguimiento = await updateSeguimiento(
        editingSeguimiento.id,
        seguimientoForm.nota.trim(),
        seguimientoForm.tipo
      );
      
      setSeguimientos(prev => prev.map(seg => 
        seg.id === editingSeguimiento.id ? updatedSeguimiento : seg
      ));
      
      setIsEditSeguimientoOpen(false);
      setEditingSeguimiento(null);
      resetSeguimientoForm();
      
      toast({
        title: "Éxito",
        description: "Seguimiento actualizado correctamente",
      });
    } catch (err) {
      console.error('Error updating seguimiento:', err);
      toast({
        title: "Error",
        description: "No se pudo actualizar el seguimiento",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSeguimiento = async (seguimiento: SeguimientoDiario) => {
    try {
      await deleteSeguimiento(seguimiento.id);
      setSeguimientos(prev => prev.filter(seg => seg.id !== seguimiento.id));
      
      toast({
        title: "Éxito",
        description: "Seguimiento eliminado correctamente",
      });
    } catch (err) {
      console.error('Error deleting seguimiento:', err);
      toast({
        title: "Error",
        description: "No se pudo eliminar el seguimiento",
        variant: "destructive",
      });
    }
  };

  const openEditSeguimiento = (seguimiento: SeguimientoDiario) => {
    setEditingSeguimiento(seguimiento);
    setSeguimientoForm({
      nota: seguimiento.nota,
      tipo: seguimiento.tipo as any,
      fecha: seguimiento.fecha
    });
    setIsEditSeguimientoOpen(true);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'academico': return <BookOpen className="h-4 w-4" />;
      case 'comportamiento': return <AlertCircle className="h-4 w-4" />;
      case 'logro': return <Award className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'academico': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'comportamiento': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'logro': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'academico': return 'Académico';
      case 'comportamiento': return 'Comportamiento';
      case 'logro': return 'Logro';
      default: return 'General';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando expediente...</p>
        </div>
      </div>
    );
  }

  if (error || !alumno) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Alumno no encontrado'}</p>
        <Button onClick={onBack} variant="outline">
          Volver
        </Button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

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
        </div>
      </div>

      {/* Perfil del Alumno */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={alumno.foto_url} alt={alumno.nombre_completo} />
              <AvatarFallback className="text-lg">
                {getInitials(alumno.nombre_completo)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {alumno.nombre_completo}
              </h1>
              <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-300 mb-4">
                <span className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>Grupo: {grupo?.nombre}</span>
                </span>
                {alumno.numero_lista && (
                  <Badge variant="outline">Nº {alumno.numero_lista}</Badge>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Grado</p>
                  <p className="font-medium dark:text-gray-200">{grupo?.grado}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Nivel</p>
                  <p className="font-medium dark:text-gray-200">{grupo?.nivel}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Ciclo Escolar</p>
                  <p className="font-medium dark:text-gray-200">{grupo?.ciclo_escolar}</p>
                </div>
              </div>
              
              {/* Información de Contacto de los Padres */}
              {(alumno.nombre_padre || alumno.nombre_madre || alumno.correo_padre || alumno.correo_madre || alumno.telefono_padre || alumno.telefono_madre) && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Información de Contacto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Información del Padre */}
                    {(alumno.nombre_padre || alumno.correo_padre || alumno.telefono_padre) && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-1">PADRE</h4>
                        {alumno.nombre_padre && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Nombre Completo</p>
                            <p className="font-medium dark:text-gray-200">{alumno.nombre_padre}</p>
                          </div>
                        )}
                        {alumno.correo_padre && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Correo Electrónico</p>
                            <p className="font-medium text-blue-600 dark:text-blue-400">{alumno.correo_padre}</p>
                          </div>
                        )}
                        {alumno.telefono_padre && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Teléfono</p>
                            <p className="font-medium dark:text-gray-200">{alumno.telefono_padre}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Información de la Madre */}
                    {(alumno.nombre_madre || alumno.correo_madre || alumno.telefono_madre) && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-1">MADRE</h4>
                        {alumno.nombre_madre && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Nombre Completo</p>
                            <p className="font-medium dark:text-gray-200">{alumno.nombre_madre}</p>
                          </div>
                        )}
                        {alumno.correo_madre && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Correo Electrónico</p>
                            <p className="font-medium text-blue-600 dark:text-blue-400">{alumno.correo_madre}</p>
                          </div>
                        )}
                        {alumno.telefono_madre && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Teléfono</p>
                            <p className="font-medium dark:text-gray-200">{alumno.telefono_madre}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {alumno.notas_generales && (
                <div className="mt-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Notas Generales</p>
                  <p className="text-gray-700 dark:text-gray-300">{alumno.notas_generales}</p>
                </div>
              )}
              
              {/* Comunicaciones */}
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Comunicaciones</h3>
                <div className="flex flex-wrap gap-3">
                  {onNavigateToMensajesPadres && (
                    <Button
                      onClick={() => onNavigateToMensajesPadres({
                        id: alumno.id,
                        nombre: alumno.nombre_completo,
                        grupo: grupo?.nombre,
                        grado: grupo?.grado,
                        nivel: grupo?.nivel
                      })}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Generar Mensaje para Padres</span>
                    </Button>
                  )}
                  {onNavigateToMensajesPadresAlumno && (
                    <Button
                      onClick={() => onNavigateToMensajesPadresAlumno({
                        id: alumno.id,
                        nombre: alumno.nombre_completo,
                        grupo: grupo?.nombre,
                        grado: grupo?.grado,
                        nivel: grupo?.nivel
                      })}
                      variant="default"
                      className="flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Ver Mensajes para Padres</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pestañas del Expediente */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="seguimiento" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Seguimiento Diario</span>
          </TabsTrigger>
          <TabsTrigger value="academico" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Académico</span>
          </TabsTrigger>
        </TabsList>

        {/* Pestaña de Seguimiento Diario */}
        <TabsContent value="seguimiento" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Anecdotario y Seguimiento</CardTitle>
                  <CardDescription>
                    Registro diario de observaciones, logros y comportamientos
                  </CardDescription>
                </div>
                <Dialog open={isAddSeguimientoOpen} onOpenChange={setIsAddSeguimientoOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Nueva Nota</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Agregar Seguimiento</DialogTitle>
                      <DialogDescription>
                        Registra una nueva observación sobre {alumno.nombre_completo}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="tipo">Tipo de Seguimiento</Label>
                          <Select
                            value={seguimientoForm.tipo}
                            onValueChange={(value) => handleSeguimientoInputChange('tipo', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="academico">Académico</SelectItem>
                              <SelectItem value="comportamiento">Comportamiento</SelectItem>
                              <SelectItem value="logro">Logro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="fecha">Fecha</Label>
                          <Input
                            id="fecha"
                            type="date"
                            value={seguimientoForm.fecha}
                            onChange={(e) => handleSeguimientoInputChange('fecha', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="nota">Observación *</Label>
                        <Textarea
                          id="nota"
                          value={seguimientoForm.nota}
                          onChange={(e) => handleSeguimientoInputChange('nota', e.target.value)}
                          placeholder="Describe la observación, logro o comportamiento..."
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddSeguimientoOpen(false);
                          resetSeguimientoForm();
                        }}
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleAddSeguimiento} disabled={submitting}>
                        {submitting ? 'Guardando...' : 'Guardar Seguimiento'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {seguimientos.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay seguimientos registrados
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza registrando la primera observación sobre {alumno.nombre_completo}.
                  </p>
                  <Button
                    onClick={() => setIsAddSeguimientoOpen(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Primera Nota</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {seguimientos.map((seguimiento) => (
                    <div key={seguimiento.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getTipoColor(seguimiento.tipo)} flex items-center space-x-1`}>
                            {getTipoIcon(seguimiento.tipo)}
                            <span>{getTipoLabel(seguimiento.tipo)}</span>
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(seguimiento.fecha)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditSeguimiento(seguimiento)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar seguimiento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro de que quieres eliminar esta nota de seguimiento? 
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSeguimiento(seguimiento)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{seguimiento.nota}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Registrado el {new Date(seguimiento.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Académica */}
        <TabsContent value="academico">
          <Card>
            <CardHeader>
              <CardTitle>Historial Académico</CardTitle>
              <CardDescription>
                Calificaciones, exámenes y tareas del alumno
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Próximamente
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Esta sección mostrará el historial académico del alumno.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Edición de Seguimiento */}
      <Dialog open={isEditSeguimientoOpen} onOpenChange={setIsEditSeguimientoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Seguimiento</DialogTitle>
            <DialogDescription>
              Modifica la observación registrada
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_tipo">Tipo de Seguimiento</Label>
                <Select
                  value={seguimientoForm.tipo}
                  onValueChange={(value) => handleSeguimientoInputChange('tipo', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="academico">Académico</SelectItem>
                    <SelectItem value="comportamiento">Comportamiento</SelectItem>
                    <SelectItem value="logro">Logro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_fecha">Fecha</Label>
                <Input
                  id="edit_fecha"
                  type="date"
                  value={seguimientoForm.fecha}
                  onChange={(e) => handleSeguimientoInputChange('fecha', e.target.value)}
                  className="mt-1"
                  disabled
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_nota">Observación *</Label>
              <Textarea
                id="edit_nota"
                value={seguimientoForm.nota}
                onChange={(e) => handleSeguimientoInputChange('nota', e.target.value)}
                placeholder="Describe la observación, logro o comportamiento..."
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditSeguimientoOpen(false);
                setEditingSeguimiento(null);
                resetSeguimientoForm();
              }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditSeguimiento} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}