"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { Mail, Eye, EyeOff, Loader2, AlertTriangle, Home } from "lucide-react"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Leer errores de los parámetros de query (?error=...)
    const queryError = searchParams.get('error')
    const queryErrorDescription = searchParams.get('error_description')

    // Leer errores del hash (#error=...)
    let hashError = null
    let hashErrorDescription = null

    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      hashError = hashParams.get('error')
      hashErrorDescription = hashParams.get('error_description')
    }

    // Priorizar errores del hash sobre los de query
    const error = hashError || queryError
    const errorDescription = hashErrorDescription || queryErrorDescription

    console.log('🔍 LoginForm - URL actual:', window.location.href)
    console.log('🔍 LoginForm - Hash error:', hashError)
    console.log('🔍 LoginForm - Hash error_description:', hashErrorDescription)
    console.log('🔍 LoginForm - Query error:', queryError)
    console.log('🔍 LoginForm - Query error_description:', queryErrorDescription)
    console.log('🔍 LoginForm - Error final:', error)
    console.log('🔍 LoginForm - Error description final:', errorDescription)

    if (error || errorDescription) {
      let errorMessage = ''

      // Usar error_description si está disponible, sino usar error
      if (errorDescription) {
        errorMessage = decodeURIComponent(errorDescription)
      } else if (error) {
        // Mapear códigos de error a mensajes amigables
        switch (error) {
          case 'access_denied':
            errorMessage = 'Acceso denegado'
            break
          case 'invalid_invitation_token':
            errorMessage = 'El token de invitación es inválido o está malformado'
            break
          case 'expired_invitation_token':
            errorMessage = 'El token de invitación ha expirado o es inválido'
            break
          case 'invitation_processing_error':
            errorMessage = 'Error procesando el token de invitación'
            break
          default:
            errorMessage = decodeURIComponent(error)
        }
      }

      // Traducir mensajes comunes de inglés a español
      if (errorMessage) {
        const translations = {
          'Email link is invalid or has expired': 'El enlace de correo es inválido o ha expirado',
          'Invalid login credentials': 'Credenciales de inicio de sesión inválidas',
          'User not found': 'Usuario no encontrado',
          'Invalid email': 'Correo electrónico inválido',
          'Password is too short': 'La contraseña es demasiado corta',
          'Email rate limit exceeded': 'Se ha excedido el límite de intentos de correo',
          'Token has expired': 'El token ha expirado',
          'Invalid token': 'Token inválido',
          'Access denied': 'Acceso denegado',
          'Unauthorized': 'No autorizado',
          'Forbidden': 'Prohibido'
        }

        // Buscar traducciones exactas
        for (const [english, spanish] of Object.entries(translations)) {
          if (errorMessage.includes(english)) {
            errorMessage = errorMessage.replace(english, spanish)
          }
        }
      }

      console.log('🔍 LoginForm - Mensaje de error final:', errorMessage)
      setMessage(errorMessage)
    } else {
      console.log('🔍 LoginForm - No hay parámetros de error en la URL')
    }
  }, [searchParams])

  const isExpiredInvitation = (msg: string | null): boolean => {
    if (!msg) return false
    const lowerMsg = msg.toLowerCase()

    // Verificar si es un error relacionado con invitaciones, OTP o enlaces de email
    const isInvitationError = lowerMsg.includes('invitación') ||
      lowerMsg.includes('invitation') ||
      lowerMsg.includes('token') ||
      lowerMsg.includes('otp') ||
      lowerMsg.includes('email link') ||
      lowerMsg.includes('enlace') ||
      lowerMsg.includes('link')

    // Verificar si es un error de expiración o invalidez
    const isExpiredOrInvalid = lowerMsg.includes('expirado') ||
      lowerMsg.includes('expirada') ||
      lowerMsg.includes('expired') ||
      lowerMsg.includes('inválido') ||
      lowerMsg.includes('invalid') ||
      lowerMsg.includes('malformado') ||
      lowerMsg.includes('malformed') ||
      lowerMsg.includes('access_denied') ||
      lowerMsg.includes('acceso denegado')

    return isInvitationError && isExpiredOrInvalid
  }

  if (message && isExpiredInvitation(message)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <Card className="w-full max-w-md bg-muted/50">
          <div className="flex justify-center pt-8 pb-4">
            <img src="/images/Logo.png" alt="Logo EduPlanner" className="h-[200px] w-auto opacity-75" />
          </div>

          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-700">Invitación Expirada</CardTitle>
            <CardDescription className="text-red-600">
              Tu enlace de invitación ya no es válido
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-2">
                🚫 {message}
              </p>
              <p className="text-red-600 text-sm">
                Los enlaces de invitación tienen una duración limitada por seguridad.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">¿Qué puedes hacer?</h3>
                <ul className="text-blue-700 text-sm space-y-1 text-left">
                  <li>• Contacta al administrador de tu plantel</li>
                  <li>• Solicita una nueva invitación</li>
                  <li>• Verifica que el enlace esté completo</li>
                </ul>
              </div>

              <Button
                onClick={() => window.location.href = '/'}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Home className="mr-2 h-4 w-4" />
                Volver al Inicio
              </Button>
            </div>
          </CardContent>

          <CardFooter className="text-center">
            <p className="text-xs text-gray-500 w-full">
              Si continúas teniendo problemas, contacta al soporte técnico
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      if (isSignUp) {
        // Validar email y contraseña
        if (!validateEmail(email)) {
          setMessage("Por favor ingresa un email válido")
          setIsLoading(false)
          return
        }

        if (password.length < 6) {
          setMessage("La contraseña debe tener al menos 6 caracteres")
          setIsLoading(false)
          return
        }

        // Verificar si el usuario ya existe en la base de datos
        console.log("🔍 Verificando usuario existente para email:", email)
        
        // Verificar en la tabla profiles
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('email, id')
          .eq('email', email)
          .maybeSingle()

        console.log("📊 Resultado de la consulta profiles:", { existingProfile, profileError })

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("❌ Error verificando usuario existente en profiles:", profileError)
          throw new Error("Error verificando si el usuario existe")
        }

        if (existingProfile) {
          console.log("⚠️ Usuario ya existe en profiles, mostrando mensaje")
          setMessage("Este email ya se encuentra registrado. Por favor, intenta iniciar sesión.")
          setIsLoading(false)
          return
        }

        console.log("✅ Usuario no existe en profiles, procediendo con registro")

        // Ahora procedemos con el registro real
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: null // Este dato se usará en el trigger
            }
          },
        })

        if (signUpError) {
          console.error("Error en el registro:", signUpError)
          
          // Verificar si el error es porque el usuario ya existe
          if (signUpError.message.includes('User already registered') || 
              signUpError.message.includes('already been registered') ||
              signUpError.message.includes('Email address already in use')) {
            setMessage("Este email ya se encuentra registrado. Por favor, intenta iniciar sesión.")
            setIsLoading(false)
            return
          }
          
          throw signUpError
        }

        if (!data?.user?.id) {
          throw new Error("No se pudo crear el usuario")
        }

        setMessage("¡Revisa tu email para confirmar tu cuenta!")

      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        setMessage("¡Inicio de sesión exitoso!")
      }
    } catch (error: any) {
      console.error("Error completo:", error)
      let errorMessage = "Ha ocurrido un error. "

      if (error.message) {
        if (error.message.includes("Email rate limit exceeded")) {
          errorMessage = "Has excedido el límite de intentos. Por favor, espera unos minutos."
        } else if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Email o contraseña incorrectos."
        } else if (error.message.includes("User already registered")) {
          errorMessage = "Este email ya está registrado. Por favor, intenta iniciar sesión."
        } else if (error.message.includes("unique constraint")) {
          errorMessage = "Este email ya está registrado. Por favor, intenta iniciar sesión."
        } else {
          errorMessage += error.message
        }
      }

      setMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      setMessage(error.message || "Error al iniciar sesión con Google")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md bg-muted/50">
        {/* --- Logo Agregado Aquí --- */}
        <div className="flex justify-center pt-8 pb-4">
          {/* Opción 1: Usar una imagen (asegúrate de que la ruta sea correcta y la imagen exista en tu carpeta public) */}
          <img src="/images/Logo.png" alt="Logo EduPlanner" className="h-[300px] w-auto" />
          {/* Opción 2: Usar un ícono como placeholder si no tienes una imagen aún */}
          {/* <GraduationCap className="h-16 w-16 text-primary" /> */}
        </div>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{isSignUp ? "Crear Cuenta" : "Iniciar Sesión"}</CardTitle>
          <CardDescription className="text-center">
            {isSignUp ? "Crea tu cuenta para comenzar" : "Ingresa a tu cuenta para continuar"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Botón de Google mejorado con colores del logo */}
          <Button 
            variant="outline" 
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-medium" 
            onClick={handleGoogleAuth} 
            disabled={isLoading}
          >
            <Mail className="mr-2 h-4 w-4" />
            Continuar con Google
          </Button>



          <div className="flex justify-center text-xs uppercase py-4">
            <span className="text-foreground font-bold">O CONTINÚA CON EMAIL</span>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-secondary/30 border-border/50 focus:bg-secondary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-secondary/30 border-border/50 focus:bg-secondary/50"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-secondary/30"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "Crear Cuenta" : "Iniciar Sesión"}
            </Button>
          </form>

          {message && !isExpiredInvitation(message) && (
            <div
              className={`text-center p-4 rounded-lg border-2 ${message.includes("exitoso") || message.includes("Revisa")
                ? "text-green-700 bg-green-50 border-green-200"
                : "text-red-600 bg-red-50 border-red-200"
                }`}
            >
              <div className="text-sm">{message}</div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <div className="text-center w-full">
            <Button
              variant="link"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setMessage("")
              }}
              disabled={isLoading}
            >
              {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
