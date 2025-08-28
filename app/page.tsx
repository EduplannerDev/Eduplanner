"use client"

import { Suspense } from "react"
import { useAuth } from "@/hooks/use-auth"
import LoginForm from "@/components/login-form"
import Dashboard from "@/components/dashboard"
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

  if (loading) {
    return <LoadingFallback />
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      {user ? <Dashboard /> : <LoginForm />}
    </Suspense>
  )
}
