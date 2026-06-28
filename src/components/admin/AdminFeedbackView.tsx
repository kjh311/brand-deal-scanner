'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, Check } from 'lucide-react'

interface FeedbackItem {
  id: string
  profile_id: string
  rating: number
  feedback_text: string | null
  dismissed: boolean
  created_at: string
  profiles?: {
    email: string | null
  } | null
}

interface AdminFeedbackViewProps {
  initialFeedback: FeedbackItem[]
}

export function AdminFeedbackView({ initialFeedback }: AdminFeedbackViewProps) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>(initialFeedback)
  const [dismissingId, setDismissingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-feedback')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'scan_feedback',
      }, async () => {
        const { data, error: fetchError } = await supabase
          .from('scan_feedback')
          .select('*, profiles(email)')
          .eq('dismissed', false)
          .order('created_at', { ascending: false })
        if (fetchError) {
          console.error('Failed to refresh feedback:', fetchError)
          setError(fetchError.message)
        } else {
          setFeedback(data || [])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleDismiss = async (id: string) => {
    setDismissingId(id)
    const supabase = createClient()
    const { error } = await supabase
      .from('scan_feedback')
      .update({ dismissed: true })
      .eq('id', id)

    if (error) {
      console.error('Dismiss failed:', error)
      setDismissingId(null)
      return
    }

    setFeedback(prev => prev.filter(item => item.id !== id))
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[2.5rem] p-10 md:p-12 text-[#1E1A5F]">
      <h2 className="font-headline text-2xl font-bold tracking-tight mb-6">
        User Feedback
      </h2>

      {error ? (
        <div className="text-center py-16">
          <p className="text-rose-500 font-medium mb-2">Failed to load feedback</p>
          <p className="text-sm text-[#64748B]">{error}</p>
        </div>
      ) : feedback.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <Star className="w-8 h-8 text-emerald-500 fill-emerald-500" />
          </div>
          <p className="font-headline text-xl font-bold text-[#1E1A5F] mb-1">No new unread feedback!</p>
          <p className="text-sm text-[#64748B]">All feedback has been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <div
              key={item.id}
              className={`bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 flex gap-6 items-start transition-all duration-300 ${
                dismissingId === item.id ? 'opacity-0 translate-x-4' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider bg-white px-2 py-1 rounded-lg border border-[#E2E8F0]">
                    {item.profile_id.slice(0, 8)}...
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= item.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-[#CBD5E1]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-sm font-bold text-[#1E1A5F]">
                    {item.profiles?.email || 'Anonymous Creator'}
                  </p>
                  {item.profiles?.email && (
                    <p className="text-xs text-[#64748B] font-mono select-all">
                      {item.profiles.email}
                    </p>
                  )}
                </div>
                {item.feedback_text && (
                  <p className="text-sm text-[#1E1A5F] leading-relaxed whitespace-pre-wrap">
                    {item.feedback_text}
                  </p>
                )}
                <p className="text-[10px] text-[#94A3B8] mt-3 font-mono uppercase tracking-wider">
                  {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => handleDismiss(item.id)}
                disabled={dismissingId === item.id}
                className="shrink-0 w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center hover:border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer disabled:opacity-50"
                title="Dismiss feedback"
              >
                <Check className="w-5 h-5 text-emerald-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
