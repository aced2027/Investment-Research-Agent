import { NextRequest, NextResponse } from 'next/server'
import { finnhubClient, FinnhubError } from '@/lib/finnhub-client'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const from = searchParams.get('from') || undefined
  const to = searchParams.get('to') || undefined

  if (!symbol) {
    return NextResponse.json(
      { error: 'Missing required query parameter: symbol', status: 400 },
      { status: 400 }
    )
  }

  try {
    logger.info('api/company-news', `Fetching company news for ${symbol}`, {
      from: from ?? 'default',
      to: to ?? 'default',
    })
    const news = await finnhubClient.getCompanyNews(symbol, from, to)
    return NextResponse.json({ news })
  } catch (err) {
    const status = err instanceof FinnhubError ? err.status : 500
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    logger.error('api/company-news', `Failed to fetch company news for ${symbol}`, {
      error: message,
    })
    return NextResponse.json({ error: message, status }, { status })
  }
}