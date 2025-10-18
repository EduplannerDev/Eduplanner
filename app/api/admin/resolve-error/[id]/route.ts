/**
 * API Route para resolver errores críticos
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    
    const resolvedParams = await params
    const { error } = await supabase
      .from('critical_errors')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error resolving critical error:', error)
    return NextResponse.json(
      { error: 'Failed to resolve error' },
      { status: 500 }
    )
  }
}
