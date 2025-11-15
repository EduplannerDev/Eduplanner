"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Play, X } from "lucide-react"

interface WelcomeModalProps {
  open: boolean
  onClose: () => void
}

export default function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const [showVideo, setShowVideo] = useState(false)

  const handlePlayVideo = () => {
    setShowVideo(true)
  }

  const handleClose = () => {
    setShowVideo(false)
    onClose()
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-7xl w-[98vw] h-[90vh] sm:h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-center">
            ¡Bienvenido a EduPlanner! 🎓
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Te invitamos a ver este video introductorio para conocer todas las funcionalidades de la plataforma
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 p-2 sm:p-4 pt-4">
          {!showVideo ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 sm:space-y-6">
              <div className="relative w-full max-w-5xl aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden border shadow-lg">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-all duration-300 transform hover:scale-110 shadow-lg"
                         onClick={handlePlayVideo}>
                      <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" />
                    </div>
                    <p className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-200">Hacer clic para reproducir</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 px-4">
                      Video introductorio de EduPlanner
                    </p>
                  </div>
                </div>
                <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                  YouTube
                </div>
              </div>
              
              <div className="text-center space-y-2 px-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Duración aproximada: 5 minutos
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Puedes cerrar este modal y verlo más tarde desde la sección de Ayuda
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative w-full max-w-6xl aspect-video">
                <iframe
                  src="https://www.youtube.com/embed/xVEUfzxSX68?autoplay=1&rel=0"
                  title="EduPlanner - Video Introductorio"
                  className="w-full h-full rounded-lg shadow-2xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 sm:p-6 pt-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <X className="w-4 h-4" />
            Cerrar
          </Button>
          
          {!showVideo && (
            <Button onClick={handlePlayVideo} className="flex items-center gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              <Play className="w-4 h-4" />
              Reproducir Video
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
