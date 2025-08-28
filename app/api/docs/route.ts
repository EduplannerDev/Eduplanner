import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'

export async function GET() {
  try {
    const swaggerPath = path.join(process.cwd(), 'swagger.yaml')
    
    // Verificar si el archivo existe
    if (!fs.existsSync(swaggerPath)) {
      return NextResponse.json(
        { error: 'Swagger documentation not found' },
        { status: 404 }
      )
    }
    
    // Cargar y parsear el archivo YAML
    const swaggerDoc = yaml.load(swaggerPath)
    
    // Actualizar la URL del servidor según el entorno
    const host = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === 'production'
      ? 'https://tu-app.vercel.app' // Reemplaza con tu dominio
      : 'http://localhost:3000'
    
    swaggerDoc.servers = [
      {
        url: host,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ]
    
    return NextResponse.json(swaggerDoc, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache por 1 hora
      }
    })
  } catch (error) {
    console.error('Error loading Swagger documentation:', error)
    return NextResponse.json(
      { error: 'Error loading documentation' },
      { status: 500 }
    )
  }
}

// Permitir CORS para desarrollo
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}