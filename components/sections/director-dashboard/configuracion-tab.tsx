"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, ImageIcon, Save, Loader2, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Plantel } from "@/lib/planteles"
import Image from "next/image"

interface ConfiguracionTabProps {
    plantel: Plantel | null
    onUpdate?: () => void
}

export function ConfiguracionTab({ plantel, onUpdate }: ConfiguracionTabProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(plantel?.logo_url || null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
        }
    }

    const handleFile = async (file: File) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast({
                variant: "destructive",
                title: "Archivo inválido",
                description: "Por favor sube una imagen (PNG, JPG, JPEG).",
            })
            return
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                variant: "destructive",
                title: "Archivo muy grande",
                description: "La imagen no debe superar los 5MB.",
            })
            return
        }

        // Show preview immediately
        const reader = new FileReader()
        reader.onload = (e) => {
            if (e.target?.result as string) {
                setPreviewUrl(e.target!.result as string)
            }
        }
        reader.readAsDataURL(file)

        // Upload
        await uploadLogo(file)
    }

    const uploadLogo = async (file: File) => {
        if (!plantel?.id) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("plantelId", plantel.id)

            const response = await fetch("/api/plantel/upload-logo", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al subir la imagen")
            }

            await response.json()

            toast({
                title: "Logo actualizado",
                description: "La imagen institucional se ha guardado correctamente.",
            })

            if (onUpdate) onUpdate()
        } catch (error) {
            console.error("Error uploading logo:", error)
            toast({
                variant: "destructive",
                title: "Error al guardar",
                description: "No se pudo actualizar el logo. Intenta nuevamente.",
            })
            // Revert preview if failed
            setPreviewUrl(plantel.logo_url || null)
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Identidad Institucional</CardTitle>
                    <CardDescription>
                        Personaliza la apariencia de tu escuela en documentos y reportes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Logo del Plantel</Label>
                        <div className="text-sm text-muted-foreground mb-4">
                            Este logo aparecerá en:
                            <ul className="list-disc list-inside mt-1 ml-2">
                                <li>Reportes oficiales</li>
                                <li>Actas de incidencias</li>
                                <li>Credenciales y documentos</li>
                            </ul>
                        </div>

                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative h-32 w-32 rounded-full overflow-hidden bg-muted flex items-center justify-center border shadow-sm">
                                    {previewUrl ? (
                                        <Image
                                            src={previewUrl}
                                            alt="Logo Preview"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                                    )}
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm font-medium">
                                        {isUploading ? "Subiendo..." : "Arrastra tu logo aquí o"}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isUploading}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Seleccionar Archivo
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleChange}
                                        disabled={isUploading}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    PNG, JPG o JPEG (Máx. 5MB)
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Más configuraciones futuras pueden ir aquí */}
        </div>
    )
}
