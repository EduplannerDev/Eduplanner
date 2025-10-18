import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface LogEntry {
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'
  category: string
  message: string
  context?: Record<string, any>
  timestamp: number
  sessionId?: string
  userId?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { logs }: { logs: LogEntry[] } = body

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json(
        { error: 'No logs provided' },
        { status: 400 }
      )
    }

    // Preparar datos para insertar en la base de datos
    const logEntries = logs.map(log => ({
      level: log.level,
      category: log.category,
      message: log.message,
      context: log.context ? JSON.stringify(log.context) : null,
      timestamp: new Date(log.timestamp).toISOString(),
      session_id: log.sessionId,
      user_id: log.userId,
      created_at: new Date().toISOString()
    }))

    // Insertar logs en lote
    const { error } = await supabase
      .from('error_logs')
      .insert(logEntries)

    if (error) {
      console.error('Error inserting logs:', error)
      return NextResponse.json(
        { error: 'Failed to save logs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${logs.length} logs`
    })

  } catch (error) {
    console.error('Error in logs batch endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}