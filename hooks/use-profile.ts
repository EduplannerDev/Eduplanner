"use client"

import { useState, useEffect } from "react"
import type { Profile, ProfileUpdate } from "@/lib/profile"
import { getOrCreateProfile, updateProfile } from "@/lib/profile"
import { useAuth } from "./use-auth"

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar perfil cuando el usuario cambie
  useEffect(() => {
    if (user?.id) {
      loadProfile()
    } else {
      setProfile(null)
      setLoading(false)
      setError(null)
    }
  }, [user?.id])

  const loadProfile = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const profileData = await getOrCreateProfile(user.id)

      if (profileData) {
        setProfile(profileData)
      } else {
        setError("No se pudo cargar o crear el perfil")
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      setError("Error al cargar el perfil")
    } finally {
      setLoading(false)
    }
  }

  const updateUserProfile = async (updates: ProfileUpdate): Promise<boolean> => {
    if (!user?.id) {
      setError("Usuario no autenticado")
      return false
    }

    setUpdating(true)
    setError(null)

    try {
      const success = await updateProfile(user.id, updates)
      if (success) {
        // Actualizar el estado local
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                ...updates,
                updated_at: new Date().toISOString(),
              }
            : null,
        )
        return true
      } else {
        setError("Error al actualizar el perfil")
        return false
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Error al actualizar el perfil")
      return false
    } finally {
      setUpdating(false)
    }
  }

  return {
    profile,
    loading,
    updating,
    error,
    updateProfile: updateUserProfile,
    refreshProfile: loadProfile,
  }
}
