import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useUserData(userId: string | undefined) {
  const [userData, setUserData] = useState<{ full_name: string | null, avatar_url: string | null }>({ full_name: null, avatar_url: null })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUserData() {
      if (!userId) {
        setUserData({ full_name: null, avatar_url: null })
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', userId)
          .single()

        if (error) {
          // Solo mostrar error si es un error real con mensaje válido
          if (error.message && error.message.trim() !== '' && error.message !== 'No rows found') {
            console.error('Error fetching user data:', error)
          }
          return
        }

        setUserData(data || { full_name: null, avatar_url: null })
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
