import { create } from 'zustand'

export type ScreenId = 'dashboard' | 'news' | 'ticker' | 'trends' | 'ai-agent'

export interface UserProfile {
  id: string
  email: string
  name?: string
}

interface AppState {
  activeScreen: ScreenId
  selectedTicker: string | null
  user: UserProfile | null
  isDemoMode: boolean
  setActiveScreen: (screen: ScreenId) => void
  setSelectedTicker: (ticker: string) => void
  setUser: (user: UserProfile | null) => void
  setDemoMode: (isDemo: boolean) => void
  logout: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  activeScreen: 'dashboard',
  selectedTicker: null,
  user: null,
  isDemoMode: false,
  setActiveScreen: (screen) => set({ activeScreen: screen }),
  setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),
  setUser: (user) => set({ user, isDemoMode: user ? false : false }),
  setDemoMode: (isDemo) => set({ isDemoMode: isDemo, user: isDemo ? { id: 'demo-user', email: 'demo@investiq.ai', name: 'Demo Analyst' } : null }),
  logout: async () => {
    set({ user: null, isDemoMode: false, activeScreen: 'dashboard' })
  },
}))