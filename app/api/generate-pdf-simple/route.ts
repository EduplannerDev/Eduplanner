import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { html, filename, options = {} } = await request.json()

    if (!html) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      )
    }

    // Retornar el HTML para que el cliente lo procese con jsPDF/html2canvas
    return NextResponse.json({
      success: true,
      html,
      filename: filename || 'document.pdf',
      options
    })

  } catch (error) {
    console.error('Error in generate-pdf-simple:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}