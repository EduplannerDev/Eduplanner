"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'

interface ContextoTrabajoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ContextoTrabajoModal({ isOpen, onClose, onSuccess }: ContextoTrabajoModalProps) {
  const { user } = useAuth()
  const [gradoSeleccionado, setGradoSeleccionado] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [cicloEscolar, setCicloEscolar] = useState<string>("")

  // Calcular ciclo escolar actual
  useEffect(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-11
    
    // Si estamos en agosto (7) o después, el ciclo inicia este año
    // Si estamos antes de agosto, el ciclo inició el año pasado
    const startYear = currentMonth >= 7 ? currentYear : currentYear - 1
    const endYear = startYear + 1
    
    setCicloEscolar(`${startYear}-${endYear}`)
  }, [])

  // Resetear el estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setGradoSeleccionado("")
    }
  }, [isOpen])

  const guardarConfiguracion = async () => {
    if (!user?.id || !gradoSeleccionado) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .rpc('set_contexto_trabajo', {
          profesor_id_param: user.id,
          grado_param: parseInt(gradoSeleccionado),
          ciclo_escolar_param: cicloEscolar
        })

      if (error) {
        console.error('Error guardando configuración:', error)
        toast.error('Error al guardar la configuración. Por favor intenta de nuevo.')
        return
      }

      // Cerrar modal y notificar éxito
      toast.success('¡Configuración guardada correctamente!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Ocurrió un error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-center">
            ¡EduPlanner se actualiza!
          </DialogTitle>
          <DialogDescription className="text-center">
            Ahora somos compatibles con Preescolar, Primaria y Secundaria. Para personalizar tu experiencia, ¿en qué nivel impartes clases?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Grado Escolar
            </label>
            <Select value={gradoSeleccionado} onValueChange={setGradoSeleccionado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el grado" />
              </SelectTrigger>
              <SelectContent>
                {/* Separador visual */}
                <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                  Preescolar
                </div>

                {/* Grados de Preescolar */}
                <SelectItem value="-3">1° Grado</SelectItem>
                <SelectItem value="-2">2° Grado</SelectItem>
                <SelectItem value="-1">3° Grado</SelectItem>

                {/* Separador visual */}
                <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                  Primaria
                </div>

                {/* Grados de Primaria */}
                {[1, 2, 3, 4, 5, 6].map((grado) => (
                  <SelectItem key={grado} value={grado.toString()}>
                    {grado}° Grado
                  </SelectItem>
                ))}

                {/* Separador visual */}
                <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                  Secundaria
                </div>

                {/* Grados de Secundaria */}
                {[7, 8, 9].map((grado) => {
                  const gradoDisplay = grado - 6; // Convertir 7,8,9 a 1,2,3
                  return (
                    <SelectItem key={grado} value={grado.toString()}>
                      {gradoDisplay}° Grado
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Ciclo escolar:</strong> {cicloEscolar}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={guardarConfiguracion}
              disabled={!gradoSeleccionado || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Continuar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
