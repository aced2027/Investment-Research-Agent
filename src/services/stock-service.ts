/**
 * Stock Service — fetches and transforms stock data from Finnhub API.
 * Falls back to local mock data when the API is unavailable.
 */

import { logger } from '@/lib/logger'
import {
  getFallbackQuote,
  getFallbackProfile,
  getFallbackCandles,
  getFallbackRecommendations,
  getFallbackEarnings,
  getFallbackInsiderSentiment,
} from '@/lib/fallback-data'

export interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  previousClose: number
}

export interface CompanyProfile {
  name: string
  ticker: string
  industry: string
  exchange: string
  country: string
  website: string
  ipo: string
  marketCap: string
  logo: string
  description: string
  employees: number
  currency: string
}

export interface Candle {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface RecommendationData {
  strongBuy: number
  buy: number
  hold: number
  sell: number
  strongSell: number
  period: string
  symbol?: string
}

export interface EarningsItem {
  symbol: string
  date: string
  estimate: number
  actual: number | null
  quarter: number
  year: number
}

export interface InsiderSentimentItem {
  symbol: string
  year: number
  month: number
  change: number
  mspr: number
}

function formatMarketCap(raw: number): string {
  if (raw >= 1e12) return `$${(raw / 1e12).toFixed(2)}T`
  if (raw >= 1e9) return `$${(raw / 1e9).toFixed(2)}B`
  if (raw >= 1e6) return `$${(raw / 1e6).toFixed(2)}M`
  return `$${raw.toLocaleString()}`
}

/**
 * Fetch a real-time stock quote. Falls back to mock data on error.
 */
export async function getStockQuote(symbol: string): Promise<StockQuote> {
  try {
    logger.info('stock-service', `Fetching quote for ${symbol}`)
    const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const q = await res.json()
    if (!q.c || q.c === 0) throw new Error('No quote data')
    return {
      symbol,
      price: q.c,
      change: q.d,
      changePercent: q.dp,
      open: q.o,
      high: q.h,
      low: q.l,
      previousClose: q.pc,
    }
  } catch (err) {
    logger.warn('stock-service', `Falling back to mock quote for ${symbol}: ${err}`)
    return getFallbackQuote(symbol)
  }
}

/**
 * Fetch company profile. Falls back on error.
 */
export async function getCompanyProfile(symbol: string): Promise<CompanyProfile> {
  try {
    logger.info('stock-service', `Fetching profile for ${symbol}`)
    const res = await fetch(`/api/profile?symbol=${encodeURIComponent(symbol)}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const p = await res.json()
    if (!p.ticker) throw new Error('No profile data')
    return {
      name: p.name || symbol,
      ticker: p.ticker || symbol,
      industry: p.industry || 'N/A',
      exchange: p.exchange || 'N/A',
      country: p.country || 'N/A',
      website: p.weburl || '',
      ipo: p.ipo || 'N/A',
      marketCap: formatMarketCap(p.marketCapitalization || 0),
      logo: p.logo || '',
      description: p.description || '',
      employees: p.employees || 0,
      currency: p.currency || 'USD',
    }
  } catch (err) {
    logger.warn('stock-service', `Falling back to mock profile for ${symbol}: ${err}`)
    return getFallbackProfile(symbol)
  }
}

/**
 * Fetch candlestick data. Falls back on error.
 */
export async function getCandles(symbol: string, resolution: string = 'D'): Promise<Candle[]> {
  try {
    logger.info('stock-service', `Fetching candles for ${symbol} (${resolution})`)
    const res = await fetch(`/api/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!data.candles || data.candles.length === 0) throw new Error('No candle data')
    return data.candles
  } catch (err) {
    logger.warn('stock-service', `Falling back to mock candles for ${symbol}: ${err}`)
    return getFallbackCandles(symbol)
  }
}

/**
 * Fetch analyst recommendation trends. Falls back on error.
 */
export async function getRecommendations(symbol: string): Promise<RecommendationData[]> {
  try {
    logger.info('stock-service', `Fetching recommendations for ${symbol}`)
    const res = await fetch(`/api/recommendation?symbol=${encodeURIComponent(symbol)}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) throw new Error('No recommendation data')
    return data
  } catch (err) {
    logger.warn('stock-service', `Falling back to mock recommendations for ${symbol}: ${err}`)
    return getFallbackRecommendations(symbol)
  }
}

/**
 * Fetch earnings calendar. Falls back on error.
 */
export async function getEarnings(from?: string, to?: string): Promise<EarningsItem[]> {
  try {
    logger.info('stock-service', 'Fetching earnings calendar')
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const res = await fetch(`/api/earnings?${params}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) throw new Error('No earnings data')
    return data
  } catch (err) {
    logger.warn('stock-service', `Falling back to mock earnings: ${err}`)
    return getFallbackEarnings()
  }
}

/**
 * Fetch insider sentiment. Falls back on error.
 */
export async function getInsiderSentiment(symbol: string): Promise<InsiderSentimentItem[]> {
  try {
    logger.info('stock-service', `Fetching insider sentiment for ${symbol}`)
    const res = await fetch(`/api/insider-sentiment?symbol=${encodeURIComponent(symbol)}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) throw new Error('No insider data')
    return data
  } catch (err) {
    logger.warn('stock-service', `Falling back to mock insider sentiment for ${symbol}: ${err}`)
    return getFallbackInsiderSentiment(symbol)
  }
}