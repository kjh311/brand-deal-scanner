'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react'
import { publishLegalVersion } from '@/app/actions/legal'

interface TermsVersion {
  id: string
  terms_text: string
  privacy_text: string
  published_at: string
}

interface AdminLegalManagerProps {
  initialVersion: TermsVersion | null
}

export function AdminLegalManager({ initialVersion }: AdminLegalManagerProps) {
  const [termsOpen, setTermsOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  const initialTerms = initialVersion?.terms_text ?? ''
  const initialPrivacy = initialVersion?.privacy_text ?? ''

  const [termsDraft, setTermsDraft] = useState(initialTerms)
  const [privacyDraft, setPrivacyDraft] = useState(initialPrivacy)

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePublish = async () => {
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      await publishLegalVersion(termsDraft, privacyDraft)

      setSuccess('Legal documents published successfully.')
      setTermsOpen(false)
      setPrivacyOpen(false)

      const supabase = createClient()
      const { data: latest } = await supabase
        .from('terms_versions')
        .select('terms_text, privacy_text, published_at')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latest) {
        setTermsDraft(latest.terms_text)
        setPrivacyDraft(latest.privacy_text)
      }
    } catch (err) {
      console.error('Failed to publish legal documents:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong while publishing.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[2.5rem] p-10 md:p-12 text-[#1E1A5F]">
      <h2 className="font-headline text-2xl font-bold tracking-tight mb-6">
        Legal Document Management
      </h2>
      <p className="text-sm text-[#64748B] mb-8">
        Update the Terms of Service and Privacy Policy. Changes will be versioned and immediately take effect for all users.
      </p>

      {success && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200">
          <p className="text-sm font-medium text-rose-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden">
          <button
            onClick={() => setTermsOpen(!termsOpen)}
            className="w-full flex items-center justify-between p-6 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-[#1E1A5F]">Update Terms of Service</span>
            </div>
            {termsOpen ? (
              <ChevronUp className="w-5 h-5 text-[#64748B]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#64748B]" />
            )}
          </button>
 
          {termsOpen && (
            <div className="px-6 pb-6 animate-in fade-in zoom-in-95 duration-200">
              <textarea
                value={termsDraft}
                onChange={(e) => setTermsDraft(e.target.value)}
                placeholder="Enter Terms of Service text here..."
                className="w-full h-64 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 font-mono text-sm text-[#1E1A5F] focus:outline-none focus:border-[#D84C9F]/50 focus:bg-white transition-all resize-y shadow-inner"
              />
            </div>
          )}
        </div>
 
        <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden">
          <button
            onClick={() => setPrivacyOpen(!privacyOpen)}
            className="w-full flex items-center justify-between p-6 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-[#1E1A5F]">Update Privacy Policy</span>
            </div>
            {privacyOpen ? (
              <ChevronUp className="w-5 h-5 text-[#64748B]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#64748B]" />
            )}
          </button>

          {privacyOpen && (
            <div className="px-6 pb-6 animate-in fade-in zoom-in-95 duration-200">
              <textarea
                value={privacyDraft}
                onChange={(e) => setPrivacyDraft(e.target.value)}
                placeholder="Enter Privacy Policy text here..."
                className="w-full h-64 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 font-mono text-sm text-[#1E1A5F] focus:outline-none focus:border-[#D84C9F]/50 focus:bg-white transition-all resize-y shadow-inner"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
        <button
          onClick={handlePublish}
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D84C9F] to-[#DE5298] text-white font-black text-sm uppercase tracking-[2px] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Publishing...
            </>
          ) : (
            'Publish New Version'
          )}
        </button>
      </div>
    </div>
  )
}