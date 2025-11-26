import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"

const MESSAGES = [
    "Analizando tu planeación...",
    "Identificando puntos clave...",
    "Estructurando las diapositivas...",
    "Diseñando actividades interactivas...",
    "Seleccionando imágenes sugeridas...",
    "Optimizando el contenido...",
    "Dando los toques finales..."
]

export function LoadingOverlay() {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % MESSAGES.length)
        }, 2500)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="absolute inset-0 bg-white/95 dark:bg-gray-950/95 z-50 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-500 rounded-lg">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-full animate-pulse" />
                <div className="relative bg-white dark:bg-gray-900 p-4 rounded-full shadow-xl border border-purple-100 dark:border-purple-900">
                    <Sparkles className="h-10 w-10 text-purple-600 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Creando tu presentación
            </h3>

            <div className="h-8 flex items-center justify-center min-w-[300px]">
                <p
                    key={currentMessageIndex}
                    className="text-gray-500 dark:text-gray-400 animate-in slide-in-from-bottom-2 fade-in duration-500"
                >
                    {MESSAGES[currentMessageIndex]}
                </p>
            </div>

            <div className="mt-8 flex gap-1">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>
        </div>
    )
}
