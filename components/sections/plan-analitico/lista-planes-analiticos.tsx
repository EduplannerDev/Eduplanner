"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen, Calendar, Users, Eye, Trash2 } from 'lucide-react'
import { usePlanAnalitico } from '@/hooks/use-plan-analitico'
import { Badge } from '@/components/ui/badge'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'

import { VerPlanAnalitico } from './ver-plan-analitico'

interface ListaPlanesAnaliticosProps {
    onCreateNew: () => void
}

export function ListaPlanesAnaliticos({ onCreateNew }: ListaPlanesAnaliticosProps) {
    const { obtenerPlanesAnaliticos, eliminarPlanAnalitico, loading } = usePlanAnalitico()
    const [planes, setPlanes] = useState<any[]>([])
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        loadPlanes()
    }, [])

    const loadPlanes = async () => {
        const data = await obtenerPlanesAnaliticos()
        if (data) setPlanes(data)
    }

    const handleDeletePlan = async (planId: string) => {
        const success = await eliminarPlanAnalitico(planId)
        if (success) {
            toast({
                title: "Plan eliminado",
                description: "El plan analítico se ha eliminado correctamente.",
            })
            loadPlanes()
        } else {
            toast({
                title: "Error",
                description: "No se pudo eliminar el plan analítico.",
                variant: "destructive"
            })
        }
    }

    if (selectedPlanId) {
        return <VerPlanAnalitico planId={selectedPlanId} onBack={() => setSelectedPlanId(null)} />
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Plan Analítico</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                        Gestiona tus diagnósticos y contextualizaciones
                    </p>
                </div>
                <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Plan Analítico
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando planes...</p>
                </div>
            ) : planes.length === 0 ? (
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center py-12">
                            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                No tienes planes analíticos aún
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Comienza creando tu primer diagnóstico y contextualización.
                            </p>
                            <Button onClick={onCreateNew}>
                                Crear Primer Plan
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {planes.map((plan) => (
                        <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg line-clamp-2">
                                        Plan Analítico - {plan.grupos?.nombre}
                                    </CardTitle>
                                    <Badge variant="outline" className="text-xs">
                                        {plan.ciclo_escolar || '2024-2025'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <Users className="h-4 w-4 mr-2" />
                                    <span>{plan.grupos?.grado}° {plan.grupos?.nivel}</span>
                                </div>

                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    <span>
                                        {new Date(plan.created_at).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>

                                <div className="pt-2 border-t dark:border-gray-700">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                                        {plan.diagnostico_generado || "Sin diagnóstico generado"}
                                    </p>
                                </div>

                                <div className="flex space-x-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => setSelectedPlanId(plan.id)}
                                    >
                                        <Eye className="mr-2 h-3 w-3" />
                                        Ver Detalles
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Eliminar Plan Analítico?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Se eliminará el diagnóstico, las problemáticas y toda la información asociada.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDeletePlan(plan.id)}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Eliminar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
