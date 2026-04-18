import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * GET /api/health
 * Shallow liveness + deeper DB health check. The DB check uses a lightweight
 * SECURITY DEFINER function `db_health()` that confirms a basic query works
 * without requiring the caller to be authenticated.
 */
export async function GET() {
  const timestamp = new Date().toISOString()
  const supabase = createSupabaseServerClient()

  try {
    const { data, error } = await supabase.rpc('db_health')
    if (error) {
      return NextResponse.json(
        { status: 'degraded', db: 'error', error: error.message, timestamp },
        { status: 200 }
      )
    }
    return NextResponse.json({ status: 'ok', db: data ?? 'ok', timestamp })
  } catch (err) {
    return NextResponse.json(
      { status: 'degraded', db: 'unreachable', error: (err as Error).message, timestamp },
      { status: 200 }
    )
  }
}
