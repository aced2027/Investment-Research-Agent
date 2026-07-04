'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Brain,
  Activity,
  Target,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Volume2,
  DollarSign,
  PieChart,
  LineChart,
  BarChart,
  Globe,
  Users,
} from 'lucide-react'
import { getStockQuote, getCompanyProfile, getCandles, getRecommendations, getInsiderSentiment, type StockQuote, type CompanyProfile, type Candle, type RecommendationData, type InsiderSentimentItem } from '@/services/stock-service'
import { generateInsightsFromData, type AIInsight } from '@/services/analysis-service'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, BarChart as ReBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'

const DEFAULT_SYMBOLS = ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'XOM', 'JPM']

function TickerList({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [search, setSearch] = useState('')
  const [tickers, setTickers] = useState<Array<{ symbol: string; price: number; change: number; name: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTickers() {
      setLoading(true)
      try {
        const results = await Promise.allSettled(
          DEFAULT_SYMBOLS.map(async (sym) => {
            const q = await getStockQuote(sym)
            return { symbol: sym, price: q.price, change: q.changePercent, name: sym }
          })
        )
        setTickers(results.filter((r): r is PromiseFulfilledResult<typeof results[0] extends PromiseFulfilledResult<infer T> ? T : never> => r.status === 'fulfilled').map(r => r.value))
      } catch {
        // fallback to static list
        setTickers(DEFAULT_SYMBOLS.map(s => ({ symbol: s, price: 0, change: 0, name: s })))
      } finally {
        setLoading(false)
      }
    }
    loadTickers()
  }, [])

  const filtered = tickers.filter(t => t.symbol.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search ticker..." className="pl-9 bg-muted/50 border-border focus:border-primary/50" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <ScrollArea className="h-[500px] pr-2">
        {loading ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(t => (
              <button key={t.symbol} onClick={() => onSelect(t.symbol)} className="w-full text-left p-3 rounded-lg bg-muted/30 hover:bg-surface-hover border border-transparent hover:border-primary/20 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary font-mono">{t.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">{t.price > 0 ? `$${t.price.toFixed(2)}` : '---'}</div>
                    {t.price > 0 && (
                      <div className={cn('text-xs font-medium', t.change >= 0 ? 'text-gain' : 'text-loss')}>
                        {t.change >= 0 ? '+' : ''}{t.change.toFixed(2)}%
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function TickerDetail({ symbol }: { symbol: string }) {
  const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M'>('3M')
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [candles, setCandles] = useState<Candle[]>([])
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [insiderData, setInsiderData] = useState<InsiderSentimentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTickerData() {
      try {
        setLoading(true)
        setError(null)
        const [quoteData, profileData, candleData, recData, insider] = await Promise.allSettled([
          getStockQuote(symbol),
          getCompanyProfile(symbol),
          getCandles(symbol, 'D'),
          getRecommendations(symbol),
          getInsiderSentiment(symbol),
        ])
        if (quoteData.status === 'fulfilled') setQuote(quoteData.value)
        else setError(quoteData.reason?.message || 'Invalid ticker or API error')
        if (profileData.status === 'fulfilled') setProfile(profileData.value)
        if (candleData.status === 'fulfilled') setCandles(candleData.value)
        if (recData.status === 'fulfilled') setRecommendations(recData.value)
        if (insider.status === 'fulfilled') setInsiderData(insider.value)

        // Generate AI insights
        if (quoteData.status === 'fulfilled') {
          const recs = recData.status === 'fulfilled' ? recData.value : []
          const ins = insider.status === 'fulfilled' ? insider.value : []
          const generated = generateInsightsFromData(quoteData.value, recs, ins)
          setInsights(generated.length > 0 ? generated : [
            { type: 'opportunity' as const, text: `${symbol} shows active trading patterns. Monitor key support and resistance levels for entry points.`, confidence: 65 }
          ])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ticker data')
      } finally {
        setLoading(false)
      }
    }
    loadTickerData()
  }, [symbol, timeRange])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error || !quote) {
    return (
      <Card className="bg-loss/5 border-loss/20">
        <CardContent className="p-8 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-loss mx-auto" />
          <p className="text-sm text-muted-foreground">{error || `Could not load data for ${symbol}`}</p>
        </CardContent>
      </Card>
    )
  }

  return <TickerDetailLoaded symbol={symbol} quote={quote} profile={profile} candles={candles} recommendations={recommendations} insights={insights} insiderData={insiderData} />
}

// Separate the data-heavy render into a sub-component to avoid conditional hooks
function TickerDetailLoaded({ symbol, quote, profile, candles, recommendations, insights, insiderData }: {
  symbol: string
  quote: StockQuote
  profile: CompanyProfile | null
  candles: Candle[]
  recommendations: RecommendationData[]
  insights: AIInsight[]
  insiderData: InsiderSentimentItem[]
}) {
  const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M'>('3M')

  const chartData = useMemo(() => {
    const days = timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : 90
    return candles.slice(-days)
  }, [candles, timeRange])

  const volumeData = chartData

  const priceRange = chartData.length > 0 ? {
    high: Math.max(...chartData.map(d => d.high)),
    low: Math.min(...chartData.map(d => d.low)),
  } : { high: 0, low: 0 }

  const metrics = [
    { label: 'Market Cap', value: profile?.marketCap || 'N/A', icon: DollarSign },
    { label: 'Industry', value: profile?.industry || 'N/A', icon: BarChart3 },
    { label: 'Exchange', value: profile?.exchange || 'N/A', icon: Globe },
    { label: 'Open', value: quote.open > 0 ? `$${quote.open.toFixed(2)}` : 'N/A', icon: TrendingUp },
    { label: 'High', value: quote.high > 0 ? `$${quote.high.toFixed(2)}` : 'N/A', icon: TrendingUp },
    { label: 'Low', value: quote.low > 0 ? `$${quote.low.toFixed(2)}` : 'N/A', icon: TrendingDown },
    { label: 'Prev Close', value: quote.previousClose > 0 ? `$${quote.previousClose.toFixed(2)}` : 'N/A', icon: BarChart3 },
    { label: 'Country', value: profile?.country || 'N/A', icon: Globe },
    { label: 'Employees', value: profile?.employees ? profile.employees.toLocaleString() : 'N/A', icon: Users },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{quote.symbol}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{profile?.name || quote.symbol}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums">${quote.price.toFixed(2)}</div>
          <div className={cn('text-sm font-medium flex items-center justify-end gap-1', quote.changePercent >= 0 ? 'text-gain' : 'text-loss')}>
            {quote.changePercent >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {quote.changePercent >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Chart */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Price Action</h3>
            <div className="flex gap-1">
              {(['1W', '1M', '3M'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-7 text-xs',
                    timeRange === range ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  )}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={quote.changePercent >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={quote.changePercent >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                  tickFormatter={(v) => v.slice(5)}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                  domain={[priceRange.low - 2, priceRange.high + 2]}
                  tickLine={false}
                  width={55}
                />
                <Tooltip
                  contentStyle={{
                    background: '#22223b',
                    border: '1px solid #33334d',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={quote.changePercent >= 0 ? '#10b981' : '#ef4444'}
                  fill="url(#priceGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Volume Chart */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium mb-4">Trading Volume</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                  tickFormatter={(v) => v.slice(5)}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                  tickLine={false}
                  width={50}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#22223b',
                    border: '1px solid #33334d',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${(value / 1000000).toFixed(1)}M`, 'Volume']}
                />
                <Bar dataKey="volume" fill="rgba(16, 185, 129, 0.5)" radius={[2, 2, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Key Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {metrics.map((m) => {
              const Icon = m.icon
              return (
                <div key={m.label} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs">{m.label}</span>
                  </div>
                  <div className="text-sm font-semibold">{m.value}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Analyst Recommendations */}
      {recommendations.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Analyst Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <ReBarChart data={recommendations.slice(-6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                <YAxis type="category" dataKey="period" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} width={50} />
                <Tooltip contentStyle={{ background: '#22223b', border: '1px solid #33334d', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="strongBuy" stackId="a" fill="#10b981" />
                <Bar dataKey="buy" stackId="a" fill="#34d399" />
                <Bar dataKey="hold" stackId="a" fill="#eab308" />
                <Bar dataKey="sell" stackId="a" fill="#f87171" />
                <Bar dataKey="strongSell" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 mt-3 justify-center">
              {[{ label: 'Strong Buy', color: '#10b981' }, { label: 'Buy', color: '#34d399' }, { label: 'Hold', color: '#eab308' }, { label: 'Sell', color: '#f87171' }, { label: 'Strong Sell', color: '#ef4444' }].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color }} />{l.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insider Sentiment */}
      {insiderData.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Insider Sentiment (6-Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <ReBarChart data={insiderData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey={d => `${d.year}-${String(d.month).padStart(2, '0')}`} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} />
                <Tooltip contentStyle={{ background: '#22223b', border: '1px solid #33334d', borderRadius: 8, fontSize: 12 }} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                <Bar dataKey="mspr" radius={[2, 2, 0, 0]}>
                  {insiderData.map((entry, index) => (
                    <Cell key={index} fill={entry.mspr >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">MSPR (Monthly Sell-to-Purchase Ratio) — positive values indicate net buying by insiders.</p>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card className="bg-card border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            AI Research Notes
          </CardTitle>
          <CardDescription>Agent-generated analysis for {quote.symbol}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((insight, i) => {
            const config = {
              opportunity: { icon: Target, color: 'text-gain', bg: 'bg-gain/5 border-gain/20', label: 'Opportunity Signal' },
              risk: { icon: AlertTriangle, color: 'text-chart-3', bg: 'bg-chart-3/5 border-chart-3/20', label: 'Risk Factor' },
              alert: { icon: AlertTriangle, color: 'text-loss', bg: 'bg-loss/5 border-loss/20', label: 'Alert' },
            }[insight.type]
            const Icon = config.icon
            return (
              <div key={i} className={cn('p-3 rounded-lg border', config.bg)}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn('w-3.5 h-3.5', config.color)} />
                  <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
                  {insight.confidence > 0 && (
                    <Badge variant="outline" className="text-[10px] ml-auto">{insight.confidence}%</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{insight.text}</p>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

export function TickerDetailScreen() {
  const [selectedTicker, setSelectedTicker] = useState<string>('NVDA')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-primary" />
          Ticker Research
        </h1>
        <p className="text-muted-foreground mt-1">
          Deep-dive analysis with AI-powered insights
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticker List */}
        <div className="lg:col-span-4 xl:col-span-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <TickerList onSelect={setSelectedTicker} />
            </CardContent>
          </Card>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-8 xl:col-span-9">
          <TickerDetail symbol={selectedTicker} />
        </div>
      </div>
    </div>
  )
}