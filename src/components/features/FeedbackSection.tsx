'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star } from 'lucide-react'

interface FeedbackSectionProps {
  contractId?: string | null
}

export function FeedbackSection({ contractId }: FeedbackSectionProps) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [usedOnHomepage, setUsedOnHomepage] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
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

      const { insertError } = await supabase
        .from('scan_feedback')
        .insert({
          profile_id: user.id,
          contract_id: contractId || null,
          rating,
          feedback_text: feedback.trim() || null,
          dismissed: false,
          used_on_homepage: usedOnHomepage,
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
  }, [rating, feedback, contractId, usedOnHomepage])

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
    <div className="bg-white border border-[#E2E8F0] rounded-[2.5rem] overflow-hidden text-[#1E1A5F]">
      <div
        className="w-full flex items-center justify-between p-5 sm:p-10 md:p-12 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="text-center flex-1">
          <h3 className="font-headline text-2xl font-bold tracking-tight mb-2">
            Rate this scan
          </h3>
          <div className="flex justify-center gap-1.5 sm:gap-3 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <div
                key={star}
                onClick={(e) => {
                  e.stopPropagation()
                  setRating(star)
                  setIsOpen(true)
                }}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="p-0.5 sm:p-1 transition-transform hover:scale-110 cursor-pointer"
              >
                <Star
                  className={`w-6 h-6 sm:w-8 sm:h-8 ${
                    star <= (hover || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-[#CBD5E1]'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? `${contentHeight + 100}px` : '0px', opacity: isOpen ? 1 : 0 }}
      >
        <div className="px-5 sm:px-10 md:px-12 pb-5 sm:pb-10 md:pb-12 space-y-8">
    <div className="space-y-3">
             <textarea
               value={feedback}
               onChange={(e) => setFeedback(e.target.value)}
               placeholder="Tell us how we can improve this scan or what caught your eye..."
               rows={4}
               className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 text-[#1E1A5F] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#D84C9F]/50 focus:bg-white transition-all resize-none text-sm sm:text-base"
             />
           </div>

           {rating === 5 && (
             <label className="flex items-start gap-2 cursor-pointer">
               <input
                 type="checkbox"
                 checked={usedOnHomepage}
                 onChange={(e) => setUsedOnHomepage(e.target.checked)}
                 className="mt-1 accent-[#D84C9F]"
               />
               <span className="text-sm text-[#64748B]">Can we use this testimonial on our homepage?</span>
             </label>
           )}

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
      </div>
    </div>
  )
}
