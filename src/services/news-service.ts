/**
 * News Service — fetches news from Finnhub API with mock fallback.
 * Provides methods for both market-wide and company-specific news.
 */

import { logger } from '@/lib/logger'
import { getFallbackNews } from '@/lib/fallback-data'

export interface NewsItem {
  id: string
  title: string
  source: string
  time: string
  summary: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  tickers: string[]
  category: string
  image: string
  url: string
}

/** Simple keyword-based sentiment heuristic */
function classifySentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const lower = text.toLowerCase()
  const bullishTerms = ['surge', 'rally', 'beat', 'exceeded', 'growth', 'gain', 'profit', 'upgrade', 'strong', 'record', 'jump', 'soar', 'bullish', 'positive', 'boom', 'rise', 'up']
  const bearishTerms = ['drop', 'fall', 'decline', 'miss', 'cut', 'loss', 'downgrade', 'weak', 'slump', 'crash', 'plunge', 'bearish', 'negative', 'recession', 'risk', 'fear', 'warning', 'debt', 'inflation']

  let bullishScore = 0
  let bearishScore = 0
  for (const term of bullishTerms) { if (lower.includes(term)) bullishScore++ }
  for (const term of bearishTerms) { if (lower.includes(term)) bearishScore++ }

  if (bullishScore > bearishScore + 1) return 'bullish'
  if (bearishScore > bullishScore + 1) return 'bearish'
  return 'neutral'
}

function extractTickers(related: string): string[] {
  if (!related) return []
  return related.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5)
}

function formatRelativeTime(datetime: number): string {
  const diffMs = Date.now() - datetime * 1000
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function transformArticle(article: { headline: string; summary: string; source: string; category: string; datetime: number; id: number; image: string; url: string; related: string }): NewsItem {
  const text = `${article.headline} ${article.summary}`
  return {
    id: String(article.id),
    title: article.headline,
    source: article.source,
    time: formatRelativeTime(article.datetime),
    summary: article.summary,
    sentiment: classifySentiment(text),
    tickers: extractTickers(article.related),
    category: article.category || 'General',
    image: article.image || '',
    url: article.url,
  }
}

let _lastNewsSource: 'live' | 'fallback' = 'live'

/** Returns whether the most recent news fetch used live or fallback data */
export function getNewsDataSource(): 'live' | 'fallback' { return _lastNewsSource }

/**
 * Fetch general market news. Falls back to mock data on error.
 */
export async function getMarketNews(category: string = 'general'): Promise<NewsItem[]> {
  try {
    logger.info('news-service', `Fetching market news (category: ${category})`)
    const res = await fetch(`/api/news?category=${encodeURIComponent(category)}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const body = await res.json()
    // If the API returned an error object, treat as failure
    if (body.error) throw new Error(body.error)
    // API route returns { news: [...] }
    const articles = body.news ?? body
    if (!Array.isArray(articles) || articles.length === 0) throw new Error('No news articles')
    _lastNewsSource = 'live'
    return articles.map(transformArticle)
  } catch (err) {
    logger.warn('news-service', `Falling back to mock market news: ${err}`)
    _lastNewsSource = 'fallback'
    return getFallbackNews()
  }
}

/**
 * Fetch company-specific news. Falls back to empty on error.
 */
export async function getCompanyNews(symbol: string, from?: string, to?: string): Promise<NewsItem[]> {
  try {
    logger.info('news-service', `Fetching company news for ${symbol}`)
    const params = new URLSearchParams({ symbol })
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const res = await fetch(`/api/company-news?${params}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const body = await res.json()
    // API route returns { news: [...] }
    const articles = body.news ?? body
    if (!Array.isArray(articles)) throw new Error('Invalid response')
    return articles.map(transformArticle)
  } catch (err) {
    logger.warn('news-service', `No company news available for ${symbol}: ${err}`)
    return []
  }
}

/**
 * Call the AI summarization endpoint. Falls back to a static summary on error.
 */
export async function summarizeArticles(
  articles: Array<{ headline: string; summary: string; source: string; category: string }>
): Promise<{ analysis: string; sentiment: string }> {
  try {
    logger.info('news-service', `Requesting AI summarization for ${articles.length} articles`)
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    logger.warn('news-service', `AI summarization unavailable, using static summary: ${err}`)
    const headlines = articles.map((a) => a.headline).join('; ')
    return {
      analysis: `## Executive Summary\nThe following headlines were analyzed: ${headlines}\n\n## Bullish Signals\n- Multiple growth indicators detected in recent coverage\n- Positive momentum in technology and AI sectors\n\n## Bearish Signals\n- Some sectors showing cautionary signals\n- Macro uncertainty remains elevated\n\n## Overall Sentiment\nNeutral\n\n## Investment Outlook\nMarkets remain in a transitional phase. Selective positioning is recommended while monitoring macro developments.`,
      sentiment: 'Neutral',
    }
  }
}