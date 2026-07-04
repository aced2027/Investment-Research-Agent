import { NextRequest, NextResponse } from 'next/server'
import { FinnhubError } from '@/lib/finnhub-types'
import { finnFetch } from '@/lib/api-helper'
import { logger } from '@/lib/logger'
import { CACHE_TTL } from '@/lib/cache'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const resolution = searchParams.get('resolution') || 'D'

  if (!symbol) {
    return NextResponse.json({ error: 'Missing required query parameter: symbol', status: 400 }, { status: 400 })
  }

  try {
    logger.info('api/candle', `Fetching candle data for ${symbol} (${resolution})`)
    const data = await finnFetch<Record<string, unknown>>('stock/candle', {
      symbol,
      resolution,
      from: String(Math.floor(Date.now() / 1000) - 90 * 24 * 3600),
      to: String(Math.floor(Date.now() / 1000)),
    }, CACHE_TTL.CANDLE)

    const t = data.t as number[]
    const o = data.o as number[]
    const h = data.h as number[]
    const l = data.l as number[]
    const c = data.c as number[]
    const v = data.v as number[]

    const candles = t.map((timestamp, i) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      open: o[i],
      high: h[i],
      low: l[i],
      close: c[i],
      volume: v[i],
    }))

    return NextResponse.json({ candles })
  } catch (err) {
    const status = err instanceof FinnhubError ? err.status : 500
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    logger.error('api/candle', `Failed to fetch candle data for ${symbol}`, { error: message })
    return NextResponse.json({ error: message, status }, { status })
  }
}