'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { KeyRound, ArrowLeft, Loader2, MailCheck, AlertCircle } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'

function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const isLinkExpired = searchParams.get('error') === 'link_expired'

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send password reset email.')
        return
      }

      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center flex flex-col items-center py-2">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D84C9F]/10 text-[#D84C9F]">
          <MailCheck size={32} />
        </div>
        <h2 className="font-headline text-2xl font-bold tracking-tight text-[#1E1A5F] mb-2">
          Check your inbox
        </h2>
        <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
          We've sent a password reset link to{' '}
          <span className="font-semibold text-[#1E1A5F]">{email}</span>. Please click the link in the email to update your password.
        </p>
        <div className="w-full p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl mb-6 text-xs text-[#64748B] text-left">
          <p className="font-semibold text-[#1E1A5F] mb-1">Didn't receive the email?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check your spam or junk folder.</li>
            <li>Verify that you entered the correct email address.</li>
            <li>Wait a few minutes before trying again.</li>
          </ul>
        </div>
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 bg-[#D84C9F] text-white font-bold py-3 rounded-xl hover:bg-[#c23b8c] transition-all active:scale-[0.98]"
        >
          <ArrowLeft size={18} />
          Return to Log In
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#D84C9F]/10 text-[#D84C9F]">
          <KeyRound size={24} />
        </div>
        <h1 className="font-headline text-2xl font-bold tracking-tight text-[#1E1A5F]">
          Reset Your Password
        </h1>
        <p className="text-[#64748B] mt-2 text-sm">
          Enter the email address registered with your account and we'll send you a link to reset your password.
        </p>
      </div>

      {isLinkExpired && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>This reset link has expired or was already used. Please request a new link below.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-[#64748B] ml-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@creator.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#1E1A5F] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#D84C9F]/50 transition-all"
          />
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
              <span>Sending reset link...</span>
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-[#E2E8F0]">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#1E1A5F] transition-colors font-medium"
        >
          <ArrowLeft size={16} />
          Back to Log In
        </Link>
      </div>
    </>
  )
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <div className="w-full max-w-md my-8">
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden text-[#1E1A5F]">
          {/* Background Glows */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D84C9F]/10 blur-3xl rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#7B2CBF]/10 blur-3xl rounded-full"></div>

          <div className="relative z-10 flex flex-col gap-6">
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#D84C9F]" />
              </div>
            }>
              <ForgotPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
