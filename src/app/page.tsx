'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { DashboardScreen } from '@/components/screens/dashboard'
import { NewsFeedScreen } from '@/components/screens/news-feed'
import { TickerDetailScreen } from '@/components/screens/ticker-detail'
import { TrendAnalysisScreen } from '@/components/screens/trend-analysis'
import { DesignSystemScreen } from '@/components/screens/design-system'
import { useAppStore } from '@/store/use-app-store'
import { ScrollArea } from '@/components/ui/scroll-area'

const screens = {
  dashboard: DashboardScreen,
  news: NewsFeedScreen,
  ticker: TickerDetailScreen,
  trends: TrendAnalysisScreen,
  'design-system': DesignSystemScreen,
}

export default function Home() {
  const { activeScreen } = useAppStore()
  const ActiveScreen = screens[activeScreen]

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <ScrollArea className="h-screen">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
            <ActiveScreen />
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}