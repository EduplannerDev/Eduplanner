'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, Mail, Lock, Building2, UserCheck, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useInvitationSetup } from '@/hooks/use-invitation-setup'

interface InvitationSetupProps {
  userEmail?: string
  plantelName?: string
  role?: string
  onComplete?: () => void
}

export function InvitationSetup({ 
  userEmail: propUserEmail, 
  plantelName: propPlantelName, 
  role: propRole, 
  onComplete 
}: InvitationSetupProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Usar el hook personalizado si no se proporcionan props
  const {
    invitationInfo,
    isLoading: hookLoading,
    error: hookError,
    updatePassword,
    signInWithGoogle
  } = useInvitationSetup()

  // Usar props si están disponibles, sino usar datos del hook
  const userEmail = propUserEmail || invitationInfo?.email || ''
  const plantelName = propPlantelName || invitationInfo?.plantelName
  const role = propRole || invitationInfo?.role

  // Mostrar loading si el hook está cargando
  if (hookLoading && !propUserEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando invitación...</p>
        </div>
      </div>
    )
  }

  // Mostrar error si el hook tiene error
  if (hookError && !propUserEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{hookError}</p>
          <button 
            onClick={() => router.push('/login')}
            className="text-blue-600 hover:underline"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setIsLoading(true)

    try {
      const result = await updatePassword(password)

      if (!result.success) {
        setError(result.error || 'Error al configurar la contraseña')
        return
      }

      // Redirigir al dashboard después de configurar la contraseña
      router.push('/dashboard?welcome=' + encodeURIComponent('¡Bienvenido! Tu cuenta ha sido configurada correctamente.'))
      onComplete?.()
    } catch (error) {
      setError('Error inesperado. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signInWithGoogle()

      if (!result.success) {
        setError(result.error || 'Error al conectar con Google')
        setIsLoading(false)
      }
      // Si es exitoso, la redirección se maneja automáticamente
    } catch (error) {
      setError('Error al conectar con Google')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center pb-4">
            <img src="/images/Logo.png" alt="Logo EduPlanner" className="h-[120px] w-auto opacity-90" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            ¡Bienvenido a EduPlanner!
          </CardTitle>
          <CardDescription className="text-gray-600">
            Configura tu cuenta para comenzar
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Información de la invitación */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Mail className="w-4 h-4" />
              <span className="font-medium">{userEmail}</span>
            </div>
            {plantelName && (
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Building2 className="w-4 h-4" />
                <span>{plantelName}</span>
              </div>
            )}
            {role && (
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <UserCheck className="w-4 h-4" />
                <span className="capitalize">{role}</span>
              </div>
            )}
          </div>

          {/* Opción 1: Configurar contraseña */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Opción 1: Crear contraseña</h3>
            <form onSubmit={handlePasswordSetup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !password || !confirmPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  'Configurar contraseña'
                )}
              </Button>
            </form>
          </div>

          {/* Separador */}
          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white px-2 text-sm text-gray-500">o</span>
            </div>
          </div>

          {/* Opción 2: Continuar con Google */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Opción 2: Continuar con Google</h3>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuar con Google
                </>
              )}
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}