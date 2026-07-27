'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star } from 'lucide-react'

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
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [needsScroll, setNeedsScroll] = useState(false)

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

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const marquee = container.querySelector('[data-marquee]') as HTMLElement | null
    if (!marquee) return

    const containerWidth = container.clientWidth
    const totalWidth = marquee.scrollWidth

    setNeedsScroll(totalWidth > containerWidth)
  }, [testimonials])

  if (loading) {
    return null
  }

  if (testimonials.length === 0) {
    return null
  }

  return (
    <section className="py-16 sm:py-20 px-5 sm:px-10 bg-transparent" id="testimonials">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-wider text-white/80 mb-4">SUCCESS STORIES</p>
          <h2 className="font-headline text-3xl sm:text-4xl text-white font-bold tracking-[-0.02em]">
            Trusted by the Creator Economy
          </h2>
        </div>

        <div ref={containerRef} className="relative overflow-hidden">
          {needsScroll && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#221A7F] via-[#7B2CBF] to-transparent z-10 pointer-events-none" />
            </>
          )}

          <div
            data-marquee
            className="flex gap-6"
            style={{
              willChange: 'transform',
              animation: needsScroll ? 'marquee 40s linear infinite' : 'none',
            }}
          >
            {(needsScroll ? [...testimonials, ...testimonials] : testimonials).map((t, i) => (
              <div
                key={needsScroll ? `${t.id}-${i}` : t.id}
                className="min-w-[320px] max-w-[350px] flex-shrink-0 bg-[#1a1a3e]/80 border border-white/10 backdrop-blur-sm rounded-2xl p-6 flex flex-col text-white shadow-xl hover:bg-[#1a1a3e] transition-colors duration-300"
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
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        [data-marquee] {
          animation-play-state: running;
        }
        [data-marquee]:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}