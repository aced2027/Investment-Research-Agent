'use client'

import { useState, useRef, useEffect, useSyncExternalStore } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  Brain,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Info,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export function AIAgentScreen() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to InvestIQ AI Research Agent. I can help you analyze market trends, research specific tickers, assess risk factors, and summarize news. What would you like to explore today?',
      timestamp: '',
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim() || isTyping) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    
    // Add user message immediately
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      // Build conversation history for API payload, filtering out welcoming message
      const history = messages
        .filter((msg) => msg.id !== 'welcome')
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

      const payloadMessages = [...history, { role: 'user', content: query.trim() }]

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: payloadMessages }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch response from chatbot assistant.')
      }

      const reply = await res.json()
      
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: reply.content || 'No response content returned.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'An unexpected error occurred.'
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `⚠️ **Error:** ${errMsg}\n\nPlease try again or verify that your API key is correctly configured.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, aiMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const resetChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Welcome to InvestIQ AI Research Agent. I can help you analyze market trends, research specific tickers, assess risk factors, and summarize news. What would you like to explore today?',
        timestamp: '',
      },
    ])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="w-7 h-7 text-primary" />
            AI Research Agent
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Leverage artificial intelligence to synthesize data, analyze risks, and research tickers.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetChat}
          className="border-border hover:bg-muted/50 self-start sm:self-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Chat Panel */}
        <Card className="lg:col-span-8 bg-card border-border flex flex-col h-[calc(100vh-14rem)] min-h-[500px]">
          <CardHeader className="pb-3 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <CardTitle className="text-sm font-semibold">Conversational Intelligence</CardTitle>
                <div className="w-2 h-2 rounded-full bg-primary ai-pulse" />
              </div>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/20 bg-primary/5">
                Model V1.2-Active
              </Badge>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed shadow-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/30 border border-border text-foreground'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.timestamp && (
                      <span className="text-[10px] opacity-45 mt-2 block text-right">
                        {mounted ? msg.timestamp : '\u00A0'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted/30 border border-border rounded-lg px-5 py-4">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border shrink-0 bg-muted/10">
            <div className="max-w-3xl mx-auto space-y-3">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend() }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Ask about markets, NVDA, risk..."
                  className="bg-card border-border focus-visible:ring-primary focus-visible:ring-1 text-sm h-10"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isTyping}
                />
                <Button
                  type="submit"
                  size="default"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 h-10 px-4"
                  disabled={isTyping || !input.trim()}
                >
                  {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>

              {/* Suggestions quick chips */}
              <div className="flex gap-1.5 flex-wrap">
                {['Market overview', 'Analyze NVDA', 'Risk assessment'].map((q) => (
                  <button
                    key={q}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-muted/65 border border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/45 transition-colors"
                    onClick={() => { handleSend(q); }}
                    disabled={isTyping}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Sidebar Info/Capabilities Column */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-gain" />
                  Ticker Diagnostics
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Get high-level operational analysis and performance profiles for individual assets like **NVDA**.
                </p>
              </div>
              <Separator className="bg-border/60" />
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-loss" />
                  Risk Synthesis
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Evaluate current geopolitical risk factors, sector weights, concentration limits, and get hedging advice.
                </p>
              </div>
              <Separator className="bg-border/60" />
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-primary" />
                  Market Intelligence
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ask for an aggregate summary of standard indexes, positive/negative catalysts, and sector rotations.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                About InvestIQ AI
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Our models combine live news feeds, company reports, and historical price vectors to generate concise executive digests. All data is cached and updated dynamically.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
