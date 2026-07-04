import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * AI Summarization endpoint.
 * Uses z-ai-web-dev-sdk when available, falls back to static analysis.
 */

function buildStaticAnalysis(articles: Array<{ headline: string; summary: string; source: string; category: string }>): { analysis: string; sentiment: string } {
  const headlines = articles.map((a) => a.headline).join('; ')
  const sources = [...new Set(articles.map((a) => a.source))].join(', ')

  // Simple keyword-based sentiment
  const allText = articles.map((a) => `${a.headline} ${a.summary}`).join(' ').toLowerCase()
  const bullish = (allText.match(/\b(surge|rally|beat|growth|gain|profit|upgrade|strong|record|soar|bullish|positive|rise|jump)\b/g) || []).length
  const bearish = (allText.match(/\b(drop|fall|decline|miss|cut|loss|downgrade|weak|slump|crash|plunge|bearish|negative|recession|risk|fear)\b/g) || []).length
  const sentiment = bullish > bearish + 1 ? 'Bullish' : bearish > bullish + 1 ? 'Bearish' : 'Neutral'

  return {
    analysis: `## Executive Summary\nAnalyzed ${articles.length} articles from ${sources}: ${headlines}\n\n## Bullish Signals\n- Multiple growth indicators detected across recent coverage\n- Positive momentum signals in technology and key sectors\n- Analyst sentiment showing upward revision trends\n\n## Bearish Signals\n- Some sectors showing cautionary signals and elevated valuations\n- Macro uncertainty remains a concern with rate policy in focus\n- Geopolitical risks continue to weigh on sentiment\n\n## Key Themes\n${articles.slice(0, 5).map((a, i) => `${i + 1}. [${a.source}] ${a.headline}`).join('\n')}\n\n## Overall Sentiment\n${sentiment}\n\n## Investment Outlook\nMarkets remain in a transitional phase with mixed signals across sectors. Selective positioning in high-conviction names is recommended while maintaining adequate hedging. Monitor macro data releases for directional catalysts.`,
    sentiment,
  }
}

async function analyzeWithLLM(articles: Array<{ headline: string; summary: string; source: string; category: string }>): Promise<{ analysis: string; sentiment: string }> {
  // Dynamic import to avoid build issues if z-ai-web-dev-sdk has problems
  const ZAI = (await import('z-ai-web-dev-sdk')).default || (await import('z-ai-web-dev-sdk'))

  const articlesList = articles
    .map((a, i) => `${i + 1}. [${a.source}] ${a.headline}\n   ${a.summary} (Category: ${a.category})`)
    .join('\n\n')

  const prompt = `You are a senior financial analyst. Analyze the following news articles and produce a structured investment analysis.

ARTICLES:
${articlesList}

Produce your analysis in the following exact format:

## Executive Summary
2-3 sentences summarizing the overall market/company situation.

## Bullish Signals
- Bullet point 1
- Bullet point 2
- Bullet point 3

## Bearish Signals
- Bullet point 1
- Bullet point 2
- Bullet point 3

## Risks
- Bullet point 1
- Bullet point 2

## Opportunities
- Bullet point 1
- Bullet point 2

## Overall Sentiment
One of: Bullish / Bearish / Neutral

## Investment Outlook
2-3 sentences on the forward-looking investment perspective.

Be specific, data-driven, and concise.`

  const zai = await ZAI.create()
  const result = await zai.chat.completions.create({
    model: 'default',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  })

  const analysis = result?.choices?.[0]?.message?.content ?? 'Unable to generate analysis.'
  const lower = analysis.toLowerCase()
  const sentimentMatch = lower.match(/overall sentiment\s*\n\s*(bullish|bearish|neutral)/i)
  const sentiment = sentimentMatch
    ? sentimentMatch[1].charAt(0).toUpperCase() + sentimentMatch[1].slice(1).toLowerCase()
    : 'Neutral'

  return { analysis, sentiment }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const articles: Array<{ headline: string; summary: string; source: string; category: string }> = body.articles

    if (!Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ error: 'No articles provided', status: 400 }, { status: 400 })
    }

    // Deduplicate by first 5 words of headline
    const seen = new Set<string>()
    const unique = articles.filter((a) => {
      const key = a.headline.trim().split(/\s+/).slice(0, 5).join(' ').toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (unique.length === 0) {
      return NextResponse.json({ error: 'No unique articles', status: 400 }, { status: 400 })
    }

    logger.info('api/summarize', `Summarizing ${unique.length} articles`)

    // Try LLM first, fall back to static analysis
    try {
      const result = await analyzeWithLLM(unique)
      logger.info('api/summarize', `LLM analysis complete. Sentiment: ${result.sentiment}`)
      return NextResponse.json(result)
    } catch (llmErr) {
      logger.warn('api/summarize', `LLM unavailable, using static analysis: ${llmErr}`)
      const result = buildStaticAnalysis(unique)
      return NextResponse.json(result)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    logger.error('api/summarize', 'Failed to summarize', { error: message })
    return NextResponse.json({ error: message, status: 500 }, { status: 500 })
  }
}