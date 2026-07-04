import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import ZAI from 'z-ai-web-dev-sdk'

interface Article {
  headline: string
  summary: string
  source: string
  category: string
}

/**
 * Deduplicate articles by comparing the first 5 words of each headline.
 * If two headlines share the same first 5 words, keep only the first one.
 */
function deduplicateArticles(articles: Article[]): Article[] {
  const seen = new Set<string>()
  const result: Article[] = []

  for (const article of articles) {
    const words = article.headline.trim().split(/\s+/).slice(0, 5)
    const key = words.join(' ').toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(article)
    }
  }

  return result
}

function buildAnalysisPrompt(articles: Article[]): string {
  const articlesList = articles
    .map(
      (a, i) =>
        `${i + 1}. [${a.source}] ${a.headline}\n   ${a.summary} (Category: ${a.category})`
    )
    .join('\n\n')

  return `You are a senior financial analyst. Analyze the following news articles and produce a structured investment analysis.

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
- Bullet point 3

## Opportunities
- Bullet point 1
- Bullet point 2
- Bullet point 3

## Overall Sentiment
One of: Bullish / Bearish / Neutral

## Investment Outlook
2-3 sentences on the forward-looking investment perspective.

Be specific, data-driven, and concise. Reference specific details from the articles.`
}

/**
 * Extract the overall sentiment from the LLM response.
 */
function extractSentiment(analysis: string): string {
  const lower = analysis.toLowerCase()
  // Look for the "Overall Sentiment" section
  const sentimentMatch = lower.match(/overall sentiment\s*\n\s*(bullish|bearish|neutral)/i)
  if (sentimentMatch) {
    return sentimentMatch[1].charAt(0).toUpperCase() + sentimentMatch[1].slice(1).toLowerCase()
  }
  // Fallback: count keyword occurrences
  const bullishCount = (lower.match(/\bbullish\b/g) || []).length
  const bearishCount = (lower.match(/\bbearish\b/g) || []).length
  if (bullishCount > bearishCount) return 'Bullish'
  if (bearishCount > bullishCount) return 'Bearish'
  return 'Neutral'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const articles: Article[] = body.articles

    if (!Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json(
        { error: 'Request body must contain a non-empty "articles" array', status: 400 },
        { status: 400 }
      )
    }

    logger.info('api/summarize', `Summarizing ${articles.length} articles`)

    // Step 1: Deduplicate
    const unique = deduplicateArticles(articles)
    logger.info('api/summarize', `Deduplicated to ${unique.length} unique articles`)

    if (unique.length === 0) {
      return NextResponse.json(
        { error: 'No unique articles to analyze after deduplication', status: 400 },
        { status: 400 }
      )
    }

    // Step 2: Build prompt
    const prompt = buildAnalysisPrompt(unique)

    // Step 3: Call LLM
    logger.info('api/summarize', 'Calling LLM for analysis')
    const zai = await ZAI.create()
    const result = await zai.chat.completions.create({
      model: 'default',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    })

    const analysis =
      result?.choices?.[0]?.message?.content ?? 'Unable to generate analysis.'

    // Step 4: Extract sentiment
    const sentiment = extractSentiment(analysis)

    logger.info('api/summarize', `Analysis complete. Sentiment: ${sentiment}`)

    return NextResponse.json({ analysis, sentiment })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    logger.error('api/summarize', 'Failed to summarize articles', { error: message })
    return NextResponse.json({ error: message, status: 500 }, { status: 500 })
  }
}