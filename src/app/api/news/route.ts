import { NextRequest, NextResponse } from 'next/server'
import { finnhubClient, FinnhubError } from '@/lib/finnhub-client'
import { logger } from '@/lib/logger'
import { apiCache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'general'
  const refresh = searchParams.get('refresh') === 'true'

  // Bypass cache when client requests fresh data
  if (refresh) {
    apiCache.invalidate('finnhub:news:')
  }

  try {
    logger.info('api/news', `Fetching market news for category: ${category}`)
    const news = await finnhubClient.getMarketNews(category)
    return NextResponse.json({ news })
  } catch (err) {
    const status = err instanceof FinnhubError ? err.status : 500
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    logger.error('api/news', `Failed to fetch market news`, { error: message })
    return NextResponse.json({ error: message, status }, { status })
  }
}