"use client"

import { useState } from 'react'
import { ChevronsUpDown, Plus, Settings } from 'lucide-react'
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
                        variant="outline"
                        className="w-full justify-between gap-2 px-3 h-14 border-primary/20 bg-background/50 hover:bg-accent hover:text-accent-foreground shadow-sm group"
                    >
                        <div className="flex flex-col items-start text-left leading-tight">
                            <span className="font-bold text-base text-primary">
                                {formatGrado(contexto.grado)}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-accent-foreground/80">{contexto.ciclo_escolar}</span>
                        </div>
                        <ChevronsUpDown className="ml-auto h-5 w-5 shrink-0 opacity-50 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    align="start"
                    sideOffset={4}
                >
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                        Grados Activos
                    </DropdownMenuLabel>
                    {availableContexts.map((ctx) => (
                        <DropdownMenuItem
                            key={ctx.id}
                            onClick={() => handleSwitch(ctx.id)}
                            className={`p-3 cursor-pointer mb-1 rounded-md ${ctx.id === contexto.id
                                ? "bg-accent text-accent-foreground border-l-4 border-primary"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                }`}
                            disabled={isSwitching}
                        >
                            <div className="flex flex-col gap-1 w-full text-left">
                                <span className={`text-sm leading-none ${ctx.id === contexto.id ? "font-bold" : "font-medium"}`}>
                                    {formatGrado(ctx.grado)}
                                </span>
                                <span className="text-xs opacity-80">
                                    {ctx.ciclo_escolar}
                                </span>
                            </div>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowManageModal(true)} className="flex items-center gap-2 p-3 cursor-pointer text-muted-foreground hover:text-foreground">
                        <Plus className="h-4 w-4" />
                        <span className="text-sm font-medium">Gestionar Grados</span>
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
