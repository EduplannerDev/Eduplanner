'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { InvitationSetup } from '@/components/invitation-setup'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

function InvitationSetupContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<{
    email: string
    plantelName?: string
    role?: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkInvitationData = async () => {
      try {
        // Obtener información de invitación desde la API (cookies httpOnly)
        const response = await fetch('/api/invitation')
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/?error=' + encodeURIComponent('No se encontraron datos de invitación. Solicita un nuevo enlace.'))
          } else {
            setError('Error al obtener información de invitación')
          }
          return
        }
        
        const invitationData = await response.json()

        // Verificar si ya hay un usuario autenticado (no debería haberlo en este punto)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          router.push('/')
          return
        }

        setUserInfo({
          email: invitationData.email,
          plantelName: invitationData.plantelName || undefined,
          role: undefined // Se puede extraer del token si es necesario
        })
      } catch (error) {
        console.error('Error checking invitation data:', error)
        setError('Error al verificar los datos de invitación')
      } finally {
        setIsLoading(false)
      }
    }

    checkInvitationData()
  }, [router, searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando invitación...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="text-blue-600 hover:underline"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No se encontró información de invitación</p>
          <button 
            onClick={() => router.push('/')}
            className="text-blue-600 hover:underline"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <InvitationSetup
      userEmail={userInfo.email}
      plantelName={userInfo.plantelName}
      role={userInfo.role}
      onComplete={() => {
        // Opcional: callback cuando se complete la configuración
      }}
    />
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Cargando configuración de invitación...</p>
      </div>
    </div>
  )
}

export default function InvitationSetupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <InvitationSetupContent />
    </Suspense>
  )
}