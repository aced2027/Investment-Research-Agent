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
    logger.info('api/recommendation', `Fetching recommendations for ${symbol}`)
    const recommendations = await finnFetch<unknown[]>('stock/recommendation', { symbol }, CACHE_TTL.RECOMMENDATION)
    return NextResponse.json({ recommendations })
  } catch (err) {
    const status = err instanceof FinnhubError ? err.status : 500
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    logger.error('api/recommendation', `Failed to fetch recommendations for ${symbol}`, { error: message })
    return NextResponse.json({ error: message, status }, { status })
  }
}