import { supabase } from './supabase'

export interface MobileNotificationData {
  email: string
  source?: string
  metadata?: Record<string, any>
}

export interface MobileNotificationResponse {
  success: boolean
  message: string
  data?: any
  error?: string
}

/**
 * Guarda un email en la tabla de notificaciones móviles
 * @param data - Datos del email a guardar
 * @returns Promise con el resultado de la operación
 */
export async function saveMobileNotificationEmail(
  data: MobileNotificationData
): Promise<MobileNotificationResponse> {
  try {
    // Validar email
    if (!data.email || !isValidEmail(data.email)) {
      return {
        success: false,
        message: 'Email inválido',
        error: 'INVALID_EMAIL'
      }
    }

    console.log('Attempting to save email:', data.email)

    // Intentar insertar el email
    const { data: result, error } = await supabase
      .from('mobile_notifications')
      .insert({
        email: data.email.toLowerCase().trim(),
        source: data.source || 'mobile_landing',
        metadata: data.metadata || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })

      // Si el error es por duplicado, consideramos éxito
      if (error.code === '23505') { // Unique constraint violation
        return {
          success: true,
          message: 'Email ya registrado anteriormente',
          data: { email: data.email, isDuplicate: true }
        }
      }

      // Si el error es de permisos RLS
      if (error.code === '42501') {
        return {
          success: false,
          message: 'Error de permisos. La tabla no está configurada correctamente.',
          error: 'RLS_PERMISSION_ERROR'
        }
      }

      // Si la tabla no existe
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'La tabla no existe. Ejecuta la migración primero.',
          error: 'TABLE_NOT_EXISTS'
        }
      }

      return {
        success: false,
        message: `Error al guardar el email: ${error.message}`,
        error: error.message
      }
    }

    console.log('Email saved successfully:', result)
    return {
      success: true,
      message: 'Email guardado exitosamente',
      data: result
    }

  } catch (error) {
    console.error('Unexpected error saving mobile notification email:', error)
    return {
      success: false,
      message: 'Error inesperado al guardar el email',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Obtiene estadísticas de emails registrados
 * @returns Promise con estadísticas
 */
export async function getMobileNotificationStats(): Promise<{
  total: number
  active: number
  recent: number
}> {
  try {
    const { data, error } = await supabase
      .from('mobile_notifications')
      .select('is_active, created_at')

    if (error) {
      console.error('Error getting mobile notification stats:', error)
      return { total: 0, active: 0, recent: 0 }
    }

    const total = data.length
    const active = data.filter(item => item.is_active).length
    const recent = data.filter(item => {
      const createdAt = new Date(item.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return createdAt > weekAgo
    }).length

    return { total, active, recent }
  } catch (error) {
    console.error('Unexpected error getting mobile notification stats:', error)
    return { total: 0, active: 0, recent: 0 }
  }
}

/**
 * Valida si un email tiene formato válido
 * @param email - Email a validar
 * @returns true si es válido, false si no
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Obtiene todos los emails registrados (solo para administradores)
 * @returns Promise con lista de emails
 */
export async function getAllMobileNotificationEmails(): Promise<{
  success: boolean
  data?: any[]
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('mobile_notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting all mobile notification emails:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Unexpected error getting all mobile notification emails:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
