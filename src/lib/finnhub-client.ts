/**
 * Finnhub API Client
 *
 * Type-safe wrapper around the Finnhub REST API.
 * All methods handle errors, caching, and logging.
 *
 * Base URL: https://finnhub.io/api/v1
 */

import { logger } from './logger'
import { apiCache, CACHE_TTL } from './cache'

const BASE_URL = 'https://finnhub.io/api/v1'

function getApiKey(): string {
  const key = process.env.FINNHUB_API_KEY
  if (!key) {
    throw new Error(
      'FINNHUB_API_KEY is not set. Add it to your .env file.'
    )
  }
  return key
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class FinnhubError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly endpoint: string
  ) {
    super(`Finnhub ${endpoint} [${status}]: ${message}`)
    this.name = 'FinnhubError'
  }
}

export class FinnhubRateLimitError extends FinnhubError {
  constructor(endpoint: string) {
    super(429, 'Rate limit exceeded. Please wait before retrying.', endpoint)
    this.name = 'FinnhubRateLimitError'
  }
}

export class FinnhubNotFoundError extends FinnhubError {
  constructor(endpoint: string, symbol: string) {
    super(404, `No data found for symbol: ${symbol}`, endpoint)
    this.name = 'FinnhubNotFoundError'
  }
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function fetchFinnhub<T>(
  endpoint: string,
  params: Record<string, string> = {},
  cacheTtl?: number
): Promise<T> {
  const cacheKey = `finnhub:${endpoint}:${JSON.stringify(params)}`
  const cached = apiCache.get<T>(cacheKey)
  if (cached !== null) {
    logger.debug('cache', `HIT ${cacheKey}`)
    return cached
  }

  logger.debug('cache', `MISS ${cacheKey}`)

  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.set('token', getApiKey())
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  const result = await logger.time('finnhub', `GET ${endpoint}`, async () => {
    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      if (res.status === 429) throw new FinnhubRateLimitError(endpoint)
      throw new FinnhubError(res.status, body.slice(0, 200) || res.statusText, endpoint)
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const body = await res.text().catch(() => '')
      throw new FinnhubError(res.status, `Non-JSON response: ${body.slice(0, 200)}`, endpoint)
    }

    const text = await res.text()

    return JSON.parse(text) as T
  })

