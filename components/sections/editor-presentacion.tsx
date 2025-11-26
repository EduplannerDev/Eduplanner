"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import {
    ArrowLeft,
    Save,
    Loader2,
    Eye,
    Edit3,
    Download,
    Trash2,
    Plus,
    MoveUp,
    MoveDown,
    ChevronRight,
    Image as ImageIcon,
    Presentation as PresentationIcon
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ImageSearchModal } from "@/components/ui/image-search-modal"
import { SlidePreview } from "@/components/ui/slide-preview"

interface EditorPresentacionProps {
    presentacionId: string
    onBack: () => void
}

interface Diapositiva {
    tipo: string
    titulo: string
    [key: string]: any
}

export function EditorPresentacion({ presentacionId, onBack }: EditorPresentacionProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [presentacion, setPresentacion] = useState<any>(null)
    const [diapositivas, setDiapositivas] = useState<Diapositiva[]>([])
    const [selectedSlideIndex, setSelectedSlideIndex] = useState(0)
    const [viewMode, setViewMode] = useState<'slides' | 'document'>('document') // Por defecto modo documento (más fácil)

    useEffect(() => {
        loadPresentacion()
    }, [presentacionId])

    const loadPresentacion = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('presentaciones_ia')
                .select('*')
                .eq('id', presentacionId)
                .single()

            if (error) throw error

            setPresentacion(data)
            setDiapositivas(data.diapositivas_json?.diapositivas || [])
        } catch (error) {
            console.error('Error cargando presentación:', error)
            toast({
                title: "Error",
                description: "No se pudo cargar la presentación",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            const updatedData = {
                ...presentacion.diapositivas_json,
                diapositivas
            }

            const { error } = await supabase
                .from('presentaciones_ia')
                .update({
                    diapositivas_json: updatedData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', presentacionId)

            if (error) throw error

            toast({
                title: "¡Guardado!",
                description: "Los cambios se guardaron correctamente",
            })
        } catch (error) {
            console.error('Error guardando:', error)
            toast({
                title: "Error",
                description: "No se pudieron guardar los cambios",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const handleSlideUpdate = (index: number, updatedSlide: Diapositiva) => {
        const newSlides = [...diapositivas]
        newSlides[index] = updatedSlide
        setDiapositivas(newSlides)
    }

    const handleSlideDelete = (index: number) => {
        if (diapositivas.length <= 2) {
            toast({
                title: "No se puede eliminar",
                description: "Debe haber al menos 2 diapositivas",
                variant: "destructive"
            })
            return
        }
        setDiapositivas(diapositivas.filter((_, i) => i !== index))
        if (selectedSlideIndex >= diapositivas.length - 1) {
            setSelectedSlideIndex(diapositivas.length - 2)
        }
    }

    const handleSlideMove = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === diapositivas.length - 1) return

        const newSlides = [...diapositivas]
        const newIndex = direction === 'up' ? index - 1 : index + 1
            ;[newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]]
        setDiapositivas(newSlides)
        setSelectedSlideIndex(newIndex)
    }

    const handleDownloadPPTX = async () => {
        try {
            toast({
                title: "Generando PPTX",
                description: "Descargando presentación...",
            })

            const response = await fetch('/api/generate-pptx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    presentationData: {
                        ...presentacion.diapositivas_json,
                        diapositivas
                    }
                })
            })

            if (!response.ok) throw new Error('Error al generar PPTX')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${presentacion.titulo}.pptx`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            toast({
                title: "¡Descargado!",
                description: "La presentación se descargó correctamente",
            })
        } catch (error) {
            console.error('Error descargando:', error)
            toast({
                title: "Error",
                description: "No se pudo descargar la presentación",
                variant: "destructive"
            })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    const selectedSlide = diapositivas[selectedSlideIndex]

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate max-w-[300px]">
                            {presentacion?.titulo}
                        </h1>
                        <p className="text-xs text-gray-500">{diapositivas.length} diapositivas</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="bg-muted p-1 rounded-lg flex mr-2">
                        <Button
                            variant={viewMode === 'document' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('document')}
                            className="h-8"
                        >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Editor Visual
                        </Button>
                        <Button
                            variant={viewMode === 'slides' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('slides')}
                            className="h-8"
                        >
                            <PresentationIcon className="h-4 w-4 mr-2" />
                            Diapositivas
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleDownloadPPTX}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        PPTX
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Guardar
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {viewMode === 'document' ? (
                // ===== MODO DOCUMENTO (NUEVO) =====
                <div className="max-w-4xl mx-auto space-y-8 pb-20">
                    {diapositivas.map((slide, index) => (
                        <Card key={index} className="overflow-hidden border-2 hover:border-purple-200 transition-colors">
                            <CardHeader className="bg-gray-50 dark:bg-gray-900/50 border-b py-3 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-white">#{index + 1}</Badge>
                                    <Badge className="capitalize">{slide.tipo}</Badge>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleSlideMove(index, 'up')}
                                        disabled={index === 0}
                                    >
                                        <MoveUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleSlideMove(index, 'down')}
                                        disabled={index === diapositivas.length - 1}
                                    >
                                        <MoveDown className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleSlideDelete(index)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <SlideEditor
                                    slide={slide}
                                    onUpdate={(updated) => handleSlideUpdate(index, updated)}
                                    previewMode={false}
                                    visualMode={true} // Nuevo modo visual
                                />
                            </CardContent>
                        </Card>
                    ))}

                    <div className="flex justify-center pt-8">
                        <p className="text-gray-500 text-sm">Fin de la presentación</p>
                    </div>
                </div>
            ) : (
                // ===== MODO DIAPOSITIVAS (CLÁSICO) =====
                <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)]">
                    {/* Lista de Diapositivas */}
                    <div className="col-span-3 h-full flex flex-col">
                        <Card className="flex-1 flex flex-col overflow-hidden">
                            <CardHeader className="pb-3 py-4">
                                <CardTitle className="text-sm">Diapositivas ({diapositivas.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 flex-1 overflow-y-auto p-2">
                                {diapositivas.map((slide, index) => (
                                    <div
                                        key={index}
                                        onClick={() => setSelectedSlideIndex(index)}
                                        className={`p-3 rounded-lg cursor-pointer border-2 transition-all ${selectedSlideIndex === index
                                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <Badge variant="outline" className="text-xs">
                                                {index + 1}
                                            </Badge>
                                            <Badge className="text-xs">{slide.tipo}</Badge>
                                        </div>
                                        <p className="text-xs font-medium line-clamp-2 text-gray-600 dark:text-gray-300">
                                            {slide.titulo || 'Sin título'}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Editor de Diapositiva */}
                    <div className="col-span-9 h-full flex flex-col">
                        <Card className="flex-1 flex flex-col overflow-hidden">
                            <CardHeader className="py-4 border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>
                                            Diapositiva {selectedSlideIndex + 1}
                                        </CardTitle>
                                        <CardDescription>
                                            Tipo: <Badge variant="outline">{selectedSlide?.tipo}</Badge>
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-6">
                                {selectedSlide && (
                                    <SlideEditor
                                        slide={selectedSlide}
                                        onUpdate={(updatedSlide) => handleSlideUpdate(selectedSlideIndex, updatedSlide)}
                                        previewMode={false}
                                        visualMode={false}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}

// ===== COMPONENTE DE EDICIÓN POR DIAPOSITIVA =====

interface SlideEditorProps {
    slide: Diapositiva
    onUpdate: (slide: Diapositiva) => void
    previewMode: boolean
    visualMode?: boolean
}

function SlideEditor({ slide, onUpdate, previewMode, visualMode = false }: SlideEditorProps) {
    const [showImageSearch, setShowImageSearch] = useState(false)

    const handleChange = (field: string, value: any) => {
        onUpdate({ ...slide, [field]: value })
    }

    const handleArrayChange = (field: string, index: number, value: string) => {
        const newArray = [...(slide[field] || [])]
        newArray[index] = value
        onUpdate({ ...slide, [field]: newArray })
    }

    const handleArrayAdd = (field: string) => {
        const newArray = [...(slide[field] || []), '']
        onUpdate({ ...slide, [field]: newArray })
    }

    const handleArrayRemove = (field: string, index: number) => {
        const newArray = (slide[field] || []).filter((_: any, i: number) => i !== index)
        onUpdate({ ...slide, [field]: newArray })
    }

    const handleImageSelect = (imageUrl: string) => {
        onUpdate({ ...slide, imagen_url: imageUrl })
    }

    if (previewMode) {
        return <SlidePreview slide={slide} />
    }

    if (visualMode) {
        return (
            <div className="space-y-6">
                {/* Título Grande */}
                <Input
                    value={slide.titulo || ''}
                    onChange={(e) => handleChange('titulo', e.target.value)}
                    className="text-3xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent placeholder:text-gray-300"
                    placeholder="Título de la diapositiva"
                />

                {/* Subtítulo (si existe) */}
                {(slide.tipo === 'portada' || slide.subtitulo) && (
                    <Input
                        value={slide.subtitulo || ''}
                        onChange={(e) => handleChange('subtitulo', e.target.value)}
                        className="text-xl text-gray-500 border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent -mt-4"
                        placeholder="Subtítulo"
                    />
                )}

                {/* Contenido Principal Flexible */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 order-2 md:order-1">
                        {/* Listas y Textos */}
                        {slide.puntos && (
                            <ArrayField
                                label="Puntos Clave"
                                field="puntos"
                                values={slide.puntos}
                                onChange={handleArrayChange}
                                onAdd={handleArrayAdd}
                                onRemove={handleArrayRemove}
                            />
                        )}
                        {slide.objetivos && (
                            <ArrayField
                                label="Objetivos"
                                field="objetivos"
                                values={slide.objetivos}
                                onChange={handleArrayChange}
                                onAdd={handleArrayAdd}
                                onRemove={handleArrayRemove}
                            />
                        )}
                        {slide.contenido && (
                            <Textarea
                                value={slide.contenido}
                                onChange={(e) => handleChange('contenido', e.target.value)}
                                className="min-h-[150px] text-lg leading-relaxed border-gray-200"
                                placeholder="Contenido de la diapositiva..."
                            />
                        )}
                        {/* Otros campos específicos se pueden agregar aquí si es necesario */}
                    </div>

                    {/* Imagen Grande */}
                    <div className="order-1 md:order-2">
                        <div className="relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-video flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-purple-400 transition-all shadow-sm hover:shadow-md">
                            {slide.imagen_url ? (
                                <>
                                    <img src={slide.imagen_url} alt="Slide" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                        <Button onClick={() => setShowImageSearch(true)} variant="secondary" size="sm">
                                            <ImageIcon className="h-4 w-4 mr-2" />
                                            Cambiar
                                        </Button>
                                        <Button
                                            onClick={() => handleImageSelect('')}
                                            variant="destructive"
                                            size="sm"
                                            className="h-9 w-9 p-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-6 w-full cursor-pointer" onClick={() => setShowImageSearch(true)}>
                                    <div className="bg-white dark:bg-gray-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                        <ImageIcon className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Agregar Imagen</p>
                                    <p className="text-xs text-gray-500 line-clamp-2 px-4">
                                        {slide.descripcion_imagen || 'Haz clic para buscar en Unsplash'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <ImageSearchModal
                    open={showImageSearch}
                    onClose={() => setShowImageSearch(false)}
                    onSelectImage={handleImageSelect}
                    initialQuery={slide.descripcion_imagen || ''}
                />
            </div>
        )
    }

    return (
        <>
            <div className="space-y-4">
                {/* Campo común: Título */}
                <div>
                    <Label htmlFor="titulo">Título</Label>
                    <Input
                        id="titulo"
                        value={slide.titulo || ''}
                        onChange={(e) => handleChange('titulo', e.target.value)}
                        className="mt-1"
                    />
                </div>

                {/* Campos específicos por tipo */}
                {slide.tipo === 'portada' && (
                    <>
                        <div>
                            <Label htmlFor="subtitulo">Subtítulo</Label>
                            <Input
                                id="subtitulo"
                                value={slide.subtitulo || ''}
                                onChange={(e) => handleChange('subtitulo', e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label htmlFor="descripcion_imagen">Descripción de Imagen</Label>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowImageSearch(true)}
                                >
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                    Buscar Imagen
                                </Button>
                            </div>
                            <Textarea
                                id="descripcion_imagen"
                                value={slide.descripcion_imagen || ''}
                                onChange={(e) => handleChange('descripcion_imagen', e.target.value)}
                                className="mt-1"
                                rows={3}
                            />
                            {slide.imagen_url && (
                                <div className="mt-2">
                                    <img src={slide.imagen_url} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                                </div>
                            )}
                        </div>
                    </>
                )}

                {slide.tipo === 'objetivos' && (
                    <ArrayField
                        label="Objetivos"
                        field="objetivos"
                        values={slide.objetivos || []}
                        onChange={handleArrayChange}
                        onAdd={handleArrayAdd}
                        onRemove={handleArrayRemove}
                    />
                )}

                {slide.tipo === 'contenido' && (
                    <>
                        <div>
                            <Label htmlFor="subtema">Subtema (opcional)</Label>
                            <Input
                                id="subtema"
                                value={slide.subtema || ''}
                                onChange={(e) => handleChange('subtema', e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <ArrayField
                            label="Puntos Clave"
                            field="puntos"
                            values={slide.puntos || []}
                            onChange={handleArrayChange}
                            onAdd={handleArrayAdd}
                            onRemove={handleArrayRemove}
                        />
                        <div>
                            <Label htmlFor="pregunta_reflexion">Pregunta de Reflexión</Label>
                            <Textarea
                                id="pregunta_reflexion"
                                value={slide.pregunta_reflexion || ''}
                                onChange={(e) => handleChange('pregunta_reflexion', e.target.value)}
                                className="mt-1"
                                rows={2}
                            />
                        </div>
                    </>
                )}

                {slide.tipo === 'ejemplo' && (
                    <>
                        <div>
                            <Label htmlFor="contexto">Contexto</Label>
                            <Textarea
                                id="contexto"
                                value={slide.contexto || ''}
                                onChange={(e) => handleChange('contexto', e.target.value)}
                                className="mt-1"
                                rows={2}
                            />
                        </div>
                        <ArrayField
                            label="Pasos"
                            field="pasos"
                            values={slide.pasos || []}
                            onChange={handleArrayChange}
                            onAdd={handleArrayAdd}
                            onRemove={handleArrayRemove}
                        />
                        <div>
                            <Label htmlFor="resultado">Resultado Esperado</Label>
                            <Textarea
                                id="resultado"
                                value={slide.resultado || ''}
                                onChange={(e) => handleChange('resultado', e.target.value)}
                                className="mt-1"
                                rows={2}
                            />
                        </div>
                    </>
                )}

                {slide.tipo === 'actividad' && (
                    <>
                        <div>
                            <Label htmlFor="descripcion">Descripción</Label>
                            <Textarea
                                id="descripcion"
                                value={slide.descripcion || ''}
                                onChange={(e) => handleChange('descripcion', e.target.value)}
                                className="mt-1"
                                rows={2}
                            />
                        </div>
                        <ArrayField
                            label="Instrucciones"
                            field="instrucciones"
                            values={slide.instrucciones || []}
                            onChange={handleArrayChange}
                            onAdd={handleArrayAdd}
                            onRemove={handleArrayRemove}
                        />
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="tiempo_estimado">Tiempo Estimado</Label>
                                <Input
                                    id="tiempo_estimado"
                                    value={slide.tiempo_estimado || ''}
                                    onChange={(e) => handleChange('tiempo_estimado', e.target.value)}
                                    placeholder="15 minutos"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="organizacion">Organización</Label>
                                <Input
                                    id="organizacion"
                                    value={slide.organizacion || ''}
                                    onChange={(e) => handleChange('organizacion', e.target.value)}
                                    placeholder="Equipos"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="materiales">Materiales</Label>
                                <Input
                                    id="materiales"
                                    value={slide.materiales || ''}
                                    onChange={(e) => handleChange('materiales', e.target.value)}
                                    placeholder="Papel, colores"
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </>
                )}

                {slide.tipo === 'interactivo' && (
                    <>
                        <div>
                            <Label htmlFor="pregunta">Pregunta Principal</Label>
                            <Textarea
                                id="pregunta"
                                value={slide.pregunta || ''}
                                onChange={(e) => handleChange('pregunta', e.target.value)}
                                className="mt-1"
                                rows={2}
                            />
                        </div>
                        <ArrayField
                            label="Opciones"
                            field="opciones"
                            values={slide.opciones || []}
                            onChange={handleArrayChange}
                            onAdd={handleArrayAdd}
                            onRemove={handleArrayRemove}
                        />
                        <div>
                            <Label htmlFor="tipo_interaccion">Tipo de Interacción</Label>
                            <Input
                                id="tipo_interaccion"
                                value={slide.tipo_interaccion || ''}
                                onChange={(e) => handleChange('tipo_interaccion', e.target.value)}
                                placeholder="Debate / Votación"
                                className="mt-1"
                            />
                        </div>
                    </>
                )}

                {slide.tipo === 'resumen' && (
                    <>
                        <ArrayField
                            label="Puntos Clave"
                            field="puntos_clave"
                            values={slide.puntos_clave || []}
                            onChange={handleArrayChange}
                            onAdd={handleArrayAdd}
                            onRemove={handleArrayRemove}
                        />
                        <div>
                            <Label htmlFor="conexion_vida">Conexión con la Vida Real</Label>
                            <Textarea
                                id="conexion_vida"
                                value={slide.conexion_vida || ''}
                                onChange={(e) => handleChange('conexion_vida', e.target.value)}
                                className="mt-1"
                                rows={2}
                            />
                        </div>
                    </>
                )}

                {slide.tipo === 'cierre' && (
                    <>
                        <div>
                            <Label htmlFor="resumen">Resumen</Label>
                            <Textarea
                                id="resumen"
                                value={slide.resumen || ''}
                                onChange={(e) => handleChange('resumen', e.target.value)}
                                className="mt-1"
                                rows={2}
                            />
                        </div>
                        <div>
                            <Label htmlFor="pregunta_reflexion">Pregunta de Reflexión</Label>
                            <Textarea
                                id="pregunta_reflexion"
                                value={slide.pregunta_reflexion || ''}
                                onChange={(e) => handleChange('pregunta_reflexion', e.target.value)}
                                className="mt-1"
                                rows={2}
                            />
                        </div>
                        <div>
                            <Label htmlFor="mensaje_motivador">Mensaje Motivador</Label>
                            <Input
                                id="mensaje_motivador"
                                value={slide.mensaje_motivador || ''}
                                onChange={(e) => handleChange('mensaje_motivador', e.target.value)}
                                className="mt-1"
                            />
                        </div>
                    </>
                )}

                {/* Descripción de imagen (común para casi todos) */}
                {slide.tipo !== 'portada' && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label htmlFor="descripcion_imagen">Sugerencia de Imagen</Label>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowImageSearch(true)}
                            >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Buscar Imagen
                            </Button>
                        </div>
                        <Textarea
                            id="descripcion_imagen"
                            value={slide.descripcion_imagen || ''}
                            onChange={(e) => handleChange('descripcion_imagen', e.target.value)}
                            className="mt-1"
                            rows={2}
                            placeholder="Descripción de la imagen sugerida para esta diapositiva"
                        />
                        {slide.imagen_url && (
                            <div className="mt-2">
                                <img src={slide.imagen_url} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de Búsqueda de Imágenes */}
            <ImageSearchModal
                open={showImageSearch}
                onClose={() => setShowImageSearch(false)}
                onSelectImage={handleImageSelect}
                initialQuery={slide.keywords_imagen || slide.descripcion_imagen || ''}
            />
        </>
    )
}

// ===== COMPONENTE AUXILIAR PARA ARRAYS =====

interface ArrayFieldProps {
    label: string
    field: string
    values: string[]
    onChange: (field: string, index: number, value: string) => void
    onAdd: (field: string) => void
    onRemove: (field: string, index: number) => void
}

function ArrayField({ label, field, values, onChange, onAdd, onRemove }: ArrayFieldProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <Label>{label}</Label>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAdd(field)}
                >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar
                </Button>
            </div>
            <div className="space-y-2">
                {values.map((value, index) => (
                    <div key={index} className="flex gap-2">
                        <Input
                            value={value}
                            onChange={(e) => onChange(field, index, e.target.value)}
                            placeholder={`${label} ${index + 1}`}
                        />
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemove(field, index)}
                            className="text-red-600"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {values.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                        No hay {label.toLowerCase()} todavía. Agrega uno.
                    </p>
                )}
            </div>
        </div>
    )
}


