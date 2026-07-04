import { NextRequest, NextResponse } from 'next/server'
import { finnhubClient, FinnhubError } from '@/lib/finnhub-client'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')

  if (!symbol) {
    return NextResponse.json(
      { error: 'Missing required query parameter: symbol', status: 400 },
      { status: 400 }
    )
  }

  try {
    logger.info('api/profile', `Fetching profile for ${symbol}`)
    const profile = await finnhubClient.getProfile(symbol)
    return NextResponse.json(profile)
  } catch (err) {
    const status = err instanceof FinnhubError ? err.status : 500
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    logger.error('api/profile', `Failed to fetch profile for ${symbol}`, { error: message })
    return NextResponse.json({ error: message, status }, { status })
  }
}