  // Only cache successful responses
  apiCache.set(cacheKey, result, cacheTtl)
  return result
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface Quote {
  c: number   // Current price
  h: number   // High price of the day
  l: number   // Low price of the day
  o: number   // Open price of the day
  pc: number  // Previous close price
  t: number   // Timestamp
  dp: number  // Percent change
  d: number   // Absolute change
}

export interface CompanyProfile {
  name: string
  ticker: string
  exchange: string
  mic: string
  industry: string
  country: string
  logo: string
  weburl: string
  ipo: string
  marketCapitalization: number
  shareOutstanding: number
  employees: number
  phone: string
  hq_address: string
  description: string
  currency: string
}

export interface NewsArticle {
  category: string
  datetime: number
  headline: string
  id: number
  image: string
  related: string
  source: string
  summary: string
  url: string
}

export interface Recommendation {
  buy: number
  hold: number
  period: string
  sell: number
  strongBuy: number
  strongSell: number
  symbol: string
}

export interface EarningsResult {
  symbol: string
  date: string
  estimate: number
  actual: number | null
  quarter: number
  year: number
}

export interface InsiderSentiment {
  symbol: string
  year: number
  month: number
  change: number
  mspr: number
}

export interface CandleResult {
  c: number[]  // Close prices
  h: number[]  // High prices
  l: number[]  // Low prices
  o: number[]  // Open prices
  t: number[]  // Timestamps
  v: number[]  // Volumes
  s: string    // Status ("ok" or "no_data")
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

export const finnhubClient = {
  /**
   * Get real-time quote for a symbol.
   * Endpoint: /stock/quote
   */
  async getQuote(symbol: string): Promise<Quote> {
    const data = await fetchFinnhub<Quote>('quote', { symbol }, CACHE_TTL.QUOTE)
    if (!data || data.c === 0) {
      throw new FinnhubNotFoundError('/stock/quote', symbol)
    }
    return data
  },

  /**
   * Get company profile.
   * Endpoint: /stock/profile2
   */
  async getProfile(symbol: string): Promise<CompanyProfile> {
    const data = await fetchFinnhub<CompanyProfile>('stock/profile2', { symbol }, CACHE_TTL.PROFILE)
    if (!data || !data.ticker) {
      throw new FinnhubNotFoundError('/stock/profile2', symbol)
    }
    return data
  },

  /**
   * Get general market news.
   * Endpoint: /news?category=general
   */
  async getMarketNews(category: string = 'general'): Promise<NewsArticle[]> {
    const data = await fetchFinnhub<NewsArticle[]>('news', { category }, CACHE_TTL.MARKET_NEWS)
    return Array.isArray(data) ? data : []
  },

  /**
   * Get company-specific news.
   * Endpoint: /company-news
   */
  async getCompanyNews(symbol: string, from?: string, to?: string): Promise<NewsArticle[]> {
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const params: Record<string, string> = { symbol }
    if (from) params.from = from
    else params.from = weekAgo.toISOString().split('T')[0]
    if (to) params.to = to
    else params.to = today.toISOString().split('T')[0]

    const data = await fetchFinnhub<NewsArticle[]>('company-news', params, CACHE_TTL.COMPANY_NEWS)
    return Array.isArray(data) ? data : []
  },

  /**
   * Get analyst recommendation trends.
   * Endpoint: /stock/recommendation
   */
  async getRecommendations(symbol: string): Promise<Recommendation[]> {
    const data = await fetchFinnhub<Recommendation[]>('stock/recommendation', { symbol }, CACHE_TTL.RECOMMENDATION)
    return Array.isArray(data) ? data : []
  },

  /**
   * Get earnings calendar.
   * Endpoint: /calendar/earnings
   */
  async getEarnings(from?: string, to?: string): Promise<EarningsResult[]> {
    const today = new Date()
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    const params: Record<string, string> = {}
    if (from) params.from = from
    else params.from = today.toISOString().split('T')[0]
    if (to) params.to = to
    else params.to = nextMonth.toISOString().split('T')[0]

    const data = await fetchFinnhub<{ earningsCalendar: EarningsResult[] }>('calendar/earnings', params, CACHE_TTL.EARNINGS)
    return data?.earningsCalendar ?? []
  },

  /**
   * Get insider sentiment data.
   * Endpoint: /stock/insider-sentiment
   */
  async getInsiderSentiment(symbol: string, from?: string, to?: string): Promise<InsiderSentiment[]> {
    const today = new Date()
    const sixMonthsAgo = new Date(today)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const params: Record<string, string> = { symbol }
    if (from) params.from = from
    else params.from = sixMonthsAgo.toISOString().split('T')[0]
    if (to) params.to = to
    else params.to = today.toISOString().split('T')[0]

    const data = await fetchFinnhub<{ data: InsiderSentiment[] }>('stock/insider-sentiment', params, CACHE_TTL.INSIDER)
    return data?.data ?? []
  },

  /**
   * Get candlestick data (OHLCV).
   * Endpoint: /stock/candle
   */
  async getCandles(
    symbol: string,
    resolution: 'D' | 'W' | 'M' | '5' | '15' | '60' = 'D',
    from?: number,
    to?: number
  ): Promise<CandleResult> {
    const now = Math.floor(Date.now() / 1000)
    const params: Record<string, string> = {
      symbol,
      resolution,
      from: String(from ?? now - 90 * 24 * 3600), // default 90 days
      to: String(to ?? now),
    }

    const data = await fetchFinnhub<CandleResult>('stock/candle', params, CACHE_TTL.CANDLE)
    if (data.s === 'no_data') {
      throw new FinnhubNotFoundError('/stock/candle', symbol)
    }
    return data
  },

  /**
   * Search for symbols (autocomplete).
   * Endpoint: /search
   */
  async searchSymbols(query: string): Promise<Array<{ symbol: string; description: string; type: string }>> {
    const data = await fetchFinnhub<Array<{ symbol: string; description: string; type: string }>>(
      'search',
      { q: query },
      5 * 60 * 1000
    )
    return Array.isArray(data) ? data.slice(0, 10) : []
  },
}