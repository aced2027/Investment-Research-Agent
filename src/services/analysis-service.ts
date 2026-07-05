/**
 * Analysis Service — combines multiple data sources for dashboard and analysis.
 * Falls back to mock data when Finnhub is unavailable.
 */

import { logger } from '@/lib/logger'
import { getStockQuote, getRecommendations, getInsiderSentiment, type StockQuote, type RecommendationData, type InsiderSentimentItem } from './stock-service'
import { getMarketNews, type NewsItem } from './news-service'
import { getFallbackIndices, getFallbackMovers, getFallbackInsights } from '@/lib/fallback-data'

export interface MarketIndex {
  name: string
  symbol: string
  value: number
  change: number
  changePercent: number
}

export interface TopMover {
  symbol: string
  name: string
  change: number
  price: number
}

export interface AIInsight {
  type: 'opportunity' | 'risk' | 'alert'
  text: string
  confidence: number
}

const INDEX_SYMBOLS: Array<{ name: string; symbol: string }> = [
  { name: 'S&P 500', symbol: 'SPY' },
  { name: 'NASDAQ', symbol: 'QQQ' },
  { name: 'DOW', symbol: 'DIA' },
  { name: 'Russell 2000', symbol: 'IWM' },
]

const TRACKED_TICKERS = [
  'AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN',
  'TSLA', 'XOM', 'JPM', 'META', 'V',
  'JNJ', 'WMT', 'PG', 'UNH', 'HD',
]

/**
 * Fetch market index data. Falls back to mock data.
 */
export async function getMarketIndices(): Promise<MarketIndex[]> {
  try {
    logger.info('analysis-service', 'Fetching market indices')
    const results = await Promise.allSettled(
      INDEX_SYMBOLS.map(async ({ name, symbol }) => {
        const quote = await getStockQuote(symbol)
        return { name, symbol, value: quote.price, change: quote.change, changePercent: quote.changePercent }
      })
    )
    const valid = results
      .filter((r): r is PromiseFulfilledResult<MarketIndex> => r.status === 'fulfilled' && r.value.value > 0)
      .map((r) => r.value)
    if (valid.length === 0) throw new Error('No valid index quotes')
    return valid
  } catch (err) {
    logger.warn('analysis-service', `Falling back to mock indices: ${err}`)
    return getFallbackIndices()
  }
}

/**
 * Fetch top gainers and losers. Falls back to mock data.
 */
export async function getTopMovers(): Promise<{ gainers: TopMover[]; losers: TopMover[] }> {
  try {
    logger.info('analysis-service', 'Fetching top movers')
    const results = await Promise.allSettled(
      TRACKED_TICKERS.map(async (symbol) => {
        const quote = await getStockQuote(symbol)
        return { symbol, name: symbol, change: quote.changePercent, price: quote.price }
      })
    )
    const valid = results
      .filter((r): r is PromiseFulfilledResult<TopMover> => r.status === 'fulfilled' && r.value.price > 0)
      .map((r) => r.value)
    if (valid.length === 0) throw new Error('No valid mover quotes')
    const sorted = [...valid].sort((a, b) => b.change - a.change)
    return {
      gainers: sorted.filter((t) => t.change > 0).slice(0, 5),
      losers: sorted.filter((t) => t.change < 0).reverse().slice(0, 5),
    }
  } catch (err) {
    logger.warn('analysis-service', `Falling back to mock movers: ${err}`)
    return getFallbackMovers()
  }
}

/**
 * Generate AI-style insights from real data.
 */
export function generateInsightsFromData(
  quote: StockQuote,
  recommendations: RecommendationData[],
  insiderData: InsiderSentimentItem[]
): AIInsight[] {
  const insights: AIInsight[] = []
  const latestRec = recommendations[0]

  if (latestRec) {
    const total = latestRec.strongBuy + latestRec.buy + latestRec.hold + latestRec.sell + latestRec.strongSell
    const bullishPct = total > 0 ? ((latestRec.strongBuy + latestRec.buy) / total) * 100 : 50

    if (bullishPct > 70) {
      insights.push({
        type: 'opportunity',
        text: `Strong analyst consensus on ${quote.symbol} — ${bullishPct.toFixed(0)}% of analysts rate it Buy or better. Latest period: ${latestRec.period}.`,
        confidence: Math.round(bullishPct),
      })
    } else if (bullishPct < 30) {
      insights.push({
        type: 'risk',
        text: `Bearish analyst sentiment on ${quote.symbol} — only ${bullishPct.toFixed(0)}% rate it Buy or better. Consider caution.`,
        confidence: Math.round(100 - bullishPct),
      })
    }
  }

  if (quote.changePercent > 2) {
    insights.push({
      type: 'opportunity',
      text: `${quote.symbol} is up ${quote.changePercent.toFixed(2)}% today with strong momentum. Volume-driven moves often continue in the short term.`,
      confidence: 72,
    })
  } else if (quote.changePercent < -2) {
    insights.push({
      type: 'alert',
      text: `${quote.symbol} is down ${Math.abs(quote.changePercent).toFixed(2)}% today. Monitor for support levels and potential institutional buying.`,
      confidence: 68,
    })
  }

  const recentInsider = insiderData.slice(-3)
  const avgMspr = recentInsider.length > 0
    ? recentInsider.reduce((sum, d) => sum + d.mspr, 0) / recentInsider.length
    : 0

  if (avgMspr > 2) {
    insights.push({
      type: 'opportunity',
      text: `Positive insider sentiment detected for ${quote.symbol} — MSPR averaging ${avgMspr.toFixed(1)} over recent months, indicating net insider buying.`,
      confidence: Math.min(95, Math.round(60 + avgMspr * 3)),
    })
  } else if (avgMspr < -2) {
    insights.push({
      type: 'risk',
      text: `Negative insider sentiment on ${quote.symbol} — MSPR averaging ${avgMspr.toFixed(1)}, suggesting insiders are net sellers.`,
      confidence: Math.min(95, Math.round(60 + Math.abs(avgMspr) * 3)),
    })
  }

  return insights
}

/**
 * Get a combined dashboard snapshot. Always succeeds via fallbacks.
 */
export async function getDashboardSnapshot() {
  logger.info('analysis-service', 'Building dashboard snapshot')

  const [indices, movers, news] = await Promise.all([
    getMarketIndices(),
    getTopMovers(),
    getMarketNews('general'),
  ])

  return { indices, movers, news }
}