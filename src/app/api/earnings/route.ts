import { NextRequest, NextResponse } from 'next/server'
import { finnhubClient, FinnhubError } from '@/lib/finnhub-client'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') || undefined
  const to = searchParams.get('to') || undefined

  try {
    logger.info('api/earnings', 'Fetching earnings calendar', {
      from: from ?? 'default',
      to: to ?? 'default',
    })
    const earnings = await finnhubClient.getEarnings(from, to)
    return NextResponse.json({ earnings })
  } catch (err) {
    const status = err instanceof FinnhubError ? err.status : 500
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    logger.error('api/earnings', 'Failed to fetch earnings calendar', { error: message })
    return NextResponse.json({ error: message, status }, { status })
  }
}