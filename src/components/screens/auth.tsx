'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/use-app-store'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  Bot,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'

export function AuthScreen() {
  const { setUser, setDemoMode } = useAppStore()
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!isSupabaseConfigured) {
        // Fallback Mock Authentication (Demo/Sandbox Mode)
        await new Promise((resolve) => setTimeout(resolve, 1200)) // Simulation
        if (activeTab === 'login') {
          setUser({
            id: 'mock-user-123',
            email: email.trim(),
            name: email.split('@')[0],
          })
          setSuccess('Logged in successfully (Demo Mode)!')
        } else {
          setSuccess('Account created successfully (Demo Mode)! You can now log in.')
          setActiveTab('login')
        }
      } else {
        // Live Supabase Authentication
        if (activeTab === 'login') {
          const { data, error: err } = await supabase!.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          })
          if (err) throw err
          if (data.user) {
            setUser({
              id: data.user.id,
              email: data.user.email || email.trim(),
            })
            setSuccess('Logged in successfully!')
          }
        } else {
          const { data, error: err } = await supabase!.auth.signUp({
            email: email.trim(),
            password: password,
          })
          if (err) throw err
          setSuccess('Registration successful! Please check your email for confirmation.')
          setActiveTab('login')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoMode = () => {
    setDemoMode(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial-dark p-4 relative overflow-hidden select-none">
      {/* Decorative gradient glowing spots */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[450px] space-y-6 relative z-10">
        {/* App Logo & Title */}
        <div className="flex flex-col items-center justify-center text-center space-y-3 mb-2">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 shadow-lg shadow-primary/5 relative group transition-all duration-300">
            <Bot className="w-7 h-7 text-primary" />
            <div className="absolute inset-0 rounded-2xl bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md pointer-events-none" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center justify-center gap-1.5 font-sans">
              InvestIQ
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              AI-Powered Investment Intelligence
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="bg-card/35 border-border/80 backdrop-blur-md shadow-2xl relative">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
              <div className="flex gap-4">
                <button
                  onClick={() => { setActiveTab('login'); setError(null); setSuccess(null); }}
                  className={`text-sm font-semibold pb-2 transition-all border-b-2 ${
                    activeTab === 'login'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setActiveTab('signup'); setError(null); setSuccess(null); }}
                  className={`text-sm font-semibold pb-2 transition-all border-b-2 ${
                    activeTab === 'signup'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Create Account
                </button>
              </div>
              <Badge variant="outline" className={`text-[10px] ${isSupabaseConfigured ? 'border-primary/25 text-primary bg-primary/5' : 'border-amber-500/25 text-amber-500 bg-amber-500/5'}`}>
                {isSupabaseConfigured ? 'Live Database' : 'Sandbox Mode'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {activeTab === 'login'
                ? 'Sign in to access your investment dashboards, custom news feeds, and AI reports.'
                : 'Create an account to build your custom portfolio monitoring workspace.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Status Messages */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/25 text-destructive text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {!isSupabaseConfigured && (
              <div className="flex gap-2.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-500/90 text-[11px] leading-relaxed">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  Supabase API keys are not yet configured. The screen will simulate authentication locally so you can preview the platform features.
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-muted/20 border-border focus-visible:ring-primary focus-visible:ring-1 text-sm h-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-foreground">Password</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 bg-muted/20 border-border focus-visible:ring-primary focus-visible:ring-1 text-sm h-10"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold h-10 rounded-lg shadow-lg shadow-primary/10 text-sm gap-2 mt-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2 pb-6 border-t border-border/30">
            <div className="flex items-center justify-between w-full text-xs">
              <span className="text-muted-foreground">Just looking around?</span>
              <Button
                variant="link"
                size="sm"
                onClick={handleDemoMode}
                className="text-primary hover:text-primary/80 font-semibold p-0 h-auto"
              >
                Launch Sandbox Analyst Mode
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
