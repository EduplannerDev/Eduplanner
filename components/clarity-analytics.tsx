'use client'

import { useEffect } from 'react'
import clarity from '@microsoft/clarity'

export default function ClarityAnalytics() {
  useEffect(() => {
    // Solo inicializar Clarity en producción
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID) {
      clarity.init(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID)
    }
  }, [])

  return null
}