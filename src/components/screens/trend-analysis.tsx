'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  TrendingUp,
  Sparkles,
  Brain,
  BarChart3,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Layers,
  Calendar,
  Loader2,
} from 'lucide-react'
import { sectorPerformance } from '@/lib/market-data'
import { getInsiderSentiment, getEarnings, type InsiderSentimentItem, type EarningsItem } from '@/services/stock-service'
import { getMarketNews, summarizeArticles, type NewsItem } from '@/services/news-service'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ReferenceLine, Cell,
} from 'recharts'

// Deterministic PRNG for client-safe static data (avoids hydration mismatch)
function mulberry32(seed: number) {
  let a = seed | 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const sr = mulberry32(99)

const sentimentData = Array.from({ length: 30 }, (_, i) => ({
  date: `Day ${i + 1}`,
  bullish: Math.round(30 + sr() * 40),
  bearish: Math.round(10 + sr() * 25),
  neutral: Math.round(15 + sr() * 20),
}))

const correlationData = Array.from({ length: 20 }, (_, i) => ({
  date: `W${i + 1}`,
  sp500: Math.round((100 + Math.sin(i * 0.3) * 15 + sr() * 5) * 100) / 100,
  bonds: Math.round((100 - Math.sin(i * 0.3) * 8 + sr() * 3) * 100) / 100,
  gold: Math.round((100 + Math.cos(i * 0.25) * 10 + sr() * 4) * 100) / 100,
  vix: Math.round((20 + Math.sin(i * 0.5) * 10 + sr() * 3) * 100) / 100,
}))

const riskMetrics = [
  { label: 'Market Risk', value: 42, color: 'bg-chart-3', description: 'Moderate' },
  { label: 'Volatility', value: 65, color: 'bg-loss', description: 'Elevated' },
  { label: 'Liquidity', value: 88, color: 'bg-gain', description: 'Strong' },
  { label: 'Correlation Risk', value: 28, color: 'bg-gain', description: 'Low' },
  { label: 'Concentration', value: 55, color: 'bg-chart-3', description: 'Moderate' },
  { label: 'Momentum', value: 78, color: 'bg-primary', description: 'Strong' },
]

const radarData = [
  { metric: 'Valuation', value: 72 },
  { metric: 'Momentum', value: 85 },
  { metric: 'Quality', value: 68 },
  { metric: 'Growth', value: 91 },
  { metric: 'Sentiment', value: 76 },
  { metric: 'Risk', value: 45 },
]

const weeklySectorData = sectorPerformance.slice(0, 6).map((s) => ({
  name: s.name,
  performance: s.performance,
  barColor: s.performance >= 0 ? '#10b981' : '#ef4444',
}))

export function TrendAnalysisScreen() {
  const [insiderData, setInsiderData] = useState<InsiderSentimentItem[]>([])
  const [earningsData, setEarningsData] = useState<EarningsItem[]>([])
  const [newsForAnalysis, setNewsForAnalysis] = useState<NewsItem[]>([])
  const [aiReport, setAiReport] = useState<string | null>(null)
  const [aiReportSentiment, setAiReportSentiment] = useState<string>('Neutral')
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const [insider, earnings, news] = await Promise.allSettled([
          getInsiderSentiment('SPY'),
          getEarnings(),
          getMarketNews('general'),
        ])
        if (insider.status === 'fulfilled') setInsiderData(insider.value)
        if (earnings.status === 'fulfilled') setEarningsData(earnings.value.slice(0, 20))
        if (news.status === 'fulfilled') setNewsForAnalysis(news.value)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trend data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleGenerateReport = async () => {
    if (newsForAnalysis.length === 0) return
    setReportLoading(true)
    try {
      const articles = newsForAnalysis.slice(0, 10).map(n => ({
        headline: n.title,
        summary: n.summary,
        source: n.source,
        category: n.category,
      }))
      const result = await summarizeArticles(articles)
      setAiReport(result.analysis)
      setAiReportSentiment(result.sentiment)
    } catch (err) {
      setAiReport('Failed to generate AI report. Please try again later.')
    } finally {
      setReportLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-loss/10 border border-loss/20 text-sm text-loss">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            Trend Analysis Report
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-generated market trend analysis and risk assessment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/15 text-primary border-primary/20 text-xs px-3 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            Auto-Generated
          </Badge>
          <Badge variant="outline" className="border-border text-xs text-muted-foreground">
            Live Data
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="ai-report">AI Report</TabsTrigger>
        </TabsList>

        {/* Market Overview */}
        <TabsContent value="overview" className="space-y-4">
          {/* Sector Performance */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Sector Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklySectorData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                      tickLine={false}
                      tickFormatter={(v) => `${v.toFixed(1)}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }}
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#22223b',
                        border: '1px solid #33334d',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'Performance']}
                    />
                    <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
                    <Bar dataKey="performance" radius={[0, 4, 4, 0]}>
                      {weeklySectorData.map((entry, index) => (
                        <Cell key={index} fill={entry.barColor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Earnings */}
          {earningsData.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />Upcoming Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {earningsData.slice(0, 10).map((e, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold font-mono">{e.symbol}</span>
                          <span className="text-xs text-muted-foreground">Q{e.quarter} {e.year}</span>
                        </div>
                        <div className="text-right text-xs">
                          <div className="text-muted-foreground">{e.date}</div>
                          <div>Est: {typeof e.estimate === 'number' ? `$${e.estimate.toFixed(2)}` : 'N/A'} {typeof e.actual === 'number' && <span className={e.actual >= (e.estimate ?? 0) ? 'text-gain' : 'text-loss'}> Actual: ${e.actual.toFixed(2)}</span>}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Cross-Asset Correlation */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Cross-Asset Correlation (20-Week)
              </CardTitle>
              <CardDescription>Normalized performance comparison across asset classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={correlationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} width={40} />
                    <Tooltip
                      contentStyle={{
                        background: '#22223b',
                        border: '1px solid #33334d',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line type="monotone" dataKey="sp500" stroke="#10b981" strokeWidth={2} dot={false} name="S&P 500" />
                    <Line type="monotone" dataKey="bonds" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Bonds" />
                    <Line type="monotone" dataKey="gold" stroke="#eab308" strokeWidth={2} dot={false} name="Gold" />
                    <Line type="monotone" dataKey="vix" stroke="#ef4444" strokeWidth={1.5} dot={false} name="VIX" strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 justify-center">
                {[
                  { label: 'S&P 500', color: '#10b981' },
                  { label: 'Bonds', color: '#8b5cf6' },
                  { label: 'Gold', color: '#eab308' },
                  { label: 'VIX', color: '#ef4444' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-3 h-0.5 rounded" style={{ backgroundColor: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sentiment Analysis */}
        <TabsContent value="sentiment" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">News Sentiment Distribution</CardTitle>
                <CardDescription>AI-classified sentiment from 500+ news sources (30-day)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sentimentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} width={35} />
                      <Tooltip
                        contentStyle={{
                          background: '#22223b',
                          border: '1px solid #33334d',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="bullish" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="neutral" stackId="a" fill="#eab308" />
                      <Bar dataKey="bearish" stackId="a" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-4 mt-3 justify-center">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-sm bg-gain" />Bullish
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-sm bg-chart-3" />Neutral
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-sm bg-loss" />Bearish
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Multi-Factor Radar</CardTitle>
                <CardDescription>Composite scoring across 6 key dimensions</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sentiment Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-card border-gain/20">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-gain">62%</div>
                <div className="text-sm text-muted-foreground mt-1">Bullish Sentiment</div>
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gain">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+5.2% vs last week</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-chart-3/20">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-chart-3">24%</div>
                <div className="text-sm text-muted-foreground mt-1">Neutral Sentiment</div>
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-loss">
                  <ArrowDownRight className="w-3 h-3" />
                  <span>-3.1% vs last week</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-loss/20">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-loss">14%</div>
                <div className="text-sm text-muted-foreground mt-1">Bearish Sentiment</div>
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-loss">
                  <ArrowDownRight className="w-3 h-3" />
                  <span>-2.1% vs last week</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Risk Assessment */}
        <TabsContent value="risk" className="space-y-4">
          {/* Insider Sentiment Chart */}
          {insiderData.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  SPY Insider Sentiment (MSPR)
                </CardTitle>
                <CardDescription>Monthly Insider Sentiment Ratio — broad market proxy via SPY</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={insiderData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey={d => `${d.year}-${String(d.month).padStart(2, '0')}`} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#22223b', border: '1px solid #33334d', borderRadius: 8, fontSize: 12 }} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                    <Bar dataKey="mspr" name="MSPR" radius={[2, 2, 0, 0]}>
                      {insiderData.map((entry, index) => (
                        <Cell key={index} fill={entry.mspr >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-chart-3" />
                Risk Factor Assessment
              </CardTitle>
              <CardDescription>Real-time risk scoring across multiple dimensions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {riskMetrics.map((rm) => (
                <div key={rm.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{rm.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-xs font-medium',
                        rm.value >= 70 ? 'text-loss' : rm.value >= 50 ? 'text-chart-3' : 'text-gain'
                      )}>
                        {rm.description}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{rm.value}/100</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', rm.color)}
                      style={{ width: `${rm.value}%`, opacity: 0.7 }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Report */}
        <TabsContent value="ai-report" className="space-y-4">
          {!aiReport && !reportLoading && (
            <Card className="bg-card border-primary/30">
              <CardContent className="p-8 text-center space-y-4">
                <Brain className="w-10 h-10 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Generate a comprehensive AI analysis of current market conditions using the latest news.</p>
                <Button onClick={handleGenerateReport} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Sparkles className="w-4 h-4 mr-2" />Generate AI Report
                </Button>
              </CardContent>
            </Card>
          )}
          {reportLoading && (
            <Card className="bg-card border-primary/30">
              <CardContent className="p-8 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
                <p className="text-sm text-muted-foreground">Analyzing market data and generating report...</p>
              </CardContent>
            </Card>
          )}
          {aiReport && !reportLoading && (
            <Card className="bg-card border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Brain className="w-4 h-4 text-primary" />AI-Generated Market Analysis</CardTitle>
                <CardDescription>Analysis based on {newsForAnalysis.length} news articles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-sm max-w-none">
                  {aiReport.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-semibold mt-4 mb-2 flex items-center gap-2">{line.replace('## ', '')}</h3>
                    if (line.startsWith('- ')) return <li key={i} className="text-sm text-muted-foreground ml-4 list-disc">{line.replace('- ', '')}</li>
                    return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>
                  })}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setAiReport(null)} className="border-primary/30 text-primary">Regenerate</Button>
                  <span className="text-xs text-muted-foreground">Sentiment: {aiReportSentiment}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}