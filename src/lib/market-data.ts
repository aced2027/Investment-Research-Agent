// Mock market data for the Investment Research Agent

export interface NewsItem {
  id: string
  title: string
  source: string
  time: string
  summary: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  tickers: string[]
  category: string
  aiSummary?: string
}

export interface TickerData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: string
  marketCap: string
  pe: number
  high52w: number
  low52w: number
  avgVolume: string
  sector: string
  analystRating: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell'
  priceHistory: { date: string; open: number; high: number; low: number; close: number; volume: number }[]
}

export interface MarketIndex {
  name: string
  value: number
  change: number
  changePercent: number
  sparkline: number[]
}

export interface SectorData {
  name: string
  performance: number
  volume: string
}

export interface TrendPoint {
  date: string
  value: number
  sentiment: number
  volume: number
}

export const marketIndices: MarketIndex[] = [
  { name: 'S&P 500', value: 5532.18, change: 28.42, changePercent: 0.52, sparkline: [5480, 5495, 5510, 5488, 5502, 5515, 5532] },
  { name: 'NASDAQ', value: 17918.20, change: -45.30, changePercent: -0.25, sparkline: [18020, 17980, 17950, 17970, 17940, 17900, 17918] },
  { name: 'DOW', value: 43287.65, change: 156.80, changePercent: 0.36, sparkline: [43100, 43150, 43200, 43180, 43250, 43270, 43287] },
  { name: 'Russell 2000', value: 2085.42, change: 12.15, changePercent: 0.59, sparkline: [2060, 2065, 2072, 2068, 2078, 2082, 2085] },
]

export const newsItems: NewsItem[] = [
  {
    id: '1',
    title: 'Federal Reserve Signals Potential Rate Cut in September Meeting Minutes',
    source: 'Reuters',
    time: '2 hours ago',
    summary: 'The Federal Reserve indicated a willingness to lower interest rates in September, citing cooling inflation and a stabilizing labor market. Officials noted that recent economic data supports a more accommodative monetary policy stance.',
    sentiment: 'bullish',
    tickers: ['SPY', 'QQQ', 'TLT'],
    category: 'Macro',
    aiSummary: 'The Fed\'s dovish pivot signals a clear shift in monetary policy direction. Markets should expect reduced borrowing costs, which historically boosts equity valuations, particularly in rate-sensitive sectors like technology and real estate. Bond yields likely to compress, creating opportunities in fixed income. Key risk: if inflation re-accelerates, this pivot could reverse sharply.'
  },
  {
    id: '2',
    title: 'NVIDIA Reports Record Q2 Revenue, AI Demand Continues to Surge',
    source: 'Bloomberg',
    time: '4 hours ago',
    summary: 'NVIDIA smashed expectations with $30 billion in quarterly revenue, driven by unprecedented demand for AI training and inference chips. Data center revenue grew 250% year-over-year, and the company raised guidance for the next quarter.',
    sentiment: 'bullish',
    tickers: ['NVDA', 'AMD', 'SMCI'],
    category: 'Earnings',
    aiSummary: 'NVIDIA\'s blowout quarter reinforces the AI infrastructure buildout thesis. The 250% data center growth rate, while extraordinary, shows signs of sustainability given enterprise AI adoption remains early. Key watch: gross margin expansion indicates pricing power, but supply chain constraints remain the primary growth limiter. AMD and custom silicon players represent emerging competitive dynamics.'
  },
  {
    id: '3',
    title: 'Oil Prices Drop 5% on OPEC+ Output Increase Agreement',
    source: 'Financial Times',
    time: '5 hours ago',
    summary: 'OPEC+ members agreed to increase production by 400,000 barrels per day starting next month, sending crude oil prices sharply lower. The decision reflects growing pressure from consuming nations and concerns about economic slowdown.',
    sentiment: 'bearish',
    tickers: ['XOM', 'CVX', 'USO'],
    category: 'Commodities',
    aiSummary: 'The OPEC+ production increase signals a shift from supply discipline to market share defense. Lower oil prices act as a stealth stimulus for consumers but pressure energy sector margins. Expect a rotation: energy underperforms while transportation, chemicals, and consumer discretionary benefit from reduced input costs. Geopolitical risk premium in oil remains elevated.'
  },
  {
    id: '4',
    title: 'Apple Unveils Next-Gen AI Features Across Entire Product Ecosystem',
    source: 'CNBC',
    time: '6 hours ago',
    summary: 'Apple announced a comprehensive AI integration strategy spanning iPhone, Mac, and iPad, featuring on-device intelligence, enhanced Siri capabilities, and developer tools for building AI-powered applications.',
    sentiment: 'bullish',
    tickers: ['AAPL', 'MSFT', 'GOOGL'],
    category: 'Technology',
    aiSummary: 'Apple\'s AI strategy positions the company to capture enterprise and consumer AI demand through its massive installed base. On-device processing addresses privacy concerns and reduces latency. The developer ecosystem play is critical: if Apple can replicate the App Store moment for AI apps, it creates a powerful moat. Risk: execution gap between announcement and shipped features has been notable in recent cycles.'
  },
  {
    id: '5',
    title: 'China Manufacturing PMI Contracts for Third Consecutive Month',
    source: 'SCMP',
    time: '8 hours ago',
    summary: 'China\'s official manufacturing PMI fell to 49.2, below the 50 expansion threshold for the third straight month. Weak domestic demand and export headwinds continue to pressure the industrial sector, raising calls for additional stimulus.',
    sentiment: 'bearish',
    tickers: ['FXI', 'BABA', 'EEM'],
    category: 'Global',
    aiSummary: 'Three consecutive months of contraction in Chinese manufacturing signals deepening structural challenges. Property sector weakness is cascading into industrial demand. While stimulus expectations are rising, the effectiveness of past measures has been limited. Implications: commodities demand remains soft, emerging market exporters face headwinds, and technology supply chains may see further diversification away from China.'
  },
  {
    id: '6',
    title: 'JPMorgan Raises S&P 500 Year-End Target to 6,000 on Earnings Growth',
    source: 'MarketWatch',
    time: '10 hours ago',
    summary: 'JPMorgan\'s equity strategists upgraded their S&P 500 year-end price target to 6,000 from 5,600, citing stronger-than-expected corporate earnings, AI-driven productivity gains, and favorable monetary policy outlook.',
    sentiment: 'bullish',
    tickers: ['SPY', 'VOO', 'IVV'],
    category: 'Strategy',
    aiSummary: 'JPMorgan\'s target revision reflects a convergence of positive factors: earnings revisions turning positive, AI productivity gains beginning to show in margins, and Fed pivot expectations. The 8.5% upside from current levels implies continued bullish momentum. However, positioning data suggests markets are already long, creating vulnerability to negative surprises. Key catalysts to watch: Q3 earnings season and September Fed meeting.'
  },
]

