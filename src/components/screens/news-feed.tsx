'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Sparkles,
  Search,
  Filter,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Copy,
  CheckCircle2,
  Loader2,
  Rss,
  Brain,
  AlertTriangle,
  RefreshCw,
  Radio,
} from 'lucide-react'
import { getMarketNews, getCompanyNews, getNewsDataSource, summarizeArticles, type NewsItem } from '@/services/news-service'
import { cn } from '@/lib/utils'

const categories = ['All', 'General', 'Technology', 'Finance', 'Healthcare', 'Consumer', 'Energy']
const REFRESH_INTERVAL_MS = 60_000 // Auto-refresh every 60 seconds
const NEWS_SOURCES = ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']

type NewsItemWithSummary = NewsItem & { aiSummary?: string }

function SentimentIcon({ sentiment }: { sentiment: NewsItem['sentiment'] }) {
  switch (sentiment) {
    case 'bullish': return <TrendingUp className="w-3.5 h-3.5 text-gain" />
    case 'bearish': return <TrendingDown className="w-3.5 h-3.5 text-loss" />
    default: return <Minus className="w-3.5 h-3.5 text-chart-3" />
  }
}

function NewsCard({ item, onSummarize, isSummarizing, summarizedId, isNew }: {
  item: NewsItemWithSummary
  onSummarize: (id: string) => void
  isSummarizing: boolean
  summarizedId: string | null
  isNew?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const isExpanded = summarizedId === item.id

  const sentimentColor = {
    bullish: 'text-gain bg-gain/10 border-gain/20',
    bearish: 'text-loss bg-loss/10 border-loss/20',
    neutral: 'text-chart-3 bg-chart-3/10 border-chart-3/20',
  }[item.sentiment]

  const handleCopy = () => {
    navigator.clipboard.writeText(item.aiSummary || item.summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className={cn(
      'bg-card border-border hover:border-primary/30 transition-all duration-500 group',
      isNew && 'animate-in fade-in slide-in-from-top-4 border-primary/30'
    )}>
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {isNew && (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0 animate-pulse">
                NEW
              </Badge>
            )}
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border', sentimentColor)}>
              <SentimentIcon sentiment={item.sentiment} />
              <span className="ml-1 capitalize">{item.sentiment}</span>
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border">{item.category}</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" />
            {item.time}
          </span>
        </div>

        {/* Title, Source & Image */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[11px] text-muted-foreground">Source: {item.source}</p>
              {item.url && item.url !== '#' && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5">
                  Read more <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
          {item.image && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <img
                src={item.image}
                alt=""
                className="w-16 h-16 object-cover rounded-md border border-border"
                loading="lazy"
              />
            </a>
          )}
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground leading-relaxed">{item.summary}</p>

        {/* Tickers */}
        {item.tickers.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {item.tickers.map((t) => (
              <Badge key={t} variant="secondary" className="text-[11px] font-mono">{t}</Badge>
            ))}
          </div>
        )}

        {/* AI Summary Section */}
        {isExpanded && item.aiSummary && (
          <div className="mt-3 p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center">
                  <Brain className="w-3 h-3 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary">AI Analysis</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-gain" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{item.aiSummary}</div>
          </div>
        )}

        {/* Action */}
        {!isExpanded && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => onSummarize(item.id)}
            disabled={isSummarizing}
          >
            {isSummarizing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Generating AI Summary...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                AI Summarize & Analyze
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function LiveIndicator({ lastUpdated, isRefreshing, source }: { lastUpdated: Date | null; isRefreshing: boolean; source: 'live' | 'fallback' }) {
  return (
    <div className="flex items-center gap-3">
      {/* Live badge with pulsing dot */}
      {source === 'live' ? (
        <Badge className="bg-gain/15 text-gain border-gain/30 text-xs px-3 py-1 gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gain opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gain" />
          </span>
          LIVE
        </Badge>
      ) : (
        <Badge className="bg-loss/15 text-loss border-loss/30 text-xs px-3 py-1 gap-1.5">
          <AlertTriangle className="w-3 h-3" />
          OFFLINE
        </Badge>
      )}

      {/* Last updated timestamp */}
      {lastUpdated && (
        <span className="text-[11px] text-muted-foreground hidden sm:inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Updated {lastUpdated.toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}

export function NewsFeedScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [summarizedId, setSummarizedId] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [allNews, setAllNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiSummaries, setAiSummaries] = useState<Record<string, string>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [newArticleIds, setNewArticleIds] = useState<Set<string>>(new Set())
  const [articleCount, setArticleCount] = useState(0)
  const [dataSource, setDataSource] = useState<'live' | 'fallback'>('live')
  const prevCountRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const loadNewsRef = useRef<(showRefresh?: boolean) => Promise<void>>(undefined)

  const loadNews = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true)
      else if (articleCount === 0) setLoading(true)
      setError(null)

      // Fetch market news + company news from multiple tickers for broader coverage
      const [marketNews, ...companyResults] = await Promise.all([
        getMarketNews('general'),
        ...NEWS_SOURCES.slice(0, 3).map((s) => getCompanyNews(s)),
      ])

      const companyNews = companyResults.flat()
      // Merge and deduplicate by id
      const merged = [...marketNews, ...companyNews]
      const seen = new Set<string>()
      const unique = merged.filter(n => {
        if (seen.has(n.id)) return false
        seen.add(n.id)
        return true
      })

      // Sort by datetime (newest first) using resolved timestamp
      unique.sort((a, b) => {
        const timeA = a.timestamp || 0
        const timeB = b.timestamp || 0
        return timeB - timeA
      })

      // Detect new articles
      setAllNews(prev => {
        const existingIds = new Set(prev.map(n => n.id))
        const fresh = unique.filter(n => !existingIds.has(n.id))
        if (fresh.length > 0) {
          setNewArticleIds(new Set(fresh.map(n => n.id)))
          setTimeout(() => setNewArticleIds(new Set()), 10_000)
        }
        return unique
      })

      setArticleCount(unique.length)
      prevCountRef.current = unique.length
      setLastUpdated(new Date())
      setDataSource(getNewsDataSource())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Keep ref in sync so interval always calls latest version
  useEffect(() => {
    loadNewsRef.current = loadNews
  }, [loadNews])

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      loadNews()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadNews])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadNewsRef.current?.(true)
    }, REFRESH_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const filteredNews = useMemo(() => {
    return allNews.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tickers.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [allNews, searchQuery, activeCategory])

  const handleSummarize = async (newsId: string) => {
    const item = allNews.find(n => n.id === newsId)
    if (!item) return

    setIsSummarizing(true)
    try {
      const result = await summarizeArticles([{
        headline: item.title,
        summary: item.summary,
        source: item.source,
        category: item.category,
      }])
      setAiSummaries(prev => ({ ...prev, [newsId]: result.analysis }))
      setSummarizedId(newsId)
    } catch (err) {
      setAiSummaries(prev => ({ ...prev, [newsId]: 'AI analysis is currently unavailable. Please try again later.' }))
      setSummarizedId(newsId)
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleManualRefresh = () => {
    loadNews(true)
  }

  // Loading skeleton state
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-2">
              {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-7 w-16" />)}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Rss className="w-8 h-8 text-primary" />
          News & Summarizer
        </h1>
        <Card className="bg-loss/5 border-loss/20">
          <CardContent className="p-8 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-loss mx-auto" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={handleManualRefresh} variant="outline" className="border-primary/30 text-primary">Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Empty state
  if (filteredNews.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Rss className="w-8 h-8 text-primary" />
              News & Summarizer
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered market news analysis and summarization
            </p>
          </div>
          <LiveIndicator lastUpdated={lastUpdated} isRefreshing={isRefreshing} source={dataSource} />
        </div>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search news, tickers, or topics..."
                className="bg-muted/50 border-border focus:border-primary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-7 text-xs',
                    activeCategory === cat
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No news articles match your search criteria. Try a different filter or search term.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Rss className="w-8 h-8 text-primary" />
            News & Summarizer
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered live market news analysis and summarization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator lastUpdated={lastUpdated} isRefreshing={isRefreshing} source={dataSource} />
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search news, tickers, or topics..."
              className="bg-muted/50 border-border focus:border-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-7 text-xs',
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            ))}
            <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
              <Radio className="w-3 h-3 text-gain" />
              <span>{filteredNews.length} article{filteredNews.length !== 1 ? 's' : ''} &middot; Auto-refresh: {REFRESH_INTERVAL_MS / 1000}s</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News Feed */}
      <div className="space-y-3">
        {filteredNews.map((item) => (
          <NewsCard
            key={item.id}
            item={{ ...item, aiSummary: aiSummaries[item.id] }}
            onSummarize={handleSummarize}
            isSummarizing={isSummarizing}
            summarizedId={summarizedId}
            isNew={newArticleIds.has(item.id)}
          />
        ))}
      </div>

      {/* Live Feed Footer */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Brain className="w-4 h-4 text-primary" />
              <span>AI Engine: GPT-4 Turbo | Sentiment model: v3.2</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {dataSource === 'live' ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gain opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gain" />
                  </span>
                  <span className="text-gain">Live via Marketaux API</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-loss" />
                  <span className="text-loss">Showing cached data — API key may be invalid</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}