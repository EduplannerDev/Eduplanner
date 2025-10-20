"use client"

import { useState, useEffect, ReactNode } from 'react'

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Componente que solo renderiza en el cliente
 * Evita problemas de hidratación SSR/CSR
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