function generatePriceHistory(basePrice: number, days: number, volatility: number) {
  const history = []
  let price = basePrice * (1 - volatility * days * 0.001)
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - i))
    const change = (Math.random() - 0.48) * volatility
    const open = price
    const close = price + change
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * 0.5
    history.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(15000000 + Math.random() * 35000000),
    })
    price = close
  }
  return history
}

export const tickerData: Record<string, TickerData> = {
  'AAPL': {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 228.68,
    change: 3.42,
    changePercent: 1.52,
    volume: '52.3M',
    marketCap: '3.51T',
    pe: 33.8,
    high52w: 237.49,
    low52w: 164.08,
    avgVolume: '58.2M',
    sector: 'Technology',
    analystRating: 'strong-buy',
    priceHistory: generatePriceHistory(228.68, 90, 3),
  },
  'NVDA': {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 131.88,
    change: 5.23,
    changePercent: 4.12,
    volume: '312.5M',
    marketCap: '3.24T',
    pe: 65.2,
    high52w: 140.76,
    low52w: 47.32,
    avgVolume: '285.1M',
    sector: 'Technology',
    analystRating: 'strong-buy',
    priceHistory: generatePriceHistory(131.88, 90, 5),
  },
  'MSFT': {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 442.57,
    change: -2.15,
    changePercent: -0.48,
    volume: '22.1M',
    marketCap: '3.29T',
    pe: 37.4,
    high52w: 468.35,
    low52w: 309.45,
    avgVolume: '24.8M',
    sector: 'Technology',
    analystRating: 'buy',
    priceHistory: generatePriceHistory(442.57, 90, 4),
  },
  'GOOGL': {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 192.40,
    change: 1.87,
    changePercent: 0.98,
    volume: '28.7M',
    marketCap: '2.37T',
    pe: 25.6,
    high52w: 201.40,
    low52w: 130.67,
    avgVolume: '25.3M',
    sector: 'Technology',
    analystRating: 'buy',
    priceHistory: generatePriceHistory(192.40, 90, 3),
  },
  'AMZN': {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 198.56,
    change: 4.12,
    changePercent: 2.12,
    volume: '45.2M',
    marketCap: '2.06T',
    pe: 42.1,
    high52w: 201.20,
    low52w: 118.35,
    avgVolume: '42.1M',
    sector: 'Consumer Cyclical',
    analystRating: 'buy',
    priceHistory: generatePriceHistory(198.56, 90, 3.5),
  },
  'XOM': {
    symbol: 'XOM',
    name: 'Exxon Mobil Corporation',
    price: 108.32,
    change: -3.45,
    changePercent: -3.09,
    volume: '18.9M',
    marketCap: '432.1B',
    pe: 12.8,
    high52w: 126.34,
    low52w: 95.77,
    avgVolume: '16.5M',
    sector: 'Energy',
    analystRating: 'hold',
    priceHistory: generatePriceHistory(108.32, 90, 2),
  },
  'JPM': {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    price: 214.85,
    change: 1.23,
    changePercent: 0.58,
    volume: '8.2M',
    marketCap: '614.2B',
    pe: 12.1,
    high52w: 220.30,
    low52w: 162.45,
    avgVolume: '9.8M',
    sector: 'Financial',
    analystRating: 'buy',
    priceHistory: generatePriceHistory(214.85, 90, 2.5),
  },
  'TSLA': {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 248.42,
    change: -6.78,
    changePercent: -2.66,
    volume: '98.3M',
    marketCap: '792.5B',
    pe: 68.4,
    high52w: 278.98,
    low52w: 138.80,
    avgVolume: '85.6M',
    sector: 'Consumer Cyclical',
    analystRating: 'hold',
    priceHistory: generatePriceHistory(248.42, 90, 6),
  },
}

