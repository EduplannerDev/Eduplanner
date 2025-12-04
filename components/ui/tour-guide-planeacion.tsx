"use client"

import { useEffect } from 'react'
import { driver } from "driver.js"
import "driver.js/dist/driver.css"

export function TourGuidePlaneacion() {
    useEffect(() => {
        // Verificar si estamos en la fase de planeación del tour
        const tourPhase = localStorage.getItem('tour_phase')

        if (tourPhase === 'planeacion') {
            // Pequeño retraso para asegurar que la UI esté lista
            const timer = setTimeout(() => {
                startTour()
            }, 1000)

            return () => clearTimeout(timer)
        }
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
                    element: '#plan-types-grid',
                    popover: {
                        title: 'Tipos de Planeación',
                        description: 'Aquí puedes elegir cómo quieres crear tu planeación. Como usuario nuevo, comenzarás con la "Planeación Individual".',
                        side: "top",
                        align: 'center'
                    }
                },
                {
                    element: '#individual-plan-card',
                    popover: {
                        title: 'Planeación Individual',
                        description: 'Esta es tu herramienta principal. Crea una planeación específica potenciada por IA.',
                        side: "top",
                        align: 'start'
                    }
                }
            ],
            onDestroyed: () => {
                // Marcar el tour como completado
                localStorage.setItem('tour_phase', 'completed')
            }
        })

        driverObj.drive()
    }

    return null
}
