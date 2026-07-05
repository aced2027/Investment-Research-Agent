/**
 * Lightweight Marketaux API helper for server-side API routes.
 */

import { logger } from './logger'
import { apiCache } from './cache'

const BASE_URL = 'https://api.marketaux.com/v1/'

export class MarketauxError extends Error {
  constructor(public status: number, message: string, public endpoint: string) {
    super(`Marketaux ${endpoint} [${status}]: ${message}`)
    this.name = 'MarketauxError'
  }
}

export async function marketauxFetch<T>(
  endpoint: string,
  params: Record<string, string> = {},
  cacheTtl?: number
): Promise<T> {
  const cacheKey = `marketaux:${endpoint}:${JSON.stringify(params)}`
  const cached = apiCache.get<T>(cacheKey)
  if (cached !== null) {
    logger.debug('cache', `HIT ${cacheKey}`)
    return cached
  }

  logger.debug('cache', `MISS ${cacheKey}`)

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  const url = new URL(`${BASE_URL}${cleanEndpoint}`)
  const key = (process.env.MARKETAUX_API_KEY || '').trim();
  logger.info('marketaux', `Requesting ${endpoint} with token: ${key ? key.slice(0, 5) + '...' + key.slice(-5) : 'undefined'} (len: ${key.length})`);
  url.searchParams.set('api_token', key)
  
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, v)
    }
  }

  const start = performance.now()
  try {
    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new MarketauxError(res.status, body.slice(0, 200) || res.statusText, endpoint)
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const body = await res.text().catch(() => '')
      logger.error('marketaux', `Non-JSON body from ${endpoint} (status ${res.status}): ${body.slice(0, 1000)}`)
      throw new MarketauxError(res.status, `Non-JSON response: ${body.slice(0, 200)}`, endpoint)
    }

    const text = await res.text()
    const data = JSON.parse(text) as T
    const duration = Math.round(performance.now() - start)
    logger.info('marketaux', `GET ${endpoint} — success (${duration}ms)`)

    apiCache.set(cacheKey, data, cacheTtl)
    return data
  } catch (err) {
    const duration = Math.round(performance.now() - start)
    if (err instanceof MarketauxError) throw err
    logger.error('marketaux', `GET ${endpoint} — failed (${duration}ms)`, { error: String(err) })
    throw new MarketauxError(500, String(err), endpoint)
  }
}
