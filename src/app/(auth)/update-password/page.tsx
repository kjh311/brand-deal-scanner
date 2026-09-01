'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ShieldCheck, Loader2, AlertCircle, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout } from '@/components/layout/AuthLayout'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true

    const initSession = async () => {
      const hash = typeof window !== 'undefined' ? window.location.hash : ''

      // 1. Check for explicit error parameters in URL hash
      if (hash.includes('error_description=')) {
        const hashParams = new URLSearchParams(hash.replace('#', '?'))
        const errorMsg = hashParams.get('error_description')
        if (errorMsg && isMounted) {
          setError(decodeURIComponent(errorMsg.replace(/\+/g, ' ')))
          setHasSession(false)
          setIsCheckingSession(false)
          return
        }
      }

      // 2. Explicitly handle implicit grant hash (#access_token=...&refresh_token=...)
      if (hash.includes('access_token=') && hash.includes('refresh_token=')) {
        const hashParams = new URLSearchParams(hash.replace('#', '?'))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (isMounted) {
            if (!setSessionError && data.session) {
              setHasSession(true)
              window.history.replaceState({}, document.title, window.location.pathname)
            } else {
              setError(setSessionError?.message || 'Failed to establish reset session.')
              setHasSession(false)
            }
            setIsCheckingSession(false)
            return
          }
        }
      }

      // 3. Fallback check for active session
      const { data: { session } } = await supabase.auth.getSession()
      if (isMounted) {
        setHasSession(!!session)
        setIsCheckingSession(false)
      }
    }

    initSession()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.')
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setIsSuccess(true)

      // Redirect after brief delay
      setTimeout(() => {
        router.push('/history')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while updating your password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md my-8">
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden text-[#1E1A5F]">
          {/* Background Glows */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D84C9F]/10 blur-3xl rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#7B2CBF]/10 blur-3xl rounded-full"></div>

          <div className="relative z-10 flex flex-col gap-6">
            {isCheckingSession ? (
              <div className="text-center py-8 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#D84C9F] animate-spin" />
                <p className="text-sm text-[#64748B]">Verifying password reset session...</p>
              </div>
            ) : !hasSession ? (
              <div className="text-center flex flex-col items-center py-2">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                  <AlertCircle size={30} />
                </div>
                <h2 className="font-headline text-2xl font-bold tracking-tight text-[#1E1A5F] mb-2">
                  Session Expired or Invalid
                </h2>
                <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
                  {error || 'Your password reset link is invalid or has expired. Please request a new password reset link to continue.'}
                </p>
                <Link
                  href="/forgot-password"
                  className="w-full flex items-center justify-center gap-2 bg-[#D84C9F] text-white font-bold py-3 rounded-xl hover:bg-[#c23b8c] transition-all active:scale-[0.98]"
                >
                  Request New Reset Link
                </Link>
              </div>
            ) : isSuccess ? (
              <div className="text-center flex flex-col items-center py-4">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <ShieldCheck size={36} />
                </div>
                <h2 className="font-headline text-2xl font-bold tracking-tight text-[#1E1A5F] mb-2">
                  Password Updated!
                </h2>
                <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
                  Your password has been successfully updated. Redirecting you to your account...
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#D84C9F]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Redirecting...</span>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#D84C9F]/10 text-[#D84C9F]">
                    <Lock size={24} />
                  </div>
                  <h1 className="font-headline text-2xl font-bold tracking-tight text-[#1E1A5F]">
                    Set New Password
                  </h1>
                  <p className="text-[#64748B] mt-2 text-sm">
                    Enter and confirm your new password below to secure your account.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-[#64748B] ml-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#1E1A5F] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#D84C9F]/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1E1A5F] transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="confirmPassword" className="text-xs font-mono uppercase tracking-wider text-[#64748B] ml-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#1E1A5F] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#D84C9F]/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1E1A5F] transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-rose-500 text-center bg-rose-50 border border-rose-200 rounded-lg py-2.5 px-3">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-2 w-full bg-[#D84C9F] hover:bg-[#c23b8c] text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Updating password...</span>
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
