'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bot,
  Sparkles,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Shield,
  Zap,
  Eye,
  Layers,
  Type,
  Move,
  ToggleLeft,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { marketIndices, newsItems, tickerData, aiInsights } from '@/lib/market-data'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell,
} from 'recharts'

const typographyScale = [
  { label: 'Display', size: '3rem', weight: 700, sample: 'Market Intelligence' },
  { label: 'H1', size: '2.25rem', weight: 600, sample: 'Investment Analysis' },
  { label: 'H2', size: '1.875rem', weight: 600, sample: 'Sector Performance' },
  { label: 'H3', size: '1.5rem', weight: 600, sample: 'Revenue Breakdown' },
  { label: 'H4', size: '1.25rem', weight: 500, sample: 'Key Metrics' },
  { label: 'Body Large', size: '1.125rem', weight: 400, sample: 'Market data updated in real-time.' },
  { label: 'Body', size: '1rem', weight: 400, sample: 'AI-powered analysis of market trends.' },
  { label: 'Body Small', size: '0.875rem', weight: 400, sample: 'Last updated: 2 minutes ago' },
  { label: 'Caption', size: '0.75rem', weight: 500, sample: 'SOURCE: REUTERS • NYSE' },
]

const spacingTokens = [
  { token: '1 (4px)', value: '4px' },
  { token: '2 (8px)', value: '8px' },
  { token: '3 (12px)', value: '12px' },
  { token: '4 (16px)', value: '16px' },
  { token: '6 (24px)', value: '24px' },
  { token: '8 (32px)', value: '32px' },
  { token: '12 (48px)', value: '48px' },
  { token: '16 (64px)', value: '64px' },
]

