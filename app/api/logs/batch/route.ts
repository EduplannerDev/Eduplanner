/**
 * API Route ultra-optimizada para recibir logs en lote
 * - Inserción masiva en base de datos
 * - Validación mínima
 * - Sin autenticación (para no afectar rendimiento)
 * - Timeout corto
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  // Timeout muy corto para no bloquear
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos máximo

  try {
    const { logs } = await req.json();

    // Validación mínima
    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    // Limitar número de logs por request
    const limitedLogs = logs.slice(0, 200);

    // Preparar datos para inserción masiva
    const logData = limitedLogs.map(log => ({
      level: log.level,
      category: log.category,
      message: log.message.substring(0, 500), // Limitar longitud
      context: log.context ? JSON.stringify(log.context) : null,
      session_id: log.sessionId || null,
      user_id: log.userId || null,
      created_at: new Date(log.timestamp).toISOString()
    }));

    // Inserción masiva optimizada
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('system_logs_lightweight')
      .insert(logData);

    if (error) {
      console.error('Error inserting logs:', error);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      processed: logData.length
    });

  } catch (error) {
    console.error('Log batch error:', error);
    return NextResponse.json(
      { success: false, error: 'Processing error' },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// Endpoint para métricas de rendimiento (ultra-ligero)
export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    
    // Solo contar logs recientes (muy rápido)
    const { count } = await supabase
      .from('system_logs_lightweight')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    return NextResponse.json({
      logsLast24h: count || 0,
      timestamp: Date.now()
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to get metrics' }, { status: 500 });
  }
}
