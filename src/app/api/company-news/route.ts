import { NextRequest, NextResponse } from 'next/server'
import { marketauxFetch, MarketauxError } from '@/lib/marketaux-helper'
import { logger } from '@/lib/logger'
import { CACHE_TTL } from '@/lib/cache'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const from = searchParams.get('from') || undefined
  const to = searchParams.get('to') || undefined

  if (!symbol) {
    return NextResponse.json({ error: 'Missing required query parameter: symbol', status: 400 }, { status: 400 })
  }

  try {
    logger.info('api/company-news', `Fetching company news for ${symbol}`, {
      from: from ?? 'default',
      to: to ?? 'default',
    })
    
    const params: Record<string, string> = {
      symbols: symbol,
      filter_entities: 'true',
      language: 'en',
    }
    if (from) params.published_after = from
    if (to) params.published_before = to

    const response = await marketauxFetch<{ data: unknown[] }>('news/all', params, CACHE_TTL.COMPANY_NEWS)
    const news = response.data || []
    return NextResponse.json({ news })
  } catch (err) {
    const status = err instanceof MarketauxError ? err.status : 500
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    logger.error('api/company-news', `Failed to fetch company news for ${symbol}`, { error: message })
    return NextResponse.json({ error: message, status }, { status })
  }
}