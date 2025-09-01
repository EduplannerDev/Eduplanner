"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { Eye, EyeOff, Loader2, CheckCircle, AlertTriangle } from "lucide-react"

function ResetPasswordFormContent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Verificar si hay una sesión válida para reset de contraseña
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error checking session:', error)
          setIsValidSession(false)
          return
        }

        // Verificar si hay tokens en la URL (desde el email)
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const type = searchParams.get('type')

        if (type === 'recovery' && accessToken && refreshToken) {
          // Establecer la sesión con los tokens del email
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            console.error('Error setting session:', sessionError)
            setIsValidSession(false)
            setMessage({ 
              type: 'error', 
              text: 'El enlace de recuperación es inválido o ha expirado.' 
            })
            return
          }

          setIsValidSession(true)
        } else if (session) {
          setIsValidSession(true)
        } else {
          setIsValidSession(false)
          setMessage({ 
            type: 'error', 
            text: 'No se encontró una sesión válida para restablecer la contraseña.' 
          })
        }
      } catch (error) {
        console.error('Error in checkSession:', error)
        setIsValidSession(false)
        setMessage({ 
          type: 'error', 
          text: 'Error al verificar la sesión. Inténtalo de nuevo.' 
        })
      }
    }

    checkSession()
  }, [searchParams])

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validaciones
    const passwordError = validatePassword(password)
    if (passwordError) {
      setMessage({ type: 'error', text: passwordError })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      setMessage({ 
        type: 'success', 
        text: 'Contraseña actualizada exitosamente. Redirigiendo...' 
      })

      // Redirigir a la página principal después de 2 segundos
      setTimeout(() => {
        router.push('/?message=' + encodeURIComponent('Contraseña actualizada exitosamente'))
      }, 2000)

    } catch (error: any) {
      console.error('Error updating password:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error al actualizar la contraseña. Inténtalo de nuevo.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar loading mientras se verifica la sesión
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md bg-muted/50">
          {/* Logo */}
          <div className="flex justify-center pt-8 pb-4">
            <img src="/images/Logo.png" alt="Logo EduPlanner" className="h-[300px] w-auto" />
          </div>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Verificando enlace...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mostrar error si la sesión no es válida
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md bg-muted/50">
          {/* Logo */}
          <div className="flex justify-center pt-8 pb-4">
            <img src="/images/Logo.png" alt="Logo EduPlanner" className="h-[300px] w-auto" />
          </div>
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Enlace Inválido</CardTitle>
            <CardDescription>
              El enlace de recuperación es inválido o ha expirado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Volver al login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md bg-muted/50">
        {/* Logo */}
        <div className="flex justify-center pt-8 pb-4">
          <img src="/images/Logo.png" alt="Logo EduPlanner" className="h-[300px] w-auto" />
        </div>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Nueva Contraseña</CardTitle>
          <CardDescription className="text-center">
            Ingresa tu nueva contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-secondary/30 border-border/50 focus:bg-secondary/50 pr-10"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repite tu nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-secondary/30 border-border/50 focus:bg-secondary/50 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-secondary/30"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {message && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                {message.type === 'success' && <CheckCircle className="h-4 w-4" />}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    }>
      <ResetPasswordFormContent />
    </Suspense>
  )
}