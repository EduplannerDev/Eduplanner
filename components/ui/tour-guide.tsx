"use client"

import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { markTourAsSeen } from "@/lib/tour-guide"

export function useTourGuide() {
    const startTour = async () => {
        // Marcar el tour como visto inmediatamente al iniciarlo en la base de datos
        try {
            await markTourAsSeen()
        } catch (error) {
            console.error('Error marcando tour como visto:', error)
        }

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
                    element: '#dashboard-metrics',
                    popover: {
                        title: 'Tus Estadísticas',
                        description: 'Visualiza rápidamente tus planeaciones, exámenes, grupos y mensajes.',
                        side: "bottom",
                        align: 'center'
                    }
                },
                {
                    element: '#attendance-card',
                    popover: {
                        title: 'Toma de Asistencia',
                        description: 'Registra la asistencia diaria de tus grupos de manera rápida y sencilla.',
                        side: "top",
                        align: 'center'
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
                    element: '#school-year-summary',
                    popover: {
                        title: 'Resumen del Ciclo Escolar',
                        description: 'Monitorea el progreso de tu dosificación curricular y el avance de tus alumnos.',
                        side: "top",
                        align: 'center'
                    }
                },
                {
                    element: '#new-plan-btn',
                    popover: {
                        title: '¡Comencemos!',
                        description: 'Haz clic aquí para crear tu primera planeación didáctica.',
                        side: "bottom",
                        align: 'center'
                    }
                }
            ],
            onDestroyed: () => {
                // Preparar la siguiente fase del tour (si se necesita en el futuro)
                // localStorage.setItem('tour_phase', 'planeacion')
            }
        })

        driverObj.drive()
    }

    return { startTour }
}
