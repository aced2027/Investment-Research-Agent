/**
 * Fallback data module — used when Finnhub API is unavailable.
 * Provides mock data so the app remains functional.
 *
 * Exported functions mirror the service layer signatures.
 */

import {
  type StockQuote,
  type CompanyProfile,
  type Candle,
  type RecommendationData,
  type EarningsItem,
  type InsiderSentimentItem,
} from '@/services/stock-service'

import { type NewsItem } from '@/services/news-service'

import { tickerData, newsItems, sectorPerformance, topGainers, topLosers, aiInsights, generateTrendData } from '@/lib/market-data'

// --- Stock Service Fallbacks ---

export function getFallbackQuote(symbol: string): StockQuote {
  const t = tickerData[symbol]
  if (!t) {
    return {
      symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      open: 0,
      high: 0,
      low: 0,
      previousClose: 0,
    }
  }
  return {
    symbol: t.symbol,
    price: t.price,
    change: t.change,
    changePercent: t.changePercent,
    open: t.price - t.change * 0.3,
    high: t.price + Math.abs(t.change) * 0.5,
    low: t.price - Math.abs(t.change) * 0.7,
    previousClose: t.price - t.change,
  }
}

export function getFallbackProfile(symbol: string): CompanyProfile {
  const t = tickerData[symbol]
  return {
    name: t?.name || symbol,
    ticker: t?.symbol || symbol,
    industry: t?.sector || 'Technology',
    exchange: t ? 'NASDAQ' : 'N/A',
    country: 'United States',
    website: '',
    ipo: 'N/A',
    marketCap: t?.marketCap || 'N/A',
    logo: '',
    description: '',
    employees: 0,
    currency: 'USD',
  }
}

export function getFallbackCandles(symbol: string): Candle[] {
  const t = tickerData[symbol]
  if (!t) return []
  return t.priceHistory.map((p) => ({
    date: p.date,
    open: p.open,
    high: p.high,
    low: p.low,
    close: p.close,
    volume: p.volume,
  }))
}

export function getFallbackRecommendations(symbol: string): RecommendationData[] {
  const rating = tickerData[symbol]?.analystRating
  const base: RecommendationData = {
    strongBuy: rating === 'strong-buy' ? 12 : rating === 'buy' ? 5 : 2,
    buy: rating === 'strong-buy' ? 8 : rating === 'buy' ? 10 : 4,
    hold: rating === 'hold' ? 14 : 8,
    sell: rating === 'sell' ? 8 : 3,
    strongSell: rating === 'strong-sell' ? 6 : 1,
    period: '2026-06',
    symbol,
  }
  return [
    { ...base, period: '2026-04' },
    { ...base, period: '2026-05' },
    base,
  ]
}

export function getFallbackEarnings(): EarningsItem[] {
  return [
    { symbol: 'AAPL', date: '2026-07-15', estimate: 1.57, actual: null, quarter: 3, year: 2026 },
    { symbol: 'MSFT', date: '2026-07-22', estimate: 2.93, actual: null, quarter: 4, year: 2026 },
    { symbol: 'GOOGL', date: '2026-07-29', estimate: 1.85, actual: null, quarter: 2, year: 2026 },
    { symbol: 'AMZN', date: '2026-08-01', estimate: 1.15, actual: null, quarter: 2, year: 2026 },
    { symbol: 'NVDA', date: '2026-08-20', estimate: 0.65, actual: null, quarter: 2, year: 2026 },
  ]
}

export function getFallbackInsiderSentiment(symbol: string): InsiderSentimentItem[] {
  return [
    { symbol, year: 2026, month: 1, change: 1200, mspr: 2.3 },
    { symbol, year: 2026, month: 2, change: 800, mspr: 1.8 },
    { symbol, year: 2026, month: 3, change: -400, mspr: -0.9 },
    { symbol, year: 2026, month: 4, change: 1500, mspr: 3.1 },
    { symbol, year: 2026, month: 5, change: 600, mspr: 1.2 },
    { symbol, year: 2026, month: 6, change: 2000, mspr: 4.0 },
  ]
}

// --- News Service Fallbacks ---

export function getFallbackNews(): NewsItem[] {
  return newsItems.map((n, index) => {
    let ageMs = 0
    if (n.time.includes('hour')) {
      const hours = parseInt(n.time) || 1
      ageMs = hours * 60 * 60 * 1000
    } else if (n.time.includes('min')) {
      const mins = parseInt(n.time) || 5
      ageMs = mins * 60 * 1000
    } else if (n.time.includes('day')) {
      const days = parseInt(n.time) || 1
      ageMs = days * 24 * 60 * 60 * 1000
    }
    return {
      id: n.id,
      title: n.title,
      source: n.source,
      time: n.time,
      summary: n.summary,
      sentiment: n.sentiment,
      tickers: n.tickers,
      category: n.category,
      image: '',
      url: '#',
      timestamp: Date.now() - ageMs - index * 1000,
    }
  })
}

// --- Analysis Service Fallbacks ---

export function getFallbackIndices() {
  return [
    { name: 'S&P 500', symbol: 'SPY', value: 5532.18, change: 28.42, changePercent: 0.52 },
    { name: 'NASDAQ', symbol: 'QQQ', value: 17918.20, change: -45.30, changePercent: -0.25 },
    { name: 'DOW', symbol: 'DIA', value: 43287.65, change: 156.80, changePercent: 0.36 },
    { name: 'Russell 2000', symbol: 'IWM', value: 2085.42, change: 12.15, changePercent: 0.59 },
  ]
}

export function getFallbackMovers() {
  return {
    gainers: topGainers.map((g) => ({ symbol: g.symbol, name: g.name, change: g.change, price: g.price })),
    losers: topLosers.map((l) => ({ symbol: l.symbol, name: l.name, change: l.change, price: l.price })),
  }
}

export function getFallbackInsights() {
  return aiInsights
}