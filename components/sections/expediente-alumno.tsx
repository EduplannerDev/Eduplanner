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
import { ArrowLeft, Plus, Edit, Trash2, Calendar, BookOpen, MessageSquare, User, FileText, Award, AlertCircle, Phone, Mail, HeartPulse, Droplet, Skull } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getAlumnoById, getSeguimientoByAlumno, createSeguimiento, updateSeguimiento, deleteSeguimiento, updateAlumno, type Alumno, type SeguimientoDiario, type CreateSeguimientoData } from '@/lib/alumnos';
import { getGrupoById, type Grupo } from '@/lib/grupos';
import { getCalificacionesAlumno, type ActividadEvaluable, type Calificacion } from '@/lib/evaluaciones';
import { getPorcentajeAsistenciaAlumno } from '@/lib/asistencia';

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
  const [historialAcademico, setHistorialAcademico] = useState<{ actividad: ActividadEvaluable, calificacion: Calificacion | null }[]>([]);
  const [asistenciaPct, setAsistenciaPct] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('seguimiento');

  // States for Seguimiento Dialogs
  const [isAddSeguimientoOpen, setIsAddSeguimientoOpen] = useState(false);
  const [isEditSeguimientoOpen, setIsEditSeguimientoOpen] = useState(false);
  const [editingSeguimiento, setEditingSeguimiento] = useState<SeguimientoDiario | null>(null);
  const [seguimientoForm, setSeguimientoForm] = useState({
    nota: '',
    tipo: 'general' as 'general' | 'academico' | 'comportamiento' | 'logro',
    fecha: new Date().toISOString().split('T')[0]
  });

  // States for Edit Profile Dialog
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Alumno>>({});

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

      const [grupoData, seguimientosData, historialData, asistenciaData] = await Promise.all([
        getGrupoById(alumnoData.grupo_id),
        getSeguimientoByAlumno(alumnoId),
        getCalificacionesAlumno(alumnoId),
        getPorcentajeAsistenciaAlumno(alumnoId)
      ]);

      setAlumno(alumnoData);
      setGrupo(grupoData);
      setSeguimientos(seguimientosData);
      setHistorialAcademico(historialData);
      setAsistenciaPct(asistenciaData);
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

  // --- Profile Editing Logic ---
  const handleOpenEditProfile = () => {
    if (!alumno) return;
    setEditForm({
      nombre_completo: alumno.nombre_completo,
      numero_lista: alumno.numero_lista,
      notas_generales: alumno.notas_generales || '',
      nombre_padre: alumno.nombre_padre || '',
      correo_padre: alumno.correo_padre || '',
      telefono_padre: alumno.telefono_padre || '',
      nombre_madre: alumno.nombre_madre || '',
      correo_madre: alumno.correo_madre || '',
      telefono_madre: alumno.telefono_madre || '',
      alergias: alumno.alergias || '',
      tipo_sangre: alumno.tipo_sangre || '',
      condicion_medica: alumno.condicion_medica || '',
      contacto_emergencia_nombre: alumno.contacto_emergencia_nombre || '',
      contacto_emergencia_telefono: alumno.contacto_emergencia_telefono || ''
    });
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!alumno || !editForm.nombre_completo) return;

    try {
      setSubmitting(true);
      const updated = await updateAlumno(alumno.id, editForm);
      setAlumno(updated);
      setIsEditProfileOpen(false);
      toast({ title: "Perfil actualizado", description: "Los datos del alumno se han guardado correctamente." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudo actualizar el perfil", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Seguimiento Logic ---
  const handleSeguimientoInputChange = (field: string, value: string) => {
    setSeguimientoForm(prev => ({ ...prev, [field]: value }));
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
      toast({ title: "Error", description: "La nota es requerida", variant: "destructive" });
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
      toast({ title: "Éxito", description: "Seguimiento agregado correctamente" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudo agregar el seguimiento", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSeguimiento = async () => {
    if (!editingSeguimiento || !seguimientoForm.nota.trim()) {
      toast({ title: "Error", description: "La nota es requerida", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      const updatedSeguimiento = await updateSeguimiento(
        editingSeguimiento.id,
        seguimientoForm.nota.trim(),
        seguimientoForm.tipo
      );
      setSeguimientos(prev => prev.map(seg => seg.id === editingSeguimiento.id ? updatedSeguimiento : seg));
      setIsEditSeguimientoOpen(false);
      setEditingSeguimiento(null);
      resetSeguimientoForm();
      toast({ title: "Éxito", description: "Seguimiento actualizado correctamente" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudo actualizar el seguimiento", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSeguimiento = async (seguimiento: SeguimientoDiario) => {
    try {
      await deleteSeguimiento(seguimiento.id);
      setSeguimientos(prev => prev.filter(seg => seg.id !== seguimiento.id));
      toast({ title: "Éxito", description: "Seguimiento eliminado correctamente" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudo eliminar el seguimiento", variant: "destructive" });
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

  // --- Utils ---
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
    return new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      </div>
    );
  }

  if (error || !alumno) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">{error || 'Alumno no encontrado'}</p>
        <Button onClick={onBack} variant="outline">Volver</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Navigation */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="h-5 w-5" />
          <span className="text-lg font-medium">Volver a {grupo?.nombre}</span>
        </Button>
        <Button onClick={handleOpenEditProfile} variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />
          Editar Perfil
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Profile */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-t-4 border-t-primary">
            <CardContent className="pt-8 text-center">
              <Avatar className="h-32 w-32 mx-auto mb-4 ring-4 ring-background shadow-xl">
                <AvatarImage src={alumno.foto_url} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {getInitials(alumno.nombre_completo)}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold mb-1">{alumno.nombre_completo}</h1>
              <p className="text-muted-foreground mb-4">
                {grupo?.grado} {grupo?.nivel} • N.º {alumno.numero_lista || '-'}
              </p>

              <div className="grid grid-cols-3 gap-2 text-sm bg-muted/30 p-4 rounded-lg">
                <div className="text-center p-2">
                  <div className="font-bold text-lg">{seguimientos.length}</div>
                  <div className="text-xs text-muted-foreground uppercase">Observaciones</div>
                </div>
                <div className="text-center p-2 border-l border-border/50">
                  <div className="font-bold text-lg">
                    {historialAcademico.length > 0
                      ? (historialAcademico.reduce((acc, curr) => acc + (curr.calificacion?.calificacion || 0), 0) /
                        (historialAcademico.filter(h => h.calificacion?.calificacion !== null).length || 1)).toFixed(1)
                      : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase">Promedio</div>
                </div>
                <div className="text-center p-2 border-l border-border/50">
                  <div className={`font-bold text-lg ${asistenciaPct !== null
                      ? asistenciaPct >= 90 ? 'text-green-600' : asistenciaPct >= 80 ? 'text-yellow-600' : 'text-red-600'
                      : ''
                    }`}>
                    {asistenciaPct !== null ? `${asistenciaPct}%` : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase">Asistencia</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Info Card - Always Visible */}
          <Card className="border-l-4 border-l-red-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-600 flex items-center gap-2 text-base">
                <HeartPulse className="h-5 w-5" />
                Datos Médicos y Emergencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Badges Flow */}
              <div className="flex flex-wrap gap-2">
                {alumno.tipo_sangre ? (
                  <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 gap-1 px-3 py-1">
                    <Droplet className="h-3 w-3 fill-current" />
                    {alumno.tipo_sangre}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-dashed text-muted-foreground opacity-50">Sin tipo de sangre</Badge>
                )}

                {alumno.alergias ? (
                  <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800 gap-1 px-3 py-1">
                    <Skull className="h-3 w-3" />
                    {alumno.alergias}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-dashed text-muted-foreground opacity-50">Sin alergias</Badge>
                )}
              </div>

              {alumno.condicion_medica && (
                <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm text-blue-800">
                  <div className="font-semibold mb-1 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Condición Médica
                  </div>
                  {alumno.condicion_medica}
                </div>
              )}

              <div className="pt-2 border-t mt-2">
                <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Contacto de Emergencia
                </div>
                {alumno.contacto_emergencia_nombre ? (
                  <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                    <div className="font-medium text-red-900">{alumno.contacto_emergencia_nombre}</div>
                    {alumno.contacto_emergencia_telefono ? (
                      <a href={`tel:${alumno.contacto_emergencia_telefono}`} className="mt-2 flex items-center gap-2 text-sm text-red-700 hover:underline bg-white/50 p-2 rounded w-full justify-center border border-red-200">
                        <Phone className="h-4 w-4" />
                        LLAMAR: {alumno.contacto_emergencia_telefono}
                      </a>
                    ) : (
                      <div className="text-sm text-red-400 mt-1 italic">Sin teléfono registrado</div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic bg-muted/20 p-3 rounded">
                    No se ha asignado contacto de emergencia.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5 text-primary" />
                Padres de Familia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Padre */}
              <div>
                <div className="text-xs font-bold text-muted-foreground mb-1 uppercase">Padre</div>
                {alumno.nombre_padre ? (
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{alumno.nombre_padre}</div>
                    {alumno.telefono_padre && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" /> {alumno.telefono_padre}
                      </div>
                    )}
                    {alumno.correo_padre && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" /> {alumno.correo_padre}
                      </div>
                    )}
                  </div>
                ) : <div className="text-sm text-muted-foreground italic">- No registrado -</div>}
              </div>

              {/* Madre */}
              <div className="border-t pt-2">
                <div className="text-xs font-bold text-muted-foreground mb-1 uppercase">Madre</div>
                {alumno.nombre_madre ? (
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{alumno.nombre_madre}</div>
                    {alumno.telefono_madre && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" /> {alumno.telefono_madre}
                      </div>
                    )}
                    {alumno.correo_madre && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" /> {alumno.correo_madre}
                      </div>
                    )}
                  </div>
                ) : <div className="text-sm text-muted-foreground italic">- No registrado -</div>}
              </div>

              <div className="pt-4 flex flex-col gap-2">
                {onNavigateToMensajesPadres && (
                  <Button size="sm" variant="outline" className="w-full justify-start gap-2"
                    onClick={() => onNavigateToMensajesPadres({
                      id: alumno.id,
                      nombre: alumno.nombre_completo,
                      grupo: grupo?.nombre,
                      grado: grupo?.grado,
                      nivel: grupo?.nivel
                    })}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Enviar Mensaje
                  </Button>
                )}
                {onNavigateToMensajesPadresAlumno && (
                  <Button size="sm" variant="ghost" className="w-full justify-start gap-2 text-muted-foreground"
                    onClick={() => onNavigateToMensajesPadresAlumno({
                      id: alumno.id,
                      nombre: alumno.nombre_completo,
                      grupo: grupo?.nombre,
                      grado: grupo?.grado,
                      nivel: grupo?.nivel
                    })}
                  >
                    <FileText className="h-4 w-4" />
                    Ver Historial
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Content Tabs */}
        <div className="lg:col-span-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none px-0 h-auto bg-transparent gap-6">
              <TabsTrigger value="seguimiento" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
                Anecdotario
              </TabsTrigger>
              <TabsTrigger value="academico" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
                Historia Académica
              </TabsTrigger>
              <TabsTrigger value="notas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
                Notas Generales
              </TabsTrigger>
            </TabsList>

            <TabsContent value="seguimiento" className="mt-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Registro de Observaciones</h3>
                  <p className="text-sm text-muted-foreground">Historial de comportamiento y logros</p>
                </div>
                <Button onClick={() => setIsAddSeguimientoOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Agregar Nota
                </Button>
              </div>

              {seguimientos.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                  <div className="bg-background w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium">No hay registros aún</h3>
                  <p className="text-sm text-muted-foreground mb-4">Comienza agregando una observación positiva o reporte</p>
                  <Button variant="outline" onClick={() => setIsAddSeguimientoOpen(true)}>Crear Primera Nota</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {seguimientos.map((seg) => (
                    <Card key={seg.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-full shrink-0 mt-1 ${seg.tipo === 'logro' ? 'bg-green-100 text-green-700' :
                              seg.tipo === 'comportamiento' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                              {getTipoIcon(seg.tipo)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={`${getTipoColor(seg.tipo)} uppercase text-[10px]`}>
                                  {getTipoLabel(seg.tipo)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(seg.fecha)}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed">{seg.nota}</p>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => openEditSeguimiento(seg)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSeguimiento(seg)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="academico" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Historial Académico</CardTitle>
                  <CardDescription>Calificaciones y actividades del alumno</CardDescription>
                </CardHeader>
                <CardContent>
                  {historialAcademico.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No hay actividades evaluadas registradas para este alumno.</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="p-3 text-left font-medium">Actividad</th>
                            <th className="p-3 text-center font-medium">Tipo</th>
                            <th className="p-3 text-center font-medium">Fecha</th>
                            <th className="p-3 text-center font-medium">Ponderación</th>
                            <th className="p-3 text-center font-bold">Calificación</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {historialAcademico.map(({ actividad, calificacion }) => (
                            <tr key={actividad.id} className="hover:bg-muted/20">
                              <td className="p-3 font-medium">
                                <div className="flex flex-col">
                                  <span>{actividad.nombre}</span>
                                  {actividad.descripcion && <span className="text-xs text-muted-foreground font-normal line-clamp-1">{actividad.descripcion}</span>}
                                </div>
                              </td>
                              <td className="p-3 text-center uppercase text-xs text-muted-foreground">{actividad.tipo}</td>
                              <td className="p-3 text-center text-muted-foreground">{new Date(actividad.created_at).toLocaleDateString()}</td>
                              <td className="p-3 text-center text-muted-foreground">{actividad.ponderacion}%</td>
                              <td className="p-3 text-center">
                                {calificacion && calificacion.calificacion !== null ? (
                                  <Badge variant={calificacion.calificacion >= 6 ? "outline" : "destructive"} className={calificacion.calificacion >= 8 ? "border-green-500 text-green-700 bg-green-50" : ""}>
                                    {calificacion.calificacion}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {historialAcademico.length > 0 && (
                    <div className="mt-6 p-4 bg-muted/30 rounded-lg flex justify-between items-center">
                      <span className="font-medium text-muted-foreground">Promedio General</span>
                      <span className="text-2xl font-bold">
                        {(historialAcademico.reduce((acc, curr) => acc + (curr.calificacion?.calificacion || 0), 0) /
                          (historialAcademico.filter(h => h.calificacion?.calificacion !== null).length || 1)
                        ).toFixed(1)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notas" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notas Generales</CardTitle>
                  <CardDescription>Información privada sobre el alumno</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {alumno.notas_generales || "No hay notas generales registradas."}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* --- DIALOGS --- */}

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfil del Alumno</DialogTitle>
            <DialogDescription>Actualiza la información personal, médica y de contacto.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Personal */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-primary">Información Personal</h4>
              <div className="grid gap-2">
                <Label>Nombre Completo</Label>
                <Input
                  value={editForm.nombre_completo || ''}
                  onChange={(e) => setEditForm({ ...editForm, nombre_completo: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Número de Lista</Label>
                <Input
                  type="number"
                  value={editForm.numero_lista || ''}
                  onChange={(e) => setEditForm({ ...editForm, numero_lista: parseInt(e.target.value) || undefined })}
                />
              </div>
            </div>

            {/* Medical */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-red-600">Salud y Emergencia</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo de Sangre</Label>
                  <Select
                    value={editForm.tipo_sangre || ''}
                    onValueChange={(val) => setEditForm({ ...editForm, tipo_sangre: val })}
                  >
                    <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                    <SelectContent>
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Alergias</Label>
                  <Input
                    placeholder="Ninguna"
                    value={editForm.alergias || ''}
                    onChange={(e) => setEditForm({ ...editForm, alergias: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Condición Médica</Label>
                <Input
                  placeholder="Ej. Asma, Diabetes..."
                  value={editForm.condicion_medica || ''}
                  onChange={(e) => setEditForm({ ...editForm, condicion_medica: e.target.value })}
                />
              </div>
            </div>

            {/* Contact Emergency */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-red-50 p-4 rounded-lg">
              <div className="grid gap-2">
                <Label>Contacto de Emergencia (Nombre)</Label>
                <Input
                  className="bg-white"
                  value={editForm.contacto_emergencia_nombre || ''}
                  onChange={(e) => setEditForm({ ...editForm, contacto_emergencia_nombre: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Teléfono de Emergencia</Label>
                <Input
                  className="bg-white"
                  placeholder="10 dígitos"
                  value={editForm.contacto_emergencia_telefono || ''}
                  onChange={(e) => setEditForm({ ...editForm, contacto_emergencia_telefono: e.target.value })}
                />
              </div>
            </div>

            {/* Parents - Simplified for space */}
            <div className="space-y-4 md:col-span-2">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-primary">Padres de Familia</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-muted-foreground">Datos del Padre</Label>
                  <Input placeholder="Nombre" value={editForm.nombre_padre || ''} onChange={e => setEditForm({ ...editForm, nombre_padre: e.target.value })} />
                  <Input placeholder="Teléfono" value={editForm.telefono_padre || ''} onChange={e => setEditForm({ ...editForm, telefono_padre: e.target.value })} />
                  <Input placeholder="Email" value={editForm.correo_padre || ''} onChange={e => setEditForm({ ...editForm, correo_padre: e.target.value })} />
                </div>
                <div className="space-y-3">
                  <Label className="text-muted-foreground">Datos de la Madre</Label>
                  <Input placeholder="Nombre" value={editForm.nombre_madre || ''} onChange={e => setEditForm({ ...editForm, nombre_madre: e.target.value })} />
                  <Input placeholder="Teléfono" value={editForm.telefono_madre || ''} onChange={e => setEditForm({ ...editForm, telefono_madre: e.target.value })} />
                  <Input placeholder="Email" value={editForm.correo_madre || ''} onChange={e => setEditForm({ ...editForm, correo_madre: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Notas Generales</Label>
              <Textarea
                value={editForm.notas_generales || ''}
                onChange={e => setEditForm({ ...editForm, notas_generales: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveProfile} disabled={submitting}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Seguimiento Dialog */}
      <Dialog open={isAddSeguimientoOpen} onOpenChange={setIsAddSeguimientoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Seguimiento</DialogTitle>
            <DialogDescription>Registra una nueva observación sobre {alumno.nombre_completo}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={seguimientoForm.tipo} onValueChange={(val: any) => handleSeguimientoInputChange('tipo', val)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="academico">Académico</SelectItem>
                    <SelectItem value="comportamiento">Comportamiento</SelectItem>
                    <SelectItem value="logro">Logro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha</Label>
                <Input className="mt-1" type="date" value={seguimientoForm.fecha} onChange={(e) => handleSeguimientoInputChange('fecha', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Observación</Label>
              <Textarea className="mt-1" rows={4} value={seguimientoForm.nota} onChange={(e) => handleSeguimientoInputChange('nota', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSeguimientoOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddSeguimiento} disabled={submitting}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Seguimiento Dialog */}
      <Dialog open={isEditSeguimientoOpen} onOpenChange={setIsEditSeguimientoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Seguimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={seguimientoForm.tipo} onValueChange={(val: any) => handleSeguimientoInputChange('tipo', val)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="academico">Académico</SelectItem>
                    <SelectItem value="comportamiento">Comportamiento</SelectItem>
                    <SelectItem value="logro">Logro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha</Label>
                <Input className="mt-1" type="date" value={seguimientoForm.fecha} disabled />
              </div>
            </div>
            <div>
              <Label>Observación</Label>
              <Textarea className="mt-1" rows={4} value={seguimientoForm.nota} onChange={(e) => handleSeguimientoInputChange('nota', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditSeguimientoOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSeguimiento} disabled={submitting}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}