'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
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
} from 'lucide-react'
import { tickerData } from '@/lib/market-data'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, BarChart as ReBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const ratingConfig: Record<string, { label: string; color: string; bg: string }> = {
  'strong-buy': { label: 'Strong Buy', color: 'text-gain', bg: 'bg-gain/15 border-gain/30' },
  'buy': { label: 'Buy', color: 'text-gain', bg: 'bg-gain/10 border-gain/20' },
  'hold': { label: 'Hold', color: 'text-chart-3', bg: 'bg-chart-3/10 border-chart-3/20' },
  'sell': { label: 'Sell', color: 'text-loss', bg: 'bg-loss/10 border-loss/20' },
  'strong-sell': { label: 'Strong Sell', color: 'text-loss', bg: 'bg-loss/15 border-loss/30' },
}

function TickerList({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [search, setSearch] = useState('')

  const tickers = useMemo(() => {
    return Object.values(tickerData)
      .filter((t) =>
        t.symbol.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.volume.localeCompare(a.volume))
  }, [search])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search ticker..."
          className="pl-9 bg-muted/50 border-border focus:border-primary/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <ScrollArea className="h-[500px] pr-2">
        <div className="space-y-2">
          {tickers.map((t) => {
            const rating = ratingConfig[t.analystRating]
            return (
              <button
                key={t.symbol}
                onClick={() => onSelect(t.symbol)}
                className="w-full text-left p-3 rounded-lg bg-muted/30 hover:bg-surface-hover border border-transparent hover:border-primary/20 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary font-mono">{t.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.symbol}</div>
                      <div className="text-xs text-muted-foreground">{t.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">${t.price.toFixed(2)}</div>
                    <div className={cn('text-xs font-medium flex items-center justify-end gap-0.5', t.changePercent >= 0 ? 'text-gain' : 'text-loss')}>
                      {t.changePercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {t.changePercent >= 0 ? '+' : ''}{t.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

function TickerDetail({ symbol }: { symbol: string }) {
  const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M'>('3M')
  const ticker = tickerData[symbol]

  const days = timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : 90
  const chartData = useMemo(() => {
    if (!ticker) return []
    return ticker.priceHistory.slice(-days)
  }, [ticker, days, timeRange])

  if (!ticker) return null

  const rating = ratingConfig[ticker.analystRating]

  const volumeData = chartData.map((d) => ({
    date: d.date,
    volume: d.volume,
    close: d.close,
  }))

  const priceRange = {
    high: Math.max(...chartData.map((d) => d.high)),
    low: Math.min(...chartData.map((d) => d.low)),
  }

  const metrics = [
    { label: 'Market Cap', value: ticker.marketCap, icon: DollarSign },
    { label: 'P/E Ratio', value: `${ticker.pe}x`, icon: PieChart },
    { label: 'Avg Volume', value: ticker.avgVolume, icon: Volume2 },
    { label: '52W High', value: `$${ticker.high52w.toFixed(2)}`, icon: TrendingUp },
    { label: '52W Low', value: `$${ticker.low52w.toFixed(2)}`, icon: TrendingDown },
    { label: 'Sector', value: ticker.sector, icon: BarChart3 },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{ticker.symbol}</h2>
            <Badge variant="outline" className={cn('text-[11px] border', rating.bg, rating.color)}>{rating.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{ticker.name}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums">${ticker.price.toFixed(2)}</div>
          <div className={cn('text-sm font-medium flex items-center justify-end gap-1', ticker.changePercent >= 0 ? 'text-gain' : 'text-loss')}>
            {ticker.changePercent >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {ticker.changePercent >= 0 ? '+' : ''}{ticker.change.toFixed(2)} ({ticker.changePercent >= 0 ? '+' : ''}{ticker.changePercent.toFixed(2)}%)
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
                    <stop offset="5%" stopColor={ticker.changePercent >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={ticker.changePercent >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
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
                  stroke={ticker.changePercent >= 0 ? '#10b981' : '#ef4444'}
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

      {/* AI Insights */}
      <Card className="bg-card border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            AI Research Notes
          </CardTitle>
          <CardDescription>Agent-generated analysis for {ticker.symbol}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-gain/5 border border-gain/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-3.5 h-3.5 text-gain" />
              <span className="text-xs font-medium text-gain">Opportunity Signal</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Strong momentum confirmed by volume expansion. Institutional flow data shows consistent accumulation
              over the past 5 sessions. Key resistance level at ${ticker.high52w.toFixed(2)} — a breakout above
              this level could trigger further upside to ${((ticker.high52w - ticker.low52w) * 0.5 + ticker.low52w + 20).toFixed(2)}.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-chart-3/5 border border-chart-3/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-chart-3" />
              <span className="text-xs font-medium text-chart-3">Risk Factor</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              P/E ratio of {ticker.pe}x is above the sector median of 24.5x, suggesting premium valuation.
              Any disappointment in upcoming earnings could lead to multiple compression. Monitor options
              implied volatility for early warning signs.
            </p>
          </div>
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