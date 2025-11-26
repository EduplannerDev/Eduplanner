"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search, Loader2, Image as ImageIcon, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImageSearchModalProps {
    open: boolean
    onClose: () => void
    onSelectImage: (imageUrl: string) => void
    initialQuery?: string
}

interface UnsplashImage {
    id: string
    url: string
    thumb: string
    description: string
    photographer: string
    photographer_url: string
    download_url: string // Agregado para tracking
}

export function ImageSearchModal({ open, onClose, onSelectImage, initialQuery = '' }: ImageSearchModalProps) {
    const { toast } = useToast()
    const [query, setQuery] = useState(initialQuery)
    const [images, setImages] = useState<UnsplashImage[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedImage, setSelectedImage] = useState<UnsplashImage | null>(null) // Guardamos el objeto completo

    // Actualizar query cuando cambia initialQuery o se abre el modal
    useEffect(() => {
        if (open) {
            setQuery(initialQuery)
            setImages([]) // Limpiar resultados anteriores
            setSelectedImage(null) // Limpiar selección anterior
        }
    }, [open, initialQuery])

    const handleSearch = async () => {
        if (!query.trim()) {
            toast({
                title: "Error",
                description: "Escribe algo para buscar",
                variant: "destructive"
            })
            return
        }

        try {
            setLoading(true)
            const response = await fetch(`/api/search-images?query=${encodeURIComponent(query)}&per_page=12`)

            if (!response.ok) {
                throw new Error('Error al buscar imágenes')
            }

            const data = await response.json()
            setImages(data.images || [])

            if (data.images.length === 0) {
                toast({
                    title: "Sin resultados",
                    description: "No se encontraron imágenes. Intenta con otra búsqueda.",
                })
            }
        } catch (error) {
            console.error('Error buscando imágenes:', error)
            toast({
                title: "Error",
                description: "No se pudieron buscar las imágenes",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = async () => {
        if (selectedImage) {
            onSelectImage(selectedImage.url)

            // Tracking de descarga (Requisito de Unsplash)
            try {
                await fetch('/api/track-download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ downloadLocation: selectedImage.download_url })
                });
            } catch (error) {
                console.error('Error tracking download:', error);
                // No bloqueamos el flujo si falla el tracking
            }

            onClose()
        } else {
            toast({
                title: "Selecciona una imagen",
                description: "Debes seleccionar una imagen antes de continuar",
                variant: "destructive"
            })
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSearch()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Buscar Imagen
                    </DialogTitle>
                    <DialogDescription>
                        Busca imágenes gratuitas de alta calidad en Unsplash
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Buscador */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Textarea
                                placeholder="Ej: niños jugando en el parque, ciencia, matemáticas..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="min-h-[80px] resize-none"
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={loading}>
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Search className="h-4 w-4 mr-2" />
                                    Buscar
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Grid de Imágenes */}
                    {images.length > 0 && (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                {images.map((image) => (
                                    <div
                                        key={image.id}
                                        onClick={() => setSelectedImage(image)}
                                        className={`relative cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${selectedImage?.url === image.url
                                                ? 'border-purple-600 ring-2 ring-purple-400'
                                                : 'border-transparent hover:border-gray-300'
                                            }`}
                                    >
                                        <img
                                            src={image.thumb}
                                            alt={image.description}
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                            <p className="text-white text-xs line-clamp-2">
                                                {image.description || 'Sin descripción'}
                                            </p>
                                            <a
                                                href={image.photographer_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-white/80 text-xs hover:text-white flex items-center gap-1 mt-1"
                                            >
                                                Por {image.photographer}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                        {selectedImage?.url === image.url && (
                                            <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-2">
                                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t">
                                <p className="text-sm text-gray-500">
                                    Imágenes cortesía de <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline">Unsplash</a>
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={onClose}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleConfirm}
                                        disabled={!selectedImage}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        Usar Imagen
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Estado vacío */}
                    {!loading && images.length === 0 && (
                        <div className="text-center py-12">
                            <ImageIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">
                                Busca imágenes para tu presentación
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                                Prueba con: "educación", "ciencia", "naturaleza", etc.
                            </p>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
