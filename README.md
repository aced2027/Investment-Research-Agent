# InvestIQ — AI Investment Research Agent

InvestIQ is a premium, high-fidelity AI-powered investment research platform designed to help retail investors and financial analysts synthesize market data, analyze trends, track sentiment, and get conversational stock advice.

---

## 🚀 Key Features

*   **Market Intelligence (Dashboard)**: Track real-time major indices (SPY, QQQ, DIA, IWM), top market gainers/losers, and automated AI market outlooks.
*   **News & AI Summarizer**: Access live aggregate market news feeds with instant, one-click AI-powered news summaries, bullish/bearish signal generation, and investment outlooks.
*   **Ticker Research**: Dive deep into any asset (e.g., NVDA, AAPL, TSLA) with interactive chart rendering, analyst recommendation gauges, and executive insider sentiment trackers.
*   **Trend Analysis**: Synthesize sector performance distributions, aggregate market sentiment vectors, and stay ahead of upcoming announcements via the earnings calendar tracker.
*   **AI Conversational Agent**: Interact with a financial research chatbot built to analyze risk factors, compare tickers, and synthesize macro data points.
*   **Secure Authentication**: Fully integrated authentication gate (Sign In, Sign Up, and Log Out) powered by **Supabase Auth**.

---

## 🛠️ Technology Stack

*   **Framework**: [Next.js](https://nextjs.org/) (App Router & TailwindCSS)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
*   **Database & Auth**: [Supabase](https://supabase.com/)
*   **AI Integrations**: [OpenRouter API](https://openrouter.ai/) (Conversational Chatbot)
*   **UI Components**: [Shadcn/UI](https://ui.shadcn.com/) & [Lucide Icons](https://lucide.dev/)
*   **Data Visualizations**: [Recharts](https://recharts.org/)

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory of the project and add the following keys:

```env
# Financial Data APIs
FINNHUB_API_KEY=your-finnhub-key
MARKETAUX_API_KEY=your-marketaux-key

# OpenRouter API (Conversational AI)
OPENROUTER_API_KEY=your-openrouter-key

# Supabase Auth Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-public-anon-key
```

---

## 📦 Installation & Local Running

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/aced2027/Investment-Research-Agent.git
    cd Investment-Research-Agent
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run Development Server**:
    We use a dedicated server script to guarantee compilation stability:
    ```bash
    node server.mjs
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployment Instructions

### Deploying to Render
1.  Connect your GitHub repository to **Render**.
2.  Choose **Web Service** with the **Node** runtime.
3.  Set the **Build Command** to: `npm install; npm run build`
4.  Set the **Start Command** to: `node server.mjs`
5.  Click **Add from .env** and paste your environment variables.
6.  Launch!

### Deploying to Netlify
1.  Connect your repository to **Netlify**.
2.  Set **Build Command** to: `npm run build`
3.  Set **Publish Directory** to: `.next`
4.  Import all environment variables from your `.env` file under **Site Settings -> Environment Variables**.
5.  Deploy!
