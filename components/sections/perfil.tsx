"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { User, Mail, School, Save, CreditCard, Loader2 } from "lucide-react"
import { useState, useEffect, useRef } from "react" // Importa useRef
import { SubscriptionCard } from "./subscription-card"
import { uploadAvatar } from "@/lib/profile" // Importa uploadAvatar
import { toast } from "@/components/ui/use-toast"

export function Perfil() {
  const { user } = useAuth()
  const { profile, loading, updating, updateProfile, refreshProfile } = useProfile() // Añade refreshProfile
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    school: "",
    grade: "",
    city: "",
    state: "",
  })
  const [message, setMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null) // Ref para el input de archivo
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false) // Nuevo estado para la carga del avatar

  // Actualizar formData cuando se carga el perfil
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        school: profile.school || "",
        grade: profile.grade || "",
        city: profile.city || "",
        state: profile.state || "",
      })
    }
  }, [profile])

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    setMessage("")
    const success = await updateProfile(formData)

    if (success) {
      setMessage("Perfil actualizado correctamente")
      setIsEditing(false)
      setTimeout(() => setMessage(""), 3000)
    } else {
      setMessage("Error al actualizar el perfil")
    }
  }

  const handleCancel = () => {
    // Restaurar datos originales
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        school: profile.school || "",
        grade: profile.grade || "",
        city: profile.city || "",
        state: profile.state || "",
      })
    }
    setIsEditing(false)
    setMessage("")
  }

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.id || !event.target.files || event.target.files.length === 0) {
      return
    }

    const file = event.target.files[0]
    setIsUploadingAvatar(true)
    try {
      const newAvatarUrl = await uploadAvatar(user.id, file)
      if (newAvatarUrl) {
        toast({
          title: "Avatar actualizado",
          description: "Tu foto de perfil ha sido actualizada.",
        })
        refreshProfile() // Revalidar los datos del perfil
      } else {
        toast({
          title: "Error al subir avatar",
          description: "No se pudo actualizar la foto de perfil.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al intentar subir la foto de perfil.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
      // Limpiar el input de archivo para permitir la misma selección de archivo de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Perfil</h1>
        <p className="text-gray-600 mt-2">Gestiona tu información personal y preferencias</p>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div
          className={`text-center p-3 rounded-lg ${
            message.includes("Error")
              ? "bg-red-50 text-red-600 border border-red-200"
              : "bg-green-50 text-green-600 border border-green-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Sección Superior - Información Personal y Cuenta */}
      <div className="grid grid-cols-1  gap-6">
        {/* Información Personal - 2 columnas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
              <CardDescription>Actualiza tu información de perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-lg">{user?.email ? getInitials(user.email) : "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAvatarClick} // Llama a la función para abrir el selector de archivos
                    disabled={!isEditing || updating || isUploadingAvatar} // Deshabilita durante la carga del avatar
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Cambiar Foto"
                    )}
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef} // Asigna la ref al input
                    onChange={handleFileChange} // Maneja el cambio de archivo
                    accept="image/*"
                    className="hidden" // Oculta el input
                  />
                  <p className="text-sm text-gray-500 mt-1">JPG, PNG o GIF. Máximo 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre Completo</Label>
                  <Input
                    id="nombre"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    disabled={!isEditing || updating} // Deshabilita durante la carga del avatar
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email || ""} disabled />
                </div>
                <div>
                  <Label htmlFor="escuela">Escuela</Label>
                  <Input
                    id="escuela"
                    value={formData.school}
                    onChange={(e) => handleInputChange("school", e.target.value)}
                    disabled={!isEditing || updating} // Deshabilita durante la carga del avatar
                    placeholder="Nombre de tu escuela"
                  />
                </div>
                <div>
                  <Label htmlFor="grado">Grado que Impartes</Label>
                  <Input
                    id="grado"
                    value={formData.grade}
                    onChange={(e) => handleInputChange("grade", e.target.value)}
                    disabled={!isEditing || updating} // Deshabilita durante la carga del avatar
                    placeholder="ej. 3° Primaria"
                  />
                </div>
                <div>
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    disabled={!isEditing || updating} // Deshabilita durante la carga del avatar
                    placeholder="Tu ciudad"
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    disabled={!isEditing || updating} // Deshabilita durante la carga del avatar
                    placeholder="Tu estado"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancel} disabled={updating || isUploadingAvatar}> {/* Deshabilita durante la carga del avatar */}
                      Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={updating || isUploadingAvatar}> {/* Deshabilita durante la carga del avatar */}
                      {updating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección de Suscripción - 1 columna */}
        <div className="lg:col-span-2">
          <SubscriptionCard userPlan={profile?.subscription_plan || 'free'} />
        </div>
      </div>

      {/* Sección de Cuenta - Contraseña y Eliminar Cuenta */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Cuenta
          </CardTitle>
          <CardDescription>Gestiona la configuración de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Cambiar Contraseña</h3>
              <p className="text-sm text-gray-500">Actualiza tu contraseña de forma segura.</p>
            </div>
            <Button variant="outline">Cambiar Contraseña</Button>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Eliminar Cuenta</h3>
              <p className="text-sm text-gray-500">Elimina permanentemente tu cuenta y todos tus datos.</p>
            </div>
            <Button variant="destructive">Eliminar Cuenta</Button>
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}
