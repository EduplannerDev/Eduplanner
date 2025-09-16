"use client"

import { ReactNode } from 'react'
import { useBetaFeature } from '@/hooks/use-beta-features'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Lock } from 'lucide-react'

interface BetaFeatureWrapperProps {
  featureKey: string
  children: ReactNode
  fallback?: ReactNode
  showBadge?: boolean
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className?: string
}

export function BetaFeatureWrapper({
  featureKey,
  children,
  fallback = null,
  showBadge = true,
  badgePosition = 'top-right',
  className = ''
}: BetaFeatureWrapperProps) {
  const { hasAccess, isBetaTester, loading } = useBetaFeature(featureKey)

  // Mostrar loading state
  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="animate-pulse bg-muted rounded-md h-20 w-full"></div>
      </div>
    )
  }

  // Si no tiene acceso, mostrar fallback o mensaje
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Card className={`relative ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Funcionalidad Beta</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Si tiene acceso, mostrar el contenido con badge opcional
  return (
    <div className={`relative ${className}`}>
      {children}
      {showBadge && (
        <Badge 
          variant="secondary" 
          className={`absolute z-10 flex items-center space-x-1 ${
            badgePosition === 'top-right' ? 'top-2 right-2' :
            badgePosition === 'top-left' ? 'top-2 left-2' :
            badgePosition === 'bottom-right' ? 'bottom-2 right-2' :
            'bottom-2 left-2'
          }`}
        >
          <Sparkles className="h-3 w-3" />
          <span className="text-xs">Beta</span>
        </Badge>
      )}
    </div>
  )
}

// Componente específico para mostrar mensaje de acceso denegado
export function BetaAccessDenied({ 
  featureName, 
  className = '' 
}: { 
  featureName: string
  className?: string 
}) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="text-center space-y-2">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
          <h3 className="font-semibold">Funcionalidad Beta</h3>
          <p className="text-sm text-muted-foreground">
            {featureName} está disponible solo para beta testers seleccionados.
          </p>
          <Badge variant="outline" className="mt-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Beta Feature
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook para usar en componentes que necesitan verificar acceso
export function useBetaAccess(featureKey: string) {
  const { hasAccess, isBetaTester, loading } = useBetaFeature(featureKey)
  
  return {
    hasAccess,
    isBetaTester,
    loading,
    // Helper para mostrar contenido condicionalmente
    renderIfAccess: (content: ReactNode, fallback?: ReactNode) => {
      if (loading) return null
      return hasAccess ? content : (fallback || null)
    }
  }
}
