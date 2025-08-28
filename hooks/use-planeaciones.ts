"use client"

import { useState, useEffect } from "react"
import type { Planeacion, PlaneacionCreate } from "@/lib/planeaciones"
import {
  getPlaneaciones,
  getPlaneacion,
  createPlaneacion,
  getMonthlyPlaneacionesCount,
  canCreatePlaneacion,
  deletePlaneacion,
  updatePlaneacion,
} from "@/lib/planeaciones"
import { useAuth } from "./use-auth"
import { useProfile } from "./use-profile"
import { canUserCreate, getUserLimits } from "@/lib/subscription-utils"

export function usePlaneaciones() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [planeaciones, setPlaneaciones] = useState<Planeacion[]>([])
  const [monthlyCount, setMonthlyCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10) // Puedes ajustar el tamaño de página
  const [totalPlaneaciones, setTotalPlaneaciones] = useState(0)
  const totalPages = Math.ceil(totalPlaneaciones / pageSize)

  // Cargar planeaciones cuando el usuario cambie o la página/tamaño de página cambie
  useEffect(() => {
    if (user?.id) {
      loadPlaneaciones()
      loadMonthlyCount()
    } else {
      setPlaneaciones([])
      setMonthlyCount(0)
      setLoading(false)
    }
  }, [user?.id, currentPage, pageSize])

  const loadPlaneaciones = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // Modificar getPlaneaciones para que acepte paginación y devuelva el total
      const { data, count } = await getPlaneaciones(user.id, currentPage, pageSize)
      setPlaneaciones(data)
      setTotalPlaneaciones(count)
    } catch (error) {
      console.error("Error loading planeaciones:", error)
      setError("Error al cargar las planeaciones")
    } finally {
      setLoading(false)
    }
  }

  const loadMonthlyCount = async () => {
    if (!user?.id) return

    try {
      const count = await getMonthlyPlaneacionesCount(user.id)
      setMonthlyCount(count)
    } catch (error) {
      console.error("Error loading monthly count:", error)
    }
  }

  const createNewPlaneacion = async (planeacionData: PlaneacionCreate): Promise<Planeacion | null> => {
    if (!user?.id || !profile) {
      setError("Usuario no autenticado")
      return null
    }

    // Verificar límites usando las nuevas funciones
    const { canCreate, currentCount, limit } = await canUserCreate(user.id, 'planeaciones')
    if (!canCreate) {
      const limitText = limit === -1 ? 'ilimitadas' : limit.toString()
      setError(`Has alcanzado el límite de planeaciones (${currentCount}/${limitText}). Actualiza a PRO para crear ilimitadas.`)
      return null
    }

    setCreating(true)
    setError(null)

    try {
      const newPlaneacion = await createPlaneacion(user.id, planeacionData)
      if (newPlaneacion) {
        setPlaneaciones((prev) => [newPlaneacion, ...prev])
        setMonthlyCount((prev) => prev + 1)
        return newPlaneacion
      } else {
        setError("Error al crear la planeación")
        return null
      }
    } catch (error) {
      console.error("Error creating planeacion:", error)
      setError("Error al crear la planeación")
      return null
    } finally {
      setCreating(false)
    }
  }

  const updateExistingPlaneacion = async (
    planeacionId: string,
    updates: Partial<PlaneacionCreate>,
  ): Promise<boolean> => {
    setError(null)

    try {
      const success = await updatePlaneacion(planeacionId, updates)
      if (success) {
        setPlaneaciones((prev) =>
          prev.map((p) =>
            p.id === planeacionId
              ? {
                  ...p,
                  ...updates,
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        )
        return true
      } else {
        setError("Error al actualizar la planeación")
        return false
      }
    } catch (error) {
      console.error("Error updating planeacion:", error)
      setError("Error al actualizar la planeación")
      return false
    }
  }

  const deleteExistingPlaneacion = async (planeacionId: string): Promise<boolean> => {
    setError(null)
    try {
      const success = await deletePlaneacion(planeacionId)
      if (success) {
        // Recalcular totalPlaneaciones y ajustar currentPage si es necesario
        const newTotalPlaneaciones = totalPlaneaciones - 1;
        const newTotalPages = Math.ceil(newTotalPlaneaciones / pageSize);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        } else if (newTotalPages === 0) {
          setCurrentPage(1); // Si no hay planeaciones, volver a la página 1
        }
        setTotalPlaneaciones(newTotalPlaneaciones);
        setPlaneaciones((prev) => prev.filter((p) => p.id !== planeacionId));
        loadPlaneaciones(); // Recargar planeaciones para asegurar la consistencia
        return true
      } else {
        setError("Error al eliminar la planeación")
        return false
      }
    } catch (error) {
      console.error("Error deleting planeacion:", error)
      setError("Error al eliminar la planeación")
      return false
    }
  }

  const getPlaneacionById = async (planeacionId: string): Promise<Planeacion | null> => {
    try {
      return await getPlaneacion(planeacionId)
    } catch (error) {
      console.error("Error getting planeacion:", error)
      return null
    }
  }

  const canCreateMore = async (): Promise<boolean> => {
    if (!user?.id || !profile) return false
    const { canCreate } = await canUserCreate(user.id, 'planeaciones')
    return canCreate
  }

  const getRemainingPlaneaciones = (): number => {
    if (!profile) return 0
    const limits = getUserLimits(profile)
    if (limits.planeaciones_limit === -1) return -1 // Ilimitadas
    return Math.max(0, limits.planeaciones_limit - monthlyCount)
  }

  const setPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages > 0 ? totalPages : 1));
    setCurrentPage(newPage);
  };

  return {
    planeaciones,
    monthlyCount,
    loading,
    creating,
    error,
    createPlaneacion: createNewPlaneacion,
    updatePlaneacion: updateExistingPlaneacion,
    deletePlaneacion: deleteExistingPlaneacion,
    getPlaneacion: getPlaneacionById,
    refreshPlaneaciones: loadPlaneaciones,
    canCreateMore,
    getRemainingPlaneaciones,
    // Nuevas propiedades de paginación
    currentPage,
    pageSize,
    totalPlaneaciones,
    totalPages,
    setPage,
  }
}
