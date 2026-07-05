import { NextRequest, NextResponse } from 'next/server'
import { marketauxFetch, MarketauxError } from '@/lib/marketaux-helper'
import { logger } from '@/lib/logger'
import { apiCache, CACHE_TTL } from '@/lib/cache'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'general'
  const refresh = searchParams.get('refresh') === 'true'

  if (refresh) {
    apiCache.invalidate('marketaux:news/all:')
  }

  try {
    logger.info('api/news', `Fetching market news using Marketaux`)
    // Fetch all English news
    const response = await marketauxFetch<{ data: unknown[] }>('news/all', { language: 'en' }, CACHE_TTL.MARKET_NEWS)
    const news = response.data || []
    return NextResponse.json({ news })
  } catch (err) {
    const status = err instanceof MarketauxError ? err.status : 500
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    logger.error('api/news', `Failed to fetch market news`, { error: message })
    return NextResponse.json({ error: message, status }, { status })
  }
}