'use client'

import React, { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star } from 'lucide-react'

interface FeedbackSectionProps {
  contractId?: string | null
}

export function FeedbackSection({ contractId }: FeedbackSectionProps) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to submit feedback')
        setSubmitting(false)
        return
      }

      const { error: insertError } = await supabase
        .from('scan_feedback')
        .insert({
          profile_id: user.id,
          contract_id: contractId || null,
          rating,
          feedback_text: feedback.trim() || null,
          dismissed: false,
        })

      if (insertError) {
        throw insertError
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }, [rating, feedback, contractId])

  if (submitted) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-[2.5rem] p-5 sm:p-10 text-center text-[#1E1A5F]">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
          <Star className="w-8 h-8 text-emerald-500 fill-emerald-500" />
        </div>
        <h3 className="font-headline text-2xl font-bold mb-2">
          Thank you for your feedback!
        </h3>
        <p className="text-[#64748B]">
          Your input helps us improve the scanning experience.
        </p>
      </div>
    )
  }
 
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[2.5rem] p-5 sm:p-10 md:p-12 space-y-8 text-[#1E1A5F]">
      <div className="text-center">
        <h3 className="font-headline text-2xl font-bold tracking-tight mb-2">
          Rate this scan
        </h3>
      </div>
 
      <div className="flex justify-center gap-1.5 sm:gap-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 sm:p-1 transition-transform hover:scale-110 cursor-pointer"
          >
            <Star
              className={`w-8 h-8 sm:w-10 sm:h-10 ${
                star <= (hover || rating)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-[#CBD5E1]'
              }`}
            />
          </button>
        ))}
      </div>
 
      <div className="space-y-3">
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Tell us how we can improve this scan or what caught your eye..."
          rows={4}
          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 text-[#1E1A5F] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#D84C9F]/50 focus:bg-white transition-all resize-none text-sm sm:text-base"
        />
      </div>
 
      {error && (
        <p className="text-rose-500 text-sm text-center font-medium">
          {error}
        </p>
      )}
 
      <div className="flex justify-center w-full">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full sm:w-auto justify-center px-6 sm:px-10 py-4 rounded-2xl bg-gradient-to-r from-[#D84C9F] to-[#DE5298] text-white font-bold text-xs sm:text-sm uppercase tracking-[2px] sm:tracking-[3px] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md flex items-center gap-3"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            'Submit Feedback'
          )}
        </button>
      </div>
    </div>
  )
}
