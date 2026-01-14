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
  DialogFooter,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, GraduationCap, Plus, Check, Trash2, ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useContextoTrabajo } from '@/hooks/use-contexto-trabajo'
import { useProfile } from '@/hooks/use-profile'
import { Badge } from '@/components/ui/badge'

interface ContextoTrabajoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mode?: 'onboarding' | 'edit'
}

export function ContextoTrabajoModal({ isOpen, onClose, onSuccess, mode = 'onboarding' }: ContextoTrabajoModalProps) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { availableContexts, switchContext, deactivateContext, actualizarContexto } = useContextoTrabajo()
  const [gradoSeleccionado, setGradoSeleccionado] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [cicloEscolar, setCicloEscolar] = useState<string>("")
  const [view, setView] = useState<'list' | 'add'>('list') // 'list' shows active grades, 'add' shows form

  // Determine limits based on plan
  const isPro = profile?.subscription_plan === 'pro'
  const maxGrades = isPro ? 3 : 1
  const currentGradesCount = availableContexts?.length || 0
  const canAddMore = currentGradesCount < maxGrades

  // Initial view state logic
  useEffect(() => {
    if (isOpen) {
      // Logic adjusted: 
      // 1. If user has NO contexts (Brand new user), go to 'add'.
      // 2. If user has contexts (Existing Free or Pro), show 'list' (Manager).
      //    This allows Pro users to see they have slots available, and Free users to see their single grade.
      if (currentGradesCount === 0) {
        setView('add')
      } else {
        setView('list')
      }
      setGradoSeleccionado("")
    }
  }, [isOpen, currentGradesCount])

  // Calculate generic school cycle
  useEffect(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-11
    const startYear = currentMonth >= 7 ? currentYear : currentYear - 1
    const endYear = startYear + 1
    setCicloEscolar(`${startYear}-${endYear}`)
  }, [])

  const formatGrado = (grado: number) => {
    if (grado < 0) return `${grado + 4}° Preescolar`
    if (grado <= 6) return `${grado}° Primaria`
    return `${grado - 6}° Secundaria`
  }

  const handleSwitch = async (id: string) => {
    setLoading(true)
    const success = await switchContext(id)
    if (success) {
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este grado?')) {
      setLoading(true)
      await deactivateContext(id)
      setLoading(false)
    }
  }

  const guardarConfiguracion = async () => {
    if (!user?.id || !gradoSeleccionado) return

    // If Free user tries to add a second one, we should guide them
    if (!isPro && currentGradesCount >= 1 && view === 'add') {
      // If onboarding (shouldn't happen if logic is correct) or edit, asking to replace is fair.
      // But if user is just switching, it's better to auto-replace or offer a cleaner UI.
      const confirmReplace = confirm("Tu plan gratuito solo permite 1 grado activo. Al guardar, se reemplazará tu grado actual. ¿Deseas continuar?")
      if (!confirmReplace) return
    }

    try {
      setLoading(true)
      // Call RPC directly or creating a hook function wrapper? 
      // Using direct RPC here for 'set_contexto_trabajo' as it was before, 
      // but 'set_contexto_trabajo' handles the logic now.

      const { data, error } = await supabase
        .rpc('set_contexto_trabajo', {
          profesor_id_param: user.id,
          grado_param: parseInt(gradoSeleccionado),
          ciclo_escolar_param: cicloEscolar
        })

      if (error) {
        throw error
      }

      toast.success(mode === 'edit' ? 'Grado guardado correctamente' : '¡Configuración guardada!')
      actualizarContexto() // Refresh global state
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al guardar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-center">
            {mode === 'onboarding'
              ? '¡EduPlanner se actualiza!'
              : (view === 'add' ? 'Agregar Nuevo Grado' : 'Mis Grados Activos')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === 'onboarding'
              ? (isPro
                ? 'Como usuario PRO, puedes configurar hasta 3 grados activos. Comencemos seleccionando el primero.'
                : 'Ahora somos compatibles con Preescolar, Primaria y Secundaria. Para personalizar tu experiencia, ¿en qué nivel impartes clases?')
              : (view === 'add'
                ? 'Selecciona el grado y nivel educativo con el que trabajarás.'
                : `Tienes ${currentGradesCount} de ${maxGrades} grados activos permitidos.`
              )
            }
          </DialogDescription>
        </DialogHeader>

        {view === 'list' && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-2">
              {availableContexts.map((ctx) => (
                <div
                  key={ctx.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${ctx.selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-800'}`}
                >
                  <div className="flex items-center gap-3">
                    {ctx.selected && <Check className="h-4 w-4 text-blue-600" />}
                    <span className={`font-medium ${ctx.selected ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                      {formatGrado(ctx.grado)}
                    </span>
                    {ctx.selected && <Badge variant="secondary" className="text-xs">Activo</Badge>}
                  </div>
                  <div className="flex gap-1">
                    {!ctx.selected && (
                      <Button variant="ghost" size="icon" onClick={() => handleSwitch(ctx.id)} title="Cambiar a este grado">
                        <ArrowRightLeft className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(ctx.id)} title="Eliminar grado">
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {canAddMore ? (
              <Button
                onClick={() => setView('add')}
                className="w-full" variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" /> Agregar otro grado
              </Button>
            ) : (
              !isPro && (
                <div className="text-xs text-center text-muted-foreground bg-gray-50 p-2 rounded">
                  <p>El plan Gratuito permite solo 1 grado activo.</p>
                  <Button variant="link" className="h-auto p-0 text-blue-600">Pásate a PRO para tener hasta 3.</Button>
                </div>
              )
            )}
            <div className="flex justify-center mt-4">
              <Button variant="ghost" onClick={onClose}>Cerrar</Button>
            </div>
          </div>
        )}

        {view === 'add' && (
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Grado Escolar
              </label>
              <Select value={gradoSeleccionado} onValueChange={setGradoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el grado" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs text-muted-foreground font-medium">Preescolar</div>
                  <SelectItem value="-3">1° Grado</SelectItem>
                  <SelectItem value="-2">2° Grado</SelectItem>
                  <SelectItem value="-1">3° Grado</SelectItem>
                  <div className="px-2 py-1 text-xs text-muted-foreground font-medium">Primaria</div>
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <SelectItem key={g} value={g.toString()}>{g}° Grado</SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs text-muted-foreground font-medium">Secundaria</div>
                  {[7, 8, 9].map((g) => (
                    <SelectItem key={g} value={g.toString()}>{g - 6}° Grado</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-200">
              <strong>Ciclo escolar:</strong> {cicloEscolar}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {currentGradesCount > 0 && (
                <Button variant="ghost" onClick={() => setView('list')} disabled={loading}>
                  Cancelar
                </Button>
              )}
              <Button onClick={guardarConfiguracion} disabled={!gradoSeleccionado || loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Guardar Grado'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

