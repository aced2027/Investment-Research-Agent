/**
 * Lightweight Finnhub API helper for server-side API routes.
 * Separated from finnhub-client.ts to avoid Turbopack compilation crashes
 * when importing the full client module with its complex generic functions.
 */

import { FinnhubError } from './finnhub-types'
import { logger } from './logger'
import { apiCache, CACHE_TTL } from './cache'

const BASE_URL = 'https://finnhub.io/api/v1/'

export async function finnFetch<T>(
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

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  const url = new URL(`${BASE_URL}${cleanEndpoint}`)
  const key = (process.env.FINNHUB_API_KEY || '').trim();
  logger.info('finnhub', `Requesting ${endpoint} with token: ${key ? key.slice(0, 5) + '...' + key.slice(-5) : 'undefined'} (len: ${key.length})`);
  url.searchParams.set('token', key)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  const start = performance.now()
  try {
    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new FinnhubError(res.status, body.slice(0, 200) || res.statusText, endpoint)
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const body = await res.text().catch(() => '')
      logger.error('finnhub', `Non-JSON body from ${endpoint} (status ${res.status}): ${body.slice(0, 1000)}`)
      throw new FinnhubError(res.status, `Non-JSON response: ${body.slice(0, 200)}`, endpoint)
    }

    const text = await res.text()
    const data = JSON.parse(text) as T
    const duration = Math.round(performance.now() - start)
    logger.info('finnhub', `GET ${endpoint} — success (${duration}ms)`)

    apiCache.set(cacheKey, data, cacheTtl)
    return data
  } catch (err) {
    const duration = Math.round(performance.now() - start)
    if (err instanceof FinnhubError) throw err
    logger.error('finnhub', `GET ${endpoint} — failed (${duration}ms)`, { error: String(err) })
    throw new FinnhubError(500, String(err), endpoint)
  }
}