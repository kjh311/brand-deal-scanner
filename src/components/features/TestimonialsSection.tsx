'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'

interface Testimonial {
  id: string
  user_name: string
  avatar_url: string | null
  rating: number
  comment: string | null
  created_at: string
}

export function TestimonialsSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  useEffect(() => {
    const fetchTestimonials = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch testimonials:', error)
      } else {
        setTestimonials(data || [])
      }
      setLoading(false)
    }

    fetchTestimonials()
  }, [])

  const updateButtons = () => {
    const container = containerRef.current
    if (!container) {
      setCanScrollPrev(false)
      setCanScrollNext(false)
      return
    }
    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollPrev(scrollLeft > 10)
    setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 10)
  }

  const scrollNext = () => {
    const container = containerRef.current
    if (!container) return
    container.scrollBy({ left: container.clientWidth, behavior: 'smooth' })
    setTimeout(updateButtons, 500)
  }

  const scrollPrev = () => {
    const container = containerRef.current
    if (!container) return
    container.scrollBy({ left: -container.clientWidth, behavior: 'smooth' })
    setTimeout(updateButtons, 500)
  }

  const startAutoAdvance = () => {
    stopAutoAdvance()
    autoAdvanceRef.current = setInterval(() => {
      const container = containerRef.current
      if (!container) return
      const { scrollLeft, scrollWidth, clientWidth } = container
      if (scrollLeft + clientWidth >= scrollWidth - 20) {
        container.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        scrollNext()
      }
    }, 5000)
  }

  const stopAutoAdvance = () => {
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }
  }

  useEffect(() => {
    updateButtons()
    if (testimonials.length > 3) {
      startAutoAdvance()
    }
    const handleResize = () => updateButtons()
    window.addEventListener('resize', handleResize)
    return () => {
      stopAutoAdvance()
      window.removeEventListener('resize', handleResize)
    }
  }, [testimonials])

  if (loading) return null
  if (testimonials.length === 0) return null

  return (
    <section className="py-16 sm:py-20 px-5 sm:px-10 bg-transparent" id="testimonials">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-wider text-white/80 mb-4">
            SUCCESS STORIES
          </p>
          <h2 className="font-headline text-3xl sm:text-4xl text-white font-bold tracking-[-0.02em]">
            Trusted by the Creator Economy
          </h2>
        </div>

        <div className="relative">
          {testimonials.length > 3 && (
            <>
              <button
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#221A7F]/80 border border-white/20 flex items-center justify-center text-white transition-all duration-200 ${
                  canScrollPrev
                    ? 'opacity-100 hover:bg-[#221A7F] cursor-pointer'
                    : 'opacity-40 cursor-not-allowed'
                }`}
                aria-label="Previous testimonials"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={scrollNext}
                disabled={!canScrollNext}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#221A7F]/80 border border-white/20 flex items-center justify-center text-white transition-all duration-200 ${
                  canScrollNext
                    ? 'opacity-100 hover:bg-[#221A7F] cursor-pointer'
                    : 'opacity-40 cursor-not-allowed'
                }`}
                aria-label="Next testimonials"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div
            ref={containerRef}
            className="flex gap-6 overflow-x-auto scroll-px-4 hide-scrollbar scroll-smooth scroll-snap-type-x"
            onMouseEnter={stopAutoAdvance}
            onMouseLeave={startAutoAdvance}
            onScroll={updateButtons}
          >
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="min-w-[280px] sm:min-w-[320px] flex-shrink-0 scroll-snap-start bg-[#1a1a3e]/80 border border-white/10 backdrop-blur-sm rounded-2xl p-6 flex flex-col text-white shadow-xl hover:bg-[#1a1a3e] transition-colors duration-300"
              >
                <div className="flex gap-1 text-amber-400 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-white/90 italic mb-6 font-serif leading-relaxed line-clamp-4">
                  {t.comment || 'No comment provided.'}
                </p>
                <div className="flex items-center gap-3 mt-auto">
                  {t.avatar_url ? (
                    <img
                      src={t.avatar_url}
                      alt={t.user_name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#221A7F] to-[#D84C9F] shrink-0 flex items-center justify-center text-white font-bold text-sm">
                      {(t.user_name || 'V')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-bold text-white/90">
                    {t.user_name || 'Verified Creator'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  )
}
