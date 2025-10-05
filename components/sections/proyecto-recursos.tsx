"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/ui/file-upload'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Trash2, 
  Eye, 
  Folder, 
  FileText, 
  Image, 
  Video, 
  Music,
  Calendar,
  User
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface ProyectoRecurso {
  id: string
  nombre: string
  tipo: string
  tamaño: number
  url: string
  created_at: string
  user_id: string
  proyecto_id: string
}

interface ProyectoRecursosProps {
  proyectoId: string
}

export function ProyectoRecursos({ proyectoId }: ProyectoRecursosProps) {
  const [recursos, setRecursos] = useState<ProyectoRecurso[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedRecurso, setSelectedRecurso] = useState<ProyectoRecurso | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    cargarRecursos()
  }, [proyectoId])

  const cargarRecursos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('proyecto_recursos')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando recursos:', error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los recursos",
          variant: "destructive"
        })
        return
      }

      setRecursos(data || [])
    } catch (error) {
      console.error('Error cargando recursos:', error)
      toast({
        title: "Error",
        description: "Error inesperado al cargar recursos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return

    setUploading(true)
    
    try {
      for (const file of files) {
        await subirArchivo(file)
      }
      
      toast({
        title: "¡Éxito!",
        description: `${files.length} archivo(s) subido(s) correctamente`,
        variant: "default"
      })
      
      // Recargar la lista de recursos
      await cargarRecursos()
      
    } catch (error) {
      console.error('Error subiendo archivos:', error)
      toast({
        title: "Error",
        description: "Error al subir los archivos",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const subirArchivo = async (file: File) => {
    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `proyectos/${proyectoId}/${fileName}`

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('proyecto-recursos')
      .upload(filePath, file)

    if (uploadError) {
      throw new Error(`Error subiendo ${file.name}: ${uploadError.message}`)
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('proyecto-recursos')
      .getPublicUrl(filePath)

    // Verificar usuario actual antes de insertar
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Verificar que el proyecto existe y pertenece al usuario
    const { data: proyectoData, error: proyectoError } = await supabase
      .from('proyectos')
      .select('id, profesor_id, grupos!inner(plantel_id)')
      .eq('id', proyectoId)
      .single()

    // Guardar información del recurso en la base de datos
    const { error: dbError } = await supabase
      .from('proyecto_recursos')
      .insert({
        nombre: file.name,
        tipo: file.type,
        tamaño: file.size,
        url: urlData.publicUrl,
        proyecto_id: proyectoId,
        archivo_path: filePath,
        user_id: user?.id
      })

    if (dbError) {
      // Si falla la inserción en BD, eliminar el archivo subido
      await supabase.storage
        .from('proyecto-recursos')
        .remove([filePath])
      throw new Error(`Error guardando información de ${file.name}: ${dbError.message}`)
    }
  }

  const eliminarRecurso = async (recurso: ProyectoRecurso) => {
    try {
      // Eliminar archivo de storage
      const { error: storageError } = await supabase.storage
        .from('proyecto-recursos')
        .remove([recurso.archivo_path])

      if (storageError) {
        // Log error but continue
      }

      // Eliminar registro de la base de datos
      const { error: dbError } = await supabase
        .from('proyecto_recursos')
        .delete()
        .eq('id', recurso.id)

      if (dbError) {
        throw new Error('Error eliminando registro de la base de datos')
      }

      // Actualizar lista local
      setRecursos(prev => prev.filter(r => r.id !== recurso.id))
      
      toast({
        title: "Eliminado",
        description: "Recurso eliminado correctamente",
        variant: "default"
      })
      
    } catch (error) {
      console.error('Error eliminando recurso:', error)
      toast({
        title: "Error",
        description: "Error al eliminar el recurso",
        variant: "destructive"
      })
    }
  }

  const descargarRecurso = (recurso: ProyectoRecurso) => {
    const link = document.createElement('a')
    link.href = recurso.url
    link.download = recurso.nombre
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const verRecurso = (recurso: ProyectoRecurso) => {
    setSelectedRecurso(recurso)
    setShowViewModal(true)
  }

  const canViewFile = (tipo: string) => {
    // Solo imágenes y videos se pueden visualizar en modal
    return tipo.startsWith('image/') || tipo.startsWith('video/')
  }

  const getFileTypeCategory = (tipo: string) => {
    if (tipo.startsWith('image/')) return 'image'
    if (tipo.startsWith('video/')) return 'video'
    if (tipo.startsWith('audio/')) return 'audio'
    if (tipo.includes('pdf')) return 'pdf'
    if (tipo.includes('word')) return 'document'
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return 'document'
    if (tipo.includes('powerpoint') || tipo.includes('presentation')) return 'document'
    return 'other'
  }

  const getFileIcon = (tipo: string) => {
    if (tipo.startsWith('image/')) return <Image className="h-5 w-5" />
    if (tipo.startsWith('video/')) return <Video className="h-5 w-5" />
    if (tipo.startsWith('audio/')) return <Music className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  const getTipoBadge = (tipo: string) => {
    if (tipo.startsWith('image/')) return 'Imagen'
    if (tipo.startsWith('video/')) return 'Video'
    if (tipo.startsWith('audio/')) return 'Audio'
    if (tipo.includes('pdf')) return 'PDF'
    if (tipo.includes('word')) return 'Word'
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return 'Excel'
    if (tipo.includes('powerpoint') || tipo.includes('presentation')) return 'PowerPoint'
    return 'Archivo'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Folder className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Recursos del Proyecto
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando recursos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Folder className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Recursos del Proyecto
          </h2>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          {recursos.length} archivo{recursos.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subir Recursos</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFilesSelected={handleFilesSelected}
            disabled={uploading}
            uploading={uploading}
            maxFiles={5}
            maxFileSize={25 * 1024 * 1024} // 25MB (límite de Supabase Free)
          />
        </CardContent>
      </Card>

      {/* Resources List */}
      {recursos.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Recursos Subidos
          </h3>
          <div className="grid gap-4">
            {recursos.map((recurso) => (
              <Card key={recurso.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="text-gray-600 dark:text-gray-400">
                        {getFileIcon(recurso.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {recurso.nombre}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getTipoBadge(recurso.tipo)}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(recurso.tamaño)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(recurso.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {canViewFile(recurso.tipo) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => verRecurso(recurso)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => descargarRecurso(recurso)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar recurso?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente el archivo
                              <strong> "{recurso.nombre}"</strong> y todos sus datos asociados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => eliminarRecurso(recurso)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Folder className="w-8 h-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  No hay recursos aún
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sube archivos, imágenes, videos y otros recursos para tu proyecto
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Visualización */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] w-full">
          {selectedRecurso && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  {getFileIcon(selectedRecurso.tipo)}
                  <span>{selectedRecurso.nombre}</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="mt-4 max-h-[70vh] overflow-auto">
                {selectedRecurso.tipo.startsWith('image/') && (
                  <div className="flex justify-center">
                    <img 
                      src={selectedRecurso.url} 
                      alt={selectedRecurso.nombre}
                      className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                    />
                  </div>
                )}
                
                {selectedRecurso.tipo.startsWith('video/') && (
                  <div className="flex justify-center">
                    <video 
                      src={selectedRecurso.url} 
                      controls
                      className="max-w-full max-h-[60vh] rounded-lg shadow-lg"
                    >
                      Tu navegador no soporta la reproducción de videos.
                    </video>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowViewModal(false)}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => descargarRecurso(selectedRecurso)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
