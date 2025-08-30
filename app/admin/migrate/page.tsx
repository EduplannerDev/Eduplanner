"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, Database } from "lucide-react"
import { migrateMarkdownPlaneaciones } from "@/lib/planeaciones"

export default function MigratePage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ migrated: number; errors: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)
    setError(null)

    try {
      const migrationResult = await migrateMarkdownPlaneaciones()
      setResult(migrationResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Migración de Planeaciones</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Convierte el contenido de planeaciones de Markdown a HTML
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Migración de Contenido
            </CardTitle>
            <CardDescription>
              Esta herramienta convertirá todas las planeaciones existentes que tengan contenido en formato Markdown a HTML.
              Esto mejorará la visualización y edición de las planeaciones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Esta operación modificará las planeaciones existentes en la base de datos.
                Se recomienda hacer una copia de seguridad antes de ejecutar la migración.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button 
                onClick={runMigration} 
                disabled={isRunning}
                size="lg"
                className="w-full sm:w-auto"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ejecutando migración...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Ejecutar Migración
                  </>
                )}
              </Button>
            </div>

            {result && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p><strong>Migración completada exitosamente</strong></p>
                    <p>• Planeaciones migradas: {result.migrated}</p>
                    <p>• Errores: {result.errors}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error durante la migración:</strong> {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>¿Qué hace esta migración?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Identifica planeaciones con contenido en formato Markdown</li>
              <li>• Convierte el Markdown a HTML preservando el formato</li>
              <li>• Actualiza las planeaciones en la base de datos</li>
              <li>• Mantiene un registro de planeaciones migradas y errores</li>
              <li>• No afecta planeaciones que ya están en formato HTML</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}