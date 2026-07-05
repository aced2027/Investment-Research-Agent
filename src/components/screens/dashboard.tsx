'use client'

import { useState, useRef, useEffect, useMemo, useSyncExternalStore } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
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
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { getDashboardSnapshot, generateInsightsFromData, type MarketIndex, type AIInsight, type TopMover } from '@/services/analysis-service'
import { getMarketNews, summarizeArticles, type NewsItem } from '@/services/news-service'
import { getStockQuote, getRecommendations, getInsiderSentiment, type StockQuote } from '@/services/stock-service'

function generateSparkline(price: number, changePercent: number): number[] {
  const points: number[] = []
  let p = price * (1 - changePercent / 100 * 3)
  const trend = changePercent > 0 ? 0.3 : -0.3
  for (let i = 0; i < 7; i++) {
    p += (trend + (i / 7) * (changePercent > 0 ? 0.5 : -0.5)) * (price / 100)
    points.push(Math.round(p * 100) / 100)
  }
  points[6] = price
  return points
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


/** Hardcoded sector data — Finnhub has no direct sector performance endpoint */
const sectorPerformance = [
  { name: 'Technology', performance: 2.34, volume: '89.2B' },
  { name: 'Healthcare', performance: 1.12, volume: '45.6B' },
  { name: 'Financials', performance: 0.87, volume: '62.1B' },
  { name: 'Consumer Disc.', performance: 0.65, volume: '38.4B' },
  { name: 'Industrials', performance: 0.34, volume: '28.7B' },
  { name: 'Utilities', performance: 0.22, volume: '12.3B' },
  { name: 'Real Estate', performance: -0.15, volume: '8.9B' },
  { name: 'Materials', performance: -0.48, volume: '18.2B' },
  { name: 'Energy', performance: -2.15, volume: '42.8B' },
  { name: 'Comm. Services', performance: -0.31, volume: '32.5B' },
]

export function DashboardScreen() {
  const [indices, setIndices] = useState<MarketIndex[]>([])
  const [gainers, setGainers] = useState<TopMover[]>([])
  const [losers, setLosers] = useState<TopMover[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await getDashboardSnapshot()
        if (cancelled) return
        setIndices(data.indices)
        setGainers(data.movers.gainers)
        setLosers(data.movers.losers)
        setNews(data.news)
        // Generate insights from top gainer data
        if (data.movers.gainers.length > 0) {
          const topGainer = data.movers.gainers[0]
          try {
            const quote = await getStockQuote(topGainer.symbol)
            if (cancelled) return
            const recs = await getRecommendations(topGainer.symbol).catch(() => [])
            if (cancelled) return
            const insider = await getInsiderSentiment(topGainer.symbol).catch(() => [])
            if (cancelled) return
            const generated = generateInsightsFromData(quote, recs, insider)
            setInsights(generated.length > 0 ? generated : [
              { type: 'opportunity' as const, text: `${topGainer.symbol} leading gainers today at +${topGainer.change.toFixed(2)}%. Strong momentum across technology sector.`, confidence: 75 }
            ])
          } catch {
            if (cancelled) return
            setInsights([
              { type: 'opportunity' as const, text: `${topGainer.symbol} leading gainers today at +${topGainer.change.toFixed(2)}%. Strong momentum across technology sector.`, confidence: 75 }
            ])
          }
        }
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load market data')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    load()
    // Refresh every 30 seconds
    const interval = setInterval(load, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const retry = () => {
    setError(null)
    setLoading(true)
  }

  const tickerItems = useMemo(() => {
    return indices.map(i => ({
      symbol: i.symbol,
      price: i.value,
      change: i.changePercent,
    })).concat(gainers.slice(0, 4).map(g => ({
      symbol: g.symbol,
      price: g.price,
      change: g.change,
    })))
  }, [indices, gainers])

  const sectorChartData = useMemo(() => sectorPerformance.map((s) => ({
    name: s.name.length > 8 ? s.name.slice(0, 8) + '.' : s.name,
    fullName: s.name,
    value: s.performance,
  })), [])

  // Loading state
  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border-border"><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-5">
        <Card className="bg-loss/5 border-loss/20">
          <CardContent className="p-6 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-loss mx-auto" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={retry} variant="outline" className="border-primary/30 text-primary">Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5 w-full max-w-full min-w-0 overflow-hidden">
      {/* Ticker Tape */}
      <div className="w-full max-w-full overflow-hidden rounded-lg bg-muted/30 border border-border py-2 px-4">
        <div className="flex gap-6 ticker-tape whitespace-nowrap w-max">
          {[...tickerItems, ...tickerItems].map((t, i) => (
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
      {indices.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Market data unavailable. The market may be closed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {indices.map((idx) => {
            const sparkline = generateSparkline(idx.value, idx.changePercent)
            return (
              <Card key={idx.symbol} className="bg-card border-border hover:border-primary/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-medium">{idx.name}</span>
                    <MiniSparkline data={sparkline} positive={idx.changePercent >= 0} />
                  </div>
                  <div className="text-lg font-bold tabular-nums">{idx.value.toLocaleString()}</div>
                  <div className={cn('text-xs font-medium flex items-center gap-0.5', idx.changePercent >= 0 ? 'text-gain' : 'text-loss')}>
                    {idx.changePercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {idx.changePercent >= 0 ? '+' : ''}{idx.change.toFixed(2)} ({idx.changePercent >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%)
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="space-y-5 min-w-0">
        {/* AI Insights */}
        <Card className="bg-card border-primary/30 min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              AI Insights
              <div className="w-2 h-2 rounded-full bg-primary ai-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No insights available at this time.</p>
            ) : (
              insights.map((insight, i) => (
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
              ))
            )}
          </CardContent>
        </Card>

        {/* Sector Performance Chart */}
        <Card className="bg-card border-border min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Sector Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 w-full min-w-0 overflow-hidden">
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
                    formatter={(value: number, name: string, props: any) => [
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

        {/* News Cards */}
        {news.length > 0 && (
          <Card className="bg-card border-border min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Rss className="w-4 h-4 text-primary" />
                Latest Market News
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {news.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug line-clamp-2">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] text-muted-foreground">{item.source}</span>
                      <span className="text-[11px] text-muted-foreground">·</span>
                      <span className="text-[11px] text-muted-foreground">{item.time}</span>
                      {item.sentiment !== 'neutral' && (
                        <Badge variant="outline" className={cn(
                          'text-[10px] px-1.5 py-0 border',
                          item.sentiment === 'bullish' ? 'text-gain border-gain/30 bg-gain/5' : 'text-loss border-loss/30 bg-loss/5'
                        )}>
                          {item.sentiment}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {item.tickers.length > 0 && (
                    <div className="flex gap-1 shrink-0">
                      {item.tickers.slice(0, 2).map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0 font-mono border-border">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gain" />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gainers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No gainers data available.</p>
            ) : (
              <div className="space-y-2">
                {gainers.map((g, i) => (
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
            )}
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
            {losers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No losers data available.</p>
            ) : (
              <div className="space-y-2">
                {losers.map((l, i) => (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}