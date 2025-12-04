"use client"

import { useEffect } from 'react'
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { useRoles } from '@/hooks/use-roles'

export function TourGuide() {
    const { role } = useRoles()

    useEffect(() => {
        // Solo mostrar el tour si no se ha visto antes
        // const tourSeen = localStorage.getItem('tour_seen_v1')

        // if (!tourSeen) {
        // Pequeño retraso para asegurar que la UI esté lista
        const timer = setTimeout(() => {
            startTour()
        }, 1500)

        return () => clearTimeout(timer)
        // }
    }, [])

    const startTour = () => {
        const driverObj = driver({
            popoverClass: 'driverjs-theme',
            showProgress: true,
            animate: true,
            allowClose: true,
            doneBtnText: "¡Entendido!",
            nextBtnText: "Siguiente",
            prevBtnText: "Anterior",
            progressText: "Paso {{current}} de {{total}}",
            steps: [
                {
                    element: '#welcome-message',
                    popover: {
                        title: '¡Bienvenido a EduPlanner!',
                        description: 'Este es tu panel de control principal. Aquí encontrarás un resumen de tu actividad y accesos rápidos.',
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#sidebar-menu',
                    popover: {
                        title: 'Navegación Principal',
                        description: 'Desde aquí puedes acceder a todas las herramientas: Planeaciones, Exámenes, Grupos y más.',
                        side: "right",
                        align: 'start'
                    }
                },
                {
                    element: '#quick-actions',
                    popover: {
                        title: 'Acciones Rápidas',
                        description: 'Crea nuevas planeaciones, exámenes o gestiona tus grupos con un solo clic.',
                        side: "top",
                        align: 'start'
                    }
                },
                {
                    element: '#recent-activity',
                    popover: {
                        title: 'Actividad Reciente',
                        description: 'Mantén un registro de tus últimas creaciones y modificaciones.',
                        side: "top",
                        align: 'start'
                    }
                },
                {
                    element: '#help-section',
                    popover: {
                        title: '¿Necesitas Ayuda?',
                        description: 'Si tienes dudas, visita la sección de Ayuda para encontrar tutoriales y soporte.',
                        side: "top",
                        align: 'start'
                    }
                }
            ],
            onDestroyed: () => {
                // Marcar el tour como visto cuando se cierra o termina
                localStorage.setItem('tour_seen_v1', 'true')
            }
        })

        driverObj.drive()
    }

    return null // Este componente no renderiza nada visualmente por sí mismo
}