export const sectorPerformance: SectorData[] = [
  { name: 'Technology', performance: 2.34, volume: '89.2B' },
  { name: 'Healthcare', performance: 1.12, volume: '45.6B' },
  { name: 'Financials', performance: 0.87, volume: '62.1B' },
  { name: 'Consumer Disc.', performance: 0.65, volume: '38.4B' },
  { name: 'Industrials', performance: 0.34, volume: '28.7B' },
  { name: 'Utilities', performance: 0.22, volume: '12.3B' },
  { name: 'Real Estate', performance: -0.15, volume: '8.9B' },
  { name: 'Materials', performance: -0.48, volume: '18.2B' },
  { name: 'Energy', performance: -2.15, volume: '42.8B' },
  { name: 'Comm. Services', performance: -0.31, volume: '32.5B' },
]

export function generateTrendData(days: number): TrendPoint[] {
  const data: TrendPoint[] = []
  let value = 100
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - i))
    value += (Math.random() - 0.47) * 2
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
      sentiment: Math.round((Math.random() * 100 - 20) * 100) / 100,
      volume: Math.round(50000000 + Math.random() * 100000000),
    })
  }
  return data
}

export const topGainers = [
  { symbol: 'SMCI', name: 'Super Micro', change: 8.42, price: 782.35 },
  { symbol: 'ARM', name: 'ARM Holdings', change: 5.67, price: 168.90 },
  { symbol: 'PLTR', name: 'Palantir', change: 4.89, price: 42.15 },
  { symbol: 'CRWD', name: 'CrowdStrike', change: 3.76, price: 345.20 },
  { symbol: 'MDB', name: 'MongoDB', change: 3.12, price: 328.45 },
]

export const topLosers = [
  { symbol: 'XOM', name: 'Exxon Mobil', change: -3.09, price: 108.32 },
  { symbol: 'CVX', name: 'Chevron', change: -2.87, price: 152.40 },
  { symbol: 'TSLA', name: 'Tesla', change: -2.66, price: 248.42 },
  { symbol: 'BA', name: 'Boeing', change: -2.15, price: 178.30 },
  { symbol: 'NKE', name: 'Nike', change: -1.92, price: 72.45 },
]

export const aiInsights = [
  { type: 'opportunity' as const, text: 'Strong accumulation pattern detected in NVDA — institutional buying volume up 340% over 5 sessions.', confidence: 87 },
  { type: 'risk' as const, text: 'Energy sector showing distribution signals — smart money exiting XOM and CVX positions.', confidence: 72 },
  { type: 'opportunity' as const, text: 'Healthcare sector rotation underway: biotech ETFs seeing 3x average inflows this week.', confidence: 78 },
  { type: 'alert' as const, text: 'VIX below 14 for 8 consecutive days — historically precedes volatility expansion within 5-10 trading days.', confidence: 81 },
]