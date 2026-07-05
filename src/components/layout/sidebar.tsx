'use client'

import { useAppStore, type ScreenId } from '@/store/use-app-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Newspaper,
  Search,
  TrendingUp,
  Bot,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useState } from 'react'

const navItems: { id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Market Intelligence', icon: LayoutDashboard },
  { id: 'news', label: 'News & Summarizer', icon: Newspaper },
  { id: 'ticker', label: 'Ticker Research', icon: Search },
  { id: 'trends', label: 'Trend Analysis', icon: TrendingUp },
  { id: 'ai-agent', label: 'AI Research Agent', icon: Bot },
]

export function Sidebar() {
  const { activeScreen, setActiveScreen, user, logout } = useAppStore()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 sticky top-0',
        collapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-sidebar-foreground truncate">InvestIQ</span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              AI Research Agent
            </span>
          </div>
        )}
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeScreen === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Icon className={cn('w-[18px] h-[18px] shrink-0', isActive && 'text-primary')} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary ai-pulse" />
              )}
            </button>
          )
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User profile section */}
      {user && (
        <div className="p-3 shrink-0 flex flex-col gap-2 overflow-hidden items-center border-b border-sidebar-border/30">
          <div className="flex items-center justify-between w-full gap-2 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-sidebar-foreground truncate">
                    {user.name || user.email.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate text-left">
                    {user.email}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={logout}
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
          {collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={logout}
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      <div className="p-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-muted-foreground hover:text-sidebar-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </Button>
      </div>
    </aside>
  )
}