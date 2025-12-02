"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Smartphone, AlertTriangle } from "lucide-react"

export function MobileWarning() {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            // Verificar si es móvil (menor a 768px)
            const isMobile = window.innerWidth < 768
            // Verificar si ya vio la advertencia en esta sesión
            const hasSeenWarning = sessionStorage.getItem("mobile-warning-seen")

            if (isMobile && !hasSeenWarning) {
                setOpen(true)
            }
        }

        // Verificar al montar
        checkMobile()

        // Verificar al cambiar tamaño de ventana
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleAccept = () => {
        sessionStorage.setItem("mobile-warning-seen", "true")
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleAccept()}>
            <DialogContent
                className="w-[90vw] max-w-md rounded-xl [&>button]:hidden"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="flex flex-col items-center gap-2">
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-full mb-2">
                        <Smartphone className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold">
                        Experiencia Móvil
                    </DialogTitle>
                    <DialogDescription className="text-center text-base pt-2 text-gray-600 dark:text-gray-300">
                        Eduplanner está diseñado para ser utilizado en computadoras de escritorio.
                        <br /><br />
                        Puedes continuar en tu dispositivo móvil, pero es posible que algunos elementos no se visualicen de forma óptima.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-6 w-full">
                    <Button
                        onClick={handleAccept}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6 h-auto rounded-xl shadow-lg transition-all active:scale-95"
                    >
                        Entendido, continuar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
