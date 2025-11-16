"use client"

import { Suspense, useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useIsMobile } from "@/hooks/use-mobile"
import { useContextoTrabajo } from "@/hooks/use-contexto-trabajo"
import LoginForm from "@/components/login-form"
import Dashboard from "@/components/dashboard"
import { MobileLanding } from "@/components/mobile-landing"
import { ContextoTrabajoModal } from "@/components/contexto-trabajo-modal"
import { Loader2 } from "lucide-react"

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}

export default function Home() {
  const { user, loading } = useAuth()
  const isMobile = useIsMobile()
  const [showMobileLanding, setShowMobileLanding] = useState(true)
  const { hasContexto, loading: loadingContexto, actualizarContexto } = useContextoTrabajo()
  const [showContextoModal, setShowContextoModal] = useState(false)

  // Verificar si necesita mostrar el modal de contexto de trabajo
  useEffect(() => {
    console.log('🔍 [DEBUG] Verificando modal:', { 
      user: !!user, 
      userId: user?.id,
      loadingContexto, 
      hasContexto
    })
    
    // Solo mostrar modal si el usuario está cargado, no está cargando contexto, y NO tiene contexto
    if (user && !loadingContexto && hasContexto === false) {
      console.log('🚨 [DEBUG] Mostrando modal de contexto - usuario no tiene contexto')
      setShowContextoModal(true)
    } else if (user && !loadingContexto && hasContexto === true) {
      console.log('✅ [DEBUG] Usuario ya tiene contexto, NO se muestra modal')
      setShowContextoModal(false)
    }
  }, [user, loadingContexto, hasContexto])

  if (loading || loadingContexto) {
    return <LoadingFallback />
  }

  // Mostrar landing móvil si estamos en móvil y no se ha elegido continuar
  if (isMobile && showMobileLanding && !user) {
    return (
      <MobileLanding 
        onContinueToDesktop={() => setShowMobileLanding(false)} 
      />
    )
  }

  const handleContextoSuccess = () => {
    actualizarContexto()
    setShowContextoModal(false)
  }

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        {user ? <Dashboard /> : <LoginForm />}
      </Suspense>
      <ContextoTrabajoModal 
        isOpen={showContextoModal} 
        onClose={() => setShowContextoModal(false)}
        onSuccess={handleContextoSuccess}
      />
    </>
  )
}
