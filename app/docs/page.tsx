'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, FileText, Code, Smartphone } from 'lucide-react'

// Importar SwaggerUI dinámicamente para evitar problemas de SSR
const SwaggerUI = dynamic<any>(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-2">Cargando documentación...</span>
    </div>
  )
})

// Importar estilos de Swagger UI
import 'swagger-ui-react/swagger-ui.css'

export default function DocsPage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const apiEndpoints = [
    { name: 'Chat IA', path: '/api/chat', method: 'POST', description: 'Generar planeaciones con IA' },
    { name: 'Generar Examen', path: '/api/generate-exam', method: 'POST', description: 'Crear exámenes basados en planeaciones' },
    { name: 'Mensajes', path: '/api/messages', method: 'GET', description: 'Obtener mensajes del usuario' },
    { name: 'Guardar Mensaje', path: '/api/save-message', method: 'POST', description: 'Guardar nuevo mensaje' },
    { name: 'Generar Presentación', path: '/api/generate-presentation', method: 'POST', description: 'Crear presentaciones' },
    { name: 'Generar PPTX', path: '/api/generate-pptx', method: 'POST', description: 'Exportar a PowerPoint' },
    { name: 'Adaptar WhatsApp', path: '/api/adapt-whatsapp', method: 'POST', description: 'Adaptar contenido para WhatsApp' }
  ]

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">API Documentation</h1>
          <Badge variant="secondary">EduPlanner</Badge>
        </div>
        <p className="text-lg text-muted-foreground mb-6">
          Documentación completa de la API de EduPlanner para desarrollo de aplicaciones móviles y integración externa.
        </p>
        
        {/* Quick Links */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" asChild>
            <a href="/api/docs" target="_blank" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              JSON Schema
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/swagger.yaml" target="_blank" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              YAML File
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/API_DOCUMENTATION.md" target="_blank" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile Guide
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>

      {/* API Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🔐 Autenticación</CardTitle>
            <CardDescription>Supabase Auth + JWT</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Utiliza tokens JWT de Supabase para autenticar las peticiones a la API.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📱 Mobile Ready</CardTitle>
            <CardDescription>React Native & Flutter</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Endpoints optimizados para aplicaciones móviles con ejemplos de código.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🚀 Streaming</CardTitle>
            <CardDescription>Respuestas en tiempo real</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Soporte para streaming de respuestas de IA para mejor UX.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Endpoints Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>📋 Endpoints Disponibles</CardTitle>
          <CardDescription>
            {apiEndpoints.length} endpoints principales para la funcionalidad completa de EduPlanner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {apiEndpoints.map((endpoint, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'} className="text-xs">
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono">{endpoint.path}</code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{endpoint.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Swagger UI */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Interfaz Interactiva</CardTitle>
          <CardDescription>
            Prueba los endpoints directamente desde esta interfaz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="swagger-container">
            {isLoaded && (
              <SwaggerUI 
                url="/api/docs"
                docExpansion="list"
                defaultModelsExpandDepth={1}
                defaultModelExpandDepth={1}
                displayOperationId={false}
                displayRequestDuration={true}
                filter={true}
                showExtensions={true}
                showCommonExtensions={true}
                tryItOutEnabled={true}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>📚 Para más información sobre desarrollo móvil, consulta la <a href="/API_DOCUMENTATION.md" className="text-primary hover:underline">guía completa</a></p>
        <p className="mt-2">🔄 Documentación actualizada automáticamente • Versión: 1.0.0</p>
      </div>
    </div>
  )
}