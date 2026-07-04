import { create } from 'zustand'

export type ScreenId = 'dashboard' | 'news' | 'ticker' | 'trends' | 'design-system'

interface AppState {
  activeScreen: ScreenId
  selectedTicker: string | null
  setActiveScreen: (screen: ScreenId) => void
  setSelectedTicker: (ticker: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeScreen: 'dashboard',
  selectedTicker: null,
  setActiveScreen: (screen) => set({ activeScreen: screen }),
  setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),
}))