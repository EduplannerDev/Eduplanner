"use client"

import { useState } from 'react'
import { GestionarPlanteles } from './gestionar-planteles'
import { VistaPlantel } from './vista-plantel'

type ViewMode = 'list' | 'detail'

export function AdministracionPlanteles() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedPlantelId, setSelectedPlantelId] = useState<string | null>(null)

  const handleViewPlantel = (plantelId: string) => {
    setSelectedPlantelId(plantelId)
    setViewMode('detail')
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedPlantelId(null)
  }

  if (viewMode === 'detail' && selectedPlantelId) {
    return (
      <VistaPlantel 
        plantelId={selectedPlantelId} 
        onBack={handleBackToList}
      />
    )
  }

  return (
    <GestionarPlanteles onViewPlantel={handleViewPlantel} />
  )
}