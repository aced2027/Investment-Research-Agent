'use client'

import { useState, useRef, useEffect, useMemo, useSyncExternalStore } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Sparkles,
  Bot,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Send,
  Loader2,
  BarChart3,
  Activity,
  Zap,
  Brain,
  Eye,
  Rss,
  RefreshCw,
} from 'lucide-react'
import {
  marketIndices,
  sectorPerformance,
  topGainers,
  topLosers,
  aiInsights,
  tickerData,
} from '@/lib/market-data'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'

const tickerTape = [
  { symbol: 'AAPL', price: 228.68, change: 1.52 },
  { symbol: 'NVDA', price: 131.88, change: 4.12 },
  { symbol: 'MSFT', price: 442.57, change: -0.48 },
  { symbol: 'GOOGL', price: 192.40, change: 0.98 },
  { symbol: 'AMZN', price: 198.56, change: 2.12 },
  { symbol: 'TSLA', price: 248.42, change: -2.66 },
  { symbol: 'XOM', price: 108.32, change: -3.09 },
  { symbol: 'JPM', price: 214.85, change: 0.58 },
]

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const aiResponses: Record<string, string> = {
  default: "I've analyzed the current market conditions. The S&P 500 is showing strength with a 0.52% gain today, driven primarily by technology and healthcare sectors. Key observations:\n\n• **Mega-cap tech** continues to lead the rally with NVIDIA up 4.12%\n• **Energy sector** under pressure due to OPEC+ production increase\n• **Fed pivot** expectations are supporting risk-on sentiment\n\nWould you like me to dive deeper into any specific area?",
  nvda: "Here's my analysis on NVIDIA (NVDA):\n\n**Current Price:** $131.88 (+4.12%)\n**Market Cap:** $3.24T\n\n**Key Observations:**\n• Record Q2 revenue of $30B exceeded consensus by 12%\n• Data center revenue grew 250% YoY — AI demand remains insatiable\n• Gross margin expanded to 78.4%, indicating strong pricing power\n• Supply chain constraints are the primary growth limiter\n\n**Risk Factors:**\n• P/E of 65.2x reflects elevated expectations\n• Any demand slowdown could trigger multiple compression\n• Increasing competition from AMD and custom silicon\n\n**My Assessment:** Strong buy on dips above $120. Key resistance at $140.76 (52W high).",
  market: "**Market Overview — July 4, 2026:**\n\nThe market shows a mixed picture today:\n\n**Positive Signals:**\n• S&P 500 up 0.52% — breadth improving\n• Russell 2000 leading with 0.59% gain — small-cap rotation beginning\n• VIX compressed below 14 — low fear environment\n\n**Concerns:**\n• NASDAQ declining 0.25% — tech profit-taking\n• Energy sector down 2.15% on OPEC+ news\n• China PMI contracting for 3rd month\n\n**AI Assessment:** Market conditions favor selective risk-taking. Focus on sectors benefiting from Fed pivot (rate sensitives) while avoiding energy exposure. Watch for small-cap continuation.",
  risk: "**Current Risk Assessment:**\n\nOverall Risk Score: **58/100** (Moderate-Elevated)\n\n**Key Risk Factors:**\n1. **Concentration Risk (55/100):** Top 5 stocks represent 25% of S&P 500 weight\n2. **Volatility Risk (65/100):** VIX compression historically precedes expansion\n3. **Geopolitical Risk (72/100):** Multiple concurrent flashpoints\n\n**Hedging Recommendations:**\n• Consider protective puts on concentrated positions\n• Gold allocation as geopolitical hedge\n• Reduce energy exposure given OPEC+ uncertainty\n\nThe environment supports measured risk-taking but not aggressive leverage.",
}

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  return (
    <div className="w-16 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map((v, i) => ({ i, v }))}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={positive ? '#10b981' : '#ef4444'}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function AIChatPanel() {
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

  const getAIResponse = (query: string): string => {
    const q = query.toLowerCase()
    if (q.includes('nvda') || q.includes('nvidia')) return aiResponses.nvda
    if (q.includes('market') || q.includes('overview') || q.includes('summary')) return aiResponses.market
    if (q.includes('risk') || q.includes('danger') || q.includes('caution')) return aiResponses.risk
    return aiResponses.default
  }

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    await new Promise((resolve) => setTimeout(resolve, 1800))

    const response = getAIResponse(userMsg.content)
    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, aiMsg])
    setIsTyping(false)
  }

  return (
    <Card className="bg-card border-primary/30 flex flex-col h-full">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/15">
            <Bot className="w-3.5 h-3.5 text-primary" />
          </div>
          AI Research Agent
          <div className="w-2 h-2 rounded-full bg-primary ai-pulse ml-1" />
        </CardTitle>
        <CardDescription className="text-xs">Ask about markets, tickers, risk, or news</CardDescription>
      </CardHeader>
      <Separator className="bg-border" />

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 border border-border'
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <span className="text-[10px] opacity-50 mt-1 block">{mounted && msg.timestamp ? msg.timestamp : '\u00A0'}</span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <div className="bg-muted/50 border border-border rounded-lg px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend() }}
          className="flex gap-2"
        >
          <Input
            placeholder="Ask about markets, NVDA, risk..."
            className="bg-muted/50 border-border focus:border-primary/50 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
          />
          <Button
            type="submit"
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
            disabled={isTyping || !input.trim()}
          >
            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
        <div className="flex gap-2 mt-2 flex-wrap">
          {['Market overview', 'Analyze NVDA', 'Risk assessment'].map((q) => (
            <button
              key={q}
              className="text-[11px] px-2 py-0.5 rounded-full bg-muted/50 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              onClick={() => { setInput(q); }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}

export function DashboardScreen() {
  const sectorChartData = sectorPerformance.map((s) => ({
    name: s.name.length > 8 ? s.name.slice(0, 8) + '.' : s.name,
    fullName: s.name,
    value: s.performance,
  }))

  return (
    <div className="space-y-5">
      {/* Ticker Tape */}
      <div className="overflow-hidden rounded-lg bg-muted/30 border border-border py-2 px-4">
        <div className="flex gap-6 ticker-tape whitespace-nowrap">
          {[...tickerTape, ...tickerTape].map((t, i) => (
            <div key={`${t.symbol}-${i}`} className="flex items-center gap-2 text-sm">
              <span className="font-semibold font-mono text-xs">{t.symbol}</span>
              <span className="text-xs tabular-nums">${t.price.toFixed(2)}</span>
              <span className={cn('text-xs font-medium', t.change >= 0 ? 'text-gain' : 'text-loss')}>
                {t.change >= 0 ? '+' : ''}{t.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            Market Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time market overview with AI-powered insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-gain/15 text-gain border-gain/20 text-xs px-3 py-1">
            <Activity className="w-3 h-3 mr-1" />
            Markets Open
          </Badge>
          <Badge variant="outline" className="border-border text-xs text-muted-foreground">
            <RefreshCw className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </div>
      </div>

      {/* Market Indices */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {marketIndices.map((idx) => (
          <Card key={idx.name} className="bg-card border-border hover:border-primary/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{idx.name}</span>
                <MiniSparkline data={idx.sparkline} positive={idx.changePercent >= 0} />
              </div>
              <div className="text-lg font-bold tabular-nums">{idx.value.toLocaleString()}</div>
              <div className={cn('text-xs font-medium flex items-center gap-0.5', idx.changePercent >= 0 ? 'text-gain' : 'text-loss')}>
                {idx.changePercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {idx.changePercent >= 0 ? '+' : ''}{idx.change.toFixed(2)} ({idx.changePercent >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%)
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left Column */}
        <div className="xl:col-span-7 space-y-5">
          {/* AI Insights */}
          <Card className="bg-card border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                AI Insights
                <div className="w-2 h-2 rounded-full bg-primary ai-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiInsights.map((insight, i) => (
                <div key={i} className={cn(
                  'p-3 rounded-lg border space-y-1.5',
                  insight.type === 'opportunity' ? 'bg-gain/5 border-gain/15' :
                  insight.type === 'risk' ? 'bg-loss/5 border-loss/15' :
                  'bg-chart-3/5 border-chart-3/15'
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {insight.type === 'opportunity' ? <Target className="w-3.5 h-3.5 text-gain" /> :
                       insight.type === 'risk' ? <AlertTriangle className="w-3.5 h-3.5 text-loss" /> :
                       <Zap className="w-3.5 h-3.5 text-chart-3" />}
                      <span className="text-xs font-medium capitalize">{insight.type}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border">
                      {insight.confidence}% conf.
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sector Performance Chart */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Sector Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
                      tickLine={false}
                      tickFormatter={(v) => `${v.toFixed(1)}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.55)' }}
                      tickLine={false}
                      width={75}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#22223b',
                        border: '1px solid #33334d',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value: number, name: string, props: { payload: { fullName: string } }) => [
                        `${value.toFixed(2)}%`,
                        props.payload.fullName,
                      ]}
                    />
                    <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {sectorChartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.value >= 0 ? '#10b981' : '#ef4444'}
                          opacity={entry.value >= 0 ? 0.7 + Math.abs(entry.value) * 0.1 : 0.7 + Math.abs(entry.value) * 0.1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="xl:col-span-5 space-y-5">
          {/* AI Chat Agent */}
          <div className="h-[520px]">
            <AIChatPanel />
          </div>
        </div>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gain" />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topGainers.map((g, i) => (
                <div key={g.symbol} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <div>
                      <span className="text-sm font-semibold font-mono">{g.symbol}</span>
                      <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">{g.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm tabular-nums">${g.price.toFixed(2)}</span>
                    <span className="ml-2 text-xs font-medium text-gain">+{g.change.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-loss" />
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topLosers.map((l, i) => (
                <div key={l.symbol} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <div>
                      <span className="text-sm font-semibold font-mono">{l.symbol}</span>
                      <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">{l.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm tabular-nums">${l.price.toFixed(2)}</span>
                    <span className="ml-2 text-xs font-medium text-loss">{l.change.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}