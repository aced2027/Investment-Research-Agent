import { NextRequest, NextResponse } from 'next/server'
import { FinnhubError } from '@/lib/finnhub-types'
import { finnFetch } from '@/lib/api-helper'
import { logger } from '@/lib/logger'
import { CACHE_TTL } from '@/lib/cache'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')

  if (!symbol) {
    return NextResponse.json({ error: 'Missing required query parameter: symbol', status: 400 }, { status: 400 })
  }

  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const params: Record<string, string> = {
      symbol,
      from: sixMonthsAgo.toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
    }

    logger.info('api/insider-sentiment', `Fetching insider sentiment for ${symbol}`)
    const data = await finnFetch<{ data: unknown[] }>('stock/insider-sentiment', params, CACHE_TTL.INSIDER)
    return NextResponse.json({ sentiment: data?.data ?? [] })
  } catch (err) {
    const status = err instanceof FinnhubError ? err.status : 500
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    logger.error('api/insider-sentiment', `Failed to fetch insider sentiment for ${symbol}`, { error: message })
    return NextResponse.json({ error: message, status }, { status })
  }
}