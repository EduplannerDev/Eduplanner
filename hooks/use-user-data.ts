import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  full_name: string | null
  avatar_url: string | null
  role: string | null
  plantel_id: string | null
  city: string | null
  state: string | null
  school: string | null
  grade: string | null
}

export function useUserData(userId: string | undefined) {
  const [userData, setUserData] = useState<UserProfile>({
    full_name: null,
    avatar_url: null,
    role: null,
    plantel_id: null,
    city: null,
    state: null,
    school: null,
    grade: null
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUserData() {
      if (!userId) {
        setUserData({
          full_name: null,
          avatar_url: null,
          role: null,
          plantel_id: null,
          city: null,
          state: null,
          school: null,
          grade: null
        })
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, role, plantel_id, city, state, school, grade')
          .eq('id', userId)
          .single()

        if (error) {
          // Solo mostrar error si es un error real con mensaje válido
          if (error.message && error.message.trim() !== '' && error.message !== 'No rows found') {
            console.error('Error fetching user data:', error)
          }
          return
        }

        setUserData(data || {
          full_name: null,
          avatar_url: null,
          role: null,
          plantel_id: null,
          city: null,
          state: null,
          school: null,
          grade: null
        })
      } catch (error) {
        // Solo mostrar errores inesperados, no los relacionados con autenticación
        if (userId) {
          console.error('Error in useUserData:', error)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  return { userData, isLoading }
}
