import { NextRequest, NextResponse } from 'next/server'
import { FinnhubError } from '@/lib/finnhub-types'
import { finnFetch } from '@/lib/api-helper'
import { logger } from '@/lib/logger'
import { apiCache, CACHE_TTL } from '@/lib/cache'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'general'
  const refresh = searchParams.get('refresh') === 'true'

  if (refresh) {
    apiCache.invalidate('finnhub:news:')
  }

  try {
    logger.info('api/news', `Fetching market news for category: ${category}`)
    const news = await finnFetch<unknown[]>('news', { category }, CACHE_TTL.MARKET_NEWS)
    return NextResponse.json({ news })
  } catch (err) {
    const status = err instanceof FinnhubError ? err.status : 500
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    logger.error('api/news', `Failed to fetch market news`, { error: message })
    return NextResponse.json({ error: message, status }, { status })
  }
}