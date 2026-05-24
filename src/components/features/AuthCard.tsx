'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Github } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface AuthCardProps {
  mode: 'login' | 'signup'
}

export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const isLogin = mode === 'login'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const supabase = createClient()

    try {
      if (!isLogin) {
        // === SIGN UP ===
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('This email is already in use. Please log in instead.')
          } else if (signUpError.message.includes('Password should be')) {
            setError('Password must be at least 6 characters long.')
          } else {
            setError(signUpError.message)
          }
          return
        }

        // Success — show confirmation message (no redirect to dashboard)
        setSignUpSuccess(true)

      } else {
        // === LOGIN ===
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        // Successful login
        router.push('/history');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  if (signUpSuccess) {
    return (
      <div className="w-full max-w-md">
        <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-primary text-3xl">mail</span>
          </div>
          <h2 className="font-headline text-2xl font-semibold tracking-tight text-on-surface mb-2">
            Check your email
          </h2>
          <p className="text-on-surface-variant mb-6">
            We’ve sent a confirmation link to <span className="font-medium text-on-surface">{email}</span>.
            Please click the link to activate your account.
          </p>
          <p className="text-sm text-on-surface-variant">
            Once confirmed, you can log in and access your dashboard.
          </p>
        </div>
      </div>
    )
  }

  if (signUpSuccess) {
    return (
      <div className="w-full max-w-md">
        <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-primary text-3xl">mail</span>
          </div>
          <h2 className="font-headline text-2xl font-semibold tracking-tight text-on-surface mb-2">
            Check your email
          </h2>
          <p className="text-on-surface-variant mb-6">
            We’ve sent a confirmation link to <span className="font-medium text-on-surface">{email}</span>.
            Please click the link to activate your account.
          </p>
          <p className="text-sm text-on-surface-variant">
            Once confirmed, you can log in and access your dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 blur-3xl rounded-full"></div>

        <div className="relative z-10 flex flex-col gap-8">
          <div className="text-center">
            <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
              {isLogin ? 'Welcome Back' : 'Secure Your Brand Deals'}
            </h1>
            <p className="text-on-surface-variant mt-2 text-sm">
              {isLogin ? 'Log in to manage your audits' : 'Start your professional risk analysis'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-on-surface-variant ml-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@creator.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-on-surface-variant ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-error text-center bg-error/10 border border-error/20 rounded-lg py-2 px-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full shimmer-btn bg-primary text-on-primary font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : isLogin ? 'Sign In with Email' : 'Sign Up with Email'}
            </button>
          </form>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-outline-variant"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-on-surface-variant font-mono">Quick Sign In</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-all py-3 rounded-xl font-medium text-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-all py-3 rounded-xl font-medium text-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.96.95-2.04 1.43-3.08 1.43-1.04 0-1.89-.37-2.67-.86-.88-.56-1.86-.56-2.74 0-.81.52-1.74.91-2.92.91-1.28 0-2.58-.69-3.8-2.09-2.53-2.9-2.26-7.86.53-10.87 1.39-1.5 2.96-2.26 4.6-2.26 1.13 0 2.05.34 2.81.75.7.37 1.4.37 2.11 0 .97-.5 2.21-.91 3.51-.91 2.08 0 3.75.92 4.91 2.37-3.41 1.95-2.87 6.64.6 8.3-1 2.31-2.67 4.54-3.96 5.23zm-.68-15.35c0 2.2-1.83 4-4.08 4-.09 0-.17-.01-.26-.01.37-2.3 2.11-4.07 4.26-4.07.03 0 .06 0 .08.08z" />
              </svg>
              Apple
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-on-surface-variant">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <Link 
              href={isLogin ? '/signup' : '/login'} 
              className="text-primary font-bold hover:underline underline-offset-4"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </Link>
          </div>

          <div className="text-[10px] text-center text-on-surface-variant leading-relaxed uppercase tracking-widest font-mono">
            By continuing, you agree to our <br/>
            <Link href="/terms" className="hover:text-on-surface underline">Terms of Service</Link>
            {' & '}
            <Link href="/privacy" className="hover:text-on-surface underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
