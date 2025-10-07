import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Webhook debug endpoint funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headers = Object.fromEntries(req.headers.entries())
    
    console.log('🔍 Debug webhook recibido:', {
      method: req.method,
      url: req.url,
      bodyLength: body.length,
      hasStripeSignature: !!headers['stripe-signature'],
      userAgent: headers['user-agent'],
      contentType: headers['content-type']
    })

    return NextResponse.json({
      success: true,
      message: 'Debug webhook procesado',
      timestamp: new Date().toISOString(),
      bodyLength: body.length,
      hasStripeSignature: !!headers['stripe-signature'],
      contentType: headers['content-type'],
      userAgent: headers['user-agent']
    })
  } catch (error: any) {
    console.error('❌ Error en debug webhook:', error.message)
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    },
  })
}
