'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import ReactMarkdown from 'react-markdown'

export default function TermsPage() {
  const [termsText, setTermsText] = useState('')
  const [publishedAt, setPublishedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('terms_versions')
      .select('terms_text, published_at')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTermsText(data.terms_text)
          setPublishedAt(data.published_at)
        }
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] text-white">
      <Navbar />
      <div className="flex-1 flex items-start justify-center pt-32 pb-20 px-6 md:px-10">
        <div className="max-w-2xl w-full bg-white border border-[#E2E8F0] rounded-[2.5rem] p-10 md:p-12 text-[#1E1A5F]">
          <h1 className="font-headline text-3xl font-bold tracking-tight mb-6">Terms of Service</h1>
          {publishedAt && (
            <p className="text-sm text-[#64748B] mb-8">
              Last updated: {new Date(publishedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-[#1E1A5F]">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="text-[#1E1A5F]">{children}</p>
                }}
              >
                {termsText}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
