import { NextRequest, NextResponse } from 'next/server'
import { FinnhubError } from '@/lib/finnhub-types'
import { finnFetch } from '@/lib/api-helper'
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
    const news = await finnFetch<unknown[]>('company-news', { symbol, from: from || '', to: to || '' }, CACHE_TTL.COMPANY_NEWS)
    return NextResponse.json({ news })
  } catch (err) {
    const status = err instanceof FinnhubError ? err.status : 500
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    logger.error('api/company-news', `Failed to fetch company news for ${symbol}`, { error: message })
    return NextResponse.json({ error: message, status }, { status })
  }
}