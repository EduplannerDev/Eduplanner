import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  let browser = null
  let page = null
  
  try {
    const { html, filename, options = {} } = await req.json()

    if (!html) {
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

    // Configuración para Puppeteer v24
    const puppeteerOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      timeout: 30000
    }

    // Lanzar Puppeteer con configuración optimizada
    console.log('Lanzando Puppeteer con opciones:', puppeteerOptions)
    browser = await puppeteer.launch(puppeteerOptions)
    console.log('Puppeteer lanzado exitosamente')

    page = await browser.newPage()

    // Configurar viewport
    await page.setViewport({
      width: defaultOptions.orientation === 'landscape' ? 1400 : 1200,
      height: defaultOptions.orientation === 'landscape' ? 900 : 1600,
      deviceScaleFactor: 2
    })

    // Cargar el HTML
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000
    })

    // Esperar que todo esté renderizado
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
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Generar PDF
    const pdfBuffer = await page.pdf({
      format: defaultOptions.format as any,
      landscape: defaultOptions.orientation === 'landscape',
      margin: defaultOptions.margin,
      printBackground: defaultOptions.printBackground,
      preferCSSPageSize: defaultOptions.preferCSSPageSize,
      timeout: 30000,
      scale: 1.0,
      displayHeaderFooter: false,
      omitBackground: false
    })

    // Cerrar página antes de retornar
    await page.close()
    page = null

    // Retornar el PDF como respuesta
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename || 'document.pdf'}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error generating PDF with Puppeteer:', error)
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