"use client"

import { Suspense, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useIsMobile } from "@/hooks/use-mobile"
import LoginForm from "@/components/login-form"
import Dashboard from "@/components/dashboard"
import { MobileLanding } from "@/components/mobile-landing"
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

  if (loading) {
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

  return (
    <Suspense fallback={<LoadingFallback />}>
      {user ? <Dashboard /> : <LoginForm />}
    </Suspense>
  )
}
