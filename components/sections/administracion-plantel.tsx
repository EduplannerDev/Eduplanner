"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Users, UserPlus, Settings, Shield, Edit, Save, X } from "lucide-react"
import { useRoles } from "@/hooks/use-roles"
import { useNotification } from "@/hooks/use-notification"
import { supabase } from "@/lib/supabase"


interface AdministracionPlantelProps {
  isOpen: boolean
  onClose: () => void
}

export function AdministracionPlantel({ isOpen, onClose }: AdministracionPlantelProps) {
  const { isDirector, plantel, loading } = useRoles()
  const { success, error } = useNotification()
  const [activeTab, setActiveTab] = useState("informacion")
  const [isEditing, setIsEditing] = useState(false)
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
    }
  }, [plantel])

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
      console.error('Error updating plantel:', err)
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

  // Verificar permisos
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!isDirector) {
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

  if (!plantel) {
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



      {/* Información del Plantel */}
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

      {/* Tabs de Gestión */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profesores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Profesores
          </TabsTrigger>
          <TabsTrigger value="invitaciones" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invitaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profesores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Profesores</CardTitle>
              <CardDescription>
                Administra los profesores asignados a tu plantel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Módulo en Desarrollo</h3>
                <p className="text-muted-foreground mb-4">
                  La gestión de profesores estará disponible próximamente.
                </p>
                <Button disabled>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invitar Profesor
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invitaciones Pendientes</CardTitle>
              <CardDescription>
                Gestiona las invitaciones enviadas a nuevos profesores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Módulo en Desarrollo</h3>
                <p className="text-muted-foreground">
                  El sistema de invitaciones estará disponible próximamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}