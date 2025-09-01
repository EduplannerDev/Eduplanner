"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function WelcomeMessage() {
  const searchParams = useSearchParams()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const welcomeMessage = searchParams.get('welcome')
    const successMessage = searchParams.get('message')
    const errorMessage = searchParams.get('error')

    if (welcomeMessage) {
      setMessage(decodeURIComponent(welcomeMessage))
      setIsVisible(true)
      
      // Auto-ocultar después de 10 segundos
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 10000)

      return () => clearTimeout(timer)
    }

    if (successMessage) {
      setMessage(decodeURIComponent(successMessage))
      setIsVisible(true)
      
      // Auto-ocultar después de 10 segundos
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 10000)

      return () => clearTimeout(timer)
    }

    if (errorMessage) {
      setError(decodeURIComponent(errorMessage))
      setIsVisible(true)
    }
  }, [searchParams])

  const handleDismiss = () => {
    setIsVisible(false)
    setMessage(null)
    setError(null)
    
    // Limpiar los parámetros de la URL
    const url = new URL(window.location.href)
    url.searchParams.delete('welcome')
    url.searchParams.delete('message')
    url.searchParams.delete('error')
    window.history.replaceState({}, '', url.toString())
  }

  if (!isVisible || (!message && !error)) {
    return null
  }

  return (
    <div className="mb-6">
      {message && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{message}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-auto p-1 text-green-600 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-auto p-1 text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}