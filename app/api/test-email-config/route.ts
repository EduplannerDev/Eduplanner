import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      hasResendApiKey: !!process.env.RESEND_API_KEY,
      resendApiKeyLength: process.env.RESEND_API_KEY?.length || 0,
      resendApiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 5) || 'ninguna',
      fromEmail: process.env.FROM_EMAIL || 'no configurado',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'no configurado',
      nodeEnv: process.env.NODE_ENV
    };

    console.log('🔍 Configuración de email:', config);

    return NextResponse.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error verificando configuración:', error);
    return NextResponse.json(
      { error: 'Error verificando configuración' },
      { status: 500 }
    );
  }
}
