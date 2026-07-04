'use client'

import { useState, useMemo } from 'react'
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
} from 'lucide-react'
import { newsItems, type NewsItem } from '@/lib/market-data'
import { cn } from '@/lib/utils'

const categories = ['All', 'Macro', 'Earnings', 'Technology', 'Commodities', 'Global', 'Strategy']

function SentimentIcon({ sentiment }: { sentiment: NewsItem['sentiment'] }) {
  switch (sentiment) {
    case 'bullish': return <TrendingUp className="w-3.5 h-3.5 text-gain" />
    case 'bearish': return <TrendingDown className="w-3.5 h-3.5 text-loss" />
    default: return <Minus className="w-3.5 h-3.5 text-chart-3" />
  }
}

function NewsCard({ item, onSummarize, isSummarizing, summarizedId }: {
  item: NewsItem
  onSummarize: (id: string) => void
  isSummarizing: boolean
  summarizedId: string | null
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
    <Card className="bg-card border-border hover:border-primary/30 transition-colors group">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
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

        {/* Title & Source */}
        <div>
          <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">Source: {item.source}</p>
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground leading-relaxed">{item.summary}</p>

        {/* Tickers */}
        <div className="flex items-center gap-2 flex-wrap">
          {item.tickers.map((t) => (
            <Badge key={t} variant="secondary" className="text-[11px] font-mono">{t}</Badge>
          ))}
        </div>

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
            <p className="text-sm text-foreground/90 leading-relaxed">{item.aiSummary}</p>
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

export function NewsFeedScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [summarizedId, setSummarizedId] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)

  const filteredNews = useMemo(() => {
    return newsItems.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tickers.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, activeCategory])

  const handleSummarize = async (id: string) => {
    setIsSummarizing(true)
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSummarizedId(id)
    setIsSummarizing(false)
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
            AI-powered market news analysis and summarization
          </p>
        </div>
        <Badge className="bg-primary/15 text-primary border-primary/20 self-start text-xs px-3 py-1">
          <Sparkles className="w-3 h-3 mr-1" />
          AI Enhanced
        </Badge>
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

      {/* News Feed */}
      <div className="space-y-3">
        {filteredNews.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No news articles match your search criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredNews.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              onSummarize={handleSummarize}
              isSummarizing={isSummarizing}
              summarizedId={summarizedId}
            />
          ))
        )}
      </div>

      {/* AI Processing Stats */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Brain className="w-4 h-4 text-primary" />
            <span>AI Engine: GPT-4 Turbo | Avg. analysis time: 1.2s | Sentiment model: v3.2</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}