import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  let browser = null
  let page = null
  
  try {
    console.log('🚀 [PDF] Iniciando generación de PDF')
    const { html, filename, options = {} } = await req.json()
    console.log('📄 [PDF] Datos recibidos:', { 
      hasHtml: !!html, 
      htmlLength: html?.length, 
      filename, 
      options 
    })

    if (!html) {
      console.log('❌ [PDF] Error: HTML content is required')
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 })
    }

    // Configuración por defecto para Puppeteer
    const defaultOptions = {
      format: 'A4',
      orientation: 'portrait',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true,
      preferCSSPageSize: false,
      ...options
    }

    // Configuración mínima para Puppeteer (compatible con Vercel)
    const puppeteerOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    }

    // Lanzar Puppeteer con configuración optimizada
    console.log('🔧 [PDF] Lanzando Puppeteer con opciones:', puppeteerOptions)
    try {
      browser = await puppeteer.launch(puppeteerOptions)
      console.log('✅ [PDF] Puppeteer lanzado exitosamente')
    } catch (launchError) {
      console.error('❌ [PDF] Error lanzando Puppeteer:', launchError)
      throw launchError
    }

    console.log('📄 [PDF] Creando nueva página')
    page = await browser.newPage()

    // Configurar viewport
    console.log('🖥️ [PDF] Configurando viewport')
    await page.setViewport({
      width: defaultOptions.orientation === 'landscape' ? 1400 : 1200,
      height: defaultOptions.orientation === 'landscape' ? 900 : 1600,
      deviceScaleFactor: 2
    })

    // Cargar el HTML
    console.log('📝 [PDF] Cargando HTML en la página')
    try {
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      })
      console.log('✅ [PDF] HTML cargado exitosamente')
    } catch (contentError) {
      console.error('❌ [PDF] Error cargando HTML:', contentError)
      throw contentError
    }

    // Esperar que todo esté renderizado
    console.log('⏳ [PDF] Esperando renderizado completo')
    await page.evaluate(() => {
      return new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve(true)
        } else {
          window.addEventListener('load', () => resolve(true))
        }
      })
    })

    // Esperar un poco para asegurar renderizado completo
    console.log('⏳ [PDF] Esperando 500ms adicionales')
    await new Promise(resolve => setTimeout(resolve, 500))

    // Generar PDF
    console.log('📄 [PDF] Generando PDF con opciones:', {
      format: defaultOptions.format,
      landscape: defaultOptions.orientation === 'landscape',
      margin: defaultOptions.margin,
      printBackground: defaultOptions.printBackground
    })
    try {
      const pdfBuffer = await page.pdf({
        format: defaultOptions.format as any,
        landscape: defaultOptions.orientation === 'landscape',
        margin: defaultOptions.margin,
        printBackground: defaultOptions.printBackground,
        preferCSSPageSize: defaultOptions.preferCSSPageSize,
        timeout: 15000,
        scale: 1.0,
        displayHeaderFooter: false,
        omitBackground: false
      })
      console.log('✅ [PDF] PDF generado exitosamente, tamaño:', pdfBuffer.length, 'bytes')
    } catch (pdfError) {
      console.error('❌ [PDF] Error generando PDF:', pdfError)
      throw pdfError
    }

    // Cerrar página antes de retornar
    console.log('🔒 [PDF] Cerrando página')
    await page.close()
    page = null

    // Retornar el PDF como respuesta
    console.log('📤 [PDF] Retornando PDF como respuesta')
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename || 'document.pdf'}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('❌ [PDF] Error general generando PDF:', error)
    console.error('❌ [PDF] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    // Cerrar página si aún está abierta
    if (page) {
      try {
        await page.close()
      } catch (closeError) {
        console.error('Error closing page:', closeError)
      }
    }
    
    // Cerrar browser si aún está abierto
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.error('Error closing browser:', closeError)
      }
    }
  }
}