import { NextRequest, NextResponse } from 'next/server'
import { FinnhubError } from '@/lib/finnhub-types'
import { finnFetch } from '@/lib/api-helper'
import { logger } from '@/lib/logger'
import { CACHE_TTL } from '@/lib/cache'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') || undefined
  const to = searchParams.get('to') || undefined

  try {
    const params: Record<string, string> = {}
    if (from) params.from = from
    else params.from = new Date().toISOString().split('T')[0]
    if (to) params.to = to
    else {
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      params.to = nextMonth.toISOString().split('T')[0]
    }

    logger.info('api/earnings', 'Fetching earnings calendar', { from: params.from, to: params.to })
    const data = await finnFetch<{ earningsCalendar: unknown[] }>('calendar/earnings', params, CACHE_TTL.EARNINGS)
    return NextResponse.json({ earnings: data?.earningsCalendar ?? [] })
  } catch (err) {
    const status = err instanceof FinnhubError ? err.status : 500
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    logger.error('api/earnings', 'Failed to fetch earnings calendar', { error: message })
    return NextResponse.json({ error: message, status }, { status })
  }
}