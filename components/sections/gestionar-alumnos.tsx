'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, Users, BookOpen, TrendingUp, FileText, User, MessageSquare, Calendar, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getAlumnosByGrupo, createAlumno, updateAlumno, deleteAlumno, createSeguimiento, type Alumno, type CreateAlumnoData, type UpdateAlumnoData, type CreateSeguimientoData } from '@/lib/alumnos';
import { getGrupoById, type Grupo } from '@/lib/grupos';

import { ExpedienteAlumno } from './expediente-alumno';
import { ImportAlumnosDialog } from '@/components/alumnos/import-alumnos-dialog';

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
    telefono_madre: '',
    // Información Médica y de Emergencia
    alergias: '',
    tipo_sangre: '',
    condicion_medica: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [viewState, setViewState] = useState<ViewState>({ mode: 'list' });

  // Estado para Agregar Nota (Seguimiento) desde el listado
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);
  const [selectedAlumnoForNote, setSelectedAlumnoForNote] = useState<Alumno | null>(null);
  const [noteForm, setNoteForm] = useState({
    nota: '',
    tipo: 'general' as 'general' | 'academico' | 'comportamiento' | 'logro',
    fecha: new Date().toISOString().split('T')[0]
  });
  const [submittingNote, setSubmittingNote] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Validación específica para teléfonos - solo permitir números y espacios
    if (name.includes('telefono')) {
      const cleanValue = value.replace(/[^\d\s]/g, '');
      if (cleanValue.replace(/\s+/g, '').length <= 10) {
        setFormData(prev => ({
          ...prev,
          [name]: cleanValue
        }));
      }
      return;
    }

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
      telefono_madre: '',
      // Información Médica y de Emergencia
      alergias: '',
      tipo_sangre: '',
      condicion_medica: '',
      contacto_emergencia_nombre: '',
      contacto_emergencia_telefono: ''
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

    // Validar correos electrónicos
    if (formData.correo_padre.trim() && !validateEmail(formData.correo_padre.trim())) {
      toast({
        title: "Error",
        description: "El correo electrónico del padre no es válido",
        variant: "destructive",
      });
      return;
    }

    if (formData.correo_madre.trim() && !validateEmail(formData.correo_madre.trim())) {
      toast({
        title: "Error",
        description: "El correo electrónico de la madre no es válido",
        variant: "destructive",
      });
      return;
    }

    // Validar teléfonos
    if (formData.telefono_padre.trim() && !validatePhone(formData.telefono_padre.trim())) {
      toast({
        title: "Error",
        description: "El teléfono del padre debe tener exactamente 10 dígitos",
        variant: "destructive",
      });
      return;
    }

    if (formData.telefono_madre.trim() && !validatePhone(formData.telefono_madre.trim())) {
      toast({
        title: "Error",
        description: "El teléfono de la madre debe tener exactamente 10 dígitos",
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

    // Validar correos electrónicos
    if (formData.correo_padre.trim() && !validateEmail(formData.correo_padre.trim())) {
      toast({
        title: "Error",
        description: "El correo electrónico del padre no es válido",
        variant: "destructive",
      });
      return;
    }

    if (formData.correo_madre.trim() && !validateEmail(formData.correo_madre.trim())) {
      toast({
        title: "Error",
        description: "El correo electrónico de la madre no es válido",
        variant: "destructive",
      });
      return;
    }

    // Validar teléfonos
    if (formData.telefono_padre.trim() && !validatePhone(formData.telefono_padre.trim())) {
      toast({
        title: "Error",
        description: "El teléfono del padre debe tener exactamente 10 dígitos",
        variant: "destructive",
      });
      return;
    }

    if (formData.telefono_madre.trim() && !validatePhone(formData.telefono_madre.trim())) {
      toast({
        title: "Error",
        description: "El teléfono de la madre debe tener exactamente 10 dígitos",
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
      telefono_madre: alumno.telefono_madre || '',
      // Información Médica y de Emergencia
      alergias: alumno.alergias || '',
      tipo_sangre: alumno.tipo_sangre || '',
      condicion_medica: alumno.condicion_medica || '',
      contacto_emergencia_nombre: alumno.contacto_emergencia_nombre || '',
      contacto_emergencia_telefono: alumno.contacto_emergencia_telefono || ''
    });
    setIsEditDialogOpen(true);
  };

  // Funciones para Agregar Nota (Seguimiento)
  const handleNoteInputChange = (field: string, value: string) => {
    setNoteForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetNoteForm = () => {
    setNoteForm({
      nota: '',
      tipo: 'general',
      fecha: new Date().toISOString().split('T')[0]
    });
  };

  const openAddNoteDialog = (alumno: Alumno) => {
    setSelectedAlumnoForNote(alumno);
    resetNoteForm();
    setIsAddNoteDialogOpen(true);
  };

  const handleAddNote = async () => {
    if (!selectedAlumnoForNote || !noteForm.nota.trim()) {
      toast({
        title: "Error",
        description: "La nota es requerida",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingNote(true);

      const seguimientoData: CreateSeguimientoData = {
        alumno_id: selectedAlumnoForNote.id,
        nota: noteForm.nota.trim(),
        tipo: noteForm.tipo,
        fecha: noteForm.fecha
      };

      await createSeguimiento(seguimientoData);

      setIsAddNoteDialogOpen(false);
      resetNoteForm();
      setSelectedAlumnoForNote(null);

      toast({
        title: "Éxito",
        description: "Nota agregada correctamente",
      });
    } catch (err) {
      console.error('Error adding note:', err);
      toast({
        title: "Error",
        description: "No se pudo agregar la nota",
        variant: "destructive",
      });
    } finally {
      setSubmittingNote(false);
    }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4 w-full md:w-auto min-w-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate leading-tight">
              Alumnos de: {grupo?.nombre || 'Cargando...'}
            </h1>
            {grupo && (
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {grupo.grado} • {grupo.nivel} • {grupo.ciclo_escolar}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4" />
            <span>Importar Lista</span>
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center justify-center space-x-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span>Añadir Alumno</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Añadir Nuevo Alumno</DialogTitle>
                <DialogDescription>
                  Agrega un nuevo alumno al grupo {grupo?.nombre}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1">
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

                {/* Información Médica y de Emergencia */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Salud y Emergencias
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipo_sangre">Tipo de Sangre</Label>
                      <Select
                        value={formData.tipo_sangre}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, tipo_sangre: val }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                        <SelectContent>
                          {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(tipo => (
                            <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="alergias">Alergias</Label>
                      <Input
                        id="alergias"
                        name="alergias"
                        value={formData.alergias}
                        onChange={handleInputChange}
                        placeholder="Ej: Penicilina, Nueces, etc (Ninguna si no aplica)"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="condicion_medica">Condiciones Médicas / Tratamientos</Label>
                      <Input
                        id="condicion_medica"
                        name="condicion_medica"
                        value={formData.condicion_medica}
                        onChange={handleInputChange}
                        placeholder="Diabetes, Asma, TDAH, etc..."
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
                    <h5 className="text-sm font-medium text-red-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                      En caso de Emergencia
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contacto_emergencia_nombre">Contacto de Emergencia</Label>
                        <Input
                          id="contacto_emergencia_nombre"
                          name="contacto_emergencia_nombre"
                          value={formData.contacto_emergencia_nombre}
                          onChange={handleInputChange}
                          placeholder="Nombre completo"
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contacto_emergencia_telefono">Teléfono de Emergencia</Label>
                        <Input
                          id="contacto_emergencia_telefono"
                          name="contacto_emergencia_telefono"
                          value={formData.contacto_emergencia_telefono}
                          onChange={handleInputChange}
                          placeholder="10 dígitos"
                          className="mt-1 bg-white"
                          maxLength={10}
                        />
                      </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
                      <div className="space-y-2">
                        <Label htmlFor="nombre_padre" className="text-sm font-medium">Nombre Completo</Label>
                        <Input
                          id="nombre_padre"
                          name="nombre_padre"
                          value={formData.nombre_padre}
                          onChange={handleInputChange}
                          placeholder="Juan Carlos Rojas"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="correo_padre" className="text-sm font-medium">Correo Electrónico</Label>
                        <Input
                          id="correo_padre"
                          name="correo_padre"
                          type="email"
                          value={formData.correo_padre}
                          onChange={handleInputChange}
                          placeholder="ejemplo@correo.com"
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">Formato: usuario@dominio.com</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono_padre" className="text-sm font-medium">Teléfono</Label>
                        <Input
                          id="telefono_padre"
                          name="telefono_padre"
                          type="tel"
                          value={formData.telefono_padre}
                          onChange={handleInputChange}
                          placeholder="5512345678"
                          className="w-full"
                          maxLength={10}
                        />
                        <p className="text-xs text-gray-500">Solo números, máximo 10 dígitos</p>
                      </div>
                    </div>
                  </div>

                  {/* Madre */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Madre</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
                      <div className="space-y-2">
                        <Label htmlFor="nombre_madre" className="text-sm font-medium">Nombre Completo</Label>
                        <Input
                          id="nombre_madre"
                          name="nombre_madre"
                          value={formData.nombre_madre}
                          onChange={handleInputChange}
                          placeholder="María Elena García"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="correo_madre" className="text-sm font-medium">Correo Electrónico</Label>
                        <Input
                          id="correo_madre"
                          name="correo_madre"
                          type="email"
                          value={formData.correo_madre}
                          onChange={handleInputChange}
                          placeholder="ejemplo@correo.com"
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">Formato: usuario@dominio.com</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono_madre" className="text-sm font-medium">Teléfono</Label>
                        <Input
                          id="telefono_madre"
                          name="telefono_madre"
                          type="tel"
                          value={formData.telefono_madre}
                          onChange={handleInputChange}
                          placeholder="5512345678"
                          className="w-full"
                          maxLength={10}
                        />
                        <p className="text-xs text-gray-500">Solo números, máximo 10 dígitos</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notas Generales */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="px-2">
                    <div className="space-y-2">
                      <Label htmlFor="notas_generales" className="text-sm font-medium">Notas Generales</Label>
                      <Textarea
                        id="notas_generales"
                        name="notas_generales"
                        value={formData.notas_generales}
                        onChange={handleInputChange}
                        placeholder="Información adicional sobre el alumno..."
                        className="w-full min-h-[80px]"
                      />
                    </div>
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total de Alumnos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{alumnos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Con Número de Lista</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {alumnos.filter(a => a.numero_lista).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Edit className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Con Notas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
              <User className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No hay alumnos registrados
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
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
            <>
              <div className="hidden md:block">
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
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleViewExpediente(alumno.id)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium text-left"
                          >
                            {alumno.nombre_completo}
                          </button>
                        </TableCell>
                        <TableCell>
                          {alumno.notas_generales ? (
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {alumno.notas_generales.length > 50
                                ? `${alumno.notas_generales.substring(0, 50)}...`
                                : alumno.notas_generales}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">Sin notas</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewExpediente(alumno.id)}
                              title="Ver expediente"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              <span>Expediente</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAddNoteDialog(alumno)}
                              title="Agregar nota"
                              className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              <span>Nota</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(alumno)}
                              title="Editar alumno"
                              className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/20"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Editar</span>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Eliminar alumno"
                                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Eliminar</span>
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
              </div>

              {/* Mobile List View */}
              <div className="md:hidden space-y-4">
                {alumnos.map((alumno) => (
                  <div key={alumno.id} className="border rounded-lg p-4 bg-card text-card-foreground shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex gap-3 min-w-0">
                        <div className="shrink-0 mt-1">
                          {alumno.numero_lista ? (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground border">
                              {alumno.numero_lista}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm text-muted-foreground border">
                              -
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => handleViewExpediente(alumno.id)}
                            className="font-semibold text-lg hover:underline text-left truncate w-full block"
                          >
                            {alumno.nombre_completo}
                          </button>
                          <div className="mt-1">
                            {alumno.notas_generales ? (
                              <div className="flex items-start gap-1 text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                                <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                                <span className="line-clamp-2">{alumno.notas_generales}</span>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Sin notas registradas</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t grid grid-cols-4 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewExpediente(alumno.id)}
                        className="flex items-center justify-center h-9 w-full border-blue-200 text-blue-700 bg-blue-50/50"
                        title="Ver Expediente"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddNoteDialog(alumno)}
                        className="flex items-center justify-center h-9 w-full border-green-200 text-green-700 bg-green-50/50"
                        title="Agregar Nota"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(alumno)}
                        className="flex items-center justify-center h-9 w-full border-amber-200 text-amber-700 bg-amber-50/50"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center justify-center h-9 w-full border-red-200 text-red-700 bg-red-50/50"
                            title="Borrar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar alumno?</AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Estás seguro de que quieres eliminar a {alumno.nombre_completo}?
                              Esta acción no se puede deshacer.
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
                  </div>
                ))}
              </div>
            </>
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

      {/* Dialog para Agregar Nota (Seguimiento) */}
      <Dialog open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Seguimiento</DialogTitle>
            <DialogDescription>
              Registra una nueva observación sobre {selectedAlumnoForNote?.nombre_completo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="note_tipo">Tipo de Seguimiento</Label>
                <Select
                  value={noteForm.tipo}
                  onValueChange={(value) => handleNoteInputChange('tipo', value)}
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
                <Label htmlFor="note_fecha">Fecha</Label>
                <Input
                  id="note_fecha"
                  type="date"
                  value={noteForm.fecha}
                  onChange={(e) => handleNoteInputChange('fecha', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="note_texto">Observación *</Label>
              <Textarea
                id="note_texto"
                value={noteForm.nota}
                onChange={(e) => handleNoteInputChange('nota', e.target.value)}
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
                setIsAddNoteDialogOpen(false);
                resetNoteForm();
                setSelectedAlumnoForNote(null);
              }}
              disabled={submittingNote}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddNote} disabled={submittingNote}>
              {submittingNote ? 'Guardando...' : 'Guardar Seguimiento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportAlumnosDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        grupoId={grupoId}
        onSuccess={() => {
          fetchData();
          // Optional: Close dialog is handled in component, or we can force close here if needed
          // setIsImportDialogOpen(false); 
        }}
      />
    </div >
  );
}