import { Badge } from "@/components/ui/badge"

export interface Diapositiva {
    tipo: string
    titulo: string
    subtitulo?: string
    contenido?: string
    puntos?: string[]
    objetivos?: string[]
    descripcion_imagen?: string
    imagen_url?: string
    pregunta_reflexion?: string
    [key: string]: any
}

export function SlidePreview({ slide }: { slide: Diapositiva }) {
    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8 rounded-lg min-h-[300px] sm:min-h-[400px] flex flex-col justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 w-full max-w-4xl mx-auto">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex-1 mr-4">
                        {slide.titulo}
                    </h2>
                    <Badge variant="outline" className="capitalize shrink-0">{slide.tipo}</Badge>
                </div>

                {slide.subtitulo && (
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-6">
                        {slide.subtitulo}
                    </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="order-2 md:order-1">
                        {slide.contenido && (
                            <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                                {slide.contenido}
                            </p>
                        )}

                        {slide.puntos && slide.puntos.length > 0 && (
                            <ul className="space-y-2 mb-4">
                                {slide.puntos.map((punto: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-purple-600 mt-1">•</span>
                                        <span className="text-gray-700 dark:text-gray-300">{punto}</span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {slide.objetivos && slide.objetivos.length > 0 && (
                            <ul className="space-y-2 mb-4">
                                {slide.objetivos.map((obj: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="font-bold text-purple-600">{i + 1}.</span>
                                        <span className="text-gray-700 dark:text-gray-300">{obj}</span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {slide.pregunta_reflexion && (
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900">
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Reflexión:</p>
                                <p className="text-sm text-blue-700 dark:text-blue-300 italic">
                                    "{slide.pregunta_reflexion}"
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="order-1 md:order-2">
                        {/* Mostrar imagen si existe */}
                        {slide.imagen_url ? (
                            <div className="rounded-lg overflow-hidden shadow-md aspect-video bg-gray-100">
                                <img
                                    src={slide.imagen_url}
                                    alt={slide.descripcion_imagen || 'Imagen de la diapositiva'}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : slide.descripcion_imagen ? (
                            <div className="rounded-lg overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 aspect-video flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 p-4">
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Sugerencia de Imagen</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                        "{slide.descripcion_imagen}"
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}
