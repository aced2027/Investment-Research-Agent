import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages must be a valid array.' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      logger.error('api/chat', 'OPENROUTER_API_KEY is not defined in environment variables')
      return NextResponse.json({ error: 'OpenRouter API key is not configured.' }, { status: 500 })
    }

    // System prompt guiding the assistant to act as a financial investment research assistant.
    const systemMessage = {
      role: 'system',
      content: `You are InvestIQ AI, an advanced conversational investment research assistant. 
Your goal is to help the user synthesize financial data, analyze market trends, evaluate risks, and research specific stock tickers.
Provide clear, structured, and insightful answers. Use bolding, lists, and bullet points to make your responses easy to read. 
Keep your analysis objective, data-driven, and balanced, pointing out both potential upside and downside risks. Keep responses relatively concise and focused on high-quality financial insights.`
    }

    // Combine system prompt with client messages
    const apiMessages = [systemMessage, ...messages]

    logger.info('api/chat', `Sending request to OpenRouter with ${messages.length} conversation messages.`)

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'InvestIQ AI Research Agent',
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-super-120b-a12b:free',
        messages: apiMessages,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('api/chat', `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`)
      return NextResponse.json({ error: `API error: ${response.statusText}` }, { status: response.status })
    }

    const data = await response.json()
    const resultMessage = data.choices?.[0]?.message

    if (!resultMessage) {
      logger.error('api/chat', 'Invalid response from OpenRouter API', { data })
      return NextResponse.json({ error: 'Invalid response from AI provider' }, { status: 502 })
    }

    logger.info('api/chat', `Received response from OpenRouter: "${resultMessage.content.slice(0, 50)}..."`)

    return NextResponse.json(resultMessage)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    logger.error('api/chat', 'Error in chat API route', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
