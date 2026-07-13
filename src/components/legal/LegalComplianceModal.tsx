'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ReactMarkdown from 'react-markdown'

type LegalVariant = 'initial' | 'updated'

interface LegalComplianceModalProps {
  isOpen: boolean
  variant: LegalVariant
  termsText: string
  privacyText: string
  onAccepted: () => void
}

export function LegalComplianceModal({ isOpen, variant, termsText, privacyText, onAccepted }: LegalComplianceModalProps) {
  const [agreed, setAgreed] = useState(false)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') e.preventDefault()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleAccept = async () => {
    if (!agreed || accepting) return
    setAccepting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          terms_accepted_at: new Date().toISOString(),
          privacy_accepted_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      onAccepted()
    } catch (err) {
      console.error('Failed to accept legal terms:', err)
      setAccepting(false)
    }
  }

  if (!isOpen) return null

  const title =
    variant === 'updated'
      ? "We've Updated Our Terms of Service"
      : 'Review and Accept Our Terms to Begin'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col text-[#1E1A5F]">
        <div className="p-8 pb-4 border-b border-[#E2E8F0]">
          <h2 className="font-headline text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm text-[#64748B] mt-2">
            Please review our updated legal documents before continuing.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-2">Terms of Service</h3>
            <div className="h-64 overflow-y-auto bg-white border border-[#E2E8F0] rounded-xl p-4">
              <div className="prose prose-sm max-w-none text-[#1E1A5F] leading-relaxed">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="text-[#1E1A5F]">{children}</p>
                  }}
                >
                  {termsText}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-2">Privacy Policy</h3>
            <div className="h-64 overflow-y-auto bg-white border border-[#E2E8F0] rounded-xl p-4">
              <div className="prose prose-sm max-w-none text-[#1E1A5F] leading-relaxed">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="text-[#1E1A5F]">{children}</p>
                  }}
                >
                  {privacyText}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 pt-4 border-t border-[#E2E8F0] space-y-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#CBD5E1] text-[#D84C9F] focus:ring-[#D84C9F]"
            />
            <span className="text-sm font-medium text-[#1E1A5F]">
              I agree to the Terms of Service and Privacy Policy
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!agreed || accepting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D84C9F] to-[#DE5298] text-white font-black text-sm uppercase tracking-[2px] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {accepting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Continue to Upload'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
