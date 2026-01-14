"use client"

import { useState } from 'react'
import { Check, ChevronsUpDown, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useContextoTrabajo } from '@/hooks/use-contexto-trabajo'
import { ContextoTrabajoModal } from '@/components/contexto-trabajo-modal'
import { Badge } from '@/components/ui/badge'

export function GradeSwitcher() {
    const { contexto, availableContexts, switchContext, actualizarContexto, loading } = useContextoTrabajo()
    const [showManageModal, setShowManageModal] = useState(false)
    const [isSwitching, setIsSwitching] = useState(false)

    // Helper to format grade name
    const formatGrado = (grado: number) => {
        if (grado < 0) return `${grado + 4}° Preescolar`
        if (grado <= 6) return `${grado}° Primaria`
        return `${grado - 6}° Secundaria`
    }

    // If loading or no context, show placeholder or nothing
    if (loading && !contexto) {
        return (
            <div className="h-10 w-full animate-pulse bg-muted/50 rounded-md" />
        )
    }

    // If no context at all (shouldn't happen on dashboard if onboarding worked), show generic
    if (!contexto) {
        return null
    }

    const handleSwitch = async (id: string) => {
        if (id === contexto.id) return
        setIsSwitching(true)
        await switchContext(id)
        setIsSwitching(false)
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between gap-2 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group"
                    >
                        <div className="flex flex-col items-start text-left text-sm leading-tight">
                            <span className="font-semibold text-foreground/80 group-hover:text-foreground">
                                {formatGrado(contexto.grado)}
                            </span>
                            <span className="text-xs text-muted-foreground">{contexto.ciclo_escolar}</span>
                        </div>
                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]" align="start">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Grados Activos
                    </DropdownMenuLabel>
                    {availableContexts.map((ctx) => (
                        <DropdownMenuItem
                            key={ctx.id}
                            onClick={() => handleSwitch(ctx.id)}
                            className="gap-2 p-2"
                            disabled={isSwitching}
                        >
                            <div className="flex h-6 w-6 items-center justify-center rounded-sm border">
                                {ctx.id === contexto.id ? (
                                    <Check className="h-4 w-4 text-primary" />
                                ) : (
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {formatGrado(ctx.grado).charAt(0)}
                                    </span>
                                )}
                            </div>
                            <span className="flex-1 truncate text-sm">
                                {formatGrado(ctx.grado)}
                            </span>
                            {ctx.id === contexto.id && (
                                <Badge variant="outline" className="text-[10px] h-5 px-1">Actual</Badge>
                            )}
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowManageModal(true)} className="gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-background">
                            <Settings className="h-4 w-4" />
                        </div>
                        <div className="font-medium text-muted-foreground">Gestionar Grados</div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ContextoTrabajoModal
                isOpen={showManageModal}
                onClose={() => setShowManageModal(false)}
                onSuccess={() => {
                    actualizarContexto() // Refresh lists
                    // Modal handles internal closing, but we refresh sidebar state too
                }}
                mode="edit"
            />
        </>
    )
}
