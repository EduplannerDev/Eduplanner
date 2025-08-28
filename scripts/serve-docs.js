#!/usr/bin/env node

/**
 * Script para servir la documentación Swagger de EduPlanner API
 * 
 * Uso:
 * node scripts/serve-docs.js
 * 
 * Luego visita: http://localhost:3001/api-docs
 */

const express = require('express')
const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.DOCS_PORT || 3001

// Cargar el archivo swagger.yaml
const swaggerPath = path.join(__dirname, '..', 'swagger.yaml')

if (!fs.existsSync(swaggerPath)) {
  console.error('❌ Error: No se encontró el archivo swagger.yaml')
  console.error('   Asegúrate de que existe en la raíz del proyecto')
  process.exit(1)
}

try {
  const swaggerDocument = YAML.load(swaggerPath)
  
  // Configuración de Swagger UI
  const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
      requestInterceptor: (req) => {
        // Agregar token de autorización si está disponible
        const token = process.env.API_TOKEN
        if (token) {
          req.headers['Authorization'] = `Bearer ${token}`
        }
        return req
      }
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2563eb }
      .swagger-ui .scheme-container { background: #f8fafc; padding: 10px; border-radius: 5px }
    `,
    customSiteTitle: 'EduPlanner API Documentation',
    customfavIcon: '/favicon.ico'
  }

  // Middleware
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions))
  
  // Ruta raíz
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>EduPlanner API</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            line-height: 1.6;
          }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 2.5em; margin-bottom: 10px; }
          .subtitle { color: #666; font-size: 1.2em; }
          .card { 
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .btn {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 10px 10px 0;
          }
          .btn:hover { background: #1d4ed8; }
          .btn-secondary {
            background: #64748b;
          }
          .btn-secondary:hover { background: #475569; }
          .endpoint { 
            font-family: 'Monaco', 'Menlo', monospace;
            background: #1e293b;
            color: #e2e8f0;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">📚 EduPlanner API</div>
          <div class="subtitle">Documentación de la API para planeaciones educativas con IA</div>
        </div>
        
        <div class="card">
          <h3>🚀 Acceso Rápido</h3>
          <a href="/api-docs" class="btn">Ver Documentación Swagger</a>
          <a href="https://github.com/tu-usuario/eduplanner" class="btn btn-secondary">Código Fuente</a>
        </div>
        
        <div class="card">
          <h3>🔗 Endpoints Principales</h3>
          <div class="endpoint">POST /api/chat - Chat con IA educativa</div>
          <div class="endpoint">POST /api/generate-exam - Generar exámenes</div>
          <div class="endpoint">GET /api/messages - Obtener mensajes</div>
          <div class="endpoint">POST /api/generate-presentation - Generar presentaciones</div>
        </div>
        
        <div class="card">
          <h3>📖 Recursos</h3>
          <ul>
            <li><a href="/api-docs">Documentación Swagger Interactiva</a></li>
            <li><a href="https://supabase.com/docs">Documentación de Supabase</a></li>
            <li><a href="https://nextjs.org/docs">Documentación de Next.js</a></li>
          </ul>
        </div>
        
        <div class="card">
          <h3>⚙️ Configuración</h3>
          <p>Para usar la API necesitas:</p>
          <ul>
            <li>Token de autenticación de Supabase</li>
            <li>Configurar las variables de entorno</li>
            <li>Endpoint base: <code>http://localhost:3000/api</code></li>
          </ul>
        </div>
      </body>
      </html>
    `)
  })
  
  // Ruta para obtener el swagger.yaml raw
  app.get('/swagger.yaml', (req, res) => {
    res.setHeader('Content-Type', 'text/yaml')
    res.sendFile(swaggerPath)
  })
  
  // Ruta para obtener el swagger.json
  app.get('/swagger.json', (req, res) => {
    res.json(swaggerDocument)
  })
  
  // Iniciar servidor
  app.listen(PORT, () => {
    console.log('\n🚀 Servidor de documentación iniciado!')
    console.log(`\n📖 Documentación Swagger: http://localhost:${PORT}/api-docs`)
    console.log(`🏠 Página principal: http://localhost:${PORT}`)
    console.log(`📄 Swagger YAML: http://localhost:${PORT}/swagger.yaml`)
    console.log(`📄 Swagger JSON: http://localhost:${PORT}/swagger.json`)
    console.log('\n💡 Presiona Ctrl+C para detener el servidor\n')
  })
  
} catch (error) {
  console.error('❌ Error al cargar swagger.yaml:', error.message)
  process.exit(1)
}

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n👋 Cerrando servidor de documentación...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n👋 Cerrando servidor de documentación...')
  process.exit(0)
})