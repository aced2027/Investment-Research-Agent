'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { DashboardScreen } from '@/components/screens/dashboard'
import { NewsFeedScreen } from '@/components/screens/news-feed'
import { TickerDetailScreen } from '@/components/screens/ticker-detail'
import { TrendAnalysisScreen } from '@/components/screens/trend-analysis'
import { AIAgentScreen } from '@/components/screens/ai-agent'
import { AuthScreen } from '@/components/screens/auth'
import { useAppStore } from '@/store/use-app-store'
import { ScrollArea } from '@/components/ui/scroll-area'

const screens = {
  dashboard: DashboardScreen,
  news: NewsFeedScreen,
  ticker: TickerDetailScreen,
  trends: TrendAnalysisScreen,
  'ai-agent': AIAgentScreen,
}

export default function Home() {
  const { activeScreen, user, isDemoMode } = useAppStore()
  
  // Auth Gate: Check if user is signed in or in demo mode
  if (!user && !isDemoMode) {
    return <AuthScreen />
  }

  const ActiveScreen = screens[activeScreen]

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <ScrollArea className="h-screen w-full min-w-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full min-w-0 mx-auto">
            <ActiveScreen />
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}