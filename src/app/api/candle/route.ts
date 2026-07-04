import { NextRequest, NextResponse } from 'next/server'
import { finnhubClient, FinnhubError } from '@/lib/finnhub-client'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const resolution = searchParams.get('resolution') || 'D'

  if (!symbol) {
    return NextResponse.json(
      { error: 'Missing required query parameter: symbol', status: 400 },
      { status: 400 }
    )
  }

  try {
    logger.info('api/candle', `Fetching candle data for ${symbol} (${resolution})`)
    const data = await finnhubClient.getCandles(
      symbol,
      resolution as 'D' | 'W' | 'M' | '5' | '15' | '60'
    )

    const candles = data.t.map((timestamp, i) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i],
    }))

    return NextResponse.json({ candles })
  } catch (err) {
    const status = err instanceof FinnhubError ? err.status : 500
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    logger.error('api/candle', `Failed to fetch candle data for ${symbol}`, { error: message })
    return NextResponse.json({ error: message, status }, { status })
  }
}