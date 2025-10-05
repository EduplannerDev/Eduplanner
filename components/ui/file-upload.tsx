"use client"

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  onFileUpload?: (file: File, progress: number) => void
  onUploadComplete?: (file: File, url: string) => void
  onUploadError?: (file: File, error: string) => void
  acceptedFileTypes?: Record<string, string[]>
  maxFiles?: number
  maxFileSize?: number // in bytes
  disabled?: boolean
  className?: string
}

interface FileWithProgress extends File {
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
}

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  onFileUpload?: (file: File, progress: number) => void
  onUploadComplete?: (file: File, url: string) => void
  onUploadError?: (file: File, error: string) => void
  acceptedFileTypes?: Record<string, string[]>
  maxFiles?: number
  maxFileSize?: number // in bytes
  disabled?: boolean
  className?: string
  uploading?: boolean // Nuevo prop para indicar si se está subiendo
}

export function FileUpload({
  onFilesSelected,
  onFileUpload,
  onUploadComplete,
  onUploadError,
  acceptedFileTypes = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'text/plain': ['.txt'],
    'video/*': ['.mp4', '.avi', '.mov', '.wmv'],
    'audio/*': ['.mp3', '.wav', '.ogg']
  },
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  disabled = false,
  className = '',
  uploading = false
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (disabled) return

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        console.error('File rejected:', file.name, errors)
      })
    }

    // Add unique IDs to files and validate properties
    const filesWithId = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending' as const,
      // Ensure required properties exist
      name: file.name || 'archivo_sin_nombre',
      size: file.size || 0,
      type: file.type || 'application/octet-stream'
    }))

    setFiles(prev => [...prev, ...filesWithId])
    onFilesSelected(acceptedFiles)
  }, [onFilesSelected, disabled])

  const { getRootProps, getInputProps, isDragActive: dropzoneDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles,
    maxSize: maxFileSize,
    disabled,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileName: string) => {
    if (!fileName) return '📁'
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'doc':
      case 'docx':
        return '📝'
      case 'xls':
      case 'xlsx':
        return '📊'
      case 'ppt':
      case 'pptx':
        return '📈'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return '🖼️'
      case 'mp4':
      case 'avi':
      case 'mov':
        return '🎥'
      case 'mp3':
      case 'wav':
        return '🎵'
      default:
        return '📁'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <Card 
        {...getRootProps()} 
        className={`
          border-2 border-dashed transition-colors cursor-pointer
          ${isDragActive || dropzoneDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : uploading
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <CardContent className="p-8">
          <input {...getInputProps()} />
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              {uploading ? (
                <div className="relative">
                  <Upload className="w-8 h-8 text-green-600 dark:text-green-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              ) : (
                <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {uploading 
                  ? 'Subiendo archivos...' 
                  : isDragActive || dropzoneDragActive 
                    ? 'Suelta los archivos aquí' 
                    : 'Arrastra y suelta archivos aquí'
                }
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {uploading ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Por favor espera mientras se suben los archivos
                  </span>
                ) : (
                  <>o <span className="text-blue-600 dark:text-blue-400 font-medium">haz clic para seleccionar</span></>
                )}
              </p>
            </div>
            {!uploading && (
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>Tipos de archivo soportados: PDF, Word, Excel, PowerPoint, imágenes, videos, audio</p>
                <p>Tamaño máximo: {formatFileSize(maxFileSize)} por archivo (Supabase Free)</p>
                <p>Máximo {maxFiles} archivos</p>
              </div>
            )}
            {uploading && (
              <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 dark:border-green-400"></div>
                <span className="text-sm font-medium">Procesando archivos...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Archivos seleccionados ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((file) => (
              <Card key={file.id} className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getFileIcon(file.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {file.name}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </span>
                        {file.status === 'uploading' && (
                          <>
                            <span className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">
                              Subiendo...
                            </span>
                            <Loader2 className="h-3 w-3 animate-spin text-blue-600 dark:text-blue-400" />
                          </>
                        )}
                        {file.status === 'completed' && (
                          <span className="text-xs text-green-600 dark:text-green-400 flex items-center space-x-1">
                            <span>✓</span>
                            <span>Completado</span>
                          </span>
                        )}
                        {file.status === 'error' && (
                          <span className="text-xs text-red-600 dark:text-red-400 flex items-center space-x-1">
                            <span>✗</span>
                            <span>Error</span>
                          </span>
                        )}
                      </div>
                      {file.status === 'uploading' && (
                        <Progress value={file.progress} className="mt-2 h-1" />
                      )}
                      {file.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {file.error}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
