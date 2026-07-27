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
  const marqueeRef = useRef<HTMLDivElement>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

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
    const marquee = marqueeRef.current
    if (!marquee) return

    const containerWidth = marquee.parentElement?.clientWidth || 0
    const cardWidth = 350
    const gap = 24
    const visibleCards = Math.floor(containerWidth / (cardWidth + gap))

    if (testimonials.length <= visibleCards) {
      marquee.style.animation = 'none'
      return
    }

    const totalWidth = testimonials.length * (cardWidth + gap) * 2
    marquee.style.animation = `scroll ${totalWidth}ms linear infinite`
    marquee.style.animationPlayState = 'running'
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

        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#221A7F] via-[#7B2CBF] to-transparent z-10 pointer-events-none" />

          <div
            ref={marqueeRef}
            className="flex gap-6"
            style={{ willChange: 'transform' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.animationPlayState = 'paused' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.animationPlayState = 'running' }}
          >
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={`${t.id}-${i}`}
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
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}