'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
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
    if (testimonials.length === 0 || loading) return

    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.from(".reveal-testimonial", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        },
        opacity: 0,
        y: 30,
        scale: 0.95,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out"
      })
    }, containerRef)

    return () => ctx.revert()
  }, [testimonials, loading])

  if (loading) {
    return null
  }

  if (testimonials.length === 0) {
    return null
  }

  return (
    <section ref={containerRef} className="py-16 sm:py-20 px-5 sm:px-10 bg-transparent" id="testimonials">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-wider text-white/80 mb-4">SUCCESS STORIES</p>
          <h2 className="font-headline text-3xl sm:text-4xl text-white font-bold tracking-[-0.02em]">
            Trusted by the Creator Economy
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.id} className="reveal-testimonial bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-8 flex flex-col text-[#1E1A5F]">
              <div className="flex gap-1 text-amber-400 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-[18px] h-[18px] fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-lg text-[#1E1A5F] italic mb-8 font-serif leading-relaxed">
                {t.comment || 'No comment provided.'}
              </p>
              <div className="flex items-center gap-4 mt-auto">
                {t.avatar_url ? (
                  <img
                    src={t.avatar_url}
                    alt={t.user_name}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#221A7F] to-[#D84C9F] shrink-0 flex items-center justify-center text-white font-bold text-lg">
                    {t.user_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-base text-[#1E1A5F] font-bold">{t.user_name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}