const componentExamples = [
  {
    name: 'Price Display',
    description: 'Stock price with change indicator',
    demo: (
      <div className="space-y-3">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold">$228.68</span>
          <span className="flex items-center gap-1 text-sm text-gain font-medium">
            <ArrowUpRight className="w-4 h-4" />+1.52%
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold">$108.32</span>
          <span className="flex items-center gap-1 text-sm text-loss font-medium">
            <ArrowDownRight className="w-4 h-4" />-3.09%
          </span>
        </div>
      </div>
    ),
  },
  {
    name: 'Sentiment Badge',
    description: 'AI-detected news sentiment',
    demo: (
      <div className="flex gap-2 flex-wrap">
        <Badge className="bg-gain/15 text-gain border-gain/20 hover:bg-gain/20">Bullish</Badge>
        <Badge className="bg-loss/15 text-loss border-loss/20 hover:bg-loss/20">Bearish</Badge>
        <Badge className="bg-chart-3/15 text-chart-3 border-chart-3/20 hover:bg-chart-3/20">Neutral</Badge>
        <Badge className="bg-primary/15 text-primary border-primary/20 hover:bg-primary/20">Strong Buy</Badge>
        <Badge className="bg-chart-5/15 text-chart-5 border-chart-5/20 hover:bg-chart-5/20">Hold</Badge>
      </div>
    ),
  },
  {
    name: 'AI Insight Card',
    description: 'Machine-generated market insight',
    demo: (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/15">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs font-medium text-primary">AI Insight</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">87% confidence</Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Strong accumulation pattern detected in NVDA — institutional buying volume up 340% over 5 sessions.
        </p>
      </div>
    ),
  },
  {
    name: 'Mini Sparkline',
    description: 'Inline trend indicators',
    demo: (
      <div className="space-y-3">
        {marketIndices.slice(0, 3).map((idx) => (
          <div key={idx.name} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{idx.name}</div>
              <div className="text-xs text-muted-foreground">{idx.value.toLocaleString()}</div>
            </div>
            <div className="w-20 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={idx.sparkline.map((v, i) => ({ i, v }))}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={idx.changePercent >= 0 ? '#10b981' : '#ef4444'}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <span className={`text-sm font-medium ${idx.changePercent >= 0 ? 'text-gain' : 'text-loss'}`}>
              {idx.changePercent >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    ),
  },
]

export function DesignSystemScreen() {
  const pieData = [
    { name: 'Technology', value: 34 },
    { name: 'Healthcare', value: 18 },
    { name: 'Financials', value: 15 },
    { name: 'Energy', value: 12 },
    { name: 'Other', value: 21 },
  ]
  const pieColors = ['#10b981', '#8b5cf6', '#3b82f6', '#eab308', '#64748b']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Design System</h1>
        <p className="text-muted-foreground mt-1">
          Visual tokens, typography, and component library for InvestIQ
        </p>
      </div>

      <Tabs defaultValue="colors" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="colors">Color Palette</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="spacing">Spacing</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        {/* Colors */}
        <TabsContent value="colors" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Semantic Colors
              </CardTitle>
              <CardDescription>Contextual meaning through color</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 p-4 rounded-lg bg-gain/5 border border-gain/20">
                  <div className="text-sm font-medium text-gain">Gain / Bullish</div>
                  <p className="text-xs text-muted-foreground">Used for positive price movements, bullish sentiment, and favorable indicators.</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-gain/15 text-gain border-gain/20">+2.34%</Badge>
                    <Badge className="bg-gain/15 text-gain border-gain/20">Bullish</Badge>
                  </div>
                </div>
                <div className="space-y-2 p-4 rounded-lg bg-loss/5 border border-loss/20">
                  <div className="text-sm font-medium text-loss">Loss / Bearish</div>
                  <p className="text-xs text-muted-foreground">Used for negative price movements, bearish sentiment, and risk warnings.</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-loss/15 text-loss border-loss/20">-1.52%</Badge>
                    <Badge className="bg-loss/15 text-loss border-loss/20">Bearish</Badge>
                  </div>
                </div>
                <div className="space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="text-sm font-medium text-primary">AI / Primary</div>
                  <p className="text-xs text-muted-foreground">Brand color and AI-powered feature indicators. Represents intelligence and insight.</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-primary/15 text-primary border-primary/20 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />AI Summary
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2 p-4 rounded-lg bg-chart-3/5 border border-chart-3/20">
                  <div className="text-sm font-medium text-chart-3">Warning / Attention</div>
                  <p className="text-xs text-muted-foreground">Used for caution indicators, neutral sentiment, and attention-grabbing elements.</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-chart-3/15 text-chart-3 border-chart-3/20">Neutral</Badge>
                    <Badge className="bg-chart-3/15 text-chart-3 border-chart-3/20">Caution</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography */}
        <TabsContent value="typography" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Type className="w-5 h-5 text-primary" />
                Typography Scale
              </CardTitle>
              <CardDescription>Geist Sans font family with modular type scale</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {typographyScale.map((t) => (
                  <div key={t.label} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 pb-4 border-b border-border/50 last:border-0">
                    <span className="text-xs font-mono text-muted-foreground w-28 shrink-0">{t.label}</span>
                    <span
                      style={{ fontSize: t.size, fontWeight: t.weight }}
                      className="text-foreground truncate"
                    >
                      {t.sample}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono ml-auto shrink-0 hidden sm:block">
                      {t.size} / {t.weight}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Financial Typography Patterns</CardTitle>
              <CardDescription>Specialized text treatments for financial data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Large Price</div>
                  <div className="text-4xl font-bold tabular-nums">$228.68</div>
                </div>
                <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Market Cap</div>
                  <div className="text-4xl font-bold tabular-nums">$3.51T</div>
                </div>
                <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tabular Data</div>
                  <div className="font-mono text-sm space-y-1">
                    <div className="flex justify-between"><span>Open</span><span>225.42</span></div>
                    <div className="flex justify-between"><span>High</span><span>229.15</span></div>
                    <div className="flex justify-between"><span>Low</span><span>224.80</span></div>
                    <div className="flex justify-between"><span>Close</span><span>228.68</span></div>
                  </div>
                </div>
                <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monospace Metrics</div>
                  <div className="font-mono text-sm space-y-1">
                    <div className="flex justify-between"><span>P/E</span><span>33.8x</span></div>
                    <div className="flex justify-between"><span>Vol</span><span>52.3M</span></div>
                    <div className="flex justify-between"><span>Mkt Cap</span><span>3.51T</span></div>
                    <div className="flex justify-between"><span>52W Range</span><span>164-237</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spacing */}
        <TabsContent value="spacing" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Move className="w-5 h-5 text-primary" />
                Spacing Scale
              </CardTitle>
              <CardDescription>Tailwind CSS spacing tokens used in the design system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {spacingTokens.map((s) => (
                  <div key={s.token} className="flex items-center gap-4">
                    <span className="text-xs font-mono text-muted-foreground w-28 shrink-0">{s.token}</span>
                    <div className="flex-1 flex items-center">
                      <div
                        className="h-3 rounded bg-primary/60"
                        style={{ width: s.value }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Radius & Elevation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'sm', radius: 'var(--radius-sm)', cls: 'rounded-sm' },
                  { label: 'md', radius: 'var(--radius-md)', cls: 'rounded-md' },
                  { label: 'lg', radius: 'var(--radius-lg)', cls: 'rounded-lg' },
                  { label: 'xl', radius: 'var(--radius-xl)', cls: 'rounded-xl' },
                ].map((r) => (
                  <div key={r.label} className="text-center space-y-2">
                    <div className={`bg-muted h-20 w-full ${r.cls} border border-border`} />
                    <span className="text-xs font-mono text-muted-foreground">{r.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components */}
        <TabsContent value="components" className="space-y-6">
          {componentExamples.map((comp) => (
            <Card key={comp.name} className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{comp.name}</CardTitle>
                <CardDescription>{comp.description}</CardDescription>
              </CardHeader>
              <CardContent>{comp.demo}</CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Charts */}
        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Area Chart — Price History</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={tickerData['AAPL'].priceHistory.slice(-30)}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.3)" tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.3)" domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip contentStyle={{ background: '#22223b', border: '1px solid #33334d', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="close" stroke="#10b981" fill="url(#areaGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Bar Chart — Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={tickerData['NVDA'].priceHistory.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.3)" tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.3)" />
                    <Tooltip contentStyle={{ background: '#22223b', border: '1px solid #33334d', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="volume" fill="#10b981" radius={[2, 2, 0, 0]} opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pie Chart — Sector Allocation</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={pieColors[i]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#22223b', border: '1px solid #33334d', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Line Chart — Multi-series</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={marketIndices[0].sparkline.map((v, i) => ({ i, sp500: v, nasdaq: marketIndices[1].sparkline[i] }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="i" tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.3)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.3)" />
                    <Tooltip contentStyle={{ background: '#22223b', border: '1px solid #33334d', borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="sp500" stroke="#10b981" strokeWidth={2} dot={false} name="S&P 500" />
                    <Line type="monotone" dataKey="nasdaq" stroke="#8b5cf6" strokeWidth={2} dot={false} name="NASDAQ" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}