'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, Check, ChevronDown, ChevronUp } from 'lucide-react'

interface FeedbackItem {
  id: string
  profile_id: string
  rating: number
  feedback_text: string | null
  dismissed: boolean
  created_at: string
  used_on_homepage: boolean
  added_to_homepage: boolean
  profiles?: {
    email: string | null
    user_name: string | null
    avatar_url: string | null
  } | null
}

interface AdminFeedbackViewProps {
  initialFeedback: FeedbackItem[]
}

export function AdminFeedbackView({ initialFeedback }: AdminFeedbackViewProps) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>(initialFeedback)
  const [dismissingId, setDismissingId] = useState<string | null>(null)
  const [addingHomepageId, setAddingHomepageId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    } else {
      setContentHeight(0)
    }
  }, [isOpen])

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
          .select('*, profiles(user_name, avatar_url)')
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

  const handleAddToHomepage = async (id: string) => {
    setAddingHomepageId(id)
    const supabase = createClient()

    const { data: feedbackItem, error: fetchError } = await supabase
      .from('scan_feedback')
      .select('*, profiles(user_name, avatar_url)')
      .eq('id', id)
      .single()

    if (fetchError && fetchError.message) {
      console.error('Failed to fetch feedback item:', fetchError.message)
      setAddingHomepageId(null)
      return
    }

    if (!feedbackItem) {
      console.error('Failed to fetch feedback item: no data returned')
      setAddingHomepageId(null)
      return
    }

    const profile = feedbackItem.profiles
    const user_name = profile?.user_name || profile?.email || 'Creator'
    const avatar_url = profile?.avatar_url || ''

    const { error: insertError } = await supabase
      .from('testimonials')
      .insert({
        scan_feedback_id: id,
        user_id: feedbackItem.profile_id,
        user_name,
        avatar_url,
        rating: feedbackItem.rating,
        comment: feedbackItem.feedback_text,
      })

    if (insertError) {
      console.error('Add to homepage failed:', insertError)
    } else {
      await supabase
        .from('scan_feedback')
        .update({ added_to_homepage: true })
        .eq('id', id)

      setFeedback(prev => prev.map(item =>
        item.id === id ? { ...item, added_to_homepage: true } : item
      ))
    }

    setAddingHomepageId(null)
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[2.5rem] overflow-hidden text-[#1E1A5F]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="font-headline text-2xl font-bold tracking-tight">
            User Feedback
          </span>
          {feedback.length > 0 && (
            <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-1 rounded-full">
              {feedback.length}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[#94A3B8]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#94A3B8]" />
        )}
      </button>

      {isOpen && (
        <div
          ref={contentRef}
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: isOpen ? `${contentHeight + 200}px` : '0px', opacity: isOpen ? 1 : 0 }}
        >
          <div className="px-6 md:px-8 pb-8 md:pb-12">
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
                    className={`bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 ${
                      dismissingId === item.id ? 'opacity-0 translate-x-4' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
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
                    <div>
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
                    <p className="text-[10px] text-[#94A3B8] font-mono uppercase tracking-wider">
                      {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                    </p>
                    <div className="flex items-center gap-2">
                      {item.used_on_homepage && !item.added_to_homepage && (
                        <button
                          onClick={() => handleAddToHomepage(item.id)}
                          disabled={addingHomepageId === item.id}
                          className="px-3 py-1 rounded-full bg-[#D84C9F]/10 border border-[#D84C9F]/30 text-[#D84C9F] text-xs font-bold hover:bg-[#D84C9F]/20 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {addingHomepageId === item.id ? 'Adding...' : 'Add to homepage'}
                        </button>
                      )}
                      {item.added_to_homepage && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          Added to Homepage
                        </span>
                      )}
                      <button
                        onClick={() => handleDismiss(item.id)}
                        disabled={dismissingId === item.id}
                        className="px-3 py-1 rounded-full bg-white border border-[#E2E8F0] text-[#64748B] text-xs font-bold hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-3 h-3 inline mr-1" />
                        {dismissingId === item.id ? 'Dismissing...' : 'Dismiss'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}