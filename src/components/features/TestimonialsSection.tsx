'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function TestimonialsSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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
  }, [])

  const testimonials = [
    {
      text: '"This tool saved me from a perpetual usage rights trap. The AI spotted a clause my manager missed. Worth every penny."',
      author: 'Alex Rivers',
      role: 'Lifestyle Creator • 1.2M',
      color: 'bg-primary-container'
    },
    {
      text: '"The counter-offer builder is a game changer. I just sent the redlined PDF back to the brand and they accepted everything."',
      author: 'Jordan Tech',
      role: 'Tech Reviewer • 850K',
      color: 'bg-secondary-container'
    },
    {
      text: '"As a talent manager, I run every contract through this first. It\'s like having a paralegal on call 24/7."',
      author: 'Sarah Chen',
      role: 'Manager @ Aura Talent',
      color: 'bg-tertiary-container'
    }
  ]

  return (
    <section ref={containerRef} className="py-20 px-10 bg-transparent" id="testimonials">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-wider text-[#D84C9F] mb-4">SUCCESS STORIES</p>
          <h2 className="font-headline text-4xl text-white font-bold tracking-[-0.02em]">
            Trusted by the Creator Economy
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div key={idx} className="reveal-testimonial bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-8 flex flex-col text-[#1E1A5F]">
              <div className="flex gap-1 text-amber-400 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="material-symbols-outlined text-[18px]">star</span>
                ))}
              </div>
              <p className="text-lg text-[#1E1A5F] italic mb-8 font-serif leading-relaxed">{t.text}</p>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#221A7F] to-[#D84C9F] shrink-0"></div>
                <div>
                  <p className="text-base text-[#1E1A5F] font-bold">{t.author}</p>
                  <p className="text-[10px] text-[#64748B] uppercase tracking-wider">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
